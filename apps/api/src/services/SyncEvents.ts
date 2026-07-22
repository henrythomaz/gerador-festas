import SyncManager from "./SyncManager.js";

class SyncEvents {
  handleChange(userId: number, modelName: string, action: string): void {
    if (!userId) return;
    // Verificar se o usuário tem sincronização ativada? Podemos checar no SyncManager.
    SyncManager.scheduleSync(userId);
  }
}

export default new SyncEvents();
