
import React, { useState, useRef } from 'react';
import { X, Upload, FileDown, AlertTriangle, CheckCircle2, Loader2, Database, ShieldAlert, Layers } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { AppState } from '../types';

interface ImportModalProps {
  onClose: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ onClose }) => {
  const { actions } = useData();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingData, setPendingData] = useState<AppState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateData = (json: any): json is AppState => {
    // Verificación de integridad mínima del esquema
    return (
      json &&
      Array.isArray(json.warehouses) &&
      Array.isArray(json.inventory) &&
      Array.isArray(json.costCenters) &&
      typeof json.activeWarehouseId === 'string'
    );
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.json')) {
      setError("El archivo debe ser un formato .json válido.");
      return;
    }

    setError(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);

        if (validateData(parsed)) {
          setPendingData(parsed);
        } else {
          setError("Estructura de archivo incompatible con AgroBodega Pro.");
        }
      } catch (err) {
        setError("Error al leer el archivo. Asegúrese de que sea un JSON válido.");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const executeImport = async () => {
    if (!pendingData) return;
    setIsProcessing(true);
    try {
      await actions.importFullState(pendingData);
      onClose();
    } catch (err) {
      setError("Error crítico durante la inyección de datos.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 w-full max-w-xl rounded-[3rem] border border-slate-700 shadow-2xl overflow-hidden animate-slide-up flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-950 p-8 border-b border-slate-800 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
          <div className="flex items-center gap-4 z-10">
            <div className="bg-indigo-600/20 p-3 rounded-2xl border border-indigo-500/30">
              <Upload className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Importar Finca</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Migración de Base de Datos</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {!pendingData ? (
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-4 border-dashed rounded-[2.5rem] p-12 text-center transition-all cursor-pointer flex flex-col items-center gap-4 group
                ${isDragging ? 'border-indigo-500 bg-indigo-500/10 scale-95' : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'}`}
            >
              <FileDown className={`w-16 h-16 ${isDragging ? 'text-indigo-400 animate-bounce' : 'text-slate-600 group-hover:text-indigo-400'} transition-colors`} />
              <div>
                <p className="text-lg font-black text-white uppercase tracking-tight">Cargar Respaldo JSON</p>
                <p className="text-xs text-slate-500 font-bold uppercase mt-1">Arrastra el archivo o haz clic para buscar</p>
              </div>
              <input ref={fileInputRef} type="file" accept=".json" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" />
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-indigo-900/10 border border-indigo-500/30 rounded-3xl p-6 flex gap-5 items-start">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 shrink-0" />
                <div>
                  <h4 className="text-white font-black text-lg uppercase">Archivo Validado</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">Se detectaron los siguientes recursos listos para restaurar:</p>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <p className="text-[10px] text-slate-500 font-black uppercase">Insumos</p>
                      <p className="text-lg font-black text-white font-mono">{pendingData.inventory.length}</p>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <p className="text-[10px] text-slate-500 font-black uppercase">Lotes</p>
                      <p className="text-lg font-black text-white font-mono">{pendingData.costCenters.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-4 flex gap-4 items-center">
                <ShieldAlert className="w-6 h-6 text-red-500 shrink-0" />
                <p className="text-[10px] text-red-400 font-black uppercase leading-tight">
                  ATENCIÓN: Al confirmar, se borrarán todos los datos actuales de este dispositivo y se reemplazarán por los del archivo.
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
                  onClick={executeImport}
                  disabled={isProcessing}
                  className="flex-[2] py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs tracking-widest shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                  Confirmar Restauración
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-4 flex gap-3 items-center animate-shake">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <p className="text-xs text-red-400 font-bold">{error}</p>
            </div>
          )}

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex gap-4 items-start">
            <Layers className="w-6 h-6 text-slate-600 shrink-0" />
            <p className="text-[10px] text-slate-500 leading-relaxed italic">
              Este proceso es irreversible localmente. Le recomendamos realizar una exportación de sus datos actuales antes de proceder si desea conservarlos.
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800 text-center">
          <p className="text-[8px] text-slate-700 font-black uppercase tracking-widest">AgroBodega Data Engine • Recovery Module v3.0</p>
        </div>
      </div>
    </div>
  );
};
