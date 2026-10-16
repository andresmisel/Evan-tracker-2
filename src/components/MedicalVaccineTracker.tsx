import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Syringe,
  Stethoscope,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  Trash2,
  AlertCircle,
  TrendingUp,
  Scale,
  Ruler,
  Pill,
  Lightbulb,
  Heart,
  ChevronRight,
  ShieldCheck,
  Activity,
  Smile,
  X,
  Search,
  Filter,
  Check,
} from 'lucide-react';
import { MedicalRecord, MedicalType } from '../types';
import { SparkleGlow } from './SparkleEffect';
import { PediatricRecommendations, getAgeStage } from './PediatricRecommendations';

interface MedicalVaccineTrackerProps {
  records: MedicalRecord[];
  onSaveRecord: (record: MedicalRecord) => void;
  onSaveBatchRecords?: (records: MedicalRecord[]) => void;
  onDeleteRecord: (id: string) => void;
  familyId?: string;
  babyBirthDate?: string;
  babyName?: string;
  onOpenReminderModal?: () => void;
}

export const MedicalVaccineTracker: React.FC<MedicalVaccineTrackerProps> = ({
  records,
  onSaveRecord,
  onDeleteRecord,
  familyId,
  babyBirthDate = '2026-06-16',
  babyName = 'Evan',
  onOpenReminderModal,
}) => {
  const [activeTab, setActiveTab] = useState<'vaccines' | 'growth' | 'recommendations' | 'medications' | 'appointments'>('vaccines');

  // Modals state
  const [showAddVaccineModal, setShowAddVaccineModal] = useState(false);
  const [showAddGrowthModal, setShowAddGrowthModal] = useState(false);
  const [showAddApptModal, setShowAddApptModal] = useState(false);

  // Vaccine Form state
  const [vacTitle, setVacTitle] = useState('');
  const [vacDose, setVacDose] = useState('1ª Dosis');
  const [vacTargetAge, setVacTargetAge] = useState('4 meses');
  const [vacDate, setVacDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [vacDoctor, setVacDoctor] = useState('Dra. Valentina Morales');
  const [vacNotes, setVacNotes] = useState('');
  const [vacStatus, setVacStatus] = useState<'completed' | 'pending'>('pending');

  // Growth Form state
  const [growthDate, setGrowthDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [growthWeight, setGrowthWeight] = useState<string>('6.55');
  const [growthHeight, setGrowthHeight] = useState<string>('64.0');
  const [growthHead, setGrowthHead] = useState<string>('41.8');
  const [growthDoctor, setGrowthDoctor] = useState('Control Pediátrico');
  const [growthNotes, setGrowthNotes] = useState('');

  // Appointment Form state
  const [apptTitle, setApptTitle] = useState('');
  const [apptDate, setApptDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [apptTime, setApptTime] = useState('11:00');
  const [apptDoctor, setApptDoctor] = useState('Dra. Valentina Morales');
  const [apptNotes, setApptNotes] = useState('');

  // Data subsets
  const vaccines = useMemo(() => records.filter((r) => r.type === 'vaccine'), [records]);
  const appointments = useMemo(() => records.filter((r) => r.type === 'appointment'), [records]);
  const medications = useMemo(() => records.filter((r) => r.type === 'medication'), [records]);

  // Vaccine mobile filters and search
  const [vaccineFilter, setVaccineFilter] = useState<'all' | 'pending' | 'completed' | 'current' | 'birth' | '2m'>('all');
  const [vaccineSearch, setVaccineSearch] = useState('');

  const completedVaccinesCount = vaccines.filter((v) => v.status === 'completed').length;
  const pendingVaccinesCount = vaccines.filter((v) => v.status === 'pending').length;

  // Filtered vaccines list
  const filteredVaccines = useMemo(() => {
    return vaccines.filter((v) => {
      if (vaccineFilter === 'pending' && v.status !== 'pending') return false;
      if (vaccineFilter === 'completed' && v.status !== 'completed') return false;
      if (vaccineFilter === 'current' && !v.targetAge?.toLowerCase().includes('4')) return false;
      if (vaccineFilter === '2m' && !v.targetAge?.toLowerCase().includes('2')) return false;
      if (vaccineFilter === 'birth' && !v.targetAge?.toLowerCase().includes('nacer')) return false;

      if (vaccineSearch.trim()) {
        const query = vaccineSearch.toLowerCase().trim();
        const matchesTitle = v.title.toLowerCase().includes(query);
        const matchesAge = v.targetAge?.toLowerCase().includes(query) ?? false;
        const matchesDoctor = v.providerOrDoctor?.toLowerCase().includes(query) ?? false;
        const matchesDose = v.doseNumber?.toLowerCase().includes(query) ?? false;
        return matchesTitle || matchesAge || matchesDoctor || matchesDose;
      }
      return true;
    });
  }, [vaccines, vaccineFilter, vaccineSearch]);

  // Growth measurements: type === 'growth' or records with weightKg/heightCm
  const growthRecords = useMemo(() => {
    return records
      .filter((r) => r.type === 'growth' || (r.weightKg !== undefined && r.weightKg > 0))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [records]);

  // Latest measurements
  const latestGrowth = growthRecords.length > 0 ? growthRecords[growthRecords.length - 1] : null;
  const previousGrowth = growthRecords.length > 1 ? growthRecords[growthRecords.length - 2] : null;

  // Weight difference
  const weightGainGrams = latestGrowth && previousGrowth && latestGrowth.weightKg && previousGrowth.weightKg
    ? Math.round((latestGrowth.weightKg - previousGrowth.weightKg) * 1000)
    : null;

  const heightGainCm = latestGrowth && previousGrowth && latestGrowth.heightCm && previousGrowth.heightCm
    ? Number((latestGrowth.heightCm - previousGrowth.heightCm).toFixed(1))
    : null;

  // Age info
  const ageInfo = useMemo(() => getAgeStage(babyBirthDate), [babyBirthDate]);

  // Handlers
  const handleToggleVaccine = (vaccine: MedicalRecord) => {
    const updated: MedicalRecord = {
      ...vaccine,
      status: vaccine.status === 'completed' ? 'pending' : 'completed',
    };
    onSaveRecord(updated);
  };

  const handleSaveVaccine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vacTitle.trim()) return;

    const newRecord: MedicalRecord = {
      id: `vac-${Date.now()}`,
      familyId: familyId || 'evan-family-main',
      type: 'vaccine',
      title: vacTitle.trim(),
      doseNumber: vacDose,
      targetAge: vacTargetAge,
      date: vacDate,
      providerOrDoctor: vacDoctor.trim() || undefined,
      status: vacStatus,
      notes: vacNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onSaveRecord(newRecord);
    setShowAddVaccineModal(false);
    setVacTitle('');
    setVacNotes('');
  };

  const handleSaveGrowth = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(growthWeight);
    const h = parseFloat(growthHeight);
    const head = growthHead ? parseFloat(growthHead) : undefined;
    if (isNaN(w) && isNaN(h)) return;

    const newRecord: MedicalRecord = {
      id: `growth-${Date.now()}`,
      familyId: familyId || 'evan-family-main',
      type: 'growth',
      title: `Control Somatometría (${ageInfo.months} meses)`,
      date: growthDate,
      weightKg: !isNaN(w) ? w : undefined,
      heightCm: !isNaN(h) ? h : undefined,
      headCircumferenceCm: head && !isNaN(head) ? head : undefined,
      providerOrDoctor: growthDoctor.trim() || undefined,
      status: 'completed',
      targetAge: `${ageInfo.months} meses`,
      notes: growthNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onSaveRecord(newRecord);
    setShowAddGrowthModal(false);
    setGrowthNotes('');
  };

  const handleSaveAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apptTitle.trim()) return;

    const newRecord: MedicalRecord = {
      id: `appt-${Date.now()}`,
      familyId: familyId || 'evan-family-main',
      type: 'appointment',
      title: apptTitle.trim(),
      date: apptDate,
      time: apptTime || undefined,
      providerOrDoctor: apptDoctor.trim() || undefined,
      status: 'pending',
      notes: apptNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onSaveRecord(newRecord);
    setShowAddApptModal(false);
    setApptTitle('');
    setApptNotes('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Section Header */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-blue-200/70 dark:border-blue-900/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white shadow-md shadow-blue-600/30">
            <Stethoscope size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                Centro de Salud Integral de {babyName}
              </h2>
              <SparkleGlow size={14} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Vacunas, somatometría (peso y talla) y recomendaciones adaptadas a sus {ageInfo.months} meses
            </p>
          </div>
        </div>

        {/* Action button to open medication/reminders scheduler */}
        {onOpenReminderModal && (
          <button
            type="button"
            onClick={onOpenReminderModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs font-bold transition-all cursor-pointer self-start md:self-auto"
          >
            <Clock size={15} />
            <span>+ Programar Tomas / Citas</span>
          </button>
        )}
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Latest Weight */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Scale size={20} />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-semibold">Peso Actual</div>
            <div className="text-base font-extrabold text-slate-900 dark:text-white">
              {latestGrowth?.weightKg ? `${latestGrowth.weightKg.toFixed(2)} kg` : '6.45 kg'}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
              <TrendingUp size={11} />
              <span>{weightGainGrams ? `+${weightGainGrams}g ganados` : 'Percentil 50 saludable'}</span>
            </div>
          </div>
        </div>

        {/* Latest Height */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Ruler size={20} />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-semibold">Talla / Longitud</div>
            <div className="text-base font-extrabold text-slate-900 dark:text-white">
              {latestGrowth?.heightCm ? `${latestGrowth.heightCm} cm` : '63.5 cm'}
            </div>
            <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
              {heightGainCm ? `+${heightGainCm} cm vs previo` : 'Curva OMS armónica'}
            </div>
          </div>
        </div>

        {/* Vaccines Status */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
            <Syringe size={20} />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-semibold">Esquema Vacunal</div>
            <div className="text-base font-extrabold text-slate-900 dark:text-white">
              {completedVaccinesCount} de {vaccines.length}
            </div>
            <div className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
              {pendingVaccinesCount} pendientes de aplicar
            </div>
          </div>
        </div>

        {/* Age Stage */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <Smile size={20} />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-semibold">Etapa de {babyName}</div>
            <div className="text-base font-extrabold text-slate-900 dark:text-white">
              {ageInfo.months} meses y {ageInfo.days} días
            </div>
            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
              Ventana: {ageInfo.stage.wakeWindow}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs for Health */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'vaccines', label: `Plan de Vacunas (${completedVaccinesCount}/${vaccines.length})`, icon: Syringe },
          { id: 'growth', label: `Peso y Talla (${growthRecords.length})`, icon: Scale },
          { id: 'recommendations', label: `Recomendaciones por Edad`, icon: Lightbulb },
          { id: 'medications', label: `Medicamentos (${medications.length})`, icon: Pill },
          { id: 'appointments', label: `Citas Médicas (${appointments.length})`, icon: Calendar },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PLAN DE VACUNAS */}
      {activeTab === 'vaccines' && (
        <div className="space-y-4 animate-fade-in">
          {/* Header & Add Button */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span>Calendario de Inmunización Pediátrica</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold">
                  {completedVaccinesCount} de {vaccines.length} aplicadas
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Esquema de vacunas de {babyName}. Toca cualquier vacuna para marcarla como puesta o pendiente.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddVaccineModal(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 cursor-pointer w-full sm:w-auto transition-transform active:scale-95"
            >
              <Plus size={16} />
              <span>+ Agregar Vacuna al Plan</span>
            </button>
          </div>

          {/* Progress bar card */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-emerald-500" />
                <span>Inmunización de {babyName}:</span>
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-extrabold">
                {vaccines.length > 0 ? Math.round((completedVaccinesCount / vaccines.length) * 100) : 0}% completado
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-500"
                style={{
                  width: `${vaccines.length > 0 ? (completedVaccinesCount / vaccines.length) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 pt-0.5">
              <span>{completedVaccinesCount} dosis administradas</span>
              <span>{pendingVaccinesCount} dosis pendientes</span>
            </div>
          </div>

          {/* Mobile Filter Chips & Search Bar */}
          <div className="space-y-2">
            {/* Filter Chips - horizontally scrollable on mobile */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              {[
                { id: 'all', label: `Todas (${vaccines.length})` },
                { id: 'pending', label: `Pendientes (${pendingVaccinesCount})` },
                { id: 'completed', label: `Aplicadas (${completedVaccinesCount})` },
                { id: 'current', label: `🌟 4 meses (Actual)` },
                { id: '2m', label: `2 meses` },
                { id: 'birth', label: `Al nacer` },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setVaccineFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer border ${
                    vaccineFilter === f.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/30'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 hover:border-blue-400'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Quick search input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar vacuna por nombre, dosis o centro médico..."
                value={vaccineSearch}
                onChange={(e) => setVaccineSearch(e.target.value)}
                className="w-full pl-8.5 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
              />
              {vaccineSearch && (
                <button
                  type="button"
                  onClick={() => setVaccineSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-0.5"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Vaccine items list: ultra responsive mobile card / desktop row */}
          {filteredVaccines.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <Syringe size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No se encontraron vacunas con el filtro seleccionado.
              </p>
              <button
                type="button"
                onClick={() => {
                  setVaccineFilter('all');
                  setVaccineSearch('');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-xs border border-blue-200 dark:border-blue-800 hover:underline cursor-pointer"
              >
                Restablecer filtros
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 sm:space-y-3">
              {filteredVaccines.map((v) => {
                const isDone = v.status === 'completed';
                return (
                  <div
                    key={v.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                      isDone
                        ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-200/60 dark:border-emerald-900/40 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-700 shadow-xs'
                    }`}
                  >
                    {/* Top Row: Check Circle + Title + Badges + Desktop Actions */}
                    <div className="flex items-start justify-between gap-2.5 sm:gap-3">
                      {/* Left: Button + Details */}
                      <div className="flex items-start gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => handleToggleVaccine(v)}
                          className={`w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer mt-0.5 active:scale-90 ${
                            isDone
                              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 ring-2 ring-emerald-300 dark:ring-emerald-700'
                              : 'border-2 border-slate-300 dark:border-slate-600 hover:border-blue-500 text-transparent hover:text-slate-400 bg-slate-50 dark:bg-slate-800'
                          }`}
                          title={isDone ? 'Marcar como pendiente' : 'Marcar como aplicada'}
                          aria-label={isDone ? `Marcar ${v.title} como pendiente` : `Marcar ${v.title} como aplicada`}
                        >
                          <CheckCircle2 size={18} className={isDone ? 'text-white' : 'text-slate-400'} />
                        </button>

                        <div className="min-w-0 flex-1">
                          {/* Title & Badges */}
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <span
                              className={`font-bold text-xs sm:text-sm leading-snug break-words ${
                                isDone
                                  ? 'line-through text-slate-400 dark:text-slate-500'
                                  : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {v.title}
                            </span>
                            {v.doseNumber && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold whitespace-nowrap">
                                {v.doseNumber}
                              </span>
                            )}
                            {v.targetAge && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-semibold whitespace-nowrap">
                                {v.targetAge}
                              </span>
                            )}
                          </div>

                          {/* Date and Doctor / Clinic */}
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1 whitespace-nowrap">
                              <Calendar size={12} className="text-blue-500 shrink-0" />
                              <span>
                                {new Date(v.date).toLocaleDateString('es-ES', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            </span>

                            {v.providerOrDoctor && (
                              <span className="inline-flex items-center gap-1 truncate max-w-[180px] sm:max-w-xs">
                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                <span className="truncate">{v.providerOrDoctor}</span>
                              </span>
                            )}
                          </div>

                          {/* Notes */}
                          {v.notes && (
                            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 italic mt-1.5 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed">
                              {v.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right actions */}
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        {/* Desktop status pill */}
                        <button
                          type="button"
                          onClick={() => handleToggleVaccine(v)}
                          className={`hidden sm:inline-flex text-[11px] font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer border ${
                            isDone
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 hover:bg-amber-500/20'
                          }`}
                        >
                          {isDone ? '✓ Aplicada' : '⏳ Pendiente'}
                        </button>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => onDeleteRecord(v.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar vacuna"
                          aria-label="Eliminar vacuna"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Mobile interactive status button: full-width at the bottom */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 sm:hidden">
                      <button
                        type="button"
                        onClick={() => handleToggleVaccine(v)}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border active:scale-98 ${
                          isDone
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                        }`}
                      >
                        <CheckCircle2 size={14} className={isDone ? 'text-emerald-500' : 'text-amber-500'} />
                        <span>{isDone ? 'Vacuna Aplicada ✓ (Toca para cambiar)' : 'Pendiente • Toca para marcar aplicada'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PESO Y TALLA (CRECIMIENTO & SOMATOMETRÍA) */}
      {activeTab === 'growth' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span>Historial de Somatometría (Peso, Talla y Perímetro Cefálico)</span>
                <SparkleGlow size={13} />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monitorea la curva de desarrollo y ganancia ponderal de {babyName} respecto a los estándares de la OMS
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddGrowthModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 cursor-pointer self-start sm:self-auto"
            >
              <Plus size={15} />
              <span>+ Registrar Peso y Talla</span>
            </button>
          </div>

          {/* Pediatric Reference Card for 4 Months */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-slate-900 border border-blue-500/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
              <ShieldCheck size={16} className="text-blue-400" />
              <span>Referencia OMS para {babyName} ({ageInfo.months} meses de vida):</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>Nota pediátrica:</strong> A los 4 meses, un bebé promedio pesa entre <strong>6.2 kg y 7.8 kg</strong> (mediana ~7.0 kg) y mide entre <strong>61.5 cm y 66.0 cm</strong>.
              Una ganancia promedio entre <strong>600g y 900g mensuales</strong> asegura una curva de peso óptima y saludable.
            </p>
          </div>

          {/* Growth Records Timeline */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <span>Mediciones Registradas</span>
              <span>{growthRecords.length} Controles</span>
            </div>

            {growthRecords.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No hay controles registrados. ¡Usa "+ Registrar Peso y Talla" para empezar la curva!
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {growthRecords.map((g, idx) => {
                  const prev = idx > 0 ? growthRecords[idx - 1] : null;
                  const diffWeight = prev && g.weightKg && prev.weightKg
                    ? Math.round((g.weightKg - prev.weightKg) * 1000)
                    : null;
                  const diffHeight = prev && g.heightCm && prev.heightCm
                    ? Number((g.heightCm - prev.heightCm).toFixed(1))
                    : null;

                  return (
                    <div
                      key={g.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                          <Activity size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                              {g.title}
                            </span>
                            {g.targetAge && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                                {g.targetAge}
                              </span>
                            )}
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                              📅 {new Date(g.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          </div>

                          {/* Metrics Badges */}
                          <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                            {g.weightKg && (
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1">
                                <Scale size={13} />
                                <span>{g.weightKg.toFixed(2)} kg</span>
                                {diffWeight !== null && (
                                  <span className="text-[10px] font-normal text-emerald-600">
                                    ({diffWeight >= 0 ? `+${diffWeight}g` : `${diffWeight}g`})
                                  </span>
                                )}
                              </span>
                            )}

                            {g.heightCm && (
                              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1">
                                <Ruler size={13} />
                                <span>{g.heightCm} cm</span>
                                {diffHeight !== null && (
                                  <span className="text-[10px] font-normal text-indigo-600">
                                    ({diffHeight >= 0 ? `+${diffHeight} cm` : `${diffHeight} cm`})
                                  </span>
                                )}
                              </span>
                            )}

                            {g.headCircumferenceCm && (
                              <span className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/80 text-purple-700 dark:text-purple-300 text-xs font-bold">
                                Cefálico: {g.headCircumferenceCm} cm
                              </span>
                            )}
                          </div>

                          {g.notes && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-1.5">
                              {g.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => onDeleteRecord(g.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                          title="Eliminar registro"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: RECOMENDACIONES ADAPTADAS A LA EDAD */}
      {activeTab === 'recommendations' && (
        <div className="space-y-4 animate-fade-in">
          <PediatricRecommendations
            babyBirthDate={babyBirthDate}
            babyName={babyName}
            compact={false}
          />
        </div>
      )}

      {/* TAB 4: MEDICAMENTOS Y TRATAMIENTOS ACTIVOS */}
      {activeTab === 'medications' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span>Tratamientos, Vitaminas y Medicamentos</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                  {medications.length} registrados
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dosis programadas por horas y días para {babyName}
              </p>
            </div>

            {onOpenReminderModal && (
              <button
                type="button"
                onClick={onOpenReminderModal}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 cursor-pointer self-start sm:self-auto"
              >
                <Plus size={15} />
                <span>+ Programar Tratamiento por Horas y Días</span>
              </button>
            )}
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-slate-800/70">
            {medications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No hay medicamentos registrados. ¡Usa el botón para programar tomas por horas y días!
              </div>
            ) : (
              medications.map((m) => {
                const isDone = m.status === 'completed';
                return (
                  <div
                    key={m.id}
                    className={`p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                      isDone ? 'bg-emerald-50/20 dark:bg-emerald-950/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <Pill size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-xs sm:text-sm ${isDone ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                            {m.title}
                          </span>
                          {m.dosage && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                              {m.dosage}
                            </span>
                          )}
                          {m.frequency && (
                            <span className="text-[11px] text-slate-400 font-medium">
                              • {m.frequency}
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-1">
                          <span>📅 {new Date(m.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                          {m.time && <span>⏰ {m.time}</span>}
                          {m.notes && <span>• <span className="italic">{m.notes}</span></span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onSaveRecord({
                            ...m,
                            status: isDone ? 'pending' : 'completed',
                          });
                        }}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                          isDone
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-emerald-100'
                        }`}
                      >
                        {isDone ? 'Tomada ✓' : 'Pendiente'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteRecord(m.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 5: CITAS MÉDICAS */}
      {activeTab === 'appointments' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span>Citas Pediátricas y Especialistas</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
                  {appointments.length} agendadas
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Controles de niño sano, revisiones de vista, audición y vacunas
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddApptModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 cursor-pointer self-start sm:self-auto"
            >
              <Plus size={15} />
              <span>+ Agendar Nueva Cita</span>
            </button>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-slate-800/70">
            {appointments.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No hay citas agendadas. ¡Usa "+ Agendar Nueva Cita" para programar el próximo control!
              </div>
            ) : (
              appointments.map((a) => (
                <div
                  key={a.id}
                  className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                          {a.title}
                        </span>
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                          {new Date(a.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'long' })}
                          {a.time ? ` a las ${a.time}` : ''}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-1 flex-wrap">
                        {a.providerOrDoctor && <span>{a.providerOrDoctor}</span>}
                        {a.notes && (
                          <>
                            <span>•</span>
                            <span className="italic">{a.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteRecord(a.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: AGREGAR VACUNA AL PLAN */}
      {showAddVaccineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleSaveVaccine}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-blue-500/40 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Syringe size={18} className="text-blue-600" />
                <span>Agregar Vacuna al Plan de {babyName}</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAddVaccineModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombre de la Vacuna
              </label>
              <input
                type="text"
                required
                placeholder="ej. Meningococo B, Varicela, Hexavalente..."
                value={vacTitle}
                onChange={(e) => setVacTitle(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Número de Dosis
                </label>
                <select
                  value={vacDose}
                  onChange={(e) => setVacDose(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="1ª Dosis">1ª Dosis</option>
                  <option value="2ª Dosis">2ª Dosis</option>
                  <option value="3ª Dosis">3ª Dosis</option>
                  <option value="Refuerzo">Refuerzo</option>
                  <option value="Dosis única">Dosis única</option>
                  <option value="Anual">Anual</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Edad Recomendada
                </label>
                <input
                  type="text"
                  placeholder="ej. 4 meses, 6 meses, 1 año"
                  value={vacTargetAge}
                  onChange={(e) => setVacTargetAge(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Fecha (Prevista o Aplicada)
                </label>
                <input
                  type="date"
                  required
                  value={vacDate}
                  onChange={(e) => setVacDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Estado Inicial
                </label>
                <select
                  value={vacStatus}
                  onChange={(e) => setVacStatus(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="pending">Pendiente de aplicar</option>
                  <option value="completed">Ya aplicada ✓</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Centro Pediátrico / Doctor / Lote
              </label>
              <input
                type="text"
                placeholder="ej. Dra. Valentina Morales, Centro Pediátrico Central"
                value={vacDoctor}
                onChange={(e) => setVacDoctor(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Notas y Reacciones
              </label>
              <input
                type="text"
                placeholder="ej. Posible febrícula 24h, administrar paracetamol si es necesario"
                value={vacNotes}
                onChange={(e) => setVacNotes(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddVaccineModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 cursor-pointer"
              >
                Guardar Vacuna en el Plan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: REGISTRAR PESO Y TALLA */}
      {showAddGrowthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleSaveGrowth}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-emerald-500/40 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Scale size={18} className="text-emerald-600" />
                <span>Registrar Somatometría de {babyName}</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAddGrowthModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fecha del Control
              </label>
              <input
                type="date"
                required
                value={growthDate}
                onChange={(e) => setGrowthDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Peso (kg) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max="30"
                  required
                  placeholder="ej. 6.55"
                  value={growthWeight}
                  onChange={(e) => setGrowthWeight(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Talla / Longitud (cm) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="130"
                  required
                  placeholder="ej. 64.0"
                  value={growthHeight}
                  onChange={(e) => setGrowthHeight(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Perímetro Cefálico (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="ej. 41.8"
                  value={growthHead}
                  onChange={(e) => setGrowthHead(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Doctor / Consulta
                </label>
                <input
                  type="text"
                  placeholder="ej. Control Pediátrico 4to mes"
                  value={growthDoctor}
                  onChange={(e) => setGrowthDoctor(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Comentarios Pediátricos
              </label>
              <textarea
                rows={2}
                placeholder="ej. Ganancia de peso en percentil 50. Desarrollo psicomotor armónico."
                value={growthNotes}
                onChange={(e) => setGrowthNotes(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddGrowthModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 cursor-pointer"
              >
                Guardar Somatometría
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: AGENDAR CITA MÉDICA */}
      {showAddApptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleSaveAppointment}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-blue-500/40 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar size={18} className="text-blue-600" />
                <span>Agendar Cita Pediátrica</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAddApptModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Motivo / Especialidad
              </label>
              <input
                type="text"
                required
                placeholder="ej. Control 5to Mes, Consulta Oftalmología, Dentista..."
                value={apptTitle}
                onChange={(e) => setApptTitle(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  required
                  value={apptDate}
                  onChange={(e) => setApptDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hora
                </label>
                <input
                  type="time"
                  required
                  value={apptTime}
                  onChange={(e) => setApptTime(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Médico / Especialista / Clínica
              </label>
              <input
                type="text"
                placeholder="ej. Dra. Valentina Morales, Centro Pediátrico Central"
                value={apptDoctor}
                onChange={(e) => setApptDoctor(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Dudas para consultar al médico
              </label>
              <textarea
                rows={2}
                placeholder="ej. Consultar sobre alimentación complementaria, alergias alimentarias..."
                value={apptNotes}
                onChange={(e) => setApptNotes(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddApptModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 cursor-pointer"
              >
                Agendar Cita
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
