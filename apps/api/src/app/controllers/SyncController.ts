import { Request, Response } from "express";
import GoogleOAuthService from "../../google/GoogleOAuthService.js";
import GoogleToken from "../models/GoogleToken.js";
import User from "../models/User.js";
import Queue from "../../lib/Queue.js";
import SyncGoogleDriveJob from "../jobs/SyncGoogleDriveJob.js";
import RestoreBackupJob from "../jobs/RestoreBackupJob.js";
import SyncService from "../../services/SyncService.js";
import redis from "../../lib/redis.js";
import Mail from "../../lib/Mail.js";
import { emailTemplate } from "../../lib/emailTemplate.js";
import GoogleDriveService from "../../google/GoogleDriveService.js";

class SyncController {
  async connect(req: Request, res: Response) {
    const userId = req.userId!;
    // Gerar URL com state contendo userId e timestamp
    const state = Buffer.from(
      JSON.stringify({ userId, timestamp: Date.now() })
    ).toString("base64");
    const url = GoogleOAuthService.getAuthUrl(state);
    // Podemos redirecionar ou retornar URL
    // Como o frontend pode querer abrir uma janela, retornamos a URL
    return res.json({ url });
  }

  async callback(req: Request, res: Response) {
  const { code, state } = req.query;
  if (!code || !state) {
    return res.status(400).json({ erro: 'Missing code or state' });
  }

  let stateData;
  try {
    stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
  } catch {
    return res.status(400).json({ erro: 'Invalid state' });
  }
  const userId = stateData.userId;

  // Lock para evitar duplicidade
  const lockKey = `google_callback:${state}`;
  const locked = await redis.set(lockKey, '1', { NX: true, EX: 60 });
  if (!locked) {
    return res.status(409).json({ erro: 'Requisição já em processamento' });
  }

  try {
    // Trocar código por tokens
    const tokens = await GoogleOAuthService.getTokens(code as string);
    const expiryDate = new Date(tokens.expiry_date);

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    // Salvar ou atualizar tokens com findOrCreate
    const [googleToken, created] = await GoogleToken.findOrCreate({
      where: { user_id: userId },
      defaults: {
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: expiryDate,
        connected_at: new Date(),
        updated_at: new Date(),
        sync_enabled: true,
      },
    });

    if (!created) {
      await googleToken.update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: expiryDate,
        updated_at: new Date(),
      });
    }

    // (Opcional) Buscar e salvar email/id do Google
    // const userInfo = await GoogleOAuthService.getUserInfo(tokens.access_token);
    // googleToken.google_user_id = userInfo.id;
    // googleToken.google_email = userInfo.email;
    // await googleToken.save();

    // Enviar email de notificação (apenas se criado? ou sempre)
    // ... (seu código de envio de email)

    // Remover lock (opcional)
    await redis.del(lockKey);

    return res.redirect(`${process.env.APP_URL}/?sync=connected`);
  } catch (error) {
    console.error('Erro no callback:', error);
    await redis.del(lockKey); // limpa lock em caso de erro
    return res.status(500).json({ erro: 'Falha ao processar autorização' });
  }
}

  async sync(req: Request, res: Response) {
    const userId = req.userId!;
    // Verificar se já existe lock
    const lockKey = `sync:lock:${userId}`;
    const locked = await redis.exists(lockKey);
    if (locked) {
      return res.status(409).json({ erro: "Sincronização já em andamento" });
    }
    // Adicionar job
    await Queue.add(SyncGoogleDriveJob.key, { userId });
    return res
      .status(202)
      .json({ mensagem: "Sincronização adicionada à fila" });
  }

  async restore(req: Request, res: Response) {
    const userId = req.userId!;
    const { force } = req.body;
    // Verificar lock de restauração
    const lockKey = `restore:lock:${userId}`;
    const locked = await redis.exists(lockKey);
    if (locked) {
      return res.status(409).json({ erro: "Restauração já em andamento" });
    }
    await Queue.add(RestoreBackupJob.key, { userId, force: force || false });
    return res.status(202).json({ mensagem: "Restauração adicionada à fila" });
  }

  async status(req: Request, res: Response) {
    const userId = req.userId!;
    const token = await GoogleToken.findOne({ where: { user_id: userId } });
    if (!token) {
      return res.json({
        enabled: false,
        connected: false,
        lastSync: null,
        lastBackup: null,
        syncInProgress: false,
        mode: "automatic",
      });
    }
    // Verificar locks
    const syncLock = await redis.exists(`sync:lock:${userId}`);
    const restoreLock = await redis.exists(`restore:lock:${userId}`);
    const inProgress = syncLock || restoreLock;

    return res.json({
      enabled: token.sync_enabled,
      connected: true,
      lastSync: token.last_sync_at,
      lastBackup: token.last_backup_at,
      syncInProgress: inProgress,
      mode: "automatic",
    });
  }

  async disconnect(req: Request, res: Response) {
    const userId = req.userId!;
    const token = await GoogleToken.findOne({ where: { user_id: userId } });
    if (!token) {
      return res.status(404).json({ erro: "Conta não conectada" });
    }
    // Revogar token no Google
    try {
      await GoogleOAuthService.revokeToken(token.access_token);
    } catch (err) {
      console.error("Erro ao revogar token:", err);
    }
    // Remover do banco
    await token.destroy();
    return res.json({ mensagem: "Conta desconectada" });
  }

  async checkBackup(req: Request, res: Response) {
    const userId = req.userId!;
    const token = await GoogleToken.findOne({ where: { user_id: userId } });
    if (!token) {
      return res.json({ hasNewerBackup: false, backupDate: null });
    }
    // Refresh se necessário
    let accessToken = token.access_token;
    let expiryDate = new Date(token.expiry_date);
    if (expiryDate <= new Date()) {
      const refreshed = await GoogleOAuthService.refreshAccessToken(
        token.refresh_token
      );
      accessToken = refreshed.access_token;
      // Não salvamos aqui para não atualizar o token desnecessariamente, mas podemos.
    }
    const driveService = new GoogleDriveService(accessToken);
    const appFolderId = await driveService.ensureAppFolder();
    const userFolderId = await driveService.ensureUserFolder(
      userId,
      appFolderId
    );
    const backupsFolderId =
      await driveService.ensureBackupsFolder(userFolderId);
    const latest = await driveService.getLatestBackup(
      userFolderId,
      backupsFolderId
    );
    if (!latest) {
      return res.json({ hasNewerBackup: false, backupDate: null });
    }
    // Comparar com last_sync_at
    const lastSync = token.last_sync_at;
    const backupModified = new Date(latest.modifiedTime);
    const hasNewer = !lastSync || backupModified > lastSync;
    return res.json({
      hasNewerBackup: hasNewer,
      backupDate: latest.modifiedTime,
    });
  }

  async revokeAccess(req: Request, res: Response) {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ erro: "userId ausente" });

    const token = await GoogleToken.findOne({
      where: { user_id: Number(userId) },
    });
    if (!token) return res.status(404).json({ erro: "Token não encontrado" });

    try {
      await GoogleOAuthService.revokeToken(token.access_token);
    } catch (err) {
      console.error("Erro ao revogar token:", err);
    }
    await token.destroy();
    return res.json({ mensagem: "Acesso revogado com sucesso" });
  }
}

export default new SyncController();
