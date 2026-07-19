/**
 * @file ConfirmEmailJob.ts
 * @description Job para envio de email de confirmação de conta.
 * Envia um link com token para o usuário confirmar seu endereço de email.
 */

import Mail from "../../lib/Mail.js";
import "dotenv/config";
import { emailTemplate } from "../../lib/emailTemplate.js";

/**
 * Interface para os dados necessários para o job de confirmação de email.
 * @interface ConfirmarEmailData
 */
interface ConfirmarEmailData {
  /** Nome completo do usuário */
  nome: string;
  /** Email do usuário */
  email: string;
  /** Token único para confirmação de email */
  token: string;
}

/**
 * Classe do job de confirmação de email.
 * @class ConfirmEmailJob
 * @description Responsável por enviar um email com link de confirmação
 * para o usuário recém-cadastrado.
 *
 * @example
 * // Adicionando o job à fila
 * await Queue.add(ConfirmEmailJob.key, {
 *   nome: "Henry Campos",
 *   email: "henry@email.com",
 *   token: "abc123..."
 * });
 */
class ConfirmEmailJob {
  /**
   * Chave única do job para identificação na fila.
   * @getter key
   * @returns {string} Identificador do job
   * @description Usado para referenciar este job ao adicionar à fila.
   */
  get key(): string {
    return "ConfirmEmailJob";
  }

  /**
   * Executa o job de confirmação de email.
   * @method handle
   * @async
   * @param {Object} params - Parâmetros do job
   * @param {ConfirmarEmailData} params.data - Dados para envio do email
   * @returns {Promise<void>}
   * @description Envia um email com link de confirmação contendo o token
   * para o usuário ativar sua conta.
   *
   * @example
   * // Processamento do job
   * await job.handle({ data: { nome, email, token } });
   */
  async handle({ data }: { data: ConfirmarEmailData }): Promise<void> {
    const { nome, email, token } = data;

    /**
     * URL de confirmação com token.
     * @type {string}
     */
    const link = `${process.env.FRONT_URL}/confirmar-email?token=${token}`;

    /**
     * Envia o email de confirmação.
     */
    await Mail.send({
      to: email,
      subject: "Confirme seu e-mail",
      headers: {
        "ngrok-skip-browser-warning": "3000",
      },
      html: emailTemplate({
        title: `Olá ${nome}!`,
        subtitle: "Falta apenas um passo.",
        content: `
          Clique no botão abaixo para confirmar seu endereço de e-mail.

          <br><br>

          Caso o botão não funcione:

          <br><br>

          <div style="
          background:#F1F5F9;
          padding:15px;
          border-radius:10px;
          word-break:break-all;
          ">
            ${link}
          </div>
        `,
        buttonText: "Confirmar e-mail",
        buttonLink: link,
      }),
    });
  }
}

/**
 * Exporta instância única do job de confirmação de email.
 * @default
 */
export default new ConfirmEmailJob();
