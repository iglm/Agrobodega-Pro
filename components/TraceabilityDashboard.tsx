
import React, { useEffect, useState, useMemo } from 'react';
import { Activity, ShieldCheck, CloudCheck, AlertCircle, Calendar, Filter, Database, Clock, ArrowRight, CheckCircle2, XCircle, Search } from 'lucide-react';
import { AuditLog } from '../types';
import { dbService } from '../services/db';

export const TraceabilityDashboard: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadLogs = async () => {
      const data = await dbService.getAuditLogs();
      setLogs(data);
    };
    loadLogs();
  }, []);

  const healthStatus = useMemo(() => {
    const lastSync = logs.find(l => l.action === 'SYNC' && l.status === 'success');
    if (!lastSync) return { label: 'Sin Sincronización', color: 'text-amber-500', icon: AlertCircle };
    
    const diff = Date.now() - new Date(lastSync.timestamp).getTime();
    const hours = diff / (1000 * 60 * 60);
    
    if (hours < 24) return { label: 'Sincronización al Día', color: 'text-emerald-500', icon: CloudCheck };
    return { label: 'Sincronización Pendiente', color: 'text-red-500', icon: AlertCircle };
  }, [logs]);

  const filteredLogs = useMemo(() => {
      return logs.filter(l => {
          const matchesAction = filter === 'ALL' || l.action === filter;
          const matchesSearch = l.details.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              l.entity.toLowerCase().includes(searchTerm.toLowerCase());
          return matchesAction && matchesSearch;
      });
  }, [logs, filter, searchTerm]);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
        <div className="bg-slate-900 p-8 rounded-[3rem] border border-slate-700 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5"><ShieldCheck className="w-64 h-64 text-white" /></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h2 className="text-white font-black text-3xl uppercase tracking-tighter flex items-center gap-3">
                        <Activity className="text-indigo-500" /> Centro de Trazabilidad
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2">Bitácora Técnica e Inmutable de la Finca</p>
                </div>
                
                <div className="bg-slate-950/80 p-6 rounded-[2rem] border border-slate-800 flex items-center gap-5 min-w-[280px]">
                    <div className={`p-3 rounded-2xl bg-slate-900 border border-slate-800 ${healthStatus.color}`}>
                        <healthStatus.icon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[9px] text-slate-500 font-black uppercase mb-1">Estado de Integridad</p>
                        <p className={`text-sm font-black uppercase ${healthStatus.color}`}>{healthStatus.label}</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* PANEL DE FILTROS */}
            <div className="lg:col-span-1 space-y-4">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Filter className="w-4 h-4" /> Filtros de Auditoría
                    </h4>
                    
                    <div className="space-y-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input 
                                type="text" 
                                placeholder="Buscar en la bitácora..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-100 dark:bg-slate-950 border border-transparent focus:border-indigo-500/50 rounded-xl py-3 pl-10 pr-4 text-xs font-bold text-slate-700 dark:text-white outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        {['ALL', 'SYNC', 'EXPORT', 'IMPORT', 'ADJUST'].map(act => (
                            <button 
                                key={act}
                                onClick={() => setFilter(act)}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${filter === act ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            >
                                {act === 'ALL' ? 'Todos los Eventos' : 
                                 act === 'SYNC' ? 'Sincronización Nube' :
                                 act === 'EXPORT' ? 'Exportación Archivos' :
                                 act === 'IMPORT' ? 'Importación Datos' : 'Ajustes de Stock'}
                                {filter === act && <CheckCircle2 className="w-3 h-3" />}
                            </button>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3 p-4 bg-amber-900/10 rounded-2xl border border-amber-500/20">
                            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                            <p className="text-[9px] text-slate-400 leading-tight">
                                <strong>Nota Técnica:</strong> Los logs de más de 90 días se purgan automáticamente para optimizar el rendimiento local.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* LISTADO DE EVENTOS */}
            <div className="lg:col-span-2">
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col h-[600px]">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-between items-center">
                        <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
                            <Database className="w-4 h-4 text-indigo-500" /> Registro de Actividad ({filteredLogs.length})
                        </h4>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                        {filteredLogs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-40">
                                <Search className="w-16 h-16 mb-4" />
                                <p className="font-black uppercase text-xs tracking-widest">Sin registros encontrados</p>
                            </div>
                        ) : (
                            filteredLogs.map(log => (
                                <div key={log.id} className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 transition-all group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${log.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                {log.status === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-white uppercase tracking-tighter">{log.action}</p>
                                                <p className="text-[8px] text-slate-500 font-bold uppercase">{log.entity} • UUID: {log.id.substring(0, 8)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 text-[9px] text-slate-400 font-mono">
                                                <Clock className="w-3 h-3" /> {new Date(log.timestamp).toLocaleTimeString()}
                                            </div>
                                            <div className="text-[8px] text-slate-500 font-black mt-1 uppercase">{new Date(log.timestamp).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed border-t border-slate-100 dark:border-slate-800 mt-2 pt-2">
                                        {log.details}
                                    </p>
                                    {log.metadata && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {Object.entries(log.metadata).map(([k, v]) => (
                                                <span key={k} className="text-[8px] bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded uppercase font-bold">
                                                    {k}: {String(v)}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
