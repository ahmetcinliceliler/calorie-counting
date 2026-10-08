import type { Food, Portion } from '@/features/food/types';

// OpenFoodFacts: açık ürün veritabanı (ODbL lisansı; uygulamada kaynak belirtilmeli).
const BASE = 'https://world.openfoodfacts.org';
const FIELDS = [
  'code',
  'product_name',
  'product_name_tr',
  'brands',
  'nutriments',
  'serving_quantity',
  'product_quantity',
  'image_small_url',
].join(',');

// Tarayıcı User-Agent'ı değiştirmeye izin vermez; native'de OFF'un istediği tanımlayıcıyı göndeririz.
const HEADERS = { 'User-Agent': 'KaloriLens/2.0 (mobile app)' };

export interface OffProduct {
  code?: string;
  product_name?: string;
  product_name_tr?: string;
  brands?: string;
  nutriments?: Record<string, unknown>;
  serving_quantity?: number | string;
  product_quantity?: number | string;
  image_small_url?: string;
}

const n = (v: unknown): number | null => {
  const x = typeof v === 'string' ? Number(v.replace(',', '.')) : v;
  return typeof x === 'number' && Number.isFinite(x) && x >= 0 ? x : null;
};

/**
 * OFF ürününü Food'a çevirir. Kalori yoksa (kJ'den de hesaplanamıyorsa) null döner;
 * bu durumda çağıran taraf AI tahminine düşebilir.
 */
export function mapOffProduct(p: OffProduct): Food | null {
  const code = p.code?.trim();
  const name = (p.product_name_tr || p.product_name || '').trim();
  if (!code || !name) return null;

  const nut = p.nutriments ?? {};
  const kcal = n(nut['energy-kcal_100g']) ?? (n(nut['energy_100g']) !== null ? n(nut['energy_100g'])! / 4.184 : null);
  if (kcal === null) return null;

  const r1 = (v: number) => Math.round(v * 10) / 10;
  const portions: Portion[] = [];
  const serving = n(p.serving_quantity);
  const pack = n(p.product_quantity);
  if (serving && serving > 0 && serving <= 2000) portions.push({ unit: 'portion', grams: serving });
  if (pack && pack > 0 && pack <= 5000 && pack !== serving) portions.push({ unit: 'package', grams: pack });

  const brand = p.brands?.split(',')[0]?.trim();
  return {
    key: `off:${code}`,
    name: brand && !name.toLocaleLowerCase('tr').includes(brand.toLocaleLowerCase('tr')) ? `${name} (${brand})` : name,
    per100g: {
      kcal: Math.round(kcal),
      protein: r1(n(nut['proteins_100g']) ?? 0),
      carbs: r1(n(nut['carbohydrates_100g']) ?? 0),
      fat: r1(n(nut['fat_100g']) ?? 0),
    },
    portions,
    source: 'openfoodfacts',
    barcode: code,
    imageUrl: p.image_small_url ?? null,
  };
}

export type BarcodeLookup =
  | { status: 'found'; food: Food }
  | { status: 'no_nutrients'; name: string; barcode: string }
  | { status: 'not_found' };

async function getJson(url: string, signal?: AbortSignal): Promise<any> {
  const res = await fetch(url, { headers: HEADERS, signal });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`OpenFoodFacts ${res.status}`);
  return res.json();
}

export async function lookupBarcode(barcode: string, signal?: AbortSignal): Promise<BarcodeLookup> {
  if (!/^\d{8,14}$/.test(barcode)) return { status: 'not_found' };
  const data = await getJson(`${BASE}/api/v2/product/${barcode}.json?fields=${FIELDS}`, signal);
  if (!data || data.status !== 1 || !data.product) return { status: 'not_found' };
  const food = mapOffProduct({ ...data.product, code: data.product.code ?? barcode });
  if (food) return { status: 'found', food };
  const name = (data.product.product_name_tr || data.product.product_name || '').trim();
  return name ? { status: 'no_nutrients', name, barcode } : { status: 'not_found' };
}

export async function searchProducts(query: string, signal?: AbortSignal): Promise<Food[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const params = new URLSearchParams({
    search_terms: q,
    search_simple: '1',
    json: '1',
    page_size: '20',
    lc: 'tr',
    fields: FIELDS,
  });
  const data = await getJson(`${BASE}/cgi/search.pl?${params}`, signal);
  const products: OffProduct[] = Array.isArray(data?.products) ? data.products : [];
  const seen = new Set<string>();
  return products
    .map(mapOffProduct)
    .filter((f): f is Food => f !== null && !seen.has(f.key) && (seen.add(f.key), true));
}
