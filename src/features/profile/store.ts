import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { kvStorage } from '@/lib/storage';

import {
  BodyProfile,
  Macros,
  calculateDailyCalorieGoal,
  calculateMacroGoals,
} from '@/lib/nutrition';

export interface UserProfile extends BodyProfile {
  targetWeightKg: number | null;
}

export interface Goals {
  calories: number;
  macros: Macros;
}

/** Hedefler her zaman profilden türetilir; kilo değişince otomatik güncellenir. */
export function deriveGoals(profile: UserProfile): Goals {
  const calories = calculateDailyCalorieGoal(profile);
  return { calories, macros: calculateMacroGoals(profile, calories) };
}

interface ProfileState {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  clear: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: null,
      setProfile: (profile) => set({ profile }),
      updateProfile: (patch) =>
        set((s) => (s.profile ? { profile: { ...s.profile, ...patch } } : s)),
      clear: () => set({ profile: null }),
    }),
    { name: 'profile', version: 1, storage: createJSONStorage(() => kvStorage) },
  ),
);
