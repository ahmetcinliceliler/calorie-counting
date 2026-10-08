import type { StateStorage } from 'zustand/middleware';

// Web önizlemesi: tarayıcı localStorage (erişilemezse bellek içi).
const memory = new Map<string, string>();

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export const kvStorage: StateStorage = {
  getItem: (name) => safe(() => localStorage.getItem(name), memory.get(name) ?? null),
  setItem: (name, value) => {
    memory.set(name, value);
    safe(() => localStorage.setItem(name, value), undefined);
  },
  removeItem: (name) => {
    memory.delete(name);
    safe(() => localStorage.removeItem(name), undefined);
  },
};
