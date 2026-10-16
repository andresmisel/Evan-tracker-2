import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import {
  FeedingRecord,
  DiaperRecord,
  SleepRecord,
  InventoryItem,
  MedicalRecord,
  FamilyProfile,
  PurchaseProjection,
} from '../types';

const LOCAL_STORAGE_PREFIX = 'evan_tracker_';

// Initial seed data for first launch
export const DEFAULT_FAMILY_ID = 'evan-family-main';

export const INITIAL_FAMILY: FamilyProfile = {
  id: DEFAULT_FAMILY_ID,
  name: 'Familia de Evan',
  babyName: 'Evan',
  babyBirthDate: '2026-06-15',
  familyCode: 'EVAN-2026',
  memberUids: [],
  membersNames: {},
  autoDeductEnabled: true,
  wipesPerDiaper: 2,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'item-diapers-t2',
    familyId: DEFAULT_FAMILY_ID,
    name: 'Pañales Talla 2 (4 a 8 kg)',
    category: 'diapers',
    currentQuantity: 34,
    unit: 'pañales',
    minThreshold: 20,
    criticalThreshold: 10,
    sizeOrDetail: 'Talla 2 Confort Sec',
    autoDeductEnabled: true,
    notes: 'Uso habitual actual',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'item-diapers-t1',
    familyId: DEFAULT_FAMILY_ID,
    name: 'Pañales Talla 1 (2 a 5 kg)',
    category: 'diapers',
    currentQuantity: 16,
    unit: 'pañales',
    minThreshold: 15,
    criticalThreshold: 8,
    sizeOrDetail: 'Talla 1 Recién Nacido Plus',
    autoDeductEnabled: true,
    notes: 'Pañales de reserva',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'item-formula-stage1',
    familyId: DEFAULT_FAMILY_ID,
    name: 'Fórmula Infantil Etapa 1 (800g)',
    category: 'formula',
    currentQuantity: 3,
    unit: 'latas',
    minThreshold: 2,
    criticalThreshold: 1,
    sizeOrDetail: 'Lata 800g (aprox. 55 tomas)',
    autoDeductEnabled: true,
    notes: 'Rinde 7-8 días por lata',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'item-wipes',
    familyId: DEFAULT_FAMILY_ID,
    name: 'Toallitas Húmedas Hipoalergénicas',
    category: 'wipes',
    currentQuantity: 4,
    unit: 'paquetes',
    minThreshold: 3,
    criticalThreshold: 1,
    sizeOrDetail: 'Paquete x 80 toallitas',
    autoDeductEnabled: true,
    notes: 'Sin perfume, para piel sensible',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'item-cream',
    familyId: DEFAULT_FAMILY_ID,
    name: 'Crema Protectora Antipañalitis',
    category: 'cream',
    currentQuantity: 2,
    unit: 'tubos',
    minThreshold: 2,
    criticalThreshold: 1,
    sizeOrDetail: 'Tubo 100g con Óxido de Zinc',
    autoDeductEnabled: false,
    notes: 'Aplicar capa delgada en la noche',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'item-vitamind',
    familyId: DEFAULT_FAMILY_ID,
    name: 'Vitamina D3 en Gotas',
    category: 'medicine',
    currentQuantity: 1,
    unit: 'frascos',
    minThreshold: 1,
    criticalThreshold: 1,
    sizeOrDetail: 'Frasco gotero 10ml',
    autoDeductEnabled: false,
    notes: '1 gota diaria (400 UI) recomendada por pediatra',
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_VACCINES: MedicalRecord[] = [
  {
    id: 'vac-bcg',
    familyId: DEFAULT_FAMILY_ID,
    type: 'vaccine',
    title: 'BCG (Tuberculosis)',
    targetAge: 'Al nacer',
    date: '2026-06-16',
    status: 'completed',
    doseNumber: 'Dosis única',
    notes: 'Aplicada en hospital al nacimiento.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'vac-hepb-birth',
    familyId: DEFAULT_FAMILY_ID,
    type: 'vaccine',
    title: 'Hepatitis B (Pediátrica)',
    targetAge: 'Al nacer',
    date: '2026-06-16',
    status: 'completed',
    doseNumber: '1ª Dosis',
    notes: 'Aplicada sin reacciones adversas.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'vac-penta-2m',
    familyId: DEFAULT_FAMILY_ID,
    type: 'vaccine',
    title: 'Pentavalente / Hexavalente',
    targetAge: '2 meses',
    date: '2026-08-16',
    status: 'completed',
    doseNumber: '1ª Dosis',
    notes: 'Difteria, Tétanos, Tos ferina, Hep B, Hib, Polio.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'vac-rotavirus-2m',
    familyId: DEFAULT_FAMILY_ID,
    type: 'vaccine',
    title: 'Rotavirus (Oral)',
    targetAge: '2 meses',
    date: '2026-08-16',
    status: 'completed',
    doseNumber: '1ª Dosis',
    notes: 'Gotitas orales toleradas adecuadamente.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'vac-pneumo-2m',
    familyId: DEFAULT_FAMILY_ID,
    type: 'vaccine',
    title: 'Neumococo Conjugada',
    targetAge: '2 meses',
    date: '2026-08-16',
    status: 'completed',
    doseNumber: '1ª Dosis',
    notes: 'Leve enrojecimiento local que cedió en 24h.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'vac-penta-4m',
    familyId: DEFAULT_FAMILY_ID,
    type: 'vaccine',
    title: 'Pentavalente / Hexavalente',
    targetAge: '4 meses',
    date: '2026-10-18',
    time: '10:00',
    status: 'pending',
    doseNumber: '2ª Dosis',
    providerOrDoctor: 'Dra. Valentina Morales (Pediatría)',
    notes: 'Tener Paracetamol pediátrico en casa por si presenta febrícula.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'vac-pneumo-4m',
    familyId: DEFAULT_FAMILY_ID,
    type: 'vaccine',
    title: 'Neumococo Conjugada',
    targetAge: '4 meses',
    date: '2026-10-18',
    time: '10:15',
    status: 'pending',
    doseNumber: '2ª Dosis',
    providerOrDoctor: 'Dra. Valentina Morales',
    notes: 'Programada junto con la 2ª pentavalente.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'med-checkup-4m',
    familyId: DEFAULT_FAMILY_ID,
    type: 'appointment',
    title: 'Control Pediátrico 4to Mes (Crecimiento y Desarrollo)',
    providerOrDoctor: 'Dra. Valentina Morales',
    date: '2026-10-25',
    time: '16:30',
    status: 'pending',
    notes: 'Preguntar sobre inicio de ablactación / alimentación complementaria.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'growth-birth',
    familyId: DEFAULT_FAMILY_ID,
    type: 'growth',
    title: 'Somatometría al Nacimiento',
    targetAge: 'Al nacer',
    date: '2026-06-16',
    weightKg: 3.35,
    heightCm: 50.0,
    headCircumferenceCm: 35.0,
    status: 'completed',
    providerOrDoctor: 'Hospital Materno Infantil',
    notes: 'Apgar 9/10. Medidas neonatales en rango percentil 50.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'growth-1m',
    familyId: DEFAULT_FAMILY_ID,
    type: 'growth',
    title: 'Control 1er Mes',
    targetAge: '1 mes',
    date: '2026-07-16',
    weightKg: 4.30,
    heightCm: 54.2,
    headCircumferenceCm: 37.2,
    status: 'completed',
    providerOrDoctor: 'Dra. Valentina Morales',
    notes: 'Ganancia ponderal óptima (+950g). Reflejos normales.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'growth-2m',
    familyId: DEFAULT_FAMILY_ID,
    type: 'growth',
    title: 'Control 2do Mes',
    targetAge: '2 meses',
    date: '2026-08-16',
    weightKg: 5.25,
    heightCm: 58.0,
    headCircumferenceCm: 39.1,
    status: 'completed',
    providerOrDoctor: 'Dra. Valentina Morales',
    notes: 'Curva de peso en percentil 50. Sonrisa social activa.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'growth-4m',
    familyId: DEFAULT_FAMILY_ID,
    type: 'growth',
    title: 'Control 4to Mes',
    targetAge: '4 meses',
    date: '2026-10-10',
    weightKg: 6.45,
    heightCm: 63.5,
    headCircumferenceCm: 41.6,
    status: 'completed',
    providerOrDoctor: 'Dra. Valentina Morales',
    notes: 'Excelente tono muscular. Curva de peso y talla armónica.',
    createdAt: new Date().toISOString(),
  },
];

// Helper to seed sample feedings and diapers so charts are immediately populated
export function generateSeedActivities(familyId: string) {
  const feedings: FeedingRecord[] = [];
  const diapers: DiaperRecord[] = [];
  const sleeps: SleepRecord[] = [];

  const now = new Date();
  
  // Seed past 7 days of realistic logs
  for (let d = 6; d >= 0; d--) {
    const dayDate = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
    const dayStr = dayDate.toISOString().split('T')[0];

    // 5-6 feedings per day
    const feedingHours = [3, 7, 11, 15, 18, 22];
    feedingHours.forEach((hour, idx) => {
      const feedTime = new Date(dayDate);
      feedTime.setHours(hour, Math.floor(Math.random() * 30), 0);
      
      const isFormula = idx % 2 === 0;
      const ml = isFormula ? 120 + Math.floor(Math.random() * 30) : 110 + Math.floor(Math.random() * 20);
      feedings.push({
        id: `feed-seed-${d}-${idx}`,
        familyId,
        type: isFormula ? 'formula' : 'breast_bottle',
        amountMl: ml,
        amountOz: Number((ml / 29.5735).toFixed(1)),
        durationMinutes: 15 + Math.floor(Math.random() * 10),
        timestamp: feedTime.toISOString(),
        notes: isFormula ? 'Toma tranquila con biberón anticólicos' : 'Leche materna refrigerada tibia',
        loggedBy: idx % 2 === 0 ? 'Mamá' : 'Papá',
        createdAt: feedTime.toISOString(),
      });
    });

    // 5-7 diaper changes per day
    const diaperHours = [4, 8, 12, 14, 17, 20];
    diaperHours.forEach((hour, idx) => {
      const diaperTime = new Date(dayDate);
      diaperTime.setHours(hour, Math.floor(Math.random() * 30), 0);
      const isDirty = idx === 1 || idx === 4;
      const isMixed = idx === 3;
      diapers.push({
        id: `diaper-seed-${d}-${idx}`,
        familyId,
        type: isMixed ? 'mixed' : isDirty ? 'dirty' : 'wet',
        color: isDirty || isMixed ? 'mustard' : undefined,
        consistency: isDirty || isMixed ? 'soft' : undefined,
        creamApplied: isDirty || isMixed,
        diaperSize: 'Talla 2',
        timestamp: diaperTime.toISOString(),
        notes: isDirty ? 'Consistencia normal color mostaza' : 'Pañal muy mojado',
        loggedBy: idx % 2 === 0 ? 'Mamá' : 'Papá',
        createdAt: diaperTime.toISOString(),
      });
    });

    // 2-3 naps + 1 night sleep
    // Night sleep from 21:00 previous to 06:30
    const nightStart = new Date(dayDate);
    nightStart.setHours(21, 30, 0);
    const nightEnd = new Date(dayDate.getTime() + 8.5 * 60 * 60 * 1000);
    nightEnd.setHours(6, 0, 0);
    sleeps.push({
      id: `sleep-night-${d}`,
      familyId,
      startTime: nightStart.toISOString(),
      endTime: nightEnd.toISOString(),
      durationMinutes: 510,
      sleepType: 'night',
      quality: 'calm',
      notes: 'Despertó solo una vez para toma de las 3:00 am',
      loggedBy: 'Mamá',
      createdAt: nightStart.toISOString(),
    });

    // Afternoon nap
    const napStart = new Date(dayDate);
    napStart.setHours(13, 0, 0);
    const napEnd = new Date(dayDate);
    napEnd.setHours(14, 45, 0);
    sleeps.push({
      id: `sleep-nap-${d}`,
      familyId,
      startTime: napStart.toISOString(),
      endTime: napEnd.toISOString(),
      durationMinutes: 105,
      sleepType: 'nap',
      quality: 'calm',
      notes: 'Siesta profunda en cuna con ruido blanco',
      loggedBy: 'Papá',
      createdAt: napStart.toISOString(),
    });
  }

  return { feedings, diapers, sleeps };
}

// Local Storage helpers
export function getLocal<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(LOCAL_STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error('Error saving to localStorage', e);
  }
}

// Real-time Firestore sync & dispatch
export class DataService {
  private familyId: string;
  private unsubscribers: (() => void)[] = [];

  constructor(familyId: string = DEFAULT_FAMILY_ID) {
    this.familyId = familyId;
  }

  setFamilyId(newFamilyId: string) {
    this.familyId = newFamilyId;
    this.unsubscribeAll();
  }

  unsubscribeAll() {
    this.unsubscribers.forEach(unsub => {
      try {
        unsub();
      } catch {
        // ignore
      }
    });
    this.unsubscribers = [];
  }

  // Subscribe to Feedings
  subscribeFeedings(callback: (feedings: FeedingRecord[]) => void) {
    const path = `families/${this.familyId}/feedings`;
    const colRef = collection(db, path);
    const q = query(colRef, orderBy('timestamp', 'desc'), limit(150));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const records: FeedingRecord[] = [];
        snapshot.forEach((d) => {
          records.push({ ...(d.data() as FeedingRecord), id: d.id });
        });
        if (records.length > 0) {
          setLocal(`feedings_${this.familyId}`, records);
          callback(records);
        } else {
          const cached = getLocal<FeedingRecord[]>(`feedings_${this.familyId}`, []);
          callback(cached);
        }
      },
      (error) => {
        console.warn('Firestore Feedings offline or permission fallback:', error.message);
        // Fallback to local storage seamlessly
        const cached = getLocal<FeedingRecord[]>(`feedings_${this.familyId}`, []);
        callback(cached);
      }
    );
    this.unsubscribers.push(unsub);
  }

  // Subscribe to Diapers
  subscribeDiapers(callback: (diapers: DiaperRecord[]) => void) {
    const path = `families/${this.familyId}/diapers`;
    const colRef = collection(db, path);
    const q = query(colRef, orderBy('timestamp', 'desc'), limit(150));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const records: DiaperRecord[] = [];
        snapshot.forEach((d) => {
          records.push({ ...(d.data() as DiaperRecord), id: d.id });
        });
        if (records.length > 0) {
          setLocal(`diapers_${this.familyId}`, records);
          callback(records);
        } else {
          const cached = getLocal<DiaperRecord[]>(`diapers_${this.familyId}`, []);
          callback(cached);
        }
      },
      (error) => {
        console.warn('Firestore Diapers offline fallback:', error.message);
        const cached = getLocal<DiaperRecord[]>(`diapers_${this.familyId}`, []);
        callback(cached);
      }
    );
    this.unsubscribers.push(unsub);
  }

  // Subscribe to Sleeps
  subscribeSleeps(callback: (sleeps: SleepRecord[]) => void) {
    const path = `families/${this.familyId}/sleeps`;
    const colRef = collection(db, path);
    const q = query(colRef, orderBy('startTime', 'desc'), limit(100));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const records: SleepRecord[] = [];
        snapshot.forEach((d) => {
          records.push({ ...(d.data() as SleepRecord), id: d.id });
        });
        if (records.length > 0) {
          setLocal(`sleeps_${this.familyId}`, records);
          callback(records);
        } else {
          const cached = getLocal<SleepRecord[]>(`sleeps_${this.familyId}`, []);
          callback(cached);
        }
      },
      (error) => {
        console.warn('Firestore Sleeps offline fallback:', error.message);
        const cached = getLocal<SleepRecord[]>(`sleeps_${this.familyId}`, []);
        callback(cached);
      }
    );
    this.unsubscribers.push(unsub);
  }

  // Subscribe to Inventory
  subscribeInventory(callback: (items: InventoryItem[]) => void) {
    const path = `families/${this.familyId}/inventory`;
    const colRef = collection(db, path);

    const unsub = onSnapshot(
      colRef,
      (snapshot) => {
        const items: InventoryItem[] = [];
        snapshot.forEach((d) => {
          items.push({ ...(d.data() as InventoryItem), id: d.id });
        });
        if (items.length > 0) {
          setLocal(`inventory_${this.familyId}`, items);
          callback(items);
        } else {
          const cached = getLocal<InventoryItem[]>(`inventory_${this.familyId}`, INITIAL_INVENTORY);
          callback(cached);
        }
      },
      (error) => {
        console.warn('Firestore Inventory offline fallback:', error.message);
        const cached = getLocal<InventoryItem[]>(`inventory_${this.familyId}`, INITIAL_INVENTORY);
        callback(cached);
      }
    );
    this.unsubscribers.push(unsub);
  }

  // Subscribe to Medical records
  subscribeMedical(callback: (records: MedicalRecord[]) => void) {
    const path = `families/${this.familyId}/medical`;
    const colRef = collection(db, path);

    const unsub = onSnapshot(
      colRef,
      (snapshot) => {
        const records: MedicalRecord[] = [];
        snapshot.forEach((d) => {
          records.push({ ...(d.data() as MedicalRecord), id: d.id });
        });
        if (records.length > 0) {
          setLocal(`medical_${this.familyId}`, records);
          callback(records);
        } else {
          const cached = getLocal<MedicalRecord[]>(`medical_${this.familyId}`, INITIAL_VACCINES);
          callback(cached);
        }
      },
      (error) => {
        console.warn('Firestore Medical offline fallback:', error.message);
        const cached = getLocal<MedicalRecord[]>(`medical_${this.familyId}`, INITIAL_VACCINES);
        callback(cached);
      }
    );
    this.unsubscribers.push(unsub);
  }

  // Save Feeding
  async saveFeeding(feeding: FeedingRecord, inventoryItems: InventoryItem[], autoDeduct: boolean = true) {
    const path = `families/${this.familyId}/feedings/${feeding.id}`;
    
    // Save to Firestore & local
    try {
      if (auth.currentUser) {
        await setDoc(doc(db, 'families', this.familyId, 'feedings', feeding.id), feeding);
      }
    } catch (err) {
      console.warn('Cloud save feeding fallback to local:', err);
    }
    
    // Update local cache
    const current = getLocal<FeedingRecord[]>(`feedings_${this.familyId}`, []);
    const updatedFeedings = [feeding, ...current.filter(f => f.id !== feeding.id)];
    setLocal(`feedings_${this.familyId}`, updatedFeedings);

    // Auto-deduct formula if enabled and formula consumed
    let updatedInventoryList = inventoryItems;
    if (autoDeduct && (feeding.type === 'formula' || feeding.type === 'mixed')) {
      const formulaItem = feeding.deductedFormulaItemId
        ? inventoryItems.find((i) => i.id === feeding.deductedFormulaItemId)
        : inventoryItems.find(
            (i) => i.category === 'formula' && (i.autoDeductEnabled ?? true)
          );
      if (formulaItem) {
        const newQty = Math.max(0, formulaItem.currentQuantity - (formulaItem.unit === 'latas' ? 0.02 : 1));
        updatedInventoryList = await this.updateInventoryQuantity(formulaItem.id, Number(newQty.toFixed(2)));
      }
    }
    return { feedings: updatedFeedings, inventory: updatedInventoryList };
  }

  // Save Diaper
  async saveDiaper(diaper: DiaperRecord, inventoryItems: InventoryItem[], autoDeduct: boolean = true) {
    try {
      if (auth.currentUser) {
        await setDoc(doc(db, 'families', this.familyId, 'diapers', diaper.id), diaper);
      }
    } catch (err) {
      console.warn('Cloud save diaper fallback to local:', err);
    }

    const current = getLocal<DiaperRecord[]>(`diapers_${this.familyId}`, []);
    const updatedDiapers = [diaper, ...current.filter(d => d.id !== diaper.id)];
    setLocal(`diapers_${this.familyId}`, updatedDiapers);

    // Auto-deduct 1 diaper from the specifically chosen item
    let updatedInventoryList = inventoryItems;
    if (autoDeduct) {
      const diaperItem = diaper.deductedDiaperItemId
        ? inventoryItems.find((i) => i.id === diaper.deductedDiaperItemId)
        : inventoryItems.find(
            (i) => i.category === 'diapers' && (i.autoDeductEnabled ?? true)
          );

      if (diaperItem) {
        const newQty = Math.max(0, diaperItem.currentQuantity - 1);
        updatedInventoryList = await this.updateInventoryQuantity(diaperItem.id, newQty);
      }

      // Auto-deduct wipes if used
      const wipesItem = inventoryItems.find(
        (i) => i.category === 'wipes' && (i.autoDeductEnabled ?? true)
      );
      if (wipesItem && (diaper.type === 'dirty' || diaper.type === 'mixed')) {
        if (wipesItem.unit === 'paquetes') {
          const newQty = Math.max(0, wipesItem.currentQuantity - 0.03);
          updatedInventoryList = await this.updateInventoryQuantity(wipesItem.id, Number(newQty.toFixed(2)));
        } else {
          const newQty = Math.max(0, wipesItem.currentQuantity - 2);
          updatedInventoryList = await this.updateInventoryQuantity(wipesItem.id, newQty);
        }
      }
    }
    return { diapers: updatedDiapers, inventory: updatedInventoryList };
  }

  // Save Sleep
  async saveSleep(sleep: SleepRecord) {
    try {
      if (auth.currentUser) {
        await setDoc(doc(db, 'families', this.familyId, 'sleeps', sleep.id), sleep);
      }
    } catch (err) {
      console.warn('Cloud save sleep fallback to local:', err);
    }

    const current = getLocal<SleepRecord[]>(`sleeps_${this.familyId}`, []);
    const updated = [sleep, ...current.filter(s => s.id !== sleep.id)];
    setLocal(`sleeps_${this.familyId}`, updated);
    return updated;
  }

  // Save/Update Inventory Item
  async saveInventoryItem(item: InventoryItem) {
    try {
      if (auth.currentUser) {
        await setDoc(doc(db, 'families', this.familyId, 'inventory', item.id), item);
      }
    } catch (err) {
      console.warn('Cloud save inventory item fallback to local:', err);
    }

    const current = getLocal<InventoryItem[]>(`inventory_${this.familyId}`, INITIAL_INVENTORY);
    const index = current.findIndex(i => i.id === item.id);
    const updated = index >= 0
      ? current.map(i => i.id === item.id ? item : i)
      : [...current, item];
    setLocal(`inventory_${this.familyId}`, updated);
    return updated;
  }

  // Quick update quantity
  async updateInventoryQuantity(itemId: string, newQuantity: number) {
    const current = getLocal<InventoryItem[]>(`inventory_${this.familyId}`, INITIAL_INVENTORY);
    const item = current.find(i => i.id === itemId);
    if (!item) return current;

    const updatedItem = {
      ...item,
      currentQuantity: newQuantity,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (auth.currentUser) {
        await setDoc(doc(db, 'families', this.familyId, 'inventory', itemId), updatedItem);
      }
    } catch (err) {
      console.warn('Cloud update quantity fallback to local:', err);
    }

    const updated = current.map(i => i.id === itemId ? updatedItem : i);
    setLocal(`inventory_${this.familyId}`, updated);
    return updated;
  }

  // Save Medical Record
  async saveMedicalRecord(record: MedicalRecord) {
    try {
      if (auth.currentUser) {
        await setDoc(doc(db, 'families', this.familyId, 'medical', record.id), record);
      }
    } catch (err) {
      console.warn('Cloud save medical fallback to local:', err);
    }

    const current = getLocal<MedicalRecord[]>(`medical_${this.familyId}`, INITIAL_VACCINES);
    const index = current.findIndex(m => m.id === record.id);
    const updated = index >= 0
      ? current.map(m => m.id === record.id ? record : m)
      : [...current, record];
    setLocal(`medical_${this.familyId}`, updated);
    return updated;
  }

  // Save Multiple Medical Records at once
  async saveBatchMedicalRecords(newRecords: MedicalRecord[]) {
    try {
      if (auth.currentUser) {
        for (const record of newRecords) {
          await setDoc(doc(db, 'families', this.familyId, 'medical', record.id), record);
        }
      }
    } catch (err) {
      console.warn('Cloud save batch medical fallback to local:', err);
    }

    const current = getLocal<MedicalRecord[]>(`medical_${this.familyId}`, INITIAL_VACCINES);
    const existingFiltered = current.filter((m) => !newRecords.some((nr) => nr.id === m.id));
    const updated = [...newRecords, ...existingFiltered];
    setLocal(`medical_${this.familyId}`, updated);
    return updated;
  }

  // Delete Record
  async deleteRecord(collectionName: 'feedings' | 'diapers' | 'sleeps' | 'inventory' | 'medical', id: string) {
    try {
      if (auth.currentUser) {
        await deleteDoc(doc(db, 'families', this.familyId, collectionName, id));
      }
    } catch (err) {
      console.warn(`Cloud delete from ${collectionName} fallback to local:`, err);
    }

    const key = `${collectionName}_${this.familyId}`;
    const current = getLocal<any[]>(key, []);
    const updated = current.filter(item => item.id !== id);
    setLocal(key, updated);
    return updated;
  }
}

// Projections Calculation Engine
export function calculateProjections(
  inventory: InventoryItem[],
  diapers: DiaperRecord[],
  feedings: FeedingRecord[]
): PurchaseProjection[] {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Filter last 7 days logs
  const recentDiapers = diapers.filter(d => new Date(d.timestamp) >= sevenDaysAgo);
  const recentFeedings = feedings.filter(f => new Date(f.timestamp) >= sevenDaysAgo);

  const daysCount = Math.max(1, Math.min(7, Math.ceil((now.getTime() - sevenDaysAgo.getTime()) / (1000 * 60 * 60 * 24))));

  // Diapers daily avg
  const dailyDiaperUsage = recentDiapers.length > 0
    ? Number((recentDiapers.length / daysCount).toFixed(1))
    : 6.5; // realistic pediatrician standard

  // Formula daily avg in ml
  const formulaFeedings = recentFeedings.filter(f => f.type === 'formula' || f.type === 'mixed');
  const totalFormulaMl = formulaFeedings.reduce((sum, f) => sum + (f.amountMl || 0), 0);
  const dailyFormulaMl = formulaFeedings.length > 0
    ? Math.round(totalFormulaMl / daysCount)
    : 450; // standard approx

  return inventory.map((item) => {
    let dailyConsumption = 0;

    if (item.category === 'diapers') {
      dailyConsumption = dailyDiaperUsage;
    } else if (item.category === 'formula') {
      // 1 can 800g ~ approx 55 servings or 6600 ml
      if (item.unit === 'latas') {
        const canServings = 55;
        const servingsPerDay = dailyFormulaMl / 120;
        dailyConsumption = Number((servingsPerDay / canServings).toFixed(2));
      } else {
        dailyConsumption = Number((dailyFormulaMl / 120).toFixed(1));
      }
    } else if (item.category === 'wipes') {
      // average 2.5 wipes per diaper change = ~16 wipes/day. A pack of 80 is 0.2 packs/day.
      dailyConsumption = item.unit === 'paquetes' ? 0.2 : dailyDiaperUsage * 2.5;
    } else {
      dailyConsumption = 0.05; // standard slow consumable
    }

    const daysRemaining = dailyConsumption > 0
      ? Math.max(0, Math.floor(item.currentQuantity / dailyConsumption))
      : 999;

    const depletionDateObj = new Date(now.getTime() + daysRemaining * 24 * 60 * 60 * 1000);
    const depletionDate = daysRemaining >= 999
      ? 'Más de 3 meses'
      : depletionDateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });

    let status: 'critical' | 'low' | 'healthy' = 'healthy';
    if (item.currentQuantity <= item.criticalThreshold || daysRemaining <= 3) {
      status = 'critical';
    } else if (item.currentQuantity <= item.minThreshold || daysRemaining <= 7) {
      status = 'low';
    }

    const needed15 = Math.ceil(dailyConsumption * 15);
    const needed30 = Math.ceil(dailyConsumption * 30);

    return {
      itemId: item.id,
      name: item.name,
      category: item.category,
      currentQuantity: item.currentQuantity,
      unit: item.unit,
      dailyConsumption,
      daysRemaining,
      depletionDate,
      recommendedBuyFor15Days: item.unit === 'latas' ? Math.max(1, Math.ceil(needed15)) : needed15,
      recommendedBuyFor30Days: item.unit === 'latas' ? Math.max(2, Math.ceil(needed30)) : needed30,
      status,
    };
  });
}
