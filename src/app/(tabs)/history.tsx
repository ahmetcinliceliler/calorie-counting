import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Card, EmptyState, ListRow, Loading, Screen } from '@/components/ui';
import { AdBanner } from '@/components/AdBanner';
import { useHistory } from '@/features/day/hooks';
import { useDayStore } from '@/features/day/store';
import { deriveGoals, useProfileStore } from '@/features/profile/store';
import { formatDisplayDate, lastNDays } from '@/lib/date';
import { colors, spacing } from '@/theme';

export default function HistoryScreen() {
  const { t } = useTranslation();
  const profile = useProfileStore((s) => s.profile);
  const setDay = useDayStore((s) => s.setDay);
  const { data, isLoading } = useHistory(60);
  if (!profile) return null;

  const goal = deriveGoals(profile).calories;
  const byDay = new Map((data ?? []).map((d) => [d.day, d]));
  const week = lastNDays(7);
  const loggedWeek = week.map((d) => byDay.get(d)).filter((d) => d && d.entries > 0);
  const weekAvg = loggedWeek.length ? Math.round(loggedWeek.reduce((s, d) => s + d!.kcal, 0) / loggedWeek.length) : null;
  const maxKcal = Math.max(goal, ...week.map((d) => byDay.get(d)?.kcal ?? 0));

  const label = (day: string) => {
    const l = formatDisplayDate(day);
    return l === 'today' || l === 'yesterday' ? t(`common.${l}`) : l;
  };

  return (
    <Screen>
      <AppText variant="title">{t('history.title')}</AppText>

      <Card style={{ gap: spacing.md }}>
        <View style={styles.rowBetween}>
          <AppText color={colors.textSecondary}>{t('history.last7')}</AppText>
          <AppText variant="heading">{weekAvg !== null ? `${weekAvg} ${t('common.kcal')}` : '—'}</AppText>
        </View>
        <View style={styles.chart} accessibilityRole="image" accessibilityLabel={t('history.last7')}>
          {week.map((d) => {
            const kcal = byDay.get(d)?.kcal ?? 0;
            const over = kcal > goal;
            return (
              <View key={d} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      { height: `${Math.max(2, (kcal / maxKcal) * 100)}%`, backgroundColor: over ? colors.danger : colors.accent },
                    ]}
                  />
                  <View style={[styles.goalLine, { bottom: `${(goal / maxKcal) * 100}%` }]} />
                </View>
                <AppText variant="caption" color={colors.textMuted}>
                  {Number(d.slice(8))}
                </AppText>
              </View>
            );
          })}
        </View>
      </Card>

      <Card>
        {isLoading ? (
          <Loading />
        ) : !data || data.length === 0 ? (
          <EmptyState text={t('history.empty')} />
        ) : (
          data.map((d) => {
            const net = d.kcal - d.burned;
            return (
              <ListRow
                key={d.day}
                title={label(d.day)}
                subtitle={`${t('history.entries', { count: d.entries })}${d.burned ? ` · -${d.burned} ${t('common.kcal')}` : ''}`}
                value={`${d.kcal} ${t('common.kcal')}`}
                accessibilityLabel={`${label(d.day)}, ${d.kcal} ${t('common.kcal')}, ${net > goal ? t('history.overGoal') : t('history.underGoal')}`}
                onPress={() => {
                  setDay(d.day);
                  router.navigate('/');
                }}
              />
            );
          })
        )}
      </Card>
      <AdBanner />
    </Screen>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chart: { flexDirection: 'row', height: 120, gap: spacing.sm },
  barCol: { flex: 1, alignItems: 'center', gap: spacing.xs },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4 },
  goalLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.textMuted },
});
