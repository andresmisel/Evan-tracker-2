import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
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

export const INITIAL_INVENTORY: InventoryItem[] = [];

export const INITIAL_VACCINES: MedicalRecord[] = [];

// Clean initial empty activities - the app starts completely clean and empty as requested
export function generateSeedActivities(_familyId: string) {
  return { feedings: [], diapers: [], sleeps: [] };
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

// Clean any undefined properties before sending to Firestore
export function cleanForFirestore<T extends Record<string, any>>(data: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        result[key] = cleanForFirestore(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
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

  // Subscribe to Family Profile
  subscribeFamily(callback: (family: FamilyProfile) => void) {
    const docRef = doc(db, 'families', this.familyId);
    const unsub = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as FamilyProfile;
          setLocal('family_profile', data);
          callback(data);
        } else {
          const cached = getLocal<FamilyProfile>('family_profile', INITIAL_FAMILY);
          callback(cached);
        }
      },
      (error) => {
        console.warn('Firestore Family subscription fallback:', error.message);
        const cached = getLocal<FamilyProfile>('family_profile', INITIAL_FAMILY);
        callback(cached);
      }
    );
    this.unsubscribers.push(unsub);
  }

  // Save Family Profile to Firestore and Local
  async saveFamily(family: FamilyProfile) {
    const updatedFamily: FamilyProfile = {
      ...family,
      updatedAt: new Date().toISOString(),
    };

    setLocal('family_profile', updatedFamily);

    try {
      await setDoc(doc(db, 'families', this.familyId), cleanForFirestore(updatedFamily), { merge: true });
    } catch (err) {
      console.warn('Cloud save family fallback to local:', err);
    }
    return updatedFamily;
  }

  // Force full bidirectional sync between cloud and local device
  async forceFullSync(currentFamily?: FamilyProfile): Promise<{ success: boolean; syncedCount: number; message: string }> {
    let syncedCount = 0;
    try {
      // 1. Family profile sync
      const famRef = doc(db, 'families', this.familyId);
      const famSnap = await getDoc(famRef);
      let activeFamily = currentFamily || getLocal<FamilyProfile>('family_profile', INITIAL_FAMILY);
      if (famSnap.exists()) {
        const cloudFam = famSnap.data() as FamilyProfile;
        activeFamily = { ...activeFamily, ...cloudFam };
        setLocal('family_profile', activeFamily);
      } else {
        await setDoc(famRef, cleanForFirestore(activeFamily), { merge: true });
        syncedCount++;
      }

      // 2. Feedings sync
      const feedingsRef = collection(db, 'families', this.familyId, 'feedings');
      const feedingsSnap = await getDocs(feedingsRef);
      const cloudFeedings: FeedingRecord[] = [];
      feedingsSnap.forEach(d => cloudFeedings.push({ ...(d.data() as FeedingRecord), id: d.id }));

      cloudFeedings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setLocal(`feedings_${this.familyId}`, cloudFeedings);

      // 3. Diapers sync
      const diapersRef = collection(db, 'families', this.familyId, 'diapers');
      const diapersSnap = await getDocs(diapersRef);
      const cloudDiapers: DiaperRecord[] = [];
      diapersSnap.forEach(d => cloudDiapers.push({ ...(d.data() as DiaperRecord), id: d.id }));
      cloudDiapers.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setLocal(`diapers_${this.familyId}`, cloudDiapers);

      // 4. Sleeps sync
      const sleepsRef = collection(db, 'families', this.familyId, 'sleeps');
      const sleepsSnap = await getDocs(sleepsRef);
      const cloudSleeps: SleepRecord[] = [];
      sleepsSnap.forEach(d => cloudSleeps.push({ ...(d.data() as SleepRecord), id: d.id }));
      cloudSleeps.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      setLocal(`sleeps_${this.familyId}`, cloudSleeps);

      // 5. Inventory sync
      const invRef = collection(db, 'families', this.familyId, 'inventory');
      const invSnap = await getDocs(invRef);
      const cloudInventory: InventoryItem[] = [];
      invSnap.forEach(d => cloudInventory.push({ ...(d.data() as InventoryItem), id: d.id }));
      setLocal(`inventory_${this.familyId}`, cloudInventory);

      // 6. Medical records sync
      const medRef = collection(db, 'families', this.familyId, 'medical');
      const medSnap = await getDocs(medRef);
      const cloudMedical: MedicalRecord[] = [];
      medSnap.forEach(d => cloudMedical.push({ ...(d.data() as MedicalRecord), id: d.id }));
      setLocal(`medical_${this.familyId}`, cloudMedical);

      const totalRecords = cloudFeedings.length + cloudDiapers.length + cloudSleeps.length + cloudInventory.length + cloudMedical.length;
      return {
        success: true,
        syncedCount: totalRecords,
        message: '¡Sincronización en la nube completada con éxito!',
      };
    } catch (err: any) {
      console.error('Error during forceFullSync:', err);
      return {
        success: false,
        syncedCount,
        message: err?.message || 'Error de sincronización con la nube.',
      };
    }
  }

  // Backward compatibility alias for syncLocalToCloud
  async syncLocalToCloud(currentFamily?: FamilyProfile): Promise<{ success: boolean; syncedCount: number }> {
    const res = await this.forceFullSync(currentFamily);
    return { success: res.success, syncedCount: res.syncedCount };
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
        setLocal(`feedings_${this.familyId}`, records);
        callback(records);
      },
      (error) => {
        console.warn('Firestore Feedings offline fallback:', error.message);
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
        setLocal(`diapers_${this.familyId}`, records);
        callback(records);
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
        setLocal(`sleeps_${this.familyId}`, records);
        callback(records);
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
        setLocal(`inventory_${this.familyId}`, items);
        callback(items);
      },
      (error) => {
        console.warn('Firestore Inventory offline fallback:', error.message);
        const cached = getLocal<InventoryItem[]>(`inventory_${this.familyId}`, []);
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
        setLocal(`medical_${this.familyId}`, records);
        callback(records);
      },
      (error) => {
        console.warn('Firestore Medical offline fallback:', error.message);
        const cached = getLocal<MedicalRecord[]>(`medical_${this.familyId}`, []);
        callback(cached);
      }
    );
    this.unsubscribers.push(unsub);
  }

  // Save Feeding
  async saveFeeding(feeding: FeedingRecord, inventoryItems: InventoryItem[], autoDeduct: boolean = true) {
    const enriched: FeedingRecord = {
      ...feeding,
      loggedByUid: feeding.loggedByUid || auth.currentUser?.uid || '',
    };
    
    // Save to Firestore & local
    try {
      await setDoc(doc(db, 'families', this.familyId, 'feedings', enriched.id), cleanForFirestore(enriched), { merge: true });
    } catch (err) {
      console.warn('Cloud save feeding fallback to local:', err);
    }
    
    // Update local cache
    const current = getLocal<FeedingRecord[]>(`feedings_${this.familyId}`, []);
    const updatedFeedings = [enriched, ...current.filter(f => f.id !== enriched.id)];
    setLocal(`feedings_${this.familyId}`, updatedFeedings);

    // Auto-deduct formula if enabled and formula consumed
    let updatedInventoryList = inventoryItems;
    if (autoDeduct && (enriched.type === 'formula' || enriched.type === 'mixed')) {
      const formulaItem = enriched.deductedFormulaItemId
        ? inventoryItems.find((i) => i.id === enriched.deductedFormulaItemId)
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
    const enriched: DiaperRecord = {
      ...diaper,
      loggedByUid: diaper.loggedByUid || auth.currentUser?.uid || '',
    };

    try {
      await setDoc(doc(db, 'families', this.familyId, 'diapers', enriched.id), cleanForFirestore(enriched), { merge: true });
    } catch (err) {
      console.warn('Cloud save diaper fallback to local:', err);
    }

    const current = getLocal<DiaperRecord[]>(`diapers_${this.familyId}`, []);
    const updatedDiapers = [enriched, ...current.filter(d => d.id !== enriched.id)];
    setLocal(`diapers_${this.familyId}`, updatedDiapers);

    // Auto-deduct 1 diaper from the specifically chosen item
    let updatedInventoryList = inventoryItems;
    if (autoDeduct) {
      const diaperItem = enriched.deductedDiaperItemId
        ? inventoryItems.find((i) => i.id === enriched.deductedDiaperItemId)
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
      if (wipesItem && (enriched.type === 'dirty' || enriched.type === 'mixed')) {
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
    const enriched: SleepRecord = {
      ...sleep,
      loggedByUid: sleep.loggedByUid || auth.currentUser?.uid || '',
    };

    try {
      await setDoc(doc(db, 'families', this.familyId, 'sleeps', enriched.id), cleanForFirestore(enriched), { merge: true });
    } catch (err) {
      console.warn('Cloud save sleep fallback to local:', err);
    }

    const current = getLocal<SleepRecord[]>(`sleeps_${this.familyId}`, []);
    const updated = [enriched, ...current.filter(s => s.id !== enriched.id)];
    setLocal(`sleeps_${this.familyId}`, updated);
    return updated;
  }

  // Save/Update Inventory Item
  async saveInventoryItem(item: InventoryItem) {
    try {
      await setDoc(doc(db, 'families', this.familyId, 'inventory', item.id), cleanForFirestore(item), { merge: true });
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
      await setDoc(doc(db, 'families', this.familyId, 'inventory', itemId), cleanForFirestore(updatedItem), { merge: true });
    } catch (err) {
      console.warn('Cloud update quantity fallback to local:', err);
    }

    const updated = current.map(i => i.id === itemId ? updatedItem : i);
    setLocal(`inventory_${this.familyId}`, updated);
    return updated;
  }

  // Save Medical Record
  async saveMedicalRecord(record: MedicalRecord) {
    const enriched: MedicalRecord = {
      ...record,
      loggedByUid: record.loggedByUid || auth.currentUser?.uid || '',
    };

    try {
      await setDoc(doc(db, 'families', this.familyId, 'medical', enriched.id), cleanForFirestore(enriched), { merge: true });
    } catch (err) {
      console.warn('Cloud save medical fallback to local:', err);
    }

    const current = getLocal<MedicalRecord[]>(`medical_${this.familyId}`, INITIAL_VACCINES);
    const index = current.findIndex(m => m.id === enriched.id);
    const updated = index >= 0
      ? current.map(m => m.id === enriched.id ? enriched : m)
      : [...current, enriched];
    setLocal(`medical_${this.familyId}`, updated);
    return updated;
  }

  // Save Multiple Medical Records at once
  async saveBatchMedicalRecords(newRecords: MedicalRecord[]) {
    try {
      for (const record of newRecords) {
        const enriched = {
          ...record,
          loggedByUid: record.loggedByUid || auth.currentUser?.uid || '',
        };
        await setDoc(doc(db, 'families', this.familyId, 'medical', record.id), cleanForFirestore(enriched), { merge: true });
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
      await deleteDoc(doc(db, 'families', this.familyId, collectionName, id));
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
