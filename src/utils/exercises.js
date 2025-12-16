export const EXERCISE_TYPES = [
    { id: 'walking', name: 'Yürüyüş (Hafif)', met: 3.5, icon: 'walk' },
    { id: 'walking_brisk', name: 'Yürüyüş (Tempolu)', met: 5.0, icon: 'walk' },
    { id: 'running', name: 'Koşu (Hafif)', met: 7.0, icon: 'run' },
    { id: 'running_fast', name: 'Koşu (Hızlı)', met: 10.0, icon: 'run' },
    { id: 'cycling', name: 'Bisiklet', met: 6.0, icon: 'bicycle' },
    { id: 'swimming', name: 'Yüzme', met: 8.0, icon: 'water' },
    { id: 'gym', name: 'Fitness / Ağırlık', met: 5.0, icon: 'barbell' },
    { id: 'yoga', name: 'Yoga', met: 3.0, icon: 'body' },
    { id: 'pilates', name: 'Pilates', met: 3.5, icon: 'body' },
    { id: 'hiit', name: 'HIIT', met: 8.0, icon: 'flash' },
    { id: 'basketball', name: 'Basketbol', met: 6.5, icon: 'basketball' },
    { id: 'football', name: 'Futbol', met: 7.0, icon: 'football' },
];

// Ortalama bir insan kilosu (70kg) üzerinden varsayılan hesaplama
// Kalori = MET * Kilo * Saat
export const calculateCalories = (met, durationMinutes, weightKg = 70) => {
    const durationHours = durationMinutes / 60;
    return Math.round(met * weightKg * durationHours);
};
