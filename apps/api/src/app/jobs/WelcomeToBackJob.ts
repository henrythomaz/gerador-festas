/**
 * @file WelcomeToBackJob.ts
 * @description Job para envio de email de boas-vindas de volta.
 * Envia um email de "bem-vindo de volta" para usuários que não acessam
 * a plataforma há mais de 7 dias.
 */

import Mail from "../../lib/Mail.js";

/**
 * Interface para os dados necessários para o job de boas-vindas de volta.
 * @interface WelcomeToBackData
 */
interface WelcomeToBackData {
  /** Nome completo do usuário */
  nome: string;
  /** Email do usuário */
  email: string;
}

/**
 * Classe do job de boas-vindas de volta.
 * @class WelcomeToBackJob
 * @description Responsável por enviar um email de "bem-vindo de volta"
 * para usuários inativos que retornam à plataforma após 7+ dias.
 * 
 * @example
 * // Adicionando o job à fila
 * await Queue.add(WelcomeToBackJob.key, {
 *   nome: "Henry Campos",
 *   email: "henry@email.com"
 * });
 * 
 * // Este job é acionado automaticamente no login
 * // quando o usuário não acessa há mais de 7 dias
 */
class WelcomeToBackJob {
  /**
   * Chave única do job para identificação na fila.
   * @getter key
   * @returns {string} Identificador do job
   * @description Usado para referenciar este job ao adicionar à fila.
   */
  get key(): string {
    return "WelcomeToBackJob";
  }

  /**
   * Executa o job de boas-vindas de volta.
   * @method handle
   * @async
   * @param {Object} params - Parâmetros do job
   * @param {WelcomeToBackData} params.data - Dados para envio do email
   * @returns {Promise<void>}
   * @description Envia um email caloroso de boas-vindas para usuários
   * que retornam após um período de inatividade.
   * 
   * @example
   * // Processamento do job
   * await job.handle({ data: { nome, email } });
   */
  async handle({ data }: { data: WelcomeToBackData }): Promise<void> {
    const { nome, email } = data;

    /**
     * Envia o email de boas-vindas de volta.
     * Inclui versão HTML e texto para compatibilidade.
     */
    await Mail.send({
      to: email,
      subject: `Bem-vindo(a) de volta! - ${email}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #16a34a;">Olá ${nome}!</h1>
          <p>Bem-vindo(a) de volta ao sistema Gerenciador de Festas. Que bom revê-lo(a)!</p>
          <p>Acesse sua conta e continue de onde parou.</p>
          <hr style="margin: 24px 0; border-color: #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">Equipe do Gerenciador de Festas</p>
        </div>
      `,
      text: `Olá ${nome}. Bem-vindo(a) de volta ao sistema de Gerenciamento de Festas!`,
    });
  }
}

/**
 * Exporta instância única do job de boas-vindas de volta.
 * @default
 */
export default new WelcomeToBackJob();
