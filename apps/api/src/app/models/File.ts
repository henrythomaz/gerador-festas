/**
 * @file File.ts
 * @description Modelo de arquivo (imagem) da aplicação.
 * Armazena o nome original e o caminho gerado para cada arquivo enviado.
 */

import { Sequelize, DataTypes, Model } from "sequelize";
import User from "./User.js";

interface AtributosArquivo {
  id?: number;
  usuario_id: number;
  nome: string; // nome original
  caminho: string; // nome gerado (hash + extensão)
  criado_em?: Date;
  atualizado_em?: Date;
}

class File extends Model<AtributosArquivo> implements AtributosArquivo {
  declare id?: number;
  declare usuario_id: number;
  declare nome: string;
  declare caminho: string;
  declare readonly criado_em: Date;
  declare readonly atualizado_em: Date;

  static initModel(sequelize: Sequelize) {
    const model = super.init(
      {
        usuario_id: {
          type: DataTypes.INTEGER,
          field: "user_id",
          allowNull: true,
        },
        nome: {
          type: DataTypes.STRING,
          field: "name",
          allowNull: false,
        },
        caminho: {
          type: DataTypes.STRING,
          field: "path",
          allowNull: false,
          unique: true, // caminho único para evitar duplicidade
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
        tableName: "files",
        modelName: "File",
        underscored: true,
        createdAt: "criado_em",
        updatedAt: "atualizado_em",
      }
    );

    return model;
  }

  // Associações (serão definidas depois)
  static associate(models: any) {
    // Um arquivo pode pertencer a um usuário (hasOne) e a um produto (hasOne)
    models.File.hasOne(models.User, {
      foreignKey: "file_id",
      as: "avatar_usuario",
    });
    models.File.hasOne(models.Product, {
      foreignKey: "file_id",
      as: "produto",
    });

    models.File.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "dono_do_arquivo",
    });
  }
}

export default File;
