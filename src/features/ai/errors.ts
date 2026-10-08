import type { TFunction } from 'i18next';

import { AiError } from '@/services/ai';

/** AiError'u kullanıcıya gösterilecek metne çevirir. */
export function aiErrorMessage(err: unknown, t: TFunction): string {
  if (!(err instanceof AiError)) return t('common.error');
  switch (err.code) {
    case 'not_configured':
      return t('ai.notConfigured');
    case 'quota_exceeded':
      return t('ai.quota');
    case 'ai_unavailable':
      return t('ai.unavailable');
    case 'ai_bad_output':
      return t('ai.badOutput');
    case 'network':
      return t('ai.network');
    default:
      return t('common.error');
  }
}
