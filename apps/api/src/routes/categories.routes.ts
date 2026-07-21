/**
 * @file categorias.routes.ts
 * @description Rotas para gerenciamento de categorias.
 * Inclui CRUD completo com autenticação.
 */

import { Router } from "express";
import categorias from "../app/controllers/CategoriesController.js";
import authMiddleware from "../app/middlewares/auth.js";

/**
 * Instância do roteador para rotas de categorias.
 * @type {Router}
 */
const routes = Router();

/**
 * @swagger
 * tags:
 *   - name: Categorias
 *     description: Gerenciamento de categorias
 */

/**
 * @swagger
 * /categorias:
 *   get:
 *     summary: Lista todas as categorias do usuário autenticado
 *     description: Retorna apenas as categorias criadas pelo usuário logado.
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: nome
 *         schema:
 *           type: string
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
 *         description: Lista de categorias
 */

/**
 * Rota para listar todas as categorias.
 * @route GET /categorias
 * @description Retorna uma lista paginada de categorias com filtros.
 * @security bearerAuth
 * @returns {Array<Object>} Lista de categorias
 */
routes.get("/categorias", authMiddleware, categorias.index);

/**
 * @swagger
 * /categorias:
 *   post:
 *     summary: Cria uma nova categoria
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome]
 *             properties:
 *               nome:
 *                 type: string
 *                 example: Decoração
 *     responses:
 *       201:
 *         description: Categoria criada
 */

/**
 * Rota para criar uma nova categoria.
 * @route POST /categorias
 * @description Cria uma nova categoria no sistema.
 * @security bearerAuth
 * @param {Object} req.body - Dados da categoria
 * @param {string} req.body.nome - Nome da categoria
 * @returns {Object} Categoria criada
 */
routes.post("/categorias", authMiddleware, categorias.create);

/**
 * @swagger
 * /categorias/{id}:
 *   get:
 *     summary: Busca categoria por ID
 *     tags: [Categorias]
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
 *         description: Categoria encontrada
 *       404:
 *         description: Categoria não encontrada
 */

/**
 * Rota para buscar uma categoria por ID.
 * @route GET /categorias/:id
 * @description Retorna os dados de uma categoria específica.
 * @security bearerAuth
 * @param {Object} req.params - Parâmetros da rota
 * @param {number} req.params.id - ID da categoria
 * @returns {Object} Dados da categoria
 */
routes.get("/categorias/:id", authMiddleware, categorias.show);

/**
 * Rota para atualizar uma categoria.
 * @route PUT /categorias/:id
 * @description Atualiza os dados de uma categoria.
 * @security bearerAuth
 * @param {Object} req.params - Parâmetros da rota
 * @param {number} req.params.id - ID da categoria
 * @param {Object} req.body - Dados para atualização
 * @returns {Object} Categoria atualizada
 */
routes.put("/categorias/:id", authMiddleware, categorias.update);

/**
 * Rota para deletar uma categoria.
 * @route DELETE /categorias/:id
 * @description Remove uma categoria do sistema.
 * @security bearerAuth
 * @param {Object} req.params - Parâmetros da rota
 * @param {number} req.params.id - ID da categoria
 * @returns {Object} Confirmação de exclusão
 */
routes.delete("/categorias/:id", authMiddleware, categorias.destroy);

/**
 * Exporta o roteador de categorias.
 * @default
 */
export default routes;
