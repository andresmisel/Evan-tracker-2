export type FeedingType = 'formula' | 'breast_bottle' | 'breast_direct' | 'mixed';
export type BreastSide = 'left' | 'right' | 'both' | 'none';

export interface FeedingRecord {
  id: string;
  familyId: string;
  type: FeedingType;
  amountMl: number;
  amountOz: number;
  durationMinutes?: number;
  breastSide?: BreastSide;
  breastLeftMinutes?: number;
  breastRightMinutes?: number;
  timestamp: string; // ISO string
  notes?: string;
  loggedBy: string; // e.g. "Mamá", "Papá"
  loggedByUid?: string;
  deductedFormulaItemId?: string;
  deductedAmount?: number;
  createdAt: string;
}

export type DiaperType = 'wet' | 'dirty' | 'mixed' | 'clean';
export type PoopColor = 'mustard' | 'brown' | 'green' | 'yellow' | 'other';
export type PoopConsistency = 'liquid' | 'soft' | 'pasty' | 'seedy' | 'hard';

export interface DiaperRecord {
  id: string;
  familyId: string;
  type: DiaperType;
  color?: PoopColor;
  consistency?: PoopConsistency;
  creamApplied: boolean;
  diaperSize?: string;
  timestamp: string; // ISO string
  notes?: string;
  loggedBy: string;
  loggedByUid?: string;
  deductedDiaperItemId?: string;
  deductedWipesItemId?: string;
  createdAt: string;
}

export type SleepType = 'nap' | 'night';

export interface SleepRecord {
  id: string;
  familyId: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  durationMinutes: number;
  sleepType: SleepType;
  quality?: 'calm' | 'restless' | 'interrupted';
  notes?: string;
  loggedBy: string;
  loggedByUid?: string;
  createdAt: string;
}

export type InventoryCategory = 'diapers' | 'formula' | 'wipes' | 'medicine' | 'cream' | 'other';

export interface InventoryItem {
  id: string;
  familyId: string;
  name: string;
  category: InventoryCategory;
  currentQuantity: number;
  unit: string; // 'pañales', 'latas', 'tomas', 'unidades', 'ml', 'gramos', 'paquetes'
  minThreshold: number; // warning level
  criticalThreshold: number; // urgent level
  sizeOrDetail?: string; // e.g. "Talla 2 (4-8 kg)", "Lata 800g"
  dailyAverageConsumption?: number; // estimated from logs
  autoDeductEnabled?: boolean;
  notes?: string;
  updatedAt: string;
}

export type MedicalType = 'appointment' | 'vaccine' | 'medication' | 'growth';

export interface MedicalRecord {
  id: string;
  familyId: string;
  type: MedicalType;
  title: string;
  providerOrDoctor?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  status: 'pending' | 'completed' | 'cancelled';
  weightKg?: number;
  heightCm?: number;
  headCircumferenceCm?: number;
  notes?: string;
  doseNumber?: string;
  targetAge?: string; // e.g. "2 meses", "4 meses"
  dosage?: string; // e.g. "1 gota", "2.5 ml"
  frequency?: string; // e.g. "Cada 8 horas", "Diaria"
  notificationEnabled?: boolean;
  loggedByUid?: string;
  treatmentGroupId?: string;
  createdAt: string;
}

export interface FamilyProfile {
  id: string;
  name: string;
  babyName: string;
  babyBirthDate: string; // YYYY-MM-DD
  familyCode: string;
  memberUids: string[];
  membersNames?: { [uid: string]: string };
  defaultDiaperItemId?: string;
  defaultFormulaItemId?: string;
  wipesPerDiaper?: number;
  autoDeductEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseProjection {
  itemId: string;
  name: string;
  category: InventoryCategory;
  currentQuantity: number;
  unit: string;
  dailyConsumption: number;
  daysRemaining: number;
  depletionDate: string;
  recommendedBuyFor15Days: number;
  recommendedBuyFor30Days: number;
  status: 'critical' | 'low' | 'healthy';
}
