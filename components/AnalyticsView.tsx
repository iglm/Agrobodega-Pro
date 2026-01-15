
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { calculateKPIs } from '../services/analyticsService';
import { exportToGoogleSheets } from '../services/sheetIntegration';
import { formatCurrency } from '../services/inventoryService';
import { askGemini } from '../services/aiService';
import { TrendingUp, TrendingDown, DollarSign, Coffee, PieChart, FileSpreadsheet, AlertTriangle, Info, ArrowUpRight, BrainCircuit, Sparkles, Loader2, Calendar } from 'lucide-react';
import { Card, Button } from './UIElements';

export const AnalyticsView: React.FC = () => {
  const { data } = useData();
  const kpis = calculateKPIs(data);
  
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState<string | null>(null);

  // Referencia de mercado estática ($2.00 USD por lb -> ~ $17,000 COP por Kg CPS aprox)
  const MARKET_PRICE_REFERENCE_KG = 17500; 
  const isOverCost = kpis.costPerKg > MARKET_PRICE_REFERENCE_KG;

  const handleIAForecast = async () => {
    setIsPredicting(true);
    setPrediction(null);
    try {
        const prompt = `Actúa como un analista de datos agrícolas experto. Basado en los siguientes datos de mi finca:
        - Lotes: ${data.costCenters.length}
        - Lotes en Producción: ${data.costCenters.filter(c => c.stage === 'Produccion').length}
        - Inversión total reciente: ${formatCurrency(kpis.totalExpenses)}
        - Producción histórica: ${kpis.totalIncomes / 17500} cargas estimadas.
        
        Realiza una PREDICCIÓN DE COSECHA y VOLUMEN para los próximos 6 meses. Describe los meses pico, riesgos de sanidad detectados y sugiere ajustes en la fertilización para maximizar el margen bruto. Sé breve y profesional.`;
        
        const result = await askGemini(prompt, data, false, true);
        setPrediction(result.text || "No se pudo generar la predicción.");
    } catch (error) {
        setPrediction("Error al conectar con el cerebro de IA. Verifique su API Key.");
    } finally {
        setIsPredicting(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      <div className="bg-slate-900 p-8 rounded-[3.5rem] border border-slate-700 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5">
              <PieChart className="w-64 h-64 text-white" />
          </div>
          <div className="relative z-10">
              <h2 className="text-white font-black text-3xl uppercase tracking-tighter italic flex items-center gap-3">
                  <TrendingUp className="text-emerald-500" /> Rendimiento Financiero
              </h2>
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.3em] mt-2">Modelo de Costos Federación de Cafeteros</p>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tarjeta de Ganancia Neta */}
        <Card className={`relative overflow-hidden border-l-8 ${kpis.netProfit >= 0 ? 'border-emerald-500' : 'border-red-500'}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Ganancia Neta Actual</p>
              <h3 className={`text-4xl font-black font-mono ${kpis.netProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {formatCurrency(kpis.netProfit)}
              </h3>
            </div>
            {kpis.netProfit >= 0 ? <TrendingUp className="text-emerald-500 w-8 h-8" /> : <TrendingDown className="text-red-500 w-8 h-8" />}
          </div>
          <div className="mt-6 flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase">
              <Info className="w-3 h-3" /> Incluye Mano de Obra, Insumos y Gastos Administrativos.
          </div>
        </Card>

        {/* Tarjeta de Costo por Kilo */}
        <Card className="relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-amber-100 dark:bg-amber-900/30 rounded-2xl text-amber-600">
              <Coffee size={32} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Costo de producción por Kg</p>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white font-mono">{formatCurrency(kpis.costPerKg)}</h3>
              <div className="flex items-center gap-2 mt-2">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${isOverCost ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {isOverCost ? 'Riesgo de Margen' : 'Eficiencia Óptima'}
                  </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* MÓDULO DE PREDICCIÓN IA (NUEVO) */}
      <Card className="bg-slate-900 border-indigo-500/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <BrainCircuit className="w-40 h-40 text-indigo-400" />
          </div>
          <div className="relative z-10 space-y-6">
              <div className="flex justify-between items-center">
                  <h4 className="text-indigo-400 font-black text-sm uppercase tracking-[0.2em] flex items-center gap-2">
                      <Sparkles className="w-5 h-5 animate-pulse" /> Predicción de Cosecha IA
                  </h4>
                  <span className="text-[8px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-black uppercase">Gemini 3.0 Pro</span>
              </div>

              {!prediction && !isPredicting && (
                  <div className="text-center py-6 space-y-4">
                      <p className="text-slate-400 text-xs px-8">Analiza tus ciclos de floración y costos para predecir volúmenes de producción.</p>
                      <Button 
                        onClick={handleIAForecast}
                        variant="secondary" 
                        size="md" 
                        icon={BrainCircuit}
                        className="!rounded-full shadow-indigo-900/40"
                      >
                        Generar Predicción Inteligente
                      </Button>
                  </div>
              )}

              {isPredicting && (
                  <div className="flex flex-col items-center justify-center py-10 gap-4 animate-pulse">
                      <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                      <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Modelando ciclos productivos...</p>
                  </div>
              )}

              {prediction && (
                  <div className="bg-slate-950/80 p-6 rounded-3xl border border-slate-800 space-y-4 animate-fade-in">
                      <div className="flex items-center gap-2 text-emerald-400 mb-2">
                          <Calendar className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase">Reporte Predictivo Generado</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed italic whitespace-pre-wrap">
                          {prediction}
                      </p>
                      <button onClick={() => setPrediction(null)} className="text-[9px] text-slate-500 hover:text-indigo-400 font-bold uppercase underline">Nuevo Análisis</button>
                  </div>
              )}
          </div>
      </Card>

      {isOverCost && (
          <div className="bg-red-950/40 border border-red-500/50 p-6 rounded-[2.5rem] flex gap-5 animate-pulse">
              <AlertTriangle className="w-10 h-10 text-red-500 shrink-0" />
              <div>
                  <h5 className="text-red-400 font-black text-sm uppercase tracking-widest">Alerta de Rentabilidad Critica</h5>
                  <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                      Su costo de producción supera el umbral de mercado. Se recomienda revisar el manual de Cenicafé para optimizar la <strong>mano de obra</strong>, que representa históricamente el 55% de los gastos.
                  </p>
              </div>
          </div>
      )}

      {/* Resumen Detallado */}
      <Card title="Distribución Financiera Consolidada" icon={ArrowUpRight}>
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl">
            <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">Ingresos Totales (Ventas)</span>
            <span className="text-emerald-600 font-black font-mono text-lg">+ {formatCurrency(kpis.totalIncomes)}</span>
          </div>
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl">
            <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">Inversión Total (Insumos + MO)</span>
            <span className="text-red-600 font-black font-mono text-lg">- {formatCurrency(kpis.totalExpenses)}</span>
          </div>
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span className="font-black text-slate-800 dark:text-white uppercase tracking-tighter text-lg">Retorno de Inversión (ROI)</span>
            <span className={`font-black font-mono text-2xl ${kpis.roi > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {kpis.roi.toFixed(2)}%
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4">
          <Button 
            onClick={() => exportToGoogleSheets(data)}
            variant="primary" 
            size="lg" 
            fullWidth 
            icon={FileSpreadsheet}
            className="!bg-emerald-700 hover:!bg-emerald-600 !rounded-[2rem] py-6 shadow-emerald-900/40"
          >
            EXPORTAR TABLERO A GOOGLE SHEETS
          </Button>
      </div>

      <p className="text-[10px] text-center text-slate-500 font-bold uppercase tracking-widest mt-6 italic">
        * Análisis generado automáticamente aplicando el modelo de costos de la Federación Nacional de Cafeteros.
      </p>
    </div>
  );
};
