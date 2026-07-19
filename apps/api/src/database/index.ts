/**
 * @file database/index.ts
 * @description Configuração e inicialização do banco de dados.
 * Gerencia a conexão com o banco e a inicialização dos modelos Sequelize.
 */

import { Sequelize } from "sequelize";

import config from "../config/database.js";

import User from "../app/models/User.js";
import Customer from "../app/models/Customer.js";
import Product from "../app/models/Product.js";
import Contract from "../app/models/Contract.js";
import Category from "../app/models/Category.js";
import ContractProduct from "../app/models/ContractProduct.js";
import File from "../app/models/File.js";

/**
 * Classe de gerenciamento do banco de dados.
 * @class Database
 * @description Responsável por estabelecer a conexão com o banco de dados
 * e inicializar todos os modelos e seus relacionamentos.
 *
 * @example
 * // Importando a instância do banco de dados
 * import database from './database/index.js';
 *
 * // A conexão é estabelecida automaticamente
 * // Os modelos estão disponíveis em database.models
 * const User = database.models.User;
 */
class Database {
  /** Conexão com o banco de dados via Sequelize */
  public connection: Sequelize;

  /** Mapeamento de todos os modelos da aplicação */
  public models: Record<string, any>;

  /**
   * Construtor da classe Database.
   * @constructor
   * @description Inicializa a conexão com o banco, carrega os modelos
   * e executa as associações entre eles.
   */
  constructor() {
    /**
     * Cria a conexão com o banco de dados.
     * @type {Sequelize}
     */
    this.connection = new Sequelize(config);

    /**
     * Registra todos os modelos da aplicação.
     * @type {Object}
     */
    this.models = {
      User,
      Customer,
      Contract,
      Product,
      Category,
      ContractProduct,
      File,
    };

    /**
     * Inicializa os modelos e suas associações.
     */
    this.initModels();
    this.runAssociations();
  }

  /**
   * Inicializa todos os modelos.
   * @method initModels
   * @description Para cada modelo registrado, executa o método initModel
   * se ele existir, passando a conexão do Sequelize.
   *
   * @example
   * // Cada modelo deve implementar:
   * class User extends Model {
   *   static initModel(sequelize: Sequelize) {
   *     return super.init({ ... }, { sequelize, ... });
   *   }
   * }
   */
  initModels() {
    Object.keys(this.models).forEach((modelName) => {
      const model = this.models[modelName];

      if (typeof model.initModel === "function") {
        model.initModel(this.connection);
      }
    });
  }

  /**
   * Executa as associações entre modelos.
   * @method runAssociations
   * @description Para cada modelo registrado, executa o método associate
   * se ele existir, passando todos os modelos para definir relacionamentos.
   *
   * @example
   * // Cada modelo pode implementar:
   * class User extends Model {
   *   static associate(models) {
   *     this.hasMany(models.Estacao, { foreignKey: 'usuario_id' });
   *   }
   * }
   */
  runAssociations() {
    Object.keys(this.models).forEach((modelName) => {
      const model = this.models[modelName];

      if (typeof model.associate === "function") {
        model.associate(this.models);
      }
    });
  }
}

/**
 * Exporta instância única do banco de dados.
 * @default
 * @description Singleton que garante uma única conexão com o banco.
 */
const database = new Database();

export default database;
