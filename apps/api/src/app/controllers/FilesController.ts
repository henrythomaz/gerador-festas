/**
 * @file FilesController.ts
 * @description Controlador responsável pelo upload de arquivos.
 */

import { Request, Response } from "express";
import { unlink } from "fs/promises";
import path from "path";
import File from "../models/File.js";

class FilesController {
  // Método existente (create)...
  async create(req: Request, res: Response) {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ erro: "Nenhum arquivo enviado." });
    }

    const { originalname: nome, filename: caminho } = file;

    const novoArquivo = await File.create({ nome, caminho });

    return res.status(201).json(novoArquivo);
  }

  // update
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ erro: "Nenhum arquivo enviado para atualização." });
    }

    // Busca o arquivo no banco
    const arquivoExistente = await File.findByPk(id);
    if (!arquivoExistente) {
      return res.status(404).json({ erro: "Arquivo não encontrado." });
    }

    // Caminho completo do arquivo antigo (assumindo que os arquivos ficam em "uploads/")
    const caminhoAntigo = path.resolve("uploads", arquivoExistente.caminho);

    try {
      // Remove o arquivo físico antigo
      await unlink(caminhoAntigo);
    } catch (err) {
      // Se o arquivo não existir, apenas logamos e seguimos (não bloqueia a atualização)
      console.warn(`Arquivo antigo não encontrado: ${caminhoAntigo}`);
    }

    // Atualiza os dados no banco
    const { originalname: nome, filename: caminho } = file;
    arquivoExistente.nome = nome;
    arquivoExistente.caminho = caminho;
    await arquivoExistente.save();

    return res.status(200).json(arquivoExistente);
  }
}

export default new FilesController();
