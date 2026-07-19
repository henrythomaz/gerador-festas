import multer from "multer";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { dirname, resolve, extname } from "path";

// Obter __filename e __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename); // Pasta 'config'

export default {
  storage: multer.diskStorage({
    destination: resolve(__dirname, "..", "..", "tmp", "uploads"),
    filename: (_req, file, callback) => {
      crypto.randomBytes(16, (err, res) => {
        if (err) return callback(err);
        return callback(null, res.toString("hex") + extname(file.originalname));
      });
    },
  }),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: (_req, file, callback) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/gif"];
    if (allowedMimes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error("Tipo de arquivo não permitido."));
    }
  },
};
