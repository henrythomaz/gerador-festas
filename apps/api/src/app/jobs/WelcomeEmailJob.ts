/**
 * @file WelcomeEmailJob.ts
 * @description Job para envio de email de boas-vindas.
 * Envia um email de boas-vindas para novos usuários cadastrados.
 */

import Mail from "../../lib/Mail.js";

/**
 * Interface para os dados necessários para o job de boas-vindas.
 * @interface WelcomeEmailData
 */
interface WelcomeEmailData {
  /** Nome completo do usuário */
  nome: string;
  /** Email do usuário */
  email: string;
}

/**
 * Classe do job de email de boas-vindas.
 * @class WelcomeEmailJob
 * @description Responsável por enviar um email de boas-vindas
 * para novos usuários após o cadastro.
 * 
 * @example
 * // Adicionando o job à fila
 * await Queue.add(WelcomeEmailJob.key, {
 *   nome: "Henry Campos",
 *   email: "henry@email.com"
 * });
 */
class WelcomeEmailJob {
  /**
   * Chave única do job para identificação na fila.
   * @getter key
   * @returns {string} Identificador do job
   * @description Usado para referenciar este job ao adicionar à fila.
   */
  get key(): string {
    return "WelcomeEmailJob";
  }

  /**
   * Executa o job de boas-vindas.
   * @method handle
   * @async
   * @param {Object} params - Parâmetros do job
   * @param {WelcomeEmailData} params.data - Dados para envio do email
   * @returns {Promise<void>}
   * @description Envia um email de boas-vindas com informações iniciais
   * sobre o sistema e como começar a usar.
   * 
   * @example
   * // Processamento do job
   * await job.handle({ data: { nome, email } });
   */
  async handle({ data }: { data: WelcomeEmailData }): Promise<void> {
    const { nome, email } = data;

    /**
     * Envia o email de boas-vindas.
     * Inclui versão HTML e texto para compatibilidade.
     */
    await Mail.send({
      to: email,
      subject: `Bem-vindo(a) ao Gerenciador de Festas! - ${email}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #16a34a;">Olá ${nome}!</h1>
          <p>Bem-vindo(a) ao sistema de Geração de Festas. Estamos felizes em tê-lo(a) conosco.</p>
          <p>Explore nossas funcionalidades e comece a organizar seus atendimentos.</p>
          <hr style="margin: 24px 0; border-color: #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">Equipe do Gerenciador de Festas</p>
        </div>
      `,
      text: `Olá ${nome}. Bem-vindo(a) ao sistema de Geração de Festas!`,
    });
  }
}

/**
 * Exporta instância única do job de boas-vindas.
 * @default
 */
export default new WelcomeEmailJob();
