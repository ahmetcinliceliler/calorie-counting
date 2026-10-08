import Storage from 'expo-sqlite/kv-store';
import type { StateStorage } from 'zustand/middleware';

// Native: SQLite tabanlı anahtar-değer deposu.
export const kvStorage: StateStorage = {
  getItem: (name) => Storage.getItem(name),
  setItem: (name, value) => Storage.setItem(name, value),
  removeItem: (name) => Storage.removeItem(name),
};
