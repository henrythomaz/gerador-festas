/**
 * @file usuarios.routes.ts
 * @description Rotas para gerenciamento de usuários.
 * Inclui CRUD completo com autenticação para rotas protegidas.
 */

import { Router } from "express";
import usuarios from "../app/controllers/UsersController.js";
import authMiddleware from "../app/middlewares/auth.js";

/**
 * Instância do roteador para rotas de usuários.
 * @type {Router}
 */
const routes = Router();

/**
 * @swagger
 * tags:
 *   - name: Usuarios
 *     description: Gerenciamento de usuários
 */

/**
 * @swagger
 * /usuarios:
 *   get:
 *     summary: Lista todos os usuários
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários retornada com sucesso
 */

/**
 * Rota para listar todos os usuários.
 * @route GET /usuarios
 * @description Retorna uma lista com todos os usuários cadastrados.
 * @security bearerAuth - Requer token JWT válido
 * @returns {Array<Object>} Lista de usuários
 */
routes.get("/usuarios", authMiddleware, usuarios.index);

/**
 * @swagger
 * /usuarios:
 *   post:
 *     summary: Cria um novo usuário
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome, email, password]
 *             properties:
 *               nome:
 *                 type: string
 *                 example: Henry Campos
 *               email:
 *                 type: string
 *                 example: henry@email.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 */

/**
 * Rota para criar um novo usuário.
 * @route POST /usuarios
 * @description Cria um novo usuário no sistema.
 * @param {Object} req.body - Dados do usuário
 * @param {string} req.body.nome - Nome completo do usuário
 * @param {string} req.body.email - Email do usuário
 * @param {string} req.body.password - Senha do usuário
 * @returns {Object} Dados do usuário criado
 */
routes.post("/usuarios", usuarios.create);

/**
 * @swagger
 * /usuarios/{id}:
 *   get:
 *     summary: Busca usuário por ID
 *     tags: [Usuarios]
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
 *         description: Usuário encontrado
 *       404:
 *         description: Usuário não encontrado
 */

/**
 * Rota para buscar um usuário por ID.
 * @route GET /usuarios/:id
 * @description Retorna os dados de um usuário específico.
 * @security bearerAuth - Requer token JWT válido
 * @param {Object} req.params - Parâmetros da rota
 * @param {number} req.params.id - ID do usuário
 * @returns {Object} Dados do usuário
 */
routes.get("/usuarios/:id", authMiddleware, usuarios.show);

/**
 * Rota para atualizar um usuário.
 * @route PUT /usuarios/:id
 * @description Atualiza os dados de um usuário específico.
 * @security bearerAuth - Requer token JWT válido
 * @param {Object} req.params - Parâmetros da rota
 * @param {number} req.params.id - ID do usuário
 * @param {Object} req.body - Dados para atualização
 * @returns {Object} Dados do usuário atualizado
 */
routes.put("/usuarios/:id", authMiddleware, usuarios.update);

/**
 * @swagger
 * /usuarios/{id}:
 *   delete:
 *     summary: Deleta a própria conta e todos os dados associados (contratos, clientes, produtos, categorias, arquivos)
 *     description: Remove permanentemente o usuário e todos os registros relacionados (contratos, itens, clientes, produtos, categorias, arquivos físicos). Ação irreversível.
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário (deve ser o mesmo do token)
 *     responses:
 *       200:
 *         description: Conta deletada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Conta e todos os dados associados foram deletados com sucesso.
 *       403:
 *         description: Sem permissão para deletar esta conta
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
routes.delete("/usuarios/:id", authMiddleware, usuarios.destroy);

// routes.get("/usuarios/:id/aprovar", usuarios.aprovar);

/**
 * Exporta o roteador de usuários.
 * @default
 */
export default routes;
