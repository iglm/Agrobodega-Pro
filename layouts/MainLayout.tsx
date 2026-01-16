
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Package, Pickaxe, Target, Tractor, Database, Settings, Globe, ChevronDown, Download, Plus, HelpCircle, CalendarRange, Sprout, Calculator, Lightbulb, Sun, Moon, LayoutGrid, Bug, Settings2, Leaf, DollarSign, Briefcase, ClipboardList } from 'lucide-react';
import { generateId, processInventoryMovement } from '../services/inventoryService';
import { InventoryItem, CostClassification } from '../types';
import { ViewRouter } from '../components/routing/ViewRouter';
import { ModalManager } from '../components/modals/ModalManager';

interface MainLayoutProps {
  onShowNotification: (msg: string, type: 'success' | 'error') => void;
}

// Navigation Structure Definition
const NAV_GROUPS = [
  {
    id: 'operativo',
    label: 'Operativo',
    icon: Tractor,
    colorClass: 'text-emerald-500',
    activeClass: 'bg-emerald-500 text-white',
    items: [
      { id: 'inventory', label: 'Bodega', icon: Package },
      { id: 'harvest', label: 'Ventas', icon: Target },
      { id: 'scheduler', label: 'Programar', icon: CalendarRange },
    ]
  },
  {
    id: 'agronomia',
    label: 'Campo',
    icon: Sprout,
    colorClass: 'text-blue-500',
    activeClass: 'bg-blue-500 text-white',
    items: [
      { id: 'management', label: 'Bitácora', icon: ClipboardList },
      { id: 'sanitary', label: 'Sanidad', icon: Bug },
      { id: 'assets', label: 'Activos', icon: Leaf },
    ]
  },
  {
    id: 'gerencia',
    label: 'Gestión',
    icon: Briefcase,
    colorClass: 'text-amber-500',
    activeClass: 'bg-amber-500 text-white',
    items: [
      { id: 'labor', label: 'Nómina', icon: Pickaxe },
      { id: 'budget', label: 'Presupuesto', icon: Calculator },
      { id: 'stats', label: 'KPIs', icon: Database },
    ]
  },
  {
    id: 'admin',
    label: 'Config',
    icon: Settings,
    colorClass: 'text-slate-500',
    activeClass: 'bg-slate-700 text-white',
    items: [
      { id: 'lots', label: 'Mapa Lotes', icon: LayoutGrid },
      { id: 'masters', label: 'Maestros', icon: Settings2 },
    ]
  }
];

export const MainLayout: React.FC<MainLayoutProps> = ({ onShowNotification }) => {
  const { data, setData, actions } = useData();
  const { session } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [currentTab, setCurrentTab] = useState('inventory');
  const [activeGroup, setActiveGroup] = useState('operativo');
  
  // UI States (Modals)
  const [showAddForm, setShowAddForm] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showWarehouses, setShowWarehouses] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showData, setShowData] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showPayroll, setShowPayroll] = useState(false);
  const [showGlobalHistory, setShowGlobalHistory] = useState(false);
  const [showLaborForm, setShowLaborForm] = useState(false); 
  
  // Item specific modals
  const [movementModal, setMovementModal] = useState<{item: InventoryItem, type: 'IN' | 'OUT'} | null>(null);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null);

  const activeId = data.activeWarehouseId;
  const currentW = useMemo(() => data.warehouses.find(w => w.id === activeId), [data.warehouses, activeId]);

  // Sync active group with currentTab if changed externally
  useEffect(() => {
    const foundGroup = NAV_GROUPS.find(g => g.items.some(item => item.id === currentTab));
    if (foundGroup && foundGroup.id !== activeGroup) {
      setActiveGroup(foundGroup.id);
    }
  }, [currentTab, activeGroup]);

  // --- MEMOIZED DATA SLICES (Performance Optimization) ---
  const activeInventory = useMemo(() => data.inventory.filter(i => i.warehouseId === activeId), [data.inventory, activeId]);
  const activeCostCenters = useMemo(() => data.costCenters.filter(c => c.warehouseId === activeId), [data.costCenters, activeId]);
  const activeLaborLogs = useMemo(() => data.laborLogs.filter(l => l.warehouseId === activeId), [data.laborLogs, activeId]);
  const activeHarvests = useMemo(() => data.harvests.filter(h => h.warehouseId === activeId), [data.harvests, activeId]);
  const activeMovements = useMemo(() => data.movements.filter(m => m.warehouseId === activeId), [data.movements, activeId]);
  const activePlannedLabors = useMemo(() => data.plannedLabors ? data.plannedLabors.filter(l => l.warehouseId === activeId) : [], [data.plannedLabors, activeId]);
  const activeActivities = useMemo(() => data.activities.filter(a => a.warehouseId === activeId), [data.activities, activeId]);
  const activePersonnel = useMemo(() => data.personnel.filter(p => p.warehouseId === activeId), [data.personnel, activeId]);
  const activeSuppliers = useMemo(() => data.suppliers.filter(s => s.warehouseId === activeId), [data.suppliers, activeId]);
  const activeBudgets = useMemo(() => data.budgets || [], [data.budgets]); 
  const activeMachines = useMemo(() => data.machines.filter(m => m.warehouseId === activeId), [data.machines, activeId]);
  const activeMaintenance = useMemo(() => data.maintenanceLogs.filter(m => m.warehouseId === activeId), [data.maintenanceLogs, activeId]);
  const activeRain = useMemo(() => data.rainLogs.filter(r => r.warehouseId === activeId), [data.rainLogs, activeId]);
  const activeSoil = useMemo(() => data.soilAnalyses.filter(s => s.warehouseId === activeId), [data.soilAnalyses, activeId]);
  const activePPE = useMemo(() => data.ppeLogs.filter(p => p.warehouseId === activeId), [data.ppeLogs, activeId]);
  const activeWaste = useMemo(() => data.wasteLogs.filter(w => w.warehouseId === activeId), [data.wasteLogs, activeId]);
  const activeAssets = useMemo(() => data.assets.filter(a => a.warehouseId === activeId), [data.assets, activeId]);
  const activePhenology = useMemo(() => data.phenologyLogs.filter(l => l.warehouseId === activeId), [data.phenologyLogs, activeId]);
  const activePests = useMemo(() => data.pestLogs.filter(l => l.warehouseId === activeId), [data.pestLogs, activeId]);
  const activeAgenda = useMemo(() => data.agenda.filter(a => a.warehouseId === activeId), [data.agenda, activeId]);

  // --- STABLE CALLBACKS FOR DASHBOARD & VIEWS ---
  const handleDashboardAddMovement = useCallback((i: InventoryItem, t: 'IN' | 'OUT') => { setMovementModal({item: i, type: t}); }, []);
  const handleDashboardDelete = useCallback((id: string) => { const item = data.inventory.find(i => i.id === id); if (item) setDeleteItem(item); }, [data.inventory]);
  const handleDashboardHistory = useCallback((item: InventoryItem) => { setHistoryItem(item); }, []);
  const handleDashboardGlobalHistory = useCallback(() => { setShowGlobalHistory(true); }, []);
  const handleNavigate = useCallback((tabId: string) => {
    const foundGroup = NAV_GROUPS.find(g => g.items.some(item => item.id === tabId));
    if (foundGroup) {
      setActiveGroup(foundGroup.id);
      setCurrentTab(tabId);
    } else if (tabId === 'masters') {
      setShowSettings(true);
    }
  }, []);

  // --- QUICK ADD HANDLERS ---
  const handleAddCostCenterQuick = useCallback((name: string) => {
      setData(prev => ({ ...prev, costCenters: [...prev.costCenters, { id: generateId(), warehouseId: activeId, name, area: 0, stage: 'Produccion', cropType: 'Café', plantCount: 0 }] }));
      onShowNotification(`Lote "${name}" creado.`, 'success');
  }, [setData, activeId, onShowNotification]);

  const handleAddPersonnelQuick = useCallback((name: string) => {
      setData(prev => ({ ...prev, personnel: [...prev.personnel, { id: generateId(), warehouseId: activeId, name, role: 'Trabajador' }] }));
      onShowNotification(`Trabajador "${name}" registrado.`, 'success');
  }, [setData, activeId, onShowNotification]);

  const handleAddSupplierQuick = useCallback((name: string) => {
      setData(prev => ({ ...prev, suppliers: [...prev.suppliers, { id: generateId(), warehouseId: activeId, name }] }));
      onShowNotification(`Proveedor "${name}" añadido.`, 'success');
  }, [setData, activeId, onShowNotification]);

  const handleAddActivityQuick = useCallback((name: string, classification: CostClassification = 'JOINT') => {
      setData(prev => ({ ...prev, activities: [...prev.activities, { id: generateId(), warehouseId: activeId, name, costClassification: classification }] }));
      onShowNotification(`Labor "${name}" creada.`, 'success');
  }, [setData, activeId, onShowNotification]);

  // --- MODAL SAVE HANDLERS ---
  const handleSaveMovement = useCallback((mov: any, price?: number, exp?: string) => {
      const { updatedInventory, movementCost } = processInventoryMovement(data.inventory, mov, price, exp); 
      setData(prev => ({ ...prev, inventory: updatedInventory, movements: [{ ...mov, id: generateId(), warehouseId: activeId, date: new Date().toISOString(), calculatedCost: movementCost }, ...prev.movements] })); 
      setMovementModal(null);
  }, [data.inventory, setData, activeId]);

  const handleCloseSettings = () => {
    setShowSettings(false);
    if (currentTab === 'masters') setCurrentTab('inventory'); 
  };

  return (
    <>
      <header className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border-b-2 border-slate-300 dark:border-slate-800 sticky top-0 z-40 px-4 py-2 pt-10 sm:pt-2">
        <div className="max-w-4xl mx-auto flex flex-col gap-2">
            <div className="flex justify-between items-center mb-1">
                <button onClick={() => setShowWarehouses(true)} className="flex items-center gap-2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                    <div className="p-1.5 bg-emerald-600 rounded-lg shadow-lg"><Globe className="w-4 h-4 text-white" /></div>
                    <div className="text-left"><h1 className="text-sm font-black flex items-center gap-1 text-slate-900 dark:text-white">DatosFinca Viva <ChevronDown className="w-3 h-3" /></h1><span className="text-[9px] text-slate-500 uppercase font-black">{currentW?.name || 'Seleccionar Finca'}</span></div>
                </button>
                <div className="flex gap-1 items-center">
                    <button onClick={() => setShowManual(true)} className="p-2 text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors"><HelpCircle className="w-5 h-5" /></button>
                    <button onClick={() => setShowData(true)} className="p-2 text-orange-600 hover:text-orange-400 transition-colors"><Database className="w-5 h-5" /></button>
                    <button onClick={toggleTheme} className="flex items-center gap-2 px-3 py-1.5 bg-slate-200 dark:bg-slate-800 rounded-full border border-slate-300 dark:border-slate-700 active:scale-95 transition-all">
                      {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-700" />}
                    </button>
                </div>
            </div>

            <div className="flex bg-slate-200 dark:bg-slate-950 p-1 rounded-2xl gap-1 overflow-x-auto scrollbar-hide">
                {NAV_GROUPS.map(group => (
                    <button key={group.id} onClick={() => setActiveGroup(group.id)} className={`flex-1 min-w-[80px] py-2 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${activeGroup === group.id ? `shadow-md ${group.activeClass}` : `text-slate-500 hover:text-slate-700 dark:hover:text-slate-300`}`}>
                        <group.icon className="w-4 h-4" />
                        {group.label}
                    </button>
                ))}
            </div>

            <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl gap-2 overflow-x-auto scrollbar-hide border border-slate-300 dark:border-slate-800 animate-fade-in key={activeGroup}">
                {NAV_GROUPS.find(g => g.id === activeGroup)?.items.map(tab => (
                    <button key={tab.id} onClick={() => setCurrentTab(tab.id)} className={`flex-1 min-w-[90px] py-3 rounded-xl text-[10px] font-black uppercase flex flex-col items-center gap-1 transition-all ${currentTab === tab.id ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-emerald-400 shadow-md ring-1 ring-slate-200 dark:ring-slate-700' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>
                        <tab.icon className={`w-5 h-5 ${currentTab === tab.id ? 'text-emerald-500' : 'text-slate-400'}`} />
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 pb-40">
        <ViewRouter 
            currentTab={currentTab}
            data={data}
            setData={setData}
            actions={actions}
            onShowNotification={onShowNotification}
            onAddMovement={handleDashboardAddMovement}
            onDelete={handleDashboardDelete}
            onViewHistory={handleDashboardHistory}
            onViewGlobalHistory={handleDashboardGlobalHistory}
            onNavigate={handleNavigate}
            onOpenPayroll={() => setShowPayroll(true)}
            onAddLabor={() => setShowLaborForm(true)}
            onAddCostCenterQuick={handleAddCostCenterQuick}
            onAddPersonnelQuick={handleAddPersonnelQuick}
            onAddActivityQuick={handleAddActivityQuick}
        />
      </main>

      <div className="fixed bottom-6 left-6 flex gap-2 z-30">
        <button onClick={() => setShowExport(true)} className="p-4 bg-slate-800 text-white rounded-3xl shadow-2xl border-2 border-slate-600 active:scale-90 transition-all"><Download className="w-6 h-6" /></button>
      </div>
      {currentTab === 'inventory' && <button onClick={() => setShowAddForm(true)} className="fixed bottom-6 right-6 bg-emerald-600 text-white p-5 rounded-3xl shadow-2xl border-2 border-emerald-400 active:scale-95 transition-all z-30 mr-20 sm:mr-0"><Plus className="w-8 h-8" /></button>}
      
      <ModalManager
        data={data}
        setData={setData}
        actions={actions}
        session={session}
        onShowNotification={onShowNotification}
        showAddForm={showAddForm} setShowAddForm={setShowAddForm}
        showExport={showExport} setShowExport={setShowExport}
        showWarehouses={showWarehouses} setShowWarehouses={setShowWarehouses}
        showSettings={showSettings} setShowSettings={setShowSettings}
        showData={showData} setShowData={setShowData}
        showManual={showManual} setShowManual={setShowManual}
        showPayroll={showPayroll} setShowPayroll={setShowPayroll}
        showGlobalHistory={showGlobalHistory} setShowGlobalHistory={setShowGlobalHistory}
        showLaborForm={showLaborForm} setShowLaborForm={setShowLaborForm}
        movementModal={movementModal} setMovementModal={setMovementModal}
        historyItem={historyItem} setHistoryItem={setHistoryItem}
        deleteItem={deleteItem} setDeleteItem={setDeleteItem}
        currentTab={currentTab}
        onCloseSettings={handleCloseSettings}
        onSaveMovement={handleSaveMovement}
        onAddCostCenterQuick={handleAddCostCenterQuick}
        onAddPersonnelQuick={handleAddPersonnelQuick}
        onAddSupplierQuick={handleAddSupplierQuick}
        onAddActivityQuick={handleAddActivityQuick}
      />
    </>
  );
};
