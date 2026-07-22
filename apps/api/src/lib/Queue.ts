/**
 * @file Queue.ts
 * @description Sistema de filas para processamento assíncrono de jobs.
 * Utiliza Bee-Queue com Redis para gerenciar tarefas em background.
 */

import Bee from "bee-queue";
import redisConfig from "../config/redis.js";
import "dotenv/config";

// Importação dos jobs
import WelcomeEmailJob from "../app/jobs/WelcomeEmailJob.js";
import ResetPasswordJob from "../app/jobs/ResetPasswordJob.js";
import WelcomeToBackJob from "../app/jobs/WelcomeToBackJob.js";
import ConfirmEmailJob from "../app/jobs/ConfirmEmailJob.js";
import ExpirationNotificationJob from "../app/jobs/ExpirationNotificationJob.js";
import SyncGoogleDriveJob from "../app/jobs/SyncGoogleDriveJob.js";
import RestoreBackupJob from "../app/jobs/RestoreBackupJob.js";

import type { Job } from "bee-queue";

/**
 * Lista de todos os jobs disponíveis na aplicação.
 * @constant jobs
 * @type {Array<Object>}
 * @description Cada job deve ter os métodos key() e handle().
 * Jobs comentados estão temporariamente desativados.
 */
const jobs = [
  WelcomeEmailJob,
  WelcomeToBackJob,
  ResetPasswordJob,
  ConfirmEmailJob,
  ExpirationNotificationJob,
  SyncGoogleDriveJob,
  RestoreBackupJob,
];

/**
 * Classe de gerenciamento de filas.
 * @class Queue
 * @description Gerencia todas as filas da aplicação, inicializando
 * o Bee-Queue para cada job e fornecendo métodos para adicionar
 * tarefas e processar filas.
 *
 * @example
 * // Adicionar job à fila
 * await Queue.add(WelcomeEmailJob.key, {
 *   nome: "Henry",
 *   email: "henry@email.com"
 * });
 *
 * @example
 * // Iniciar processamento
 * Queue.processQueue();
 */
class Queue {
  /** Armazena todas as filas configuradas */
  private queues: {
    [key: string]: { bee: Bee; handle: (job: Job<any>) => Promise<any> };
  };

  /**
   * Construtor da classe Queue.
   * @constructor
   * @description Inicializa todas as filas configuradas.
   * Cada job recebe sua própria fila com conexão Redis.
   */
  constructor() {
    this.queues = {};
    this.init();
  }

  /**
   * Inicializa as filas.
   * @method init
   * @description Para cada job, cria uma nova fila Bee-Queue
   * e armazena com sua função handle para processamento.
   */
  init() {
    jobs.forEach(({ key, handle }) => {
      this.queues[key] = {
        bee: new Bee(key, {
          redis: redisConfig,
        }),
        handle,
      };
    });
  }

  /**
   * Adiciona um job à fila.
   * @method add
   * @param {string} queue - Nome/chave da fila
   * @param {Object} job - Dados do job a ser processado
   * @returns {Promise<Object>} Job criado
   * @description Adiciona uma nova tarefa à fila especificada.
   * O job será processado quando a fila for executada.
   *
   * @example
   * // Adicionar job de confirmação de email
   * await Queue.add(ConfirmEmailJob.key, {
   *   nome: "João",
   *   email: "joao@email.com",
   *   token: "abc123"
   * });
   */
  // @ts-ignore
  add(queue: string, job: any, options?: { delay?: number }) {
    // @ts-ignore
    const jobInstance = this.queues[queue].bee.createJob(job);
    // @ts-ignore
    if (options?.delay) {
      (jobInstance as any).delay(options.delay);
    }
    // @ts-ignore
    return jobInstance.save();
  }

  /**
   * Inicia o processamento de todas as filas.
   * @method processQueue
   * @description Configura o processador para cada fila
   * e escuta eventos de falha para logging.
   *
   * @example
   * // Iniciar worker
   * Queue.processQueue();
   * console.log("Worker iniciado");
   */
  processQueue() {
    jobs.forEach((job) => {
      const { bee, handle } = this.queues[job.key];

      bee.on("failed", this.handleFailure).process(handle);
    });
  }

  /**
   * Manipula falhas no processamento de jobs.
   * @method handleFailure
   * @param {any} job - Job que falhou
   * @param {Error} err - Erro ocorrido
   * @description Em ambiente de desenvolvimento, loga o erro no console.
   * Em produção, pode ser integrado com sistema de monitoramento.
   *
   * @example
   * // Exemplo de log de erro
   * // Queue WelcomeEmailJob: FAILED Error: Email não enviado
   */
  handleFailure(job: any, err: Error) {
    if (process.env.NODE_ENV === "development") {
      console.error(`Queue ${job.queue.name}: FAILED`, err);
    }
  }
}

/**
 * Exporta instância única do sistema de filas.
 * @default
 */
export default new Queue();
