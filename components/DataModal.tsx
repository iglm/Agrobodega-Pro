
import React, { useState, useRef } from 'react';
import { X, Upload, Download, Database, Cloud, Loader2, FileJson, AlertTriangle } from 'lucide-react';
import { AppState } from '../types';
import { syncToGoogleSheets } from '../services/sheetIntegration';
import { generateAnalyticalReport } from '../services/analyticsReportService';

interface DataModalProps {
  fullState: AppState;
  onRestoreData: (data: AppState) => void;
  onClose: () => void;
  onShowNotification: (msg: string, type: 'success' | 'error') => void;
}

/**
 * Component to manage data backup, restoration, and cloud synchronization.
 * Fixes: Resolved "Cannot find name" errors by defining component scope and state.
 */
export const DataModal: React.FC<DataModalProps> = ({ 
  fullState, 
  onRestoreData, 
  onClose, 
  onShowNotification 
}) => {
  // Fix: Defined state for synchronization tracking
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fix: Added handler for local JSON export
  const handleExportLocal = () => {
    const dataStr = JSON.stringify(fullState, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_finca_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    onShowNotification("Backup local generado con éxito", 'success');
  };

  // Fix: Added handler for local JSON import/restoration
  const handleImportLocal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (confirm("¿Está seguro de restaurar este backup? Se sobrescribirán los datos actuales.")) {
          onRestoreData(json);
          onShowNotification("Datos restaurados correctamente", 'success');
        }
      } catch (err) {
        onShowNotification("Error al procesar el archivo JSON", 'error');
      }
    };
    reader.readAsText(file);
  };

  // Fix: Implemented cloud sync with analytical reporting integration
  const handleSyncToCloud = async () => {
      if (!fullState.googleSheetsUrl) {
          alert("⚠️ Configura la URL del Script primero.");
          return;
      }

      setIsSyncing(true);
      
      // Generamos el reporte analítico antes de enviar
      const analyticalData = generateAnalyticalReport(fullState);

      const payload = {
          syncType: 'MANUAL_FULL_WITH_ANALYTICS',
          timestamp: new Date().toISOString(),
          rawState: fullState,
          analytics: analyticalData // Esto es lo que Sheets escribirá en una pestaña de "Reporte"
      };

      // Fix: Ensured syncToGoogleSheets is called with the enriched payload
      const result = await syncToGoogleSheets(payload as any, fullState.googleSheetsUrl);
      setIsSyncing(false);

      if (result.success) {
          onShowNotification("¡Datos y Analítica enviados a la nube!", 'success');
      } else {
          onShowNotification("Error: " + result.message, 'error');
      }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 w-full max-w-2xl rounded-[3rem] border border-slate-700 shadow-2xl overflow-hidden animate-slide-up flex flex-col">
        
        <div className="bg-slate-950 p-8 border-b border-slate-800 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
          <div className="flex items-center gap-4 z-10">
            <div className="bg-slate-800 p-3 rounded-2xl border border-slate-700">
              <Database className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Gestión de Datos</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Backup y Sincronización Nube</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
            {/* Cloud Sync Section */}
            <div className="space-y-4">
                <h4 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Cloud className="w-4 h-4" /> Sincronización Remota
                </h4>
                <div className="bg-slate-800/50 p-6 rounded-3xl border border-indigo-500/20 space-y-4">
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Envía una copia de seguridad completa a tu Google Spreadsheet. Este proceso incluye el <strong>Reporte de Analítica Agronómica</strong> avanzado.
                    </p>
                    <button 
                        onClick={handleSyncToCloud}
                        disabled={isSyncing}
                        className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl ${isSyncing ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20'}`}
                    >
                        {isSyncing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Cloud className="w-6 h-6" />}
                        {isSyncing ? 'Sincronizando...' : 'Subir a Google Cloud'}
                    </button>
                    {!fullState.googleSheetsUrl && (
                        <div className="flex items-center gap-2 text-[10px] text-amber-500 font-bold justify-center uppercase">
                            <AlertTriangle className="w-3 h-3" /> URL de Script no configurada
                        </div>
                    )}
                </div>
            </div>

            {/* Local Backup Section */}
            <div className="space-y-4">
                <h4 className="text-xs font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Database className="w-4 h-4" /> Archivos Locales (Offline)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                        onClick={handleExportLocal}
                        className="bg-slate-800 hover:bg-slate-700 p-6 rounded-3xl border border-slate-700 flex flex-col items-center gap-3 transition-all group"
                    >
                        <Download className="w-8 h-8 text-emerald-500 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-black text-white uppercase">Exportar JSON</span>
                        <p className="text-[9px] text-slate-500 text-center uppercase">Crea un archivo de respaldo en tu dispositivo.</p>
                    </button>

                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-slate-800 hover:bg-slate-700 p-6 rounded-3xl border border-slate-700 flex flex-col items-center gap-3 transition-all group"
                    >
                        <Upload className="w-8 h-8 text-blue-500 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-black text-white uppercase">Importar JSON</span>
                        <p className="text-[9px] text-slate-500 text-center uppercase">Restaura datos desde un archivo previo.</p>
                        <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportLocal} className="hidden" />
                    </button>
                </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex gap-4 items-start">
                <FileJson className="w-8 h-8 text-slate-600 shrink-0" />
                <p className="text-[10px] text-slate-500 leading-relaxed italic">
                    Tus datos se guardan localmente en la memoria del navegador (IndexedDB). Se recomienda realizar un respaldo manual (Exportar) antes de borrar datos del navegador o cambiar de dispositivo.
                </p>
            </div>
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800 text-center">
            <p className="text-[8px] text-slate-700 font-black uppercase tracking-widest">AgroBodega Data Protection • Enterprise Module</p>
        </div>
      </div>
    </div>
  );
};
