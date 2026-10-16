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

interface FamilySyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  family: FamilyProfile;
  onUpdateFamily: (family: FamilyProfile) => void;
  currentCaregiver: string;
  setCurrentCaregiver: (caregiver: string) => void;
  isCloudConnected: boolean;
}

export const FamilySyncModal: React.FC<FamilySyncModalProps> = ({
  isOpen,
  onClose,
  family,
  onUpdateFamily,
  currentCaregiver,
  setCurrentCaregiver,
  isCloudConnected,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
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

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
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
    alert(`¡Conectado exitosamente con la familia ${joinCodeInput}!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-blue-500/40 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
              <Users size={22} />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Sincronización Familiar en Vivo</span>
                <SparkleGlow size={14} />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ambos padres y cuidadores sincronizados en tiempo real
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
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-slate-900 border border-blue-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <div className="font-bold text-white">Nube Firebase Activa y Conectada</div>
              <div className="text-[11px] text-slate-400">Cambios visibles al instante en cualquier teléfono</div>
            </div>
          </div>
          <Cloud size={20} className="text-blue-400 shrink-0" />
        </div>

        {/* Family Sync Code */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Key size={14} className="text-blue-500" />
              <span>Código Familiar Compartido</span>
            </span>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">Comparte con Papá/Mamá</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 p-3 rounded-xl bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 font-mono font-extrabold text-base text-center tracking-widest text-blue-600 dark:text-blue-300 shadow-inner">
              {family.familyCode}
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer transition-all"
            >
              {copiedCode ? <Check size={16} /> : <Copy size={16} />}
              <span>{copiedCode ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            El otro padre puede ingresar este código en su dispositivo para ver y registrar exactamente las mismas tomas, pañales y suministros.
          </p>
        </div>

        {/* Join Family Input */}
        <form onSubmit={handleJoinFamily} className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            ¿Tienes un código de familia existente?
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ingresa el código (ej. EVAN-2026)"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value)}
              className="flex-1 text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-mono"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white font-bold text-xs cursor-pointer"
            >
              Unirse
            </button>
          </div>
        </form>

        {/* Google Authentication (Optional for cloud account linking) */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Shield size={14} className="text-emerald-500" />
              <span>Cuenta Firebase Auth</span>
            </span>
            {auth.currentUser && (
              <span className="text-[11px] text-emerald-500 font-semibold">Conectado como {auth.currentUser.displayName || auth.currentUser.email}</span>
            )}
          </div>

          {auth.currentUser ? (
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-600 dark:text-slate-400">
                {auth.currentUser.email}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1 text-xs text-rose-500 hover:underline cursor-pointer"
              >
                <LogOut size={13} />
                <span>Cerrar sesión</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={authLoading}
              onClick={handleGoogleLogin}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
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
              <span>{authLoading ? 'Conectando...' : 'Vincular con Cuenta Google'}</span>
            </button>
          )}
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
