"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. CPF: remover constraint global, tornar user_id NOT NULL,
    //    adicionar constraint composta (cpf, user_id)
    await queryInterface.sequelize.query(
      'ALTER TABLE "customers" DROP CONSTRAINT IF EXISTS "customers_cpf_key";'
    );

    await queryInterface.sequelize.query(
      'ALTER TABLE "customers" DROP CONSTRAINT IF EXISTS "customers_email_key";'
    );

    await queryInterface.changeColumn("customers", "user_id", {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });

    await queryInterface.addConstraint("customers", {
      fields: ["cpf", "user_id"],
      type: "unique",
      name: "customers_cpf_user_id_unique",
    });

    // 2. EMAIL: adicionar constraint composta (email, user_id)
    //    (não há unique global, mas garantimos a composta)
    await queryInterface.addConstraint("customers", {
      fields: ["email", "user_id"],
      type: "unique",
      name: "customers_email_user_id_unique",
    });
  },

  async down(queryInterface) {
    // Remove as constraints compostas
    await queryInterface.removeConstraint(
      "customers",
      "customers_cpf_user_id_unique"
    );
    await queryInterface.removeConstraint(
      "customers",
      "customers_email_user_id_unique"
    );

    // Reverte user_id para nullable
    await queryInterface.changeColumn("customers", "user_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });

    // Recria constraint global de CPF (se necessário)
    await queryInterface.addConstraint("customers", {
      fields: ["cpf"],
      type: "unique",
      name: "customers_cpf_key",
    });

    // Se houvesse unique global no email, recriaria aqui, mas não havia.
  },
};
