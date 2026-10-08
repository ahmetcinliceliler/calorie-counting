import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, ErrorText, Field, Loading, Screen } from '@/components/ui';
import { getFoodByBarcode, saveFood } from '@/db/foods';
import { useDb } from '@/db/provider';
import { aiErrorMessage } from '@/features/ai/errors';
import type { Food } from '@/features/food/types';
import { estimateProduct } from '@/services/ai';
import { lookupBarcode } from '@/services/openfoodfacts';
import { colors, radius, spacing } from '@/theme';

type State =
  | { kind: 'scanning' }
  | { kind: 'searching' }
  | { kind: 'not_found'; barcode: string }
  | { kind: 'no_nutrients'; name: string; barcode: string }
  | { kind: 'estimating'; name: string }
  | { kind: 'error'; message: string };

export default function BarcodeScreen() {
  const { t } = useTranslation();
  const db = useDb();
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<State>({ kind: 'scanning' });
  const [manualCode, setManualCode] = useState('');
  const busy = useRef(false);

  const openFood = async (food: Food) => {
    await saveFood(db, food);
    router.replace({ pathname: '/food-amount', params: { key: food.key, source: 'barcode' } });
  };

  const handleCode = async (code: string) => {
    if (busy.current) return;
    busy.current = true;
    setState({ kind: 'searching' });
    try {
      // Önce daha önce eklenen/önbelleğe alınan ürün: ağ gerektirmez.
      const cached = await getFoodByBarcode(db, code);
      if (cached) return await openFood(cached);

      const result = await lookupBarcode(code);
      if (result.status === 'found') return await openFood(result.food);
      setState(
        result.status === 'no_nutrients'
          ? { kind: 'no_nutrients', name: result.name, barcode: result.barcode }
          : { kind: 'not_found', barcode: code },
      );
    } catch {
      setState({ kind: 'error', message: t('common.offline') });
    } finally {
      busy.current = false;
    }
  };

  const estimate = async (name: string, barcode: string) => {
    setState({ kind: 'estimating', name });
    try {
      const { data } = await estimateProduct({ productName: name, barcode });
      await openFood({
        key: `off:${barcode}`,
        name: data.name,
        per100g: data.per100g,
        portions: data.packageGrams ? [{ unit: 'package', grams: data.packageGrams }] : [],
        source: 'ai',
        barcode,
      });
    } catch (err) {
      setState({ kind: 'error', message: aiErrorMessage(err, t) });
    }
  };

  const onScanned = ({ data }: BarcodeScanningResult) => {
    if (state.kind === 'scanning') handleCode(data.trim());
  };

  const reset = () => setState({ kind: 'scanning' });
  const manual = (name?: string) => router.replace({ pathname: '/quick-add', params: { name: name ?? '' } });

  const canScan = Platform.OS !== 'web';

  return (
    <Screen>
      {state.kind === 'scanning' && canScan && permission?.granted && (
        <View style={styles.cameraBox}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
            onBarcodeScanned={onScanned}
          />
          <View style={styles.frame} pointerEvents="none" />
        </View>
      )}

      {state.kind === 'scanning' && canScan && permission && !permission.granted && (
        <Card style={{ gap: spacing.md }}>
          <AppText>{t('barcode.permission')}</AppText>
          <Button title={t('barcode.grant')} onPress={requestPermission} />
        </Card>
      )}

      {state.kind === 'scanning' && (
        <>
          <AppText color={colors.textSecondary}>{canScan ? t('barcode.hint') : t('barcode.webUnsupported')}</AppText>
          <Field
            label={t('barcode.manualCode')}
            keyboardType="number-pad"
            value={manualCode}
            onChangeText={(v) => setManualCode(v.replace(/\D/g, ''))}
            maxLength={14}
          />
          <Button
            variant="secondary"
            title={t('barcode.lookup')}
            disabled={manualCode.length < 8}
            onPress={() => handleCode(manualCode)}
          />
        </>
      )}

      {state.kind === 'searching' && <Loading label={t('barcode.searching')} />}
      {state.kind === 'estimating' && <Loading label={state.name} />}

      {state.kind === 'not_found' && (
        <Card style={{ gap: spacing.md }}>
          <AppText>{t('barcode.notFound')}</AppText>
          <Button title={t('barcode.manual')} onPress={() => manual()} />
          <Button variant="secondary" title={t('barcode.scanAgain')} onPress={reset} />
        </Card>
      )}

      {state.kind === 'no_nutrients' && (
        <Card style={{ gap: spacing.md }}>
          <AppText>{t('barcode.noNutrients', { name: state.name })}</AppText>
          <Button title={t('barcode.estimateWithAi')} onPress={() => estimate(state.name, state.barcode)} />
          <Button variant="secondary" title={t('barcode.manual')} onPress={() => manual(state.name)} />
        </Card>
      )}

      {state.kind === 'error' && (
        <Card style={{ gap: spacing.md }}>
          <ErrorText>{state.message}</ErrorText>
          <Button variant="secondary" title={t('common.retry')} onPress={reset} />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cameraBox: {
    height: 320,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: '80%',
    height: 140,
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: radius.md,
  },
});
