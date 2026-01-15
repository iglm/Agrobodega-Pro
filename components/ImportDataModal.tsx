
import React, { useState, useRef } from 'react';
import { X, Upload, FileJson, AlertTriangle, CheckCircle2, Loader2, ArrowRight, Database } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { dbService } from '../services/db';
import { AppState } from '../types';

interface ImportDataModalProps {
  onClose: () => void;
  onShowNotification: (msg: string, type: 'success' | 'error') => void;
}

export const ImportDataModal: React.FC<ImportDataModalProps> = ({ onClose, onShowNotification }) => {
  const { setData } = useData();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importStats, setImportStats] = useState<{ lots: number; items: number; logs: number } | null>(null);
  const [pendingData, setPendingData] = useState<AppState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndParse = (text: string) => {
    try {
      const json = JSON.parse(text) as AppState;
      
      // Validación básica de esquema AppState
      if (!json.activeWarehouseId || !Array.isArray(json.inventory) || !Array.isArray(json.costCenters)) {
        throw new Error("El archivo no tiene el formato válido de AgroBodega Pro.");
      }

      setImportStats({
        lots: json.costCenters.length,
        items: json.inventory.length,
        logs: (json.laborLogs?.length || 0) + (json.movements?.length || 0) + (json.harvests?.length || 0)
      });
      setPendingData(json);
    } catch (err: any) {
      onShowNotification(err.message || "Error al leer el archivo JSON.", 'error');
      setPendingData(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
  };

  const readFile = (file: File) => {
    if (file.type !== "application/json" && !file.name.endsWith('.json')) {
      onShowNotification("Por favor, seleccione un archivo .json válido.", 'error');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      validateAndParse(text);
      setIsProcessing(false);
    };
    reader.onerror = () => {
      onShowNotification("Error físico al leer el archivo.", 'error');
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readFile(file);
  };

  const confirmImport = async () => {
    if (!pendingData) return;
    
    setIsProcessing(true);
    try {
      // 1. Inyectar al estado global de React
      setData(pendingData);
      
      // 2. Persistir en IndexedDB inmediatamente
      await dbService.saveState(pendingData);
      
      // 3. Limpiar marcas de sincronización antiguas para evitar conflictos
      localStorage.removeItem('LAST_SYNC_TIMESTAMP');
      
      onShowNotification("¡Importación Exitosa! La finca ha sido restaurada.", 'success');
      onClose();
    } catch (err) {
      onShowNotification("Error crítico al guardar los datos importados.", 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 w-full max-w-xl rounded-[3rem] border border-slate-700 shadow-2xl overflow-hidden animate-slide-up flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-950 p-8 border-b border-slate-800 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500"></div>
          <div className="flex items-center gap-4 z-10">
            <div className="bg-blue-600/20 p-3 rounded-2xl border border-blue-500/30">
              <Upload className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-none">Importador de Datos</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Restaurar Finca desde Backup</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {!pendingData ? (
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-4 border-dashed rounded-[2.5rem] p-12 text-center transition-all cursor-pointer flex flex-col items-center gap-4 group
                ${isDragging ? 'border-blue-500 bg-blue-500/10 scale-95' : 'border-slate-800 bg-slate-950/50 hover:border-slate-600'}`}
            >
              <div className={`p-6 rounded-full bg-slate-900 border border-slate-800 group-hover:scale-110 transition-transform ${isDragging ? 'animate-bounce' : ''}`}>
                <FileJson className="w-12 h-12 text-slate-500 group-hover:text-blue-400" />
              </div>
              <div>
                <p className="text-lg font-black text-white uppercase tracking-tight">
                  {isProcessing ? "Procesando..." : "Arrastra tu archivo JSON aquí"}
                </p>
                <p className="text-xs text-slate-500 font-bold uppercase mt-1">O haz clic para seleccionar desde tu dispositivo</p>
              </div>
              <input 
                ref={fileInputRef} 
                type="file" 
                accept=".json" 
                onChange={handleFileSelect} 
                className="hidden" 
              />
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-blue-900/10 border border-blue-500/30 rounded-3xl p-6 flex gap-5 items-start">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 shrink-0" />
                <div>
                  <h4 className="text-white font-black text-lg uppercase">Archivo Validado</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">Se ha detectado una estructura de datos completa. Resumen de la importación:</p>
                  
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
                      <p className="text-[10px] text-slate-500 font-black uppercase">Lotes</p>
                      <p className="text-xl font-black text-white font-mono">{importStats?.lots}</p>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
                      <p className="text-[10px] text-slate-500 font-black uppercase">Insumos</p>
                      <p className="text-xl font-black text-white font-mono">{importStats?.items}</p>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
                      <p className="text-[10px] text-slate-500 font-black uppercase">Registros</p>
                      <p className="text-xl font-black text-white font-mono">{importStats?.logs}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-red-900/10 border border-red-500/30 rounded-2xl p-4 flex gap-4 items-center">
                <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
                <p className="text-[10px] text-red-400 font-black uppercase leading-tight">
                  Atención: Esta acción sobrescribirá todos los datos actuales de la aplicación de forma permanente.
                </p>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setPendingData(null)}
                  className="flex-1 py-4 rounded-2xl bg-slate-800 text-slate-400 font-black uppercase text-xs tracking-widest hover:bg-slate-700 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmImport}
                  disabled={isProcessing}
                  className="flex-[2] py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                  Confirmar Restauración
                </button>
              </div>
            </div>
          )}

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex gap-4 items-start">
            <div className="p-2 bg-slate-900 rounded-lg">
                <ArrowRight className="w-4 h-4 text-slate-600" />
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed italic">
              Use esta herramienta solo con archivos generados por la función "Exportar JSON" de AgroBodega Pro. No intente cargar archivos JSON externos que no cumplan con el esquema oficial.
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800 text-center">
          <p className="text-[8px] text-slate-700 font-black uppercase tracking-widest">AgroBodega Data Portability Engine • v3.0</p>
        </div>
      </div>
    </div>
  );
};
