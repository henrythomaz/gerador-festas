import redis from "../lib/redis.js";
import Queue from "../lib/Queue.js";
import SyncGoogleDriveJob from '../app/jobs/SyncGoogleDriveJob.js';

const DEBOUNCE_SECONDS = 5; // configurável

class SyncManager {
  async scheduleSync(userId: number): Promise<void> {
    const key = `sync:scheduled:${userId}`;
    // Verifica se já existe job agendado
    const exists = await redis.exists(key);
    if (!exists) {
      // Marca que um job foi agendado
      await redis.set(key, "1", { EX: DEBOUNCE_SECONDS + 1 });
      // Adiciona job com delay
      await Queue.add(
        SyncGoogleDriveJob.key,
        { userId },
        { delay: DEBOUNCE_SECONDS * 1000 }
      );
    } else {
      // Renova TTL
      await redis.expire(key, DEBOUNCE_SECONDS + 1);
    }
  }

  async clearScheduled(userId: number): Promise<void> {
    const key = `sync:scheduled:${userId}`;
    await redis.del(key);
  }
}

export default new SyncManager();
