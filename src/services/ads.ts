import { getTrackingPermissionsAsync, requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { Platform } from 'react-native';
import mobileAds, {
  AdsConsent,
  AdsConsentPrivacyOptionsRequirementStatus,
  TestIds,
} from 'react-native-google-mobile-ads';
import { create } from 'zustand';

interface AdsState {
  /** İzin (UMP) alındı ve SDK başlatıldı; reklam istenebilir. */
  ready: boolean;
  /** AB/İngiltere vb.: kullanıcı ayarlardan izin tercihini değiştirebilmeli. */
  privacyOptionsRequired: boolean;
}

export const useAdsStore = create<AdsState>(() => ({ ready: false, privacyOptionsRequired: false }));

const BANNER_ID = Platform.select({
  ios: process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS,
  android: process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID,
});

/** Geliştirmede her zaman Google'ın test reklamı; üretimde gerçek kimlik yoksa reklam yok. */
export const bannerUnitId: string | null = __DEV__ ? TestIds.ADAPTIVE_BANNER : (BANNER_ID ?? null);

let started = false;

/**
 * Sıra önemli: önce UMP izin formu (gerekiyorsa), sonra iOS ATT, en son SDK başlatma.
 * Premium kullanıcılar için çağrılmaz.
 */
export async function initAds(): Promise<void> {
  if (started || !bannerUnitId) return;
  started = true;
  try {
    const consent = await AdsConsent.gatherConsent();
    useAdsStore.setState({
      privacyOptionsRequired:
        consent.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
    });

    if (Platform.OS === 'ios') {
      const { status } = await getTrackingPermissionsAsync();
      if (status === 'undetermined') await requestTrackingPermissionsAsync();
    }

    if (consent.canRequestAds) {
      await mobileAds().initialize();
      useAdsStore.setState({ ready: true });
    }
  } catch (err) {
    // Reklam altyapısı hatası uygulamayı engellememeli.
    console.warn('ads init failed', err);
    started = false;
  }
}

export async function showAdPrivacyOptions(): Promise<void> {
  await AdsConsent.showPrivacyOptionsForm();
}
