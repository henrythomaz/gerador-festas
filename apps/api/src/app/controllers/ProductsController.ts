/**
 * @file ProductsController.ts
 * @description Controlador responsável pelo gerenciamento de produtos.
 * Implementa CRUD completo com validações, filtros, paginação e ordenação.
 */

import { Request, Response } from "express";
import { WhereOptions, Op } from "sequelize";
import * as Yup from "yup";

import Product from "../models/Product.js";
import ContractProduct from "../models/ContractProduct.js";
import File from "../models/File.js";
import ContractPdfService from "../../services/ContractPdfService.js";

// Utils
import likeFilter from "../utils/likeFilter.js";
import dataInterval from "../utils/dataInterval.js";
import ordenation from "../utils/ordenation.js";

/**
 * Interface para parâmetros de rota com ID de produto.
 * @interface ProdutoIdParam
 */
interface ProdutoIdParam {
  id: string;
}

/**
 * Interface para parâmetros de query da listagem.
 * @interface Query
 */
interface Query {
  nome?: string;
  descricao?: string;
  categoria_id?: string;
  precoMin?: string;
  precoMax?: string;
  quantidadeDisponivelMin?: string;
  quantidadeDisponivelMax?: string;
  criadoAntes?: string;
  criadoDepois?: string;
  atualizadoAntes?: string;
  atualizadoDepois?: string;
  sort?: string;
  page?: string;
  limit?: string;
}

/**
 * Classe controladora de produtos.
 * @class ProductsController
 */
class ProductsController {
  /**
   * Lista todos os produtos com filtros e paginação.
   * @method index
   * @async
   * @param {Request} req - Objeto de requisição Express
   * @param {Response} res - Objeto de resposta Express
   * @returns {Promise<Response>}
   */
  async index(req: Request, res: Response) {
    try {
      const schema = Yup.object({
        nome: Yup.string(),
        descricao: Yup.string(),
        categoria_id: Yup.number().integer().positive(),
        precoMin: Yup.number().min(0),
        precoMax: Yup.number().min(0),
        quantidadeDisponivelMin: Yup.number().integer().min(0),
        quantidadeDisponivelMax: Yup.number().integer().min(0),
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

      likeFilter(and, "nome", query.nome);
      likeFilter(and, "descricao", query.descricao);

      if (query.categoria_id) {
        and.push({ categoria_id: Number(query.categoria_id) });
      }

      if (query.precoMin !== undefined || query.precoMax !== undefined) {
        const precoWhere: any = {};
        if (query.precoMin !== undefined) {
          precoWhere[Op.gte] = Number(query.precoMin);
        }
        if (query.precoMax !== undefined) {
          precoWhere[Op.lte] = Number(query.precoMax);
        }
        and.push({ preco_aluguel: precoWhere });
      }

      if (
        query.quantidadeDisponivelMin !== undefined ||
        query.quantidadeDisponivelMax !== undefined
      ) {
        const qtdWhere: any = {};
        if (query.quantidadeDisponivelMin !== undefined) {
          qtdWhere[Op.gte] = Number(query.quantidadeDisponivelMin);
        }
        if (query.quantidadeDisponivelMax !== undefined) {
          qtdWhere[Op.lte] = Number(query.quantidadeDisponivelMax);
        }
        and.push({ quantidade_disponivel: qtdWhere });
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

      const produtos = await Product.findAll({
        where,
        order: ordenation(query.sort),
        limit,
        offset: (page - 1) * limit,
      });

      return res.json(produtos);
    } catch (err: any) {
      return res.status(400).json({ erro: err.message });
    }
  }

  /**
   * Busca um produto por ID.
   * @method show
   * @async
   * @param {Request<ProdutoIdParam>} req
   * @param {Response} res
   * @returns {Promise<Response>}
   */
  async show(req: Request<ProdutoIdParam>, res: Response) {
    const produto = await Product.findByPk(req.params.id, {
      include: [
        { model: File, as: "imagem", attributes: ["id", "nome", "caminho"] },
      ],
    });

    if (!produto) {
      return res.status(404).json();
    }

    return res.json(produto);
  }

  /**
   * Cria um novo produto.
   * @method create
   * @async
   * @param {Request} req
   * @param {Response} res
   * @returns {Promise<Response>}
   */
  async create(req: Request, res: Response) {
    const { body } = req;

    const schema = Yup.object().shape({
      nome: Yup.string().required(),
      descricao: Yup.string().required(),
      preco_aluguel: Yup.number().positive().required(),
      quantidade_total: Yup.number().integer().positive().required(),
      categoria_id: Yup.number().integer().positive().required(),
      file_id: Yup.number().integer().positive().nullable(),
    });

    if (!(await schema.isValid(body))) {
      return res.status(400).json({ erro: "Erro ao validar schema." });
    }

    const dadosProduto = {
      ...body,
      quantidade_disponivel: body.quantidade_total,
    };

    const novoProduto = await Product.create(dadosProduto);

    return res.status(201).json(novoProduto);
  }

  /**
   * Atualiza os dados de um produto.
   * Ao alterar qualquer campo que afete o PDF (nome, descrição, preço, etc.),
   * todos os contratos vinculados têm seus totais recalculados e seus PDFs regenerados.
   * A regeneração ocorre APÓS o commit da transação para garantir consistência.
   * @method update
   * @async
   */
  async update(req: Request<ProdutoIdParam>, res: Response) {
    const produto = await Product.findByPk(req.params.id);

    if (!produto) {
      return res.status(404).json();
    }

    const schema = Yup.object().shape({
      nome: Yup.string(),
      descricao: Yup.string(),
      preco_aluguel: Yup.number().positive(),
      quantidade_total: Yup.number().integer().positive(),
      quantidade_disponivel: Yup.number()
        .integer()
        .min(0)
        .max(produto.quantidade_total, "Disponível não pode exceder total"),
      categoria_id: Yup.number().integer().positive(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ erro: "Erro ao validar schema." });
    }

    const transaction = await Product.sequelize!.transaction();

    try {
      const dadosAtualizacao: any = { ...req.body };

      // Se a quantidade_total for alterada, recalcula a disponível com base nos itens alugados
      if (req.body.quantidade_total !== undefined) {
        const novoTotal = req.body.quantidade_total;

        const somaQuantidades = await ContractProduct.sum("quantidade", {
          where: { produto_id: produto.id },
          transaction,
        });

        const totalAlugado = somaQuantidades || 0;
        const novaDisponivel = novoTotal - totalAlugado;

        if (novaDisponivel < 0) {
          throw new Error(
            `Quantidade total (${novoTotal}) não pode ser menor que a quantidade já alugada (${totalAlugado}).`
          );
        }

        dadosAtualizacao.quantidade_disponivel = novaDisponivel;
      }

      // Se o preço mudou, atualiza os itens de contrato com o novo preço e recalcula subtotal
      const novoPreco =
        req.body.preco_aluguel !== undefined
          ? Number(req.body.preco_aluguel)
          : undefined;

      if (novoPreco !== undefined && novoPreco !== produto.preco_aluguel) {
        await ContractProduct.update(
          {
            preco_unitario: novoPreco,
            subtotal: Product.sequelize!.literal(`quantity * ${novoPreco}`),
          },
          { where: { produto_id: produto.id }, transaction }
        );

        // (Não atualizamos totais aqui, faremos após o commit)
        dadosAtualizacao.preco_aluguel = novoPreco;
      }

      // Atualiza o produto
      const produtoAtualizado = await produto.update(dadosAtualizacao, {
        transaction,
      });

      await transaction.commit();

      // ===== APÓS O COMMIT: recalcula totais e regenera PDFs de todos os contratos vinculados =====
      const itens = await ContractProduct.findAll({
        where: { produto_id: produto.id },
        attributes: ["contrato_id"],
        group: ["contrato_id"],
      });

      for (const item of itens) {
        const contractId = item.contrato_id;
        try {
          // Recalcula o total do contrato
          await ContractProduct.updateContractTotal(contractId);
          // Regenera o PDF
          await ContractPdfService.regenerate(contractId);
        } catch (error: any) {
          console.error(
            `[ProductsController] Erro ao processar contrato #${contractId} após atualização do produto #${produto.id}:`,
            error.message
          );
          // Continua com os próximos contratos
        }
      }

      return res.json(produtoAtualizado);
    } catch (err: any) {
      await transaction.rollback();
      return res.status(500).json({ erro: err.message });
    }
  }

  /**
   * Remove um produto.
   * @method destroy
   * @async
   * @param {Request<ProdutoIdParam>} req
   * @param {Response} res
   * @returns {Promise<Response>}
   */
  async destroy(req: Request<ProdutoIdParam>, res: Response) {
    const produto = await Product.findByPk(req.params.id);

    if (!produto) {
      return res.status(404).json();
    }

    await produto.destroy();

    return res.json();
  }
}

export default new ProductsController();
