'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('contracts', 'pdf_url', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('contracts', 'pdf_filename', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('contracts', 'pdf_hash', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('contracts', 'pdf_generated_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('contracts', 'pdf_generated_at');
    await queryInterface.removeColumn('contracts', 'pdf_hash');
    await queryInterface.removeColumn('contracts', 'pdf_filename');
    await queryInterface.removeColumn('contracts', 'pdf_url');
  },
};
