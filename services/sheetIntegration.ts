
import { AppState, SyncStatus } from '../types';
import { dbService } from './db';

// Mock del plugin de red
const Network = {
    addListener: (event: string, callback: (status: any) => void) => {
        window.addEventListener('online', () => callback({ connected: true, connectionType: 'wifi' }));
        return { remove: () => {} };
    }
};

/**
 * Realiza una sincronización delta inteligente.
 * Solo envía registros creados después de 'last_sync_timestamp'.
 */
export const performAutoSync = async (data: AppState): Promise<void> => {
    if (!data.googleSheetsUrl) return;
    
    const lastSync = localStorage.getItem('last_sync_timestamp') || '1970-01-01T00:00:00.000Z';
    const now = new Date().toISOString();

    // Filtrar registros pendientes (creados después de la última sync)
    const newMovements = data.movements.filter(m => m.date > lastSync);
    const newHarvests = data.harvests.filter(h => h.date > lastSync);
    const newLabor = data.laborLogs.filter(l => l.date > lastSync);

    if (newMovements.length === 0 && newHarvests.length === 0 && newLabor.length === 0) return;

    try {
        const payload = {
            syncType: 'AUTO_DELTA',
            syncDate: now,
            movements: newMovements,
            harvests: newHarvests,
            labor: newLabor,
            rawBackup: data // Backup completo opcional para seguridad
        };

        const response = await fetch(data.googleSheetsUrl, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(payload)
        });

        localStorage.setItem('last_sync_timestamp', now);
        console.log("Auto-Sync completado exitosamente.");
    } catch (e) {
        console.error("Fallo Auto-Sync:", e);
    }
};

// Fix: Changed parameter type to 'any' to support enriched payloads (like MANUAL_FULL_WITH_ANALYTICS)
/**
 * Perform manual synchronization to Google Sheets / Drive.
 * Can take raw AppState or a structured payload.
 */
export const syncToGoogleSheets = async (data: any, url: string): Promise<{ success: boolean; message: string }> => {
    try {
        // Fix: Detect if the incoming data is already a wrapped payload or raw AppState
        const body = data.syncType ? data : {
            syncType: 'MANUAL_FULL',
            data: data
        };

        // Since we use no-cors, we can't read the response, but we can detect network errors
        await fetch(url, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(body)
        });
        return { success: true, message: 'Solicitud de respaldo enviada a la nube.' };
    } catch (e) {
        return { success: false, message: "Error de red: " + String(e) };
    }
};

// Inicializador del listener de red
export const initAutoSyncListener = (data: AppState) => {
    Network.addListener('networkStatusChange', (status) => {
        if (status.connected && (status.connectionType === 'wifi' || status.connectionType === '4g')) {
            performAutoSync(data);
        }
    });
};
