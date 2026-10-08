import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Chip, ErrorText, Loading, Screen } from '@/components/ui';
import { usePremiumStore } from '@/features/premium/store';
import { closeFlow } from '@/lib/navigation';
import { getPlans, purchase, restore, type PlanOption } from '@/services/purchases';
import { colors, spacing } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

export default function PaywallScreen() {
  const { t } = useTranslation();
  const isPremium = usePremiumStore((s) => s.isPremium);
  const available = usePremiumStore((s) => s.available);
  const plans = useQuery({ queryKey: ['plans'], queryFn: getPlans, enabled: available, retry: 1 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const list = plans.data ?? [];
  // Varsayılan: yıllık plan (varsa).
  const selected: PlanOption | undefined =
    list.find((p) => p.id === selectedId) ?? list.find((p) => p.kind === 'annual') ?? list[0];

  const buy = useMutation({
    mutationFn: (plan: PlanOption) => purchase(plan),
    onSuccess: (ok) => {
      if (ok) closeFlow();
    },
  });
  const restoreMutation = useMutation({
    mutationFn: restore,
    onSuccess: (ok) => setMessage(ok ? t('premium.restored') : t('premium.nothingToRestore')),
  });

  const benefits: { icon: IconName; key: string }[] = [
    { icon: 'sparkles', key: 'ai' },
    { icon: 'eye-off-outline', key: 'ads' },
    { icon: 'heart-outline', key: 'support' },
  ];

  return (
    <Screen>
      <AppText variant="title">{t('premium.headline')}</AppText>
      <Card style={{ gap: spacing.md }}>
        {benefits.map((b) => (
          <View key={b.key} style={styles.benefit}>
            <Ionicons name={b.icon} size={22} color={colors.accent} />
            <AppText style={{ flex: 1 }}>{t(`premium.benefits.${b.key}`)}</AppText>
          </View>
        ))}
      </Card>

      {isPremium ? (
        <Card>
          <AppText color={colors.accent}>{t('premium.active')}</AppText>
        </Card>
      ) : !available ? (
        <Card>
          <AppText color={colors.textSecondary}>{t('premium.unavailable')}</AppText>
        </Card>
      ) : plans.isLoading ? (
        <Loading />
      ) : list.length === 0 ? (
        <Card>
          <AppText color={colors.textSecondary}>{t('premium.unavailable')}</AppText>
        </Card>
      ) : (
        <>
          <View style={styles.plans}>
            {list.map((p) => (
              <Chip
                key={p.id}
                style={{ flex: 1 }}
                label={`${t(`premium.${p.kind}`)} · ${p.priceString}`}
                selected={selected?.id === p.id}
                onPress={() => setSelectedId(p.id)}
              />
            ))}
          </View>
          {selected && (
            <Button
              title={t('premium.subscribe', { price: selected.priceString })}
              onPress={() => buy.mutate(selected)}
              disabled={buy.isPending}
            />
          )}
          {buy.error && <ErrorText>{t('premium.failed')}</ErrorText>}
        </>
      )}

      {available && !isPremium && (
        <Button
          variant="secondary"
          title={t('premium.restore')}
          onPress={() => restoreMutation.mutate()}
          disabled={restoreMutation.isPending}
        />
      )}
      {message && <AppText color={colors.textSecondary}>{message}</AppText>}

      <AppText variant="caption" color={colors.textMuted}>
        {t('premium.terms')}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  benefit: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  plans: { flexDirection: 'row', gap: spacing.sm },
});
