
import { Dispatch, SetStateAction, useCallback, useMemo } from 'react';
import { AppState, InventoryItem, Movement, Unit, PlannedLabor, CostCenter, BudgetPlan, InitialMovementDetails, AuditLog } from '../types';
import { processInventoryMovement, generateId, getBaseUnitType, convertToBase } from '../services/inventoryService';

export const useAppActions = (
  data: AppState,
  setData: Dispatch<SetStateAction<AppState>>,
  notify: (msg: string, type: 'success' | 'error') => void
) => {

  // Helper para generar logs de auditoría de forma silenciosa
  const logAudit = useCallback((action: AuditLog['action'], entity: AuditLog['entity'], entityId: string, details: string, prev?: any, next?: any) => {
    const newLog: AuditLog = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      userId: 'admin_local',
      action,
      entity,
      entityId,
      details,
      previousData: prev ? JSON.stringify(prev) : undefined,
      newData: next ? JSON.stringify(next) : undefined
    };
    setData(prev => ({ ...prev, auditLogs: [newLog, ...(prev.auditLogs || []).slice(0, 1000)] }));
  }, [setData]);

  const deleteCostCenter = useCallback((id: string) => {
    const lotToDelete = data.costCenters.find(c => c.id === id);
    if (!confirm(`¿Eliminar lote ${lotToDelete?.name}?`)) return;

    setData(prev => ({
      ...prev,
      costCenters: prev.costCenters.filter(c => c.id !== id)
    }));
    logAudit('DELETE', 'lot', id, `Eliminación de lote: ${lotToDelete?.name}`, lotToDelete);
    notify('Lote eliminado.', 'success');
  }, [data, setData, notify, logAudit]);

  const saveNewItem = useCallback((item: any, initialQuantity: number, initialMovementDetails: any, initialUnit?: Unit) => {
    const baseUnit = getBaseUnitType(item.lastPurchaseUnit);
    const id = generateId();
    const newItem: any = { 
        ...item, id, warehouseId: data.activeWarehouseId, 
        baseUnit, currentQuantity: 0, averageCost: 0 
    };
    
    setData(prev => ({
        ...prev,
        inventory: [...prev.inventory, newItem]
    }));
    logAudit('CREATE', 'inventory', id, `Creación de producto: ${item.name}`, null, newItem);
    notify('Producto creado.', 'success');
  }, [data, setData, notify, logAudit]);

  const updateCostCenter = useCallback((lot: CostCenter) => {
    const prevLot = data.costCenters.find(c => c.id === lot.id);
    setData(prev => ({
      ...prev,
      costCenters: prev.costCenters.map(c => c.id === lot.id ? lot : c)
    }));
    logAudit('UPDATE', 'lot', lot.id, `Actualización de lote: ${lot.name}`, prevLot, lot);
    notify('Lote actualizado.', 'success');
  }, [data, setData, notify, logAudit]);

  const saveBudget = useCallback((budget: BudgetPlan) => {
    setData(prev => {
      const exists = prev.budgets?.find(b => b.id === budget.id);
      if (exists) {
          return { ...prev, budgets: prev.budgets.map(b => b.id === budget.id ? budget : b) };
      }
      return { ...prev, budgets: [...(prev.budgets || []), budget] };
    });
    logAudit(budget.id ? 'UPDATE' : 'CREATE', 'finance', budget.id, `Presupuesto guardado año ${budget.year}`);
    notify('Presupuesto guardado.', 'success');
  }, [setData, notify, logAudit]);

  return useMemo(() => ({
    deleteCostCenter,
    saveNewItem,
    updateCostCenter,
    saveBudget
  }), [deleteCostCenter, saveNewItem, updateCostCenter, saveBudget]);
};
