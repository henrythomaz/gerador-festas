/**
 * @file CategoriesController.ts
 * @description Controlador responsável pelo gerenciamento de categorias.
 * Implementa CRUD completo com validações, filtros, paginação e ordenação.
 */

import { Request, Response } from "express";
import { WhereOptions, Op } from "sequelize";
import * as Yup from "yup";

import Category from "../models/Category.js";

// Utils
import likeFilter from "../utils/likeFilter.js";
import dataInterval from "../utils/dataInterval.js";
import ordenation from "../utils/ordenation.js";

/**
 * Interface para parâmetros de rota com ID de categoria.
 * @interface CategoriaIdParam
 */
interface CategoriaIdParam {
  id: string;
}

/**
 * Interface para parâmetros de query da listagem.
 * @interface Query
 */
interface Query {
  nome?: string;
  criadoAntes?: string;
  criadoDepois?: string;
  atualizadoAntes?: string;
  atualizadoDepois?: string;
  sort?: string;
  page?: string;
  limit?: string;
}

/**
 * Classe controladora de categorias.
 * @class CategoriesController
 * @description Gerencia todas as operações relacionadas a categorias:
 * criação, listagem, visualização, atualização e exclusão.
 */
class CategoriesController {
  /**
   * Lista todas as categorias com filtros e paginação.
   * @method index
   * @async
   * @description Retorna uma lista paginada de categorias com suporte a filtros.
   * @param {Request} req - Objeto de requisição Express
   * @param {Response} res - Objeto de resposta Express
   * @returns {Promise<Response>} Resposta JSON com lista de categorias
   *
   * @example
   * // GET /categorias?nome=Decora&page=1&limit=10
   */
  async index(req: Request, res: Response) {
    try {
      /**
       * Schema de validação para os parâmetros de query.
       * @type {Yup.ObjectSchema}
       */
      const schema = Yup.object({
        nome: Yup.string(),
        criadoAntes: Yup.date(),
        criadoDepois: Yup.date(),
        atualizadoAntes: Yup.date(),
        atualizadoDepois: Yup.date(),
        sort: Yup.string(),
        page: Yup.number().min(1),
        limit: Yup.number().min(1).max(100),
      });

      /**
       * Query validada e tipada.
       * @type {Query}
       */
      const query = await schema.validate(req.query, {
        stripUnknown: true,
      });

      /**
       * Configuração de paginação.
       */
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 25;

      /**
       * Construção da cláusula WHERE para filtros.
       * @type {WhereOptions}
       */
      const where: WhereOptions = {};
      const and: any[] = [];

      and.push({ user_id: req.userId });

      // Aplica filtros LIKE para nome
      likeFilter(and, "nome", query.nome);

      // Aplica filtros de data para criação e atualização
      const criado = dataInterval(query.criadoAntes, query.criadoDepois);
      if (criado) and.push({ criado_em: criado });

      const atualizado = dataInterval(
        query.atualizadoAntes,
        query.atualizadoDepois
      );
      if (atualizado) and.push({ atualizado_em: atualizado });

      if (and.length) {
        where[Op.and] = and;
      }

      /**
       * Busca as categorias com os filtros aplicados.
       * @type {Category[]}
       */
      const categorias = await Category.findAll({
        where,
        order: ordenation(query.sort),
        limit,
        offset: (page - 1) * limit,
      });

      return res.json(categorias);
    } catch (err: any) {
      return res.status(400).json({ erro: err.message });
    }
  }

  /**
   * Busca uma categoria por ID.
   * @method show
   * @async
   * @description Retorna os dados completos de uma categoria específica.
   * @param {Request<CategoriaIdParam>} req - Objeto de requisição Express com parâmetro ID
   * @param {Response} res - Objeto de resposta Express
   * @returns {Promise<Response>} Resposta JSON com dados da categoria
   *
   * @example
   * // GET /categorias/1
   */
  async show(req: Request<CategoriaIdParam>, res: Response) {
    /**
     * Busca a categoria pelo ID.
     * @type {Category|null}
     */
    const categoria = await Category.findOne({
      where: { id: req.params.id, user_id: req.userId },
    });

    if (!categoria) {
      return res.status(404).json();
    }

    return res.json(categoria);
  }

  /**
   * Cria uma nova categoria.
   * @method create
   * @async
   * @description Valida os dados e cria a categoria no banco.
   * @param {Request} req - Objeto de requisição Express
   * @param {Response} res - Objeto de resposta Express
   * @returns {Promise<Response>} Resposta JSON com dados da categoria criada
   *
   * @example
   * // POST /categorias
   * // Request body
   * {
   *   "nome": "Decoração"
   * }
   */
  async create(req: Request, res: Response) {
    const { body } = req;

    /**
     * Schema de validação para criação de categoria.
     * @type {Yup.ObjectSchema}
     */
    const schema = Yup.object().shape({
      nome: Yup.string().required(),
    });

    if (!(await schema.isValid(body))) {
      return res.status(400).json({ erro: "Erro ao validar schema." });
    }

    /**
     * Cria a nova categoria no banco de dados.
     * @type {Category}
     */
    const novaCategoria = await Category.create({
      ...body,
      user_id: req.userId,
    });

    return res.status(201).json(novaCategoria);
  }

  /**
   * Atualiza os dados de uma categoria.
   * @method update
   * @async
   * @description Atualiza os campos permitidos (nome) de uma categoria.
   * @param {Request<CategoriaIdParam>} req - Objeto de requisição Express com parâmetro ID
   * @param {Response} res - Objeto de resposta Express
   * @returns {Promise<Response>} Resposta JSON com dados atualizados
   *
   * @example
   * // PUT /categorias/1
   * // Request body
   * {
   *   "nome": "Decoração de Luxo"
   * }
   */
  async update(req: Request<CategoriaIdParam>, res: Response) {
    /**
     * Busca a categoria pelo ID.
     * @type {Category|null}
     */
    const categoria = await Category.findOne({
      where: { id: req.params.id, user_id: req.userId },
    });

    if (!categoria) {
      return res.status(404).json();
    }

    /**
     * Schema de validação para atualização de categoria.
     * @type {Yup.ObjectSchema}
     */
    const schema = Yup.object().shape({
      nome: Yup.string(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ erro: "Erro ao validar schema." });
    }

    /**
     * Atualiza a categoria no banco de dados.
     * @type {Category}
     */
    const categoriaAtualizada = await categoria.update(req.body);

    return res.json(categoriaAtualizada);
  }

  /**
   * Remove uma categoria.
   * @method destroy
   * @async
   * @description Exclui permanentemente uma categoria do sistema.
   * @param {Request<CategoriaIdParam>} req - Objeto de requisição Express com parâmetro ID
   * @param {Response} res - Objeto de resposta Express
   * @returns {Promise<Response>} Resposta vazia com status 200
   *
   * @example
   * // DELETE /categorias/1
   */
  async destroy(req: Request<CategoriaIdParam>, res: Response) {
    /**
     * Busca a categoria pelo ID.
     * @type {Category|null}
     */
    const categoria = await Category.findOne({
      where: { id: req.params.id, user_id: req.userId },
    });

    if (!categoria) {
      return res.status(404).json();
    }

    /**
     * Remove a categoria do banco de dados.
     */
    await categoria.destroy();

    return res.json();
  }
}

/**
 * Exporta instância única do controlador.
 * @default
 */
export default new CategoriesController();
