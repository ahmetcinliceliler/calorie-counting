import {
  BodyProfile,
  calculateBMR,
  calculateDailyCalorieGoal,
  calculateMacroGoals,
  calculateTDEE,
  exerciseCalories,
  scaleNutrients,
} from '../nutrition';

const male: BodyProfile = {
  gender: 'male',
  weightKg: 80,
  heightCm: 180,
  age: 30,
  activity: 'moderate',
  goal: 'maintain',
};

describe('BMR / TDEE', () => {
  it('Mifflin-St Jeor erkek', () => {
    // 800 + 1125 - 150 + 5
    expect(calculateBMR(male)).toBe(1780);
  });

  it('Mifflin-St Jeor kadın', () => {
    expect(calculateBMR({ ...male, gender: 'female', weightKg: 60, heightCm: 165 })).toBe(1320);
  });

  it('aktivite çarpanı uygulanır', () => {
    expect(calculateTDEE(male)).toBe(Math.round(1780 * 1.55));
  });
});

describe('günlük hedef', () => {
  it('kilo verme hedefi 500 kcal açık verir', () => {
    expect(calculateDailyCalorieGoal({ ...male, goal: 'lose' })).toBe(calculateTDEE(male) - 500);
  });

  it('güvenli alt sınırın altına inmez', () => {
    const small: BodyProfile = {
      gender: 'female',
      weightKg: 45,
      heightCm: 150,
      age: 60,
      activity: 'sedentary',
      goal: 'lose',
    };
    expect(calculateDailyCalorieGoal(small)).toBe(1200);
  });
});

describe('makro hedefleri', () => {
  it('makrolar toplam kaloriyle tutarlı', () => {
    const cal = calculateDailyCalorieGoal(male);
    const m = calculateMacroGoals(male, cal);
    expect(m.protein).toBe(128);
    const total = m.protein * 4 + m.carbs * 4 + m.fat * 9;
    expect(Math.abs(total - cal)).toBeLessThan(10);
  });
});

describe('egzersiz', () => {
  it('kullanıcının kilosunu kullanır', () => {
    expect(exerciseCalories(7, 30, 80)).toBe(280);
    expect(exerciseCalories(7, 30, 60)).toBe(210);
  });

  it('geçersiz girdide 0', () => {
    expect(exerciseCalories(7, 0, 80)).toBe(0);
  });
});

describe('scaleNutrients', () => {
  it('100 g değerlerini grama ölçekler', () => {
    expect(scaleNutrients({ calories: 165, protein: 31, carbs: 0, fat: 3.6 }, 150)).toEqual({
      calories: 248,
      protein: 46.5,
      carbs: 0,
      fat: 5.4,
    });
  });
});
