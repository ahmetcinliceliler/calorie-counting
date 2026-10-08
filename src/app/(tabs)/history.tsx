import { useTranslation } from 'react-i18next';

import { AppText, Card, Screen } from '@/components/ui';
import { colors } from '@/theme';

export default function HistoryScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <AppText variant="title">{t('history.title')}</AppText>
      <Card>
        <AppText color={colors.textSecondary}>{t('history.comingSoon')}</AppText>
      </Card>
    </Screen>
  );
}
