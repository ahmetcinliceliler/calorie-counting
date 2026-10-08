import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, ErrorText, Field, ListRow, Screen } from '@/components/ui';
import { useDayMutations, useWeightLogs } from '@/features/day/hooks';
import { deriveGoals, useProfileStore } from '@/features/profile/store';
import { localDateKey } from '@/lib/date';
import { confirm } from '@/lib/dialog';
import { colors, spacing } from '@/theme';

const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL;
const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL;

export default function ProfileScreen() {
  const { t } = useTranslation();
  const profile = useProfileStore((s) => s.profile);
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const clear = useProfileStore((s) => s.clear);
  const { saveWeight } = useDayMutations();
  const weights = useWeightLogs();
  const [weightText, setWeightText] = useState('');
  const [weightError, setWeightError] = useState(false);
  const [weightSaved, setWeightSaved] = useState(false);
  if (!profile) return null;

  const goals = deriveGoals(profile);

  const logWeight = async () => {
    const w = Number(weightText.replace(',', '.'));
    if (!Number.isFinite(w) || w < 30 || w > 300) return setWeightError(true);
    setWeightError(false);
    setWeightSaved(false);
    await saveWeight.mutateAsync({ day: localDateKey(), weightKg: w });
    // Profil kilosu güncellenince hedefler deriveGoals ile otomatik yeniden hesaplanır.
    updateProfile({ weightKg: Math.round(w * 10) / 10 });
    setWeightText('');
    setWeightSaved(true);
  };

  const reset = async () => {
    if (await confirm(t('profile.reset'), t('profile.resetConfirm'), t('profile.reset'), t('common.cancel'))) clear();
  };

  const logs = weights.data ?? [];
  const minW = Math.min(...logs.map((l) => l.weightKg), profile.targetWeightKg ?? Infinity);
  const maxW = Math.max(...logs.map((l) => l.weightKg));
  const span = Math.max(1, maxW - minW);

  return (
    <Screen>
      <AppText variant="title">{t('profile.title')}</AppText>

      <Card style={{ gap: spacing.sm }}>
        <Row label={t('profile.dailyGoal')} value={`${goals.calories} ${t('common.kcal')}`} accent />
        <Row label={t('today.protein')} value={`${goals.macros.protein} ${t('common.g')}`} />
        <Row label={t('today.carbs')} value={`${goals.macros.carbs} ${t('common.g')}`} />
        <Row label={t('today.fat')} value={`${goals.macros.fat} ${t('common.g')}`} />
      </Card>

      <Card style={{ gap: spacing.md }}>
        <View style={styles.rowBetween}>
          <AppText variant="heading">{t('profile.weight')}</AppText>
          <AppText variant="heading">
            {profile.weightKg} kg
            {profile.targetWeightKg !== null && (
              <AppText variant="caption" color={colors.textSecondary}>
                {'  '}
                {t('profile.toTarget', { value: Math.abs(profile.weightKg - profile.targetWeightKg).toFixed(1) })}
              </AppText>
            )}
          </AppText>
        </View>

        {logs.length >= 2 ? (
          <View style={styles.chart} accessibilityRole="image" accessibilityLabel={t('profile.weightTrend')}>
            {logs.slice(-30).map((l) => (
              <View key={l.day} style={styles.barCol}>
                <View style={[styles.bar, { height: `${20 + ((l.weightKg - minW) / span) * 80}%` }]} />
              </View>
            ))}
          </View>
        ) : (
          <AppText variant="caption" color={colors.textMuted}>
            {t('profile.noWeights')}
          </AppText>
        )}

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Field label={t('profile.logWeight')} keyboardType="decimal-pad" value={weightText} onChangeText={setWeightText} placeholder={`${profile.weightKg}`} />
          </View>
          <Button title={t('common.save')} onPress={logWeight} disabled={!weightText || saveWeight.isPending} style={{ alignSelf: 'flex-end' }} />
        </View>
        {weightError && <ErrorText>{t('onboarding.invalid.weight')}</ErrorText>}
        {weightSaved && (
          <AppText accessibilityLiveRegion="polite" color={colors.accent}>
            {t('profile.weightSaved')}
          </AppText>
        )}
      </Card>

      <Card>
        <ListRow
          title={t('profile.body')}
          subtitle={`${profile.heightCm} cm · ${profile.age} · ${t(`activity.${profile.activity}`)} · ${t(`goal.${profile.goal}`)}`}
          value={t('profile.edit')}
          onPress={() => router.push('/edit-profile')}
        />
      </Card>

      <Card>
        <AppText variant="caption" color={colors.textSecondary}>
          {t('profile.legal')}
        </AppText>
        {PRIVACY_URL && <ListRow title={t('profile.privacy')} onPress={() => WebBrowser.openBrowserAsync(PRIVACY_URL)} />}
        {TERMS_URL && <ListRow title={t('profile.terms')} onPress={() => WebBrowser.openBrowserAsync(TERMS_URL)} />}
        <ListRow title={t('profile.dataSources')} />
        <ListRow title={t('profile.version', { version: Constants.expoConfig?.version ?? '' })} />
      </Card>

      <Button title={t('profile.reset')} variant="secondary" onPress={reset} />
      <AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>
        {t('disclaimer')}
      </AppText>
    </Screen>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.rowBetween}>
      <AppText color={colors.textSecondary}>{label}</AppText>
      <AppText color={accent ? colors.accent : colors.text}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', gap: spacing.sm },
  chart: { flexDirection: 'row', height: 80, gap: 2, alignItems: 'flex-end' },
  barCol: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 2, backgroundColor: colors.accent },
});
