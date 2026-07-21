/**
 * @file Product.ts
 * @description Modelo de produto da aplicação.
 * Define a estrutura, validações e métodos do modelo Product no banco de dados.
 * Utiliza Sequelize ORM para gerenciar a persistência.
 */

import { Sequelize, DataTypes, Model } from "sequelize";

/**
 * Interface que define os atributos do modelo Product.
 * @interface AtributosProduto
 */
interface AtributosProduto {
  id?: number;
  user_id?: number;
  file_id?: number | null;
  nome: string;
  descricao: string;
  preco_aluguel: number;
  quantidade_total: number;
  quantidade_disponivel: number;
  categoria_id: number;
  criado_em?: Date;
  atualizado_em?: Date;
}

/**
 * Classe modelo de Produto.
 * @class Product
 * @extends Model<AtributosProduto>
 */
class Product extends Model<AtributosProduto> implements AtributosProduto {
  declare id?: number;
  declare user_id?: number;
  declare nome: string;
  declare descricao: string;
  declare preco_aluguel: number;
  declare quantidade_total: number;
  declare quantidade_disponivel: number;
  declare categoria_id: number;
  declare readonly criado_em: Date;
  declare readonly atualizado_em: Date;

  /**
   * Inicializa o modelo Product no Sequelize.
   * @static
   * @method initModel
   * @param {Sequelize} sequelize - Instância do Sequelize
   * @returns {Model} Modelo Product inicializado
   */
  static initModel(sequelize: Sequelize) {
    const model = super.init(
      {
        user_id: {
          type: DataTypes.INTEGER,
          field: "user_id",
          allowNull: true,
        },
        nome: {
          type: DataTypes.STRING,
          field: "name",
          allowNull: false,
        },
        file_id: {
          type: DataTypes.INTEGER,
          field: "file_id",
          allowNull: true,
        },
        descricao: {
          type: DataTypes.STRING,
          field: "description",
          allowNull: false,
        },
        preco_aluguel: {
          type: DataTypes.FLOAT,
          field: "rental_price",
          allowNull: false,
        },
        quantidade_total: {
          type: DataTypes.INTEGER,
          field: "total_quantity",
          allowNull: false,
        },
        quantidade_disponivel: {
          type: DataTypes.INTEGER,
          field: "available_quantity",
          allowNull: false,
        },
        categoria_id: {
          type: DataTypes.INTEGER,
          field: "categorie_id",
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
        tableName: "products",
        modelName: "Product",
        underscored: true,
        createdAt: "criado_em",
        updatedAt: "atualizado_em",
      }
    );

    return model;
  }

  /**
   * Define as associações do modelo Product com outros modelos.
   * @static
   * @method associate
   * @param {Object} models
   */
  static associate(models: any) {
    models.Product.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "usuario",
    });
    models.Product.hasMany(models.ContractProduct, {
      foreignKey: "produto_id",
      as: "itens_contrato",
    });

    models.Product.belongsTo(models.Category, {
      foreignKey: "categorie_id",
      as: "categoria",
    });

    models.Product.belongsTo(models.File, {
      foreignKey: "file_id",
      as: "imagem",
    });
  }

  /**
   * Sobrescrita do método toJSON para remover o campo duplicado 'categorie_id'.
   * Garante que a resposta da API contenha apenas 'categoria_id' em português.
   * @returns {object} Objeto com os atributos em português.
   */
  toJSON() {
    const values = { ...this.get() };
    delete (values as any).categorie_id; // Remove a versão em inglês do campo
    return values;
  }
}

export default Product;
