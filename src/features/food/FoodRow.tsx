import { useTranslation } from 'react-i18next';

import { IconButton, ListRow } from '@/components/ui';
import { colors } from '@/theme';
import type { Food } from './types';

export function FoodRow({
  food,
  isFavorite,
  onPress,
  onToggleFavorite,
}: {
  food: Food;
  isFavorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
}) {
  const { t } = useTranslation();
  const portion = food.portions[0];
  const portionText = portion ? ` · 1 ${t(`unit.${portion.unit}`)} ≈ ${portion.grams} ${t('common.g')}` : '';
  return (
    <ListRow
      title={food.name}
      subtitle={`${t('add.per100g', { kcal: food.per100g.kcal })}${portionText}`}
      onPress={onPress}
      right={
        <IconButton
          icon={isFavorite ? 'star' : 'star-outline'}
          label={isFavorite ? t('amount.unfavorite') : t('amount.favorite')}
          color={isFavorite ? colors.accent : colors.textMuted}
          size={20}
          onPress={onToggleFavorite}
        />
      }
    />
  );
}
