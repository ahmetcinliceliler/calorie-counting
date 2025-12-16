import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@DietTracker:Favorites';
const HISTORY_KEY = '@DietTracker:FoodHistory';

// --- FAVORITES ---
export const getFavorites = async () => {
    try {
        const jsonValue = await AsyncStorage.getItem(FAVORITES_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
        console.error("Error reading favorites", e);
        return [];
    }
};

export const toggleFavorite = async (foodItem) => {
    try {
        const favorites = await getFavorites();
        const existingIndex = favorites.findIndex(f => f.name === foodItem.name);

        let newFavorites;
        if (existingIndex >= 0) {
            // Remove
            newFavorites = favorites.filter(f => f.name !== foodItem.name);
        } else {
            // Add
            newFavorites = [...favorites, foodItem];
        }

        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
        return newFavorites;
    } catch (e) {
        console.error("Error toggling favorite", e);
        return [];
    }
};

export const isFavorite = (favorites, foodName) => {
    return favorites.some(f => f.name === foodName);
};

// --- HISTORY & FREQUENT ---
export const getHistory = async () => {
    try {
        const jsonValue = await AsyncStorage.getItem(HISTORY_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
        console.error("Error reading history", e);
        return [];
    }
};

export const addToHistory = async (foodItem) => {
    try {
        const history = await getHistory();

        // Remove if exists (to move to top)
        const filteredHistory = history.filter(h => h.name !== foodItem.name);

        // Add to top, limit to 50 items
        const newHistory = [foodItem, ...filteredHistory].slice(0, 50);

        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
        return newHistory;
    } catch (e) {
        console.error("Error adding to history", e);
        return [];
    }
};

// Sık yenenleri geçmişten türetelim (Basit versiyon: Geçmişte en çok tekrar edenler değil, 
// çünkü geçmişi unique tutuyoruz. O yüzden 'usageCount' tutmak lazım.
// Şimdilik basitlik adına: Geçmiş listesini olduğu gibi döndürelim ama 
// ileride her eklemede sayaç artırılabilir.)
// Gelişmiş versiyon için ayrı bir key tutmak daha iyi olur ama şimdilik History yeterli.
// Kullanıcı isteği "Sık Eklenenler" olduğu için, history'de count tutarak sort edebiliriz.

const FREQUENT_KEY = '@DietTracker:FrequentFoods';

export const getFrequent = async () => {
    try {
        const jsonValue = await AsyncStorage.getItem(FREQUENT_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
        console.error("Error reading frequent", e);
        return [];
    }
};

export const updateFrequent = async (foodItem) => {
    try {
        const frequent = await getFrequent();
        const existingIndex = frequent.findIndex(f => f.name === foodItem.name);

        let newFrequent = [...frequent];
        if (existingIndex >= 0) {
            newFrequent[existingIndex].count = (newFrequent[existingIndex].count || 1) + 1;
        } else {
            newFrequent.push({ ...foodItem, count: 1 });
        }

        // Sort by count desc
        newFrequent.sort((a, b) => b.count - a.count);

        await AsyncStorage.setItem(FREQUENT_KEY, JSON.stringify(newFrequent));
        return newFrequent;
    } catch (e) {
        console.error("Error updating frequent", e);
        return [];
    }
};
