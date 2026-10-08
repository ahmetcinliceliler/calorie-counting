import { create } from 'zustand';

import { addDays, isFuture, localDateKey, type DateKey } from '@/lib/date';

interface DayState {
  day: DateKey;
  setDay: (day: DateKey) => void;
  shift: (days: number) => void;
}

/** Ana ekranda görüntülenen gün (kalıcı değil; uygulama her açılışta bugünle başlar). */
export const useDayStore = create<DayState>((set) => ({
  day: localDateKey(),
  setDay: (day) => set({ day: isFuture(day) ? localDateKey() : day }),
  shift: (days) =>
    set((s) => {
      const next = addDays(s.day, days);
      return isFuture(next) ? s : { day: next };
    }),
}));
