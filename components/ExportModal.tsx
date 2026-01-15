
import React, { useState } from 'react';
import { X, FileSpreadsheet, FileText, Download, Sprout, Share2, ShieldCheck, ArrowRight, Table, Book, BarChart4, Archive, Users, Tractor, DollarSign, Printer, FileJson, Share, Loader2 } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { 
    generateExcel, 
    generatePDF, 
    generateLaborReport, 
    generateHarvestReport, 
    generateMasterPDF, 
    generateAgronomicDossier, 
    generateSafetyReport 
} from '../services/reportService';

interface ExportModalProps {
  onClose: () => void;
  onExportExcel: () => void;
  onExportMasterPDF: () => void;
  onExportPDF: () => void;
  onExportLaborPDF: () => void;
  onExportHarvestPDF: () => void;
  onExportGlobalReport: () => void;
  onExportAgronomicDossier: () => void;
  onExportSafetyReport: () => void;
  onExportFieldTemplates: () => void;
  onExportStructurePDF: () => void;
  onExportStructureExcel: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ onClose }) => {
  const { data } = useData();
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const activeW = data.warehouses.find(w => w.id === data.activeWarehouseId);

  const handleFullBackup = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_agrobodega_${activeW?.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleShareExcel = async () => {
    setIsExporting('excel');
    await generateExcel(data, true);
    setIsExporting(null);
  };

  const handleSharePDF = async () => {
    setIsExporting('pdf');
    await generatePDF(data, true);
    setIsExporting(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 w-full max-w-5xl rounded-[3rem] border border-slate-700 shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[95vh]">
        
        <div className="bg-slate-950 p-8 border-b border-slate-800 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-amber-500"></div>
          <div className="flex items-center gap-5 z-10">
            <div className="bg-slate-800 p-4 rounded-3xl border border-slate-700 shadow-xl">
              <BarChart4 className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-3xl font-black text-white leading-none tracking-tight">Centro de Reportes</h3>
              <p className="text-slate-400 text-sm font-medium mt-1">Exportación y Trazabilidad Profesional.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-all z-10 active:scale-90">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-slate-900">
            
            {/* SECCIÓN 1: ACCIONES RÁPIDAS (COMPARTIR) */}
            <div className="mb-10">
                <h4 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Share2 className="w-4 h-4" /> Enviar Reporte Directo
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                        onClick={handleShareExcel}
                        disabled={isExporting === 'excel'}
                        className="flex items-center justify-between bg-emerald-600/10 border border-emerald-500/30 p-6 rounded-[2rem] hover:bg-emerald-600/20 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-emerald-500 p-3 rounded-2xl text-white">
                                {isExporting === 'excel' ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileSpreadsheet className="w-6 h-6"/>}
                            </div>
                            <div className="text-left">
                                <p className="font-black text-white text-sm">Compartir Excel</p>
                                <p className="text-[10px] text-emerald-500/70 font-bold uppercase">Libro Mayor .XLSX</p>
                            </div>
                        </div>
                        <Share className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                    </button>

                    <button 
                        onClick={handleSharePDF}
                        disabled={isExporting === 'pdf'}
                        className="flex items-center justify-between bg-blue-600/10 border border-blue-500/30 p-6 rounded-[2rem] hover:bg-blue-600/20 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-500 p-3 rounded-2xl text-white">
                                {isExporting === 'pdf' ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileText className="w-6 h-6"/>}
                            </div>
                            <div className="text-left">
                                <p className="font-black text-white text-sm">Compartir PDF</p>
                                <p className="text-[10px] text-blue-500/70 font-bold uppercase">Balance Bodega .PDF</p>
                            </div>
                        </div>
                        <Share className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            </div>

            {/* SECCIÓN 2: RESPALDOS DE SEGURIDAD (PORTABILIDAD) */}
            <div className="mb-10">
                <h4 className="text-xs font-black text-emerald-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Respaldos de Seguridad y Portabilidad
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button 
                        onClick={handleFullBackup}
                        className="md:col-span-2 flex items-center gap-6 bg-slate-800 p-8 rounded-[2.5rem] border border-emerald-500/20 hover:bg-slate-750 transition-all group"
                    >
                        <div className="bg-slate-950 p-5 rounded-3xl text-emerald-500 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                            <FileJson className="w-10 h-10"/>
                        </div>
                        <div className="text-left flex-1">
                            <h5 className="text-xl font-black text-white leading-tight">Backup Base de Datos (.json)</h5>
                            <p className="text-sm text-slate-400 mt-1">Descarga una copia completa e inmutable de toda tu finca para guardarla fuera de la nube.</p>
                        </div>
                        <Download className="w-6 h-6 text-slate-500" />
                    </button>

                    <div className="bg-slate-800 p-6 rounded-[2.5rem] border border-slate-700 flex flex-col justify-center items-center text-center">
                        <Archive className="w-8 h-8 text-slate-500 mb-3" />
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Estado de Backup</p>
                        <p className="text-xs text-white font-mono mt-1">Sincronizado {new Date().toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 3: REPORTES TÉCNICOS */}
            <div>
                <h4 className="text-xs font-black text-amber-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Tractor className="w-4 h-4" /> Reportes de Operación
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <button onClick={() => generateLaborReport(data)} className="bg-slate-800 p-5 rounded-[2rem] border border-slate-700 hover:border-amber-500/50 text-left transition-all">
                        <Users className="w-6 h-6 text-amber-500 mb-3" />
                        <p className="font-black text-slate-200 text-sm">Resumen Nómina</p>
                    </button>
                    <button onClick={() => generateHarvestReport(data)} className="bg-slate-800 p-5 rounded-[2rem] border border-slate-700 hover:border-amber-500/50 text-left transition-all">
                        <Sprout className="w-6 h-6 text-amber-500 mb-3" />
                        <p className="font-black text-slate-200 text-sm">Control Cosecha</p>
                    </button>
                    <button onClick={() => generateAgronomicDossier(data)} className="bg-slate-800 p-5 rounded-[2rem] border border-slate-700 hover:border-amber-500/50 text-left transition-all">
                        <Book className="w-6 h-6 text-amber-500 mb-3" />
                        <p className="font-black text-slate-200 text-sm">Libro de Campo</p>
                    </button>
                </div>
            </div>

        </div>
        
        <div className="bg-slate-950 p-4 text-center border-t border-slate-800">
            <p className="text-[10px] text-slate-600 font-medium">
                La exportación nativa permite enviar archivos directamente a WhatsApp, Correo o Telegram.
            </p>
        </div>

      </div>
    </div>
  );
};
