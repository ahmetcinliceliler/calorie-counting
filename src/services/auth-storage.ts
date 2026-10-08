import 'expo-sqlite/localStorage/install';

// Native: expo-sqlite'ın sağladığı localStorage global'i (oturum cihazda kalır).
export const authStorage = globalThis.localStorage;
