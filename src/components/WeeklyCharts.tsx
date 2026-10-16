import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Milk,
  Baby,
  Moon,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { FeedingRecord, DiaperRecord, SleepRecord } from '../types';
import { SparkleGlow } from './SparkleEffect';

interface WeeklyChartsProps {
  feedings: FeedingRecord[];
  diapers: DiaperRecord[];
  sleeps: SleepRecord[];
}

export const WeeklyCharts: React.FC<WeeklyChartsProps> = ({
  feedings,
  diapers,
  sleeps,
}) => {
  const [activeChart, setActiveChart] = useState<'feedings' | 'diapers' | 'sleep'>('feedings');

  // Compute 7 days labels and dates
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const isoDate = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('es-ES', { weekday: 'short' });
    const dayNum = d.getDate();
    return { isoDate, label: `${label} ${dayNum}` };
  });

  // Calculate Feedings data
  const feedingData = days.map((day) => {
    const dayLogs = feedings.filter((f) => f.timestamp.startsWith(day.isoDate));
    const formulaMl = dayLogs.filter((f) => f.type === 'formula' || f.type === 'mixed').reduce((sum, f) => sum + (f.amountMl || 0), 0);
    const breastMl = dayLogs.filter((f) => f.type === 'breast_bottle').reduce((sum, f) => sum + (f.amountMl || 0), 0);
    const totalMl = formulaMl + breastMl;
    const count = dayLogs.length;
    return { ...day, formulaMl, breastMl, totalMl, count };
  });

  const maxFeedingMl = Math.max(600, ...feedingData.map((d) => d.totalMl));
  const avgFeedingMl = Math.round(feedingData.reduce((sum, d) => sum + d.totalMl, 0) / 7);

  // Calculate Diaper data
  const diaperData = days.map((day) => {
    const dayLogs = diapers.filter((d) => d.timestamp.startsWith(day.isoDate));
    const wet = dayLogs.filter((d) => d.type === 'wet' || d.type === 'mixed').length;
    const dirty = dayLogs.filter((d) => d.type === 'dirty' || d.type === 'mixed').length;
    const total = dayLogs.length;
    return { ...day, wet, dirty, total };
  });

  const maxDiapers = Math.max(8, ...diaperData.map((d) => d.total));
  const avgDiapers = (diaperData.reduce((sum, d) => sum + d.total, 0) / 7).toFixed(1);

  // Calculate Sleep data
  const sleepData = days.map((day) => {
    const dayLogs = sleeps.filter((s) => s.startTime.startsWith(day.isoDate) || s.endTime.startsWith(day.isoDate));
    const napMins = dayLogs.filter((s) => s.sleepType === 'nap').reduce((sum, s) => sum + s.durationMinutes, 0);
    const nightMins = dayLogs.filter((s) => s.sleepType === 'night').reduce((sum, s) => sum + s.durationMinutes, 0);
    const totalHours = Number(((napMins + nightMins) / 60).toFixed(1));
    const napHours = Number((napMins / 60).toFixed(1));
    const nightHours = Number((nightMins / 60).toFixed(1));
    return { ...day, totalHours, napHours, nightHours };
  });

  const maxSleepHours = Math.max(16, ...sleepData.map((d) => d.totalHours));
  const avgSleepHours = (sleepData.reduce((sum, d) => sum + d.totalHours, 0) / 7).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header and selector */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200/70 dark:border-blue-900/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
            <BarChart3 size={24} />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Gráficos de Progreso Semanal</span>
              <SparkleGlow size={13} />
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tendencia de alimentación, pañales y descanso de los últimos 7 días
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveChart('feedings')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeChart === 'feedings'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Milk size={13} />
            <span>Tomas (ml)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveChart('diapers')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeChart === 'diapers'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Baby size={13} />
            <span>Pañales</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveChart('sleep')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeChart === 'sleep'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Moon size={13} />
            <span>Sueño (horas)</span>
          </button>
        </div>
      </div>

      {/* Active Chart Display */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        {/* Metric summary top line */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 text-xs">
          <div className="flex items-center gap-4">
            {activeChart === 'feedings' && (
              <>
                <div>
                  <span className="text-slate-400 block">Promedio diario:</span>
                  <strong className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {avgFeedingMl} ml / día
                  </strong>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-blue-600 inline-block" />
                    <span className="text-slate-600 dark:text-slate-300">Fórmula</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-sky-400 inline-block" />
                    <span className="text-slate-600 dark:text-slate-300">Leche Materna</span>
                  </div>
                </div>
              </>
            )}

            {activeChart === 'diapers' && (
              <>
                <div>
                  <span className="text-slate-400 block">Promedio diario:</span>
                  <strong className="text-sm font-bold text-cyan-600 dark:text-cyan-400">
                    {avgDiapers} pañales / día
                  </strong>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-cyan-500 inline-block" />
                    <span className="text-slate-600 dark:text-slate-300">Pipí 💧</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
                    <span className="text-slate-600 dark:text-slate-300">Popó 💩</span>
                  </div>
                </div>
              </>
            )}

            {activeChart === 'sleep' && (
              <>
                <div>
                  <span className="text-slate-400 block">Promedio diario:</span>
                  <strong className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {avgSleepHours} horas / día
                  </strong>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-indigo-600 inline-block" />
                    <span className="text-slate-600 dark:text-slate-300">Noche 🌙</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-amber-400 inline-block" />
                    <span className="text-slate-600 dark:text-slate-300">Siestas 🌤️</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Visual Bar Graph (Responsive SVG) */}
        <div className="pt-2">
          {activeChart === 'feedings' && (
            <div className="h-64 flex items-end justify-between gap-2 sm:gap-4 px-2">
              {feedingData.map((d, idx) => {
                const heightPct = Math.min(100, Math.max(8, (d.totalMl / maxFeedingMl) * 100));
                return (
                  <div key={d.isoDate} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 opacity-80 group-hover:opacity-100 font-mono">
                      {d.totalMl}ml
                    </div>

                    <div className="w-full max-w-[42px] bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex flex-col justify-end p-0.5" style={{ height: '75%' }}>
                      <div
                        className="w-full bg-gradient-to-t from-blue-700 via-blue-600 to-sky-400 rounded-lg transition-all duration-500 group-hover:brightness-110 shadow-sm"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>

                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                      {d.label}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeChart === 'diapers' && (
            <div className="h-64 flex items-end justify-between gap-2 sm:gap-4 px-2">
              {diaperData.map((d) => {
                const heightPct = Math.min(100, Math.max(10, (d.total / maxDiapers) * 100));
                return (
                  <div key={d.isoDate} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 font-mono">
                      {d.total}
                    </div>

                    <div className="w-full max-w-[42px] bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex flex-col justify-end p-0.5" style={{ height: '75%' }}>
                      <div
                        className="w-full bg-gradient-to-t from-cyan-600 to-blue-500 rounded-lg transition-all duration-500 group-hover:brightness-110 shadow-sm"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>

                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                      {d.label}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeChart === 'sleep' && (
            <div className="h-64 flex items-end justify-between gap-2 sm:gap-4 px-2">
              {sleepData.map((d) => {
                const heightPct = Math.min(100, Math.max(10, (d.totalHours / maxSleepHours) * 100));
                return (
                  <div key={d.isoDate} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                      {d.totalHours}h
                    </div>

                    <div className="w-full max-w-[42px] bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex flex-col justify-end p-0.5" style={{ height: '75%' }}>
                      <div
                        className="w-full bg-gradient-to-t from-indigo-700 via-indigo-600 to-blue-500 rounded-lg transition-all duration-500 group-hover:brightness-110 shadow-sm"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>

                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                      {d.label}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
