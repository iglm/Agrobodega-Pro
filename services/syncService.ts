
// Fix: Added missing React import to resolve errors with React types and hooks
import React from 'react';
import { AppState, BaseEntity, SyncStatus } from '../types';
import { dbService } from './db';

const API_BASE_URL = 'https://api.datosfincaviva.com/v1'; // URL Imaginaria de tu backend
const SYNC_DEBOUNCE_MS = 5000; // Esperar 5 segundos de inactividad para sincronizar

interface SyncResult {
  success: boolean;
  error?: string;
  syncedIds: string[];
}

/**
 * Identifica qué colecciones necesitan sincronización
 */
const getPendingItems = (data: AppState) => {
  const collections: (keyof AppState)[] = ['inventory', 'movements', 'laborLogs', 'harvests', 'costCenters'];
  const pending: { collection: string; items: any[] }[] = [];

  collections.forEach(key => {
    const items = (data[key] as any[] || []).filter(
      (item: BaseEntity) => item.syncStatus === 'pending_sync'
    );
    if (items.length > 0) {
      pending.push({ collection: key, items });
    }
  });

  return pending;
};

/**
 * Lógica de envío a API REST
 */
const pushCollectionToCloud = async (collection: string, items: any[]): Promise<string[]> => {
  if (!navigator.onLine) throw new Error('Offline');

  try {
    const response = await fetch(`${API_BASE_URL}/${collection}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('AUTH_TOKEN') || 'local_user_token'}`
      },
      body: JSON.stringify({
        items,
        clientTimestamp: new Date().toISOString(),
        strategy: 'LWW' // Last Write Wins
      })
    });

    if (!response.ok) throw new Error(`Server Error: ${response.status}`);
    
    const result = await response.json();
    return result.acceptedIds || items.map(i => i.id);
  } catch (error) {
    console.error(`Error sincronizando ${collection}:`, error);
    return [];
  }
};

/**
 * Hook Principal para ser usado en App.tsx o MainLayout.tsx
 */
// Fix: Use React namespace for type definitions in function parameters
export const useSyncService = (data: AppState, setData: React.Dispatch<React.SetStateAction<AppState>>) => {
  // Fix: Use React namespace for hook initialization
  const [syncing, setSyncing] = React.useState(false);
  const [lastSyncError, setLastSyncError] = React.useState<string | null>(null);

  // Fix: Use React namespace for useCallback hook
  const performSync = React.useCallback(async () => {
    const pendingData = getPendingItems(data);
    if (pendingData.length === 0 || !navigator.onLine) return;

    setSyncing(true);
    setLastSyncError(null);

    try {
      const updatedState = { ...data };
      let anyChange = false;

      for (const group of pendingData) {
        const syncedIds = await pushCollectionToCloud(group.collection, group.items);
        
        if (syncedIds.length > 0) {
          anyChange = true;
          // Actualizar estado local a 'synced'
          (updatedState[group.collection as keyof AppState] as any) = (updatedState[group.collection as keyof AppState] as any).map(
            (item: BaseEntity) => syncedIds.includes(item.id) 
              ? { ...item, syncStatus: 'synced' as SyncStatus } 
              : item
          );
        }
      }

      if (anyChange) {
        setData(updatedState);
        await dbService.saveState(updatedState);
      }
    } catch (err: any) {
      setLastSyncError(err.message);
    } finally {
      setSyncing(false);
    }
  }, [data, setData]);

  // Efecto 1: Disparar sincronización por cambios en datos (Debounced)
  // Fix: Use React namespace for useEffect hook
  React.useEffect(() => {
    const pending = getPendingItems(data);
    if (pending.length === 0) return;

    const timer = setTimeout(() => {
      performSync();
    }, SYNC_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [data, performSync]);

  // Efecto 2: Escuchar reconexión a internet
  // Fix: Use React namespace for useEffect hook
  React.useEffect(() => {
    const handleOnline = () => performSync();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [performSync]);

  return { syncing, lastSyncError, isOnline: navigator.onLine };
};
