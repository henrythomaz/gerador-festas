import { google } from "googleapis";
import fs from "fs-extra";
import path from "path";

class GoogleDriveService {
  private drive;
  constructor(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    this.drive = google.drive({ version: "v3", auth });
  }

  async ensureAppFolder(): Promise<string> {
    // Busca pasta "Gerenciador de Festas"
    const res = await this.drive.files.list({
      q: "name='Gerenciador de Festas' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: "files(id, name)",
    });
    let folder = res.data.files?.[0];
    if (!folder) {
      const createRes = await this.drive.files.create({
        requestBody: {
          name: "Gerenciador de Festas",
          mimeType: "application/vnd.google-apps.folder",
        },
        fields: "id",
      });
      folder = { id: createRes.data.id!, name: "Gerenciador de Festas" };
    }
    return folder.id!;
  }

  async ensureUserFolder(
    userId: number,
    parentFolderId: string
  ): Promise<string> {
    const folderName = `usuario-${userId}`; // ou usar email
    const res = await this.drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`,
      fields: "files(id, name)",
    });
    let folder = res.data.files?.[0];
    if (!folder) {
      const createRes = await this.drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: "application/vnd.google-apps.folder",
          parents: [parentFolderId],
        },
        fields: "id",
      });
      folder = { id: createRes.data.id!, name: folderName };
    }
    return folder.id!;
  }

  async ensureBackupsFolder(userFolderId: string): Promise<string> {
    const folderName = "backups";
    const res = await this.drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${userFolderId}' in parents and trashed=false`,
      fields: "files(id, name)",
    });
    let folder = res.data.files?.[0];
    if (!folder) {
      const createRes = await this.drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: "application/vnd.google-apps.folder",
          parents: [userFolderId],
        },
        fields: "id",
      });
      folder = { id: createRes.data.id!, name: folderName };
    }
    return folder.id!;
  }

  async uploadFile(
    filePath: string,
    fileName: string,
    folderId: string,
    replace: boolean = false
  ): Promise<{ id: string; name: string }> {
    // Se replace, deletar arquivo com mesmo nome na pasta
    if (replace) {
      const existing = await this.drive.files.list({
        q: `name='${fileName}' and '${folderId}' in parents and trashed=false`,
        fields: "files(id)",
      });
      if (existing.data.files && existing.data.files.length > 0) {
        await this.drive.files.delete({ fileId: existing.data.files[0].id! });
      }
    }
    const fileMeta = {
      name: fileName,
      parents: [folderId],
    };
    const media = {
      mimeType: "application/octet-stream",
      body: fs.createReadStream(filePath),
    };
    const res = await this.drive.files.create({
      requestBody: fileMeta,
      media: media,
      fields: "id, name",
    });
    return { id: res.data.id!, name: res.data.name! };
  }

  async downloadFile(fileId: string, destinationPath: string): Promise<void> {
    const res = await this.drive.files.get(
      { fileId, alt: "media" },
      { responseType: "stream" }
    );
    return new Promise((resolve, reject) => {
      const dest = fs.createWriteStream(destinationPath);
      res.data
        .on("end", () => resolve())
        .on("error", reject)
        .pipe(dest);
    });
  }

  async listFiles(
    folderId: string,
    maxResults: number = 50
  ): Promise<
    Array<{
      id: string;
      name: string;
      createdTime: string;
      modifiedTime: string;
      size?: string;
    }>
  > {
    const res = await this.drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: "files(id, name, createdTime, modifiedTime, size)",
      orderBy: "modifiedTime desc",
      pageSize: maxResults,
    });
    return (
      res.data.files?.map((f) => ({
        id: f.id!,
        name: f.name!,
        createdTime: f.createdTime!,
        modifiedTime: f.modifiedTime!,
        size: f.size || undefined,
      })) || []
    );
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.drive.files.delete({ fileId });
  }

  async getLatestBackup(
    userFolderId: string,
    backupsFolderId: string
  ): Promise<{ id: string; name: string; modifiedTime: string } | null> {
    const files = await this.listFiles(backupsFolderId, 1);
    if (files.length > 0) {
      return files[0];
    }
    // Também verificar o backup.db na raiz
    const rootFiles = await this.drive.files.list({
      q: `name='backup.db' and '${userFolderId}' in parents and trashed=false`,
      fields: "files(id, name, modifiedTime)",
    });
    if (rootFiles.data.files && rootFiles.data.files.length > 0) {
      const f = rootFiles.data.files[0];
      return { id: f.id!, name: f.name!, modifiedTime: f.modifiedTime! };
    }
    return null;
  }
}

export default GoogleDriveService;
