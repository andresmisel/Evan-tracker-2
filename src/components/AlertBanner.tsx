import React from 'react';
import { AlertTriangle, PackageX, Calendar, ArrowRight, X } from 'lucide-react';
import { PurchaseProjection, MedicalRecord } from '../types';

interface AlertBannerProps {
  projections: PurchaseProjection[];
  upcomingMedical: MedicalRecord[];
  onOpenInventory: () => void;
  onOpenMedical: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  projections,
  upcomingMedical,
  onOpenInventory,
  onOpenMedical,
}) => {
  const [dismissed, setDismissed] = React.useState(false);

  const criticalSupplies = projections.filter((p) => p.status === 'critical');
  const lowSupplies = projections.filter((p) => p.status === 'low');
  
  // Pending appointments or vaccines within next 7 days
  const pendingNear = upcomingMedical.filter((m) => {
    if (m.status !== 'pending') return false;
    const itemDate = new Date(m.date);
    const now = new Date();
    const diffDays = (itemDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= -1 && diffDays <= 7;
  });

  if (dismissed || (criticalSupplies.length === 0 && pendingNear.length === 0 && lowSupplies.length === 0)) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-3">
      {criticalSupplies.length > 0 && (
        <div className="relative mb-2 overflow-hidden rounded-xl bg-gradient-to-r from-rose-600 via-rose-700 to-red-800 text-white p-3.5 shadow-lg shadow-rose-950/20 border border-rose-400/30">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm shrink-0">
                <PackageX size={20} className="text-white animate-bounce" />
              </div>
              <div className="text-xs sm:text-sm">
                <span className="font-bold tracking-wide uppercase text-rose-200">
                  ¡Alerta Crítica de Suministros!
                </span>{' '}
                <span>
                  Quedan muy pocas unidades de{' '}
                  <strong className="underline">
                    {criticalSupplies.map((s) => `${s.name} (${s.currentQuantity} ${s.unit})`).join(', ')}
                  </strong>
                  . Estimado de agotamiento en menos de 3 días.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onOpenInventory}
                className="px-3 py-1.5 rounded-lg bg-white text-rose-800 font-bold text-xs hover:bg-rose-50 transition-colors shadow flex items-center gap-1 cursor-pointer"
              >
                <span>Reponer</span>
                <ArrowRight size={13} />
              </button>
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="p-1 text-white/80 hover:text-white transition-colors cursor-pointer"
                aria-label="Cerrar alerta"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingNear.length > 0 && criticalSupplies.length === 0 && (
        <div className="relative mb-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-3 shadow-md border border-blue-400/30">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm">
              <Calendar size={18} className="text-blue-200 shrink-0" />
              <span>
                <strong>Próximo Recordatorio Médico:</strong> {pendingNear[0].title} para el{' '}
                {new Date(pendingNear[0].date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                {pendingNear[0].time ? ` a las ${pendingNear[0].time}` : ''}.
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenMedical}
              className="px-3 py-1 rounded-lg bg-blue-500/30 hover:bg-blue-500/50 text-white font-medium text-xs border border-white/20 transition-colors cursor-pointer shrink-0"
            >
              Ver Cita
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
