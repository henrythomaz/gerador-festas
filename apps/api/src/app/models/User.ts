/**
 * @file User.ts
 * @description Modelo de usuário da aplicação.
 * Define a estrutura, validações e métodos do modelo User no banco de dados.
 * Utiliza Sequelize ORM para gerenciar a persistência.
 *
 * @note Os campos no banco de dados estão em inglês, mas a API expõe
 * os nomes em português para melhor experiência do desenvolvedor.
 */

import { Sequelize, DataTypes, Model } from "sequelize";
import bcrypt from "bcryptjs";

import GoogleToken from "./GoogleToken.js";

/**
 * Interface que define os atributos do modelo User.
 * @interface AtributosUsuario
 * @description Descreve todos os campos que um usuário pode ter.
 * Os nomes das propriedades estão em português (API), mas serão mapeados
 * para os nomes em inglês no banco de dados via `field` no sequelize.
 */
interface AtributosUsuario {
  /** ID único do usuário (auto-incrementado) */
  id?: number;
  /** ID único do file */
  file_id?: number | null;
  /** Nome completo do usuário */
  nome: string;
  /** Email do usuário (único) */
  email: string;
  /** Senha em texto plano (apenas para criação/atualização) */
  senha?: string;
  /** Hash da senha armazenado no banco */
  senha_hash: string;
  /** Indica se o email foi confirmado */
  email_confirmado?: boolean;
  /** Token para confirmação de email */
  email_confirmacao_token?: string | null;
  /** Data do último login do usuário */
  ultimo_login?: Date | null;
  /** Data de criação do registro */
  criado_em?: Date;
  /** Data da última atualização do registro */
  atualizado_em?: Date;
}

/**
 * Classe modelo de Usuário.
 * @class User
 * @extends Model<AtributosUsuario>
 * @implements AtributosUsuario
 * @description Representa um usuário no sistema com todos os seus atributos e métodos.
 *
 * @example
 * // Criando um usuário (API usa português)
 * const user = await User.create({
 *   nome: "Henry Campos",    // Mapeado para "name" no banco
 *   email: "henry@email.com",
 *   senha: "123456"          // Mapeado para "password_hash" no banco
 * });
 *
 * // Listando usuários (resposta em português)
 * const users = await User.findAll();
 * console.log(users[0].nome); // "Henry Campos"
 */
class User extends Model<AtributosUsuario> implements AtributosUsuario {
  declare id?: number;
  declare file_id?: number | null;
  declare nome: string;
  declare email: string;
  declare senha?: string;
  declare senha_hash: string;
  declare email_confirmado?: boolean;
  declare email_confirmacao_token?: string | null;
  declare ultimo_login?: Date | null;
  declare readonly criado_em: Date;
  declare readonly atualizado_em: Date;

  /**
   * Inicializa o modelo User no Sequelize.
   * @static
   * @method initModel
   * @param {Sequelize} sequelize - Instância do Sequelize conectada ao banco
   * @returns {Model} Modelo User inicializado
   * @description Define os campos, configurações e hooks do modelo.
   *
   * Os campos em português (API) são mapeados para os campos em inglês (banco)
   * usando a propriedade `field` do Sequelize.
   */
  static initModel(sequelize: Sequelize) {
    const model = super.init(
      {
        /** Nome do usuário (mapeado para 'name' no banco) */
        nome: {
          type: DataTypes.STRING,
          field: "name",
        },
        file_id: {
          type: DataTypes.INTEGER,
          field: "file_id",
          allowNull: true,
        },
        /** Email do usuário */
        email: {
          type: DataTypes.STRING,
          field: "email",
        },
        /** Senha em texto plano (não é armazenada no banco) */
        senha: DataTypes.VIRTUAL,
        /** Hash da senha (mapeado para 'password_hash' no banco) */
        senha_hash: {
          type: DataTypes.STRING,
          field: "password_hash",
        },
        /** Status de confirmação do email (mapeado para 'email_confirmed' no banco) */
        email_confirmado: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          field: "email_confirmed",
        },
        /** Token para confirmação do email (mapeado para 'email_confirmation_token' no banco) */
        email_confirmacao_token: {
          type: DataTypes.STRING,
          allowNull: true,
          field: "email_confirmation_token",
        },
        /** Data do último login (mapeado para 'last_login' no banco) */
        ultimo_login: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: null,
          field: "last_login",
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
        tableName: "users",
        modelName: "User",
        underscored: true,
        createdAt: "criado_em",
        updatedAt: "atualizado_em",
      }
    );

    /**
     * Hook executado antes de salvar o usuário.
     * @hook beforeSave
     * @description Criptografa a senha antes de persistir no banco de dados.
     * @param {User} usuario - Instância do usuário sendo salvo
     */
    this.addHook("beforeSave", async (usuario: User) => {
      if (usuario.senha) {
        usuario.senha_hash = await bcrypt.hash(usuario.senha, 8);
      }
    });

    return model;
  }

  /**
   * Define as associações do modelo User com outros modelos.
   * @static
   * @method associate
   * @param {Object} models - Objeto contendo todos os modelos carregados
   * @description (Exemplo) Um usuário pode ter muitos pedidos, etc.
   */
  static associate(models: any) {
    // Associação existente com Contract
    models.User.hasMany(models.Contract, {
      foreignKey: "usuario_id",
      as: "contratos",
    });

    // Associação com File (imagem de perfil)
    models.User.belongsTo(models.File, {
      foreignKey: "file_id",
      as: "avatar",
    });

    User.hasOne(GoogleToken, { foreignKey: "user_id" });
  }

  /**
   * Verifica se a senha fornecida corresponde ao hash armazenado.
   * @method checkPassword
   * @async
   * @param {string} senha - Senha em texto plano para verificação
   * @returns {Promise<boolean>} True se a senha estiver correta, false caso contrário
   * @description Compara a senha fornecida com o hash armazenado no banco.
   *
   * @example
   * // Verificar senha do usuário
   * const usuario = await User.findByPk(1);
   * const senhaCorreta = await usuario.checkPassword("123456");
   * if (senhaCorreta) {
   *   console.log("Senha válida");
   * }
   */
  async checkPassword(senha: string) {
    return bcrypt.compare(senha, this.senha_hash);
  }
}

export default User;
