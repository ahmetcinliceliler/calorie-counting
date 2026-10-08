import { View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { usePremiumStore } from '@/features/premium/store';
import { bannerUnitId, useAdsStore } from '@/services/ads';
import { spacing } from '@/theme';

/** Ücretsiz katmanda içerik altında tek banner. Premium'da veya izin yoksa hiç render edilmez. */
export function AdBanner() {
  const ready = useAdsStore((s) => s.ready);
  const isPremium = usePremiumStore((s) => s.isPremium);
  if (!ready || isPremium || !bannerUnitId) return null;
  return (
    <View style={{ alignItems: 'center', marginTop: spacing.sm }}>
      <BannerAd unitId={bannerUnitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
    </View>
  );
}
