import { reviewToEntries, scaledNutrients, toReviewItems } from '../photo';

const detected = [
  { name: 'Pilav', grams: 180, kcal: 288, protein: 5, carbs: 54, fat: 6.3, confidence: 0.9 },
  { name: 'Kuru fasulye', grams: 250, kcal: 275, protein: 15, carbs: 35, fat: 7.5, confidence: 0.4 },
];

describe('foto inceleme', () => {
  it('gram değişince besinleri orantılı ölçekler', () => {
    const [rice] = toReviewItems(detected);
    expect(scaledNutrients({ ...rice, editedGrams: 90 })).toEqual({ kcal: 144, protein: 2.5, carbs: 27, fat: 3.2 });
  });

  it('çıkarılan ve sıfır gramlıkları kaydetmez', () => {
    const items = toReviewItems(detected);
    items[1].included = false;
    const entries = reviewToEntries(items, { day: '2026-10-08', meal: 'lunch' });
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ name: 'Pilav', grams: 180, kcal: 288, source: 'photo', meal: 'lunch' });

    items[0].editedGrams = 0;
    expect(reviewToEntries(items, { day: '2026-10-08', meal: 'lunch' })).toEqual([]);
  });
});
