import React, { useState } from 'react';
import {
  Users,
  Copy,
  Check,
  Smartphone,
  Cloud,
  LogOut,
  Sparkles,
  Shield,
  Key,
  Baby,
} from 'lucide-react';
import { FamilyProfile } from '../types';
import { auth, googleProvider, signInWithPopup, signOut } from '../lib/firebase';
import { SparkleGlow } from './SparkleEffect';
import { Share2, RefreshCw } from 'lucide-react';

interface FamilySyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  family: FamilyProfile;
  onUpdateFamily: (family: FamilyProfile) => void;
  currentCaregiver: string;
  setCurrentCaregiver: (caregiver: string) => void;
  isCloudConnected: boolean;
  onSyncNow?: () => Promise<{ success: boolean; syncedCount: number }>;
}

export const FamilySyncModal: React.FC<FamilySyncModalProps> = ({
  isOpen,
  onClose,
  family,
  onUpdateFamily,
  currentCaregiver,
  setCurrentCaregiver,
  isCloudConnected,
  onSyncNow,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [babyName, setBabyName] = useState(family.babyName);
  const [babyBirthDate, setBabyBirthDate] = useState(family.babyBirthDate);
  const [authLoading, setAuthLoading] = useState(false);

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

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      if (onSyncNow) {
        setIsSyncing(true);
        const res = await onSyncNow();
        if (res.success) {
          setSyncStatusMsg(`¡Conectado! Se sincronizaron ${res.syncedCount} registros con la nube.`);
        }
        setIsSyncing(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('No se pudo completar el inicio de sesión con Google. Por favor intenta de nuevo.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleManualSync = async () => {
    if (!onSyncNow) return;
    setIsSyncing(true);
    setSyncStatusMsg(null);
    try {
      const res = await onSyncNow();
      if (res.success) {
        setSyncStatusMsg(`¡Sincronización exitosa! ${res.syncedCount} registros respaldados en la nube.`);
      } else {
        setSyncStatusMsg('Inicia sesión con Google primero para sincronizar con la nube.');
      }
    } catch {
      setSyncStatusMsg('Error al sincronizar. Verifica tu conexión a internet.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setSyncStatusMsg('Sesión cerrada. Los datos se guardan solo localmente.');
    } catch (error) {
      console.error('Logout error:', error);
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

  const handleJoinFamily = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    onUpdateFamily({
      ...family,
      familyCode: joinCodeInput.trim().toUpperCase(),
      updatedAt: new Date().toISOString(),
    });
    alert(`¡Conectado exitosamente con el código ${joinCodeInput}!`);
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
                Mantén tus datos respaldados y actualizados en tiempo real
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
        {auth.currentUser ? (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-emerald-950/60 border border-emerald-500/40 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div>
                <div className="font-bold text-emerald-300">Sincronización en la Nube Activa</div>
                <div className="text-[11px] text-slate-300">
                  Conectado como <strong className="text-white">{auth.currentUser.email}</strong>. Todos los cambios se guardan al instante.
                </div>
              </div>
            </div>
            <Cloud size={20} className="text-emerald-400 shrink-0" />
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border border-amber-500/40 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <div>
                <div className="font-bold text-amber-300">Modo Local (Solo este dispositivo)</div>
                <div className="text-[11px] text-slate-300">
                  Inicia sesión con Google abajo para que tus cambios se guarden en la nube y se sincronicen con tu teléfono o pareja.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Google Authentication Section */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Shield size={14} className="text-blue-500" />
              <span>Cuenta de Sincronización (Google)</span>
            </span>
            {auth.currentUser && (
              <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
                <Check size={13} /> Conectado
              </span>
            )}
          </div>

          {auth.currentUser ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div className="text-xs">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {auth.currentUser.displayName || 'Usuario'}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                    {auth.currentUser.email}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-medium px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                >
                  <LogOut size={13} />
                  <span>Cerrar sesión</span>
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={handleManualSync}
                  className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                  <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Datos Ahora'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Al vincular con Google, todos tus registros de lactancia, pañales, inventario y vacunas se respaldan en Firestore y se sincronizan en vivo con cualquier otro dispositivo donde abras la app.
              </p>
              <button
                type="button"
                disabled={authLoading}
                onClick={handleGoogleLogin}
                className="w-full py-3 px-4 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{authLoading ? 'Iniciando sesión con Google...' : 'Iniciar Sesión con Google para Sincronizar'}</span>
              </button>
            </div>
          )}

          {syncStatusMsg && (
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-medium animate-fade-in flex items-center gap-1.5">
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
              <span>Abrir en tu Teléfono Móvil</span>
            </span>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Copia el enlace de esta aplicación para abrirlo en el navegador de tu celular (o enviarlo a tu pareja por WhatsApp). Al iniciar sesión con la misma cuenta, verás todo exactamente igual:
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
            <span>Datos de Evan</span>
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
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
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
