import Dexie, { Table } from 'dexie';
import { AppState, InventoryItem, CostCenter, LaborLog, FinanceLog, PestLog } from '../types';

// 1. Definición de campos de sincronización obligatorios
export type SyncStatus = 'synced' | 'pending_update' | 'pending_create';

export interface SyncFields {
  serverId?: string;
  lastUpdated: number;
  syncStatus: SyncStatus;
}

// Extendemos los tipos existentes para incluir los campos de sync
export type SyncInventory = InventoryItem & SyncFields;
export type SyncLot = CostCenter & SyncFields;
export type SyncLabor = LaborLog & SyncFields;
export type SyncFinance = FinanceLog & SyncFields;
export type SyncSanitary = PestLog & SyncFields;

// 2. Configuración de la Base de Datos con Dexie
export class AgroBodegaDB extends Dexie {
  inventory!: Table<SyncInventory>;
  lots!: Table<SyncLot>;
  labor!: Table<SyncLabor>;
  finance!: Table<SyncFinance>;
  sanitary!: Table<SyncSanitary>;

  constructor() {
    super('AgroBodegaProDB');
    
    // Definimos el esquema. El 'id' es la llave primaria (UUID generado en el frontend)
    // Fix: cast to any to avoid "version" not existing on AgroBodegaDB error
    (this as any).version(1).stores({
      inventory: 'id, serverId, syncStatus, lastUpdated',
      lots: 'id, serverId, syncStatus, lastUpdated',
      labor: 'id, serverId, syncStatus, lastUpdated',
      finance: 'id, serverId, syncStatus, lastUpdated',
      sanitary: 'id, serverId, syncStatus, lastUpdated'
    });

    // 3. Automatización mediante Hooks
    this.setupSyncHooks();
  }

  private setupSyncHooks() {
    const tables = [this.inventory, this.lots, this.labor, this.finance, this.sanitary];

    tables.forEach(table => {
      // Hook al Crear: Si el registro no viene de la nube (sin serverId), marcar como pendiente de creación
      table.hook('creating', (primKey, obj) => {
        obj.lastUpdated = Date.now();
        if (!obj.serverId) {
          obj.syncStatus = 'pending_create';
        } else {
          obj.syncStatus = 'synced';
        }
      });

      // Hook al Actualizar: Cada vez que se modifique algo, actualizar timestamp y marcar como pendiente de update
      table.hook('updating', (mods, primKey, obj) => {
        return {
          ...mods,
          lastUpdated: Date.now(),
          // Si ya está sincronizado o pendiente de update, lo marcamos como pendiente de update.
          // Si estaba pendiente de creación, se queda como pendiente de creación.
          syncStatus: obj.syncStatus === 'pending_create' ? 'pending_create' : 'pending_update'
        };
      });
    });
  }
}

export const db = new AgroBodegaDB();

// 4. dbService: Adaptador para mantener compatibilidad con el estado monolítico de la App
export const dbService = {
  
  /**
   * Guarda el AppState completo distribuyéndolo en tablas de Dexie.
   * Dexie procesará los hooks automáticamente.
   */
  saveState: async (state: AppState): Promise<void> => {
    try {
      // Fix: cast to any to avoid "transaction" not existing on AgroBodegaDB error
      await (db as any).transaction('rw', db.inventory, db.lots, db.labor, db.finance, db.sanitary, async () => {
        // Usamos bulkPut para actualizar o crear masivamente respetando los IDs existentes
        await db.inventory.bulkPut(state.inventory as SyncInventory[]);
        await db.lots.bulkPut(state.costCenters as SyncLot[]);
        await db.labor.bulkPut(state.laborLogs as SyncLabor[]);
        await db.finance.bulkPut(state.financeLogs as SyncFinance[]);
        await db.sanitary.bulkPut(state.pestLogs as SyncSanitary[]);
      });
    } catch (error) {
      console.error("Error guardando en Dexie:", error);
    }
  },

  /**
   * Reconstruye el AppState consultando todas las tablas de Dexie.
   */
  loadState: async (): Promise<AppState | null> => {
    try {
      const [inventory, costCenters, laborLogs, financeLogs, pestLogs] = await Promise.all([
        db.inventory.toArray(),
        db.lots.toArray(),
        db.labor.toArray(),
        db.finance.toArray(),
        db.sanitary.toArray()
      ]);

      // Si no hay datos, devolvemos null para que use el estado inicial
      if (inventory.length === 0 && costCenters.length === 0) return null;

      // Reconstruimos el objeto AppState (ajustado a las interfaces de types.ts)
      return {
        inventory,
        costCenters,
        laborLogs,
        financeLogs,
        pestLogs,
        // Mantener el resto de campos vacíos o con valores por defecto
        warehouses: [],
        activeWarehouseId: inventory[0]?.warehouseId || '',
        movements: [],
        suppliers: [],
        personnel: [],
        activities: [],
        harvests: [],
        machines: [],
        maintenanceLogs: [],
        rainLogs: [],
        soilAnalyses: [],
        ppeLogs: [],
        wasteLogs: [],
        agenda: [],
        phenologyLogs: [],
        plannedLabors: [],
        budgets: [],
        laborFactor: 1.0,
        auditLogs: [],
        clients: [],
        salesContracts: [],
        sales: []
      } as unknown as AppState;
    } catch (error) {
      console.error("Error cargando de Dexie:", error);
      return null;
    }
  },

  /**
   * Útil para el SyncManager: Obtiene solo lo que falta por subir a la nube
   */
  getPendingSync: async () => {
    return {
      inventory: await db.inventory.where('syncStatus').anyOf('pending_create', 'pending_update').toArray(),
      lots: await db.lots.where('syncStatus').anyOf('pending_create', 'pending_update').toArray(),
      labor: await db.labor.where('syncStatus').anyOf('pending_create', 'pending_update').toArray(),
      finance: await db.finance.where('syncStatus').anyOf('pending_create', 'pending_update').toArray(),
      sanitary: await db.sanitary.where('syncStatus').anyOf('pending_create', 'pending_update').toArray()
    };
  }
};