/**
 * @file Mail.ts
 * @description Serviço de envio de emails usando Nodemailer com Gmail.
 */

import nodemailer from "nodemailer";
import mailConfig from "../config/mail.js";

/**
 * Classe de serviço de email.
 * @class Mail
 * @description Gerencia o envio de emails utilizando Nodemailer + Gmail.
 *
 * @example
 * await Mail.send({
 *   to: "usuario@email.com",
 *   subject: "Bem-vindo!",
 *   html: "<h1>Olá</h1>",
 *   text: "Olá"
 * });
 */
class Mail {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Cria o transporter com as credenciais do Gmail
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  /**
   * Envia um email.
   * @param params.to - Destinatário
   * @param params.subject - Assunto
   * @param params.html - Corpo HTML
   * @param params.text - Corpo texto (opcional)
   * @returns Informações do envio (messageId, etc.)
   */
  async send({
    to,
    subject,
    html,
    text,
  }: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }) {
    const mailOptions = {
      from: mailConfig.from,
      to,
      subject,
      html,
      text,
    };

    const info = await this.transporter.sendMail(mailOptions);
    console.log("E-mail enviado:", info.messageId);
    return info;
  }
}

export default new Mail();
