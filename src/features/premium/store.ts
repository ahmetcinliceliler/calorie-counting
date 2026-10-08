import { create } from 'zustand';

// Premium durumu RevenueCat'ten gelir (istemci tarafı: reklamları gizlemek, arayüz).
// AI kotası için asıl karar sunucuda: RevenueCat webhook'u → entitlements tablosu.
export const PREMIUM_ENTITLEMENT = 'premium';

interface PremiumState {
  isPremium: boolean;
  /** Satın alma servisi yapılandırıldı mı (anahtar var ve platform destekliyor). */
  available: boolean;
  setPremium: (isPremium: boolean) => void;
  setAvailable: (available: boolean) => void;
}

export const usePremiumStore = create<PremiumState>((set) => ({
  isPremium: false,
  available: false,
  setPremium: (isPremium) => set({ isPremium }),
  setAvailable: (available) => set({ available }),
}));
