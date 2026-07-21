"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Adicionar coluna file_id em users
    await queryInterface.addColumn("users", "file_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "files",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });

    // Adicionar coluna file_id em products
    await queryInterface.addColumn("products", "file_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "files",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("users", "file_id");
    await queryInterface.removeColumn("products", "file_id");
  },
};
