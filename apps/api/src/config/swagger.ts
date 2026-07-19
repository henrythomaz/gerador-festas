/**
 * @file swagger.ts
 * @description Configuração da documentação Swagger/OpenAPI.
 * Define as especificações da API para geração automática da documentação.
 */

import swaggerJsdoc from "swagger-jsdoc";
import swaggerSpec from "./config/swagger.js";
import "dotenv/config";

/**
 * Configuração do Swagger/OpenAPI.
 * @type {Object}
 * @description Define todas as especificações da API para documentação.
 *
 * @property {Object} definition - Definição da especificação OpenAPI
 * @property {string} definition.openapi - Versão do OpenAPI (3.0.0)
 * @property {Object} definition.info - Informações da API
 * @property {string} definition.info.title - Título da API
 * @property {string} definition.info.version - Versão da API
 * @property {string} definition.info.description - Descrição da API
 * @property {Array} definition.servers - Servidores onde a API está disponível
 * @property {Array} apis - Padrões de arquivos com anotações Swagger
 * @property {Object} components - Componentes reutilizáveis
 * @property {Object} components.securitySchemes - Esquemas de segurança
 * @property {Object} schemas - Esquemas de modelos de dados
 *
 * @example
 * // Acessando a documentação
 * // GET /docs - UI do Swagger
 * // GET /docs.json - Especificação JSON
 *
 * // Usando em uma rota
 * app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
 * app.get("/docs.json", (req, res) => res.json(swaggerSpec));
 *
 * @see https://swagger.io/specification/
 */
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Gerenciamento de Festas",
      version: "1.0.0",
      description: "API do sistema de Gerenciamento de Festas",
    },
    servers: [
      {
        url: process.env.VITE_BACK_URL,
      },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/app/controllers/*ts"],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  schemas: {
    User: {
      type: "object",
      properties: {
        id: {
          type: "integer",
          example: 1,
        },
        nome: {
          type: "string",
          example: "Henry Thomaz",
        },
        email: {
          type: "string",
          example: "henry@email.com",
        },
      },
    },
  },
};

/**
 * Especificação Swagger compilada.
 * @type {Object}
 * @description Objeto com todas as configurações e documentações da API.
 * Gera a documentação completa a partir dos comentários @swagger nos arquivos.
 */
const swaggerSpec = swaggerJsdoc(options);

/**
 * Exporta a especificação Swagger.
 * @default
 */
export default swaggerSpec;
