
import React, { useMemo, useState, useEffect } from 'react';
import { InventoryItem, Movement, CostCenter, Personnel, Machine, MaintenanceLog, Supplier, AppState } from '../types';
import { formatCurrency } from '../services/inventoryService';
import { checkFarmHealth, AgroAlert } from '../services/alertService';
import { Package, Search, Activity, HardDrive, AlertTriangle, Calendar, Wrench, Rocket, CheckCircle2, Circle, ChevronRight, Lightbulb, Plus } from 'lucide-react';
import { useDashboardAnalytics, AdminAlert } from '../hooks/useDashboardAnalytics';
import { InventoryCard } from './dashboard/InventoryCard';
import { RenovationIndicator } from './dashboard/RenovationIndicator';
import { Card } from './UIElements';

interface DashboardProps {
  data: AppState;
  inventory: InventoryItem[];
  costCenters: CostCenter[];
  movements: Movement[];
  personnel?: Personnel[];
  machines?: Machine[];
  maintenanceLogs?: MaintenanceLog[];
  suppliers?: Supplier[];
  onAddMovement: (item: InventoryItem, type: 'IN' | 'OUT') => void;
  onDelete: (id: string) => void;
  onViewHistory: (item: InventoryItem) => void;
  onViewGlobalHistory?: () => void;
  onOpenExport?: () => void;
  onNavigate?: (tabId: string) => void;
  onAddItem?: () => void; // New action for FAB
  isAdmin?: boolean; 
}

const UnifiedAlertsWidget: React.FC<{ adminAlerts: AdminAlert[], agroAlerts: AgroAlert[] }> = ({ adminAlerts, agroAlerts }) => {
    if (adminAlerts.length === 0 && agroAlerts.length === 0) return null;

    return (
        <div className="bg-slate-900/50 p-5 rounded-[2rem] border border-amber-500/20 flex flex-col gap-3 animate-slide-up mb-6">
            <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Inteligencia de Alertas
            </h4>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                {agroAlerts.map(alert => (
                    <div key={alert.id} className={`shrink-0 p-4 rounded-2xl border flex items-start gap-3 min-w-[280px] max-w-[320px] ${alert.type === 'critical' ? 'bg-red-900/20 border-red-500/30' : 'bg-amber-900/20 border-amber-500/30'}`}>
                        <div className={`p-2 rounded-lg mt-1 ${alert.type === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            <Lightbulb className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-[10px] font-black uppercase ${alert.type === 'critical' ? 'text-red-400' : 'text-amber-400'}`}>{alert.message}</p>
                            <p className="text-[10px] text-slate-400 leading-tight mt-1 whitespace-normal">{alert.advice}</p>
                        </div>
                    </div>
                ))}
                {adminAlerts.map(alert => (
                    <div key={alert.id} className={`shrink-0 p-4 rounded-2xl border flex items-start gap-3 min-w-[280px] max-w-[320px] ${alert.severity === 'HIGH' ? 'bg-red-900/20 border-red-500/30' : 'bg-slate-800 border-slate-700'}`}>
                        <div className={`p-2 rounded-lg mt-1 ${alert.type === 'CONTRACT' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-orange-500/20 text-orange-400'}`}>
                            {alert.type === 'CONTRACT' ? <Calendar className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-[10px] font-black uppercase ${alert.severity === 'HIGH' ? 'text-red-400' : 'text-slate-300'}`}>{alert.type === 'CONTRACT' ? 'Vencimiento Contrato' : 'Mantenimiento'}</p>
                            <p className="text-[10px] text-slate-400 leading-tight mt-1 whitespace-normal">{alert.message}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const DashboardBase: React.FC<DashboardProps> = ({ 
  data, inventory = [], costCenters = [], movements = [], personnel = [], machines = [], maintenanceLogs = [], suppliers = [],
  onAddMovement, onDelete, onViewHistory, onViewGlobalHistory, onNavigate, onAddItem, isAdmin
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('Todos');
  const [agroAlerts, setAgroAlerts] = useState<AgroAlert[]>([]);

  const { renovationAnalysis, inventoryAnalytics, storage, adminAlerts } = useDashboardAnalytics(inventory, costCenters, movements, personnel, machines, maintenanceLogs);

  useEffect(() => {
    if (data.activeWarehouseId) {
        setAgroAlerts(checkFarmHealth(data));
    }
  }, [data]);

  const filteredInventory = useMemo(() => inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'Todos' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  }), [inventory, searchTerm, filterCategory]);

  const categories = useMemo(() => ['Todos', ...Array.from(new Set(inventory.map(i => String(i.category))))], [inventory]);

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in relative">
      
      {/* FLOATING ACTION BUTTON (MOBILE ONLY) */}
      {onAddItem && (
          <button 
            onClick={onAddItem}
            className="fixed bottom-24 right-6 lg:hidden z-50 bg-emerald-600 text-white p-5 rounded-full shadow-2xl active:scale-90 transition-transform flex items-center justify-center border-4 border-white dark:border-slate-900"
          >
              <Plus className="w-8 h-8" />
          </button>
      )}

      <Card className="bg-slate-900 border-slate-800 relative overflow-hidden !p-6 lg:!p-8">
          <div className="absolute top-0 right-0 p-8 opacity-5"><Package className="w-48 h-48 text-white" /></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 lg:gap-8">
              <div className="text-center md:text-left">
                  <p className="text-[10px] lg:text-xs font-black text-emerald-400 uppercase tracking-[0.2em] mb-2 flex items-center justify-center md:justify-start gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" /> Valorización Activa</p>
                  <p className="text-3xl lg:text-5xl font-black text-white font-mono tracking-tighter">{formatCurrency(inventoryAnalytics.totalValue)}</p>
              </div>
              <div className="flex gap-3 lg:gap-4 w-full md:w-auto">
                  <div className="bg-slate-800/50 p-4 lg:p-5 rounded-3xl border border-slate-700 text-center flex-1 md:min-w-[120px]">
                      <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Items</p>
                      <p className="text-xl lg:text-2xl font-black text-white">{inventory.length}</p>
                  </div>
                  <div className={`p-4 lg:p-5 rounded-3xl border text-center flex-1 md:min-w-[120px] ${inventoryAnalytics.lowStockCount > 0 ? 'bg-red-900/20 border-red-500/40' : 'bg-slate-800/50 border-slate-700'}`}>
                      <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Crítico</p>
                      <p className={`text-xl lg:text-2xl font-black ${inventoryAnalytics.lowStockCount > 0 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{inventoryAnalytics.lowStockCount}</p>
                  </div>
              </div>
          </div>
      </Card>

      <UnifiedAlertsWidget adminAlerts={adminAlerts} agroAlerts={agroAlerts} />
      
      {costCenters.length > 0 && <RenovationIndicator analysis={renovationAnalysis} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button onClick={onViewGlobalHistory} className="bg-slate-800 p-5 lg:p-6 rounded-3xl border border-slate-700 flex items-center gap-4 active:scale-95 transition-all hover:bg-slate-700">
              <div className="bg-indigo-600/20 p-3 rounded-xl text-indigo-400 border border-indigo-500/20"><Activity className="w-5 h-5 lg:w-6 lg:h-6" /></div>
              <div className="text-left"><p className="text-sm font-black text-white uppercase">Kárdex Global</p><p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter italic">Ver Movimientos</p></div>
          </button>
          
          <div className="bg-white dark:bg-slate-800 p-5 lg:p-6 rounded-3xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-4 w-full">
                  <div className={`p-3 rounded-xl border ${storage.percent > 80 ? 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse' : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400'}`}><HardDrive className="w-5 h-5 lg:w-6 lg:h-6" /></div>
                  <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Memoria Local</p>
                          <p className="text-[9px] font-mono text-slate-400">{storage.used.toFixed(1)} MB</p>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className={`h-full transition-all duration-1000 ${storage.percent > 80 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${storage.percent}%` }}></div></div>
                  </div>
              </div>
          </div>
      </div>

      <div className="space-y-4 lg:space-y-5">
        <div className="flex flex-col gap-3 lg:gap-4 sticky top-0 lg:top-[120px] z-20 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-xl pt-2 pb-2 transition-colors">
            <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-4 lg:p-5 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
              <Search className="w-5 h-5 text-slate-400" />
              <input type="text" placeholder="Buscar agroinsumo..." className="bg-transparent border-none outline-none text-sm lg:text-base w-full text-slate-700 dark:text-white font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              {isAdmin && (
                <button onClick={onAddItem} className="hidden lg:flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl transition-all font-black text-[10px] uppercase shadow-lg">
                    <Plus className="w-4 h-4" /> Nuevo
                </button>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map(cat => (
                <button key={cat} onClick={() => setFilterCategory(cat)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black whitespace-nowrap transition-all uppercase tracking-widest ${filterCategory === cat ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40 border-emerald-500' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'}`}>{cat}</button>
              ))}
            </div>
        </div>

        <div className="grid gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {filteredInventory.map((item) => (
                <InventoryCard key={item.id} item={item} abcClass={inventoryAnalytics.abcMap[item.id] || 'C'} isLowStock={!!(item.minStock && item.currentQuantity <= item.minStock)} onAddMovement={onAddMovement} onViewHistory={onViewHistory} onDelete={onDelete} isAdmin={isAdmin} />
            ))}
            {filteredInventory.length === 0 && (
                <div className="col-span-full py-16 text-center text-slate-400 font-bold uppercase text-xs tracking-widest bg-slate-100 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                    Sin resultados en bodega
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export const Dashboard = React.memo(DashboardBase);
