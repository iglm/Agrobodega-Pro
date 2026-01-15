
import React from 'react';
import { AppState, BaseEntity } from '../types';
import { dbService } from './db';

const API_URL = 'https://tu-app-en-cloudrun.a.run.app/api/v1/sync'; // Cambiar por tu URL real
const SYNC_INTERVAL = 10000; // 10 segundos tras último cambio

interface SyncPayload {
  warehouseId: string;
  lastSyncDate: string | null;
  collections: {
    inventoryItem?: any[];
    laborLog?: any[];
    costCenter?: any[];
    financeLog?: any[];
  }
}

/**
 * Hook Maestro de Sincronización
 */
export const useSyncManager = (data: AppState, setData: React.Dispatch<React.SetStateAction<AppState>>) => {
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [lastError, setLastError] = React.useState<string | null>(null);
  const [online, setOnline] = React.useState(navigator.onLine);

  // Monitor de conexión
  React.useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  /**
   * Ejecuta el proceso de Sync
   */
  const performSync = React.useCallback(async () => {
    if (!online || isSyncing) return;
    
    // Identificar qué colecciones tienen cambios pendientes
    const getDirty = (items: BaseEntity[]) => items.filter(i => i.syncStatus === 'pending_sync');
    
    const payload: SyncPayload = {
      warehouseId: data.activeWarehouseId,
      lastSyncDate: localStorage.getItem('LAST_SYNC_TIMESTAMP'),
      collections: {
        inventoryItem: getDirty(data.inventory),
        laborLog: getDirty(data.laborLogs),
        costCenter: getDirty(data.costCenters),
        financeLog: getDirty(data.financeLogs)
      }
    };

    // Si no hay nada que subir y no hay timestamp para bajar, abortamos
    const hasDirty = Object.values(payload.collections).some(arr => arr && arr.length > 0);
    if (!hasDirty && !payload.lastSyncDate) return;

    setIsSyncing(true);
    setLastError(null);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

      const result = await response.json();
      
      // Aplicar cambios a nivel local
      const newState = { ...data };
      let hasChanges = false;

      // 1. Marcar como sincronizados los que el servidor aceptó
      const collectionMapping: Record<string, keyof AppState> = {
        inventoryItem: 'inventory',
        laborLog: 'laborLogs',
        costCenter: 'costCenters',
        financeLog: 'financeLogs'
      };

      for (const [colName, acceptedIds] of Object.entries(result.acceptedIds)) {
        const stateKey = collectionMapping[colName];
        if (stateKey && (acceptedIds as string[]).length > 0) {
          (newState[stateKey] as any) = (newState[stateKey] as any).map((item: BaseEntity) => 
            (acceptedIds as string[]).includes(item.id) ? { ...item, syncStatus: 'synced' } : item
          );
          hasChanges = true;
        }
      }

      // 2. Integrar actualizaciones que vienen del servidor (Pull)
      for (const [colName, serverItems] of Object.entries(result.serverUpdates)) {
        const stateKey = collectionMapping[colName];
        const items = serverItems as any[];
        if (stateKey && items.length > 0) {
          items.forEach(sItem => {
            const localIdx = (newState[stateKey] as any[]).findIndex(l => l.id === sItem.id);
            if (localIdx === -1) {
              (newState[stateKey] as any[]).push({ ...sItem, syncStatus: 'synced' });
            } else {
              const localItem = (newState[stateKey] as any[])[localIdx];
              // Resolución LWW en el cliente
              if (new Date(sItem.lastModified) > new Date(localItem.lastModified || 0)) {
                (newState[stateKey] as any[])[localIdx] = { ...sItem, syncStatus: 'synced' };
              }
            }
          });
          hasChanges = true;
        }
      }

      if (hasChanges) {
        setData(newState);
        await dbService.saveState(newState);
      }

      localStorage.setItem('LAST_SYNC_TIMESTAMP', new Date().toISOString());
    } catch (err: any) {
      console.error("Sync process failed:", err);
      setLastError(err.message);
    } finally {
      setIsSyncing(false);
    }
  }, [data, online, isSyncing, setData]);

  // Disparador por inactividad (Debounce)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      performSync();
    }, SYNC_INTERVAL);
    return () => clearTimeout(timer);
  }, [data, performSync]);

  return { isSyncing, lastError, online };
};
