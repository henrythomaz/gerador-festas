/**
 * @file Customer.ts
 * @description Modelo de cliente da aplicação.
 * Define a estrutura, validações e métodos do modelo Customer no banco de dados.
 * Utiliza Sequelize ORM para gerenciar a persistência.
 */

import { Sequelize, DataTypes, Model } from "sequelize";

/**
 * Interface que define os atributos do modelo Customer.
 * @interface AtributosCliente
 * @description Descreve todos os campos que um cliente pode ter.
 * Os nomes das propriedades estão em português (API), mas serão mapeados
 * para os nomes em inglês no banco de dados via `field` no sequelize.
 */
interface AtributosCliente {
  /** ID único do cliente (auto-incrementado) */
  id?: number;
  usuario_id?: number;
  /** Nome completo do cliente */
  nome: string;
  /** Número de telefone do cliente */
  telefone: string;
  /** CPF do cliente (deve ser único) */
  cpf: string;
  /** Email do cliente (único) */
  email: string;
  /** Status do cliente: ATIVO ou ARQUIVADO */
  status?: "ACTIVE" | "ARCHIVED";
  /** Data de criação do registro */
  criado_em?: Date;
  /** Data da última atualização do registro */
  atualizado_em?: Date;
}

/**
 * Classe modelo de Cliente.
 * @class Customer
 * @extends Model<AtributosCliente>
 * @implements AtributosCliente
 * @description Representa um cliente no sistema com todos os seus atributos e métodos.
 *
 * @example
 * // Criando um cliente (API usa português)
 * const cliente = await Customer.create({
 *   nome: "João Silva",
 *   telefone: "(11) 99999-9999",
 *   cpf: "123.456.789-00",
 *   email: "joao@email.com",
 *   status: "ACTIVE"
 * });
 *
 * // Listando clientes (resposta em português)
 * const clientes = await Customer.findAll();
 * console.log(clientes[0].nome); // "João Silva"
 */
class Customer extends Model<AtributosCliente> implements AtributosCliente {
  declare id?: number;
  declare usuario_id?: number;
  declare nome: string;
  declare telefone: string;
  declare cpf: string;
  declare email: string;
  declare status?: "ACTIVE" | "ARCHIVED";
  declare readonly criado_em: Date;
  declare readonly atualizado_em: Date;

  /**
   * Inicializa o modelo Customer no Sequelize.
   * @static
   * @method initModel
   * @param {Sequelize} sequelize - Instância do Sequelize conectada ao banco
   * @returns {Model} Modelo Customer inicializado
   * @description Define os campos, configurações e hooks do modelo.
   *
   * Os campos em português (API) são mapeados para os campos em inglês (banco)
   * usando a propriedade `field` do Sequelize.
   */
  static initModel(sequelize: Sequelize) {
    const model = super.init(
      {
        usuario_id: {
          type: DataTypes.INTEGER,
          field: "user_id",
          allowNull: true,
        },
        /** Nome do cliente (mapeado para 'name' no banco) */
        nome: {
          type: DataTypes.STRING,
          field: "name",
          allowNull: false,
        },
        /** Telefone do cliente (mapeado para 'telephone' no banco) */
        telefone: {
          type: DataTypes.STRING,
          field: "telephone",
          allowNull: false,
        },
        /** CPF do cliente (mapeado para 'cpf' no banco) */
        cpf: {
          type: DataTypes.STRING,
          field: "cpf",
          allowNull: false,
          unique: "cpf_user_id_unique",
        },
        /** Email do cliente (mapeado para 'email' no banco) */
        email: {
          type: DataTypes.STRING,
          field: "email",
          allowNull: false,
          unique: "email_user_id_unique",
        },
        /** Status do cliente (mapeado para 'status' no banco) */
        status: {
          type: DataTypes.ENUM("ACTIVE", "ARCHIVED"),
          field: "status",
          allowNull: false,
          defaultValue: "ARCHIVED",
        },
        /** Data de criação do registro (mapeado para 'created_at' no banco) */
        criado_em: {
          type: DataTypes.DATE,
          field: "created_at",
        },
        /** Data da última atualização (mapeado para 'updated_at' no banco) */
        atualizado_em: {
          type: DataTypes.DATE,
          field: "updated_at",
        },
      },
      {
        sequelize,
        tableName: "customers",
        modelName: "Customer",
        underscored: true,
        createdAt: "criado_em",
        updatedAt: "atualizado_em",
      }
    );

    return model;
  }

  /**
   * Define as associações do modelo Customer com outros modelos.
   * @static
   * @method associate
   * @param {Object} models - Objeto contendo todos os modelos carregados
   * @description (Exemplo) Um cliente pode ter muitos pedidos, mas por enquanto
   * não há relações definidas.
   */
  static associate(models: any) {
    // Um cliente pode ter muitos contratos
    models.Customer.hasMany(models.Contract, {
      foreignKey: "cliente_id",
      as: "contratos",
    });
    models.Customer.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "usuario",
    });
  }
}

export default Customer;
