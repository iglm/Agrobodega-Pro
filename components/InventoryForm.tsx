
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Category, Unit, InventoryItem, Supplier, InitialMovementDetails } from '../types';
import { convertToBase, getBaseUnitType, formatNumberInput, parseNumberInput, formatCurrency } from '../services/inventoryService';
import { storageAdapter } from '../services/storageAdapter';
import { SecureImage } from './SecureImage';
import { Button } from './UIElements';
import { X, Plus, Camera, Receipt, Users, FileText, Bookmark, ShieldCheck, Loader2, AlertTriangle, Calendar, Save, BellRing, Package } from 'lucide-react'; // Added Package icon

interface InventoryFormProps {
  suppliers: Supplier[];
  inventory?: InventoryItem[];
  onSave: (item: Omit<InventoryItem, 'id' | 'currentQuantity' | 'baseUnit' | 'warehouseId' | 'averageCost'>, initialQuantity: number, initialMovementDetails?: InitialMovementDetails, initialUnit?: Unit) => void;
  onCancel: () => void;
  onAddSupplier: (name: string, taxId?: string, creditDays?: number) => void; 
}

export const InventoryForm: React.FC<InventoryFormProps> = ({ suppliers, inventory = [], onSave, onCancel, onAddSupplier }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>(Category.FERTILIZANTE);
  const [image, setImage] = useState<string | undefined>(undefined);
  const [isProcessingImg, setIsProcessingImg] = useState(false);
  
  const [purchaseUnit, setPurchaseUnit] = useState<Unit>(Unit.BULTO_50KG);
  const [purchasePrice, setPurchasePrice] = useState('');
  
  const [minStock, setMinStock] = useState(''); // Campo requerido
  const [expirationDate, setExpirationDate] = useState('');
  const [safetyDays, setSafetyDays] = useState('');
  
  // --- CAMPOS AGREGADOS ---
  const [initialQuantity, setInitialQuantity] = useState('');
  // Fix: Renamed to initialUnitValue to avoid conflict with initialUnit parameter in onSave
  const [initialUnitValue, setInitialUnitValue] = useState<Unit>(Unit.BULTO_50KG); // Default initial unit

  const [selectedSupplierId, setSelectedSupplierId] = useState('');

  // Estados de Creación Rápida de Proveedor
  const [isCreatingSupplier, setIsCreatingSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');

  const availableUnits = useMemo(() => {
      if (category === Category.FERTILIZANTE) return [Unit.BULTO_50KG, Unit.KILO, Unit.GRAMO];
      if (category === Category.INSECTICIDA || category === Category.FUNGICIDA || category === Category.HERBICIDA || category === Category.BIOESTIMULANTE || category === Category.DESINFECTANTE) return [Unit.LITRO, Unit.MILILITRO, Unit.GALON];
      return Object.values(Unit);
  }, [category]);

  // Sync initialUnit with availableUnits when category changes
  useEffect(() => {
      // Fix: Use initialUnitValue setter
      if (availableUnits.length > 0 && !availableUnits.includes(initialUnitValue)) {
          setInitialUnitValue(availableUnits[0]);
      }
      if (availableUnits.length > 0 && !availableUnits.includes(purchaseUnit)) {
          setPurchaseUnit(availableUnits[0]);
      }
  }, [category, availableUnits, initialUnitValue, purchaseUnit]); // Fix: Added initialUnitValue and purchaseUnit to dependencies

  // Manejador de Creación Rápida de Proveedor
  const handleCreateSupplier = (e: React.MouseEvent) => {
      e.preventDefault(); // Prevent form submission
      if(newSupplierName.trim()) { 
          onAddSupplier(newSupplierName); 
          setIsCreatingSupplier(false); 
          setNewSupplierName(''); 
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceVal = parseNumberInput(purchasePrice);
    const initQtyVal = parseNumberInput(initialQuantity);
    const minStockVal = parseNumberInput(minStock);

    onSave({
      name, 
      category, 
      lastPurchaseUnit: purchaseUnit,
      lastPurchasePrice: priceVal,
      minStock: minStockVal || undefined, 
      minStockUnit: purchaseUnit,
      description: '', 
      expirationDate: expirationDate || undefined, 
      safetyIntervalDays: safetyDays ? parseInt(safetyDays) : undefined,
      image 
    }, 
    initQtyVal, // Cantidad inicial
    {
        supplierId: selectedSupplierId || undefined, // Proveedor asociado a la compra inicial
    }, 
    // Fix: Used initialUnitValue
    initialUnitValue // Unidad de la cantidad inicial
    );
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up max-h-[95vh] flex flex-col">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-3">
             <div className="bg-emerald-500 p-3 rounded-2xl text-white shadow-lg"><Plus className="w-6 h-6" /></div>
             <h3 className="text-slate-800 dark:text-white font-black text-xl">Nuevo Producto</h3>
          </div>
          <button onClick={onCancel} className="p-2 text-slate-400"><X className="w-6 h-6" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <div className="space-y-4">
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-slate-800 dark:text-white font-bold outline-none" placeholder="Nombre (Ej: Urea / 10-30-10)" required />
              <div className="grid grid-cols-2 gap-3">
                  <select value={category} onChange={e => setCategory(e.target.value as Category)} className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-3 text-xs font-bold text-slate-600 dark:text-slate-300">{Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}</select>
                  {/* Fix: Corrected typo `setSetPurchaseUnit` to `setPurchaseUnit` */}
                  <select value={purchaseUnit} onChange={e => setPurchaseUnit(e.target.value as Unit)} className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-3 text-xs font-bold text-slate-600 dark:text-slate-300">{availableUnits.map(u => <option key={u} value={u}>{u}</option>)}</select>
              </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Precio por {purchaseUnit}</label>
                      <input type="text" value={purchasePrice} onChange={e => setPurchasePrice(formatNumberInput(e.target.value))} className="w-full bg-white dark:bg-slate-900 border rounded-2xl p-4 font-mono font-black text-emerald-600 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="$ 0" required />
                  </div>
                  <div className="space-y-1">
                      <label className="text-[10px] font-black text-orange-500 uppercase ml-2 flex items-center gap-1"><BellRing className="w-3 h-3"/> Alerta Stock Mínimo</label>
                      <input type="number" value={minStock} onChange={e => setMinStock(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-900/30 rounded-2xl p-4 font-mono font-black text-orange-500 focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Ej: 5" />
                  </div>
              </div>
          </div>

          {/* --- SECCIÓN: CANTIDAD INICIAL Y PROVEEDOR --- */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-4">
              <h4 className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-2">
                  <Package className="w-4 h-4"/> Stock Inicial y Compra
              </h4>
              <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Cantidad Inicial</label>
                      <input type="text" inputMode="decimal" value={initialQuantity} onChange={e => setInitialQuantity(formatNumberInput(e.target.value))} className="w-full bg-white dark:bg-slate-900 border rounded-2xl p-4 text-slate-800 dark:text-white font-bold outline-none" placeholder="0" required />
                  </div>
                  <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Unidad</label>
                      {/* Fix: Used initialUnitValue for selection */}
                      <select value={initialUnitValue} onChange={e => setInitialUnitValue(e.target.value as Unit)} className="w-full bg-white dark:bg-slate-900 border rounded-2xl p-4 text-xs font-bold text-slate-600 dark:text-slate-300">{availableUnits.map(u => <option key={u} value={u}>{u}</option>)}</select>
                  </div>
              </div>

              <div className="space-y-1">
                  <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1"><Users className="w-3 h-3"/> Proveedor</label>
                      <button type="button" onClick={() => setIsCreatingSupplier(!isCreatingSupplier)} className="text-[10px] text-indigo-400 font-bold uppercase">{isCreatingSupplier ? 'Cancelar' : '+ Nuevo'}</button>
                  </div>
                  {isCreatingSupplier ? (
                      <div className="flex gap-2">
                          <input type="text" value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)} placeholder="Nombre Proveedor" className="flex-1 bg-indigo-900/20 border border-indigo-500 rounded-xl p-3 text-white text-sm" autoFocus />
                          <button onClick={handleCreateSupplier} disabled={!newSupplierName} className="bg-indigo-600 text-white p-3 rounded-xl"><Save className="w-4 h-4"/></button>
                      </div>
                  ) : (
                      <select value={selectedSupplierId} onChange={e => setSelectedSupplierId(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-bold text-slate-800 dark:text-white">
                          <option value="">Seleccionar Proveedor...</option>
                          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                  )}
              </div>
          </div>
          
          <Button variant="primary" size="lg" fullWidth type="submit" icon={Save}>GUARDAR PRODUCTO</Button>
        </form>
      </div>
    </div>
  );
};
