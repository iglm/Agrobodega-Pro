
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { AppState, InventoryItem } from '../types';
import { loadDataFromLocalStorage, generateId, STORAGE_KEY } from './inventoryService';

const DB_NAME = 'DatosFincaVivaDB';
const DB_VERSION = 2; // Incremented for migration check
const STORE_NAME = 'appState';
const KEY = 'root';
const MIGRATION_FLAG = 'MIGRATION_COMPLETED';

interface FincaDB extends DBSchema {
  [STORE_NAME]: {
    key: string;
    value: AppState;
  };
}

let dbPromise: Promise<IDBPDatabase<FincaDB>> | null = null;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<FincaDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }

        // Simple Migration Logic
        if (oldVersion < 2) {
           // Example: Add a new field if missing in existing data
           // This runs when upgrading from version 1 to 2
           const store = transaction.objectStore(STORE_NAME);
           // Logic would go here to iterate and update if we stored items individually
           // Since we store a monolithic 'root' object, migration usually happens on load
           console.log("DB Upgraded to v2. Schema ready.");
        }
      },
      blocked(currentVersion, blockedVersion, event) {
          console.warn("DB blocked", currentVersion, blockedVersion);
      },
      blocking(currentVersion, blockedVersion, event) {
          console.warn("DB blocking", currentVersion, blockedVersion);
      },
      terminated() {
          console.error("DB terminated unexpectedly");
          dbPromise = null;
      },
    });
  }
  return dbPromise;
};

// Data Migration Function to ensure new fields exist
const migrateData = (data: AppState): AppState => {
    // Ensure auditLogs exists
    if (!data.auditLogs) data.auditLogs = [];
    // Ensure clients exists
    if (!data.clients) data.clients = [];
    
    // Ensure all items have syncStatus
    data.inventory = data.inventory.map(i => ({ ...i, syncStatus: i.syncStatus || 'pending_sync' }));
    data.movements = data.movements.map(m => ({ ...m, syncStatus: m.syncStatus || 'pending_sync' }));
    data.laborLogs = data.laborLogs.map(l => ({ ...l, syncStatus: l.syncStatus || 'pending_sync' }));
    
    return data;
};

const getCleanState = (): AppState => {
    const id = generateId();
    return {
        // Fix: Added missing warehouseId property to initial warehouse
        warehouses: [{ id, warehouseId: id, name: 'Finca Recuperada', created: new Date().toISOString(), ownerId: 'local_user' }],
        activeWarehouseId: id,
        inventory: [], movements: [], suppliers: [], costCenters: [], personnel: [], activities: [], 
        laborLogs: [], harvests: [], machines: [], maintenanceLogs: [], rainLogs: [], financeLogs: [], 
        soilAnalyses: [], ppeLogs: [], wasteLogs: [], agenda: [], phenologyLogs: [], pestLogs: [], 
        plannedLabors: [], budgets: [], assets: [], bpaChecklist: {}, laborFactor: 1.0,
        clients: [], salesContracts: [], sales: [],
        auditLogs: []
    };
};

export const dbService = {
  
  saveState: async (state: AppState): Promise<void> => {
    try {
      const db = await getDB();
      // Ensure data is valid before saving
      const migratedState = migrateData(state);
      await db.put(STORE_NAME, migratedState, KEY);
    } catch (error) {
      console.error("Error crítico guardando en IDB:", error);
      try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (lsError) {
          console.error("Fallo total de guardado", lsError);
      }
    }
  },

  loadState: async (): Promise<AppState> => {
    const hasMigrated = localStorage.getItem(MIGRATION_FLAG) === 'true';
    let db;

    try {
      db = await getDB();
      let data = await db.get(STORE_NAME, KEY);

      if (data) {
        if (!hasMigrated) localStorage.setItem(MIGRATION_FLAG, 'true');
        return migrateData(data);
      }
    } catch (error) {
      console.error("Error crítico leyendo IndexedDB:", error);
    }

    if (hasMigrated) {
        const rawLegacyData = localStorage.getItem(STORAGE_KEY);
        if (rawLegacyData) {
            try {
                const recoveredState = migrateData(loadDataFromLocalStorage());
                if (db) {
                    await db.put(STORE_NAME, recoveredState, KEY);
                }
                return recoveredState;
            } catch (recoveryError) {
                console.error("Fallo al procesar datos de recuperación:", recoveryError);
            }
        }
        return getCleanState();
    }

    try {
        const legacyData = migrateData(loadDataFromLocalStorage());
        if (db) {
            await db.put(STORE_NAME, legacyData, KEY);
            localStorage.setItem(MIGRATION_FLAG, 'true');
        }
        return legacyData;
    } catch (migrationError) {
        return loadDataFromLocalStorage();
    }
  },

  clearDatabase: async (): Promise<void> => {
      try {
        const db = await getDB();
        await db.clear(STORE_NAME);
        localStorage.removeItem(MIGRATION_FLAG);
      } catch (e) {
          console.error("Error clearing DB", e);
      }
  }
};
