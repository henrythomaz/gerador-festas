import { Router } from "express";
import SyncController from "../app/controllers/SyncController.js";
import auth from "../app/middlewares/auth.js";

const router = Router();

router.get(
  "/google/connect",
  auth,
  SyncController.connect.bind(SyncController)
);
router.get("/google/callback", SyncController.callback.bind(SyncController));
router.post("/sync", auth, SyncController.sync.bind(SyncController));
router.post("/restore", auth, SyncController.restore.bind(SyncController));
router.get("/status", auth, SyncController.status.bind(SyncController));
router.delete("/google", auth, SyncController.disconnect.bind(SyncController));
router.get(
  "/check-backup",
  auth,
  SyncController.checkBackup.bind(SyncController)
);
router.get("/google/revoke", SyncController.revokeAccess.bind(SyncController));

export default router;
