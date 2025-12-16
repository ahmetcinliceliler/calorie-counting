export const calculateBMR = (weight, height, age, gender) => {
    // Mifflin-St Jeor Denklemi
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);

    if (gender === 'male') {
        bmr += 5;
    } else {
        bmr -= 161;
    }

    return Math.round(bmr);
};

export const calculateDailyGoal = (bmr, activityLevel, goalType) => {
    // Aktivite Çarpanları
    const activityMultipliers = {
        sedentary: 1.2,      // Hareketsiz
        light: 1.375,        // Az Hareketli
        moderate: 1.55,      // Orta Hareketli
        active: 1.725,       // Çok Hareketli
        veryActive: 1.9      // Aşırı Hareketli
    };

    const tdee = bmr * (activityMultipliers[activityLevel] || 1.2);

    // Hedef Ayarlaması
    let finalGoal = tdee;
    if (goalType === 'lose') {
        finalGoal -= 500; // Kilo vermek için -500 kcal
    } else if (goalType === 'gain') {
        finalGoal += 500; // Kilo almak için +500 kcal
    }

    return Math.round(finalGoal);
};
