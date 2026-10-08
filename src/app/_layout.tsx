import '@/i18n';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, SplashScreen, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DbProvider } from '@/db/provider';
import { useProfileStore } from '@/features/profile/store';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

// Yerel veritabanı sorguları: ağ yok, yeniden deneme gereksiz.
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } },
});

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.accent,
    background: colors.background,
    card: colors.background,
    text: colors.text,
    border: colors.border,
  },
};

function useProfileHydrated() {
  const [hydrated, setHydrated] = useState(() => useProfileStore.persist.hasHydrated());
  useEffect(() => {
    if (hydrated) return;
    return useProfileStore.persist.onFinishHydration(() => setHydrated(true));
  }, [hydrated]);
  return hydrated;
}

export default function RootLayout() {
  const hydrated = useProfileHydrated();

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync();
  }, [hydrated]);

  if (!hydrated) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={navTheme}>
        <StatusBar style="light" />
        {/* DB, profil yüklendikten sonra açılır: eski veri içe aktarımı profili doldurabilir. */}
        <DbProvider>
          <RootStack />
        </DbProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function RootStack() {
  const { t } = useTranslation();
  const hasProfile = useProfileStore((s) => s.profile !== null);
  const modal = (title: string) => ({ presentation: 'modal' as const, headerShown: true, title });

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.accent,
        headerTitleStyle: { color: colors.text },
      }}>
      <Stack.Protected guard={hasProfile}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add-food" options={modal(t('add.title'))} />
        <Stack.Screen name="food-amount" options={modal(t('amount.title'))} />
        <Stack.Screen name="quick-add" options={modal(t('quick.title'))} />
        <Stack.Screen name="barcode" options={modal(t('barcode.title'))} />
        <Stack.Screen name="photo" options={modal(t('photo.title'))} />
        <Stack.Screen name="exercise" options={modal(t('exercise.title'))} />
        <Stack.Screen name="chef" options={modal(t('chef.title'))} />
        <Stack.Screen name="edit-profile" options={modal(t('profile.edit'))} />
      </Stack.Protected>
      <Stack.Protected guard={!hasProfile}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
    </Stack>
  );
}
