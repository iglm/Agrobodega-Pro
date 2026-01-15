
import { AppState, CostCenter } from '../types';

export interface LotRentability {
  lotName: string;
  totalLaborCost: number;
  totalInputCost: number;
  totalIndirectCost: number;
  totalCost: number;
  totalIncome: number;
  margin: number;
  marginPercent: number;
}

/**
 * Calcula la rentabilidad total de un lote específico.
 * Utiliza costeo absorbente prorrateando gastos indirectos por área.
 */
export const calculateLotRentability = (data: AppState, lotId: string): LotRentability => {
  const lot = data.costCenters.find(c => c.id === lotId);
  if (!lot) return { lotName: 'N/A', totalLaborCost: 0, totalInputCost: 0, totalIndirectCost: 0, totalCost: 0, totalIncome: 0, margin: 0, marginPercent: 0 };

  const laborFactor = data.laborFactor || 1.0;

  // 1. Costo Directo de Mano de Obra
  const laborCost = data.laborLogs
    .filter(l => l.costCenterId === lotId)
    .reduce((sum, l) => sum + (l.value * laborFactor), 0);

  // 2. Costo Directo de Insumos (Movimientos OUT)
  const inputCost = data.movements
    .filter(m => m.costCenterId === lotId && m.type === 'OUT')
    .reduce((sum, m) => sum + m.calculatedCost, 0);

  // 3. Gastos Indirectos Prorrateados (FinanceLogs de tipo EXPENSE)
  const totalArea = data.costCenters.reduce((sum, c) => sum + (c.area || 0), 0) || 1;
  const indirectExpenses = data.financeLogs
    .filter(f => f.type === 'EXPENSE')
    .reduce((sum, f) => sum + f.amount, 0);
  
  const prorratedIndirect = (indirectExpenses / totalArea) * lot.area;

  // 4. Ingresos (Harvests)
  const totalIncome = data.harvests
    .filter(h => h.costCenterId === lotId)
    .reduce((sum, h) => sum + h.totalValue, 0);

  const totalCost = laborCost + inputCost + prorratedIndirect;
  const margin = totalIncome - totalCost;
  const marginPercent = totalIncome > 0 ? (margin / totalIncome) * 100 : 0;

  return {
    lotName: lot.name,
    totalLaborCost: laborCost,
    totalInputCost: inputCost,
    totalIndirectCost: prorratedIndirect,
    totalCost,
    totalIncome,
    margin,
    marginPercent
  };
};
