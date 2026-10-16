import React from 'react';
import {
  Sparkles,
  Moon,
  Sun,
  Users,
  Wifi,
  Clock,
  Baby,
  ShieldCheck,
} from 'lucide-react';
import { FamilyProfile, SleepRecord } from '../types';
import { SparkleGlow, StarSparkle } from './SparkleEffect';

interface HeaderProps {
  family: FamilyProfile;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  activeSleep: { startTime: string } | null;
  lastSleep: SleepRecord | null;
  onOpenSyncModal: () => void;
  currentCaregiver: string;
  setCurrentCaregiver: (caregiver: string) => void;
  isCloudConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  family,
  darkMode,
  setDarkMode,
  activeSleep,
  lastSleep,
  onOpenSyncModal,
  currentCaregiver,
  setCurrentCaregiver,
  isCloudConnected,
}) => {
  // Calculate baby age
  const calculateAge = () => {
    try {
      const birth = new Date(family.babyBirthDate);
      const now = new Date();
      const diffMs = now.getTime() - birth.getTime();
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const months = Math.floor(days / 30.4375);
      const remDays = Math.floor(days % 30.4375);

      if (months <= 0) return `${days} días`;
      return `${months} ${months === 1 ? 'mes' : 'meses'}${remDays > 0 ? ` y ${remDays} d` : ''}`;
    } catch {
      return '4 meses';
    }
  };

  // Calculate awake window
  const getAwakeTime = () => {
    if (activeSleep) return null;
    if (!lastSleep) return null;
    const end = new Date(lastSleep.endTime);
    const now = new Date();
    const diffMins = Math.max(0, Math.floor((now.getTime() - end.getTime()) / (1000 * 60)));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours > 0 ? `${hours}h ` : ''}${mins}m`;
  };

  const awakeTime = getAwakeTime();

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-slate-950/85 border-b border-blue-200/50 dark:border-blue-900/40 transition-colors shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          {/* Logo & Baby Title */}
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400/40">
                <Baby size={22} className="text-white drop-shadow" />
              </div>
              <div className="absolute -top-1 -right-1">
                <SparkleGlow size={13} />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 dark:from-blue-400 dark:via-blue-300 dark:to-indigo-300 bg-clip-text text-transparent">
                  Evan Tracker
                </h1>
                <StarSparkle size={12} />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {family.babyName}
                </span>
                <span>•</span>
                <span className="bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded text-blue-700 dark:text-blue-300 font-medium">
                  {calculateAge()}
                </span>
              </div>
            </div>
          </div>

          {/* Status Badges & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Sleep / Awake Status */}
            {activeSleep ? (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-400/30 text-xs font-medium animate-pulse">
                <Moon size={13} className="text-indigo-500" />
                <span>Durmiendo</span>
              </div>
            ) : awakeTime ? (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-400/30 text-xs font-medium">
                <Clock size={13} className="text-amber-500" />
                <span>Despierto: {awakeTime}</span>
              </div>
            ) : null}

            {/* Caregiver Selector */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setCurrentCaregiver('Mamá')}
                className={`px-2 py-1 rounded-md transition-all font-medium ${
                  currentCaregiver === 'Mamá'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Mamá
              </button>
              <button
                type="button"
                onClick={() => setCurrentCaregiver('Papá')}
                className={`px-2 py-1 rounded-md transition-all font-medium ${
                  currentCaregiver === 'Papá'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Papá
              </button>
            </div>

            {/* Sync Status Button */}
            <button
              type="button"
              onClick={onOpenSyncModal}
              title="Sincronización en tiempo real"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all cursor-pointer"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Users size={14} className="hidden sm:inline" />
              <span className="hidden md:inline">Familia</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Alternar modo oscuro"
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors border border-transparent dark:border-slate-800 cursor-pointer"
            >
              {darkMode ? (
                <Sun size={17} className="text-amber-400" />
              ) : (
                <Moon size={17} className="text-blue-700" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
