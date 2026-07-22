import SyncService from "../../services/SyncService.js";
import SyncManager from '../../services/SyncManager.js';
import { acquireLock, releaseLock } from "../../lib/RedisLock.js";

export default {
  key: "SyncGoogleDriveJob",
  async handle({ data }: { data: { userId: number } }) {
    const { userId } = data;
    const lockKey = `sync:lock:${userId}`;
    const locked = await acquireLock(lockKey, 300); // 5 minutos
    if (!locked) {
      console.log(
        `SyncGoogleDriveJob: lock já adquirido para usuário ${userId}`
      );
      return;
    }
    try {
      await SyncService.syncUser(userId);
      // Limpar agendamento
      await SyncManager.clearScheduled(userId);
    } catch (error) {
      console.error(`SyncGoogleDriveJob error for user ${userId}:`, error);
      throw error;
    } finally {
      await releaseLock(lockKey);
    }
  },
};
