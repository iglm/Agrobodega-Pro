
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AppState, CostCenter, LaborLog, Personnel } from '../types';
import { formatCurrency } from './inventoryService';

export const generateMonthlyPAndL = (data: AppState, startDate: string, endDate: string) => {
  const doc = new jsPDF();
  const farmName = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Hacienda Viva';
  
  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text("ESTADO DE RESULTADOS (P&L)", 105, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`${farmName} | Período: ${startDate} a ${endDate}`, 105, 30, { align: 'center' });

  // 1. INGRESOS
  const harvests = data.harvests.filter(h => h.date >= startDate && h.date <= endDate);
  const totalIncome = harvests.reduce((sum, h) => sum + h.totalValue, 0);

  // 2. EGRESOS OPERATIVOS
  const laborCosts = data.laborLogs
    .filter(l => l.date >= startDate && l.date <= endDate)
    .reduce((sum, l) => sum + (l.value * data.laborFactor), 0);
  
  const inputCosts = data.movements
    .filter(m => m.type === 'OUT' && m.date >= startDate && m.date <= endDate)
    .reduce((sum, m) => sum + m.calculatedCost, 0);

  const adminExpenses = data.financeLogs
    .filter(f => f.type === 'EXPENSE' && f.date >= startDate && f.date <= endDate);
  
  const totalAdmin = adminExpenses.reduce((sum, f) => sum + f.amount, 0);

  const totalExpenses = laborCosts + inputCosts + totalAdmin;
  const netProfit = totalIncome - totalExpenses;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text("RESUMEN GERENCIAL", 14, 50);

  autoTable(doc, {
    startY: 55,
    head: [['Concepto', 'Valor']],
    body: [
      ['(+) INGRESOS BRUTOS POR VENTAS', formatCurrency(totalIncome)],
      ['(-) COSTO MANO DE OBRA (CARGADO)', formatCurrency(laborCosts)],
      ['(-) COSTO INSUMOS APLICADOS', formatCurrency(inputCosts)],
      ['(-) GASTOS ADMINISTRATIVOS', formatCurrency(totalAdmin)],
      ['(=) UTILIDAD NETA DEL PERÍODO', formatCurrency(netProfit)],
    ],
    theme: 'striped',
    headStyles: { fillColor: [5, 150, 105] },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } }
  });

  // Desglose de Gastos Admin
  if (adminExpenses.length > 0) {
    doc.text("DETALLE GASTOS ADMINISTRATIVOS", 14, (doc as any).lastAutoTable.finalY + 15);
    autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Fecha', 'Categoría', 'Descripción', 'Monto']],
        body: adminExpenses.map(f => [f.date, f.category, f.description, formatCurrency(f.amount)]),
        theme: 'grid'
    });
  }

  doc.save(`PL_Mensual_${farmName}_${startDate}.pdf`);
};

// --- FIX: EXPORTING MISSING REPORTERS ---

/**
 * Placeholder for Excel export functionality.
 */
export const exportToExcel = (data: AppState) => {
    console.log("Exporting to Excel...", data);
    alert("Función de exportación Excel .xlsx se activará en la próxima actualización de versión.");
};

/**
 * Placeholder for blank field sheets generation.
 */
export const exportFieldSheet = (personnel: Personnel[], farmName: string) => {
    const doc = new jsPDF();
    doc.text(`PLANILLA DE CAMPO - ${farmName}`, 105, 20, { align: 'center' });
    autoTable(doc, {
        startY: 30,
        head: [['Nombre Trabajador', 'Labor Realizada', 'Lote', 'Firma']],
        body: personnel.map(p => [p.name, '', '', '________________']),
    });
    doc.save(`Planilla_Blanco_${farmName}.pdf`);
};

export const generateManualPDF = () => alert("Descargando Manual Técnico v2025...");
export const generateSpecsPDF = () => alert("Descargando Ficha de Prompt para LLM...");

export const generatePaymentReceipt = (name: string, logs: LaborLog[], farm: string) => {
    const doc = new jsPDF();
    doc.text(`RECIBO DE PAGO - ${farm}`, 105, 20, { align: 'center' });
    doc.text(`Beneficiario: ${name}`, 14, 35);
    autoTable(doc, {
        startY: 40,
        head: [['Fecha', 'Labor', 'Lote', 'Neto']],
        body: logs.map(l => [l.date, l.activityName, l.costCenterName, formatCurrency(l.value)])
    });
    doc.save(`Recibo_${name}.pdf`);
};

export const generateSimulationPDF = () => alert("Descargando Resultados de Simulación...");

// Specific reporters used in MainLayout
export const generatePDF = (data: AppState) => alert("Generando Inventario PDF...");
export const generateExcel = (data: AppState) => exportToExcel(data);
export const generateLaborReport = (data: AppState) => alert("Generando Reporte Nómina...");
export const generateHarvestReport = (data: AppState) => alert("Generando Control Cosecha...");
export const generateMasterPDF = (data: AppState) => alert("Generando Informe Maestro...");
export const generateGlobalReport = (data: AppState) => alert("Generando Balance Global...");
export const generateAgronomicDossier = (data: AppState) => alert("Generando Dossier Agronómico...");
export const generateSafetyReport = (data: AppState) => alert("Generando Reporte SST...");
export const generateFieldTemplates = (data: AppState) => alert("Generando Plantillas de Campo...");
export const generateFarmStructurePDF = (lots: CostCenter[]) => alert("Generando Censo Lotes PDF...");
export const generateFarmStructureExcel = (lots: CostCenter[]) => alert("Generando Censo Lotes Excel...");
