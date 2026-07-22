/**
 * @file SessionsController.ts
 * @description Controlador responsável pela autenticação de usuários.
 * Gerencia o login, verificação de email e geração de tokens JWT.
 *
 * @note A API utiliza nomes em português (email, senha, nome, etc.)
 * O modelo User faz o mapeamento para os nomes em inglês no banco.
 */

import User from "../models/User.js";
import GoogleToken from '../models/GoogleToken.js';

import jwt, { SignOptions } from "jsonwebtoken";
import { Request, Response } from "express";
import auth from "../../config/auth.js";

import Queue from "../../lib/Queue.js";
import WelcomeToBackJob from "../jobs/WelcomeToBackJob.js";
import WelcomeEmailJob from "../jobs/WelcomeEmailJob.js";

/**
 * Classe controladora de sessões/autenticação.
 * @class SessionsController
 * @description Gerencia o processo de login, verificação de credenciais e geração de tokens.
 */
class SessionsController {
  /**
   * Cria uma nova sessão (login do usuário).
   * @method create
   * @async
   * @description Autentica o usuário, verifica credenciais e email confirmado,
   * e retorna um token JWT para acesso às rotas protegidas.
   * @param {Request} req - Objeto de requisição Express
   * @param {Response} res - Objeto de resposta Express
   * @returns {Promise<Response>} Resposta JSON com dados do usuário e token JWT
   *
   * @example
   * // Request body (português)
   * {
   *   "email": "usuario@email.com",
   *   "senha": "123456"
   * }
   *
   * // Response (português)
   * {
   *   "user": {
   *     "id": 1,
   *     "nome": "Usuário",
   *     "email": "usuario@email.com"
   *   },
   *   "token": "eyJhbGciOiJIUzI1NiIs..."
   * }
   */
  async create(req: Request, res: Response) {
    const { email, senha } = req.body;

    const usuario = await User.findOne({ where: { email } });
    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }

    if (!(await usuario.checkPassword(senha))) {
      return res.status(401).json({ erro: "Senha incorreta." });
    }

    // 🔹 Mensagem específica para e-mail não confirmado
    if (!usuario.email_confirmado) {
      return res.status(401).json({
        erro: "Confirme o seu e-mail antes. (Verifique sua caixa de spam)",
      });
    }

    const { id, nome, email: userEmail } = usuario;

    // 🔹 Verifica se é o primeiro acesso (ultimo_login == null)
    if (!usuario.ultimo_login) {
      // Envia o e-mail de boas-vindas no primeiro login (após confirmação)
      await Queue.add(WelcomeEmailJob.key, { nome, email: userEmail });
    } else {
      // Se não for primeiro acesso, verifica se passaram mais de 7 dias
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
      if (new Date(usuario.ultimo_login) < seteDiasAtras) {
        await Queue.add(WelcomeToBackJob.key, { nome, email: userEmail });
      }
    }

    // Atualiza último login
    await usuario.update({ ultimo_login: new Date() });

    const token = jwt.sign({ id }, auth.secret, {
      expiresIn: auth.expiresIn,
    } as SignOptions);

    // let hasNewerBackup = false;
    // let backupDate = null;
    // const googleToken = await GoogleToken.findOne({ where: { user_id: id } });
    // if (googleToken) {
    //   // ... lógica para verificar backup (similar ao checkBackup)
    //   // Se houver backup mais recente, marcar hasNewerBackup = true
    // }
    return res.json({
      user: { id, nome, email: userEmail },
      token,
    });
  }
}

/**
 * Exporta instância única do controlador.
 * @default
 */
export default new SessionsController();
