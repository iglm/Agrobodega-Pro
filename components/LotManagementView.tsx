
import React, { useState, useMemo, useEffect } from 'react';
import { CostCenter, LaborLog, Movement, HarvestLog, PlannedLabor, Activity } from '../types';
import { formatCurrency, formatNumberInput, parseNumberInput, convertToBase } from '../services/inventoryService';
import { generateFarmStructurePDF, generateFarmStructureExcel, generateTraceabilityPDF } from '../services/reportService';
import { useData } from '../contexts/DataContext';
import { 
  MapPin, Ruler, TreePine, Calendar, Activity as ActivityIcon, 
  History, Sprout, Scissors, Save, X, AlertTriangle, 
  TrendingUp, Droplets, Pickaxe, CheckCircle2, MoreHorizontal,
  ArrowRight, Leaf, Target, Plus, Trash2, Sun, Zap, ShieldCheck,
  FileText, FileSpreadsheet, Clock, AlertCircle, Flower2, Download, Loader2, QrCode,
  // Fix: Added Printer to imports from lucide-react
  Printer
} from 'lucide-react';
import { HeaderCard, Modal, EmptyState } from './UIElements';

interface LotManagementViewProps {
  costCenters: CostCenter[];
  laborLogs: LaborLog[];
  movements: Movement[];
  harvests: HarvestLog[];
  plannedLabors: PlannedLabor[];
  onUpdateLot: (lot: CostCenter) => void;
  onAddPlannedLabor: (labor: any) => void; 
  activities: Activity[]; 
  onAddCostCenter: (name: string, budget: number, area?: number, stage?: 'Produccion' | 'Levante' | 'Infraestructura', plantCount?: number, cropType?: string, associatedCrop?: string, cropAgeMonths?: number, associatedCropDensity?: number, associatedCropAge?: number) => void;
  onDeleteCostCenter: (id: string) => void;
}

export const LotManagementView: React.FC<LotManagementViewProps> = ({
  costCenters,
  laborLogs,
  movements,
  harvests,
  plannedLabors,
  onUpdateLot,
  onAddPlannedLabor,
  activities,
  onAddCostCenter,
  onDeleteCostCenter
}) => {
  const { data } = useData();
  const [selectedLot, setSelectedLot] = useState<CostCenter | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showRenovateModal, setShowRenovateModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  
  // Create Lot States
  const [loteName, setLoteName] = useState('');
  const [loteBudget, setLoteBudget] = useState('');
  const [loteArea, setLoteArea] = useState('');
  const [loteStage, setLoteStage] = useState<'Produccion' | 'Levante' | 'Infraestructura'>('Produccion');
  const [lotePlants, setLotePlants] = useState('');
  const [loteCrop, setLoteCrop] = useState('Café');
  const [loteCropAge, setLoteCropAge] = useState('');
  
  const [associatedCrop, setAssociatedCrop] = useState('');
  const [associatedCropName, setAssociatedCropName] = useState('');
  const [associatedCropAge, setAssociatedCropAge] = useState('');
  const [associatedCropDensity, setAssociatedCropDensity] = useState('');

  const [distSurco, setDistSurco] = useState('');
  const [distPlanta, setDistPlanta] = useState('');

  const [editName, setEditName] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editPlants, setEditPlants] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editCrop, setEditCrop] = useState('');

  const commonCrops = ['Café', 'Plátano', 'Banano', 'Otro'];

  const getCropSpecs = (crop: string) => {
      if (crop === 'Plátano' || crop === 'Banano') {
        return { label: 'Sitios / Plantas', densityLow: 1000, densityHigh: 3000, productionAge: 9, densityUnit: 'Sitios/Ha' };
      }
      return { label: 'Árboles', densityLow: 4000, densityHigh: 8000, productionAge: 18, densityUnit: 'Árb/Ha' };
  };

  const currentSpecs = getCropSpecs(loteCrop);

  const handleDownloadTraceability = async (lot: CostCenter) => {
      setGeneratingId(lot.id);
      setTimeout(() => {
          generateTraceabilityPDF(lot, data);
          setGeneratingId(null);
      }, 1000);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loteName.trim()) return;
    let finalAssociatedName = associatedCrop === 'Otro' ? associatedCropName : associatedCrop;
    onAddCostCenter(loteName, loteBudget ? parseNumberInput(loteBudget) : 0, loteArea ? parseFloat(loteArea) : undefined, loteStage, lotePlants ? parseInt(lotePlants) : undefined, loteCrop, finalAssociatedName || undefined, loteCropAge ? parseInt(loteCropAge) : undefined, associatedCropDensity ? parseInt(associatedCropDensity) : undefined, associatedCropAge ? parseInt(associatedCropAge) : undefined);
    setLoteName(''); setLoteBudget(''); setLoteArea(''); setLotePlants(''); setAssociatedCrop(''); setAssociatedCropName(''); setAssociatedCropAge(''); setAssociatedCropDensity(''); setDistSurco(''); setDistPlanta(''); setLoteCropAge(''); setShowCreateModal(false);
  };

  const lotHistory = useMemo(() => {
    if (!selectedLot) return [];
    const labor = laborLogs.filter(l => l.costCenterId === selectedLot.id).map(l => ({ type: 'LABOR', date: l.date, title: l.activityName, value: l.value, icon: Pickaxe, color: 'text-amber-500' }));
    const inputs = movements.filter(m => m.costCenterId === selectedLot.id && m.type === 'OUT').map(m => ({ type: 'INPUT', date: m.date, title: `Aplicación ${m.itemName}`, value: m.calculatedCost, icon: Droplets, color: 'text-blue-500' }));
    const sales = harvests.filter(h => h.costCenterId === selectedLot.id).map(h => ({ type: 'HARVEST', date: h.date, title: `Cosecha ${h.quantity} ${h.unit}`, value: h.totalValue, icon: Target, color: 'text-emerald-500' }));
    return [...labor, ...inputs, ...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedLot, laborLogs, movements, harvests]);

  const lotMetrics = useMemo(() => {
      if (!selectedLot) return { yield: 0, cost: 0, unitCost: 0 };
      const totalCost = laborLogs.filter(l => l.costCenterId === selectedLot.id).reduce((a,b)=>a+b.value,0) + movements.filter(m => m.costCenterId === selectedLot.id && m.type === 'OUT').reduce((a,b)=>a+b.calculatedCost,0);
      const totalYield = harvests.filter(h => h.costCenterId === selectedLot.id).reduce((a,b)=>a+b.quantity,0);
      return { yield: totalYield, cost: totalCost, unitCost: totalYield > 0 ? totalCost / totalYield : 0 };
  }, [selectedLot, laborLogs, movements, harvests]);

  const handleOpenLot = (lot: CostCenter) => { setSelectedLot(lot); setEditName(lot.name); setEditArea(lot.area.toString()); setEditPlants(lot.plantCount?.toString() || '0'); setEditAge(lot.cropAgeMonths?.toString() || '0'); setEditCrop(lot.cropType); setIsEditing(false); };

  const handleOpenQR = (lot: CostCenter) => {
    setSelectedLot(lot);
    setShowQRModal(true);
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      <HeaderCard 
        title="Gestión Integral de Lotes"
        subtitle="Gemelo Digital de Campo"
        valueLabel="Área Total Finca"
        value={`${costCenters.reduce((a,b)=>a+b.area,0).toFixed(1)} Ha`}
        gradientClass="bg-gradient-to-r from-emerald-800 to-slate-900"
        icon={MapPin}
        onAction={() => setShowCreateModal(true)}
        actionLabel="Nuevo Lote"
        actionIcon={Plus}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {costCenters.map(lot => {
              const age = lot.cropAgeMonths || 0;
              const isLevante = lot.stage === 'Levante';
              const specs = getCropSpecs(lot.cropType);
              const isGen = generatingId === lot.id;

              return (
                  <div key={lot.id} onClick={() => handleOpenLot(lot)} className={`bg-white dark:bg-slate-800 p-5 rounded-[2rem] border transition-all cursor-pointer hover:shadow-xl active:scale-95 group relative overflow-hidden ${isLevante ? 'border-blue-500/30' : 'border-slate-200 dark:border-slate-700'}`}>
                      <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md ${isLevante ? 'bg-blue-500 text-white' : 'bg-emerald-500 text-white'}`}>{isLevante ? <Sprout className="w-5 h-5" /> : <TreePine className="w-5 h-5" />}</div>
                              <div>
                                  <h4 className="font-black text-slate-800 dark:text-white text-sm">{lot.name}</h4>
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${isLevante ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>{lot.stage}</span>
                              </div>
                          </div>
                          <div className="flex gap-1">
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleOpenQR(lot); }}
                                className="p-2.5 bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-indigo-600 hover:text-white rounded-xl transition-all"
                                title="QR de Trazabilidad"
                            >
                                <QrCode className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDownloadTraceability(lot); }}
                                className={`p-2.5 rounded-xl transition-all ${isGen ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-emerald-600 hover:text-white'}`}
                                title="Exportar Trazabilidad"
                            >
                                {isGen ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            </button>
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mt-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                          <div><span className="block text-[8px]">{lot.cropType}</span><span className="text-slate-800 dark:text-white text-sm">{age} Meses</span></div>
                          <div><span className="block text-[8px]">{specs.label}</span><span className="text-slate-800 dark:text-white text-sm">{lot.plantCount?.toLocaleString()}</span></div>
                      </div>
                  </div>
              );
          })}
      </div>

      <Modal isOpen={!!selectedLot && !showQRModal} onClose={() => setSelectedLot(null)} title={selectedLot?.name || 'Detalle Lote'} icon={MapPin} maxWidth="max-w-4xl">
          {selectedLot && (
              <div className="flex flex-col md:flex-row gap-6 h-full">
                  <div className="w-full md:w-1/3 space-y-6">
                      <div className="bg-slate-900 p-5 rounded-3xl border border-slate-700">
                          <h4 className="text-white font-black text-sm uppercase flex items-center gap-2 mb-4"><Ruler className="w-4 h-4 text-indigo-400"/> Estructura</h4>
                          <div className="space-y-3">
                                <div className="space-y-1"><label className="text-[9px] font-black text-slate-500 uppercase">Nombre</label><input disabled={!isEditing} value={editName} onChange={e=>setEditName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold" /></div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-500 uppercase">Área (Ha)</label><input disabled={!isEditing} type="number" value={editArea} onChange={e=>setEditArea(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold" /></div>
                                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-500 uppercase">Edad</label><input disabled={!isEditing} type="number" value={editAge} onChange={e=>setEditAge(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold" /></div>
                                </div>
                          </div>
                          <button onClick={() => handleDownloadTraceability(selectedLot)} className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                                {generatingId === selectedLot.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Exportar Trazabilidad
                          </button>
                      </div>
                      <button onClick={() => setShowRenovateModal(true)} className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black uppercase shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"><Sprout className="w-4 h-4" /> Renovar Lote</button>
                  </div>
                  <div className="w-full md:w-2/3 flex flex-col gap-6">
                      <div className="grid grid-cols-3 gap-4">
                          <div className="bg-emerald-900/10 border border-emerald-500/20 p-4 rounded-2xl"><p className="text-[10px] font-black text-emerald-600 uppercase">Producción</p><p className="text-xl font-mono font-black text-emerald-500">{formatNumberInput(lotMetrics.yield)} Kg</p></div>
                          <div className="bg-red-900/10 border border-red-500/20 p-4 rounded-2xl"><p className="text-[10px] font-black text-red-600 uppercase">Costo Total</p><p className="text-xl font-mono font-black text-red-500">{formatCurrency(lotMetrics.cost)}</p></div>
                          <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-2xl"><p className="text-[10px] font-black text-blue-600 uppercase">Costo Real/Kg</p><p className="text-xl font-mono font-black text-blue-500">{formatCurrency(lotMetrics.unitCost)}</p></div>
                      </div>
                      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden flex flex-col">
                          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center"><h4 className="font-black text-slate-700 dark:text-white text-sm uppercase flex items-center gap-2"><History className="w-4 h-4 text-indigo-500" /> Bitácora</h4></div>
                          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 max-h-80">
                              {lotHistory.length === 0 ? (<EmptyState icon={Leaf} message="Sin registros" />) : (lotHistory.map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                                      <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-900 ${item.color}`}><item.icon className="w-4 h-4" /></div>
                                      <div className="flex-1"><p className="text-xs font-bold text-slate-800 dark:text-white">{item.title}</p><p className="text-[9px] text-slate-400 uppercase font-bold">{new Date(item.date).toLocaleDateString()}</p></div>
                                      <p className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">{formatCurrency(item.value)}</p>
                                  </div>
                              )))}
                          </div>
                      </div>
                  </div>
              </div>
          )}
      </Modal>

      {/* QR MODAL (NUEVO) */}
      <Modal isOpen={showQRModal} onClose={() => setShowQRModal(false)} title="QR de Trazabilidad" icon={QrCode} maxWidth="max-w-sm">
          <div className="text-center space-y-6">
              <div className="bg-white p-6 rounded-3xl shadow-inner inline-block border-4 border-slate-200">
                {/* Generador de QR visualmente simulado o real mediante API externa */}
                <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=agrobodega-trazabilidad-${selectedLot?.id}`} 
                    alt="QR Code" 
                    className="mx-auto w-48 h-48"
                />
              </div>
              <div className="space-y-2">
                  <h4 className="text-slate-900 dark:text-white font-black text-lg uppercase tracking-tight">{selectedLot?.name}</h4>
                  <p className="text-xs text-slate-500 font-medium px-4">
                      Este código QR permite a auditores y compradores acceder al historial de labores y aplicaciones registradas bajo estándares de exportación.
                  </p>
              </div>
              <button 
                  onClick={() => window.print()} 
                  className="w-full bg-slate-900 dark:bg-slate-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95"
              >
                  {/* Fix: use Printer icon here which is now imported */}
                  <Printer className="w-5 h-5" /> Imprimir Etiqueta
              </button>
          </div>
      </Modal>
    </div>
  );
};
