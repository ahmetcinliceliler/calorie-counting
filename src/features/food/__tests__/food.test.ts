import { CATALOG, getCatalogFood, normalizeSearch, searchCatalog } from '../catalog';
import { buildEntry, defaultChoice, gramsFor } from '../portion';
import { defaultMealForTime } from '../types';

describe('katalog', () => {
  it('anahtarlar benzersiz, değerler makul', () => {
    expect(new Set(CATALOG.map((f) => f.key)).size).toBe(CATALOG.length);
    for (const f of CATALOG) {
      const { kcal, protein, carbs, fat } = f.per100g;
      // Makrolardan hesaplanan enerji beyan edilen kaloriden çok sapmamalı (lif/alkol payı ile).
      const fromMacros = protein * 4 + carbs * 4 + fat * 9;
      expect(Math.abs(fromMacros - kcal)).toBeLessThanOrEqual(Math.max(25, kcal * 0.15));
      expect(f.portions.length).toBeGreaterThan(0);
    }
  });

  it('Türkçe karakterleri sadeleştirir', () => {
    expect(normalizeSearch('  İskender  KEBAP ')).toBe('iskender kebap');
    expect(normalizeSearch('Şiş Çöp Ğ Ü')).toBe('sis cop g u');
  });

  it('aksansız ve çok kelimeli arama', () => {
    expect(searchCatalog('mercimek').map((f) => f.key)).toEqual(['cat:lentil_soup']);
    expect(searchCatalog('corba').map((f) => f.key).sort()).toEqual(['cat:ezogelin', 'cat:lentil_soup']);
    expect(searchCatalog('tavuk izgara').map((f) => f.key)).toEqual(['cat:chicken_grilled']);
    expect(searchCatalog('   ')).toEqual([]);
  });

  it('kelime başı eşleşmesi öne çıkar', () => {
    expect(searchCatalog('pilav')[0].key).toBe('cat:bulgur_pilaf');
    expect(searchCatalog('pi')[0].name.startsWith('Pi')).toBe(true);
  });
});

describe('porsiyon', () => {
  const egg = getCatalogFood('cat:egg_boiled')!;

  it('porsiyon ve gram seçiminden gram hesaplar', () => {
    expect(gramsFor(egg, { unit: 'piece', quantity: 2 })).toBe(100);
    expect(gramsFor(egg, { unit: 'gram', quantity: 70 })).toBe(70);
  });

  it('son gramaja göre varsayılanı seçer', () => {
    expect(defaultChoice(egg)).toEqual({ unit: 'piece', quantity: 1 });
    expect(defaultChoice(egg, 150)).toEqual({ unit: 'piece', quantity: 3 });
    expect(defaultChoice(egg, 70)).toEqual({ unit: 'gram', quantity: 70 });
  });

  it('kaydı 100 g değerlerinden ölçekler', () => {
    const entry = buildEntry(egg, { unit: 'piece', quantity: 2 }, {
      day: '2026-10-08',
      meal: 'breakfast',
      source: 'catalog',
      portionLabel: '2 adet',
    });
    expect(entry).toMatchObject({ grams: 100, kcal: 155, protein: 13, carbs: 1.1, fat: 11, foodKey: 'cat:egg_boiled' });
  });
});

describe('defaultMealForTime', () => {
  it.each([
    [8, 'breakfast'],
    [13, 'lunch'],
    [16, 'snack'],
    [19, 'dinner'],
    [23, 'snack'],
  ])('%i:00 → %s', (h, meal) => {
    expect(defaultMealForTime(new Date(2026, 9, 8, h))).toBe(meal);
  });
});
