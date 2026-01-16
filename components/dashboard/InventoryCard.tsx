
import React from 'react';
import { InventoryItem } from '../../types';
import { formatCurrency, formatBaseQuantity } from '../../services/inventoryService';
import { LayoutGrid, AlertTriangle, Image as ImageIcon, Activity, TrendingUp, TrendingDown, History, Trash2 } from 'lucide-react';

interface InventoryCardProps {
  item: InventoryItem;
  abcClass: 'A' | 'B' | 'C';
  isLowStock: boolean;
  onAddMovement: (item: InventoryItem, type: 'IN' | 'OUT') => void;
  onViewHistory: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  isAdmin?: boolean;
}

const InventoryCardBase: React.FC<InventoryCardProps> = ({
  item,
  abcClass,
  isLowStock,
  onAddMovement,
  onViewHistory,
  onDelete,
  isAdmin
}) => {
  const baseUnit = item.baseUnit;
  const costPerBase = item.averageCost;
  
  const costPerKgOrL = baseUnit === 'unit' ? costPerBase : costPerBase * 1000;
  const costPerBulto = costPerBase * 50000;

  const labelMicro = baseUnit === 'g' ? 'Gramo' : baseUnit === 'ml' ? 'Ml' : 'Unidad';
  const labelMacro = baseUnit === 'g' ? 'Kg' : baseUnit === 'ml' ? 'Litro' : 'Unidad';

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-[2.5rem] p-5 lg:p-6 shadow-xl border transition-all hover:shadow-2xl relative group ${isLowStock ? 'border-red-500/40 ring-1 ring-red-500/20' : 'border-slate-200 dark:border-slate-700'}`}>
        
        {/* ABC BADGE */}
        <div className={`absolute top-4 right-4 text-[9px] font-black px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${abcClass === 'A' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : abcClass === 'B' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500' : 'bg-slate-500/10 border-slate-500/30 text-slate-500'}`}>
            CAT. {abcClass}
        </div>

        <div className="flex gap-4 mb-5 mt-4">
            <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-3xl bg-slate-100 dark:bg-slate-900 flex-shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner relative">
                {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700"><ImageIcon className="w-8 h-8 lg:w-10 lg:h-10" /></div>}
                {isLowStock && <div className="absolute inset-0 bg-red-600/10 animate-pulse border-2 border-red-500/30 rounded-3xl"></div>}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h3 className="font-black text-slate-800 dark:text-white text-lg lg:text-xl leading-tight truncate pr-10">{item.name}</h3>
                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1">{item.category}</p>
                <div className="mt-2">
                    <p className={`text-2xl lg:text-3xl font-black font-mono tracking-tighter ${isLowStock ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>{formatBaseQuantity(item.currentQuantity, item.baseUnit)}</p>
                    <p className="text-[8px] text-slate-400 uppercase font-black tracking-tighter">Stock actual</p>
                </div>
            </div>
        </div>

        {/* ANÁLISIS DE COSTOS COMPACTO */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-3 mb-5">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-0.5">
                    <p className="text-[8px] text-slate-500 font-bold uppercase">Valor {labelMicro}</p>
                    <p className="text-sm lg:text-base font-black text-indigo-500 font-mono leading-none">{formatCurrency(costPerBase, 2)}</p>
                </div>
                <div className="space-y-0.5 text-right border-l border-slate-200 dark:border-slate-800 pl-4">
                    <p className="text-[8px] text-slate-500 font-bold uppercase">Valor {labelMacro}</p>
                    <p className="text-sm lg:text-base font-black text-indigo-500 font-mono leading-none">{formatCurrency(costPerKgOrL)}</p>
                </div>
            </div>

            {baseUnit === 'g' && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <p className="text-[8px] text-slate-400 font-black uppercase">Equiv. Bulto (50kg)</p>
                    <p className="text-[11px] lg:text-xs font-black text-slate-700 dark:text-slate-300 font-mono">{formatCurrency(costPerBulto)}</p>
                </div>
            )}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2">
            <button 
                onClick={() => onAddMovement(item, 'IN')} 
                className="py-3.5 lg:py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] lg:text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
            >
                <TrendingUp className="w-4 h-4" /> Entrada
            </button>
            <button 
                onClick={() => onAddMovement(item, 'OUT')} 
                className="py-3.5 lg:py-4 rounded-2xl bg-slate-200 dark:bg-slate-700 hover:bg-red-600 hover:text-white text-slate-700 dark:text-slate-200 font-black text-[10px] lg:text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg"
            >
                <TrendingDown className="w-4 h-4" /> Salida
            </button>
        </div>
        
        <div className="flex gap-2">
            <button 
                onClick={() => onViewHistory(item)} 
                className="flex-1 py-3.5 lg:py-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-black text-[10px] lg:text-xs uppercase tracking-widest transition-all hover:bg-indigo-600 hover:text-white flex items-center justify-center gap-2 active:scale-95"
            >
                <History className="w-4 h-4" /> Kárdex
            </button>
            {isAdmin && (
                <button 
                    onClick={() => onDelete(item.id)} 
                    className="p-3.5 lg:p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-400 hover:text-red-500 border border-slate-200 dark:border-slate-800 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
        </div>
    </div>
  );
};

export const InventoryCard = React.memo(InventoryCardBase);
