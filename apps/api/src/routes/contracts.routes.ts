/**
 * @file contracts.routes.ts
 * @description Rotas para gerenciamento de contratos.
 * Inclui CRUD completo, cancelamento e expiração com autenticação.
 */

import { Router } from "express";
import ContractsController from "../app/controllers/ContractsController.js";
import authMiddleware from "../app/middlewares/auth.js";

/**
 * Instância do roteador para rotas de contratos.
 * @type {Router}
 */
const routes = Router();

// ============ MÉTODOS GET ============

/**
 * Rota para listar todos os contratos.
 * @route GET /contratos
 */
routes.get("/contratos", authMiddleware, ContractsController.index);

/**
 * Rota para buscar um contrato por ID.
 * @route GET /contratos/:id
 */
routes.get("/contratos/:id", authMiddleware, ContractsController.show);

// ============ MÉTODOS POST ============

/**
 * Rota para criar um novo contrato.
 * @route POST /contratos
 */
routes.post("/contratos", authMiddleware, ContractsController.create);

/**
 * Rota para cancelar um contrato manualmente.
 * @route POST /contratos/:id/cancelar
 */
routes.post(
  "/contratos/:id/cancelar",
  authMiddleware,
  ContractsController.cancel.bind(ContractsController)
);

/**
 * Rota para processar contratos expirados.
 * @route POST /contratos/expirar
 */
routes.post(
  "/contratos/expirar",
  authMiddleware,
  ContractsController.expire.bind(ContractsController)
);

/**
 * Rota para arquivar um contrato.
 * @route POST /contratos/:id/arquivar
 */
routes.post(
  "/contratos/:id/arquivar",
  authMiddleware,
  ContractsController.archive.bind(ContractsController)
);

/**
 * Rota para manter um contrato como LATE.
 * @route POST /contratos/:id/manter-late
 */
routes.post(
  "/contratos/:id/manter-late",
  authMiddleware,
  ContractsController.keepLate.bind(ContractsController)
);

// ============ MÉTODOS PUT ============

/**
 * Rota para atualizar um contrato.
 * @route PUT /contratos/:id
 */
routes.put(
  "/contratos/:id",
  authMiddleware,
  ContractsController.update.bind(ContractsController)
);

// ============ MÉTODOS DELETE ============

/**
 * Rota para deletar um contrato.
 * @route DELETE /contratos/:id
 */
routes.delete(
  "/contratos/:id",
  authMiddleware,
  ContractsController.destroy.bind(ContractsController)
);

// ============ ROTAS DE PDF ============

/**
 * @swagger
 * /contratos/{id}/gerar-pdf:
 *   post:
 *     summary: Gera o PDF do contrato
 *     tags: [Contratos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: PDF gerado com sucesso
 *       404:
 *         description: Contrato não encontrado
 */
routes.post(
  '/contratos/:id/gerar-pdf',
  authMiddleware,
  ContractsController.generatePdf.bind(ContractsController)
);

/**
 * @swagger
 * /contratos/{id}/download:
 *   get:
 *     summary: Baixa o PDF do contrato
 *     tags: [Contratos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Arquivo PDF
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: PDF não encontrado
 */
routes.get(
  '/contratos/:id/download',
  authMiddleware,
  ContractsController.downloadPdf.bind(ContractsController)
);

/**
 * @swagger
 * /contratos/{id}/regenerar-pdf:
 *   post:
 *     summary: Regenera o PDF do contrato (apaga o antigo e gera novo)
 *     tags: [Contratos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: PDF regenerado
 *       404:
 *         description: Contrato não encontrado
 */
routes.post(
  '/contratos/:id/regenerar-pdf',
  authMiddleware,
  ContractsController.regeneratePdf.bind(ContractsController)
);

export default routes;
