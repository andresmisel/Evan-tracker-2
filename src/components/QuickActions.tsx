import React, { useState, useEffect } from 'react';
import {
  Milk,
  Baby,
  Moon,
  Sun,
  Plus,
  Play,
  Square,
  Sparkles,
  Droplet,
  CheckCircle,
  Clock,
  Package,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SparkleGlow } from './SparkleEffect';
import { InventoryItem } from '../types';

interface QuickActionsProps {
  onQuickFeed: (type: 'formula' | 'breast_bottle', ml: number) => void;
  onQuickDiaper: (type: 'wet' | 'dirty' | 'mixed', diaperItemId?: string) => void;
  inventory: InventoryItem[];
  activeSleep: { startTime: string } | null;
  onStartSleep: () => void;
  onStopSleep: () => void;
  onOpenFeedModal: () => void;
  onOpenDiaperModal: () => void;
  onOpenSleepModal: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onQuickFeed,
  onQuickDiaper,
  inventory,
  activeSleep,
  onStartSleep,
  onStopSleep,
  onOpenFeedModal,
  onOpenDiaperModal,
  onOpenSleepModal,
}) => {
  const [elapsedSleep, setElapsedSleep] = useState<string>('00:00:00');
  const [lastActionToast, setLastActionToast] = useState<string | null>(null);
  const [diaperModalType, setDiaperModalType] = useState<'wet' | 'dirty' | null>(null);

  const diaperItems = inventory.filter((i) => i.category === 'diapers');

  // Live timer for active sleep
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
      setElapsedSleep(`${pad(hours)}:${pad(mins)}:${pad(secs)}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSleep]);

  const showToast = (msg: string) => {
    setLastActionToast(msg);
    setTimeout(() => setLastActionToast(null), 3500);
  };

  const handleQuickFeed = (type: 'formula' | 'breast_bottle', ml: number) => {
    onQuickFeed(type, ml);
    confetti({
      particleCount: 25,
      spread: 40,
      origin: { y: 0.8 },
      colors: ['#3b82f6', '#60a5fa', '#93c5fd'],
    });
    showToast(`🍼 Toma registrada: ${ml} ml de ${type === 'formula' ? 'Fórmula' : 'Materna'}`);
  };

  const handleSelectDiaperAndDeduct = (item: InventoryItem) => {
    if (!diaperModalType) return;
    const typeLabel = diaperModalType === 'wet' ? 'Pipí 💧' : 'Popó 💩';
    onQuickDiaper(diaperModalType, item.id);
    setDiaperModalType(null);

    const remaining = Math.max(0, item.currentQuantity - 1);
    confetti({
      particleCount: 20,
      spread: 35,
      origin: { y: 0.8 },
      colors: ['#06b6d4', '#3b82f6', '#10b981'],
    });
    showToast(`🧷 Pañal ${typeLabel} registrado: 1 descontado de ${item.name} (Quedan ${remaining})`);
  };

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-blue-900/40 via-slate-900/60 to-slate-950 p-4 sm:p-6 border border-blue-600/30 shadow-xl shadow-blue-950/40 backdrop-blur-xl">
      {/* Decorative ambient royal glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400">
            <SparkleGlow size={16} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-1.5">
              Acceso Rápido en 1 Toque
              <span className="text-xs font-normal text-blue-300">| Descuento Inmediato</span>
            </h2>
            <p className="text-xs text-slate-400">Registra tomas, pañales o sueño descontando inventario</p>
          </div>
        </div>

        {lastActionToast && (
          <div className="animate-fade-in flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-full text-xs font-medium">
            <CheckCircle size={13} />
            <span>{lastActionToast}</span>
          </div>
        )}
      </div>

      {/* Quick Action Grid */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Quick Feed Formula */}
        <div className="group relative flex flex-col justify-between p-3 sm:p-4 rounded-xl bg-slate-900/90 dark:bg-slate-900/90 border border-blue-500/20 hover:border-blue-500/60 transition-all hover:shadow-lg hover:shadow-blue-600/20">
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-blue-600/20 text-blue-400 group-hover:scale-110 transition-transform">
              <Milk size={20} />
            </span>
            <button
              type="button"
              onClick={onOpenFeedModal}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium underline cursor-pointer"
            >
              Detallado
            </button>
          </div>
          <div className="mb-2">
            <div className="text-xs font-semibold text-white">Biberón Rápido</div>
            <div className="text-[11px] text-slate-400">120 ml (4.0 oz)</div>
          </div>
          <button
            type="button"
            onClick={() => handleQuickFeed('formula', 120)}
            className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white font-semibold text-xs transition-all shadow-md shadow-blue-800/40 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus size={14} />
            <span>+ 120 ml Fórmula</span>
          </button>
        </div>

        {/* Quick Wet Diaper */}
        <div className="group relative flex flex-col justify-between p-3 sm:p-4 rounded-xl bg-slate-900/90 border border-cyan-500/20 hover:border-cyan-500/60 transition-all hover:shadow-lg hover:shadow-cyan-600/20">
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-cyan-600/20 text-cyan-400 group-hover:scale-110 transition-transform">
              <Droplet size={20} />
            </span>
            <button
              type="button"
              onClick={onOpenDiaperModal}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium underline cursor-pointer"
            >
              Detallado
            </button>
          </div>
          <div className="mb-2">
            <div className="text-xs font-semibold text-white">Pañal Mojado</div>
            <div className="text-[11px] text-slate-400">Pregunta talla y descuenta</div>
          </div>
          <button
            type="button"
            onClick={() => setDiaperModalType('wet')}
            className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-700 to-blue-600 hover:from-cyan-600 hover:to-blue-500 text-white font-semibold text-xs transition-all shadow-md shadow-cyan-900/30 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus size={14} />
            <span>+ Pipí 💧</span>
          </button>
        </div>

        {/* Quick Dirty Diaper */}
        <div className="group relative flex flex-col justify-between p-3 sm:p-4 rounded-xl bg-slate-900/90 border border-amber-500/20 hover:border-amber-500/60 transition-all hover:shadow-lg hover:shadow-amber-600/20">
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-amber-600/20 text-amber-400 group-hover:scale-110 transition-transform">
              <Baby size={20} />
            </span>
            <button
              type="button"
              onClick={onOpenDiaperModal}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium underline cursor-pointer"
            >
              Detallado
            </button>
          </div>
          <div className="mb-2">
            <div className="text-xs font-semibold text-white">Pañal Sucio</div>
            <div className="text-[11px] text-slate-400">Pregunta talla y descuenta</div>
          </div>
          <button
            type="button"
            onClick={() => setDiaperModalType('dirty')}
            className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white font-semibold text-xs transition-all shadow-md shadow-amber-900/30 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus size={14} />
            <span>+ Popó 💩</span>
          </button>
        </div>

        {/* Live Sleep Stopwatch */}
        <div className={`relative flex flex-col justify-between p-3 sm:p-4 rounded-xl transition-all border ${
          activeSleep
            ? 'bg-indigo-950/90 border-indigo-500 shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400/40'
            : 'bg-slate-900/90 border-indigo-500/20 hover:border-indigo-500/60'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`p-2 rounded-xl ${activeSleep ? 'bg-indigo-600 text-white animate-pulse' : 'bg-indigo-600/20 text-indigo-400'}`}>
              <Moon size={20} />
            </span>
            <button
              type="button"
              onClick={onOpenSleepModal}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium underline cursor-pointer"
            >
              Historial
            </button>
          </div>

          <div className="mb-2">
            <div className="text-xs font-semibold text-white flex items-center gap-1">
              {activeSleep ? 'Durmiendo ahora' : 'Cronómetro Sueño'}
            </div>
            <div className="text-[12px] font-mono font-bold text-indigo-300">
              {activeSleep ? elapsedSleep : '00:00:00'}
            </div>
          </div>

          {activeSleep ? (
            <button
              type="button"
              onClick={onStopSleep}
              className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-950/40 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Sun size={14} />
              <span>Despertar</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onStartSleep}
              className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-indigo-700 to-blue-700 hover:from-indigo-600 hover:to-blue-600 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-900/30 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Play size={14} />
              <span>Dormir a Evan</span>
            </button>
          )}
        </div>
      </div>

      {/* Size Selection Modal when marking diaper */}
      {diaperModalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-5 border border-cyan-500/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-cyan-600/20 text-cyan-500">
                  <Baby size={18} />
                </span>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    ¿Qué pañal usaste?
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {diaperModalType === 'wet' ? 'Cambio de Pipí 💧' : 'Cambio de Popó 💩'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDiaperModalType(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Selecciona la talla para descontar <strong>1 pañal</strong> de tu inventario inmediatamente:
            </p>

            <div className="space-y-2">
              {diaperItems.length > 0 ? (
                diaperItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectDiaperAndDeduct(item)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:border-cyan-500 hover:bg-cyan-500/10 text-left transition-all flex items-center justify-between gap-3 cursor-pointer group active:scale-98"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-cyan-400">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {item.sizeOrDetail || 'Pañales'}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                        item.currentQuantity <= item.criticalThreshold
                          ? 'bg-rose-500/20 text-rose-500'
                          : 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300'
                      }`}>
                        {item.currentQuantity} disp.
                      </span>
                      <span className="block text-[10px] text-emerald-500 font-semibold mt-0.5">
                        → Quedarán {Math.max(0, item.currentQuantity - 1)}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-3 text-xs text-slate-400 text-center">
                  No hay pañales en el inventario. Agrega uno en la pestaña Stock.
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setDiaperModalType(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
