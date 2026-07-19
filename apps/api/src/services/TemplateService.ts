import fs from 'fs/promises';
import path from 'path';
import handlebars from 'handlebars';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Diretório onde as imagens são armazenadas (ajuste conforme sua estrutura)
const UPLOAD_DIR = path.resolve(__dirname, '../../tmp/uploads');

class TemplateService {
  private templatesDir: string;

  constructor() {
    this.templatesDir = path.resolve(__dirname, '../templates');
    this.registerHelpers();
    this.registerPartials();
  }

  private registerHelpers() {
    handlebars.registerHelper('formatDate', (date: Date) => {
      if (!date) return '';
      return new Date(date).toLocaleDateString('pt-BR');
    });

    handlebars.registerHelper('formatCurrency', (value: number) => {
      if (value == null) return '0,00';
      return value.toFixed(2).replace('.', ',');
    });
  }

  private async registerPartials() {
    try {
      const cssPath = path.join(this.templatesDir, 'contract.css');
      const cssContent = await fs.readFile(cssPath, 'utf-8');
      handlebars.registerPartial('contract.css', cssContent);
    } catch (err) {
      console.warn('Partial contract.css não encontrado, usando fallback.');
      handlebars.registerPartial('contract.css', '');
    }
  }

  async render(templateName: string, data: any): Promise<string> {
    try {
      const templatePath = path.join(this.templatesDir, `${templateName}.hbs`);
      const templateContent = await fs.readFile(templatePath, 'utf-8');

      const compiledTemplate = handlebars.compile(templateContent);
      const html = compiledTemplate(data);
      return html;
    } catch (error: any) {
      throw new Error(`Falha ao renderizar template "${templateName}": ${error.message}`);
    }
  }
}

export default new TemplateService();
