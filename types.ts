
export enum Category {
  FERTILIZANTE = 'Fertilizante',
  INSECTICIDA = 'Insecticida',
  FUNGICIDA = 'Fungicida',
  HERBICIDA = 'Herbicida',
  BIOESTIMULANTE = 'Bioestimulante',
  DESINFECTANTE = 'Desinfectante',
  BIOABONO = 'Bioabono',
  OTRO = 'Otro'
}

export enum Unit {
  BULTO_50KG = 'Bulto 50kg',
  KILO = 'Kilo',
  GRAMO = 'Gramo',
  LITRO = 'Litro',
  MILILITRO = 'Mililitro',
  GALON = 'Galón',
  UNIDAD = 'Unidad'
}

export type ContractType = 'FIJO' | 'INDEFINIDO' | 'OBRA_LABOR' | 'APRENDIZAJE' | 'PRESTACION_SERVICIOS' | 'OCASIONAL';
export type SyncStatus = 'pending_sync' | 'synced' | 'failed';

export interface BaseEntity {
  id: string;
  warehouseId: string;
  lastModified?: string;
  syncStatus?: SyncStatus;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface AgendaEvent extends BaseEntity {
  date: string;
  title: string;
  completed: boolean;
}

export interface SWOT {
  f: string;
  o: string;
  d: string;
  a: string;
}

export interface Asset extends BaseEntity {
  name: string;
  purchasePrice: number;
  lifespanYears: number;
  purchaseDate: string;
  category: 'MAQUINARIA' | 'HERRAMIENTA' | 'INFRAESTRUCTURA';
}

export interface PhenologyLog extends BaseEntity {
  costCenterId: string;
  date: string;
  stage: 'Dormancia' | 'Brote' | 'Floración' | 'Cuajado' | 'Llenado' | 'Maduración';
  notes?: string;
}

export interface PestLog extends BaseEntity {
  costCenterId: string;
  date: string;
  pestOrDisease: string;
  incidence: 'Baja' | 'Media' | 'Alta';
  notes?: string;
}

export interface PlannedLabor extends BaseEntity {
  activityId: string;
  activityName: string;
  costCenterId: string;
  costCenterName: string;
  date: string;
  targetArea: number;
  technicalYield: number;
  unitCost: number;
  efficiency: number;
  calculatedPersonDays: number;
  calculatedHours?: number;
  calculatedTotalCost: number;
  completed: boolean;
  notes?: string;
  assignedPersonnelIds?: string[];
}

export interface BudgetItem {
  id: string;
  conceptId: string;
  conceptName: string;
  type: 'LABOR' | 'SUPPLY';
  unitCost: number;
  quantityPerHa: number;
  months: number[];
}

export interface BudgetPlan extends BaseEntity {
  year: number;
  costCenterId: string;
  items: BudgetItem[];
}

export interface Client extends BaseEntity {
  name: string;
  type: 'COOPERATIVA' | 'EXPORTADOR' | 'CLIENTE_FINAL' | 'INTERMEDIARIO';
  taxId?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface SalesContract extends BaseEntity {
  clientId: string;
  clientName: string;
  date: string;
  contractNumber: string;
  quantityAgreed: number;
  unit: string;
  pricePerUnit: number;
  status: 'OPEN' | 'FULFILLED' | 'CANCELLED';
  expirationDate: string;
  fulfilledQuantity: number;
  notes?: string;
}

export interface SaleItem {
  cropName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
  quality?: string;
}

export interface Sale extends BaseEntity {
  date: string;
  clientId: string;
  clientName: string;
  contractId?: string;
  contractNumber?: string;
  items: SaleItem[];
  totalValue: number;
  paymentStatus: 'PENDING' | 'PAID';
  paymentDate?: string;
  invoiceNumber?: string;
  notes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SYNC' | 'ADJUST' | 'IMPORT' | 'EXPORT';
  entity: 'inventory' | 'labor' | 'finance' | 'lot' | 'system';
  entityId: string;
  previousData?: string;
  newData?: string;
  details: string;
  status?: 'success' | 'failure';
  metadata?: Record<string, any>;
}

export interface Warehouse extends BaseEntity { 
  name: string; 
  created: string; 
  ownerId: string;
  sharedWith?: { userId: string; email: string; role: 'viewer' | 'editor' }[];
}

export interface CostCenter extends BaseEntity { 
  name: string; 
  area: number; 
  productionArea?: number;
  stage: 'Produccion' | 'Levante' | 'Infraestructura'; 
  cropType: string;
  associatedCrop?: string;
  budget?: number;
  coordinates?: { lat: number; lng: number };
  plantCount?: number;
  accumulatedCapex?: number;
  assetValue?: number;
  amortizationDuration?: number;
  activationDate?: string;
  cropAgeMonths?: number;
  associatedCropDensity?: number;
  associatedCropAge?: number;
}

export interface InventoryItem extends BaseEntity { 
  name: string; 
  category: Category; 
  currentQuantity: number; 
  baseUnit: 'g' | 'ml' | 'unit'; 
  averageCost: number; 
  lastPurchasePrice: number;
  lastPurchaseUnit: Unit;
  minStock?: number; 
  minStockUnit?: Unit;
  image?: string;
  description?: string;
  expirationDate?: string;
  safetyIntervalDays?: number;
}

export interface LaborLog extends BaseEntity { 
  date: string; 
  personnelId: string;
  personnelName: string; 
  activityId: string;
  activityName: string; 
  costCenterId: string;
  costCenterName: string;
  value: number; 
  paid: boolean;
  notes?: string;
  areaWorked?: number;
  hoursWorked?: number;
  jornalesEquivalent?: number;
  performanceYieldHaJornal?: number;
}

export interface HarvestLog extends BaseEntity { 
  costCenterId: string;
  costCenterName: string;
  date: string; 
  cropName: string; 
  quantity: number; 
  unit: string; 
  totalValue: number;
  quality1Qty?: number;
  quality2Qty?: number;
  wasteQty?: number;
  rejectionCause?: string;
  notes?: string;
  yieldFactor?: number;
  collectorsCount?: number;
  greenPercentage?: number;
  pestPercentage?: number;
  defectPercentage?: number;
  brocaLossValue?: number;
  efficiencyStatus?: 'LOW_OFFER' | 'LOW_EFFICIENCY' | 'OPTIMAL';
}

export interface Movement extends BaseEntity { 
  itemId: string; 
  itemName: string; 
  type: 'IN' | 'OUT'; 
  quantity: number; 
  unit: Unit; 
  calculatedCost: number; 
  date: string; 
  notes?: string;
  invoiceNumber?: string;
  invoiceImage?: string;
  outputCode?: string;
  supplierId?: string;
  supplierName?: string;
  costCenterId?: string;
  costCenterName?: string;
  machineId?: string;
  machineName?: string;
  personnelId?: string;
  personnelName?: string;
  phiApplied?: number;
  paymentDueDate?: string;
  paymentStatus?: 'PENDING' | 'PAID';
}

export interface InitialMovementDetails {
  supplierId?: string;
  invoiceNumber?: string;
  invoiceImage?: string;
  paymentDueDate?: string;
}

export interface SoilAnalysis extends BaseEntity { 
  costCenterId: string;
  costCenterName: string; 
  date: string; 
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  calcium?: number;
  magnesium?: number;
  sulfur?: number;
  aluminum?: number;
  boron?: number;
  organicMatter: number;
  notes: string; 
}

export interface PPELog extends BaseEntity { personnelId: string; personnelName: string; date: string; items: string[]; notes?: string; }
export interface WasteLog extends BaseEntity { date: string; itemDescription: string; quantity: number; tripleWashed: boolean; disposalPoint?: string; }
export interface Machine extends BaseEntity { name: string; brand?: string; purchaseDate?: string; purchaseValue?: number; expectedLifeHours?: number; capacityTheoretical?: number; width?: number; efficiency?: number; dischargeRateLitersPerMin?: number; avgSpeedKmh?: number; }
export interface MaintenanceLog extends BaseEntity { machineId: string; date: string; cost: number; description: string; hoursWorked?: number; fuelUsedLiters?: number; }
export interface RainLog extends BaseEntity { date: string; millimeters: number; }
export interface FinanceLog extends BaseEntity { date: string; type: 'INCOME' | 'EXPENSE'; amount: number; category: string; description: string; }

export type CostClassification = 'JOINT' | 'COFFEE' | 'PLANTAIN' | 'OTHER';

export interface Activity extends BaseEntity { 
  name: string; 
  costClassification?: CostClassification;
}

export interface Personnel extends BaseEntity { 
  name: string; 
  role: string; 
  documentId?: string;
  phone?: string;
  emergencyContact?: string;
  eps?: string;
  arl?: boolean;
  birthDate?: string;
  disability?: string;
  contractType?: ContractType;
  contractStartDate?: string;
  contractEndDate?: string;
}

export interface Supplier extends BaseEntity { 
  name: string; 
  phone?: string; 
  email?: string; 
  address?: string;
  taxId?: string;
  creditDays?: number;
}

export interface AppState {
  warehouses: Warehouse[];
  activeWarehouseId: string;
  inventory: InventoryItem[];
  movements: Movement[];
  suppliers: Supplier[];
  costCenters: CostCenter[];
  personnel: Personnel[]; 
  activities: Activity[]; 
  laborLogs: LaborLog[]; 
  harvests: HarvestLog[];
  machines: Machine[];
  maintenanceLogs: MaintenanceLog[];
  rainLogs: RainLog[];
  financeLogs: FinanceLog[]; 
  soilAnalyses: SoilAnalysis[];
  ppeLogs: PPELog[];
  wasteLogs: WasteLog[];
  agenda: AgendaEvent[];
  phenologyLogs: PhenologyLog[];
  pestLogs: PestLog[];
  plannedLabors: PlannedLabor[]; 
  budgets: BudgetPlan[];
  swot?: SWOT;
  bpaChecklist: Record<string, boolean>;
  assets: Asset[];
  laborFactor: number; 
  adminPin?: string; 
  googleSheetsUrl?: string;
  clients: Client[];
  salesContracts: SalesContract[];
  sales: Sale[];
  auditLogs: AuditLog[];
}
