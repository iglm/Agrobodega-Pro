
import { AppState, CostCenter, Category } from '../types';
import { convertToBase } from './inventoryService';

/**
 * Interfaz para el reporte que recibirá Google Sheets
 */
export interface AnalyticalRow {
  fechaReporte: string;
  lote: string;
  areaHa: number;
  produccionTotalKg: number;
  rendimientoHa: number; // Kg/Ha
  costoManoObra: number;
  costoInsumos: number;
  costoIndirectoProrrateado: number;
  costoTotalLote: number;
  costoPorKg: number;
  margenBruto: number;
  eficienciaFertilizante: string; // Kg Café / Kg Fertilizante
}

/**
 * Genera un informe detallado basado en criterios de economía agrícola avanzada.
 */
export const generateAnalyticalReport = (data: AppState): AnalyticalRow[] => {
  const { 
    costCenters, 
    laborLogs, 
    movements, 
    harvests, 
    financeLogs, 
    laborFactor,
    activeWarehouseId 
  } = data;

  const fechaActual = new Date().toISOString().split('T')[0];
  
  // 1. Calcular Gastos Indirectos Totales (Administración, Servicios, Impuestos)
  // En economía agraria, estos deben distribuirse entre los lotes productivos.
  const gastosIndirectosGlobales = financeLogs
    .filter(f => f.type === 'EXPENSE')
    .reduce((sum, f) => sum + f.amount, 0);

  const areaTotalFinca = costCenters.reduce((sum, c) => sum + (c.area || 0), 0) || 1;

  // 2. Procesar cada Lote (Centro de Costo)
  return costCenters.map(lot => {
    const area = lot.area || 0;

    // A. Costo Directo: Mano de Obra (Jornales * Factor de Carga Social)
    const costoMO = laborLogs
      .filter(l => l.costCenterId === lot.id)
      .reduce((sum, l) => sum + (l.value * (laborFactor || 1)), 0);

    // B. Costo Directo: Insumos (Salidas de bodega valorizadas por CPP)
    const movimientosInsumos = movements.filter(m => m.costCenterId === lot.id && m.type === 'OUT');
    const costoInsumos = movimientosInsumos.reduce((sum, m) => sum + m.calculatedCost, 0);

    // C. Fertilizantes Aplicados (Para cálculo de eficiencia)
    // Filtramos movimientos que pertenecen a la categoría de FERTILIZANTE
    const kgFertilizante = movimientosInsumos.reduce((sum, m) => {
        const item = data.inventory.find(i => i.id === m.itemId);
        if (item?.category === Category.FERTILIZANTE) {
            // Convertimos a Kilos (Unidad estándar de eficiencia)
            return sum + (convertToBase(m.quantity, m.unit) / 1000);
        }
        return sum;
    }, 0);

    // D. Prorrateo de Indirectos: (Gasto Global / Area Total) * Area Lote
    // Esto permite saber cuánto "pesa" la administración en cada kilo producido.
    const indirectoProrrateado = (gastosIndirectosGlobales / areaTotalFinca) * area;

    // E. Producción y Ventas
    const produccionKg = harvests
      .filter(h => h.costCenterId === lot.id)
      .reduce((sum, h) => sum + h.quantity, 0);

    const ingresosVentas = harvests
      .filter(h => h.costCenterId === lot.id)
      .reduce((sum, h) => sum + h.totalValue, 0);

    // F. Métrica de Rentabilidad
    const costoTotalLote = costoMO + costoInsumos + indirectoProrrateado;
    const costoPorKg = produccionKg > 0 ? costoTotalLote / produccionKg : 0;
    
    // G. Eficiencia Agronómica (Kg de Café obtenidos por cada Kg de fertilizante puesto)
    // Un ratio < 10 en café cereza puede indicar desperdicio o suelos saturados.
    const eficienciaFert = kgFertilizante > 0 
        ? `${(produccionKg / kgFertilizante).toFixed(2)} Kg/Kg` 
        : 'N/A (Sin fertilización)';

    return {
      fechaReporte: fechaActual,
      lote: lot.name,
      areaHa: area,
      produccionTotalKg: produccionKg,
      rendimientoHa: area > 0 ? produccionKg / area : 0,
      costoManoObra: costoMO,
      costoInsumos: costoInsumos,
      costoIndirectoProrrateado: indirectoProrrateado,
      costoTotalLote: costoTotalLote,
      costoPorKg: costoPorKg,
      margenBruto: ingresosVentas - costoTotalLote,
      eficienciaFertilizante: eficienciaFert
    };
  });
};
