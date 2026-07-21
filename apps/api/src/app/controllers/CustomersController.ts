/**
 * @file CustomersController.ts
 * @description Controlador responsável pelo gerenciamento de clientes.
 * Implementa CRUD completo com validações, filtros, paginação e ordenação.
 */

import { Request, Response } from "express";
import { WhereOptions, Op } from "sequelize";
import * as Yup from "yup";

import Customer from "../models/Customer.js";
import Contract from "../models/Contract.js";
import ContractPdfService from "../../services/ContractPdfService.js";

// Utils
import likeFilter from "../utils/likeFilter.js";
import dataInterval from "../utils/dataInterval.js";
import ordenation from "../utils/ordenation.js";

/**
 * Interface para parâmetros de rota com ID de cliente.
 * @interface ClienteIdParam
 */
interface ClienteIdParam {
  id: string;
}

/**
 * Interface para parâmetros de query da listagem.
 * @interface Query
 */
interface Query {
  nome?: string;
  telefone?: string;
  cpf?: string;
  email?: string;
  status?: string;
  criadoAntes?: string;
  criadoDepois?: string;
  atualizadoAntes?: string;
  atualizadoDepois?: string;
  sort?: string;
  page?: string;
  limit?: string;
}

/**
 * Classe controladora de clientes.
 * @class CustomersController
 * @description Gerencia todas as operações relacionadas a clientes:
 * criação, listagem, visualização, atualização e exclusão.
 */
class CustomersController {
  /**
   * Lista todos os clientes com filtros e paginação.
   * @method index
   * @async
   * @description Retorna uma lista paginada de clientes com suporte a filtros.
   * @param {Request} req - Objeto de requisição Express
   * @param {Response} res - Objeto de resposta Express
   * @returns {Promise<Response>} Resposta JSON com lista de clientes
   *
   * @example
   * // GET /clientes?nome=Joao&status=ACTIVE&page=1&limit=10
   */
  async index(req: Request, res: Response) {
    try {
      const schema = Yup.object({
        nome: Yup.string(),
        telefone: Yup.string(),
        cpf: Yup.string(),
        email: Yup.string(),
        status: Yup.string().oneOf(["ACTIVE", "ARCHIVED"]),
        criadoAntes: Yup.date(),
        criadoDepois: Yup.date(),
        atualizadoAntes: Yup.date(),
        atualizadoDepois: Yup.date(),
        sort: Yup.string(),
        page: Yup.number().min(1),
        limit: Yup.number().min(1).max(100),
      });

      const query = await schema.validate(req.query, {
        stripUnknown: true,
      });

      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 25;

      const where: WhereOptions = {};
      const and: any[] = [];

      and.push({ usuario_id: req.userId });

      likeFilter(and, "nome", query.nome);
      likeFilter(and, "telefone", query.telefone);
      likeFilter(and, "cpf", query.cpf);
      likeFilter(and, "email", query.email);

      if (query.status) {
        and.push({ status: query.status });
      }

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

      const clientes = await Customer.findAll({
        where,
        order: ordenation(query.sort),
        limit,
        offset: (page - 1) * limit,
      });

      return res.json(clientes);
    } catch (err: any) {
      return res.status(400).json({ erro: err.message });
    }
  }

  /**
   * Busca um cliente por ID.
   * @method show
   * @async
   * @description Retorna os dados completos de um cliente específico.
   * @param {Request<ClienteIdParam>} req - Objeto de requisição Express com parâmetro ID
   * @param {Response} res - Objeto de resposta Express
   * @returns {Promise<Response>} Resposta JSON com dados do cliente
   *
   * @example
   * // GET /clientes/1
   */
  async show(req: Request<ClienteIdParam>, res: Response) {
    const cliente = await Customer.findOne({
      where: { id: req.params.id, usuario_id: req.userId },
    });

    if (!cliente) {
      return res.status(404).json();
    }

    return res.json(cliente);
  }

  /**
   * Cria um novo cliente.
   * @method create
   * @async
   * @description Valida os dados, verifica duplicidade de CPF/email e cria o cliente.
   * @param {Request} req - Objeto de requisição Express
   * @param {Response} res - Objeto de resposta Express
   * @returns {Promise<Response>} Resposta JSON com dados do cliente criado
   *
   * @example
   * // POST /clientes
   * // Request body
   * {
   *   "nome": "João Silva",
   *   "telefone": "(11) 99999-9999",
   *   "cpf": "12345678900",
   *   "email": "joao@email.com",
   *   "status": "ACTIVE"
   * }
   */
  async create(req: Request, res: Response) {
    const { body } = req;

    const schema = Yup.object().shape({
      nome: Yup.string().required(),
      telefone: Yup.string().required(),
      cpf: Yup.string()
        .required()
        .matches(/^\d{11}$/, "CPF deve ter 11 dígitos"),
      email: Yup.string().email().required(),
      status: Yup.string().oneOf(["ACTIVE", "ARCHIVED"]).default("ACTIVE"),
    });

    if (!(await schema.isValid(body))) {
      return res.status(400).json({ erro: "Erro ao validar schema." });
    }

    const clienteCpfExiste = await Customer.findOne({
      where: { cpf: body.cpf, usuario_id: req.userId },
    });

    if (clienteCpfExiste) {
      return res.status(409).json({ erro: "CPF já cadastrado." });
    }

    const clienteEmailExiste = await Customer.findOne({
      where: { email: body.email, usuario_id: req.userId },
    });

    if (clienteEmailExiste) {
      return res.status(409).json({ erro: "Email já cadastrado." });
    }

    const novoCliente = await Customer.create({
      ...body,
      usuario_id: req.userId,
    });

    return res.status(201).json(novoCliente);
  }

  /**
   * Atualiza os dados de um cliente.
   * @method update
   * @async
   * @param {Request<ClienteIdParam>} req
   * @param {Response} res
   * @returns {Promise<Response>}
   */
  async update(req: Request<ClienteIdParam>, res: Response) {
    const cliente = await Customer.findOne({
      where: { id: req.params.id, usuario_id: req.userId },
    });

    if (!cliente) {
      return res.status(404).json({ erro: "Cliente não encontrado." });
    }

    const schema = Yup.object().shape({
      nome: Yup.string(),
      telefone: Yup.string(),
      cpf: Yup.string().matches(/^\d{11}$/, "CPF deve ter 11 dígitos"),
      email: Yup.string().email(),
      status: Yup.string().oneOf(["ACTIVE", "ARCHIVED"]),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ erro: "Erro ao validar schema." });
    }

    // ===== NOVA VERIFICAÇÃO: impedir arquivamento se houver contratos ativos =====
    if (req.body.status === "ARCHIVED" && cliente.status !== "ARCHIVED") {
      const contratosAtivos = await Contract.count({
        where: {
          cliente_id: cliente.id,
          status: { [Op.in]: ["ACTIVE", "LATE"] },
        },
      });

      if (contratosAtivos > 0) {
        return res.status(409).json({
          erro: "Não é possível arquivar o cliente, pois ele possui contratos ativos ou em atraso.",
        });
      }
    }

    // Verificações de unicidade de CPF e email (já existentes)
    if (req.body.cpf && req.body.cpf !== cliente.cpf) {
      const cpfExiste = await Customer.findOne({
        where: { cpf: req.body.cpf, usuario_id: req.userId },
      });
      if (cpfExiste) {
        return res
          .status(409)
          .json({ erro: "CPF já cadastrado para este usuário." });
      }
    }

    if (req.body.email && req.body.email !== cliente.email) {
      const emailExiste = await Customer.findOne({
        where: { email: req.body.email, usuario_id: req.userId },
      });
      if (emailExiste) {
        return res
          .status(409)
          .json({ erro: "Email já cadastrado por outro cliente." });
      }
    }

    // Atualiza o cliente
    const clienteAtualizado = await cliente.update(req.body);

    // Regenera PDFs dos contratos do cliente (se houver)
    const contratos = await Contract.findAll({
      where: { cliente_id: cliente.id },
    });

    for (const contrato of contratos) {
      try {
        await ContractPdfService.regenerate(contrato.id!);
      } catch (pdfError: any) {
        console.error(
          `[CustomersController] Erro ao regenerar PDF do contrato #${contrato.id} após atualização do cliente #${cliente.id}:`,
          pdfError.message
        );
      }
    }

    return res.json(clienteAtualizado);
  }

  /**
   * Remove um cliente.
   * @method destroy
   * @async
   * @description Exclui permanentemente um cliente do sistema.
   * @param {Request<ClienteIdParam>} req - Objeto de requisição Express com parâmetro ID
   * @param {Response} res - Objeto de resposta Express
   * @returns {Promise<Response>} Resposta vazia com status 200
   *
   * @example
   * // DELETE /clientes/1
   */
  async destroy(req: Request<ClienteIdParam>, res: Response) {
    const cliente = await Customer.findOne({
      where: { id: req.params.id, usuario_id: req.userId },
    });

    if (!cliente) {
      return res.status(404).json();
    }

    await cliente.destroy();

    return res.json();
  }
}

export default new CustomersController();
