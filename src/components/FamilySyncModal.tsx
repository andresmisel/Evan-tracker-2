import React, { useState } from 'react';
import {
  Users,
  Copy,
  Check,
  Smartphone,
  Cloud,
  Baby,
  Share2,
  RefreshCw,
  Sparkles,
  Wifi,
} from 'lucide-react';
import { FamilyProfile } from '../types';
import { SparkleGlow } from './SparkleEffect';

interface FamilySyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  family: FamilyProfile;
  onUpdateFamily: (family: FamilyProfile) => void;
  currentCaregiver: string;
  setCurrentCaregiver: (caregiver: string) => void;
  isCloudConnected?: boolean;
  onSyncNow?: () => Promise<{ success: boolean; syncedCount: number; message?: string }>;
}

export const FamilySyncModal: React.FC<FamilySyncModalProps> = ({
  isOpen,
  onClose,
  family,
  onUpdateFamily,
  currentCaregiver,
  setCurrentCaregiver,
  onSyncNow,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [babyName, setBabyName] = useState(family.babyName);
  const [babyBirthDate, setBabyBirthDate] = useState(family.babyBirthDate);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(family.familyCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const handleCopyAppUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 3000);
  };

  const handleManualSync = async () => {
    if (!onSyncNow) return;
    setIsSyncing(true);
    setSyncStatusMsg(null);
    try {
      const res = await onSyncNow();
      if (res.success) {
        setSyncStatusMsg(res.message || `¡Sincronización exitosa! ${res.syncedCount} registros actualizados en la nube.`);
      } else {
        setSyncStatusMsg(res.message || 'Error al conectar con la base de datos.');
      }
    } catch {
      setSyncStatusMsg('Error de red al sincronizar. Revisa tu conexión a internet.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateFamily({
      ...family,
      babyName: babyName.trim(),
      babyBirthDate,
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-blue-500/40 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
              <Users size={22} />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Sincronización Multi-Dispositivo</span>
                <SparkleGlow size={14} />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tus datos siempre respaldados y conectados en tiempo real
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Live status badge */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-blue-500/10 to-emerald-500/15 border border-emerald-500/40 flex items-start sm:items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <span>Sincronización en la Nube Siempre Activa</span>
                <Wifi size={13} className="text-emerald-500" />
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300">
                Cada toma, pañal, sueño y vacuna se guarda directamente en Firestore y se actualiza al instante en todos tus teléfonos y computadoras.
              </div>
            </div>
          </div>
          <Cloud size={22} className="text-emerald-500 shrink-0 hidden sm:block" />
        </div>

        {/* Botón Forzar Sincronización */}
        <div className="p-4 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <RefreshCw size={14} className="text-blue-500" />
              <span>Forzar Sincronización Manual</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-full">
              Bidireccional
            </span>
          </div>

          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
            Si agregaste información desde otro dispositivo o sin internet y quieres forzar una actualización completa inmediata de ambos sentidos, presiona este botón:
          </p>

          <button
            type="button"
            disabled={isSyncing}
            onClick={handleManualSync}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-600/30 transition-all disabled:opacity-60"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Sincronizando con la nube...' : 'Forzar Sincronización Ahora'}</span>
          </button>

          {syncStatusMsg && (
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium animate-fade-in flex items-center gap-1.5">
              <Check size={14} className="shrink-0 text-emerald-500" />
              <span>{syncStatusMsg}</span>
            </div>
          )}
        </div>

        {/* Share App Link & Family Code */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Smartphone size={14} className="text-blue-500" />
              <span>Abrir en tu Celular o con tu Pareja</span>
            </span>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Copia el enlace de esta aplicación para abrirlo en el navegador de tu celular (o enviarlo a tu pareja por WhatsApp). Todos los dispositivos verán y guardarán la misma información automáticamente:
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyAppUrl}
              className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 hover:border-blue-500 text-blue-600 dark:text-blue-400 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
            >
              {copiedUrl ? <Check size={15} className="text-emerald-500" /> : <Share2 size={15} />}
              <span>{copiedUrl ? '¡Enlace copiado al portapapeles!' : 'Copiar enlace para abrir en el celular'}</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Código familiar: <strong className="text-blue-600 dark:text-blue-300">{family.familyCode}</strong>
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              {copiedCode ? <Check size={12} /> : <Copy size={12} />}
              <span>{copiedCode ? 'Copiado' : 'Copiar código'}</span>
            </button>
          </div>
        </div>

        {/* Baby Details Config */}
        <form onSubmit={handleSaveProfile} className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Baby size={14} className="text-blue-500" />
            <span>Datos del Bebé</span>
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombre del Bebé
              </label>
              <input
                type="text"
                required
                value={babyName}
                onChange={(e) => setBabyName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fecha de Nacimiento
              </label>
              <input
                type="date"
                required
                value={babyBirthDate}
                onChange={(e) => setBabyBirthDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

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
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 cursor-pointer"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
