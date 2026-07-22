import sqlite3 from "sqlite3";
import { promisify } from "util";
import fs from "fs-extra";
import path from "path";
import database from "../database/index.js"; // ou a instância do Sequelize

import User from "../app/models/User.js";
import Customer from "../app/models/Customer.js";
import Category from "../app/models/Category.js";
import Product from "../app/models/Product.js";
import Contract from "../app/models/Contract.js";
import ContractProduct from "../app/models/ContractProduct.js";
import File from "../app/models/File.js";

class SQLiteExporter {
  async export(userId: number, outputPath: string): Promise<void> {
    const db = new sqlite3.Database(outputPath);
    const run = promisify(db.run.bind(db));
    const all = promisify(db.all.bind(db));

    // Criar tabelas
    await this.createTables(db);

    // Exportar dados
    const tables = [
      "users",
      "categories",
      "customers",
      "products",
      "contracts",
      "contract_products",
      "files",
    ];
    const modelsMap = {
  users: database.models.User,
  categories: database.models.Category,
  customers: database.models.Customer,
  products: database.models.Product,
  contracts: database.models.Contract,
  contract_products: database.models.ContractProduct,
  files: database.models.File,
};

    for (const table of tables) {
      const model = modelsMap[table];
      // Buscar registros do usuário
      const where = { usuario_id: userId };
      // Alguns modelos podem não ter usuario_id? Todos têm.
      const records = await model.findAll({ where, raw: true });
      if (records.length === 0) continue;
      // Inserir no SQLite
      const placeholders = records
        .map(
          () =>
            `(${Object.keys(records[0])
              .map(() => "?")
              .join(",")})`
        )
        .join(",");
      const values = records.flatMap((r) => Object.values(r));
      const columns = Object.keys(records[0]).join(",");
      await run(
        `INSERT OR REPLACE INTO ${table} (${columns}) VALUES ${placeholders}`,
        values
      );
    }

    db.close();
  }

  private async createTables(db: sqlite3.Database) {
    // Definir schemas para cada tabela. Vou usar informações dos modelos.
    // Como é complexo, vou definir manualmente baseado nos modelos.
    // Simplificando, vou usar CREATE TABLE IF NOT EXISTS com colunas básicas.
    // Para um projeto real, seria melhor gerar a partir dos modelos.
    // Vou fazer um mapeamento estático.
    const schemas = {
      users: `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        nome TEXT,
        email TEXT,
        senha TEXT,
        file_id INTEGER,
        email_confirmado INTEGER,
        aprovado INTEGER,
        email_confirmacao_token TEXT,
        ultimo_login TEXT,
        criado_em TEXT,
        atualizado_em TEXT
      )`,
      categories: `CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY,
        nome TEXT,
        usuario_id INTEGER,
        criado_em TEXT,
        atualizado_em TEXT
      )`,
      customers: `CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY,
        nome TEXT,
        cpf TEXT,
        telefone TEXT,
        email TEXT,
        usuario_id INTEGER,
        criado_em TEXT,
        atualizado_em TEXT
      )`,
      products: `CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY,
        nome TEXT,
        descricao TEXT,
        preco REAL,
        categoria_id INTEGER,
        usuario_id INTEGER,
        file_id INTEGER,
        criado_em TEXT,
        atualizado_em TEXT
      )`,
      contracts: `CREATE TABLE IF NOT EXISTS contracts (
        id INTEGER PRIMARY KEY,
        cliente_id INTEGER,
        usuario_id INTEGER,
        data_inicio TEXT,
        data_fim TEXT,
        observacoes TEXT,
        status TEXT,
        valor_total REAL,
        pdf_url TEXT,
        pdf_filename TEXT,
        pdf_hash TEXT,
        pdf_generated_at TEXT,
        criado_em TEXT,
        atualizado_em TEXT
      )`,
      contract_products: `CREATE TABLE IF NOT EXISTS contract_products (
        id INTEGER PRIMARY KEY,
        contrato_id INTEGER,
        produto_id INTEGER,
        quantidade INTEGER,
        preco_unitario REAL,
        subtotal REAL,
        usuario_id INTEGER,
        criado_em TEXT,
        atualizado_em TEXT
      )`,
      files: `CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY,
        nome TEXT,
        caminho TEXT,
        usuario_id INTEGER,
        criado_em TEXT,
        atualizado_em TEXT
      )`,
    };

    const run = promisify(db.run.bind(db));
    for (const schema of Object.values(schemas)) {
      await run(schema);
    }
  }
}

export default new SQLiteExporter();
