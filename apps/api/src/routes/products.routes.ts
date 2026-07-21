/**
 * @file produtos.routes.ts
 * @description Rotas para gerenciamento de produtos.
 * Inclui CRUD completo com autenticação.
 */

import { Router } from "express";
import produtos from "../app/controllers/ProductsController.js";
import authMiddleware from "../app/middlewares/auth.js";

/**
 * Instância do roteador para rotas de produtos.
 * @type {Router}
 */
const routes = Router();

/**
 * @swagger
 * tags:
 *   - name: Produtos
 *     description: Gerenciamento de produtos
 */

/**
 * @swagger
 * /produtos:
 *   get:
 *     summary: Lista todos os produtos com filtros e paginação do usuário autenticado
 *     description: Retorna apenas os produtos criados pelo usuário logado.
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: nome
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoria_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: precoMin
 *         schema:
 *           type: number
 *       - in: query
 *         name: precoMax
 *         schema:
 *           type: number
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
 *         description: Lista de produtos
 */

/**
 * Rota para listar todos os produtos.
 * @route GET /produtos
 * @description Retorna uma lista paginada de produtos com filtros (nome, categoria, faixa de preço, etc.).
 * @security bearerAuth
 * @returns {Array<Object>} Lista de produtos
 */
routes.get("/produtos", authMiddleware, produtos.index);

/**
 * @swagger
 * /produtos:
 *   post:
 *     summary: Cria um novo produto
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome, descricao, preco_aluguel, quantidade_total, categoria_id]
 *             properties:
 *               nome:
 *                 type: string
 *               descricao:
 *                 type: string
 *               preco_aluguel:
 *                 type: number
 *               quantidade_total:
 *                 type: integer
 *               categoria_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Produto criado
 */

/**
 * Rota para criar um novo produto.
 * @route POST /produtos
 * @description Cria um novo produto, com quantidade_disponivel inicial igual à quantidade_total.
 * @security bearerAuth
 * @param {Object} req.body - Dados do produto
 * @returns {Object} Produto criado
 */
routes.post("/produtos", authMiddleware, produtos.create);

/**
 * @swagger
 * /produtos/{id}:
 *   get:
 *     summary: Busca produto por ID
 *     tags: [Produtos]
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
 *         description: Produto encontrado
 *       404:
 *         description: Produto não encontrado
 */

/**
 * Rota para buscar um produto por ID.
 * @route GET /produtos/:id
 * @description Retorna os dados de um produto específico.
 * @security bearerAuth
 * @param {Object} req.params - Parâmetros da rota
 * @param {number} req.params.id - ID do produto
 * @returns {Object} Dados do produto
 */
routes.get("/produtos/:id", authMiddleware, produtos.show);

/**
 * Rota para atualizar um produto.
 * @route PUT /produtos/:id
 * @description Atualiza os dados de um produto, com validações de consistência de estoque.
 * @security bearerAuth
 * @param {Object} req.params - Parâmetros da rota
 * @param {number} req.params.id - ID do produto
 * @param {Object} req.body - Dados para atualização
 * @returns {Object} Produto atualizado
 */
routes.put("/produtos/:id", authMiddleware, produtos.update);

/**
 * @swagger
 * /produtos/{id}:
 *   delete:
 *     summary: Deleta um produto e sua imagem associada
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do produto a ser deletado
 *     responses:
 *       200:
 *         description: Produto deletado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Produto deletado com sucesso.
 *       400:
 *          description: Produto vinculado a contratos, não pode ser deletado
 *       404:
 *         description: Produto não encontrado
 *       401:
 *         description: Token ausente ou inválido
 *       500:
 *         description: Erro interno do servidor
 */
routes.delete("/produtos/:id", authMiddleware, produtos.destroy);
/**
 * Exporta o roteador de produtos.
 * @default
 */
export default routes;
