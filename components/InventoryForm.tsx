
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Category, Unit, InventoryItem, Supplier, InitialMovementDetails } from '../types';
import { X, Plus, Camera, Receipt, Users, FileText, Bookmark, ShieldCheck, Loader2, AlertTriangle, Calendar, Save, BellRing } from 'lucide-react';
import { convertToBase, getBaseUnitType, formatNumberInput, parseNumberInput, formatCurrency } from '../services/inventoryService';
import { storageAdapter } from '../services/storageAdapter';
import { SecureImage } from './SecureImage';
import { Button } from './UIElements';

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
  const [initialQuantity, setInitialQuantity] = useState('');
  const [initialUnit, setInitialUnit] = useState<Unit>(Unit.BULTO_50KG);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');

  const availableUnits = useMemo(() => {
      if (category === Category.FERTILIZANTE) return [Unit.BULTO_50KG, Unit.KILO, Unit.GRAMO];
      return Object.values(Unit).filter(u => u !== Unit.BULTO_50KG);
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceVal = parseNumberInput(purchasePrice);
    const initQtyVal = parseNumberInput(initialQuantity);
    const minStockVal = parseNumberInput(minStock);

    onSave({
      name, category, lastPurchaseUnit: purchaseUnit,
      lastPurchasePrice: priceVal,
      minStock: minStockVal || undefined, // Guardar stock mínimo
      minStockUnit: purchaseUnit,
      description: '', 
      expirationDate: expirationDate || undefined, 
      safetyIntervalDays: safetyDays ? parseInt(safetyDays) : undefined,
      image 
    }, initQtyVal, {
        supplierId: selectedSupplierId || undefined,
    }, initialUnit);
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
          
          <Button variant="primary" size="lg" fullWidth type="submit" icon={Save}>GUARDAR PRODUCTO</Button>
        </form>
      </div>
    </div>
  );
};
