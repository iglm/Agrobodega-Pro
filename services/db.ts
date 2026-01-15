
import Dexie, { Table } from 'dexie';
import { AppState, InventoryItem, CostCenter, LaborLog, FinanceLog, PestLog, AuditLog } from '../types';

export type SyncStatusField = 'synced' | 'pending_update' | 'pending_create';

export interface SyncFields {
  serverId?: string;
  lastUpdated: number;
  syncStatus: SyncStatusField;
}

export type SyncInventory = InventoryItem & SyncFields;
export type SyncLot = CostCenter & SyncFields;
export type SyncLabor = LaborLog & SyncFields;
export type SyncFinance = FinanceLog & SyncFields;
export type SyncSanitary = PestLog & SyncFields;

export class AgroBodegaDB extends Dexie {
  inventory!: Table<SyncInventory>;
  lots!: Table<SyncLot>;
  labor!: Table<SyncLabor>;
  finance!: Table<SyncFinance>;
  sanitary!: Table<SyncSanitary>;
  auditLogs!: Table<AuditLog>; // Nueva tabla

  constructor() {
    super('AgroBodegaProDB');
    
    (this as any).version(2).stores({
      inventory: 'id, serverId, syncStatus, lastUpdated',
      lots: 'id, serverId, syncStatus, lastUpdated',
      labor: 'id, serverId, syncStatus, lastUpdated',
      finance: 'id, serverId, syncStatus, lastUpdated',
      sanitary: 'id, serverId, syncStatus, lastUpdated',
      auditLogs: 'id, action, timestamp, status, entity' // Esquema para auditoría
    });

    this.setupSyncHooks();
  }

  private setupSyncHooks() {
    const tables = [this.inventory, this.lots, this.labor, this.finance, this.sanitary];
    tables.forEach(table => {
      table.hook('creating', (primKey, obj) => {
        obj.lastUpdated = Date.now();
        obj.syncStatus = obj.serverId ? 'synced' : 'pending_create';
      });
      table.hook('updating', (mods, primKey, obj) => {
        return {
          ...mods,
          lastUpdated: Date.now(),
          syncStatus: obj.syncStatus === 'pending_create' ? 'pending_create' : 'pending_update'
        };
      });
    });
  }
}

export const db = new AgroBodegaDB();

export const dbService = {
  addAuditLog: async (log: Omit<AuditLog, 'id'>): Promise<void> => {
    const fullLog: AuditLog = {
      ...log,
      id: crypto.randomUUID()
    };
    await db.auditLogs.add(fullLog);
    // Limpieza automática: Borrar logs técnicos de más de 90 días
    const limit = new Date();
    limit.setDate(limit.getDate() - 90);
    await db.auditLogs.where('timestamp').below(limit.toISOString()).delete();
  },

  getAuditLogs: async (): Promise<AuditLog[]> => {
    return db.auditLogs.orderBy('timestamp').reverse().toArray();
  },

  saveState: async (state: AppState): Promise<void> => {
    try {
      await (db as any).transaction('rw', db.inventory, db.lots, db.labor, db.finance, db.sanitary, async () => {
        await db.inventory.bulkPut(state.inventory as SyncInventory[]);
        await db.lots.bulkPut(state.costCenters as SyncLot[]);
        await db.labor.bulkPut(state.laborLogs as SyncLabor[]);
        await db.finance.bulkPut(state.financeLogs as SyncFinance[]);
        await db.sanitary.bulkPut(state.pestLogs as SyncSanitary[]);
      });
    } catch (error) {
      console.error("Error Dexie:", error);
    }
  },

  loadState: async (): Promise<AppState | null> => {
    try {
      const [inventory, costCenters, laborLogs, financeLogs, pestLogs, auditLogs] = await Promise.all([
        db.inventory.toArray(),
        db.lots.toArray(),
        db.labor.toArray(),
        db.finance.toArray(),
        db.sanitary.toArray(),
        db.auditLogs.toArray()
      ]);

      if (inventory.length === 0 && costCenters.length === 0) return null;

      return {
        inventory, costCenters, laborLogs, financeLogs, pestLogs, auditLogs,
        warehouses: [], activeWarehouseId: inventory[0]?.warehouseId || '',
        movements: [], suppliers: [], personnel: [], activities: [], harvests: [], 
        machines: [], maintenanceLogs: [], rainLogs: [], soilAnalyses: [], ppeLogs: [], 
        wasteLogs: [], agenda: [], phenologyLogs: [], plannedLabors: [], budgets: [], 
        laborFactor: 1.0, clients: [], salesContracts: [], sales: []
      } as unknown as AppState;
    } catch (error) {
      return null;
    }
  }
};
