
import React, { useState } from 'react';
import { X, ShieldCheck, Scale, FileText, Gavel, UserCheck, Lock, Globe, Book, Eye, Download, Info, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';

interface LegalComplianceModalProps {
  onClose: () => void;
}

export const LegalComplianceModal: React.FC<LegalComplianceModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'habeas' | 'copyright' | 'terms' | 'consumer'>('habeas');

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-2 sm:p-4 animate-fade-in">
      <div className="bg-slate-950 w-full max-w-5xl h-[90vh] rounded-[3rem] border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        
        {/* Header Dinámico */}
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
            <div className="flex items-center gap-4">
                <div className="bg-emerald-600/20 p-3 rounded-2xl border border-emerald-500/30">
                    <Gavel className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                    <h3 className="text-white font-black text-2xl uppercase tracking-tighter">Legal & Compliance Hub</h3>
                    <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-black">Validado para Colombia Edición 2025</p>
                </div>
            </div>
            <button onClick={onClose} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 transition-all">
                <X className="w-6 h-6" />
            </button>
        </div>

        {/* Navegación por Pestañas Legales */}
        <div className="flex bg-slate-950 p-1.5 border-b border-slate-800 gap-1 overflow-x-auto scrollbar-hide shrink-0">
            <button onClick={() => setActiveTab('habeas')} className={`shrink-0 px-6 py-4 text-[10px] font-black uppercase rounded-2xl flex items-center gap-2 transition-all ${activeTab === 'habeas' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                <UserCheck className="w-4 h-4" /> Habeas Data
            </button>
            <button onClick={() => setActiveTab('copyright')} className={`shrink-0 px-6 py-4 text-[10px] font-black uppercase rounded-2xl flex items-center gap-2 transition-all ${activeTab === 'copyright' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                <FileText className="w-4 h-4" /> Derechos de Autor
            </button>
            <button onClick={() => setActiveTab('terms')} className={`shrink-0 px-6 py-4 text-[10px] font-black uppercase rounded-2xl flex items-center gap-2 transition-all ${activeTab === 'terms' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                <ShieldAlert className="w-4 h-4" /> Términos de Uso
            </button>
            <button onClick={() => setActiveTab('consumer')} className={`shrink-0 px-6 py-4 text-[10px] font-black uppercase rounded-2xl flex items-center gap-2 transition-all ${activeTab === 'consumer' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                <Scale className="w-4 h-4" /> Consumidor
            </button>
        </div>

        {/* Contenido Legal Extenso */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 bg-slate-900/30">
            
            {activeTab === 'habeas' && (
                <div className="space-y-6 animate-fade-in text-slate-300">
                    <section className="space-y-4">
                        <h4 className="text-white font-black uppercase text-base flex items-center gap-2">
                            <Lock className="w-5 h-5 text-blue-500" /> Política de Tratamiento de Datos (Leyes 1581 y 2157)
                        </h4>
                        <div className="bg-slate-950/50 p-6 rounded-[2rem] border border-slate-800 text-xs leading-relaxed space-y-4">
                            <p><strong>1. Identificación del Responsable:</strong> DatosFinca Viva es operada por el usuario final. El desarrollador, Lucas Mateo Tabares Franco, no recolecta, almacena ni procesa datos personales o financieros en servidores externos de su propiedad. La aplicación es de arquitectura "Local-First".</p>
                            <p><strong>2. Finalidad:</strong> Los datos recolectados (Inventarios, Nómina, Ubicación de Lotes) tienen como finalidad exclusiva la gestión administrativa de la unidad productiva y el apoyo a decisiones con analíticas propias de la aplicación.</p>
                            <p><strong>3. Privacidad Absoluta:</strong> Al no existir un backend centralizado del desarrollador, su información es privada y reside únicamente en su dispositivo y en los servicios de nube que usted decida vincular (Google Drive/Sheets).</p>
                        </div>
                    </section>
                </div>
            )}

            {activeTab === 'copyright' && (
                <div className="space-y-6 animate-fade-in text-slate-300">
                    <section className="space-y-4">
                        <h4 className="text-white font-black uppercase text-base flex items-center gap-2">
                            <Book className="w-5 h-5 text-purple-500" /> Propiedad Intelectual (Ley 23 de 1982)
                        </h4>
                        <div className="bg-slate-950/50 p-6 rounded-[2rem] border border-slate-800 text-xs leading-relaxed space-y-4">
                            <p><strong>Titularidad:</strong> DatosFinca Viva es una obra protegida por las leyes de derecho de autor. Lucas Mateo Tabares Franco es el autor y titular exclusivo de los derechos morales y patrimoniales sobre el código fuente, algoritmos, arquitectura de base de datos y diseños de interfaz.</p>
                            <p><strong>Restricciones:</strong> Se prohíbe cualquier intento de ingeniería inversa, descompilación o creación de obras derivadas sin autorización expresa del titular.</p>
                            <p><strong>Copyright Notice:</strong> © 2025 Lucas Mateo Tabares Franco. Todos los derechos reservados.</p>
                        </div>
                    </section>
                </div>
            )}

            {activeTab === 'terms' && (
                <div className="space-y-6 animate-fade-in text-slate-300">
                    <section className="space-y-4">
                        <h4 className="text-white font-black uppercase text-base flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-500" /> Términos y Condiciones de Uso
                        </h4>
                        <div className="bg-slate-950/50 p-6 rounded-[2rem] border border-slate-800 text-xs leading-relaxed space-y-4">
                            <p><strong>Responsabilidad del Usuario:</strong> El usuario es el único responsable de la veracidad de los datos ingresados y del respaldo de su información mediante las herramientas de backup provistas.</p>
                            <p><strong>Limitación de Responsabilidad:</strong> El desarrollador no se hace responsable por pérdidas económicas, fallas en la toma de decisiones agrícolas o pérdida de datos debido a fallas de hardware del usuario o desinstalación accidental de la aplicación.</p>
                        </div>
                    </section>
                </div>
            )}

            {activeTab === 'consumer' && (
                <div className="space-y-6 animate-fade-in text-slate-300">
                    <section className="space-y-4">
                        <h4 className="text-white font-black uppercase text-base flex items-center gap-2">
                            <Scale className="w-5 h-5 text-emerald-500" /> Estatuto del Consumidor (Ley 1480)
                        </h4>
                        <div className="bg-slate-950/50 p-6 rounded-[2rem] border border-slate-800 text-xs leading-relaxed space-y-4">
                            <p><strong>Soporte Técnico y Consultoría:</strong> Para asesorías agronómicas y soporte sobre el desarrollo de software, el canal oficial es el correo electrónico del autor.</p>
                            <p><strong>Contacto Oficial:</strong> mateotabares7@gmail.com</p>
                            <p><strong>Servicios Adicionales:</strong> Desarrollo de software a medida para el sector agroindustrial y consultoría en optimización de costos.</p>
                        </div>
                    </section>
                </div>
            )}

        </div>

        {/* Footer de Aceptación */}
        <div className="p-8 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-500" />
                <p className="text-[10px] text-slate-500 font-bold uppercase">Asesorías Agronómicas & Software • 2025</p>
            </div>
            <button onClick={onClose} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-10 rounded-2xl text-[11px] uppercase tracking-widest shadow-xl shadow-emerald-900/40 transition-all active:scale-95">
                ACEPTAR Y CONTINUAR
            </button>
        </div>

      </div>
    </div>
  );
};
