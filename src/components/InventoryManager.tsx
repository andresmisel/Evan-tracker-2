import React, { useState } from 'react';
import {
  Package,
  Plus,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Calendar,
  ShoppingCart,
  Copy,
  Check,
  Edit2,
  Trash2,
  Sparkles,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { InventoryItem, PurchaseProjection, InventoryCategory } from '../types';
import { SparkleGlow } from './SparkleEffect';

interface InventoryManagerProps {
  inventory: InventoryItem[];
  projections: PurchaseProjection[];
  onUpdateQuantity: (id: string, newQty: number) => void;
  onSaveItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
  autoDeductEnabled: boolean;
  onToggleAutoDeduct: (val: boolean) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  inventory,
  projections,
  onUpdateQuantity,
  onSaveItem,
  onDeleteItem,
  autoDeductEnabled,
  onToggleAutoDeduct,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [copiedList, setCopiedList] = useState(false);

  // New item form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InventoryCategory>('diapers');
  const [quantity, setQuantity] = useState<number>(30);
  const [unit, setUnit] = useState('pañales');
  const [minThreshold, setMinThreshold] = useState<number>(15);
  const [criticalThreshold, setCriticalThreshold] = useState<number>(8);
  const [sizeOrDetail, setSizeOrDetail] = useState('');

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setQuantity(item.currentQuantity);
    setUnit(item.unit);
    setMinThreshold(item.minThreshold);
    setCriticalThreshold(item.criticalThreshold);
    setSizeOrDetail(item.sizeOrDetail || '');
    setShowAddModal(true);
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setName('');
    setCategory('diapers');
    setQuantity(30);
    setUnit('pañales');
    setMinThreshold(15);
    setCriticalThreshold(8);
    setSizeOrDetail('');
    setShowAddModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const itemToSave: InventoryItem = {
      id: editingItem ? editingItem.id : `inv-${Date.now()}`,
      familyId: 'evan-family-main',
      name: name.trim(),
      category,
      currentQuantity: Number(quantity),
      unit: unit.trim(),
      minThreshold: Number(minThreshold),
      criticalThreshold: Number(criticalThreshold),
      sizeOrDetail: sizeOrDetail.trim(),
      autoDeductEnabled: true,
      updatedAt: new Date().toISOString(),
    };

    onSaveItem(itemToSave);
    setShowAddModal(false);
  };

  const handleCopyShoppingList = () => {
    const listLines = projections.map((p) => {
      const urgency = p.status === 'critical' ? '🔴 ¡URGENTE!' : p.status === 'low' ? '🟡 PRONTO' : '🟢 OK';
      return `• ${p.name}: Quedan ${p.currentQuantity} ${p.unit} (Agotamiento: ${p.depletionDate}) -> Comprar sugerido: ${p.recommendedBuyFor15Days} ${p.unit} (${urgency})`;
    });

    const textToCopy = `🛒 *LISTA DE COMPRAS - EVAN TRACKER*\nFecha: ${new Date().toLocaleDateString('es-ES')}\n\n${listLines.join(
      '\n'
    )}\n\n_Generado automáticamente según el consumo registrado de Evan._`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedList(true);
    setTimeout(() => setCopiedList(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Auto-Deduct Controls */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200/70 dark:border-blue-900/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
              <Package size={22} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Inventario y Proyecciones de Compra</span>
                <SparkleGlow size={13} />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Descuento automático de pañales y fórmula al registrar consumos
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Auto Deduct Switch */}
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-blue-50 dark:bg-blue-950/50 px-3 py-2 rounded-xl border border-blue-200/60 dark:border-blue-800/40 cursor-pointer">
            <input
              type="checkbox"
              checked={autoDeductEnabled}
              onChange={(e) => onToggleAutoDeduct(e.target.checked)}
              className="rounded accent-blue-600 h-4 w-4"
            />
            <span>Descuento Automático Activo</span>
          </label>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>+ Nuevo Artículo</span>
          </button>
        </div>
      </div>

      {/* Supplies Grid */}
      {inventory.length === 0 ? (
        <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Package size={28} />
          </div>
          <div>
            <h4 className="font-bold text-base text-slate-800 dark:text-slate-100">
              Inventario vacío (0 artículos)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
              Registra los productos que compraste para Evan (pañales, latas de fórmula, toallitas) y la app llevará la cuenta exacta y te dirá cuándo volver a comprar.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Agregar Primer Producto</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {inventory.map((item) => {
          const proj = projections.find((p) => p.itemId === item.id);
          const isCritical = item.currentQuantity <= item.criticalThreshold;
          const isLow = !isCritical && item.currentQuantity <= item.minThreshold;

          return (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                isCritical
                  ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-400/80 shadow-md shadow-rose-900/10 ring-1 ring-rose-400/30'
                  : isLow
                  ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-400/80 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {item.category === 'diapers'
                        ? 'Pañales'
                        : item.category === 'formula'
                        ? 'Fórmula'
                        : item.category === 'wipes'
                        ? 'Toallitas'
                        : item.category === 'cream'
                        ? 'Cuidado'
                        : 'Medicamento'}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                      {item.name}
                    </h4>
                    {item.sizeOrDetail && (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        {item.sizeOrDetail}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
                      title="Editar suministro"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                      title="Eliminar suministro"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-2 mb-3">
                  {isCritical ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-700 dark:text-rose-300 text-[11px] font-bold">
                      <AlertTriangle size={12} />
                      ¡Stock Crítico!
                    </span>
                  ) : isLow ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-[11px] font-bold">
                      <AlertTriangle size={12} />
                      Nivel Bajo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                      <CheckCircle2 size={12} />
                      Stock Saludable
                    </span>
                  )}
                </div>

                {/* Big Stock Counter */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 mb-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                      {item.currentQuantity}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {item.unit} disponibles
                    </span>
                  </div>

                  {proj && proj.daysRemaining < 999 && (
                    <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>Consumo: ~{proj.dailyConsumption}/día</span>
                      <strong className={isCritical ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}>
                        Rinde ~{proj.daysRemaining} días ({proj.depletionDate})
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Restock Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(item.id, Math.max(0, item.currentQuantity - 1))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                  title="Restar 1"
                >
                  -1
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(item.id, item.currentQuantity + 1)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                  title="Sumar 1"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateQuantity(
                      item.id,
                      item.currentQuantity + (item.category === 'diapers' ? 30 : item.category === 'wipes' ? 3 : 1)
                    )
                  }
                  className="flex-1 py-1.5 px-3 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-xs font-bold transition-colors cursor-pointer text-center"
                >
                  + {item.category === 'diapers' ? '30 Pañales' : item.category === 'wipes' ? '3 Paquetes' : '1 Unidad'}
                </button>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Projections & Smart Shopping Assistant */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 text-white border border-blue-500/40 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-800/40 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/30 text-blue-300">
              <ShoppingCart size={22} />
            </div>
            <div>
              <h4 className="font-bold text-sm sm:text-base flex items-center gap-1.5">
                <span>Asistente de Proyecciones de Compra de Evan</span>
                <Sparkles size={14} className="text-blue-400" />
              </h4>
              <p className="text-xs text-blue-200/80">
                Cálculo predictivo según el ritmo de consumo real de los últimos días
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyShoppingList}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-900/40 transition-all cursor-pointer"
          >
            {copiedList ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
            <span>{copiedList ? '¡Lista Copiada al Portapapeles!' : 'Copiar Lista para WhatsApp'}</span>
          </button>
        </div>

        {/* Projection summary table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-blue-300/80 border-b border-blue-800/30">
                <th className="pb-2 font-semibold">Artículo</th>
                <th className="pb-2 font-semibold">Stock Actual</th>
                <th className="pb-2 font-semibold">Consumo Diario</th>
                <th className="pb-2 font-semibold">Días Restantes</th>
                <th className="pb-2 font-semibold">Fecha de Agotamiento</th>
                <th className="pb-2 font-semibold">Comprar para 15 días</th>
                <th className="pb-2 font-semibold">Comprar para 1 mes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-800/20 text-slate-200">
              {projections.map((p) => (
                <tr key={p.itemId} className="hover:bg-blue-900/20">
                  <td className="py-2.5 font-bold flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        p.status === 'critical'
                          ? 'bg-rose-400 animate-ping'
                          : p.status === 'low'
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                    />
                    <span>{p.name}</span>
                  </td>
                  <td className="py-2.5 font-mono font-semibold">
                    {p.currentQuantity} {p.unit}
                  </td>
                  <td className="py-2.5 text-blue-300 font-mono">~{p.dailyConsumption} / día</td>
                  <td className="py-2.5">
                    <span
                      className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                        p.daysRemaining <= 3
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : p.daysRemaining <= 7
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {p.daysRemaining >= 999 ? 'Largo plazo' : `${p.daysRemaining} días`}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-300">{p.depletionDate}</td>
                  <td className="py-2.5 font-bold text-blue-300">
                    +{p.recommendedBuyFor15Days} {p.unit}
                  </td>
                  <td className="py-2.5 font-bold text-emerald-300">
                    +{p.recommendedBuyFor30Days} {p.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleSave}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-blue-500/40 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h4 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{editingItem ? 'Editar Suministro' : 'Nuevo Suministro'}</span>
                <Sparkles size={14} className="text-blue-500" />
              </h4>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombre del Artículo
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Pañales Talla 2 Confort Sec"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Categoría
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as InventoryCategory)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="diapers">Pañales</option>
                  <option value="formula">Fórmula</option>
                  <option value="wipes">Toallitas</option>
                  <option value="cream">Crema</option>
                  <option value="medicine">Medicamento</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Unidad de Medida
                </label>
                <input
                  type="text"
                  placeholder="ej. pañales, latas, paquetes"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cantidad Actual
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Alerta Baja
                </label>
                <input
                  type="number"
                  required
                  value={minThreshold}
                  onChange={(e) => setMinThreshold(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Alerta Crítica
                </label>
                <input
                  type="number"
                  required
                  value={criticalThreshold}
                  onChange={(e) => setCriticalThreshold(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Detalle / Tamaño (Opcional)
              </label>
              <input
                type="text"
                placeholder="ej. Talla 2 (4-8 kg), Lata 800g"
                value={sizeOrDetail}
                onChange={(e) => setSizeOrDetail(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 cursor-pointer"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
