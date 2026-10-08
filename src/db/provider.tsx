import AsyncStorage from '@react-native-async-storage/async-storage';
import { SQLiteProvider, useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import type { ReactNode } from 'react';
import { Platform } from 'react-native';

import { useProfileStore } from '@/features/profile/store';
import { importLegacyOnce } from './legacy';
import { migrate } from './migrations';
import type { Db } from './types';

export const DATABASE_NAME = 'kalori.db';

async function init(sqlite: SQLiteDatabase) {
  const db = sqlite as unknown as Db;
  if (Platform.OS !== 'web') await sqlite.execAsync('PRAGMA journal_mode = WAL');
  await migrate(db);

  // v1 verisi yalnızca telefonda olabilir.
  if (Platform.OS !== 'web') {
    try {
      const result = await importLegacyOnce(db, (key) => AsyncStorage.getItem(key));
      const store = useProfileStore.getState();
      if (result.profile && !store.profile) store.setProfile(result.profile);
    } catch (err) {
      // İçe aktarma başarısız olsa da uygulama açılmalı; bir sonraki açılışta tekrar denenir.
      console.error('legacy import failed', err);
    }
  }
}

export function DbProvider({ children }: { children: ReactNode }) {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={init}>
      {children}
    </SQLiteProvider>
  );
}

export function useDb(): Db {
  return useSQLiteContext() as unknown as Db;
}
