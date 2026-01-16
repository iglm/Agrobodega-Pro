
import React, { useRef, useState } from 'react';
import { AppState } from '../types';
import { 
  X, 
  Download, 
  Upload, 
  Trash2, 
  FileJson,
  DatabaseZap,
  ArrowRight,
  Loader2,
  Cloud,
  HardDrive
} from 'lucide-react';
import { dbService } from '../services/db';
import { syncToGoogleSheets } from '../services/sheetIntegration';

interface DataModalProps {
  fullState: AppState;
  onRestoreData: (data: AppState) => void;
  onClose: () => void;
  onShowNotification: (message: string, type: 'success' | 'error') => void;
}

export const DataModal: React.FC<DataModalProps> = ({ fullState, onRestoreData, onClose, onShowNotification }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const handleDownloadBackup = () => {
    try {
        const activeWarehouse = fullState.warehouses.find(w => w.id === fullState.activeWarehouseId);
        const warehouseName = activeWarehouse ? activeWarehouse.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'finca';
        const dateStr = new Date().toISOString().split('T')[0];
        const fileName = `Backup_${warehouseName}_${dateStr}.json`;

        const jsonString = JSON.stringify(fullState, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        
        // --- SECURITY STAMP ---
        localStorage.setItem('LAST_BACKUP_TIMESTAMP', new Date().toISOString());
        // ----------------------

        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            onShowNotification("Backup JSON descargado correctamente.", 'success');
        }, 100);
    } catch (err) { onShowNotification("Error al generar el backup: " + err, 'error'); }
  };

  const handleSyncToCloud = async () => {
      if (!fullState.googleSheetsUrl) {
          alert("⚠️ No has configurado la URL del Script de Google.\n\nVe a Configuración > Config y pega el enlace de tu Web App de Apps Script.");
          return;
      }

      if(!confirm("¿Realizar copia de seguridad en Google Drive y actualizar Sheets?\n\nEl script creará un archivo .json en la carpeta 'Backups AgroBodega' en tu Drive.")) return;

      setIsSyncing(true);
      const result = await syncToGoogleSheets(fullState, fullState.googleSheetsUrl);
      setIsSyncing(false);

      if (result.success) {
          onShowNotification("¡Respaldo Exitoso! Verifica tu Drive y Sheets.", 'success');
      } else {
          onShowNotification("Error al sincronizar. " + result.message, 'error');
      }
  };

  const handleClearData = async () => {
      const userInput = prompt("PELIGRO: Esta acción eliminará permanentemente TODOS los datos de la base de datos de alta capacidad. Para continuar, escriba 'ELIMINAR TODO'.");
      if (userInput === 'ELIMINAR TODO') {
          await dbService.clearDatabase();
          localStorage.clear();
          window.location.reload();
      }
  };

  const handleRestoreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm("⚠️ ADVERTENCIA CRÍTICA ⚠️\n\nEsta acción REEMPLAZARÁ todos los datos actuales. ¿Desea continuar?")) return;

    setIsRestoring(true);
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const parsed = JSON.parse(event.target?.result as string);
            onRestoreData(parsed as AppState);
            onShowNotification("Datos restaurados correctamente.", 'success');
            onClose();
        } catch (err) { onShowNotification("Archivo de backup no válido o corrupto.", 'error'); }
        finally { setIsRestoring(false); }
    };
    reader.readAsText(file);
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 w-full max-w-xl rounded-[3rem] border border-slate-700 shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        
        <div className="bg-slate-950 p-8 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <div className="bg-orange-500/20 p-3 rounded-2xl border border-orange-500/30">
                    <DatabaseZap className="w-8 h-8 text-orange-500" />
                </div>
                <div>
                    <h3 className="text-white font-black text-2xl uppercase tracking-tighter">Centro de Datos</h3>
                    <p className="text-[10px] text-orange-400 uppercase tracking-widest font-black">Nube Híbrida & Local</p>
                </div>
            </div>
            <button onClick={onClose} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 transition-colors">
                <X className="w-6 h-6" />
            </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
            
            {/* GOOGLE SHEETS & DRIVE SYNC BUTTON */}
            <button 
                onClick={handleSyncToCloud}
                disabled={isSyncing}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white p-6 rounded-[2rem] shadow-xl shadow-green-900/30 flex items-center justify-between group active:scale-95 transition-all border border-green-400/20 relative overflow-hidden"
            >
                <div className="relative z-10 flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                        {isSyncing ? <Loader2 className="w-8 h-8 animate-spin text-white" /> : <Cloud className="w-8 h-8 text-white" />}
                    </div>
                    <div className="text-left">
                        <h4 className="font-black text-lg uppercase">Respaldo en Nube Google</h4>
                        <p className="text-[10px] text-green-100 font-bold uppercase tracking-wide">Enviar a Drive (JSON) + Sheets (Excel)</p>
                    </div>
                </div>
                <div className="relative z-10 bg-white/10 p-2 rounded-full group-hover:bg-white/30 transition-colors">
                    <ArrowRight className="w-6 h-6 text-white" />
                </div>
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 p-4 opacity-10"><FileJson className="w-32 h-32 text-white" /></div>
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 space-y-4 flex flex-col">
                    <h4 className="text-emerald-500 text-[10px] uppercase font-black tracking-widest flex items-center gap-2">
                        <FileJson className="w-4 h-4" /> Backup Local (JSON)
                    </h4>
                    <p className="text-[10px] text-slate-500 leading-tight flex-1">Descarga inmediata al dispositivo. Útil si no tienes internet.</p>
                    <button onClick={handleDownloadBackup} className="w-full bg-slate-800 hover:bg-emerald-600 text-white py-4 rounded-xl text-[10px] font-black uppercase transition-all">Descargar .JSON</button>
                </div>

                <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 space-y-4 flex flex-col">
                    <h4 className="text-blue-500 text-[10px] uppercase font-black tracking-widest flex items-center gap-2">
                        <Upload className="w-4 h-4" /> Restaurar Backup
                    </h4>
                    <p className="text-[10px] text-slate-500 leading-tight flex-1">Carga un archivo .json para recuperar datos en este dispositivo.</p>
                    <label className={`block w-full text-white py-4 rounded-xl text-[10px] font-black uppercase transition-all text-center ${isRestoring ? 'bg-slate-700 cursor-not-allowed' : 'bg-slate-800 hover:bg-blue-600 cursor-pointer'}`}>
                        {isRestoring ? (
                           <span className="flex items-center justify-center gap-2">
                               <Loader2 className="w-4 h-4 animate-spin" /> Restaurando...
                           </span>
                        ) : 'Cargar .JSON'}
                        <input ref={fileInputRef} type="file" accept=".json" onChange={handleRestoreFileChange} className="hidden" disabled={isRestoring} />
                    </label>
                </div>
            </div>

            <div className="flex gap-4 items-start p-6 bg-slate-950 rounded-[2rem] border border-slate-800">
                <HardDrive className="w-6 h-6 text-slate-600 shrink-0" />
                <p className="text-[10px] text-slate-500 leading-relaxed font-medium italic">
                    <span className="text-orange-500 font-black">ARQUITECTURA DE DATOS:</span> Aunque esta aplicación corre en Google Cloud Run, sus datos financieros se almacenan en el <span className="text-white">Almacenamiento Local Seguro</span> de este dispositivo para máxima privacidad y velocidad (Local-First). Recuerde descargar backups si cambia de dispositivo.
                </p>
            </div>

            <div className="pt-6">
                <button onClick={handleClearData} className="text-[10px] font-black text-red-500 uppercase hover:text-red-400 transition-colors flex items-center gap-2 mx-auto">
                    <Trash2 className="w-4 h-4" /> Borrar Datos Locales de este Dispositivo
                </button>
            </div>

        </div>
      </div>
    </div>
  );
};
