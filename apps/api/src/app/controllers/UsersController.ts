/**
 * @file UsersController.ts
 * @description Controlador responsável pelo gerenciamento de usuários.
 * Implementa CRUD completo com validações, filtros, paginação e envio de emails.
 */

import { Request, Response } from "express";
import crypto from "crypto";
import { WhereOptions, Op } from "sequelize";
import * as Yup from "yup";

import User from "../models/User.js";
import File from "../models/File.js";

import Queue from "../../lib/Queue.js";
import WelcomeEmailJob from "../jobs/WelcomeEmailJob.js";
import ConfirmEmailJob from "../jobs/ConfirmEmailJob.js";

// Utils
import likeFilter from "../utils/likeFilter.js";
import dataInterval from "../utils/dataInterval.js";
import ordenation from "../utils/ordenation.js";

/**
 * Interface para parâmetros de rota com ID de usuário.
 * @interface UsuarioIdParam
 */
interface UsuarioIdParam {
  id: string;
}

/**
 * Interface para parâmetros de query da listagem.
 * @interface Query
 */
interface Query {
  nome?: string;
  email?: string;
  criadoAntes?: string;
  criadoDepois?: string;
  atualizadoAntes?: string;
  atualizadoDepois?: string;
  sort?: string;
  page?: string;
  limit?: string;
}

/**
 * Classe controladora de usuários.
 * @class UsersController
 * @description Gerencia todas as operações relacionadas a usuários:
 * criação, listagem, visualização, atualização e exclusão.
 */
class UsersController {
  /**
   * Lista todos os usuários com filtros e paginação.
   * @method index
   * @async
   * @description Retorna uma lista paginada de usuários com suporte a filtros.
   * @param {Request} req - Objeto de requisição Express
   * @param {Response} res - Objeto de resposta Express
   * @returns {Promise<Response>} Resposta JSON com lista de usuários
   *
   * @example
   * // GET /usuarios?nome=Joao&page=1&limit=10
   */
  async index(req: Request, res: Response) {
    try {
      /**
       * Schema de validação para os parâmetros de query.
       * @type {Yup.ObjectSchema}
       */
      const schema = Yup.object({
        nome: Yup.string(),
        email: Yup.string(),
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

      // Aplica filtros LIKE para nome e email
      likeFilter(and, "nome", query.nome);
      likeFilter(and, "email", query.email);

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
       * Busca os usuários com os filtros aplicados.
       * @type {User[]}
       */
      const usuarios = await User.findAll({
        where,
        attributes: ["id", "nome", "email"],
        order: ordenation(query.sort),
        limit,
        offset: (page - 1) * limit,
      });

      return res.json(usuarios);
    } catch (err: any) {
      return res.status(400).json({ erro: err.message });
    }
  }

  /**
   * Busca um usuário por ID.
   * @method show
   * @async
   * @description Retorna os dados completos de um usuário específico.
   * @param {Request<UsuarioIdParam>} req - Objeto de requisição Express com parâmetro ID
   * @param {Response} res - Objeto de resposta Express
   * @returns {Promise<Response>} Resposta JSON com dados do usuário
   *
   * @example
   * // GET /usuarios/1
   */
  async show(req: Request<UsuarioIdParam>, res: Response) {
    /**
     * Busca o usuário pelo ID.
     * @type {User|null}
     */
    const usuario = await User.findByPk(req.params.id, {
      include: [
        { model: File, as: "avatar", attributes: ["id", "nome", "caminho"] },
      ],
    });

    if (!usuario) {
      return res.status(404).json();
    }

    return res.json(usuario);
  }

  /**
   * Cria um novo usuário.
   * @method create
   * @async
   * @description Valida os dados, cria o usuário, gera token de confirmação
   * e envia emails de boas-vindas e confirmação.
   * @param {Request} req - Objeto de requisição Express
   * @param {Response} res - Objeto de resposta Express
   * @returns {Promise<Response>} Resposta JSON com dados do usuário criado
   *
   * @example
   * // POST /usuarios
   * // Request body
   * {
   *   "nome": "Henry Campos",
   *   "email": "henry@email.com",
   *   "senha": "12345678",
   *   "confirmarSenha": "12345678"
   * }
   */
  async create(req: Request, res: Response) {
    const { body } = req;

    /**
     * Schema de validação para criação de usuário.
     * @type {Yup.ObjectSchema}
     */
    const schema = Yup.object().shape({
      nome: Yup.string().required(),
      email: Yup.string().email().required(),
      senha: Yup.string().required().min(8),
      confirmarSenha: Yup.string().oneOf([Yup.ref("senha")], "Senha não bate."),
      file_id: Yup.number().integer().positive().nullable(),
    });

    if (!(await schema.isValid(body))) {
      return res.status(400).json({ erro: "Erro ao validar schema." });
    }

    /**
     * Verifica se o email já está cadastrado.
     * @type {User|null}
     */
    const usuarioExiste = await User.findOne({
      where: { email: body.email },
    });

    if (usuarioExiste) {
      return res.status(409).json({
        erro: "Usuário com este email já existe.",
      });
    }

    /**
     * Gera token para confirmação de email.
     * @type {string}
     */
    const token = crypto.randomBytes(32).toString("hex");

    /**
     * Cria o novo usuário no banco de dados.
     * @type {User}
     */
    const novoUsuario = await User.create({
      ...body,
      email_confirmado: false,
      aprovado: false,
      email_confirmacao_token: token,
    });

    const { id, nome, email, file_id } = novoUsuario;

    /**
     * Adiciona jobs à fila para envio de emails.
     */
    await Queue.add(ConfirmEmailJob.key, {
      nome,
      email,
      token,
    });

    await Queue.add(WelcomeEmailJob.key, { nome, email });

    return res.status(201).json({ id, nome, email, file_id });
  }

  /**
   * Atualiza os dados de um usuário.
   * @method update
   * @async
   * @description Atualiza os campos permitidos (nome e email) de um usuário.
   * @param {Request<UsuarioIdParam>} req - Objeto de requisição Express com parâmetro ID
   * @param {Response} res - Objeto de resposta Express
   * @returns {Promise<Response>} Resposta JSON com dados atualizados
   *
   * @example
   * // PUT /usuarios/1
   * // Request body
   * {
   *   "nome": "Novo Nome",
   *   "email": "novo@email.com"
   * }
   */
  async update(req: Request<UsuarioIdParam>, res: Response) {
    /**
     * Busca o usuário pelo ID.
     * @type {User|null}
     */
    const usuario = await User.findByPk(req.params.id);

    if (!usuario) {
      return res.status(404).json();
    }

    /**
     * Schema de validação para atualização de usuário.
     * @type {Yup.ObjectSchema}
     */
    const schema = Yup.object().shape({
      nome: Yup.string(),
      email: Yup.string().email(),
      file_id: Yup.number().integer().positive().nullable(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ erro: "Erro ao validar schema." });
    }

    /**
     * Atualiza o usuário no banco de dados.
     * @type {User}
     */
    const usuarioAtualizado = await usuario.update(req.body);

    const { id, nome, email, file_id } = usuarioAtualizado;

    return res.json({ id, nome, email, file_id });
  }

  /**
   * Remove um usuário.
   * @method destroy
   * @async
   * @description Exclui permanentemente um usuário do sistema.
   * @param {Request<UsuarioIdParam>} req - Objeto de requisição Express com parâmetro ID
   * @param {Response} res - Objeto de resposta Express
   * @returns {Promise<Response>} Resposta vazia com status 200
   *
   * @example
   * // DELETE /usuarios/1
   */
  async destroy(req: Request<UsuarioIdParam>, res: Response) {
    /**
     * Busca o usuário pelo ID.
     * @type {User|null}
     */
    const usuario = await User.findByPk(req.params.id);

    if (!usuario) {
      return res.status(404).json();
    }

    /**
     * Remove o usuário do banco de dados.
     */
    await usuario.destroy();

    return res.json();
  }

  /**
   * Confirma o email do usuário.
   * @method confirmarEmail
   * @async
   * @description Valida o token de confirmação e ativa a conta do usuário.
   * @param {Request} req - Objeto de requisição Express
   * @param {Response} res - Objeto de resposta Express
   * @returns {Promise<Response>} Redireciona para a página de login do frontend
   *
   * @example
   * // GET /confirmar-email?token=abc123...
   */
  async confirmarEmail(req: Request, res: Response) {
    const { token } = req.query;

    /**
     * Busca o usuário pelo token de confirmação.
     * @type {User|null}
     */
    const usuario = await User.findOne({
      where: { email_confirmacao_token: token },
    });

    if (!usuario) {
      return res.status(400).json({ erro: "Token inválido" });
    }

    /**
     * Atualiza o usuário confirmando o email e removendo o token.
     */
    await usuario.update({
      email_confirmado: true,
      email_confirmacao_token: null,
    });

    /**
     * Redireciona para o frontend.
     */
    return res.redirect("http://localhost:5173/gerenciador-festas/#/login");
  }
}

/**
 * Exporta instância única do controlador.
 * @default
 */
export default new UsersController();
