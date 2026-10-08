import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, EmptyState, ErrorText, Loading, Screen, Segmented } from '@/components/ui';
import { saveFood } from '@/db/foods';
import { useDb } from '@/db/provider';
import { useDayMutations, useFoodLists } from '@/features/day/hooks';
import { searchCatalog } from '@/features/food/catalog';
import { FoodRow } from '@/features/food/FoodRow';
import { defaultMealForTime, MEAL_TYPES, type Food, type MealType } from '@/features/food/types';
import { useDebounced } from '@/lib/use-debounced';
import { searchProducts } from '@/services/openfoodfacts';
import { colors, radius, spacing } from '@/theme';

type Tab = 'search' | 'favorites' | 'recent' | 'frequent';

export default function AddFoodScreen() {
  const { t } = useTranslation();
  const db = useDb();
  const params = useLocalSearchParams<{ meal?: string }>();
  const meal: MealType = MEAL_TYPES.includes(params.meal as MealType) ? (params.meal as MealType) : defaultMealForTime();

  const [tab, setTab] = useState<Tab>('search');
  const [query, setQuery] = useState('');
  const debounced = useDebounced(query.trim(), 450);

  const lists = useFoodLists();
  const { toggleFav } = useDayMutations();
  const favoriteKeys = lists.data?.favoriteKeys ?? new Set<string>();

  const catalogResults = useMemo(() => searchCatalog(query), [query]);
  const products = useQuery({
    queryKey: ['off-search', debounced],
    queryFn: ({ signal }) => searchProducts(debounced, signal),
    enabled: tab === 'search' && debounced.length >= 3,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const open = async (food: Food) => {
    // Paketli ürünler yerel önbelleğe yazılır ki miktar ekranı anahtarla açabilsin.
    await saveFood(db, food);
    router.push({ pathname: '/food-amount', params: { key: food.key, meal } });
  };

  const renderFoods = (foods: Food[]) =>
    foods.map((f) => (
      <FoodRow
        key={f.key}
        food={f}
        isFavorite={favoriteKeys.has(f.key)}
        onPress={() => open(f)}
        onToggleFavorite={() => toggleFav.mutate(f)}
      />
    ));

  return (
    <Screen>
      <AppText color={colors.textSecondary}>{t(`meal.${meal}`)}</AppText>
      <Segmented<Tab>
        value={tab}
        onChange={setTab}
        options={(['search', 'favorites', 'recent', 'frequent'] as Tab[]).map((v) => ({ value: v, label: t(`add.tabs.${v}`) }))}
      />

      {tab === 'search' && (
        <>
          <TextInput
            autoFocus
            accessibilityLabel={t('add.searchPlaceholder')}
            placeholder={t('add.searchPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            style={styles.search}
          />

          {query.trim().length > 0 && (
            <>
              {catalogResults.length > 0 && (
                <Card>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {t('add.catalog')}
                  </AppText>
                  {renderFoods(catalogResults)}
                </Card>
              )}

              {debounced.length >= 3 && (
                <Card>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {t('add.products')}
                  </AppText>
                  {products.isFetching ? (
                    <Loading />
                  ) : products.error ? (
                    <ErrorText>{t('common.offline')}</ErrorText>
                  ) : products.data && products.data.length > 0 ? (
                    renderFoods(products.data)
                  ) : (
                    <EmptyState text={t('add.noResults')} />
                  )}
                  <AppText variant="caption" color={colors.textMuted}>
                    {t('add.productsSource')}
                  </AppText>
                </Card>
              )}
            </>
          )}

          <Button
            variant="secondary"
            title={t('add.quickAdd')}
            onPress={() => router.push({ pathname: '/quick-add', params: { meal, name: query.trim() } })}
          />
        </>
      )}

      {tab !== 'search' && (
        <Card>
          {lists.isLoading ? (
            <Loading />
          ) : (
            (() => {
              const foods = lists.data?.[tab] ?? [];
              return foods.length > 0 ? renderFoods(foods) : <EmptyState text={t(`add.empty${tab[0].toUpperCase()}${tab.slice(1)}`)} />;
            })()
          )}
        </Card>
      )}
      <View style={{ height: spacing.lg }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    minHeight: 48,
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
