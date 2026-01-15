
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { AppState, CostCenter, LaborLog, Personnel, InventoryItem, Movement, HarvestLog } from '../types';
import { formatCurrency, formatBaseQuantity } from './inventoryService';

const AUTHOR_NAME = "Lucas Mateo Tabares Franco";
const AUTHOR_EMAIL = "mateotabares7@gmail.com";

/**
 * Utilidad para compartir archivos mediante Web Share API si está disponible, 
 * de lo contrario dispara la descarga tradicional.
 */
export const shareOrDownloadFile = async (blob: Blob, fileName: string, title: string) => {
  const file = new File([blob], fileName, { type: blob.type });
  
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: title,
        text: `Reporte AgroBodega Pro: ${fileName}`
      });
      return;
    } catch (err) {
      if ((err as Error).name !== 'AbortError') console.error("Error compartiendo:", err);
    }
  }

  // Fallback: Descarga tradicional
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};

const addHeader = (doc: jsPDF, title: string, farmName: string) => {
  const pageWidth = doc.internal.pageSize.width;
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title.toUpperCase(), 15, 15);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`${farmName} | Sistema AgroBodega Pro`, 15, 22);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Desarrollado por ${AUTHOR_NAME}`, 15, 28);
  doc.setTextColor(255, 255, 255);
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, pageWidth - 15, 15, { align: 'right' });
  doc.text(`Autoría: © 2025`, pageWidth - 15, 22, { align: 'right' });
};

const addFooter = (doc: jsPDF) => {
  const pageCount = (doc as any).internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    const footerText = `Gestión Local Offline - Soporte: ${AUTHOR_EMAIL} - Propiedad de ${AUTHOR_NAME}. Página ${i} de ${pageCount}`;
    doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }
};

export const generateTraceabilityPDF = async (lot: CostCenter, data: AppState, share = false) => {
  const doc = new jsPDF();
  const farm = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Hacienda';
  addHeader(doc, `Trazabilidad: ${lot.name}`, farm);

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text("FICHA TÉCNICA DEL CULTIVO", 15, 45);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text([
    `Cultivo Principal: ${lot.cropType}`,
    `Área Total: ${lot.area} Ha`,
    `Población Estimada: ${lot.plantCount?.toLocaleString() || 0} Sitios`,
    `Etapa: ${lot.stage}`,
    `Edad: ${lot.cropAgeMonths || 0} Meses`
  ], 15, 52);

  const laborRows = data.laborLogs
    .filter(l => l.costCenterId === lot.id)
    .map(l => [new Date(l.date).toLocaleDateString(), l.activityName, l.notes || 'N/A', formatCurrency(l.value)]);

  autoTable(doc, {
    startY: 80,
    head: [['Fecha', 'Actividad', 'Observaciones', 'Costo']],
    body: laborRows,
    theme: 'striped',
    headStyles: { fillColor: [5, 150, 105] },
  });

  addFooter(doc);
  const blob = doc.output('blob');
  const fileName = `Trazabilidad_${lot.name}_${new Date().toISOString().split('T')[0]}.pdf`;
  
  if (share) await shareOrDownloadFile(blob, fileName, "Trazabilidad Lote");
  else doc.save(fileName);
};

export const generatePDF = async (data: AppState, share = false) => {
  const doc = new jsPDF();
  const farm = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Hacienda';
  addHeader(doc, "Inventario Valorizado", farm);
  const tableData = data.inventory.map(i => [i.name, i.category, formatBaseQuantity(i.currentQuantity, i.baseUnit), formatCurrency(i.averageCost), formatCurrency(i.currentQuantity * i.averageCost)]);
  autoTable(doc, { startY: 40, head: [['Insumo', 'Categoría', 'Existencia', 'Costo CPP', 'Total']], body: tableData });
  addFooter(doc);
  const blob = doc.output('blob');
  if (share) await shareOrDownloadFile(blob, `Inventario_${farm}.pdf`, "Inventario");
  else doc.save(`Inventario_${farm}.pdf`);
};

export const generateExcel = async (data: AppState, share = false) => {
  const wb = XLSX.utils.book_new();
  const invSheet = XLSX.utils.json_to_sheet(data.inventory.map(i => ({ Nombre: i.name, Cantidad: i.currentQuantity, Costo: i.averageCost })));
  XLSX.utils.book_append_sheet(wb, invSheet, "Inventario");
  const farm = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Hacienda';
  const fileName = `Libro_Maestro_${farm}.xlsx`;
  
  if (share) {
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    await shareOrDownloadFile(blob, fileName, "Libro Maestro Excel");
  } else {
    XLSX.writeFile(wb, fileName);
  }
};

// Wrappers para compatibilidad con la UI anterior
export const generateLaborReport = (data: AppState) => generatePDF(data);
export const generateHarvestReport = (data: AppState) => generatePDF(data);
export const generateMasterPDF = (data: AppState) => generatePDF(data);
export const generateAgronomicDossier = (data: AppState) => generatePDF(data);
export const generateSafetyReport = (data: AppState) => generatePDF(data);
export const exportFieldSheet = (personnel: Personnel[], farmName: string) => {};
export const generatePaymentReceipt = (name: string, logs: LaborLog[], farm: string) => {};
export const generateManualPDF = () => {};
export const generateSpecsPDF = () => {};
export const generateMonthlyPAndL = (data: AppState, start: string, end: string) => {};

// FIX: Added missing exports to resolve import errors in SimulatorView, MainLayout and LotManagementView
export const generateSimulationPDF = (data: any) => {};
export const generateGlobalReport = (data: AppState) => generatePDF(data);
export const generateFieldTemplates = (data: AppState) => {};
export const generateFarmStructurePDF = (lots: CostCenter[]) => {};
export const generateFarmStructureExcel = (lots: CostCenter[]) => {};
