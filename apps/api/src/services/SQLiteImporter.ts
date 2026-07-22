import sqlite3 from "sqlite3";
import { promisify } from "util";
import database from "../database/index.js";
import { Transaction } from "sequelize";

class SQLiteImporter {
  async import(userId: number, filePath: string): Promise<void> {
    const db = new sqlite3.Database(filePath);
    const all = promisify(db.all.bind(db));

    // Ordem de importação: users primeiro (FKs), depois o resto
    const tables = [
      "users",
      "categories",
      "customers",
      "products",
      "contracts",
      "contract_products",
      "files",
    ];

    const modelsMap: Record<string, any> = {
      users: database.models.User,
      categories: database.models.Category,
      customers: database.models.Customer,
      products: database.models.Product,
      contracts: database.models.Contract,
      contract_products: database.models.ContractProduct,
      files: database.models.File,
    };

    // Iniciar transação no PostgreSQL
    const transaction = await database.connection.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
    });

    try {
      // Desabilitar constraints de FK temporariamente para evitar erros de ordem
      await database.connection.query("SET CONSTRAINTS ALL DEFERRED", { 
        transaction 
      });

      for (const table of tables) {
        const model = modelsMap[table];
        if (!model) {
          console.warn(`Modelo para tabela ${table} não encontrado, pulando...`);
          continue;
        }

        const records = await all(`SELECT * FROM ${table}`);
        if (records.length === 0) continue;

        // Inserir/atualizar no PostgreSQL
        for (const record of records) {
          // 🔹 IMPORTANTE: passamos skipSync: true para evitar loop infinito
          await model.upsert(record, { 
            transaction, 
            skipSync: true,  // <-- será verificado nos hooks
            hooks: true      // <-- mantém os hooks ativos, mas skipSync os impede de disparar
          });
        }

        console.log(`[SQLiteImporter] Tabela ${table}: ${records.length} registros importados`);
      }

      await transaction.commit();
      console.log(`[SQLiteImporter] Importação concluída para usuário ${userId}`);
    } catch (error) {
      await transaction.rollback();
      console.error(`[SQLiteImporter] Erro ao importar:`, error);
      throw error;
    } finally {
      db.close();
    }
  }
}

export default new SQLiteImporter();
