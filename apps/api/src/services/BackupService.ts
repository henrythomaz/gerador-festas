import SQLiteExporter from "./SQLiteExporter.js";
import SQLiteImporter from "./SQLiteImporter.js";
import fs from "fs-extra";
import path from "path";
import { v4 as uuidv4 } from "uuid";

class BackupService {
  async exportUserBackup(userId: number): Promise<string> {
    const tmpDir = path.join(process.cwd(), "tmp", "backups");
    await fs.ensureDir(tmpDir);
    const filename = `backup-${userId}-${Date.now()}.db`;
    const filePath = path.join(tmpDir, filename);
    await SQLiteExporter.export(userId, filePath);
    return filePath;
  }

  async importUserBackup(userId: number, filePath: string): Promise<void> {
    await SQLiteImporter.import(userId, filePath);
    // Opcional: deletar arquivo após importação
    // await fs.remove(filePath);
  }
}

export default new BackupService();
