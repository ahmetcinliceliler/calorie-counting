import { create } from 'zustand';

// Web önizlemesi: reklam yok.
export const useAdsStore = create(() => ({ ready: false, privacyOptionsRequired: false }));
export const bannerUnitId: string | null = null;
export async function initAds(): Promise<void> {}
export async function showAdPrivacyOptions(): Promise<void> {}
