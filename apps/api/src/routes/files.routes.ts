/**
 * @file files.routes.ts
 * @description Rotas para gerenciamento de arquivos (upload, atualização e deleção).
 */

import { Router } from "express";
import multer from "multer";
import multerConfig from "../config/multer.js";
import filesController from "../app/controllers/FilesController.js";
import authMiddleware from "../app/middlewares/auth.js"; // <-- IMPORTANTE: importar o middleware

const upload = multer(multerConfig);
const routes = Router();

/**
 * @swagger
 * tags:
 *   - name: Files
 *     description: Gerenciamento de arquivos (imagens)
 */

/**
 * @swagger
 * /files:
 *   post:
 *     summary: Faz upload de um arquivo
 *     tags: [Files]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Arquivo de imagem (JPEG, PNG ou GIF)
 *     responses:
 *       201:
 *         description: Arquivo enviado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 nome:
 *                   type: string
 *                 caminho:
 *                   type: string
 *       400:
 *         description: Nenhum arquivo enviado ou tipo inválido
 *       413:
 *         description: Arquivo muito grande (limite 2MB)
 */
routes.post("/files", upload.single("file"), filesController.create);

/**
 * @swagger
 * /files/{id}:
 *   put:
 *     summary: Substitui um arquivo existente por um novo
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do arquivo a ser atualizado
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Novo arquivo de imagem
 *     responses:
 *       200:
 *         description: Arquivo atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 nome:
 *                   type: string
 *                 caminho:
 *                   type: string
 *       400:
 *         description: Nenhum arquivo enviado
 *       404:
 *         description: Arquivo não encontrado
 */
routes.put("/files/:id", upload.single("file"), filesController.update);

/**
 * @swagger
 * /files/{id}:
 *   delete:
 *     summary: Deleta um arquivo
 *     description: Remove o arquivo do servidor e do banco de dados. Se estiver associado a um usuário ou produto, a referência é removida (file_id = null).
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do arquivo a ser deletado
 *     responses:
 *       200:
 *         description: Arquivo deletado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Arquivo deletado com sucesso.
 *       404:
 *         description: Arquivo não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
routes.delete("/files/:id", authMiddleware, filesController.destroy);

export default routes;
