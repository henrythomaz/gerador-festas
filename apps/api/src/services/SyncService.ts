import BackupService from "./BackupService.js";
import GoogleDriveService from "../google/GoogleDriveService.js";
import GoogleOAuthService from "../google/GoogleOAuthService.js";
import GoogleToken from "../app/models/GoogleToken.js";
import { Op } from "sequelize";
import path from "path";
import fs from "fs-extra";

class SyncService {
  async syncUser(userId: number): Promise<void> {
    // Buscar tokens
    const token = await GoogleToken.findOne({ where: { user_id: userId } });
    if (!token) throw new Error("Usuário não conectado ao Google Drive");

    // Refresh token se necessário
    let accessToken = token.access_token;
    let expiryDate = new Date(token.expiry_date);
    if (expiryDate <= new Date()) {
      const refreshed = await GoogleOAuthService.refreshAccessToken(
        token.refresh_token
      );
      accessToken = refreshed.access_token;
      token.access_token = accessToken;
      token.expiry_date = new Date(refreshed.expiry_date);
      await token.save();
    }

    const driveService = new GoogleDriveService(accessToken);

    // 1. Garantir pastas
    const appFolderId = await driveService.ensureAppFolder();
    const userFolderId = await driveService.ensureUserFolder(
      userId,
      appFolderId
    );
    const backupsFolderId =
      await driveService.ensureBackupsFolder(userFolderId);

    // 2. Exportar backup
    const backupPath = await BackupService.exportUserBackup(userId);

    // 3. Upload para backup.db (substituir)
    await driveService.uploadFile(backupPath, "backup.db", userFolderId, true);

    // 4. Upload para backups/ com data
    const dateStr = new Date().toISOString().split("T")[0];
    const backupFileName = `backup-${dateStr}.db`;
    await driveService.uploadFile(
      backupPath,
      backupFileName,
      backupsFolderId,
      false
    );

    // 5. Limpar backups antigos (opcional, pode ser feito em job separado)
    await this.cleanupOldBackups(driveService, backupsFolderId);

    // 6. Atualizar last_sync_at
    token.last_sync_at = new Date();
    await token.save();

    // 7. Remover arquivo temporário
    await fs.remove(backupPath);
  }

  async restoreUser(userId: number): Promise<void> {
    const token = await GoogleToken.findOne({ where: { user_id: userId } });
    if (!token) throw new Error("Usuário não conectado ao Google Drive");

    let accessToken = token.access_token;
    let expiryDate = new Date(token.expiry_date);
    if (expiryDate <= new Date()) {
      const refreshed = await GoogleOAuthService.refreshAccessToken(
        token.refresh_token
      );
      accessToken = refreshed.access_token;
      token.access_token = accessToken;
      token.expiry_date = new Date(refreshed.expiry_date);
      await token.save();
    }

    const driveService = new GoogleDriveService(accessToken);
    const appFolderId = await driveService.ensureAppFolder();
    const userFolderId = await driveService.ensureUserFolder(
      userId,
      appFolderId
    );
    const backupsFolderId =
      await driveService.ensureBackupsFolder(userFolderId);

    // Buscar o backup mais recente
    const latest = await driveService.getLatestBackup(
      userFolderId,
      backupsFolderId
    );
    if (!latest) throw new Error("Nenhum backup encontrado");

    // Baixar
    const tmpDir = path.join(process.cwd(), "tmp", "backups");
    await fs.ensureDir(tmpDir);
    const downloadPath = path.join(
      tmpDir,
      `restore-${userId}-${Date.now()}.db`
    );
    await driveService.downloadFile(latest.id, downloadPath);

    // Importar
    await BackupService.importUserBackup(userId, downloadPath);

    // Atualizar last_backup_at
    token.last_backup_at = new Date();
    await token.save();

    // Remover arquivo
    await fs.remove(downloadPath);
  }

  private async cleanupOldBackups(
    driveService: GoogleDriveService,
    folderId: string,
    limit: number = 10
  ): Promise<void> {
    const files = await driveService.listFiles(folderId, 100);
    if (files.length <= limit) return;
    // Ordenar por data mais antiga
    files.sort(
      (a, b) =>
        new Date(a.createdTime).getTime() - new Date(b.createdTime).getTime()
    );
    const toDelete = files.slice(0, files.length - limit);
    for (const file of toDelete) {
      await driveService.deleteFile(file.id);
    }
  }
}

export default new SyncService();
