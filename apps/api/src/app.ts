/**
 * @file app.ts
 * @description Configuração principal da aplicação Express.
 * Define middlewares, rotas, documentação Swagger e tratamento de exceções.
 */

import "dotenv/config";
import express, { Express, Request, Response, NextFunction } from "express";
import routes from "./routes/routes.js";
import "./database/index.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";
import cors from "cors";
import { resolve } from "path";
import { fileURLToPath } from "url";

// Obter __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, ".."); // Pasta 'src'

/**
 * Classe principal da aplicação.
 * @class App
 * @description Centraliza a configuração do servidor Express, incluindo middlewares,
 * rotas e tratamento de erros.
 */
class App {
  public server: Express;

  constructor() {
    this.server = express();
    this.middlewares();
    this.routes();
    this.exceptionHandler();
  }

  middlewares() {
    this.server.use(cors());
    this.server.use(express.json());
    this.server.use(express.urlencoded({ extended: false }));
  }

  routes() {
    this.server.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    this.server.get("/docs.json", (req, res) => {
      res.json(swaggerSpec);
    });
    this.server.use("/files", express.static(resolve(__dirname, "storage", "uploads")));
    this.server.use('/files/contracts', express.static(resolve(__dirname, 'storage', 'contracts')));
    this.server.use(routes);
  }

  exceptionHandler() {
    this.server.use(
      (err: Error, req: Request, res: Response, _next: NextFunction) => {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }
        return res.status(500).json({
          erro: "Erro interno do servidor.",
        });
      }
    );
  }
}

export default new App().server;
