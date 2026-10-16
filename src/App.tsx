import React, { useState, useEffect, useMemo } from 'react';
import {
  Milk,
  Baby,
  Moon,
  Package,
  Stethoscope,
  BarChart3,
  Home,
  Sparkles,
  Clock,
  Droplet,
  Plus,
  AlertTriangle,
  Users,
  ChevronRight,
  TrendingDown,
  ShieldCheck,
  Lightbulb,
  Bell,
  Pill,
  Calendar,
  Cloud,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  FeedingRecord,
  DiaperRecord,
  SleepRecord,
  InventoryItem,
  MedicalRecord,
  FamilyProfile,
  PurchaseProjection,
} from './types';
import {
  DEFAULT_FAMILY_ID,
  INITIAL_FAMILY,
  INITIAL_INVENTORY,
  INITIAL_VACCINES,
  DataService,
  calculateProjections,
  getLocal,
  setLocal,
  generateSeedActivities,
} from './lib/storage';
import { testConnection } from './lib/firebase';
import { Header } from './components/Header';
import { AlertBanner } from './components/AlertBanner';
import { QuickActions } from './components/QuickActions';
import { FeedingTracker } from './components/FeedingTracker';
import { DiaperTracker } from './components/DiaperTracker';
import { SleepTracker } from './components/SleepTracker';
import { InventoryManager } from './components/InventoryManager';
import { MedicalVaccineTracker } from './components/MedicalVaccineTracker';
import { WeeklyCharts } from './components/WeeklyCharts';
import { MonthlyStats } from './components/MonthlyStats';
import { FamilySyncModal } from './components/FamilySyncModal';
import { ReminderModal } from './components/ReminderModal';
import { PediatricRecommendations } from './components/PediatricRecommendations';
import { SparkleGlow, StarSparkle } from './components/SparkleEffect';

type TabType = 'home' | 'feedings' | 'diapers' | 'sleep' | 'inventory' | 'medical' | 'stats' | 'guide';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return getLocal<boolean>('dark_mode', true); // Default elegant dark mode as requested
  });

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<TabType>('home');

  // Caregiver identity ("Mamá" or "Papá")
  const [currentCaregiver, setCurrentCaregiver] = useState<string>(() => {
    return getLocal<string>('current_caregiver', 'Mamá');
  });

  // Family profile
  const [family, setFamily] = useState<FamilyProfile>(() => {
    return getLocal<FamilyProfile>('family_profile', INITIAL_FAMILY);
  });

  // Modal states
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState<boolean>(false);

  // Data states
  const [feedings, setFeedings] = useState<FeedingRecord[]>([]);
  const [diapers, setDiapers] = useState<DiaperRecord[]>([]);
  const [sleeps, setSleeps] = useState<SleepRecord[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [medical, setMedical] = useState<MedicalRecord[]>([]);

  // Active sleep session
  const [activeSleep, setActiveSleep] = useState<{ startTime: string } | null>(() => {
    return getLocal<{ startTime: string } | null>('active_sleep', null);
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Cloud connection state
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);

  // Initialize DataService
  const dataService = useMemo(() => new DataService(family.id), [family.id]);

  // Sync dark mode class
  useEffect(() => {
    setLocal('dark_mode', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Save caregiver preference
  useEffect(() => {
    setLocal('current_caregiver', currentCaregiver);
  }, [currentCaregiver]);

  // Save active sleep state
  useEffect(() => {
    setLocal('active_sleep', activeSleep);
  }, [activeSleep]);

  // Initialize and subscribe to Firestore collections
  useEffect(() => {
    // Check initial seed
    const cachedFeedings = getLocal<FeedingRecord[]>(`feedings_${family.id}`, []);
    const cachedDiapers = getLocal<DiaperRecord[]>(`diapers_${family.id}`, []);
    const cachedSleeps = getLocal<SleepRecord[]>(`sleeps_${family.id}`, []);
    const cachedInventory = getLocal<InventoryItem[]>(`inventory_${family.id}`, INITIAL_INVENTORY);
    const cachedMedical = getLocal<MedicalRecord[]>(`medical_${family.id}`, INITIAL_VACCINES);

    if (cachedFeedings.length === 0) {
      const seeds = generateSeedActivities(family.id);
      setFeedings(seeds.feedings);
      setDiapers(seeds.diapers);
      setSleeps(seeds.sleeps);
      setLocal(`feedings_${family.id}`, seeds.feedings);
      setLocal(`diapers_${family.id}`, seeds.diapers);
      setLocal(`sleeps_${family.id}`, seeds.sleeps);
    } else {
      setFeedings(cachedFeedings);
      setDiapers(cachedDiapers);
      setSleeps(cachedSleeps);
    }

    setInventory(cachedInventory);
    setMedical(cachedMedical);

    // Initial background sync with Firestore to pull latest changes from other devices
    dataService.forceFullSync(family).then((res) => {
      if (res.success && res.syncedCount > 0) {
        setSyncToast(`¡Nube conectada! ${res.syncedCount} cambios sincronizados con todos tus dispositivos.`);
        setTimeout(() => setSyncToast(null), 3500);
      }
    }).catch((err) => {
      console.warn('Initial cloud sync check:', err);
    });

    // Subscribe to real-time streams across all devices
    dataService.subscribeFamily(setFamily);
    dataService.subscribeFeedings(setFeedings);
    dataService.subscribeDiapers(setDiapers);
    dataService.subscribeSleeps(setSleeps);
    dataService.subscribeInventory(setInventory);
    dataService.subscribeMedical(setMedical);

    testConnection().then((ok) => {
      setIsCloudConnected(ok);
    });

    return () => {
      dataService.unsubscribeAll();
    };
  }, [dataService, family.id]);

  // Calculated supply projections
  const projections = useMemo<PurchaseProjection[]>(() => {
    return calculateProjections(inventory, diapers, feedings);
  }, [inventory, diapers, feedings]);

  // Last sleep record
  const lastSleep = useMemo(() => {
    return sleeps.length > 0 ? sleeps[0] : null;
  }, [sleeps]);

  // Handlers
  const handleQuickFeed = async (type: 'formula' | 'breast_bottle', ml: number) => {
    const newRecord: FeedingRecord = {
      id: `feed-${Date.now()}`,
      familyId: family.id,
      type,
      amountMl: ml,
      amountOz: Number((ml / 29.5735).toFixed(1)),
      durationMinutes: 15,
      timestamp: new Date().toISOString(),
      notes: 'Toma rápida de 1 toque',
      loggedBy: currentCaregiver,
      createdAt: new Date().toISOString(),
    };
    const { feedings: updatedFeedings, inventory: updatedInventory } = await dataService.saveFeeding(
      newRecord,
      inventory,
      family.autoDeductEnabled
    );
    setFeedings(updatedFeedings);
    setInventory(updatedInventory);
  };

  const handleQuickDiaper = async (type: 'wet' | 'dirty' | 'mixed', diaperItemId?: string) => {
    const chosenItem = diaperItemId
      ? inventory.find((i) => i.id === diaperItemId)
      : inventory.find((i) => i.category === 'diapers');

    const newRecord: DiaperRecord = {
      id: `diaper-${Date.now()}`,
      familyId: family.id,
      type,
      color: type !== 'wet' ? 'mustard' : undefined,
      consistency: type !== 'wet' ? 'soft' : undefined,
      creamApplied: type !== 'wet',
      diaperSize: chosenItem ? (chosenItem.sizeOrDetail || chosenItem.name) : 'Talla estándar',
      deductedDiaperItemId: chosenItem?.id,
      timestamp: new Date().toISOString(),
      notes: 'Cambio rápido de 1 toque',
      loggedBy: currentCaregiver,
      createdAt: new Date().toISOString(),
    };
    const { diapers: updatedDiapers, inventory: updatedInventory } = await dataService.saveDiaper(
      newRecord,
      inventory,
      family.autoDeductEnabled
    );
    setDiapers(updatedDiapers);
    setInventory(updatedInventory);
  };

  const handleStartSleep = () => {
    setActiveSleep({ startTime: new Date().toISOString() });
  };

  const handleStopSleep = async () => {
    if (!activeSleep) return;
    const start = new Date(activeSleep.startTime).getTime();
    const end = new Date().getTime();
    // Reflect exact duration down to 1 minute accurately
    const durationMinutes = Math.max(1, Math.round((end - start) / (1000 * 60)));

    const isNight = new Date().getHours() >= 20 || new Date().getHours() < 7;

    const newRecord: SleepRecord = {
      id: `sleep-${Date.now()}`,
      familyId: family.id,
      startTime: activeSleep.startTime,
      endTime: new Date().toISOString(),
      durationMinutes,
      sleepType: isNight ? 'night' : 'nap',
      quality: 'calm',
      notes: 'Finalizado con cronómetro en vivo',
      loggedBy: currentCaregiver,
      createdAt: new Date().toISOString(),
    };

    setActiveSleep(null);
    const updated = await dataService.saveSleep(newRecord);
    setSleeps(updated);

    confetti({
      particleCount: 30,
      spread: 50,
      colors: ['#6366f1', '#3b82f6', '#93c5fd'],
    });
  };

  const handleSaveFeeding = async (feeding: FeedingRecord) => {
    const { feedings: updatedFeedings, inventory: updatedInventory } = await dataService.saveFeeding(
      feeding,
      inventory,
      family.autoDeductEnabled
    );
    setFeedings(updatedFeedings);
    setInventory(updatedInventory);
  };

  const handleDeleteFeeding = async (id: string) => {
    const updated = await dataService.deleteRecord('feedings', id);
    setFeedings(updated);
  };

  const handleSaveDiaper = async (diaper: DiaperRecord) => {
    const { diapers: updatedDiapers, inventory: updatedInventory } = await dataService.saveDiaper(
      diaper,
      inventory,
      family.autoDeductEnabled
    );
    setDiapers(updatedDiapers);
    setInventory(updatedInventory);
  };

  const handleDeleteDiaper = async (id: string) => {
    const updated = await dataService.deleteRecord('diapers', id);
    setDiapers(updated);
  };

  const handleSaveSleep = async (sleep: SleepRecord) => {
    const updated = await dataService.saveSleep(sleep);
    setSleeps(updated);
  };

  const handleDeleteSleep = async (id: string) => {
    const updated = await dataService.deleteRecord('sleeps', id);
    setSleeps(updated);
  };

  const handleUpdateInventoryQuantity = async (id: string, qty: number) => {
    const updated = await dataService.updateInventoryQuantity(id, qty);
    setInventory(updated);
  };

  const handleSaveInventoryItem = async (item: InventoryItem) => {
    const updated = await dataService.saveInventoryItem(item);
    setInventory(updated);
  };

  const handleDeleteInventoryItem = async (id: string) => {
    const updated = await dataService.deleteRecord('inventory', id);
    setInventory(updated);
  };

  const handleSaveMedicalRecord = async (record: MedicalRecord) => {
    const updated = await dataService.saveMedicalRecord(record);
    setMedical(updated);
  };

  const handleSaveBatchMedicalRecords = async (records: MedicalRecord[]) => {
    const updated = await dataService.saveBatchMedicalRecords(records);
    setMedical(updated);
  };

  const handleDeleteMedicalRecord = async (id: string) => {
    const updated = await dataService.deleteRecord('medical', id);
    setMedical(updated);
  };

  const handleUpdateFamily = async (updated: FamilyProfile) => {
    const saved = await dataService.saveFamily(updated);
    setFamily(saved);
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      const res = await dataService.forceFullSync(family);
      if (res.success) {
        setSyncToast(res.message || `¡Sincronización exitosa! ${res.syncedCount} cambios actualizados.`);
      } else {
        setSyncToast(res.message || 'Error de sincronización con la nube.');
      }
      setTimeout(() => setSyncToast(null), 4000);
      return res;
    } catch {
      setSyncToast('Error al conectar con la nube.');
      setTimeout(() => setSyncToast(null), 4000);
      return { success: false, syncedCount: 0 };
    } finally {
      setIsSyncing(false);
    }
  };

  // Today's stats calculation
  const today = new Date().toISOString().split('T')[0];
  const todayFeedings = feedings.filter((f) => f.timestamp.startsWith(today));
  const todayFeedingMl = todayFeedings.reduce((sum, f) => sum + (f.amountMl || 0), 0);
  const todayDiapers = diapers.filter((d) => d.timestamp.startsWith(today));
  const todaySleeps = sleeps.filter((s) => s.startTime.startsWith(today) || s.endTime.startsWith(today));
  const todaySleepHours = (todaySleeps.reduce((sum, s) => sum + s.durationMinutes, 0) / 60).toFixed(1);

  // Critical inventory items
  const criticalItems = projections.filter((p) => p.status === 'critical');

  // Pending medical reminders & medications count
  const pendingRemindersCount = useMemo(() => {
    return medical.filter((m) => m.status === 'pending').length;
  }, [medical]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070d1e] text-slate-900 dark:text-slate-100 transition-colors pb-24 md:pb-12">
      {/* App Header */}
      <Header
        family={family}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        activeSleep={activeSleep}
        lastSleep={lastSleep}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        currentCaregiver={currentCaregiver}
        setCurrentCaregiver={setCurrentCaregiver}
        isCloudConnected={isCloudConnected}
        onForceSync={handleForceSync}
        isSyncing={isSyncing}
      />

      {/* Alert Banner for low stock or pediatric appointments */}
      <AlertBanner
        projections={projections}
        upcomingMedical={medical}
        onOpenInventory={() => setActiveTab('inventory')}
        onOpenMedical={() => setActiveTab('medical')}
      />

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 space-y-6">
        {/* Desktop Navigation Segment */}
        <nav className="hidden md:flex items-center justify-between p-1.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-blue-200/60 dark:border-blue-900/40 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-1">
            {[
              { id: 'home', label: 'Inicio', icon: Home },
              { id: 'feedings', label: 'Tomas de Leche', icon: Milk },
              { id: 'diapers', label: 'Pañales', icon: Baby },
              { id: 'sleep', label: 'Sueño', icon: Moon },
              { id: 'inventory', label: 'Inventario & Compras', icon: Package, badge: criticalItems.length },
              { id: 'medical', label: 'Salud & Vacunas', icon: Stethoscope },
              { id: 'guide', label: 'Consejos por Edad', icon: Lightbulb },
              { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  {tab.badge && tab.badge > 0 ? (
                    <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pr-2">
            <button
              type="button"
              onClick={() => setIsReminderModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-xs font-bold transition-all border border-blue-200/80 dark:border-blue-800/80 cursor-pointer"
            >
              <Bell size={14} className="text-blue-500" />
              <span>Recordatorios</span>
              {pendingRemindersCount > 0 && (
                <span className="min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {pendingRemindersCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsSyncModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline px-2"
            >
              <Users size={14} />
              <span>Código: {family.familyCode}</span>
            </button>
          </div>
        </nav>

        {/* Tab: HOME (Dashboard) */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* Quick Actions (1-Tap Buttons) */}
            <QuickActions
              onQuickFeed={handleQuickFeed}
              onQuickDiaper={handleQuickDiaper}
              inventory={inventory}
              activeSleep={activeSleep}
              onStartSleep={handleStartSleep}
              onStopSleep={handleStopSleep}
              onOpenFeedModal={() => setActiveTab('feedings')}
              onOpenDiaperModal={() => setActiveTab('diapers')}
              onOpenSleepModal={() => setActiveTab('sleep')}
            />

            {/* Non-invasive age-adapted pediatric recommendations */}
            <PediatricRecommendations
              babyBirthDate={family.babyBirthDate}
              babyName={family.babyName}
              compact={true}
            />

            {/* Daily KPI Dashboard */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Leche Hoy */}
              <div
                onClick={() => setActiveTab('feedings')}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/60 shadow-sm transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Leche Hoy
                  </span>
                  <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                    <Milk size={18} />
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {todayFeedingMl} ml
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                  {todayFeedings.length} tomas ({(todayFeedingMl / 29.57).toFixed(1)} oz)
                </div>
              </div>

              {/* Pañales Hoy */}
              <div
                onClick={() => setActiveTab('diapers')}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/60 shadow-sm transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Pañales Hoy
                  </span>
                  <span className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform">
                    <Baby size={18} />
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {todayDiapers.length}
                </div>
                <div className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold mt-0.5">
                  {todayDiapers.filter((d) => d.type === 'wet' || d.type === 'mixed').length} pipí | {todayDiapers.filter((d) => d.type === 'dirty' || d.type === 'mixed').length} popó
                </div>
              </div>

              {/* Sueño Hoy */}
              <div
                onClick={() => setActiveTab('sleep')}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/60 shadow-sm transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Sueño Hoy
                  </span>
                  <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                    <Moon size={18} />
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {todaySleepHours} h
                </div>
                <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                  {activeSleep ? 'Durmiendo ahora' : `${todaySleeps.length} siestas/noches`}
                </div>
              </div>

              {/* Stock Pañales */}
              <div
                onClick={() => setActiveTab('inventory')}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/60 shadow-sm transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Stock Pañales
                  </span>
                  <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                    <Package size={18} />
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {inventory.find((i) => i.category === 'diapers')?.currentQuantity ?? 34}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-between">
                  <span>Rinde ~5 días</span>
                  <span className="text-blue-500 group-hover:translate-x-1 transition-transform">
                    <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            </section>

            {/* Quick Overview: Recent Activity Feed */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-blue-500" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Línea de Tiempo Reciente de Evan
                  </h3>
                </div>
                <span className="text-xs text-slate-400">Sincronizado al segundo</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-80 overflow-y-auto">
                {/* Combined latest events */}
                {feedings.slice(0, 5).map((f) => (
                  <div key={f.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <div className="flex items-center gap-3">
                      <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                        {f.type === 'breast_direct' ? '🤱' : '🥛'}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {f.type === 'breast_direct' ? (
                            <span>
                              Pecho Directo: {f.durationMinutes || 0} min{' '}
                              {(f.breastLeftMinutes !== undefined || f.breastRightMinutes !== undefined) && (
                                <span className="font-normal text-slate-400">
                                  (Izq: {f.breastLeftMinutes || 0}m • Der: {f.breastRightMinutes || 0}m)
                                </span>
                              )}
                            </span>
                          ) : (
                            <span>
                              Toma {f.type === 'formula' ? 'Fórmula' : 'Biberón Materno'}: {f.amountMl} ml ({f.amountOz} oz)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(f.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} • Registrado por {f.loggedBy}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-blue-500 font-semibold">Toma</span>
                  </div>
                ))}

                {diapers.slice(0, 3).map((d) => (
                  <div key={d.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <div className="flex items-center gap-3">
                      <span className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400">
                        {d.type === 'wet' ? '💧' : d.type === 'dirty' ? '💩' : '💧💩'}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          Pañal {d.type === 'wet' ? 'Mojado (Pipí)' : d.type === 'dirty' ? 'Sucio (Popó)' : 'Mixto'}{' '}
                          {d.diaperSize && (
                            <span className="text-[11px] font-normal text-cyan-500">
                              [{d.diaperSize}]
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(d.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} • Registrado por {d.loggedBy}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-cyan-500 font-semibold">Pañal</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reminders & Medications Card on Home */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200/80 dark:border-blue-900/60 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                    <Bell size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>Próximos Recordatorios y Medicamentos</span>
                      <SparkleGlow size={12} />
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Citas con pediatra, vacunas y tomas de vitaminas de {family.babyName}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsReminderModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-600/30 transition-all cursor-pointer self-start sm:self-auto"
                >
                  <Plus size={14} />
                  <span>+ Agregar Recordatorio</span>
                </button>
              </div>

              {/* Quick list of top pending reminders */}
              {medical.filter((m) => m.status === 'pending').length === 0 ? (
                <div className="p-3 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 text-slate-400 text-xs">
                  No hay recordatorios pendientes. Haz clic en "+ Agregar Recordatorio" para programar citas o medicamentos.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                  {medical
                    .filter((m) => m.status === 'pending')
                    .slice(0, 3)
                    .map((rem) => {
                      const isMed = rem.type === 'medication';
                      const isAppt = rem.type === 'appointment';
                      return (
                        <div
                          key={rem.id}
                          onClick={() => setIsReminderModalOpen(true)}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer flex items-start gap-2.5"
                        >
                          <span
                            className={`p-1.5 rounded-lg text-white text-xs shrink-0 ${
                              isMed
                                ? 'bg-emerald-600'
                                : isAppt
                                ? 'bg-blue-600'
                                : 'bg-purple-600'
                            }`}
                          >
                            {isMed ? <Pill size={14} /> : isAppt ? <Calendar size={14} /> : <Stethoscope size={14} />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {rem.title}
                            </div>
                            {rem.dosage && (
                              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate">
                                {rem.dosage} {rem.frequency ? `• ${rem.frequency}` : ''}
                              </div>
                            )}
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              📅 {rem.date} {rem.time ? `• ⏰ ${rem.time}` : ''}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Quick link to weekly charts teaser */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-slate-900 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
                  <BarChart3 size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                    <span>Gráficos y Tendencias Semanales</span>
                    <Sparkles size={14} className="text-blue-400" />
                  </h4>
                  <p className="text-xs text-slate-300">
                    Consulta la curva de progreso de tomas, pañales y horas de sueño de Evan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('stats')}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/40 transition-all cursor-pointer text-center"
              >
                Ver Gráficos y Estadísticas →
              </button>
            </div>
          </div>
        )}

        {/* Tab: FEEDINGS */}
        {activeTab === 'feedings' && (
          <FeedingTracker
            feedings={feedings}
            inventory={inventory}
            onSaveFeeding={handleSaveFeeding}
            onDeleteFeeding={handleDeleteFeeding}
            currentCaregiver={currentCaregiver}
          />
        )}

        {/* Tab: DIAPERS */}
        {activeTab === 'diapers' && (
          <DiaperTracker
            diapers={diapers}
            inventory={inventory}
            onSaveDiaper={handleSaveDiaper}
            onDeleteDiaper={handleDeleteDiaper}
            currentCaregiver={currentCaregiver}
          />
        )}

        {/* Tab: SLEEP */}
        {activeTab === 'sleep' && (
          <SleepTracker
            sleeps={sleeps}
            activeSleep={activeSleep}
            onStartSleep={handleStartSleep}
            onStopSleep={handleStopSleep}
            onSaveSleep={handleSaveSleep}
            onDeleteSleep={handleDeleteSleep}
            currentCaregiver={currentCaregiver}
            babyBirthDate={family.babyBirthDate}
            babyName={family.babyName}
          />
        )}

        {/* Tab: INVENTORY & PROJECTIONS */}
        {activeTab === 'inventory' && (
          <InventoryManager
            inventory={inventory}
            projections={projections}
            onUpdateQuantity={handleUpdateInventoryQuantity}
            onSaveItem={handleSaveInventoryItem}
            onDeleteItem={handleDeleteInventoryItem}
            autoDeductEnabled={family.autoDeductEnabled}
            onToggleAutoDeduct={(val) => handleUpdateFamily({ ...family, autoDeductEnabled: val })}
          />
        )}

        {/* Tab: MEDICAL & VACCINES (SALUD) */}
        {activeTab === 'medical' && (
          <MedicalVaccineTracker
            records={medical}
            onSaveRecord={handleSaveMedicalRecord}
            onSaveBatchRecords={handleSaveBatchMedicalRecords}
            onDeleteRecord={handleDeleteMedicalRecord}
            familyId={family.id}
            babyBirthDate={family.babyBirthDate}
            babyName={family.babyName}
            onOpenReminderModal={() => setIsReminderModalOpen(true)}
          />
        )}

        {/* Tab: STATS (Weekly Charts + Monthly Dashboard) */}
        {activeTab === 'stats' && (
          <div className="space-y-8">
            <WeeklyCharts feedings={feedings} diapers={diapers} sleeps={sleeps} />
            <MonthlyStats
              feedings={feedings}
              diapers={diapers}
              sleeps={sleeps}
              inventory={inventory}
              babyBirthDate={family.babyBirthDate}
              babyName={family.babyName}
            />
          </div>
        )}

        {/* Tab: GUIDE (Pediatric Recommendations) */}
        {activeTab === 'guide' && (
          <div className="space-y-6">
            <PediatricRecommendations
              babyBirthDate={family.babyBirthDate}
              babyName={family.babyName}
              compact={false}
            />
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/90 dark:bg-slate-950/90 backdrop-blur-lg border-t border-blue-200/50 dark:border-blue-900/40 px-1 py-1 shadow-lg">
        <div className="grid grid-cols-8 gap-0.5">
          {[
            { id: 'home', label: 'Inicio', icon: Home },
            { id: 'feedings', label: 'Tomas', icon: Milk },
            { id: 'diapers', label: 'Pañales', icon: Baby },
            { id: 'sleep', label: 'Sueño', icon: Moon },
            { id: 'medical', label: 'Salud', icon: Stethoscope },
            { id: 'inventory', label: 'Stock', icon: Package, badge: criticalItems.length },
            { id: 'reminders', label: 'Avisos', icon: Bell, badge: pendingRemindersCount, isAction: true },
            { id: 'stats', label: 'Stats', icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = !tab.isAction && activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (tab.isAction) {
                    setIsReminderModalOpen(true);
                  } else {
                    setActiveTab(tab.id as TabType);
                  }
                }}
                className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer relative ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="relative">
                  <Icon size={17} className={isActive ? 'scale-110 transition-transform' : ''} />
                  {tab.badge && tab.badge > 0 ? (
                    <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold">
                      {tab.badge}
                    </span>
                  ) : null}
                </div>
                <span className="text-[8.5px] mt-0.5 truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Reminder & Medication Modal */}
      <ReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        records={medical}
        onSaveRecord={handleSaveMedicalRecord}
        onSaveBatchRecords={handleSaveBatchMedicalRecords}
        onDeleteRecord={handleDeleteMedicalRecord}
        babyName={family.babyName}
        familyId={family.id}
      />

      {/* Family Sync & Settings Modal */}
      <FamilySyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        family={family}
        onUpdateFamily={handleUpdateFamily}
        currentCaregiver={currentCaregiver}
        setCurrentCaregiver={setCurrentCaregiver}
        isCloudConnected={isCloudConnected}
        onSyncNow={handleForceSync}
      />

      {/* Floating Sync Toast Notification */}
      {syncToast && (
        <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 p-3.5 rounded-2xl bg-emerald-600 text-white font-semibold text-xs shadow-2xl shadow-emerald-950/40 flex items-center gap-2 border border-emerald-400 animate-bounce">
          <CheckCircle2 size={16} />
          <span>{syncToast}</span>
        </div>
      )}
    </div>
  );
}
