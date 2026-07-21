/**
 * @file itensContrato.routes.ts
 * @description Rotas para gerenciamento de itens de contrato (produtos alugados).
 * Inclui CRUD completo com autenticação.
 */

import { Router } from "express";
import itensContrato from "../app/controllers/ContractsProductsController.js";
import authMiddleware from "../app/middlewares/auth.js";

/**
 * Instância do roteador para rotas de itens de contrato.
 * @type {Router}
 */
const routes = Router();

/**
 * @swagger
 * tags:
 *   - name: Itens Contrato
 *     description: Gerenciamento de itens de contrato
 */

/**
 * @swagger
 * /itens-contrato:
 *   get:
 *     summary: Lista todos os itens de contrato com filtros e paginação do usuário autenticado
 *     description: Retorna apenas os itens de contrato criados pelo usuário logado.
 *     tags: [Itens Contrato]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: contrato_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: produto_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de itens
 */

/**
 * Rota para listar todos os itens de contrato.
 * @route GET /itens-contrato
 * @description Retorna uma lista paginada de itens de contrato com filtros.
 * @security bearerAuth
 * @returns {Array<Object>} Lista de itens
 */
routes.get("/itens-contrato", authMiddleware, itensContrato.index);

/**
 * @swagger
 * /itens-contrato:
 *   post:
 *     summary: Cria um novo item no contrato
 *     tags: [Itens Contrato]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [contrato_id, produto_id, quantidade, preco_unitario]
 *             properties:
 *               contrato_id:
 *                 type: integer
 *               produto_id:
 *                 type: integer
 *               quantidade:
 *                 type: integer
 *               preco_unitario:
 *                 type: number
 *     responses:
 *       201:
 *         description: Item criado
 */

/**
 * Rota para criar um novo item de contrato.
 * @route POST /itens-contrato
 * @description Cria um novo item (produto alugado) no contrato. O subtotal é calculado automaticamente.
 * @security bearerAuth
 * @param {Object} req.body - Dados do item
 * @returns {Object} Item criado
 */
routes.post("/itens-contrato", authMiddleware, itensContrato.create);

/**
 * @swagger
 * /itens-contrato/{id}:
 *   get:
 *     summary: Busca item por ID
 *     tags: [Itens Contrato]
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
 *         description: Item encontrado
 *       404:
 *         description: Item não encontrado
 */

/**
 * Rota para buscar um item de contrato por ID.
 * @route GET /itens-contrato/:id
 * @description Retorna os dados de um item específico.
 * @security bearerAuth
 * @param {Object} req.params - Parâmetros da rota
 * @param {number} req.params.id - ID do item
 * @returns {Object} Dados do item
 */
routes.get("/itens-contrato/:id", authMiddleware, itensContrato.show);

/**
 * Rota para atualizar um item de contrato.
 * @route PUT /itens-contrato/:id
 * @description Atualiza quantidade e/ou preço unitário, recalculando o subtotal.
 * @security bearerAuth
 * @param {Object} req.params - Parâmetros da rota
 * @param {number} req.params.id - ID do item
 * @param {Object} req.body - Dados para atualização
 * @returns {Object} Item atualizado
 */
routes.put("/itens-contrato/:id", authMiddleware, itensContrato.update);

/**
 * Rota para deletar um item de contrato.
 * @route DELETE /itens-contrato/:id
 * @description Remove um item de contrato do sistema.
 * @security bearerAuth
 * @param {Object} req.params - Parâmetros da rota
 * @param {number} req.params.id - ID do item
 * @returns {Object} Confirmação de exclusão
 */
routes.delete("/itens-contrato/:id", authMiddleware, itensContrato.destroy);

/**
 * Exporta o roteador de itens de contrato.
 * @default
 */
export default routes;
