/**
 * @file Contract.ts
 * @description Modelo de contrato da aplicação.
 * Define a estrutura, validações e métodos do modelo Contract no banco de dados.
 * Utiliza Sequelize ORM para gerenciar a persistência.
 */

import { Sequelize, DataTypes, Model } from "sequelize";

/**
 * Interface que define os atributos do modelo Contract.
 * @interface AtributosContrato
 * @description Descreve todos os campos que um contrato pode ter.
 * Os nomes das propriedades estão em português (API), mas serão mapeados
 * para os nomes em inglês no banco de dados via `field` no sequelize.
 */
interface AtributosContrato {
  /** ID único do contrato (auto-incrementado) */
  id?: number;
  /** ID do cliente associado ao contrato */
  cliente_id: number;
  /** ID do usuário (vendedor/gerente) que criou o contrato */
  usuario_id: number;
  /** Data de início do contrato */
  data_inicio: Date;
  /** Data de término do contrato */
  data_fim: Date;
  /** Status do contrato: ATIVO, ARQUIVADO ou CANCELADO */
  status?: "ACTIVE" | "ARCHIVED" | "CANCELED" | "LATE";
  /** Valor total do contrato */
  valor_total: number;
  /** Observações adicionais */
  observacoes: string;
  pdf_url?: string | null;
  pdf_filename?: string | null;
  pdf_hash?: string | null;
  pdf_generated_at?: Date | null;
  /** Data de criação do registro */
  criado_em?: Date;
  /** Data da última atualização do registro */
  atualizado_em?: Date;
}

/**
 * Classe modelo de Contrato.
 * @class Contract
 * @extends Model<AtributosContrato>
 * @implements AtributosContrato
 * @description Representa um contrato no sistema com todos os seus atributos e métodos.
 *
 * @example
 * // Criando um contrato (API usa português)
 * const contrato = await Contract.create({
 *   cliente_id: 1,
 *   usuario_id: 2,
 *   data_inicio: new Date('2026-07-15'),
 *   data_fim: new Date('2026-07-20'),
 *   status: 'ACTIVE',
 *   valor_total: 1500.00,
 *   observacoes: 'Contrato para festa de aniversário'
 * });
 *
 * // Listando contratos (resposta em português)
 * const contratos = await Contract.findAll();
 * console.log(contratos[0].data_inicio);
 */
class Contract extends Model<AtributosContrato> implements AtributosContrato {
  declare id?: number;
  declare cliente_id: number;
  declare usuario_id: number;
  declare data_inicio: Date;
  declare data_fim: Date;
  declare status?: "ACTIVE" | "ARCHIVED" | "CANCELED";
  declare valor_total: number;
  declare observacoes: string;
  declare pdf_url?: string | null;
  declare pdf_filename?: string | null;
  declare pdf_hash?: string | null;
  declare pdf_generated_at?: Date | null;
  declare readonly criado_em: Date;
  declare readonly atualizado_em: Date;

  /**
   * Inicializa o modelo Contract no Sequelize.
   * @static
   * @method initModel
   * @param {Sequelize} sequelize - Instância do Sequelize conectada ao banco
   * @returns {Model} Modelo Contract inicializado
   * @description Define os campos, configurações e hooks do modelo.
   *
   * Os campos em português (API) são mapeados para os campos em inglês (banco)
   * usando a propriedade `field` do Sequelize.
   */
  static initModel(sequelize: Sequelize) {
    const model = super.init(
      {
        /** ID do cliente (mapeado para 'client_id' no banco) */
        cliente_id: {
          type: DataTypes.INTEGER,
          field: "client_id",
          allowNull: false,
        },
        /** ID do usuário (mapeado para 'user_id' no banco) */
        usuario_id: {
          type: DataTypes.INTEGER,
          field: "user_id",
          allowNull: false,
        },
        /** Data de início (mapeado para 'init_date' no banco) */
        data_inicio: {
          type: DataTypes.DATE,
          field: "init_date",
          allowNull: false,
        },
        /** Data de término (mapeado para 'finish_date' no banco) */
        data_fim: {
          type: DataTypes.DATE,
          field: "finish_date",
          allowNull: false,
        },
        /** Status do contrato (mapeado para 'status' no banco) */
        status: {
          type: DataTypes.ENUM("ACTIVE", "ARCHIVED", "CANCELED", "LATE"),
          field: "status",
          allowNull: false,
          defaultValue: "ACTIVE",
        },
        /** Valor total (mapeado para 'total_value' no banco) */
        valor_total: {
          type: DataTypes.FLOAT,
          field: "total_value",
          allowNull: false,
        },
        /** Observações (mapeado para 'observations' no banco) */
        observacoes: {
          type: DataTypes.STRING,
          field: "observations",
          allowNull: false,
        },
        pdf_url: {
          type: DataTypes.STRING,
          field: "pdf_url",
          allowNull: true,
        },
        pdf_filename: {
          type: DataTypes.STRING,
          field: "pdf_filename",
          allowNull: true,
        },
        pdf_hash: {
          type: DataTypes.STRING,
          field: "pdf_hash",
          allowNull: true,
        },
        pdf_generated_at: {
          type: DataTypes.DATE,
          field: "pdf_generated_at",
          allowNull: true,
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
        tableName: "contracts",
        modelName: "Contract",
        underscored: true,
        createdAt: "criado_em",
        updatedAt: "atualizado_em",
      }
    );

    return model;
  }

  /**
   * Define as associações do modelo Contract com outros modelos.
   * @static
   * @method associate
   * @param {Object} models - Objeto contendo todos os modelos carregados
   * @description Um contrato pertence a um cliente e a um usuário; e tem muitos itens (ContractProduct).
   */
  static associate(models: any) {
    /** Pertence a um cliente */
    models.Contract.belongsTo(models.Customer, {
      foreignKey: "cliente_id",
      as: "cliente",
    });

    /** Pertence a um usuário */
    models.Contract.belongsTo(models.User, {
      foreignKey: "usuario_id",
      as: "usuario",
    });

    /** Tem muitos itens de contrato */
    models.Contract.hasMany(models.ContractProduct, {
      foreignKey: "contract_id",
      as: "itens",
    });
  }
}

export default Contract;
