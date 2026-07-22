import { DataTypes, Model, Optional, Sequelize } from "sequelize";

interface GoogleTokenAttributes {
  id: number;
  user_id: number;
  access_token: string;
  refresh_token: string;
  expiry_date: Date;
  google_user_id?: string;
  google_email?: string;
  connected_at: Date;
  last_sync_at?: Date;
  last_backup_at?: Date;
  sync_enabled: boolean;
  updated_at: Date;
}

interface GoogleTokenCreationAttributes
  extends Optional<GoogleTokenAttributes, "id" | "connected_at" | "updated_at" | "sync_enabled"> {}

class GoogleToken
  extends Model<GoogleTokenAttributes, GoogleTokenCreationAttributes>
  implements GoogleTokenAttributes
{
  public id!: number;
  public user_id!: number;
  public access_token!: string;
  public refresh_token!: string;
  public expiry_date!: Date;
  public google_user_id!: string;
  public google_email!: string;
  public connected_at!: Date;
  public last_sync_at!: Date;
  public last_backup_at!: Date;
  public sync_enabled!: boolean;
  public updated_at!: Date;

  static initModel(sequelize: Sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        access_token: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        refresh_token: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        expiry_date: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        google_user_id: {
          type: DataTypes.STRING,
        },
        google_email: {
          type: DataTypes.STRING,
        },
        connected_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        last_sync_at: {
          type: DataTypes.DATE,
        },
        last_backup_at: {
          type: DataTypes.DATE,
        },
        sync_enabled: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: "google_tokens",
        timestamps: false,
        updatedAt: false,
        createdAt: false,
      }
    );
  }

  static associate(models: any) {
    this.belongsTo(models.User, { foreignKey: "user_id" });
  }
}

export default GoogleToken;
