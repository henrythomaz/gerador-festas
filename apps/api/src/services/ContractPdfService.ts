/**
 * @file ContractPdfService.ts
 * @description Serviço para geração de PDF de contratos usando Puppeteer.
 */

import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

import User from '../app/models/User.js';
import File from '../app/models/File.js';
import Contract from '../app/models/Contract.js';
import Customer from '../app/models/Customer.js';
import Product from '../app/models/Product.js';
import ContractProduct from '../app/models/ContractProduct.js';
import TemplateService from './TemplateService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Diretório onde os PDFs serão salvos
const STORAGE_DIR = path.resolve(__dirname, '../storage/contracts');
// Diretório onde as imagens são armazenadas (ajuste conforme sua estrutura)
const UPLOAD_DIR = path.resolve(__dirname, '../storage/uploads');

class ContractPdfService {
  constructor() {
    // Garante que o diretório de armazenamento exista
    fs.ensureDirSync(STORAGE_DIR);
  }

  /**
   * Gera o PDF para um contrato específico.
   * @param contractId - ID do contrato
   * @returns Objeto com caminho do PDF e nome do arquivo
   * @throws Erro se o contrato não for encontrado ou falha na geração
   */
  async generate(contractId: number): Promise<{ pdfPath: string; pdfFilename: string; pdfHash: string }> {
    // 1. Buscar contrato com relações
    const contract = await Contract.findByPk(contractId, {
      include: [
        { model: Customer, as: 'cliente' },    // alias definido no modelo
        { model: User, as: 'usuario' }         // alias definido no modelo
      ]
    });

    if (!contract) {
      throw new Error(`Contrato #${contractId} não encontrado.`);
    }

    // Remove o PDF antigo se existir (garante que será sobrescrito)
    if (contract.pdf_filename) {
      await this.deletePdfFile(contract);
    }

    // 2. Buscar itens do contrato com produtos
    const items = await ContractProduct.findAll({
      where: { contrato_id: contractId },
      include: [
        {
          model: Product,
          as: 'produto',
          include: [
            {
              model: File,        // importe o modelo File
              as: 'imagem',       // alias definido na associação
            }
          ]
        }
      ]
    });

    // Prepara os itens com imagem base64
    const itensComImagem = await Promise.all(items.map(async (item) => {
      const produto = item.produto;
      let imagemBase64 = null;
      if (produto?.imagem?.caminho) {
        const filePath = path.join(UPLOAD_DIR, produto.imagem.caminho);
        if (await fs.pathExists(filePath)) {
          const data = await fs.readFile(filePath);
          const ext = path.extname(filePath).toLowerCase();
          const mimeType = ext === '.png' ? 'image/png' :
                           ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                           ext === '.gif' ? 'image/gif' : 'application/octet-stream';
          imagemBase64 = `data:${mimeType};base64,${data.toString('base64')}`;
        }
      }
      return {
        produto_nome: produto?.nome || 'Produto não informado',
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        subtotal: item.subtotal,
        imagem_base64: imagemBase64,
      };
    }));

    // 3. Preparar dados para o template
    const data = {
      contrato: {
        id: contract.id,
        data_inicio: contract.data_inicio,
        data_fim: contract.data_fim,
        observacoes: contract.observacoes || '',
        valor_total: contract.valor_total || 0,
        status: contract.status,
      },
      cliente: {
        nome: contract.cliente?.nome || 'Cliente não informado',
        cpf: contract.cliente?.cpf || '',
        telefone: contract.cliente?.telefone || '',
        email: contract.cliente?.email || '',
      },
      usuario: {
        nome: contract.usuario?.nome || 'Usuário não informado',
        email: contract.usuario?.email || '',
      },
      itens: itensComImagem,
      data_geracao: new Date().toLocaleDateString('pt-BR'),
    };

    // 4. Renderizar HTML
    const html = await TemplateService.render('contract', data);

    // 5. Gerar PDF com Puppeteer
    const browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    });
    const page = await browser.newPage();

    // Define o conteúdo HTML
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Gera o PDF
    const pdfFilename = `contrato-${contractId}-${Date.now()}.pdf`;
    const pdfPath = path.join(STORAGE_DIR, pdfFilename);

    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm',
      },
    });

    await browser.close();

    // 6. Calcular hash do arquivo (opcional)
    const fileBuffer = await fs.readFile(pdfPath);
    const pdfHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // 7. Atualizar o contrato com informações do PDF
    await contract.update({
      pdf_url: `/files/contracts/${pdfFilename}`,
      pdf_filename: pdfFilename,
      pdf_hash: pdfHash,
      pdf_generated_at: new Date(),
    });

    return { pdfPath, pdfFilename, pdfHash };
  }

  /**
   * Regenera o PDF de um contrato existente.
   * Se o contrato ainda não tiver um PDF (pdf_filename nulo), esta função não faz nada,
   * pois a regeneração automática só deve ocorrer após a primeira geração manual.
   * 
   * @param contractId - ID do contrato
   * @returns Objeto com caminho, nome e hash do PDF, ou null se não foi regenerado
   */
  async regenerate(contractId: number) {
    const contrato = await Contract.findByPk(contractId);

    if (!contrato) {
      throw new Error("Contrato não encontrado.");
    }

    //  VERIFICAÇÃO: se o contrato nunca teve um PDF gerado, não faz nada
    if (!contrato.pdf_filename) {
      console.log(`[ContractPdfService] Contrato #${contractId} não possui PDF prévio. Regeneração automática ignorada.`);
      return null; // ou retorna um objeto vazio, mas null indica que nada foi feito
    }

    // Se já existe PDF, apaga o antigo e gera novo
    await this.deletePdfFile(contrato);

    await contrato.update({
      pdf_url: null,
      pdf_filename: null,
      pdf_hash: null,
      pdf_generated_at: null,
    });

    // Agora chama generate para criar o novo
    return this.generate(contractId);
  }

  /**
   * Remove o arquivo PDF de um contrato (se existir).
   * @param contract - Instância do contrato com campos de PDF
   */
  async deletePdfFile(contract: Contract): Promise<void> {
    if (contract.pdf_filename) {
      const filePath = path.join(STORAGE_DIR, contract.pdf_filename);
      if (await fs.pathExists(filePath)) {
        await fs.unlink(filePath);
      }
    }
  }

  /**
   * Obtém o caminho completo do arquivo PDF para download.
   * @param filename - Nome do arquivo PDF
   * @returns Caminho absoluto
   */
  getPdfFilePath(filename: string): string {
    return path.join(STORAGE_DIR, filename);
  }
}

export default new ContractPdfService();
