
import { db, SyncStatus } from './db';

const API_BASE_URL = 'https://api.datosfincaviva.com/v1'; // Cambiar por tu endpoint real de producción
const MAX_RETRIES = 5;
const INITIAL_BACKOFF = 1000; // 1 segundo

interface SyncResponse {
  serverId: string;
  success: boolean;
}

/**
 * Servicio maestro de sincronización para AgroBodega Pro
 */
export const syncService = {
  
  /**
   * Recorre todas las tablas buscando cambios pendientes y los sube a la nube.
   */
  async syncWithCloud(): Promise<void> {
    const tableNames = ['inventory', 'lots', 'labor', 'finance', 'sanitary'] as const;
    
    for (const tableName of tableNames) {
      const table = db[tableName];
      // Buscamos lo que no esté en estado 'synced'
      const pendingItems = await (table as any)
        .where('syncStatus')
        .anyOf('pending_create', 'pending_update')
        .toArray();

      for (const item of pendingItems) {
        await this.syncRecord(tableName, item);
      }
    }
  },

  /**
   * Procesa un registro individual con lógica de reintento.
   */
  async syncRecord(tableName: string, item: any): Promise<void> {
    let attempt = 0;
    let success = false;

    while (attempt < MAX_RETRIES && !success) {
      try {
        const isNew = item.syncStatus === 'pending_create';
        const url = isNew ? `${API_BASE_URL}/${tableName}` : `${API_BASE_URL}/${tableName}/${item.serverId}`;
        const method = isNew ? 'POST' : 'PUT';

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('AUTH_TOKEN')}` // Opcional: token de usuario
          },
          body: JSON.stringify(item)
        });

        if (response.ok) {
          const data: SyncResponse = await response.json();
          
          // ACTUALIZACIÓN LOCAL: Marcamos como sincronizado
          await (db as any)[tableName].update(item.id, {
            serverId: data.serverId,
            syncStatus: 'synced'
          });
          
          success = true;
          console.log(`[Sync] Registro ${item.id} sincronizado con éxito.`);
        } else {
          // Errores de servidor (4xx, 500) - No reintentar inmediatamente, esperar backoff
          throw new Error(`Server error: ${response.status}`);
        }
      } catch (error) {
        attempt++;
        if (attempt >= MAX_RETRIES) {
          console.error(`[Sync] Fallo crítico en ${tableName}/${item.id} tras ${MAX_RETRIES} intentos.`, error);
          break;
        }

        // Exponential Backoff calculation: 1s, 2s, 4s, 8s...
        const delay = INITIAL_BACKOFF * Math.pow(2, attempt - 1);
        console.warn(`[Sync] Intento ${attempt} fallido para ${item.id}. Reintentando en ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  },

  /**
   * Monitor de conectividad: Dispara sync cuando el equipo vuelve a estar online.
   */
  initAutoSync() {
    window.addEventListener('online', () => {
      console.log("[Sync] Conexión restaurada. Iniciando sincronización de fondo...");
      this.syncWithCloud();
    });

    // También intentamos sincronizar cada 5 minutos si hay red
    setInterval(() => {
      if (navigator.onLine) {
        this.syncWithCloud();
      }
    }, 5 * 60 * 1000);
  }
};
