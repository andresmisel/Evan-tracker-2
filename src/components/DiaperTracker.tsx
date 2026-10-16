import React, { useState } from 'react';
import {
  Baby,
  Plus,
  Trash2,
  Droplet,
  ShieldAlert,
  Sparkles,
  Info,
  CheckCircle,
  Package,
} from 'lucide-react';
import { DiaperRecord, DiaperType, PoopColor, PoopConsistency, InventoryItem } from '../types';
import { SparkleGlow } from './SparkleEffect';

interface DiaperTrackerProps {
  diapers: DiaperRecord[];
  inventory: InventoryItem[];
  onSaveDiaper: (diaper: DiaperRecord) => void;
  onDeleteDiaper: (id: string) => void;
  currentCaregiver: string;
}

export const DiaperTracker: React.FC<DiaperTrackerProps> = ({
  diapers,
  inventory,
  onSaveDiaper,
  onDeleteDiaper,
  currentCaregiver,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [type, setType] = useState<DiaperType>('wet');
  const [color, setColor] = useState<PoopColor>('mustard');
  const [consistency, setConsistency] = useState<PoopConsistency>('soft');
  const [creamApplied, setCreamApplied] = useState<boolean>(false);
  const [customTime, setCustomTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const diaperInventoryItems = inventory.filter((i) => i.category === 'diapers');
  const [selectedDiaperItemId, setSelectedDiaperItemId] = useState<string>(() => {
    return diaperInventoryItems[0]?.id || '';
  });

  const today = new Date().toISOString().split('T')[0];
  const todayDiapers = diapers.filter((d) => d.timestamp.startsWith(today));
  const wetCount = todayDiapers.filter((d) => d.type === 'wet' || d.type === 'mixed').length;
  const dirtyCount = todayDiapers.filter((d) => d.type === 'dirty' || d.type === 'mixed').length;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const timestamp = customTime ? new Date(customTime).toISOString() : new Date().toISOString();

    const chosenItem = diaperInventoryItems.find((i) => i.id === selectedDiaperItemId) || diaperInventoryItems[0];

    const newRecord: DiaperRecord = {
      id: `diaper-${Date.now()}`,
      familyId: 'evan-family-main',
      type,
      color: type === 'dirty' || type === 'mixed' ? color : undefined,
      consistency: type === 'dirty' || type === 'mixed' ? consistency : undefined,
      creamApplied,
      diaperSize: chosenItem ? (chosenItem.sizeOrDetail || chosenItem.name) : 'Talla estándar',
      deductedDiaperItemId: chosenItem?.id,
      timestamp,
      notes: notes.trim(),
      loggedBy: currentCaregiver,
      createdAt: new Date().toISOString(),
    };

    onSaveDiaper(newRecord);
    setShowAddForm(false);
    setNotes('');
    setCreamApplied(false);
  };

  const poopColors: { id: PoopColor; label: string; bg: string }[] = [
    { id: 'mustard', label: 'Mostaza', bg: 'bg-amber-400' },
    { id: 'brown', label: 'Marrón', bg: 'bg-amber-800' },
    { id: 'green', label: 'Verde', bg: 'bg-emerald-700' },
    { id: 'yellow', label: 'Amarillo', bg: 'bg-yellow-300' },
  ];

  const consistencies: { id: PoopConsistency; label: string }[] = [
    { id: 'liquid', label: 'Líquida' },
    { id: 'soft', label: 'Blanda' },
    { id: 'pasty', label: 'Pastosa' },
    { id: 'seedy', label: 'Grumosa' },
  ];

  return (
    <div className="space-y-4">
      {/* Summary card & Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200/70 dark:border-blue-900/40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-cyan-600/10 dark:bg-cyan-600/20 text-cyan-600 dark:text-cyan-400">
            <Baby size={24} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-slate-900 dark:text-white">Cambios de Pañal</h3>
              <SparkleGlow size={13} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hoy: <strong className="text-cyan-600 dark:text-cyan-400 font-bold">{todayDiapers.length} cambios</strong> ({wetCount} pipí 💧, {dirtyCount} popó 💩)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!selectedDiaperItemId && diaperInventoryItems.length > 0) {
              setSelectedDiaperItemId(diaperInventoryItems[0].id);
            }
            setShowAddForm(!showAddForm);
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-semibold text-xs sm:text-sm shadow-md shadow-cyan-900/30 transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>{showAddForm ? 'Cerrar Registro' : 'Nuevo Pañal'}</span>
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <form
          onSubmit={handleSave}
          className="p-4 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-cyan-500/30 shadow-lg space-y-4 animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Registrar Cambio de Pañal</span>
              <Sparkles size={14} className="text-cyan-400" />
            </h4>
            <span className="text-xs text-slate-400">Por: {currentCaregiver}</span>
          </div>

          {/* Diaper Selection by Size & Inventory */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              ¿Qué pañal del inventario usaste? (Selecciona la talla a descontar)
            </label>
            {diaperInventoryItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {diaperInventoryItems.map((item) => {
                  const isSelected = selectedDiaperItemId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedDiaperItemId(item.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/50 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-cyan-400'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{item.name}</span>
                          {isSelected && <span className="text-cyan-500 font-bold">✓</span>}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {item.sizeOrDetail || 'Pañal'}
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                            item.currentQuantity <= item.criticalThreshold
                              ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                              : 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300'
                          }`}
                        >
                          {item.currentQuantity} disp.
                        </span>
                        <span className="block text-[10px] text-emerald-500 font-semibold mt-0.5">
                          -1 al guardar
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-slate-400 p-2">
                No hay pañales en el inventario. Agrega pañales por talla en la pestaña Stock.
              </div>
            )}
          </div>

          {/* Type selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tipo de Pañal
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'wet', label: 'Solo Pipí', icon: '💧' },
                { id: 'dirty', label: 'Solo Popó', icon: '💩' },
                { id: 'mixed', label: 'Mixto (Ambos)', icon: '💧+💩' },
                { id: 'clean', label: 'Limpio / Revisión', icon: '✨' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setType(opt.id as DiaperType)}
                  className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    type === opt.id
                      ? 'bg-cyan-700 text-white border-cyan-700 shadow-md font-bold'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-cyan-400'
                  }`}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Details if dirty or mixed */}
          {(type === 'dirty' || type === 'mixed') && (
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Color de Popó
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {poopColors.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setColor(c.id)}
                      className={`p-2 rounded-lg border text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        color === c.id
                          ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950 font-bold'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${c.bg} shrink-0 ring-1 ring-white/50`} />
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Consistencia
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {consistencies.map((cons) => (
                    <button
                      key={cons.id}
                      type="button"
                      onClick={() => setConsistency(cons.id)}
                      className={`p-2 rounded-lg border text-xs text-center cursor-pointer transition-all ${
                        consistency === cons.id
                          ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-200 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {cons.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Cream & Auto-deduct notice */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-900/40 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={creamApplied}
                onChange={(e) => setCreamApplied(e.target.checked)}
                className="rounded accent-blue-600 h-4 w-4 cursor-pointer"
              />
              <span className="font-medium text-slate-800 dark:text-slate-200">
                Se aplicó crema antipañalitis protectora
              </span>
            </label>

            <span className="text-[11px] text-cyan-600 dark:text-cyan-400 flex items-center gap-1 font-semibold">
              <Info size={13} />
              <span>Descuenta automáticamente 1 pañal de la talla elegida</span>
            </span>
          </div>

          {/* Time & notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hora del Cambio
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
                Notas (ej. irritación, gases, etc.)
              </label>
              <input
                type="text"
                placeholder="Observaciones..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Buttons */}
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
              className="px-5 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-cyan-900/30 cursor-pointer"
            >
              Guardar y Descontar Pañal
            </button>
          </div>
        </form>
      )}

      {/* History */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-sm">
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Historial Reciente de Pañales
          </h4>
          <span className="text-xs text-slate-400">{diapers.length} registros</span>
        </div>

        {diapers.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs sm:text-sm">
            No hay cambios de pañal registrados todavía.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-96 overflow-y-auto">
            {diapers.slice(0, 30).map((d) => {
              const date = new Date(d.timestamp);
              const isToday = d.timestamp.startsWith(today);
              const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
              const dateStr = date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });

              return (
                <div
                  key={d.id}
                  className="p-3 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 text-base">
                      {d.type === 'wet' ? '💧' : d.type === 'dirty' ? '💩' : d.type === 'mixed' ? '💧💩' : '✨'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">
                          {d.type === 'wet'
                            ? 'Pipí'
                            : d.type === 'dirty'
                            ? 'Popó'
                            : d.type === 'mixed'
                            ? 'Pipí y Popó (Mixto)'
                            : 'Limpio'}
                        </span>

                        {d.diaperSize && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 font-bold border border-cyan-300/40">
                            {d.diaperSize}
                          </span>
                        )}

                        {d.color && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-medium">
                            Color: {d.color}
                          </span>
                        )}

                        {d.creamApplied && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium">
                            + Crema
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{isToday ? `Hoy a las ${timeStr}` : `${dateStr}, ${timeStr}`}</span>
                        <span>•</span>
                        <span className="text-cyan-500 font-medium">{d.loggedBy}</span>
                        {d.notes && (
                          <>
                            <span>•</span>
                            <span className="italic truncate max-w-[150px] sm:max-w-xs">{d.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteDiaper(d.id)}
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
