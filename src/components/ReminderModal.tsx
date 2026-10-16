import React, { useState, useMemo } from 'react';
import {
  Bell,
  Calendar,
  Pill,
  Syringe,
  Plus,
  Clock,
  CheckCircle2,
  Trash2,
  AlertCircle,
  X,
  Sparkles,
  Volume2,
  Layers,
  Check,
} from 'lucide-react';
import { MedicalRecord, MedicalType } from '../types';
import { SparkleGlow } from './SparkleEffect';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: MedicalRecord[];
  onSaveRecord: (record: MedicalRecord) => void;
  onSaveBatchRecords?: (records: MedicalRecord[]) => void;
  onDeleteRecord: (id: string) => void;
  babyName: string;
  familyId?: string;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  records,
  onSaveRecord,
  onSaveBatchRecords,
  onDeleteRecord,
  babyName,
  familyId,
}) => {
  const [activeTab, setActiveTab] = useState<'add' | 'list'>('add');
  const [reminderType, setReminderType] = useState<MedicalType>('medication');

  // Form states
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('08:00');
  const [providerOrDoctor, setProviderOrDoctor] = useState('');
  const [dosage, setDosage] = useState('');
  const [notes, setNotes] = useState('');
  const [notificationEnabled, setNotificationEnabled] = useState(true);

  // Medication-specific recurrence: every X hours for Y days
  const [everyHours, setEveryHours] = useState<number>(8);
  const [durationDays, setDurationDays] = useState<number>(5);
  const [batchSuccessMessage, setBatchSuccessMessage] = useState<string | null>(null);

  // Filter in list tab
  const [listFilter, setListFilter] = useState<'all' | 'medication' | 'appointment' | 'vaccine'>('all');

  const [notifPermission, setNotifPermission] = useState<string>(() => {
    return typeof Notification !== 'undefined' ? Notification.permission : 'default';
  });

interface PlannedDosesInfo {
  totalCount: number;
  validHours: number;
  validDays: number;
  dosesPerDay: number;
  previewList: { index: number; dateStr: string; timeStr: string }[];
}

  // Calculate planned doses preview
  const plannedDoses = useMemo<PlannedDosesInfo | null>(() => {
    if (reminderType !== 'medication') return null;
    const validHours = Math.max(1, Math.min(48, Number(everyHours) || 8));
    const validDays = Math.max(1, Math.min(60, Number(durationDays) || 1));
    const count = Math.max(1, Math.round((validDays * 24) / validHours));

    const startDateTime = new Date(`${date}T${time || '08:00'}:00`);
    if (isNaN(startDateTime.getTime())) return null;

    const previewList: { index: number; dateStr: string; timeStr: string }[] = [];
    for (let i = 0; i < Math.min(count, 12); i++) {
      const doseTime = new Date(startDateTime.getTime() + i * validHours * 3600 * 1000);
      const dStr = doseTime.toISOString().split('T')[0];
      const hStr = doseTime.toTimeString().slice(0, 5);
      previewList.push({ index: i + 1, dateStr: dStr, timeStr: hStr });
    }
    return {
      totalCount: count,
      validHours,
      validDays,
      dosesPerDay: Math.round((24 / validHours) * 10) / 10,
      previewList,
    };
  }, [reminderType, date, time, everyHours, durationDays]);

  if (!isOpen) return null;

  const handleRequestNotification = async () => {
    if (typeof Notification !== 'undefined') {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm === 'granted') {
        new Notification(`Recordatorios de ${babyName}`, {
          body: `¡Avisos activados con éxito para medicamentos y citas pediátricas!`,
          icon: '/favicon.ico',
        });
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    if (reminderType === 'medication') {
      const validHours = Math.max(1, Math.min(48, Number(everyHours) || 8));
      const validDays = Math.max(1, Math.min(60, Number(durationDays) || 1));
      const totalDoses = Math.max(1, Math.round((validDays * 24) / validHours));

      const startDateTime = new Date(`${date}T${time || '08:00'}:00`);
      const treatmentGroupId = `treat-${Date.now()}`;
      const batchRecords: MedicalRecord[] = [];

      for (let i = 0; i < totalDoses; i++) {
        const doseTime = new Date(startDateTime.getTime() + i * validHours * 3600 * 1000);
        const dStr = doseTime.toISOString().split('T')[0];
        const hStr = doseTime.toTimeString().slice(0, 5);

        batchRecords.push({
          id: `rem-med-${Date.now()}-${i}`,
          familyId: familyId || 'evan-family-main',
          type: 'medication',
          title: `${title.trim()} (Toma ${i + 1}/${totalDoses})`,
          date: dStr,
          time: hStr,
          dosage: dosage.trim() || undefined,
          frequency: `Cada ${validHours}h (${i + 1} de ${totalDoses})`,
          treatmentGroupId,
          notificationEnabled,
          status: 'pending',
          notes: notes.trim()
            ? `${notes.trim()} • Toma ${i + 1} de ${totalDoses}`
            : `Toma ${i + 1} de ${totalDoses} • Tratamiento por ${validDays} días`,
          createdAt: new Date().toISOString(),
        });
      }

      if (onSaveBatchRecords) {
        onSaveBatchRecords(batchRecords);
      } else {
        batchRecords.forEach((r) => onSaveRecord(r));
      }

      setBatchSuccessMessage(
        `¡Se crearon con éxito ${totalDoses} recordatorios para ${title.trim()} (cada ${validHours} horas por ${validDays} días)!`
      );
      setTimeout(() => setBatchSuccessMessage(null), 6000);

      setActiveTab('list');
      setTitle('');
      setDosage('');
      setNotes('');
    } else {
      // Standard single record for appointment or vaccine
      const newRecord: MedicalRecord = {
        id: `rem-${Date.now()}`,
        familyId: familyId || 'evan-family-main',
        type: reminderType,
        title: title.trim(),
        date,
        time: time || undefined,
        providerOrDoctor: providerOrDoctor.trim() || undefined,
        notificationEnabled,
        status: 'pending',
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      onSaveRecord(newRecord);
      setBatchSuccessMessage(`¡Recordatorio agendado con éxito!`);
      setTimeout(() => setBatchSuccessMessage(null), 5000);

      setActiveTab('list');
      setTitle('');
      setProviderOrDoctor('');
      setNotes('');
    }
  };

  const pendingRecords = records.filter((r) => r.status === 'pending');
  const filteredRecords = pendingRecords.filter((r) => {
    if (listFilter === 'all') return true;
    return r.type === listFilter;
  });

  const handleComplete = (rec: MedicalRecord) => {
    onSaveRecord({
      ...rec,
      status: 'completed',
    });
  };

  // Group batch delete if user wants to cancel whole treatment
  const handleDeleteTreatmentGroup = (groupId: string) => {
    const groupItems = records.filter((r) => r.treatmentGroupId === groupId);
    groupItems.forEach((item) => onDeleteRecord(item.id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-blue-500/40 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white shadow-md shadow-blue-600/30">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Recordatorios & Medicamentos</span>
                <SparkleGlow size={13} />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Programación de tomas horarias y citas de {babyName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center justify-between gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('add')}
            className={`flex-1 py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'add'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Plus size={14} />
            <span>+ Programar Aviso / Toma</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'list'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock size={14} />
            <span>Pendientes ({pendingRecords.length})</span>
          </button>
        </div>

        {/* Success Feedback banner */}
        {batchSuccessMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-fade-in font-medium">
            <Check size={16} className="text-emerald-500 shrink-0" />
            <span>{batchSuccessMessage}</span>
          </div>
        )}

        {/* Browser Notification Permission Banner */}
        {notifPermission !== 'granted' && (
          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Volume2 size={16} className="text-blue-500 shrink-0" />
              <span className="text-slate-700 dark:text-slate-300">
                Activa avisos en tu navegador para recibir alertas sonoras de cada toma.
              </span>
            </div>
            <button
              type="button"
              onClick={handleRequestNotification}
              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] whitespace-nowrap cursor-pointer"
            >
              Activar
            </button>
          </div>
        )}

        {/* TAB 1: ADD REMINDER / MEDICATION PROGRAM */}
        {activeTab === 'add' && (
          <form onSubmit={handleSave} className="space-y-4 animate-fade-in">
            {/* Reminder Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tipo de Recordatorio
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    id: 'medication',
                    label: 'Medicamento / Vitamina',
                    sub: 'Programa por horas y días',
                    icon: Pill,
                    color: 'text-emerald-500',
                  },
                  {
                    id: 'appointment',
                    label: 'Cita con Pediatra',
                    sub: 'Fecha y hora',
                    icon: Calendar,
                    color: 'text-blue-500',
                  },
                  {
                    id: 'vaccine',
                    label: 'Vacuna Pediátrica',
                    sub: 'Dosis del calendario',
                    icon: Syringe,
                    color: 'text-purple-500',
                  },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = reminderType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setReminderType(opt.id as MedicalType)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/30'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                      }`}
                    >
                      <Icon size={18} className={isSelected ? 'text-white' : opt.color} />
                      <span className="text-[11px] text-center leading-tight font-bold">{opt.label}</span>
                      <span className={`text-[9px] font-normal ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                        {opt.sub}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title / Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {reminderType === 'medication'
                  ? 'Nombre del Medicamento o Suplemento'
                  : reminderType === 'appointment'
                  ? 'Motivo o Especialidad de la Consulta'
                  : 'Nombre de la Vacuna'}
              </label>
              <input
                type="text"
                required
                placeholder={
                  reminderType === 'medication'
                    ? 'ej. Amoxicilina jarabe, Vitamina D3 gotas, Paracetamol...'
                    : reminderType === 'appointment'
                    ? 'ej. Control Pediatra 4to Mes, Oftalmología...'
                    : 'ej. Pentavalente 2ª Dosis, Neumococo...'
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {/* MEDICATION-SPECIFIC: DOSAGE, EVERY X HOURS, FOR Y DAYS */}
            {reminderType === 'medication' ? (
              <div className="space-y-3.5 p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-300/60 dark:border-emerald-800/50">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <Pill size={15} />
                  <span>Programador Inteligente de Tomas (Horas y Días)</span>
                </div>

                {/* Dosage */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Dosis a Administrar por Toma
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. 2.5 ml, 1 gota (400 UI), 80 mg"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Frequency in hours */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      ¿Cada cuántas horas?
                    </label>
                    <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                      Cada {everyHours} hora{everyHours > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Quick buttons */}
                  <div className="grid grid-cols-5 gap-1.5 mb-2">
                    {[
                      { val: 4, label: '4h' },
                      { val: 6, label: '6h' },
                      { val: 8, label: '8h' },
                      { val: 12, label: '12h' },
                      { val: 24, label: '24h' },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setEveryHours(opt.val)}
                        className={`py-1.5 px-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          everyHours === opt.val
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Manual hours input */}
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <span>O introduce horas personalizadas:</span>
                    <input
                      type="number"
                      min="1"
                      max="48"
                      value={everyHours}
                      onChange={(e) => setEveryHours(Math.max(1, Number(e.target.value)))}
                      className="w-16 p-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-bold text-slate-900 dark:text-white"
                    />
                    <span>horas</span>
                  </div>
                </div>

                {/* Duration in days */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      ¿Por cuántos días?
                    </label>
                    <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                      Durante {durationDays} día{durationDays > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Quick buttons */}
                  <div className="grid grid-cols-6 gap-1 mb-2">
                    {[
                      { val: 1, label: '1 d' },
                      { val: 3, label: '3 d' },
                      { val: 5, label: '5 d' },
                      { val: 7, label: '7 d' },
                      { val: 10, label: '10 d' },
                      { val: 14, label: '14 d' },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setDurationDays(opt.val)}
                        className={`py-1 px-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          durationDays === opt.val
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Manual days input */}
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <span>O días personalizados:</span>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={durationDays}
                      onChange={(e) => setDurationDays(Math.max(1, Number(e.target.value)))}
                      className="w-16 p-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-bold text-slate-900 dark:text-white"
                    />
                    <span>días de tratamiento</span>
                  </div>
                </div>

                {/* First dose date and time */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Fecha de 1ª Toma
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Hora de 1ª Toma
                    </label>
                    <input
                      type="time"
                      required
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Calculation Summary Badge & Schedule Preview */}
                {plannedDoses && plannedDoses.totalCount && (
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300/80 dark:border-emerald-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Layers size={14} className="text-emerald-500" />
                        <span>Resumen del Tratamiento:</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px]">
                        {plannedDoses.totalCount} recordatorios programados
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Se generarán <strong>{plannedDoses.totalCount} tomas</strong> individuales con fecha y hora exacta (cada {plannedDoses.validHours}h durante {plannedDoses.validDays} días).
                    </p>

                    {/* Preview pills */}
                    <div className="pt-1">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">
                        Primeras tomas calculadas:
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {plannedDoses.previewList.map((p) => (
                          <span
                            key={p.index}
                            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300 font-medium"
                          >
                            Toma #{p.index}: {p.dateStr.slice(5)} {p.timeStr}
                          </span>
                        ))}
                        {plannedDoses.totalCount > plannedDoses.previewList.length && (
                          <span className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                            +{plannedDoses.totalCount - plannedDoses.previewList.length} más...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Non-medication single record inputs */
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Doctor / Especialista / Clínica Pediátrica
                  </label>
                  <input
                    type="text"
                    placeholder="ej. Dra. Valentina Morales, Centro Pediátrico Central"
                    value={providerOrDoctor}
                    onChange={(e) => setProviderOrDoctor(e.target.value)}
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
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
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
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Instrucciones / Notas Pediátricas
              </label>
              <input
                type="text"
                placeholder={
                  reminderType === 'medication'
                    ? 'ej. Dar después de la leche materna, agitar bien, conservar refrigerado'
                    : 'ej. Llevar cartilla de vacunación, preguntar sobre inicio de papillas...'
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {/* Notification toggle */}
            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-900/40 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={notificationEnabled}
                onChange={(e) => setNotificationEnabled(e.target.checked)}
                className="rounded accent-blue-600 h-4 w-4"
              />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Activar alerta destacada en la aplicación
              </span>
            </label>

            {/* Submit */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 cursor-pointer flex items-center gap-2"
              >
                <Plus size={14} />
                <span>
                  {reminderType === 'medication' && plannedDoses?.totalCount
                    ? `Guardar y Crear ${plannedDoses.totalCount} Recordatorios`
                    : 'Guardar Recordatorio'}
                </span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: ACTIVE LIST */}
        {activeTab === 'list' && (
          <div className="space-y-3 animate-fade-in">
            {/* Filter tags */}
            <div className="flex items-center gap-1.5 pb-1 overflow-x-auto text-xs">
              {[
                { id: 'all', label: `Todos (${pendingRecords.length})` },
                {
                  id: 'medication',
                  label: `Medicamentos (${pendingRecords.filter((r) => r.type === 'medication').length})`,
                },
                {
                  id: 'appointment',
                  label: `Citas (${pendingRecords.filter((r) => r.type === 'appointment').length})`,
                },
                {
                  id: 'vaccine',
                  label: `Vacunas (${pendingRecords.filter((r) => r.type === 'vaccine').length})`,
                },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setListFilter(f.id as any)}
                  className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
                    listFilter === f.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {filteredRecords.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No hay recordatorios pendientes en esta categoría.
                </div>
              ) : (
                filteredRecords.map((r) => {
                  const isMed = r.type === 'medication';
                  const isAppt = r.type === 'appointment';

                  return (
                    <div
                      key={r.id}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:border-blue-400 transition-all flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`p-2 rounded-xl text-white text-xs shrink-0 ${
                            isMed ? 'bg-emerald-600' : isAppt ? 'bg-blue-600' : 'bg-purple-600'
                          }`}
                        >
                          {isMed ? <Pill size={15} /> : isAppt ? <Calendar size={15} /> : <Syringe size={15} />}
                        </span>
                        <div>
                          <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                            {r.title}
                          </div>
                          {r.dosage && (
                            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                              Dosis: {r.dosage} {r.frequency ? `• ${r.frequency}` : ''}
                            </div>
                          )}
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>
                              📅 {new Date(r.date).toLocaleDateString('es-ES', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                            {r.time && <span>⏰ {r.time}</span>}
                            {r.providerOrDoctor && <span>• {r.providerOrDoctor}</span>}
                          </div>
                          {r.notes && (
                            <div className="text-[10px] text-slate-400 italic mt-0.5">{r.notes}</div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleComplete(r)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                          title="Marcar como cumplido / administrado"
                        >
                          <CheckCircle2 size={13} />
                          <span>{isMed ? 'Tomada' : 'Cumplida'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteRecord(r.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                          title="Eliminar este recordatorio"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 flex justify-between items-center">
              <span className="text-[11px] text-slate-400">
                {pendingRecords.length} recordatorio{pendingRecords.length === 1 ? '' : 's'} activo{pendingRecords.length === 1 ? '' : 's'}
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('add')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer"
              >
                + Nuevo Recordatorio
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
