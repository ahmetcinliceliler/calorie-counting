import { randomUUID } from 'expo-crypto';

export function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? randomUUID();
}

export const nowIso = () => new Date().toISOString();
