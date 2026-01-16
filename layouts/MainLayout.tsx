
import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSyncManager } from '../services/syncManager'; 
import { checkFarmHealth } from '../services/alertService';
import { 
    LayoutDashboard, Package, Pickaxe, Target, Sprout, Briefcase, 
    Settings, Globe, ChevronDown, Download, Plus, HelpCircle, 
    CalendarRange, Calculator, Sun, Moon, LayoutGrid, Bug, 
    Settings2, Leaf, DollarSign, ClipboardList, Sparkles, 
    Search, Menu, X, Bell, LogOut, ChevronRight, Activity, 
    ShieldCheck, CloudRain, BrainCircuit, Wallet, TrendingUp, Users,
    CloudOff, CloudFog, CloudLightning, BarChart3, Upload, History,
    Home, MoreHorizontal
} from 'lucide-react';
import { generateId, processInventoryMovement, formatCurrency } from '../services/inventoryService';
import { 
    generatePDF, generateExcel, generateLaborReport, generateHarvestReport, 
    generateMasterPDF, generateGlobalReport, generateAgronomicDossier, 
    generateSafetyReport, generateFieldTemplates, generateFarmStructurePDF, 
    generateFarmStructureExcel
} from '../services/reportService';

// Component Imports
import { Dashboard } from '../components/Dashboard';
import { StatsView } from '../components/StatsView';
import { InventoryForm } from '../components/InventoryForm';
import { MovementModal } from '../components/MovementModal';
import { ExportModal } from '../components/ExportModal';
import { ManualModal } from '../components/ManualModal';
import { WarehouseModal } from '../components/WarehouseModal';
import { SettingsModal } from '../components/SettingsModal';
import { DataModal } from '../components/DataModal';
import { ImportModal } from '../components/ImportModal';
import { TraceabilityDashboard } from '../components/TraceabilityDashboard';
import { LaborView } from '../components/LaborView'; 
import { HarvestView } from '../components/HarvestView'; 
import { BiologicalAssetsView } from '../components/BiologicalAssetsView';
import { BudgetView } from '../components/BudgetView'; 
import { ManagementView } from '../components/ManagementView';
import { LotManagementView } from '../components/LotManagementView';
import { SanitaryView } from '../components/SanitaryView';
import { HistoryModal } from '../components/HistoryModal';
import { DeleteModal } from '../components/DeleteModal';
import { PayrollModal } from '../components/PayrollModal';
import { LaborSchedulerView } from '../components/LaborSchedulerView';
import { LaborForm } from '../components/LaborForm'; 
import { AIAssistant } from '../components/AIAssistant';
import { AnalyticsView } from '../components/AnalyticsView';
import { InventoryItem, CostClassification } from '../types';

interface MainLayoutProps {
  onShowNotification: (msg: string, type: 'success' | 'error') => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ onShowNotification }) => {
  const { data, setData, actions } = useData();
  const { session } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const { isSyncing: syncing, online: isOnline } = useSyncManager(data, setData);

  const [currentTab, setCurrentTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile: Closed by default
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  // UI Modals
  const [showAddForm, setShowAddForm] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showWarehouses, setShowWarehouses] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showData, setShowData] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showPayroll, setShowPayroll] = useState(false);
  const [showGlobalHistory, setShowGlobalHistory] = useState(false);
  const [showLaborForm, setShowLaborForm] = useState(false); 
  
  const [movementModal, setMovementModal] = useState<{item: InventoryItem, type: 'IN' | 'OUT'} | null>(null);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    if (data.activeWarehouseId) {
        const alerts = checkFarmHealth(data);
        if (alerts.length > 0) {
            const criticalAlert = alerts.find(a => a.type === 'critical');
            if (criticalAlert) onShowNotification(`ALERTA: ${criticalAlert.message}`, 'error');
        }
    }
  }, [data.activeWarehouseId]);

  const activeId = data.activeWarehouseId;
  const currentW = useMemo(() => data.warehouses.find(w => w.id === activeId), [data.warehouses, activeId]);

  const activeInventory = useMemo(() => data.inventory.filter(i => i.warehouseId === activeId), [data.inventory, activeId]);
  const activeCostCenters = useMemo(() => data.costCenters.filter(c => c.warehouseId === activeId), [data.costCenters, activeId]);
  const activeLaborLogs = useMemo(() => data.laborLogs.filter(l => l.warehouseId === activeId), [data.laborLogs, activeId]);
  const activeHarvests = useMemo(() => data.harvests.filter(h => h.warehouseId === activeId), [data.harvests, activeId]);
  const activeMovements = useMemo(() => data.movements.filter(m => m.warehouseId === activeId), [data.movements, activeId]);
  const activeActivities = useMemo(() => data.activities.filter(a => a.warehouseId === activeId), [data.activities, activeId]);
  const activePersonnel = useMemo(() => data.personnel.filter(p => p.warehouseId === activeId), [data.personnel, activeId]);
  const activeSuppliers = useMemo(() => data.suppliers.filter(s => s.warehouseId === activeId), [data.suppliers, activeId]);

  const sidebarLinks = [
    { id: 'overview', label: 'Inicio', icon: LayoutDashboard, color: 'text-emerald-500' },
    { type: 'divider', label: 'Operaciones' },
    { id: 'inventory', label: 'Bodega', icon: Package, color: 'text-blue-500' },
    { id: 'harvest', label: 'Comercial', icon: DollarSign, color: 'text-emerald-500' },
    { id: 'scheduler', label: 'Programar', icon: CalendarRange, color: 'text-violet-500' },
    { type: 'divider', label: 'Mi Campo' },
    { id: 'lots', label: 'Lotes', icon: LayoutGrid, color: 'text-amber-500' },
    { id: 'management', label: 'Bitácora', icon: ClipboardList, color: 'text-slate-400' },
    { id: 'sanitary', label: 'Sanidad', icon: Bug, color: 'text-red-500' },
    { id: 'assets', label: 'Activos Bio', icon: Leaf, color: 'text-emerald-400' },
    { type: 'divider', label: 'Estrategia' },
    { id: 'analytics', label: 'Finanzas', icon: BarChart3, color: 'text-emerald-600' },
    { id: 'traceability', label: 'Trazabilidad', icon: History, color: 'text-indigo-400' },
    { id: 'labor', label: 'Personal', icon: Pickaxe, color: 'text-orange-500' },
    { id: 'budget', label: 'Presupuesto', icon: Calculator, color: 'text-indigo-500' },
    { id: 'stats', label: 'BI', icon: Activity, color: 'text-rose-500' },
  ];

  const handleAddCostCenterQuick = (name: string) => {
    setData(prev => ({...prev, costCenters: [...prev.costCenters, {id: generateId(), warehouseId: activeId, name, area: 0, stage: 'Produccion', cropType: 'Café', plantCount: 0}]}));
    onShowNotification(`Lote "${name}" creado.`, 'success');
  };

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 transition-colors duration-300 font-sans overflow-hidden`}>
      
      {/* SIDEBAR OVERLAY (MOBILE) */}
      {sidebarOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] lg:hidden animate-fade-in" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-[120] ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${sidebarOpen ? 'w-80' : 'lg:w-24'} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col shadow-2xl lg:shadow-none`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
                <div className="bg-emerald-600 p-2.5 rounded-xl shadow-lg shadow-emerald-900/20 shrink-0">
                    <Globe className="w-6 h-6 text-white" />
                </div>
                {sidebarOpen && (
                    <div className="animate-fade-in whitespace-nowrap">
                        <h1 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">DatosFinca <span className="text-emerald-500">Pro</span></h1>
                        <p className="text-[9px] text-slate-500 font-black uppercase">v3.0 Enterprise</p>
                    </div>
                )}
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-slate-400"><X /></button>
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar py-4 px-3 space-y-1">
            {sidebarLinks.map((link, idx) => {
                if (link.type === 'divider') {
                    return sidebarOpen ? (
                        <p key={idx} className="text-[9px] font-black text-slate-400 uppercase px-4 pt-6 pb-2 tracking-widest">{link.label}</p>
                    ) : (
                        <div key={idx} className="h-px bg-slate-200 dark:bg-slate-800 my-4 mx-2" />
                    );
                }
                const isActive = currentTab === link.id;
                const LinkIcon = (link as any).icon;
                return (
                    <button
                        key={link.id}
                        onClick={() => { setCurrentTab(link.id); if(window.innerWidth < 1024) setSidebarOpen(false); }}
                        className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group ${isActive ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                        <LinkIcon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : link.color}`} />
                        {sidebarOpen && <span className="text-xs font-black uppercase tracking-tight">{link.label}</span>}
                        {!sidebarOpen && !isActive && <span className="absolute left-full ml-4 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">{link.label}</span>}
                    </button>
                );
            })}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2 mb-20 lg:mb-0">
            <button onClick={() => setShowImport(true)} className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-blue-500 hover:bg-blue-500/10 transition-all">
                <Upload className="w-5 h-5 shrink-0" />
                {sidebarOpen && <span className="text-[10px] font-black uppercase tracking-widest">Importar JSON</span>}
            </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        <header className="h-16 lg:h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 lg:px-8 flex items-center justify-between z-50">
            <div className="flex items-center gap-3 lg:gap-6 flex-1">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300">
                    <Menu className="w-5 h-5" />
                </button>
                <div className="max-w-md w-full relative group hidden md:block">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Búsqueda Inteligente..." className="w-full bg-slate-100 dark:bg-slate-950 border border-transparent focus:border-emerald-500/50 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold text-slate-700 dark:text-white outline-none" />
                </div>
                <button onClick={() => setShowWarehouses(true)} className="flex items-center gap-2 lg:gap-3 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all">
                    <div className="p-2 bg-indigo-600 rounded-xl shadow-lg">
                        <Globe className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left hidden xs:block">
                        <h2 className="text-[11px] lg:text-xs font-black text-slate-900 dark:text-white uppercase leading-none truncate max-w-[100px] lg:max-w-none">{currentW?.name || 'Finca'}</h2>
                        <span className="text-[8px] lg:text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none">Activa</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
            </div>

            <div className="flex items-center gap-2 lg:gap-3">
                <button onClick={toggleTheme} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 border border-slate-200 dark:border-slate-700">
                    {theme === 'dark' ? <Sun className="w-4 h-4 lg:w-5 lg:h-5" /> : <Moon className="w-4 h-4 lg:w-5 lg:h-5" />}
                </button>
                <button onClick={() => setAiPanelOpen(true)} className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-700 text-white px-3 lg:px-5 py-2.5 rounded-xl lg:rounded-2xl shadow-xl active:scale-95 transition-all">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-[10px] lg:text-xs font-black uppercase tracking-widest hidden sm:block">IA</span>
                </button>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8 bg-slate-50 dark:bg-slate-950/50 pb-32 lg:pb-8">
            <div className="max-w-7xl mx-auto">
                {currentTab === 'overview' && (
                    <div className="animate-fade-in space-y-6 lg:space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5"><DollarSign className="w-20 h-20" /></div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Valor Inventario
                                </p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{formatCurrency(activeInventory.reduce((a,b)=>a+(b.currentQuantity*b.averageCost),0))}</p>
                                <div className="mt-4 flex items-center gap-2 text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg w-fit">
                                    <TrendingUp className="w-3 h-3" /> Capital Activo
                                </div>
                            </div>
                        </div>

                        <Dashboard 
                            data={data}
                            inventory={activeInventory} 
                            costCenters={activeCostCenters} 
                            movements={activeMovements}
                            personnel={activePersonnel}
                            suppliers={activeSuppliers}
                            onAddMovement={(i, t) => setMovementModal({item: i, type: t})}
                            onDelete={(id) => { const item = data.inventory.find(i => i.id === id); if(item) setDeleteItem(item); }}
                            onViewHistory={(item) => setHistoryItem(item)}
                            onViewGlobalHistory={() => setShowGlobalHistory(true)}
                            onNavigate={(id) => setCurrentTab(id)}
                            onAddItem={() => setShowAddForm(true)}
                            isAdmin={true}
                        />
                    </div>
                )}

                {currentTab === 'traceability' && <TraceabilityDashboard />}
                {currentTab === 'analytics' && <AnalyticsView />}
                {currentTab === 'inventory' && <Dashboard data={data} inventory={activeInventory} costCenters={activeCostCenters} movements={activeMovements} onAddMovement={(i, t) => setMovementModal({item: i, type: t})} onDelete={(id) => { const item = data.inventory.find(i => i.id === id); if(item) setDeleteItem(item); }} onViewHistory={(item) => setHistoryItem(item)} onViewGlobalHistory={() => setShowGlobalHistory(true)} onAddItem={() => setShowAddForm(true)} isAdmin={true} />}
                {currentTab === 'lots' && <LotManagementView costCenters={activeCostCenters} laborLogs={activeLaborLogs} movements={activeMovements} harvests={activeHarvests} plannedLabors={data.plannedLabors} onUpdateLot={actions.updateCostCenter} onAddPlannedLabor={actions.addPlannedLabor} activities={activeActivities} onAddCostCenter={(n,b,a,s,pc,ct,ac,age,density, assocAge) => setData(prev=>({...prev, costCenters:[...prev.costCenters,{id:generateId(),warehouseId:activeId,name:n,budget:b,area:a || 0,stage:s,plantCount:pc, cropType:ct || 'Café',associatedCrop:ac, cropAgeMonths: age, associatedCropDensity: density, associatedCropAge: assocAge}]}))} onDeleteCostCenter={actions.deleteCostCenter} />}
                {currentTab === 'labor' && <LaborView laborLogs={activeLaborLogs} personnel={activePersonnel} costCenters={activeCostCenters} activities={activeActivities} onAddLabor={() => setShowLaborForm(true)} onDeleteLabor={(id) => setData(prev=>({...prev, laborLogs: prev.laborLogs.filter(l=>l.id!==id)}))} isAdmin={true} onOpenPayroll={()=>setShowPayroll(true)} />}
                {currentTab === 'scheduler' && <LaborSchedulerView plannedLabors={data.plannedLabors} costCenters={activeCostCenters} activities={activeActivities} personnel={activePersonnel} onAddPlannedLabor={actions.addPlannedLabor} onDeletePlannedLabor={(id) => setData(prev=>({...prev, plannedLabors: prev.plannedLabors.filter(l=>l.id!==id)}))} onToggleComplete={(id)=>setData(prev=>({...prev, plannedLabors: prev.plannedLabors.map(l=>l.id===id?{...l, completed:!l.completed}:l)}))} onAddActivity={(n)=>actions.onAddActivity(n)} onAddCostCenter={handleAddCostCenterQuick} onAddPersonnel={(n)=>actions.onAddPersonnel({name: n, role:'Trabajador'})} />}
                {currentTab === 'harvest' && <HarvestView harvests={activeHarvests} costCenters={activeCostCenters} onAddHarvest={(h)=>setData(prev=>({...prev, harvests: [...prev.harvests, {...h, id: generateId(), warehouseId: activeId}]}))} onDeleteHarvest={(id) => setData(prev=>({...prev, harvests: prev.harvests.filter(h=>h.id !== id)}))} onAddCostCenter={handleAddCostCenterQuick} isAdmin={true} />}
                {currentTab === 'stats' && <StatsView laborFactor={data.laborFactor} movements={activeMovements} suppliers={activeSuppliers} costCenters={activeCostCenters} laborLogs={activeLaborLogs} harvests={activeHarvests} />}
                {currentTab === 'budget' && <BudgetView budgets={data.budgets} costCenters={activeCostCenters} activities={activeActivities} inventory={activeInventory} warehouseId={activeId} onSaveBudget={actions.saveBudget} laborLogs={activeLaborLogs} movements={activeMovements} onAddCostCenter={handleAddCostCenterQuick} />}
                {currentTab === 'sanitary' && <SanitaryView costCenters={activeCostCenters} pestLogs={data.pestLogs} onSaveLog={(l)=>setData(prev=>({...prev, pestLogs: [...prev.pestLogs, {...l, id: generateId(), warehouseId: activeId}]}))} />}
                {currentTab === 'assets' && <BiologicalAssetsView costCenters={activeCostCenters} movements={activeMovements} laborLogs={activeLaborLogs} laborFactor={data.laborFactor} onUpdateLot={actions.updateCostCenter} />}
                {currentTab === 'management' && <ManagementView machines={data.machines} maintenanceLogs={data.maintenanceLogs} rainLogs={data.rainLogs} costCenters={activeCostCenters} personnel={activePersonnel} activities={activeActivities} soilAnalyses={data.soilAnalyses} ppeLogs={data.ppeLogs} wasteLogs={data.wasteLogs} assets={data.assets} bpaChecklist={data.bpaChecklist} phenologyLogs={data.phenologyLogs} pestLogs={data.pestLogs} onAddRain={(r)=>setData(prev=>({...prev, rainLogs:[...prev.rainLogs,{...r,id:generateId(),warehouseId:activeId}]}))} onDeleteRain={(id)=>setData(prev=>({...prev, rainLogs:prev.rainLogs.filter(x=>x.id!==id)}))} onAddPPE={(p)=>setData(prev=>({...prev, ppeLogs:[...prev.ppeLogs,{...p,id:generateId(),warehouseId:activeId}]}))} onDeletePPE={(id)=>setData(prev=>({...prev, ppeLogs:prev.ppeLogs.filter(x=>x.id!==id)}))} onAddWaste={(w)=>setData(prev=>({...prev, wasteLogs:[...prev.wasteLogs,{...w,id:generateId(),warehouseId:activeId}]}))} onDeleteWaste={(id)=>setData(prev=>({...prev, wasteLogs:prev.wasteLogs.filter(x=>x.id!==id)}))} isAdmin={true} />}
            </div>
        </main>

        {/* BOTTOM NAV (MOBILE) */}
        <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 flex justify-around items-center px-4 py-3 z-[100] shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
            <button onClick={() => setCurrentTab('overview')} className={`flex flex-col items-center gap-1 ${currentTab === 'overview' ? 'text-emerald-500' : 'text-slate-400'}`}>
                <Home className="w-6 h-6" />
                <span className="text-[9px] font-black uppercase">Inicio</span>
            </button>
            <button onClick={() => setCurrentTab('inventory')} className={`flex flex-col items-center gap-1 ${currentTab === 'inventory' ? 'text-blue-500' : 'text-slate-400'}`}>
                <Package className="w-6 h-6" />
                <span className="text-[9px] font-black uppercase">Bodega</span>
            </button>
            <button onClick={() => setCurrentTab('labor')} className={`flex flex-col items-center gap-1 ${currentTab === 'labor' ? 'text-orange-500' : 'text-slate-400'}`}>
                <Pickaxe className="w-6 h-6" />
                <span className="text-[9px] font-black uppercase">Nómina</span>
            </button>
            <button onClick={() => setSidebarOpen(true)} className="flex flex-col items-center gap-1 text-slate-400">
                <MoreHorizontal className="w-6 h-6" />
                <span className="text-[9px] font-black uppercase">Menú</span>
            </button>
        </nav>

        {aiPanelOpen && (
            <div className="fixed inset-0 z-[130] flex justify-end animate-fade-in">
                <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setAiPanelOpen(false)} />
                <div className="w-full max-w-lg bg-slate-900 h-full relative animate-slide-left shadow-2xl flex flex-col border-l border-slate-700">
                    <AIAssistant data={data} onClose={() => setAiPanelOpen(false)} />
                </div>
            </div>
        )}
      </div>

      {/* Capa de Modales */}
      <div className="z-[200] relative">
          {showManual && <ManualModal onClose={() => setShowManual(false)} />}
          {showData && data && <DataModal fullState={data} onRestoreData={(d) => { actions.importFullState(d); setShowData(false); }} onClose={() => setShowData(false)} onShowNotification={onShowNotification} />}
          {showImport && <ImportModal onClose={() => setShowImport(false)} />}
          {(showSettings) && data && (
            <SettingsModal 
                suppliers={activeSuppliers} 
                costCenters={activeCostCenters} 
                personnel={activePersonnel} 
                activities={activeActivities} 
                fullState={data} 
                onUpdateState={(newState) => setData(newState)} 
                onAddSupplier={(n,p,e,a) => setData(prev=>({...prev, suppliers:[...prev.suppliers,{id:generateId(),warehouseId:activeId,name:n,phone:p,email:e,address:a}]}))} 
                onDeleteSupplier={(id) => setData(prev=>({...prev, suppliers: prev.suppliers.filter(s=>s.id!==id)}))} 
                onAddCostCenter={(n,b,a,s,pc,ct,ac,age,density, assocAge) => setData(prev=>({...prev, costCenters:[...prev.costCenters,{id:generateId(),warehouseId:activeId,name:n,budget:b,area:a || 0,stage:s,plantCount:pc, cropType:ct || 'Café',associatedCrop:ac, cropAgeMonths: age, associatedCropDensity: density, associatedCropAge: assocAge}]}))} 
                onDeleteCostCenter={actions.deleteCostCenter} 
                onClose={() => setShowSettings(false)} 
            />
          )}
          {showPayroll && data && <PayrollModal logs={activeLaborLogs} personnel={activePersonnel} warehouseName={currentW?.name || ""} laborFactor={data.laborFactor} onMarkAsPaid={(ids) => setData(prev => ({ ...prev, laborLogs: prev.laborLogs.map(l => ids.includes(l.id) ? { ...l, paid: true } : l) }))} onClose={() => setShowPayroll(false)} />}
          {showAddForm && data && <InventoryForm suppliers={activeSuppliers} onSave={(item, qty, details, unit) => { actions.saveNewItem(item, qty, details, unit); setShowAddForm(false); }} onCancel={() => setShowAddForm(false)} onAddSupplier={(n)=>actions.onAddSupplier(n)} />}
          {movementModal && data && <MovementModal item={movementModal.item} type={movementModal.type} suppliers={activeSuppliers} costCenters={activeCostCenters} personnel={activePersonnel} onSave={(mov, p, e) => {
              const { updatedInventory, movementCost } = processInventoryMovement(data.inventory, mov, p, e); 
              setData(prev => ({ 
                  ...prev, 
                  inventory: updatedInventory, 
                  movements: [{ ...mov, id: generateId(), warehouseId: activeId, date: new Date().toISOString(), calculatedCost: movementCost, syncStatus: 'pending_sync' }, ...prev.movements] 
              })); 
              setMovementModal(null);
          }} onCancel={() => setMovementModal(null)} onAddSupplier={(n)=>actions.onAddSupplier(n)} onAddCostCenter={handleAddCostCenterQuick} onAddPersonnel={(n)=>actions.onAddPersonnel({name: n, role:'Trabajador'})} />}
          {historyItem && data && <HistoryModal item={historyItem} movements={data.movements.filter(m => m.itemId === historyItem.id)} onClose={() => setHistoryItem(null)} />}
          {showGlobalHistory && data && <HistoryModal item={{ name: 'Historial Bodega Global' } as any} movements={activeMovements} onClose={() => setShowGlobalHistory(false)} />}
          {deleteItem && <DeleteModal itemName={deleteItem.name} onConfirm={() => { setData(prev => ({ ...prev, inventory: prev.inventory.filter(i => i.id !== deleteItem.id), movements: prev.movements.filter(m => m.itemId !== deleteItem.id) })); setDeleteItem(null); }} onCancel={() => setDeleteItem(null)} />}
          {showWarehouses && data && <WarehouseModal warehouses={data.warehouses} activeId={activeId} onSwitch={(id) => setData(prev=>({...prev, activeWarehouseId: id}))} onCreate={(n) => setData(prev=>({...prev, warehouses: [...prev.warehouses, {id: generateId(), name: n, created: new Date().toISOString(), ownerId: session?.id || 'local_user'}]}))} onDelete={(id) => setData(prev=>({...prev, warehouses: prev.warehouses.filter(w=>w.id!==id)}))} onClose={() => setShowWarehouses(false)} />}
          {showExport && data && <ExportModal onClose={() => setShowExport(false)} onExportExcel={() => generateExcel(data)} onExportMasterPDF={() => generateMasterPDF(data)} onExportPDF={() => generatePDF(data)} onExportLaborPDF={() => generateLaborReport(data)} onExportHarvestPDF={() => generateHarvestReport(data)} onExportGlobalReport={() => generateGlobalReport(data)} onExportAgronomicDossier={() => generateAgronomicDossier(data)} onExportSafetyReport={() => generateSafetyReport(data)} onExportFieldTemplates={() => generateFieldTemplates(data)} onExportStructurePDF={() => generateFarmStructurePDF(data.costCenters)} onExportStructureExcel={() => generateFarmStructureExcel(data.costCenters)} />}
          {showLaborForm && data && (
            <LaborForm 
              personnel={activePersonnel} 
              costCenters={activeCostCenters} 
              activities={activeActivities} 
              onSave={(log) => { setData(prev => ({ ...prev, laborLogs: [...prev.laborLogs, { ...log, id: generateId(), warehouseId: activeId, paid: false, syncStatus: 'pending_sync' }] })); setShowLaborForm(false); onShowNotification("Jornal registrado.", 'success'); }} 
              onCancel={() => setShowLaborForm(false)} 
              onOpenSettings={() => { setShowLaborForm(false); setShowSettings(true); }} 
              onAddPersonnel={(n)=>actions.onAddPersonnel({name: n, role:'Trabajador'})}
              onAddCostCenter={handleAddCostCenterQuick}
              onAddActivity={(n)=>actions.onAddActivity(n)}
            />
          )}
      </div>
    </div>
  );
};
