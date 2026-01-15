
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { AppState, CostCenter, InventoryItem, BudgetPlan, PlannedLabor, Unit, InitialMovementDetails } from '../types';
import { dbService } from '../services/db';
import { loadDataFromLocalStorage, saveDataToLocalStorage } from '../services/inventoryService';
import { useAppActions } from '../hooks/useAppActions';
import { useNotification } from './NotificationContext';

interface DataContextType {
  data: AppState;
  setData: React.Dispatch<React.SetStateAction<AppState>>;
  isDataLoaded: boolean;
  isSaving: boolean;
  actions: {
    deleteCostCenter: (id: string) => void;
    deletePersonnel: (id: string) => void;
    deleteActivity: (id: string) => void;
    saveNewItem: (item: Omit<InventoryItem, 'id' | 'currentQuantity' | 'baseUnit' | 'warehouseId' | 'averageCost'>, initialQuantity: number, initialMovementDetails?: InitialMovementDetails, initialUnit?: Unit) => void;
    addPlannedLabor: (labor: Omit<PlannedLabor, 'id' | 'warehouseId' | 'completed'>) => void;
    updateCostCenter: (lot: CostCenter) => void;
    saveBudget: (budget: BudgetPlan) => void;
    importFullState: (newState: AppState) => Promise<void>; // Nueva acción
  };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showNotification } = useNotification();
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<AppState>(() => ({
      warehouses: [], activeWarehouseId: '', inventory: [], movements: [], suppliers: [], costCenters: [], personnel: [], activities: [], laborLogs: [], harvests: [], machines: [], maintenanceLogs: [], rainLogs: [], financeLogs: [], soilAnalyses: [], ppeLogs: [], wasteLogs: [], agenda: [], phenologyLogs: [], pestLogs: [], plannedLabors: [], budgets: [], assets: [], bpaChecklist: {}, laborFactor: 1.0,
      clients: [], salesContracts: [], sales: [], auditLogs: []
  }));

  const appActions = useAppActions(data, setData, showNotification);

  // Implementación de Importación Maestra
  const importFullState = async (newState: AppState) => {
    try {
      // 1. Actualizar memoria volátil (React)
      setData(newState);
      
      // 2. Persistir en base de datos física (IndexedDB)
      await dbService.saveState(newState);
      
      // 3. Reiniciar timestamps de sincronización para evitar conflictos
      localStorage.removeItem('last_sync_timestamp');
      localStorage.removeItem('LAST_SYNC_TIMESTAMP');
      
      showNotification("¡Finca restaurada con éxito!", 'success');
    } catch (error) {
      console.error("Error en restauración:", error);
      showNotification("Fallo al restaurar la base de datos.", 'error');
      throw error;
    }
  };

  const actions = useMemo(() => ({
    ...appActions,
    importFullState
  }), [appActions, importFullState]);

  useEffect(() => {
    const initData = async () => {
        try {
            const savedState = await dbService.loadState();
            if (savedState && savedState.activeWarehouseId) {
                setData(savedState);
            } else {
                const legacy = loadDataFromLocalStorage();
                setData(legacy);
            }
        } catch (e) {
            console.error("Error cargando DB local:", e);
        } finally {
            setIsDataLoaded(true);
        }
    };
    initData();
  }, []);

  useEffect(() => {
    if (!isDataLoaded || !data.activeWarehouseId) return;
    setIsSaving(true);
    const timeoutId = setTimeout(async () => {
        try {
            await dbService.saveState(data);
            const isMigrated = localStorage.getItem('MIGRATION_COMPLETED') === 'true';
            if (!isMigrated) saveDataToLocalStorage(data);
        } catch (err) {
            console.warn("Error guardado:", err);
        } finally {
            setIsSaving(false);
        }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [data, isDataLoaded]);

  const contextValue = useMemo(() => ({
    data, setData, isDataLoaded, isSaving, actions
  }), [data, isDataLoaded, isSaving, actions]);

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
