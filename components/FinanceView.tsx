
import React, { useState, useMemo } from 'react';
import { FinanceLog, AppState } from '../types';
import { formatCurrency } from '../services/inventoryService';
import { generateMonthlyPAndL } from '../services/reportService';
import { useData } from '../contexts/DataContext';
import { Landmark, TrendingUp, TrendingDown, Plus, Trash2, Calendar, FileText, Download } from 'lucide-react';

interface FinanceViewProps {
  financeLogs: FinanceLog[];
  onAddTransaction: (t: Omit<FinanceLog, 'id' | 'warehouseId'>) => void;
  onDeleteTransaction: (id: string) => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({ financeLogs, onAddTransaction, onDeleteTransaction }) => {
  const { data } = useData();
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [category, setCategory] = useState<string>('Servicios');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleExportPDF = () => {
    const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const end = new Date().toISOString().split('T')[0];
    generateMonthlyPAndL(data, start, end);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!amount || !desc) return;
      onAddTransaction({ date, type, category, amount: parseFloat(amount), description: desc });
      setAmount(''); setDesc('');
  };

  const totals = useMemo(() => {
      const income = financeLogs.filter(f => f.type === 'INCOME').reduce((acc, f) => acc + f.amount, 0);
      const expenses = financeLogs.filter(f => f.type === 'EXPENSE').reduce((acc, f) => acc + f.amount, 0);
      return { income, expenses, balance: income - expenses };
  }, [financeLogs]);

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700 shadow-xl flex justify-between items-center">
            <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Landmark className="w-6 h-6 text-indigo-400" /> Finanzas
                </h2>
                <p className="text-[10px] text-slate-400 uppercase font-black">Estado de Resultados</p>
            </div>
            <button 
                onClick={handleExportPDF}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg transition-all active:scale-95"
            >
                <FileText className="w-4 h-4" /> PDF P&L
            </button>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-3">Registrar Movimiento</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                    <button type="button" onClick={() => setType('EXPENSE')} className={`flex-1 py-2 text-xs font-bold rounded ${type === 'EXPENSE' ? 'bg-white dark:bg-slate-700 text-red-500 shadow-sm' : 'text-slate-500'}`}>Gasto</button>
                    <button type="button" onClick={() => setType('INCOME')} className={`flex-1 py-2 text-xs font-bold rounded ${type === 'INCOME' ? 'bg-white dark:bg-slate-700 text-emerald-500 shadow-sm' : 'text-slate-500'}`}>Ingreso</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border rounded-lg p-2 text-sm" placeholder="Monto $" required />
                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border rounded-lg p-2 text-sm"><option>Servicios</option><option>Impuestos</option><option>Administracion</option><option>Otros</option></select>
                </div>
                <input type="text" value={desc} onChange={e => setDesc(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border rounded-lg p-2 text-sm" placeholder="Descripción" required />
                <button type="submit" className="w-full bg-slate-700 text-white font-bold py-3 rounded-lg text-sm">Guardar Registro</button>
            </form>
        </div>

        <div className="space-y-3">
            {financeLogs.slice().reverse().map(log => (
                <div key={log.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl border flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${log.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                            {log.type === 'INCOME' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        </div>
                        <div><p className="font-bold text-sm dark:text-white">{log.category}</p><p className="text-xs text-slate-500">{log.description}</p></div>
                    </div>
                    <p className={`font-mono font-bold ${log.type === 'INCOME' ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrency(log.amount)}</p>
                </div>
            ))}
        </div>
    </div>
  );
};
