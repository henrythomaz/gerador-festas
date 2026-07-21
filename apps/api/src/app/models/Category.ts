/**
 * @file Category.ts
 * @description Modelo de categoria da aplicação.
 * Define a estrutura, validações e métodos do modelo Category no banco de dados.
 * Utiliza Sequelize ORM para gerenciar a persistência.
 */

import { Sequelize, DataTypes, Model } from "sequelize";

/**
 * Interface que define os atributos do modelo Category.
 * @interface AtributosCategoria
 * @description Descreve todos os campos que uma categoria pode ter.
 * Os nomes das propriedades estão em português (API), mas serão mapeados
 * para os nomes em inglês no banco de dados via `field` no sequelize.
 */
interface AtributosCategoria {
  /** ID único da categoria (auto-incrementado) */
  id?: number;
  /** Nome da categoria */
  nome: string;
  /** Data de criação do registro */
  criado_em?: Date;
  /** Data da última atualização do registro */
  atualizado_em?: Date;
  user_id?: number;
}

/**
 * Classe modelo de Categoria.
 * @class Category
 * @extends Model<AtributosCategoria>
 * @implements AtributosCategoria
 * @description Representa uma categoria no sistema com todos os seus atributos e métodos.
 *
 * @example
 * // Criando uma categoria (API usa português)
 * const categoria = await Category.create({
 *   nome: "Decoração"
 * });
 *
 * // Listando categorias (resposta em português)
 * const categorias = await Category.findAll();
 * console.log(categorias[0].nome); // "Decoração"
 */
class Category extends Model<AtributosCategoria> implements AtributosCategoria {
  declare id?: number;
  declare nome: string;
  declare readonly criado_em: Date;
  declare readonly atualizado_em: Date;
  declare user_id?: number;

  /**
   * Inicializa o modelo Category no Sequelize.
   * @static
   * @method initModel
   * @param {Sequelize} sequelize - Instância do Sequelize conectada ao banco
   * @returns {Model} Modelo Category inicializado
   * @description Define os campos, configurações e hooks do modelo.
   *
   * Os campos em português (API) são mapeados para os campos em inglês (banco)
   * usando a propriedade `field` do Sequelize.
   */
  static initModel(sequelize: Sequelize) {
    const model = super.init(
      {
        /** Nome da categoria (mapeado para 'name' no banco) */
        nome: {
          type: DataTypes.STRING,
          field: "name",
          allowNull: false,
        },
        user_id: {
          type: DataTypes.INTEGER,
          field: "user_id",
          allowNull: true, // ou false após popular
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
        tableName: "categories",
        modelName: "Category",
        underscored: true,
        createdAt: "criado_em",
        updatedAt: "atualizado_em",
      }
    );

    return model;
  }

  /**
   * Define as associações do modelo Category com outros modelos.
   * @static
   * @method associate
   * @param {Object} models - Objeto contendo todos os modelos carregados
   * @description Uma categoria pode ter muitos produtos.
   * @example
   * Category.hasMany(models.Product, { foreignKey: 'categorie_id' });
   */
  static associate(models: any) {
    // Uma categoria tem muitos produtos
    models.Category.hasMany(models.Product, {
      foreignKey: "categorie_id",
      as: "produtos",
    });
    models.Category.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "usuario",
    });
  }
}

export default Category;
