
import React from 'react';
import { AppState, InventoryItem, CostClassification } from '../../types';
import { generateId } from '../../services/inventoryService';

// Component Imports
import { InventoryForm } from '../InventoryForm';
import { MovementModal } from '../MovementModal';
import { ExportModal } from '../ExportModal';
import { ManualModal } from '../ManualModal';
import { WarehouseModal } from '../WarehouseModal';
import { SettingsModal } from '../SettingsModal';
import { DataModal } from '../DataModal';
import { HistoryModal } from '../HistoryModal';
import { DeleteModal } from '../DeleteModal';
import { PayrollModal } from '../PayrollModal';
import { LaborForm } from '../LaborForm';
import { 
    generatePDF, generateExcel, generateLaborReport, generateHarvestReport, 
    generateMasterPDF, generateGlobalReport, generateAgronomicDossier, 
    generateSafetyReport, generateFieldTemplates, generateFarmStructurePDF, 
    generateFarmStructureExcel
} from '../../services/reportService';

interface ModalManagerProps {
    data: AppState;
    setData: React.Dispatch<React.SetStateAction<AppState>>;
    actions: any;
    session: any;
    onShowNotification: (msg: string, type: 'success' | 'error') => void;
    
    showAddForm: boolean;
    setShowAddForm: (show: boolean) => void;
    showExport: boolean;
    setShowExport: (show: boolean) => void;
    showWarehouses: boolean;
    setShowWarehouses: (show: boolean) => void;
    showSettings: boolean;
    setShowSettings: (show: boolean) => void;
    showData: boolean;
    setShowData: (show: boolean) => void;
    showManual: boolean;
    setShowManual: (show: boolean) => void;
    showPayroll: boolean;
    setShowPayroll: (show: boolean) => void;
    showGlobalHistory: boolean;
    setShowGlobalHistory: (show: boolean) => void;
    showLaborForm: boolean;
    setShowLaborForm: (show: boolean) => void;
    
    movementModal: { item: InventoryItem; type: 'IN' | 'OUT' } | null;
    setMovementModal: (modal: { item: InventoryItem; type: 'IN' | 'OUT' } | null) => void;
    historyItem: InventoryItem | null;
    setHistoryItem: (item: InventoryItem | null) => void;
    deleteItem: InventoryItem | null;
    setDeleteItem: (item: InventoryItem | null) => void;

    currentTab: string;
    onCloseSettings: () => void;
    onSaveMovement: (mov: any, price?: number, exp?: string) => void;
    onAddCostCenterQuick: (name: string) => void;
    onAddPersonnelQuick: (name: string) => void;
    onAddSupplierQuick: (name: string) => void;
    onAddActivityQuick: (name: string, classification?: CostClassification) => void;
}

export const ModalManager: React.FC<ModalManagerProps> = ({
    data, setData, actions, session, onShowNotification,
    showAddForm, setShowAddForm,
    showExport, setShowExport,
    showWarehouses, setShowWarehouses,
    showSettings, setShowSettings,
    showData, setShowData,
    showManual, setShowManual,
    showPayroll, setShowPayroll,
    showGlobalHistory, setShowGlobalHistory,
    showLaborForm, setShowLaborForm,
    movementModal, setMovementModal,
    historyItem, setHistoryItem,
    deleteItem, setDeleteItem,
    currentTab, onCloseSettings, onSaveMovement,
    onAddCostCenterQuick, onAddPersonnelQuick, onAddSupplierQuick, onAddActivityQuick
}) => {
    const activeId = data.activeWarehouseId;
    const currentW = data.warehouses.find(w => w.id === activeId);

    const activeInventory = data.inventory.filter(i => i.warehouseId === activeId);
    const activeCostCenters = data.costCenters.filter(c => c.warehouseId === activeId);
    const activeLaborLogs = data.laborLogs.filter(l => l.warehouseId === activeId);
    const activeMovements = data.movements.filter(m => m.warehouseId === activeId);
    const activeActivities = data.activities.filter(a => a.warehouseId === activeId);
    const activePersonnel = data.personnel.filter(p => p.warehouseId === activeId);
    const activeSuppliers = data.suppliers.filter(s => s.warehouseId === activeId);

    return (
        <div className="z-[100] relative">
            {showManual && <ManualModal onClose={() => setShowManual(false)} />}
            
            {showData && <DataModal fullState={data} onRestoreData={(d) => { setData(d); setShowData(false); }} onClose={() => setShowData(false)} onShowNotification={onShowNotification} />}
            
            {(showSettings || currentTab === 'masters') && (
                <SettingsModal 
                    suppliers={activeSuppliers} costCenters={activeCostCenters} personnel={activePersonnel} activities={activeActivities} fullState={data} 
                    onUpdateState={(newState) => setData(newState)} 
                    onAddSupplier={(n,p,e,a) => setData(prev=>({...prev, suppliers:[...prev.suppliers,{id:generateId(),warehouseId:activeId,name:n,phone:p,email:e,address:a}]}))} 
                    onDeleteSupplier={(id) => setData(prev=>({...prev, suppliers: prev.suppliers.filter(s=>s.id!==id)}))} 
                    onAddCostCenter={(...args) => setData(prev=>({...prev, costCenters:[...prev.costCenters,{id:generateId(),warehouseId:activeId,name:args[0],budget:args[1],area:args[2] || 0,stage:args[3],plantCount:args[4], cropType:args[5] || 'Café',associatedCrop:args[6], cropAgeMonths: args[7], associatedCropDensity: args[8], associatedCropAge: args[9]}]}))}
                    onDeleteCostCenter={actions.deleteCostCenter} 
                    onAddPersonnel={(p) => setData(prev=>({...prev, personnel:[...prev.personnel,{...p, id:generateId(),warehouseId:activeId}]}))} 
                    onDeletePersonnel={actions.deletePersonnel} 
                    onAddActivity={(n, cls) => setData(prev=>({...prev, activities:[...prev.activities,{id:generateId(),warehouseId:activeId,name:n,costClassification:cls}]}))} 
                    onDeleteActivity={actions.deleteActivity} 
                    onClose={onCloseSettings} 
                />
            )}

            {showPayroll && <PayrollModal logs={activeLaborLogs} personnel={activePersonnel} warehouseName={currentW?.name || ""} laborFactor={data.laborFactor} onMarkAsPaid={(ids) => setData(prev => ({ ...prev, laborLogs: prev.laborLogs.map(l => ids.includes(l.id) ? { ...l, paid: true } : l) }))} onClose={() => setShowPayroll(false)} />}
            
            {showAddForm && <InventoryForm suppliers={activeSuppliers} inventory={activeInventory} onSave={(item, qty, details, unit) => { actions.saveNewItem(item, qty, details, unit); setShowAddForm(false); }} onCancel={() => setShowAddForm(false)} onAddSupplier={onAddSupplierQuick} />}
            
            {movementModal && <MovementModal item={movementModal.item} type={movementModal.type} suppliers={activeSuppliers} costCenters={activeCostCenters} personnel={activePersonnel} onSave={onSaveMovement} onCancel={() => setMovementModal(null)} onAddSupplier={onAddSupplierQuick} onAddCostCenter={onAddCostCenterQuick} onAddPersonnel={onAddPersonnelQuick} />}
            
            {historyItem && <HistoryModal item={historyItem} movements={data.movements.filter(m => m.itemId === historyItem.id)} onClose={() => setHistoryItem(null)} />}
            
            {showGlobalHistory && <HistoryModal item={{ name: 'Historial Bodega Global' } as any} movements={activeMovements} onClose={() => setShowGlobalHistory(false)} />}
            
            {deleteItem && <DeleteModal itemName={deleteItem.name} onConfirm={() => { setData(prev => ({ ...prev, inventory: prev.inventory.filter(i => i.id !== deleteItem.id), movements: prev.movements.filter(m => m.itemId !== deleteItem.id) })); setDeleteItem(null); }} onCancel={() => setDeleteItem(null)} />}
            
            {showWarehouses && <WarehouseModal warehouses={data.warehouses} activeId={activeId} onSwitch={(id) => setData(prev=>({...prev, activeWarehouseId: id}))} onCreate={(n) => setData(prev=>({...prev, warehouses: [...prev.warehouses, {id: generateId(), name: n, created: new Date().toISOString(), ownerId: session?.id || 'local_user'}]}))} onDelete={(id) => setData(prev=>({...prev, warehouses: prev.warehouses.filter(w=>w.id!==id)}))} onClose={() => setShowWarehouses(false)} />}
            
            {showExport && <ExportModal 
                onClose={() => setShowExport(false)}
                onExportExcel={() => { generateExcel(data); localStorage.setItem('LAST_BACKUP_TIMESTAMP', new Date().toISOString()); }}
                onExportMasterPDF={() => { generateMasterPDF(data); localStorage.setItem('LAST_BACKUP_TIMESTAMP', new Date().toISOString()); }}
                onExportPDF={() => generatePDF(data)}
                onExportLaborPDF={() => generateLaborReport(data)}
                onExportHarvestPDF={() => generateHarvestReport(data)}
                onExportGlobalReport={() => generateGlobalReport(data)}
                onExportAgronomicDossier={() => generateAgronomicDossier(data)}
                onExportSafetyReport={() => generateSafetyReport(data)}
                onExportFieldTemplates={() => generateFieldTemplates(data)}
                onExportStructurePDF={() => generateFarmStructurePDF(data.costCenters)}
                onExportStructureExcel={() => generateFarmStructureExcel(data.costCenters)}
            />}

            {showLaborForm && (
                <LaborForm 
                    personnel={activePersonnel} 
                    costCenters={activeCostCenters} 
                    activities={activeActivities} 
                    onSave={(log) => { setData(prev => ({ ...prev, laborLogs: [...prev.laborLogs, { ...log, id: generateId(), warehouseId: activeId, paid: false }] })); setShowLaborForm(false); onShowNotification("Jornal registrado.", 'success'); }} 
                    onCancel={() => setShowLaborForm(false)} 
                    onOpenSettings={() => { setShowLaborForm(false); setShowSettings(true); }} 
                    onAddPersonnel={onAddPersonnelQuick}
                    onAddCostCenter={onAddCostCenterQuick}
                    onAddActivity={onAddActivityQuick}
                />
            )}
        </div>
    );
};
