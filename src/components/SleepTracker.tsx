import React, { useState, useEffect } from 'react';
import {
  Moon,
  Sun,
  Play,
  Square,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  Bed,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { SleepRecord, SleepType } from '../types';
import { SparkleGlow } from './SparkleEffect';
import { getPediatricNorms } from '../lib/pediatricNorms';

interface SleepTrackerProps {
  sleeps: SleepRecord[];
  activeSleep: { startTime: string } | null;
  onStartSleep: () => void;
  onStopSleep: () => void;
  onSaveSleep: (sleep: SleepRecord) => void;
  onDeleteSleep: (id: string) => void;
  currentCaregiver: string;
  babyBirthDate?: string;
  babyName?: string;
}

export const SleepTracker: React.FC<SleepTrackerProps> = ({
  sleeps,
  activeSleep,
  onStartSleep,
  onStopSleep,
  onSaveSleep,
  onDeleteSleep,
  currentCaregiver,
  babyBirthDate = '2026-06-15',
  babyName = 'Evan',
}) => {
  const pediatricNorms = getPediatricNorms(babyBirthDate, babyName);
  const [showManualForm, setShowManualForm] = useState(false);
  const [sleepType, setSleepType] = useState<SleepType>('nap');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [quality, setQuality] = useState<'calm' | 'restless' | 'interrupted'>('calm');
  const [notes, setNotes] = useState<string>('');
  const [elapsed, setElapsed] = useState<string>('00:00:00');

  // Elapsed timer when active
  useEffect(() => {
    if (!activeSleep) return;

    const interval = setInterval(() => {
      const start = new Date(activeSleep.startTime).getTime();
      const now = new Date().getTime();
      const diffSec = Math.max(0, Math.floor((now - start) / 1000));
      const hours = Math.floor(diffSec / 3600);
      const mins = Math.floor((diffSec % 3600) / 60);
      const secs = diffSec % 60;
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      setElapsed(`${pad(hours)}:${pad(mins)}:${pad(secs)}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSleep]);

  // Calculate 24h sleep
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last24hSleeps = sleeps.filter((s) => new Date(s.endTime) >= twentyFourHoursAgo);
  const totalMins24h = last24hSleeps.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalHours24h = (totalMins24h / 60).toFixed(1);

  // Last wake window
  const lastCompletedSleep = sleeps[0];
  const wakeMins = lastCompletedSleep
    ? Math.max(0, Math.floor((now.getTime() - new Date(lastCompletedSleep.endTime).getTime()) / (1000 * 60)))
    : null;

  const handleManualSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime || !endTime) return;

    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const diffMins = Math.max(1, Math.round((end - start) / (1000 * 60)));

    const newRecord: SleepRecord = {
      id: `sleep-${Date.now()}`,
      familyId: 'evan-family-main',
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      durationMinutes: diffMins,
      sleepType,
      quality,
      notes: notes.trim(),
      loggedBy: currentCaregiver,
      createdAt: new Date().toISOString(),
    };

    onSaveSleep(newRecord);
    setShowManualForm(false);
    setNotes('');
    setStartTime('');
    setEndTime('');
  };

  return (
    <div className="space-y-4">
      {/* Active Sleep & Wake Window Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Main Live Sleep Action */}
        <div className="md:col-span-2 p-5 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 border border-indigo-500/40 shadow-xl shadow-indigo-950/40 text-white relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300">
                <Moon size={22} />
              </span>
              <div>
                <h3 className="font-bold text-sm sm:text-base flex items-center gap-1.5">
                  <span>Monitor de Sueño en Vivo</span>
                  <SparkleGlow size={13} />
                </h3>
                <p className="text-xs text-indigo-200/80">
                  {activeSleep ? 'Evan está durmiendo plácidamente' : 'Cronómetro listo para siesta o noche'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowManualForm(!showManualForm)}
              className="text-xs text-indigo-300 hover:text-white underline cursor-pointer"
            >
              {showManualForm ? 'Cerrar' : '+ Registro Manual'}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-indigo-400/20 backdrop-blur-md">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-indigo-300 font-semibold mb-0.5">
                {activeSleep ? 'Tiempo transcurrido durmiendo' : 'Estado actual: Despierto'}
              </div>
              <div className="text-3xl sm:text-4xl font-mono font-extrabold tracking-tight text-white drop-shadow">
                {activeSleep ? elapsed : '00:00:00'}
              </div>
              {activeSleep && (
                <div className="text-xs text-indigo-300/90 mt-1">
                  Iniciado a las {new Date(activeSleep.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>

            {activeSleep ? (
              <button
                type="button"
                onClick={onStopSleep}
                className="py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Sun size={18} />
                <span>Despertar a Evan</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onStartSleep}
                className="py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-blue-700 hover:from-indigo-500 hover:to-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-950/50 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Play size={18} />
                <span>Poner a Dormir</span>
              </button>
            )}
          </div>
        </div>

        {/* Wake window & 24h summary */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              <Clock size={14} className="text-blue-500" />
              <span>Ventana de Despierto</span>
            </div>

            {activeSleep ? (
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
                Evan está durmiendo. Su descanso está en curso.
              </div>
            ) : wakeMins !== null ? (
              <div className="space-y-1.5">
                <div className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {Math.floor(wakeMins / 60)}h {wakeMins % 60}m despierto
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Ventana recomendada para {pediatricNorms.ageDisplay}: <strong>{pediatricNorms.wakeWindowDisplay}</strong>.
                  {wakeMins > pediatricNorms.wakeWindowMaxMinutes ? (
                    <span className="block mt-1 text-amber-500 font-semibold flex items-center gap-1">
                      <AlertCircle size={13} />
                      ¡Hora de iniciar rutina de sueño para evitar sobrecansancio!
                    </span>
                  ) : (
                    <span className="block mt-1 text-emerald-500 font-semibold">
                      En rango óptimo de vigilia.
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400">Sin datos de siesta previa.</div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Total últimas 24h:</span>
            <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">
              {totalHours24h} horas
            </span>
          </div>
        </div>
      </div>

      {/* Manual form */}
      {showManualForm && (
        <form
          onSubmit={handleManualSave}
          className="p-4 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-indigo-500/30 shadow-lg space-y-4 animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Registrar Sesión de Sueño Manual</span>
              <Sparkles size={14} className="text-indigo-400" />
            </h4>
            <span className="text-xs text-slate-400">Por: {currentCaregiver}</span>
          </div>

          {/* Nap vs Night */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tipo de Sueño
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSleepType('nap')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  sleepType === 'nap'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>🌤️</span>
                <span>Siesta Diurna</span>
              </button>
              <button
                type="button"
                onClick={() => setSleepType('night')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  sleepType === 'night'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>🌙</span>
                <span>Sueño Nocturno</span>
              </button>
            </div>
          </div>

          {/* Time range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hora de Inicio
              </label>
              <input
                type="datetime-local"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hora de Despertar
              </label>
              <input
                type="datetime-local"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Quality & notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Calidad del Sueño
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'calm', label: 'Tranquilo' },
                  { id: 'restless', label: 'Inquieto' },
                  { id: 'interrupted', label: 'Interrumpido' },
                ].map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setQuality(q.id as any)}
                    className={`p-2 rounded-lg border text-xs cursor-pointer text-center ${
                      quality === q.id
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 font-bold text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Notas
              </label>
              <input
                type="text"
                placeholder="Ej. Despertó con cólicos, ruido blanco..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowManualForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-900/30 cursor-pointer"
            >
              Guardar Sueño
            </button>
          </div>
        </form>
      )}

      {/* History */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-sm">
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Historial de Sueños y Siestas
          </h4>
          <span className="text-xs text-slate-400">{sleeps.length} sesiones</span>
        </div>

        {sleeps.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs sm:text-sm">
            No hay registros de sueño todavía.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-96 overflow-y-auto">
            {sleeps.slice(0, 30).map((s) => {
              const start = new Date(s.startTime);
              const end = new Date(s.endTime);
              const dateStr = start.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
              const hours = Math.floor(s.durationMinutes / 60);
              const mins = s.durationMinutes % 60;

              return (
                <div
                  key={s.id}
                  className="p-3 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-base">
                      {s.sleepType === 'night' ? '🌙' : '🌤️'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">
                          {s.sleepType === 'night' ? 'Sueño Nocturno' : 'Siesta Diurna'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                          {hours > 0 ? `${hours}h ` : ''}{mins}m
                        </span>
                        {s.quality && (
                          <span className="text-[11px] text-slate-400">
                            ({s.quality === 'calm' ? 'Tranquilo' : s.quality === 'restless' ? 'Inquieto' : 'Interrumpido'})
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{dateStr}</span>
                        <span>•</span>
                        <span>
                          {start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span>•</span>
                        <span className="text-indigo-500 font-medium">{s.loggedBy}</span>
                        {s.notes && (
                          <>
                            <span>•</span>
                            <span className="italic truncate max-w-[150px] sm:max-w-xs">{s.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteSleep(s.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                    title="Eliminar registro"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
