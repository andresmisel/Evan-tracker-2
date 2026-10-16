import React, { useState } from 'react';
import {
  CalendarRange,
  Milk,
  Baby,
  Moon,
  TrendingUp,
  DollarSign,
  Sparkles,
  PieChart,
  Clock,
  Award,
} from 'lucide-react';
import { FeedingRecord, DiaperRecord, SleepRecord, InventoryItem } from '../types';
import { SparkleGlow } from './SparkleEffect';
import { getPediatricNorms } from '../lib/pediatricNorms';

interface MonthlyStatsProps {
  feedings: FeedingRecord[];
  diapers: DiaperRecord[];
  sleeps: SleepRecord[];
  inventory: InventoryItem[];
  babyBirthDate?: string;
  babyName?: string;
}

export const MonthlyStats: React.FC<MonthlyStatsProps> = ({
  feedings,
  diapers,
  sleeps,
  inventory,
  babyBirthDate = '2026-06-15',
  babyName = 'Evan',
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const pediatricNorms = getPediatricNorms(babyBirthDate, babyName);

  // Filter records by selected month YYYY-MM
  const monthFeedings = feedings.filter((f) => f.timestamp.startsWith(selectedMonth));
  const monthDiapers = diapers.filter((d) => d.timestamp.startsWith(selectedMonth));
  const monthSleeps = sleeps.filter((s) => s.startTime.startsWith(selectedMonth));

  // Compute stats
  const totalMl = monthFeedings.reduce((sum, f) => sum + (f.amountMl || 0), 0);
  const totalLiters = (totalMl / 1000).toFixed(2);
  const totalOz = (totalMl / 29.5735).toFixed(0);

  const formulaFeedings = monthFeedings.filter((f) => f.type === 'formula' || f.type === 'mixed');
  const formulaMl = formulaFeedings.reduce((sum, f) => sum + (f.amountMl || 0), 0);
  const breastMl = totalMl - formulaMl;
  const formulaPct = totalMl > 0 ? Math.round((formulaMl / totalMl) * 100) : 0;
  const breastPct = 100 - formulaPct;

  const totalDiapers = monthDiapers.length;
  const wetCount = monthDiapers.filter((d) => d.type === 'wet' || d.type === 'mixed').length;
  const dirtyCount = monthDiapers.filter((d) => d.type === 'dirty' || d.type === 'mixed').length;
  const creamCount = monthDiapers.filter((d) => d.creamApplied).length;

  const totalSleepMins = monthSleeps.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalSleepHours = (totalSleepMins / 60).toFixed(1);
  const avgSleepHoursPerDay = (Number(totalSleepHours) / 30).toFixed(1);

  // Feeding interval calculation
  const avgFeedsPerDay = (monthFeedings.length / 30).toFixed(1);
  const avgIntervalHours = Number(avgFeedsPerDay) > 0 ? (24 / Number(avgFeedsPerDay)).toFixed(1) : '3.5';

  return (
    <div className="space-y-6">
      {/* Header with Month picker */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200/70 dark:border-blue-900/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
            <CalendarRange size={24} />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Panel de Estadísticas Mensuales</span>
              <SparkleGlow size={13} />
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Resumen acumulado del cuidado y desarrollo de Evan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Mes analizado:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs font-semibold p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 cursor-pointer"
          >
            <option value="2026-10">Octubre 2026 (Actual)</option>
            <option value="2026-09">Septiembre 2026</option>
            <option value="2026-08">Agosto 2026</option>
          </select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Leche mensual */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-900/30 via-slate-900 to-slate-900 border border-blue-500/30 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Total Ingesta de Leche
            </span>
            <span className="p-2 rounded-xl bg-blue-600/20 text-blue-400">
              <Milk size={18} />
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {totalLiters} L
            </div>
            <div className="text-xs text-blue-300">
              {totalMl.toLocaleString()} ml ({totalOz} oz) en el mes
            </div>
          </div>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 flex justify-between">
            <span>{monthFeedings.length} tomas totales</span>
            <span className="text-blue-400 font-semibold">~{avgFeedsPerDay} tomas/día</span>
          </div>
        </div>

        {/* Pañales mensual */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-900/30 via-slate-900 to-slate-900 border border-cyan-500/30 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Pañales Cambiados
            </span>
            <span className="p-2 rounded-xl bg-cyan-600/20 text-cyan-400">
              <Baby size={18} />
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {totalDiapers}
            </div>
            <div className="text-xs text-cyan-300">
              {wetCount} pipí 💧 | {dirtyCount} popó 💩
            </div>
          </div>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 flex justify-between">
            <span>Crema aplicada {creamCount} veces</span>
            <span className="text-cyan-400 font-semibold">~{(totalDiapers / 30).toFixed(1)} / día</span>
          </div>
        </div>

        {/* Sueño mensual */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-900/30 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Horas de Sueño
            </span>
            <span className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
              <Moon size={18} />
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {totalSleepHours} h
            </div>
            <div className="text-xs text-indigo-300">
              Promedio de {avgSleepHoursPerDay} horas / día
            </div>
          </div>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 flex justify-between">
            <span>{monthSleeps.length} sesiones de descanso</span>
            <span className="text-indigo-400 font-semibold">Desarrollo cognitivo</span>
          </div>
        </div>

        {/* Frecuencia media */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-900/20 via-slate-900 to-slate-900 border border-amber-500/30 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Ritmo de Alimentación
            </span>
            <span className="p-2 rounded-xl bg-amber-600/20 text-amber-400">
              <Clock size={18} />
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              cada {avgIntervalHours}h
            </div>
            <div className="text-xs text-amber-300">
              Intervalo medio entre tomas
            </div>
          </div>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 flex justify-between">
            <span>Rutina establecida</span>
            <span className="text-emerald-400 font-semibold">Excelente digestión</span>
          </div>
        </div>
      </div>

      {/* Breakdown Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Milk distribution */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
            <span>Distribución de Alimentación</span>
            <span className="text-xs text-slate-400">Mes seleccionado</span>
          </h4>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-blue-600 dark:text-blue-400">Fórmula Infantil</span>
                <span className="font-mono">{formulaPct}% ({formulaMl} ml)</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${formulaPct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-sky-500">Leche Materna</span>
                <span className="font-mono">{breastPct}% ({breastMl} ml)</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-sky-400 rounded-full" style={{ width: `${breastPct}%` }} />
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-xs text-slate-600 dark:text-slate-300 border border-blue-200/50 dark:border-blue-900/40">
            💡 <strong>Nota pediátrica:</strong> {pediatricNorms.intakePediatricNote}
          </div>
        </div>

        {/* Diaper & Hygiene insights */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
            <span>Higiene y Salud Digestiva</span>
            <span className="text-xs text-slate-400">Resumen mensual</span>
          </h4>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300">Total pañales mojados (Pipí)</span>
              <strong className="text-cyan-600 dark:text-cyan-400 font-mono text-sm">{wetCount}</strong>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300">Total deposiciones (Popó)</span>
              <strong className="text-amber-600 dark:text-amber-400 font-mono text-sm">{dirtyCount}</strong>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300">Paquetes de pañales consumidos aprox.</span>
              <strong className="text-blue-600 dark:text-blue-400 font-mono text-sm">
                ~{(totalDiapers / 32).toFixed(1)} paquetes
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
