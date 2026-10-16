import React, { useState, useEffect } from 'react';
import {
  Milk,
  Plus,
  Trash2,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Info,
  Calendar,
  CheckCircle,
  Heart,
} from 'lucide-react';
import { FeedingRecord, FeedingType, BreastSide, InventoryItem } from '../types';
import { SparkleGlow } from './SparkleEffect';

interface FeedingTrackerProps {
  feedings: FeedingRecord[];
  inventory: InventoryItem[];
  onSaveFeeding: (feeding: FeedingRecord) => void;
  onDeleteFeeding: (id: string) => void;
  currentCaregiver: string;
}

export const FeedingTracker: React.FC<FeedingTrackerProps> = ({
  feedings,
  inventory,
  onSaveFeeding,
  onDeleteFeeding,
  currentCaregiver,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [type, setType] = useState<FeedingType>('formula');
  const [amountMl, setAmountMl] = useState<number>(120);
  const [breastSide, setBreastSide] = useState<BreastSide>('both');

  // Direct breastfeeding stopwatch & manual minutes
  const [leftTimer, setLeftTimer] = useState<number>(0); // in seconds
  const [rightTimer, setRightTimer] = useState<number>(0); // in seconds
  const [manualLeftMinutes, setManualLeftMinutes] = useState<number>(0);
  const [manualRightMinutes, setManualRightMinutes] = useState<number>(0);
  const [activeSide, setActiveSide] = useState<'left' | 'right' | null>(null);

  const [customTime, setCustomTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Live timer for breastfeeding
  useEffect(() => {
    if (!activeSide) return;
    const interval = setInterval(() => {
      if (activeSide === 'left') {
        setLeftTimer((prev) => prev + 1);
      } else if (activeSide === 'right') {
        setRightTimer((prev) => prev + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSide]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s < 10 ? `0${s}` : s}s`;
  };

  // Compute actual minutes for each breast
  const effectiveLeftMinutes = manualLeftMinutes > 0
    ? manualLeftMinutes
    : (leftTimer > 0 ? Math.max(1, Math.round(leftTimer / 60)) : 0);

  const effectiveRightMinutes = manualRightMinutes > 0
    ? manualRightMinutes
    : (rightTimer > 0 ? Math.max(1, Math.round(rightTimer / 60)) : 0);

  const totalBreastMinutes = effectiveLeftMinutes + effectiveRightMinutes;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const timestamp = customTime ? new Date(customTime).toISOString() : new Date().toISOString();

    let computedDuration = 15;
    let actualBreastSide: BreastSide = 'both';

    if (type === 'breast_direct') {
      computedDuration = Math.max(1, totalBreastMinutes > 0 ? totalBreastMinutes : 1);
      if (effectiveLeftMinutes > 0 && effectiveRightMinutes === 0) {
        actualBreastSide = 'left';
      } else if (effectiveRightMinutes > 0 && effectiveLeftMinutes === 0) {
        actualBreastSide = 'right';
      } else {
        actualBreastSide = 'both';
      }
    }

    const newRecord: FeedingRecord = {
      id: `feed-${Date.now()}`,
      familyId: 'evan-family-main',
      type,
      amountMl: type === 'breast_direct' ? 0 : amountMl,
      amountOz: type === 'breast_direct' ? 0 : Number((amountMl / 29.5735).toFixed(1)),
      durationMinutes: computedDuration,
      breastSide: type === 'breast_direct' ? actualBreastSide : undefined,
      breastLeftMinutes: type === 'breast_direct' ? effectiveLeftMinutes : undefined,
      breastRightMinutes: type === 'breast_direct' ? effectiveRightMinutes : undefined,
      timestamp,
      notes: notes.trim(),
      loggedBy: currentCaregiver,
      createdAt: new Date().toISOString(),
    };

    onSaveFeeding(newRecord);
    setShowAddForm(false);
    setNotes('');
    setLeftTimer(0);
    setRightTimer(0);
    setManualLeftMinutes(0);
    setManualRightMinutes(0);
    setActiveSide(null);
  };

  const quickAmounts = [60, 90, 120, 150, 180, 210];

  // Daily totals
  const today = new Date().toISOString().split('T')[0];
  const todayFeedings = feedings.filter((f) => f.timestamp.startsWith(today));
  const todayMl = todayFeedings.reduce((sum, f) => sum + (f.amountMl || 0), 0);
  const todayDirectBreastSessions = todayFeedings.filter((f) => f.type === 'breast_direct');
  const todayDirectMinutes = todayDirectBreastSessions.reduce((sum, f) => sum + (f.durationMinutes || 0), 0);

  return (
    <div className="space-y-4">
      {/* Summary card & Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200/70 dark:border-blue-900/40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400">
            <Milk size={24} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-slate-900 dark:text-white">Tomas de Leche y Fórmula</h3>
              <SparkleGlow size={13} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hoy: <strong className="text-blue-600 dark:text-blue-400 font-bold">{todayFeedings.length} tomas</strong>{' '}
              {todayMl > 0 ? `(${todayMl} ml / ${(todayMl / 29.57).toFixed(1)} oz)` : ''}
              {todayDirectMinutes > 0 ? ` • ${todayDirectMinutes} min de pecho directo` : ''}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-600/30 transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>{showAddForm ? 'Cerrar Registro' : 'Nueva Toma'}</span>
        </button>
      </div>

      {/* Form modal/inline */}
      {showAddForm && (
        <form
          onSubmit={handleSave}
          className="p-4 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-blue-500/30 shadow-lg space-y-4 animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Registrar Toma para Evan</span>
              <Sparkles size={14} className="text-blue-400" />
            </h4>
            <span className="text-xs text-slate-400">Por: {currentCaregiver}</span>
          </div>

          {/* Type selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tipo de Toma
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'breast_direct', label: 'Pecho Directo', icon: '🤱' },
                { id: 'formula', label: 'Fórmula', icon: '🍼' },
                { id: 'breast_bottle', label: 'Biberón Materna', icon: '🥛' },
                { id: 'mixed', label: 'Mixta', icon: '✨' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setType(opt.id as FeedingType)}
                  className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    type === opt.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/30 font-bold'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                  }`}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Direct Breastfeeding Timer & Exact Minutes per Breast */}
          {type === 'breast_direct' && (
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-pink-300 dark:border-pink-900/50 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Heart size={14} className="text-pink-500 fill-pink-500" />
                    <span>Tiempo de Lactancia por Pecho (Minutos Exactos)</span>
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Usa el cronómetro en vivo o escribe los minutos pasados en cada pecho
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Total Toma:</span>
                  <span className="text-sm font-bold font-mono text-pink-600 dark:text-pink-400">
                    {totalBreastMinutes} minutos
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Left Breast */}
                <div
                  className={`p-3.5 rounded-xl border text-center transition-all ${
                    activeSide === 'left'
                      ? 'border-pink-500 bg-pink-500/10 ring-2 ring-pink-500/50 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Pecho Izquierdo
                    </span>
                    <span className="text-xs font-mono font-bold text-pink-600 dark:text-pink-400">
                      {leftTimer > 0 ? formatTimer(leftTimer) : `${effectiveLeftMinutes} min`}
                    </span>
                  </div>

                  {/* Stopwatch Button */}
                  <button
                    type="button"
                    onClick={() => setActiveSide(activeSide === 'left' ? null : 'left')}
                    className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all mb-2.5 ${
                      activeSide === 'left'
                        ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30 animate-pulse'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-pink-400'
                    }`}
                  >
                    {activeSide === 'left' ? <Pause size={14} /> : <Play size={14} />}
                    <span>{activeSide === 'left' ? 'Pausar Izquierdo' : 'Cronometrar Izquierdo'}</span>
                  </button>

                  {/* Manual Minutes Adjustment */}
                  <div className="pt-1 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-1">
                    <span className="text-[10px] text-slate-500 font-medium">Minutos:</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setManualLeftMinutes(Math.max(0, effectiveLeftMinutes - 1))}
                        className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 text-xs font-bold hover:bg-slate-300"
                        title="Restar 1 min"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="120"
                        value={effectiveLeftMinutes || ''}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value));
                          setManualLeftMinutes(val);
                          setLeftTimer(val * 60);
                        }}
                        placeholder="0"
                        className="w-12 text-center text-xs font-mono font-bold p-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => setManualLeftMinutes(effectiveLeftMinutes + 1)}
                        className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 text-xs font-bold hover:bg-slate-300"
                        title="Sumar 1 min"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualLeftMinutes(effectiveLeftMinutes + 5)}
                        className="px-1.5 py-0.5 rounded bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 text-[10px] font-bold"
                        title="Sumar 5 min"
                      >
                        +5m
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Breast */}
                <div
                  className={`p-3.5 rounded-xl border text-center transition-all ${
                    activeSide === 'right'
                      ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/50 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Pecho Derecho
                    </span>
                    <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                      {rightTimer > 0 ? formatTimer(rightTimer) : `${effectiveRightMinutes} min`}
                    </span>
                  </div>

                  {/* Stopwatch Button */}
                  <button
                    type="button"
                    onClick={() => setActiveSide(activeSide === 'right' ? null : 'right')}
                    className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all mb-2.5 ${
                      activeSide === 'right'
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 animate-pulse'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-purple-400'
                    }`}
                  >
                    {activeSide === 'right' ? <Pause size={14} /> : <Play size={14} />}
                    <span>{activeSide === 'right' ? 'Pausar Derecho' : 'Cronometrar Derecho'}</span>
                  </button>

                  {/* Manual Minutes Adjustment */}
                  <div className="pt-1 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-1">
                    <span className="text-[10px] text-slate-500 font-medium">Minutos:</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setManualRightMinutes(Math.max(0, effectiveRightMinutes - 1))}
                        className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 text-xs font-bold hover:bg-slate-300"
                        title="Restar 1 min"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="120"
                        value={effectiveRightMinutes || ''}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value));
                          setManualRightMinutes(val);
                          setRightTimer(val * 60);
                        }}
                        placeholder="0"
                        className="w-12 text-center text-xs font-mono font-bold p-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => setManualRightMinutes(effectiveRightMinutes + 1)}
                        className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 text-xs font-bold hover:bg-slate-300"
                        title="Sumar 1 min"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualRightMinutes(effectiveRightMinutes + 5)}
                        className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-bold"
                        title="Sumar 5 min"
                      >
                        +5m
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {(leftTimer > 0 || rightTimer > 0 || manualLeftMinutes > 0 || manualRightMinutes > 0) && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setLeftTimer(0);
                      setRightTimer(0);
                      setManualLeftMinutes(0);
                      setManualRightMinutes(0);
                      setActiveSide(null);
                    }}
                    className="text-[11px] text-slate-500 hover:text-rose-500 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={12} />
                    <span>Reiniciar tiempos de pecho</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Amount selector (if bottle or formula) */}
          {type !== 'breast_direct' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Cantidad ({amountMl} ml ≈ {(amountMl / 29.5735).toFixed(1)} oz)
                </label>
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                  {amountMl} ml
                </span>
              </div>

              {/* Quick chip buttons */}
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((ml) => (
                  <button
                    key={ml}
                    type="button"
                    onClick={() => setAmountMl(ml)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      amountMl === ml
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {ml} ml
                  </button>
                ))}
              </div>

              <input
                type="range"
                min="10"
                max="300"
                step="5"
                value={amountMl}
                onChange={(e) => setAmountMl(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />

              {type === 'formula' && (
                <div className="flex items-center gap-1.5 text-[11px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 p-2 rounded-lg border border-blue-200/50 dark:border-blue-800/40">
                  <Info size={13} className="shrink-0" />
                  <span>Se descontará automáticamente del stock de latas/tomas de fórmula.</span>
                </div>
              )}
            </div>
          )}

          {/* Time & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hora del Registro (Opcional si fue anterior)
              </label>
              <input
                type="datetime-local"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Notas / Observaciones
              </label>
              <input
                type="text"
                placeholder="Ej. Agarre profundo, soltó satisfecho..."
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
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/30 cursor-pointer"
            >
              Guardar Toma
            </button>
          </div>
        </form>
      )}

      {/* History list */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-sm">
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Historial Reciente de Tomas
          </h4>
          <span className="text-xs text-slate-400">{feedings.length} registros</span>
        </div>

        {feedings.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs sm:text-sm">
            No hay tomas registradas aún. ¡Toca "Nueva Toma" para comenzar!
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-96 overflow-y-auto">
            {feedings.slice(0, 30).map((f) => {
              const date = new Date(f.timestamp);
              const isToday = f.timestamp.startsWith(today);
              const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
              const dateStr = date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
              const isDirect = f.type === 'breast_direct';

              return (
                <div
                  key={f.id}
                  className="p-3 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-base">
                      {f.type === 'formula' ? '🍼' : isDirect ? '🤱' : '🥛'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">
                          {f.type === 'formula'
                            ? 'Fórmula'
                            : f.type === 'breast_bottle'
                            ? 'Biberón Materna'
                            : isDirect
                            ? 'Pecho Directo'
                            : 'Mixta'}
                        </span>

                        {/* Amount or Direct Breast time badges */}
                        {isDirect ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 font-bold text-xs border border-pink-300/40">
                              ⏱️ {f.durationMinutes || 0} min total
                            </span>
                            {(f.breastLeftMinutes !== undefined || f.breastRightMinutes !== undefined) && (
                              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                {f.breastLeftMinutes !== undefined ? `Izq: ${f.breastLeftMinutes}m` : ''}
                                {f.breastLeftMinutes !== undefined && f.breastRightMinutes !== undefined ? ' • ' : ''}
                                {f.breastRightMinutes !== undefined ? `Der: ${f.breastRightMinutes}m` : ''}
                              </span>
                            )}
                          </div>
                        ) : (
                          f.amountMl > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs">
                              {f.amountMl} ml ({f.amountOz} oz)
                            </span>
                          )
                        )}

                        {!isDirect && f.durationMinutes && (
                          <span className="text-xs text-slate-400">
                            {f.durationMinutes} min
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{isToday ? `Hoy a las ${timeStr}` : `${dateStr}, ${timeStr}`}</span>
                        <span>•</span>
                        <span className="text-blue-500 font-medium">{f.loggedBy}</span>
                        {f.notes && (
                          <>
                            <span>•</span>
                            <span className="italic truncate max-w-[150px] sm:max-w-xs">{f.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteFeeding(f.id)}
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
