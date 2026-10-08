import type { Food, Per100g, Portion, PortionUnit } from './types';

// Yerleşik Türk mutfağı kataloğu. Değerler 100 g başına, yaygın referans tablolarından
// yaklaşık değerlerdir. Yayından önce bir diyetisyen tarafından gözden geçirilmeli.

type Row = [id: string, name: string, n: [kcal: number, protein: number, carbs: number, fat: number], portions: [PortionUnit, number][]];

const ROWS: Row[] = [
  // Meyve ve sebze
  ['apple', 'Elma', [52, 0.3, 14, 0.2], [['piece', 180]]],
  ['banana', 'Muz', [89, 1.1, 23, 0.3], [['piece', 120]]],
  ['orange', 'Portakal', [47, 0.9, 12, 0.1], [['piece', 150]]],
  ['tomato', 'Domates', [18, 0.9, 3.9, 0.2], [['piece', 120]]],
  ['cucumber', 'Salatalık', [15, 0.7, 3.6, 0.1], [['piece', 150]]],
  ['salad', 'Mevsim salata (soslu değil)', [20, 1.2, 3.5, 0.2], [['bowl', 150]]],
  ['potato_boiled', 'Haşlanmış patates', [87, 1.9, 20, 0.1], [['piece', 150]]],

  // Kahvaltılık
  ['egg_boiled', 'Haşlanmış yumurta', [155, 13, 1.1, 11], [['piece', 50]]],
  ['white_cheese', 'Beyaz peynir (tam yağlı)', [260, 17, 1, 21], [['slice', 30]]],
  ['kashar', 'Kaşar peyniri', [380, 27, 1, 30], [['slice', 20]]],
  ['black_olive', 'Siyah zeytin', [230, 1.5, 6, 22], [['piece', 4], ['handful', 30]]],
  ['bread_white', 'Beyaz ekmek', [265, 9, 49, 3.2], [['slice', 25]]],
  ['bread_whole', 'Tam buğday ekmeği', [247, 13, 41, 3.4], [['slice', 30]]],
  ['simit', 'Simit', [310, 10, 55, 6], [['piece', 120]]],
  ['toast_kashar', 'Kaşarlı tost', [290, 13, 30, 13], [['piece', 130]]],
  ['menemen', 'Menemen', [110, 6, 5, 7.5], [['portion', 200]]],
  ['oats', 'Yulaf ezmesi (kuru)', [379, 13, 68, 6.5], [['tablespoon', 10], ['bowl', 40]]],
  ['honey', 'Bal', [304, 0.3, 82, 0], [['tablespoon', 21], ['teaspoon', 7]]],
  ['butter', 'Tereyağı', [717, 0.9, 0.1, 81], [['tablespoon', 14], ['teaspoon', 5]]],
  ['walnut', 'Ceviz içi', [654, 15, 14, 65], [['piece', 4], ['handful', 30]]],

  // Ana yemekler
  ['chicken_grilled', 'Izgara tavuk göğsü', [165, 31, 0, 3.6], [['portion', 150]]],
  ['meatball_grilled', 'Izgara köfte', [260, 17, 4, 20], [['piece', 30], ['portion', 150]]],
  ['adana', 'Adana kebap', [280, 18, 2, 22], [['portion', 150]]],
  ['iskender', 'İskender kebap', [200, 11, 12, 12], [['portion', 350]]],
  ['doner_chicken', 'Tavuk döner (et)', [190, 22, 3, 10], [['portion', 150]]],
  ['fish_grilled', 'Izgara levrek', [125, 23, 0, 3.5], [['portion', 200]]],
  ['rice_pilaf', 'Pirinç pilavı', [160, 2.8, 30, 3.5], [['plate', 180], ['tablespoon', 20]]],
  ['bulgur_pilaf', 'Bulgur pilavı', [120, 3.5, 22, 2.5], [['plate', 180], ['tablespoon', 20]]],
  ['pasta', 'Makarna (haşlanmış)', [158, 5.8, 31, 0.9], [['plate', 200]]],
  ['kuru_fasulye', 'Kuru fasulye', [110, 6, 14, 3], [['plate', 250]]],
  ['chickpea_stew', 'Nohut yemeği', [120, 6, 16, 3.5], [['plate', 250]]],
  ['karniyarik', 'Karnıyarık', [120, 5, 8, 8], [['portion', 250]]],
  ['manti', 'Mantı (yoğurtlu)', [180, 8, 22, 6.5], [['plate', 300]]],
  ['lahmacun', 'Lahmacun', [230, 10, 30, 8], [['piece', 150]]],
  ['pide_kashar', 'Kaşarlı pide', [260, 12, 30, 10], [['piece', 250]]],
  ['lentil_soup', 'Mercimek çorbası', [60, 3.5, 9, 1.5], [['bowl', 250]]],
  ['ezogelin', 'Ezogelin çorbası', [60, 3, 9, 1.5], [['bowl', 250]]],

  // Börek, tatlı, atıştırmalık
  ['su_boregi', 'Su böreği', [260, 10, 22, 15], [['slice', 120]]],
  ['sigara_boregi', 'Sigara böreği', [300, 10, 25, 18], [['piece', 25]]],
  ['baklava', 'Fıstıklı baklava', [430, 7, 50, 23], [['slice', 40]]],
  ['fries', 'Patates kızartması', [312, 3.4, 41, 15], [['portion', 120]]],
  ['milk_chocolate', 'Sütlü çikolata', [535, 7.6, 59, 30], [['square', 5], ['package', 80]]],
  ['mixed_nuts', 'Karışık kuruyemiş', [607, 20, 21, 54], [['handful', 30]]],

  // Süt ürünleri ve içecekler
  ['yogurt', 'Yoğurt (tam yağlı)', [61, 3.5, 4.7, 3.3], [['bowl', 150], ['tablespoon', 15]]],
  ['milk', 'Süt (tam yağlı)', [61, 3.2, 4.8, 3.3], [['glass', 200]]],
  ['ayran', 'Ayran', [37, 1.8, 2.6, 2], [['glass', 200]]],
  ['tea', 'Çay (şekersiz)', [1, 0, 0.3, 0], [['glass', 100]]],
  ['turkish_coffee', 'Türk kahvesi (şekersiz)', [2, 0.1, 0.3, 0], [['cup', 70]]],
  ['cola', 'Kola', [42, 0, 10.6, 0], [['can', 330], ['glass', 200]]],
  ['sugar_cube', 'Kesme şeker', [400, 0, 100, 0], [['piece', 4]]],
  ['olive_oil', 'Zeytinyağı', [884, 0, 0, 100], [['tablespoon', 13], ['teaspoon', 4.5]]],
];

export const CATALOG: Food[] = ROWS.map(([id, name, [kcal, protein, carbs, fat], portions]) => ({
  key: `cat:${id}`,
  name,
  per100g: { kcal, protein, carbs, fat } satisfies Per100g,
  portions: portions.map(([unit, grams]): Portion => ({ unit, grams })),
  source: 'catalog',
}));

const byKey = new Map(CATALOG.map((f) => [f.key, f]));
export const getCatalogFood = (key: string) => byKey.get(key) ?? null;

/** Türkçe karakterleri sadeleştirir: "Şiş Köfte" → "sis kofte". */
export function normalizeSearch(text: string): string {
  return text
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const indexed = CATALOG.map((f) => ({ food: f, text: normalizeSearch(f.name) }));

/** Tüm kelimeleri içerenler; kelime başı eşleşmesi öne alınır. */
export function searchCatalog(query: string, limit = 20): Food[] {
  const terms = normalizeSearch(query).split(' ').filter(Boolean);
  if (terms.length === 0) return [];
  return indexed
    .filter(({ text }) => terms.every((t) => text.includes(t)))
    .map(({ food, text }) => ({
      food,
      score: terms.reduce((s, t) => s + (text.startsWith(t) ? 3 : text.includes(` ${t}`) ? 2 : 1), 0),
    }))
    .sort((a, b) => b.score - a.score || a.food.name.localeCompare(b.food.name, 'tr'))
    .slice(0, limit)
    .map((r) => r.food);
}
