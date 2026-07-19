/**
 * @file routes.ts
 * @description Arquivo central de rotas da aplicação.
 * Agrupa e exporta todas as rotas dos módulos da aplicação.
 */

import { Router } from "express";

import usuariosRoutes from "./users.routes.js";
import passwordsRoutes from "./passwords.routes.js";
import authRoutes from "./auth.routes.js";
import categoriasRoutes from "./categories.routes.js";
import clientesRoutes from "./customers.routes.js";
import contratosRoutes from "./contracts.routes.js";
import itensContratoRoutes from "./contractItems.routes.js";
import produtosRoutes from "./products.routes.js";
import filesRoutes from "./files.routes.js";

/**
 * Instância principal do roteador Express.
 * @type {Router}
 * @description Router que agrupa todas as rotas da aplicação.
 */
const routes = Router();

/**
 * Registra todas as rotas da aplicação.
 * @description Agrupa rotas de autenticação, usuários, categorias, clientes,
 * contratos, itens de contrato, produtos e recuperação de senha.
 */
routes.use(authRoutes);
routes.use(usuariosRoutes);
routes.use(passwordsRoutes);
routes.use(categoriasRoutes);
routes.use(clientesRoutes);
routes.use(contratosRoutes);
routes.use(itensContratoRoutes);
routes.use(produtosRoutes);
routes.use(filesRoutes);

/**
 * Exporta o roteador configurado.
 * @default
 * @description Router contendo todas as rotas da aplicação.
 */
export default routes;
