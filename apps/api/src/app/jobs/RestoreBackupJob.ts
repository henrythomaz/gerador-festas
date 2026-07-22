import SyncService from '../../services/SyncService.js';
import { acquireLock, releaseLock } from "../../lib/RedisLock.js";

export default {
  key: "RestoreBackupJob",
  async handle({ data }: { data: { userId: number; force: boolean } }) {
    const { userId, force } = data;
    const lockKey = `restore:lock:${userId}`;
    const locked = await acquireLock(lockKey, 600); // 10 minutos
    if (!locked) {
      console.log(`RestoreBackupJob: lock já adquirido para usuário ${userId}`);
      return;
    }
    try {
      await SyncService.restoreUser(userId);
    } catch (error) {
      console.error(`RestoreBackupJob error for user ${userId}:`, error);
      throw error;
    } finally {
      await releaseLock(lockKey);
    }
  },
};
