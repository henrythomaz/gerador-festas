/**
 * @file ContractsProductsController.ts
 * @description Controlador responsável pelo gerenciamento de itens de contrato.
 * Implementa CRUD completo com validações, atualização de estoque e transações.
 */

import { Request, Response } from "express";
import { WhereOptions, Op } from "sequelize";
import * as Yup from "yup";

import ContractProduct from "../models/ContractProduct.js";
import Product from "../models/Product.js";
import Client from "../models/Client.js";
import ContractPdfService from "../../services/ContractPdfService.js";

// Utils
import dataInterval from "../utils/dataInterval.js";
import ordenation from "../utils/ordenation.js";

/**
 * Interface para parâmetros de rota com ID de item de contrato.
 * @interface ItemContratoIdParam
 */
interface ItemContratoIdParam {
  id: string;
}

/**
 * Interface para parâmetros de query da listagem.
 * @interface Query
 */
interface Query {
  contrato_id?: string;
  produto_id?: string;
  criadoAntes?: string;
  criadoDepois?: string;
  atualizadoAntes?: string;
  atualizadoDepois?: string;
  sort?: string;
  page?: string;
  limit?: string;
}

/**
 * Classe controladora de itens de contrato.
 * @class ContractsProductsController
 */
class ContractsProductsController {
  /**
   * Lista todos os itens de contrato com filtros e paginação.
   * @method index
   * @async
   * @param {Request} req
   * @param {Response} res
   * @returns {Promise<Response>}
   */
  async index(req: Request, res: Response) {
    try {
      const schema = Yup.object({
        contrato_id: Yup.number().integer().positive(),
        produto_id: Yup.number().integer().positive(),
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

      if (query.contrato_id) {
        and.push({ contrato_id: Number(query.contrato_id) });
      }
      if (query.produto_id) {
        and.push({ produto_id: Number(query.produto_id) });
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

      const itens = await ContractProduct.findAll({
        where,
        order: ordenation(query.sort),
        limit,
        offset: (page - 1) * limit,
      });

      return res.json(itens);
    } catch (err: any) {
      return res.status(400).json({ erro: err.message });
    }
  }

  /**
   * Busca um item de contrato por ID.
   * @method show
   * @async
   * @param {Request<ItemContratoIdParam>} req
   * @param {Response} res
   * @returns {Promise<Response>}
   */
  async show(req: Request<ItemContratoIdParam>, res: Response) {
    const item = await ContractProduct.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json();
    }

    return res.json(item);
  }

  /**
   * Cria um novo item de contrato.
   * @method create
   * @async
   * @description O preço unitário é obtido automaticamente do produto.
   * A quantidade disponível do produto é decrementada.
   * O total do contrato é recalculado.
   * Após o commit, o PDF do contrato é regenerado.
   * @param {Request} req
   * @param {Response} res
   * @returns {Promise<Response>}
   */
  async create(req: Request, res: Response) {
    const { body } = req;

    const schema = Yup.object().shape({
      contrato_id: Yup.number().integer().positive().required(),
      produto_id: Yup.number().integer().positive().required(),
      quantidade: Yup.number().integer().positive().required(),
    });

    if (!(await schema.isValid(body))) {
      return res.status(400).json({ erro: "Erro ao validar schema." });
    }

    const produto = await Product.findByPk(body.produto_id);
    if (!produto) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }

    if (produto.quantidade_disponivel < body.quantidade) {
      return res.status(400).json({
        erro: `Estoque insuficiente. Disponível: ${produto.quantidade_disponivel}`,
      });
    }

    const precoUnitario = produto.preco_aluguel;
    const subtotal = body.quantidade * precoUnitario;

    const transaction = await ContractProduct.sequelize!.transaction();

    try {
      // Cria o item de contrato
      const novoItem = await ContractProduct.create(
        {
          contrato_id: body.contrato_id,
          produto_id: body.produto_id,
          quantidade: body.quantidade,
          preco_unitario: precoUnitario,
          subtotal,
        },
        { transaction }
      );

      // Atualiza a quantidade disponível do produto
      await produto.update(
        {
          quantidade_disponivel:
            produto.quantidade_disponivel - body.quantidade,
        },
        { transaction }
      );

      // Recalcula o total do contrato (sem regenerar PDF)
      await ContractProduct.updateContractTotal(body.contrato_id, transaction);

      await transaction.commit();

      // ===== APÓS O COMMIT: regenera o PDF do contrato =====
      try {
        await ContractPdfService.regenerate(body.contrato_id);
      } catch (pdfError: any) {
        console.error(
          `[ContractsProductsController] Erro ao regenerar PDF do contrato #${body.contrato_id} após criação de item:`,
          pdfError.message
        );
        // Não interrompe a resposta
      }

      return res.status(201).json(novoItem);
    } catch (err: any) {
      await transaction.rollback();
      return res.status(500).json({ erro: err.message });
    }
  }

  /**
   * Atualiza os dados de um item de contrato (quantidade, por exemplo).
   * @method update
   * @async
   * @description Ajusta o subtotal e atualiza a disponibilidade do produto.
   * O total do contrato é recalculado.
   * Após o commit, o PDF do contrato é regenerado.
   * @param {Request<ItemContratoIdParam>} req
   * @param {Response} res
   * @returns {Promise<Response>}
   */
  async update(req: Request<ItemContratoIdParam>, res: Response) {
    const item = await ContractProduct.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json();
    }

    const schema = Yup.object().shape({
      quantidade: Yup.number().integer().positive(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ erro: "Erro ao validar schema." });
    }

    if (req.body.quantidade === undefined) {
      return res
        .status(400)
        .json({ erro: "Nenhum campo atualizável fornecido." });
    }

    const novaQuantidade = req.body.quantidade;
    const diferenca = novaQuantidade - item.quantidade;

    const produto = await Product.findByPk(item.produto_id);
    if (!produto) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }

    if (diferenca > 0 && produto.quantidade_disponivel < diferenca) {
      return res.status(400).json({
        erro: `Estoque insuficiente para aumento. Disponível: ${produto.quantidade_disponivel}`,
      });
    }

    const transaction = await ContractProduct.sequelize!.transaction();

    try {
      const novoSubtotal = novaQuantidade * item.preco_unitario;
      await item.update(
        {
          quantidade: novaQuantidade,
          subtotal: novoSubtotal,
        },
        { transaction }
      );

      // Atualiza a disponibilidade do produto
      await produto.update(
        {
          quantidade_disponivel: produto.quantidade_disponivel - diferenca,
        },
        { transaction }
      );

      // Recalcula o total do contrato (sem regenerar PDF)
      await ContractProduct.updateContractTotal(item.contrato_id, transaction);

      await transaction.commit();

      // ===== APÓS O COMMIT: regenera o PDF do contrato =====
      try {
        await ContractPdfService.regenerate(item.contrato_id);
      } catch (pdfError: any) {
        console.error(
          `[ContractsProductsController] Erro ao regenerar PDF do contrato #${item.contrato_id} após atualização de item:`,
          pdfError.message
        );
        // Não interrompe a resposta
      }

      return res.json(item);
    } catch (err: any) {
      await transaction.rollback();
      return res.status(500).json({ erro: err.message });
    }
  }

  /**
   * Remove um item de contrato.
   * @method destroy
   * @async
   * @description Devolve a quantidade ao estoque do produto e recalcula o total do contrato.
   * Após o commit, o PDF do contrato é regenerado.
   * @param {Request<ItemContratoIdParam>} req
   * @param {Response} res
   * @returns {Promise<Response>}
   */
  async destroy(req: Request<ItemContratoIdParam>, res: Response) {
    const item = await ContractProduct.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json();
    }

    const produto = await Product.findByPk(item.produto_id);
    if (!produto) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }

    const cliente = await Product.findByPk(item.cliente_id);
    if (!cliente) {
      return res.status(404).json({ erro: "Cliente não encontrado." });
    }

    const transaction = await ContractProduct.sequelize!.transaction();

    try {
      // Deleta o item
      await item.destroy({ transaction });

      // Devolve a quantidade ao estoque
      await produto.update(
        {
          quantidade_disponivel:
            produto.quantidade_disponivel + item.quantidade,
        },
        { transaction }
      );

      // Atualiza Status do Cliente
      await cliente.update(
        {
          status: "ARCHIVED",
        },
        { transaction }
      );

      // Recalcula o total do contrato (sem regenerar PDF)
      await ContractProduct.updateContractTotal(item.contrato_id, transaction);

      await transaction.commit();

      // ===== APÓS O COMMIT: regenera o PDF do contrato =====
      try {
        await ContractPdfService.regenerate(item.contrato_id);
      } catch (pdfError: any) {
        console.error(
          `[ContractsProductsController] Erro ao regenerar PDF do contrato #${item.contrato_id} após exclusão de item:`,
          pdfError.message
        );
        // Não interrompe a resposta
      }

      return res.json();
    } catch (err: any) {
      await transaction.rollback();
      return res.status(500).json({ erro: err.message });
    }
  }
}

export default new ContractsProductsController();
