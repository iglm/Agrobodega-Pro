import { db } from './db';

// URL de tu API desplegada en Google Cloud Run
const API_BASE_URL = 'https://agrobodega-cloud-engine-tu-url.a.run.app/api/v1';

/**
 * Servicio de Sincronización AgroBodega Pro
 * Maneja la comunicación bidireccional entre IndexedDB (Local) y Cloud (PostgreSQL)
 */
export const syncService = {
  
  /**
   * Intenta sincronizar todas las entidades que tienen cambios pendientes.
   */
  async syncWithCloud(): Promise<void> {
    // Si no hay internet, abortamos silenciosamente
    if (!navigator.onLine) {
      console.log("[Sync] Modo offline: Sincronización pospuesta.");
      return;
    }

    const entities = [
      { name: 'inventory', table: db.inventory },
      { name: 'lots', table: db.lots },
      { name: 'labor', table: db.labor },
      { name: 'finance', table: db.finance },
      { name: 'sanitary', table: db.sanitary }
    ];

    console.log("[Sync] Iniciando ciclo de sincronización...");

    for (const entity of entities) {
      try {
        // Buscamos registros creados o editados localmente
        const pendingRecords = await entity.table
          .where('syncStatus')
          .anyOf('pending_create', 'pending_update')
          .toArray();

        if (pendingRecords.length > 0) {
          console.log(`[Sync] Enviando ${pendingRecords.length} registros de ${entity.name}...`);
          await this.uploadBatch(entity.name, pendingRecords);
        }
      } catch (error) {
        console.error(`[Sync Error] Fallo al procesar ${entity.name}:`, error);
      }
    }
  },

  /**
   * Envía un grupo de registros al servidor.
   */
  // Fix: Removed 'private' modifier from line 53 because access modifiers like 'private' are not allowed in object literal properties.
  async uploadBatch(entityName: string, records: any[]): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/${entityName}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Se asume que el token se guarda en localStorage tras el login
          'Authorization': `Bearer ${localStorage.getItem('AUTH_TOKEN') || 'local_dev_token'}`
        },
        body: JSON.stringify(records)
      });

      if (response.ok) {
        const result = await response.json();
        
        // El servidor nos devuelve la confirmación de los registros procesados
        if (result.success && result.synced) {
          for (const item of result.synced) {
            await (db as any)[entityName].update(item.id, {
              serverId: item.serverId,
              syncStatus: 'synced',
              // Sincronizamos la marca de tiempo del servidor si es necesario
              lastUpdated: item.lastUpdated 
            });
          }
        }
      } else {
        const errorData = await response.json();
        console.warn(`[Sync Warning] El servidor rechazó el lote de ${entityName}:`, errorData.error);
      }
    } catch (error) {
      throw new Error(`Fallo de conexión en ${entityName}: ${error}`);
    }
  },

  /**
   * Inicializa los listeners de red para auto-sincronización.
   */
  initAutoSync() {
    // 1. Al recuperar conexión
    window.addEventListener('online', () => {
      console.log("[Sync] Conexión recuperada. Sincronizando datos...");
      this.syncWithCloud();
    });

    // 2. Intervalo de seguridad cada 5 minutos
    setInterval(() => {
      this.syncWithCloud();
    }, 300000);

    // 3. Primer intento al arrancar
    this.syncWithCloud();
  }
};
