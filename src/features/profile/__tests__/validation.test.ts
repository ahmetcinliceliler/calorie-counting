import { validateBody } from '../validation';

const valid = { weightKg: '72,5', heightCm: '178', age: '30', targetWeightKg: '' };

describe('validateBody', () => {
  it('geçerli girdiyi sayıya çevirir, virgülü kabul eder', () => {
    expect(validateBody(valid)).toEqual({
      ok: true,
      data: { weightKg: 72.5, heightCm: 178, age: 30, targetWeightKg: null },
    });
  });

  it('aralık dışı kiloyu reddeder', () => {
    expect(validateBody({ ...valid, weightKg: '5' })).toEqual({
      ok: false,
      errorKey: 'onboarding.invalid.weight',
    });
  });

  it('boş ya da sayı olmayan boyu reddeder', () => {
    expect(validateBody({ ...valid, heightCm: 'abc' })).toMatchObject({ errorKey: 'onboarding.invalid.height' });
    expect(validateBody({ ...valid, heightCm: '' })).toMatchObject({ errorKey: 'onboarding.invalid.height' });
  });

  it('ondalıklı yaşı reddeder', () => {
    expect(validateBody({ ...valid, age: '30.5' })).toMatchObject({ errorKey: 'onboarding.invalid.age' });
  });

  it('hedef kilo verilirse doğrular', () => {
    expect(validateBody({ ...valid, targetWeightKg: '68' })).toMatchObject({ ok: true });
    expect(validateBody({ ...valid, targetWeightKg: '1000' })).toMatchObject({
      errorKey: 'onboarding.invalid.targetWeight',
    });
  });
});
