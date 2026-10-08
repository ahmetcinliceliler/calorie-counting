import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Platform, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Chip, EmptyState, ErrorText, IconButton, Loading, Screen } from '@/components/ui';
import { AiErrorNotice } from '@/features/ai/AiErrorNotice';
import { reviewToEntries, scaledNutrients, toReviewItems, type ReviewItem } from '@/features/ai/photo';
import { useDayMutations } from '@/features/day/hooks';
import { useDayStore } from '@/features/day/store';
import { defaultMealForTime, MEAL_TYPES, type MealType } from '@/features/food/types';
import { analyzePhoto } from '@/services/ai';
import { closeFlow } from '@/lib/navigation';
import { colors, radius, spacing } from '@/theme';

// Yükleme boyutu: AI için yeterli, mobil veride hafif.
const MAX_WIDTH = 1024;

async function prepareImage(uri: string) {
  const image = await ImageManipulator.manipulate(uri).resize({ width: MAX_WIDTH }).renderAsync();
  const saved = await image.saveAsync({ compress: 0.7, format: SaveFormat.JPEG, base64: true });
  if (!saved.base64) throw new Error('no base64');
  return { uri: saved.uri, base64: saved.base64 };
}

export default function PhotoScreen() {
  const { t } = useTranslation();
  const day = useDayStore((s) => s.day);
  const { addFoods } = useDayMutations();

  const [meal, setMeal] = useState<MealType>(defaultMealForTime());
  const [preview, setPreview] = useState<string | null>(null);
  const [items, setItems] = useState<ReviewItem[] | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiError, setAiError] = useState<unknown>(null);

  const pick = async (source: 'camera' | 'library') => {
    setError(null);
    setAiError(null);
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return setError(t('photo.permission'));
    }
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
    const result =
      source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (result.canceled || !result.assets[0]) return;

    setLoading(true);
    setItems(null);
    try {
      const image = await prepareImage(result.assets[0].uri);
      setPreview(image.uri);
      const res = await analyzePhoto({
        imageBase64: image.base64,
        mimeType: 'image/jpeg',
        locale: 'tr',
      });
      setItems(toReviewItems(res.data.items));
      setRemaining(res.quota.remaining);
    } catch (err) {
      setAiError(err);
    } finally {
      setLoading(false);
    }
  };

  const update = (id: string, patch: Partial<ReviewItem>) =>
    setItems((list) => list?.map((i) => (i.id === id ? { ...i, ...patch } : i)) ?? null);

  const entries = items ? reviewToEntries(items, { day, meal }) : [];

  const save = async () => {
    await addFoods.mutateAsync({ entries });
    closeFlow();
  };

  return (
    <Screen>
      {!items && !loading && <AppText color={colors.textSecondary}>{t('photo.intro')}</AppText>}

      <View style={styles.row}>
        {Platform.OS !== 'web' && (
          <Button style={styles.grow} title={t('photo.takePhoto')} onPress={() => pick('camera')} disabled={loading} />
        )}
        <Button
          style={styles.grow}
          variant={Platform.OS === 'web' ? 'primary' : 'secondary'}
          title={t('photo.pickPhoto')}
          onPress={() => pick('library')}
          disabled={loading}
        />
      </View>

      {preview && <Image source={{ uri: preview }} style={styles.preview} accessibilityIgnoresInvertColors />}
      {loading && <Loading label={t('photo.analyzing')} />}
      {error && <ErrorText>{error}</ErrorText>}
      {aiError ? <AiErrorNotice error={aiError} /> : null}

      {items && items.length === 0 && <EmptyState text={t('photo.noFood')} />}

      {items && items.length > 0 && (
        <>
          <AppText variant="heading">{t('photo.results')}</AppText>
          <Card style={{ gap: spacing.sm }}>
            {items.map((item) => {
              const n = scaledNutrients(item);
              return (
                <View key={item.id} style={[styles.itemRow, !item.included && { opacity: 0.4 }]}>
                  <View style={{ flex: 1 }}>
                    <AppText numberOfLines={2}>{item.name}</AppText>
                    <AppText variant="caption" color={colors.textSecondary}>
                      {n.kcal} {t('common.kcal')} · P {n.protein} · K {n.carbs} · Y {n.fat}
                      {item.confidence < 0.5 ? ` · ${t('photo.lowConfidence')}` : ''}
                    </AppText>
                  </View>
                  <TextInput
                    accessibilityLabel={`${item.name} ${t('common.g')}`}
                    keyboardType="number-pad"
                    value={String(item.editedGrams)}
                    onChangeText={(v) => update(item.id, { editedGrams: Math.min(3000, Number(v.replace(/\D/g, '')) || 0) })}
                    style={styles.gramInput}
                    selectTextOnFocus
                  />
                  <AppText variant="caption" color={colors.textSecondary}>
                    {t('common.g')}
                  </AppText>
                  <IconButton
                    icon={item.included ? 'close-circle' : 'add-circle'}
                    label={item.name}
                    color={item.included ? colors.textMuted : colors.accent}
                    onPress={() => update(item.id, { included: !item.included })}
                  />
                </View>
              );
            })}
          </Card>

          <View style={styles.wrap}>
            {MEAL_TYPES.map((m) => (
              <Chip key={m} label={t(`meal.${m}`)} selected={meal === m} onPress={() => setMeal(m)} />
            ))}
          </View>

          <AppText variant="caption" color={colors.textMuted}>
            {t('photo.disclaimer')}
            {remaining !== null ? ` ${t('ai.remaining', { count: remaining })}` : ''}
          </AppText>
          <Button
            title={t('photo.saveAll', { count: entries.length })}
            onPress={save}
            disabled={entries.length === 0 || addFoods.isPending}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  grow: { flex: 1 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  preview: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.lg, backgroundColor: colors.surface },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  gramInput: {
    width: 64,
    minHeight: 44,
    textAlign: 'center',
    color: colors.text,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.sm,
    fontSize: 16,
  },
});
