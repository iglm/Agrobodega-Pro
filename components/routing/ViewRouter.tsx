import React from 'react';
import { AppState, InventoryItem } from '../../types';
// FIX: Import generateId to be used for creating new entities.
import { generateId } from '../../services/inventoryService';

// Component Imports
import { Dashboard } from '../Dashboard';
import { StatsView } from '../StatsView';
import { LaborView } from '../LaborView'; 
import { HarvestView } from '../HarvestView'; 
import { AgendaView } from '../AgendaView';
import { BiologicalAssetsView } from '../BiologicalAssetsView';
import { BudgetView } from '../BudgetView'; 
import { ManagementView } from '../ManagementView';
import { LotManagementView } from '../LotManagementView';
import { SanitaryView } from '../SanitaryView';
import { LaborSchedulerView } from '../LaborSchedulerView';

interface ViewRouterProps {
    currentTab: string;
    data: AppState;
    setData: React.Dispatch<React.SetStateAction<AppState>>;
    actions: any;
    onShowNotification: (msg: string, type: 'success' | 'error') => void;
    onAddMovement: (item: InventoryItem, type: 'IN' | 'OUT') => void;
    onDelete: (id: string) => void;
    onViewHistory: (item: InventoryItem) => void;
    onViewGlobalHistory: () => void;
    onNavigate: (tabId: string) => void;
    onOpenPayroll: () => void;
    onAddLabor: () => void;
    onAddCostCenterQuick: (name: string) => void;
    onAddPersonnelQuick: (name: string) => void;
    onAddActivityQuick: (name: string) => void;
}

export const ViewRouter: React.FC<ViewRouterProps> = ({
    currentTab,
    data,
    setData,
    actions,
    onShowNotification,
    onAddMovement,
    onDelete,
    onViewHistory,
    onViewGlobalHistory,
    onNavigate,
    onOpenPayroll,
    onAddLabor,
    onAddCostCenterQuick,
    onAddPersonnelQuick,
    onAddActivityQuick
}) => {
    const activeId = data.activeWarehouseId;
    
    // Data slices needed by views
    const activeInventory = data.inventory.filter(i => i.warehouseId === activeId);
    const activeCostCenters = data.costCenters.filter(c => c.warehouseId === activeId);
    const activeLaborLogs = data.laborLogs.filter(l => l.warehouseId === activeId);
    const activeHarvests = data.harvests.filter(h => h.warehouseId === activeId);
    const activeMovements = data.movements.filter(m => m.warehouseId === activeId);
    const activePlannedLabors = data.plannedLabors ? data.plannedLabors.filter(l => l.warehouseId === activeId) : [];
    const activeActivities = data.activities.filter(a => a.warehouseId === activeId);
    const activePersonnel = data.personnel.filter(p => p.warehouseId === activeId);
    const activeSuppliers = data.suppliers.filter(s => s.warehouseId === activeId);
    const activeBudgets = data.budgets || [];
    const activeMachines = data.machines.filter(m => m.warehouseId === activeId);
    const activeMaintenance = data.maintenanceLogs.filter(m => m.warehouseId === activeId);
    const activeRain = data.rainLogs.filter(r => r.warehouseId === activeId);
    const activeSoil = data.soilAnalyses.filter(s => s.warehouseId === activeId);
    const activePPE = data.ppeLogs.filter(p => p.warehouseId === activeId);
    const activeWaste = data.wasteLogs.filter(w => w.warehouseId === activeId);
    const activeAssets = data.assets.filter(a => a.warehouseId === activeId);
    const activePhenology = data.phenologyLogs.filter(l => l.warehouseId === activeId);
    const activePests = data.pestLogs.filter(l => l.warehouseId === activeId);
    const activeAgenda = data.agenda.filter(a => a.warehouseId === activeId);

    switch (currentTab) {
        case 'inventory':
            return <Dashboard 
                inventory={activeInventory} costCenters={activeCostCenters} movements={activeMovements} personnel={activePersonnel} machines={activeMachines} maintenanceLogs={activeMaintenance} suppliers={activeSuppliers}
                onAddMovement={onAddMovement} onDelete={onDelete} onViewHistory={onViewHistory} onViewGlobalHistory={onViewGlobalHistory} onOpenExport={() => {}} onNavigate={onNavigate} isAdmin={true} 
            />;

        case 'lots':
            return <LotManagementView costCenters={activeCostCenters} laborLogs={activeLaborLogs} movements={activeMovements} harvests={activeHarvests} plannedLabors={activePlannedLabors} onUpdateLot={actions.updateCostCenter} onAddPlannedLabor={actions.addPlannedLabor} activities={activeActivities} onAddCostCenter={(...args) => setData(prev=>({...prev, costCenters:[...prev.costCenters,{id:generateId(),warehouseId:activeId,name:args[0],budget:args[1],area:args[2] || 0,stage:args[3],plantCount:args[4], cropType:args[5] || 'Café',associatedCrop:args[6], cropAgeMonths: args[7], associatedCropDensity: args[8], associatedCropAge: args[9]}]}))} onDeleteCostCenter={actions.deleteCostCenter} />;
        
        case 'labor':
            return <LaborView laborLogs={activeLaborLogs} personnel={activePersonnel} costCenters={activeCostCenters} activities={activeActivities} onAddLabor={onAddLabor} onDeleteLabor={(id) => setData(prev=>({...prev, laborLogs: prev.laborLogs.filter(l=>l.id!==id)}))} isAdmin={true} onOpenPayroll={onOpenPayroll} />;
        
        case 'scheduler':
            return <LaborSchedulerView plannedLabors={activePlannedLabors} costCenters={activeCostCenters} activities={activeActivities} personnel={activePersonnel} onAddPlannedLabor={actions.addPlannedLabor} onDeletePlannedLabor={(id) => setData(prev=>({...prev, plannedLabors: prev.plannedLabors.filter(l=>l.id!==id)}))} onToggleComplete={(id)=>setData(prev=>({...prev, plannedLabors: prev.plannedLabors.map(l=>l.id===id?{...l, completed:!l.completed}:l)}))} onAddActivity={onAddActivityQuick} onAddCostCenter={onAddCostCenterQuick} onAddPersonnel={onAddPersonnelQuick} />;

        case 'sanitary':
            return <SanitaryView costCenters={activeCostCenters} pestLogs={activePests} onSaveLog={(l)=>setData(prev=>({...prev, pestLogs: [...prev.pestLogs, {...l, id: generateId(), warehouseId: activeId}]}))} />;

        case 'harvest':
            return <HarvestView harvests={activeHarvests} costCenters={activeCostCenters} onAddHarvest={(h)=>setData(prev=>({...prev, harvests: [...prev.harvests, {...h, id: generateId(), warehouseId: activeId}]}))} onDeleteHarvest={(id) => setData(prev=>({...prev, harvests: prev.harvests.filter(h=>h.id !== id)}))} onAddCostCenter={onAddCostCenterQuick} isAdmin={true} allMovements={data.movements} />;

        case 'management':
            return <ManagementView 
                machines={activeMachines} maintenanceLogs={activeMaintenance} rainLogs={activeRain} costCenters={activeCostCenters} personnel={activePersonnel} activities={activeActivities} soilAnalyses={activeSoil} ppeLogs={activePPE} wasteLogs={activeWaste} assets={activeAssets} bpaChecklist={data.bpaChecklist} phenologyLogs={activePhenology} pestLogs={activePests}
                onAddMachine={(m) => setData(prev=>({...prev, machines: [...prev.machines, {...m, id:generateId(), warehouseId:activeId}]}))} onUpdateMachine={(m) => setData(prev=>({...prev, machines: prev.machines.map(x=>x.id===m.id?m:x)}))} onAddMaintenance={(m) => setData(prev=>({...prev, maintenanceLogs: [...prev.maintenanceLogs, {...m, id:generateId(), warehouseId:activeId}]}))} onDeleteMachine={(id) => setData(prev=>({...prev, machines: prev.machines.filter(m=>m.id!==id)}))} onAddRain={(r) => setData(prev=>({...prev, rainLogs:[...prev.rainLogs,{...r,id:generateId(),warehouseId:activeId}]}))} onDeleteRain={(id) => setData(prev=>({...prev, rainLogs:prev.rainLogs.filter(r=>r.id!==id)}))} onAddSoilAnalysis={(s) => setData(prev=>({...prev, soilAnalyses: [...prev.soilAnalyses, {...s, id:generateId(), warehouseId:activeId}]}))} onDeleteSoilAnalysis={(id) => setData(prev=>({...prev, soilAnalyses: prev.soilAnalyses.filter(s=>s.id!==id)}))} onAddPPE={(p) => setData(prev=>({...prev, ppeLogs:[...prev.ppeLogs,{...p,id:generateId(),warehouseId:activeId}]}))} onDeletePPE={(id) => setData(prev=>({...prev, ppeLogs:prev.ppeLogs.filter(p=>p.id!==id)}))} onAddWaste={(w) => setData(prev=>({...prev, wasteLogs:[...prev.wasteLogs,{...w,id:generateId(),warehouseId:activeId}]}))} onDeleteWaste={(id) => setData(prev=>({...prev, wasteLogs:prev.wasteLogs.filter(w=>w.id!==id)}))} onAddAsset={(a) => setData(prev=>({...prev, assets: [...prev.assets, {...a, id:generateId(), warehouseId:activeId}]}))} onDeleteAsset={(id) => setData(prev=>({...prev, assets: prev.assets.filter(a=>a.id!==id)}))} onToggleBpa={(code) => setData(prev=>({...prev, bpaChecklist: {...prev.bpaChecklist, [code]: !prev.bpaChecklist[code]}}))} onAddPhenologyLog={(log) => setData(prev=>({...prev, phenologyLogs:[...prev.phenologyLogs,{...log, id:generateId(), warehouseId:activeId}]}))} onDeletePhenologyLog={(id) => setData(prev=>({...prev, phenologyLogs: prev.phenologyLogs.filter(l=>l.id!==id)}))} onAddPestLog={(log) => setData(prev=>({...prev, pestLogs:[...prev.pestLogs,{...log, id:generateId(), warehouseId:activeId}]}))} onDeletePestLog={(id) => setData(prev=>({...prev, pestLogs: prev.pestLogs.filter(l=>l.id!==id)}))} isAdmin={true}
            />;

        case 'assets':
            return <BiologicalAssetsView costCenters={activeCostCenters} movements={activeMovements} laborLogs={activeLaborLogs} laborFactor={data.laborFactor} onUpdateLot={actions.updateCostCenter} />;
        
        case 'budget':
            return <BudgetView budgets={activeBudgets} costCenters={activeCostCenters} activities={activeActivities} inventory={activeInventory} warehouseId={activeId} onSaveBudget={actions.saveBudget} laborLogs={activeLaborLogs} movements={activeMovements} laborFactor={data.laborFactor} onAddCostCenter={onAddCostCenterQuick} />;
        
        case 'agenda':
            return <AgendaView agenda={activeAgenda} onAddEvent={(e) => setData(prev => ({ ...prev, agenda: [...prev.agenda, { ...e, id: generateId(), warehouseId: activeId, date: new Date().toISOString(), completed: false }] }))} onToggleEvent={(id) => setData(prev => ({ ...prev, agenda: prev.agenda.map(a => a.id === id ? { ...a, completed: !a.completed } : a) }))} onDeleteEvent={(id) => setData(prev => ({ ...prev, agenda: prev.agenda.filter(a => a.id !== id) }))} />;
        
        case 'stats':
            return <StatsView laborFactor={data.laborFactor} movements={activeMovements} suppliers={activeSuppliers} costCenters={activeCostCenters} laborLogs={activeLaborLogs} harvests={activeHarvests} maintenanceLogs={activeMaintenance} rainLogs={activeRain} machines={activeMachines} budgets={activeBudgets} plannedLabors={activePlannedLabors} />;
        
        default:
            return null;
    }
}