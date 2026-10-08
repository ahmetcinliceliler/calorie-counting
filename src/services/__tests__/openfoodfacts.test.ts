import { lookupBarcode, mapOffProduct } from '../openfoodfacts';

describe('mapOffProduct', () => {
  it('100 g değerlerini, porsiyonu ve markayı alır', () => {
    expect(
      mapOffProduct({
        code: '8690504000000',
        product_name: 'Çikolatalı Gofret',
        brands: 'Ülker, Yıldız',
        nutriments: { 'energy-kcal_100g': 527.4, proteins_100g: '6,2', carbohydrates_100g: 61, fat_100g: 28.04 },
        serving_quantity: 36,
        product_quantity: '36',
        image_small_url: 'https://img/x.jpg',
      }),
    ).toEqual({
      key: 'off:8690504000000',
      name: 'Çikolatalı Gofret (Ülker)',
      per100g: { kcal: 527, protein: 6.2, carbs: 61, fat: 28 },
      portions: [{ unit: 'portion', grams: 36 }],
      source: 'openfoodfacts',
      barcode: '8690504000000',
      imageUrl: 'https://img/x.jpg',
    });
  });

  it('kcal yoksa kJ değerinden hesaplar', () => {
    expect(mapOffProduct({ code: '1', product_name: 'Su', nutriments: { energy_100g: 418.4 } })?.per100g.kcal).toBe(100);
  });

  it('Türkçe adı tercih eder, marka zaten adda ise tekrar etmez', () => {
    const food = mapOffProduct({
      code: '1',
      product_name: 'Wafer',
      product_name_tr: 'Ülker Gofret',
      brands: 'Ülker',
      nutriments: { 'energy-kcal_100g': 500 },
    });
    expect(food?.name).toBe('Ülker Gofret');
  });

  it('enerji bilgisi veya ad yoksa null', () => {
    expect(mapOffProduct({ code: '1', product_name: 'X', nutriments: {} })).toBeNull();
    expect(mapOffProduct({ code: '1', nutriments: { 'energy-kcal_100g': 1 } })).toBeNull();
  });
});

describe('lookupBarcode', () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  const mockFetch = (status: number, body: unknown) => {
    globalThis.fetch = jest.fn(async () => ({ ok: status < 400, status, json: async () => body })) as any;
  };

  it('geçersiz barkodda ağa çıkmaz', async () => {
    globalThis.fetch = jest.fn();
    expect(await lookupBarcode('abc')).toEqual({ status: 'not_found' });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('bulunan ürün', async () => {
    mockFetch(200, { status: 1, product: { product_name: 'Ayran', nutriments: { 'energy-kcal_100g': 37 } } });
    const r = await lookupBarcode('86900000000');
    expect(r).toMatchObject({ status: 'found', food: { key: 'off:86900000000', name: 'Ayran' } });
  });

  it('besin değeri olmayan ürün', async () => {
    mockFetch(200, { status: 1, product: { product_name: 'Gizemli bisküvi', nutriments: {} } });
    expect(await lookupBarcode('86900000001')).toEqual({
      status: 'no_nutrients',
      name: 'Gizemli bisküvi',
      barcode: '86900000001',
    });
  });

  it('404 veya status 0 → not_found', async () => {
    mockFetch(404, null);
    expect(await lookupBarcode('86900000002')).toEqual({ status: 'not_found' });
    mockFetch(200, { status: 0 });
    expect(await lookupBarcode('86900000002')).toEqual({ status: 'not_found' });
  });
});
