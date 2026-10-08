import { addDays, formatDisplayDate, isFuture, lastNDays, localDateKey, parseDateKey } from '../date';

describe('localDateKey', () => {
  it('yerel tarihi kullanır, UTC değil', () => {
    // Yerel 00:30 — UTC+3'te toISOString önceki günü verirdi.
    const d = new Date(2026, 9, 8, 0, 30);
    expect(localDateKey(d)).toBe('2026-10-08');
  });

  it('ay ve günü sıfırla doldurur', () => {
    expect(localDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('addDays / parseDateKey', () => {
  it('ay ve yıl sınırını geçer', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('parse edilen tarih geri aynı anahtarı verir', () => {
    expect(localDateKey(parseDateKey('2026-10-08'))).toBe('2026-10-08');
  });
});

describe('yardımcılar', () => {
  it('isFuture', () => {
    expect(isFuture('2026-10-09', '2026-10-08')).toBe(true);
    expect(isFuture('2026-10-08', '2026-10-08')).toBe(false);
  });

  it('lastNDays eskiden yeniye sıralı', () => {
    expect(lastNDays(3, '2026-10-01')).toEqual(['2026-09-29', '2026-09-30', '2026-10-01']);
  });

  it('formatDisplayDate', () => {
    expect(formatDisplayDate('2026-10-08', '2026-10-08')).toBe('today');
    expect(formatDisplayDate('2026-10-07', '2026-10-08')).toBe('yesterday');
    expect(formatDisplayDate('2026-10-01', '2026-10-08')).toBe('01.10.2026');
  });
});
