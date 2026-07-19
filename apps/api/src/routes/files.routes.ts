/**
 * @file files.routes.ts
 * @description Rotas para gerenciamento de arquivos (upload e atualização).
 */

import { Router } from "express";
import multer from "multer";
import multerConfig from "../config/multer.js";
import filesController from "../app/controllers/FilesController.js";

const upload = multer(multerConfig);
const routes = Router();

routes.post("/files", upload.single("file"), filesController.create);
routes.put("/files/:id", upload.single("file"), filesController.update); // Nova rota

export default routes;
