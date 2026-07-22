"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("google_tokens", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      access_token: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      refresh_token: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      expiry_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      google_user_id: {
        type: Sequelize.STRING,
      },
      google_email: {
        type: Sequelize.STRING,
      },
      connected_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      last_sync_at: {
        type: Sequelize.DATE,
      },
      last_backup_at: {
        type: Sequelize.DATE,
      },
      sync_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("google_tokens", ["user_id"], {
      unique: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("google_tokens");
  },
};
