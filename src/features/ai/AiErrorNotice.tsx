import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, ErrorText } from '@/components/ui';
import { AiError } from '@/services/ai';
import { spacing } from '@/theme';
import { aiErrorMessage } from './errors';

/** AI hatası; kota dolduysa Premium'a yönlendirir. */
export function AiErrorNotice({ error }: { error: unknown }) {
  const { t } = useTranslation();
  const quota = error instanceof AiError && error.code === 'quota_exceeded';
  return (
    <View style={{ gap: spacing.sm }}>
      <ErrorText>{aiErrorMessage(error, t)}</ErrorText>
      {quota && <Button title={t('premium.upgrade')} onPress={() => router.push('/paywall')} />}
    </View>
  );
}
