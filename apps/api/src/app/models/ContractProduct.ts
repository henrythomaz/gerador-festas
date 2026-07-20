/**
 * @file ContractProduct.ts
 * @description Modelo de item de contrato (produto alugado) da aplicação.
 * Define a estrutura, validações e métodos do modelo ContractProduct no banco de dados.
 * Utiliza Sequelize ORM para gerenciar a persistência.
 */

import { Sequelize, DataTypes, Model } from "sequelize";

/**
 * Interface que define os atributos do modelo ContractProduct.
 * @interface AtributosItemContrato
 */
interface AtributosItemContrato {
  id?: number;
  contrato_id: number;
  produto_id: number;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  criado_em?: Date;
  atualizado_em?: Date;
}

/**
 * Classe modelo de Item de Contrato.
 * @class ContractProduct
 * @extends Model<AtributosItemContrato>
 */
class ContractProduct
  extends Model<AtributosItemContrato>
  implements AtributosItemContrato
{
  declare id?: number;
  declare contrato_id: number;
  declare produto_id: number;
  declare quantidade: number;
  declare preco_unitario: number;
  declare subtotal: number;
  declare readonly criado_em: Date;
  declare readonly atualizado_em: Date;

  /**
   * Inicializa o modelo ContractProduct no Sequelize.
   * @static
   * @method initModel
   * @param {Sequelize} sequelize - Instância do Sequelize conectada ao banco
   * @returns {Model} Modelo ContractProduct inicializado
   */
  static initModel(sequelize: Sequelize) {
    const model = super.init(
      {
        contrato_id: {
          type: DataTypes.INTEGER,
          field: "contract_id",
          allowNull: false,
        },
        produto_id: {
          type: DataTypes.INTEGER,
          field: "product_id",
          allowNull: false,
        },
        quantidade: {
          type: DataTypes.INTEGER,
          field: "quantity",
          allowNull: false,
        },
        preco_unitario: {
          type: DataTypes.FLOAT,
          field: "unit_price",
          allowNull: false,
        },
        subtotal: {
          type: DataTypes.FLOAT,
          field: "subtotal",
          allowNull: false,
        },
        criado_em: {
          type: DataTypes.DATE,
          field: "created_at",
        },
        atualizado_em: {
          type: DataTypes.DATE,
          field: "updated_at",
        },
      },
      {
        sequelize,
        tableName: "contract_products",
        modelName: "ContractProduct",
        underscored: true,
        createdAt: "criado_em",
        updatedAt: "atualizado_em",
      }
    );

    return model;
  }

  /**
   * Define as associações do modelo ContractProduct com outros modelos.
   * @static
   * @method associate
   * @param {Object} models
   */
  static associate(models: any) {
    models.ContractProduct.belongsTo(models.Contract, {
      foreignKey: "contrato_id",
      as: "contrato",
    });

    models.ContractProduct.belongsTo(models.Product, {
      foreignKey: "produto_id",
      as: "produto",
    });
  }

  /**
   * Recalcula o valor_total do contrato com base na soma dos subtotais de seus itens.
   * @static
   * @method updateContractTotal
   * @param {number} contractId - ID do contrato
   * @param {any} [transaction] - Transação opcional do Sequelize
   *
   * @description
   * Esta função NÃO regenera o PDF. A regeneração deve ser feita APÓS o commit da transação,
   * pelos controladores que chamarem este método.
   */
  static async updateContractTotal(contractId: number, transaction?: any) {
    const sequelize = ContractProduct.sequelize!;
    // Soma os subtotais de todos os itens do contrato
    const result = await ContractProduct.findAll({
      where: { contrato_id: contractId },
      attributes: [[sequelize.fn("SUM", sequelize.col("subtotal")), "total"]],
      transaction,
      raw: true,
    });
    const total = (result as any)[0]?.total || 0;

    // Import dinâmico para evitar dependência circular
    const { default: Contract } = await import("./Contract.js");
    await Contract.update(
      { valor_total: total },
      { where: { id: contractId }, transaction }
    );
  }

  /**
   * Sobrescrita do método toJSON para remover campos indesejados (ex: contract_id, product_id).
   * Garante que a resposta da API contenha apenas os atributos em português.
   * @method toJSON
   * @returns {object} Objeto com apenas os atributos definidos no modelo (em português).
   */
  toJSON() {
    const values = { ...this.get() };
    // Remove possíveis campos em inglês que possam ter sido incluídos (raw ou via associação)
    delete (values as any).contract_id;
    delete (values as any).product_id;
    delete (values as any).unit_price;
    // Mantém apenas os atributos mapeados (contrato_id, produto_id, etc.)
    return values;
  }
}

export default ContractProduct;
