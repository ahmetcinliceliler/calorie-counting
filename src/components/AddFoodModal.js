import React, { useState, useEffect } from 'react';
import {
    StyleSheet, View, TextInput, FlatList, Text,
    ActivityIndicator, TouchableOpacity, Image, Modal, Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
// foodStorage importlarının doğru çalıştığını varsayıyorum
import { getFavorites, toggleFavorite, isFavorite, getHistory, getFrequent } from '../utils/foodStorage';

const { width, height } = Dimensions.get('window');

// ---------------------------------------------------
// V5 LOKAL VERİ TABANI: %100 Çalışan Garantili Linkler
// ---------------------------------------------------
const localFoods = [
    // --- MEYVE & SEBZE ---
    { id: 'local_1', product_name: 'Taze Elma', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, image_url: 'https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?w=400' },
    { id: 'local_2', product_name: 'Muz', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, image_url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400' },
    { id: 'local_9', product_name: 'Mevsim Salata', calories: 50, protein: 2, carbs: 10, fat: 0, image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400' },
    { id: 'local_13', product_name: 'Siyah Zeytin', calories: 45, protein: 0, carbs: 1, fat: 5, image_url: 'https://images.unsplash.com/photo-1625867396030-9b49b7774026?w=400' },
    { id: 'local_32', product_name: 'Ceviz İçi', calories: 160, protein: 4, carbs: 3.5, fat: 15, image_url: 'https://images.unsplash.com/photo-1573032731839-445694200e08?w=400' },

    // --- KAHVALTILIK & TEMEL ---
    { id: 'local_3', product_name: 'Haşlanmış Yumurta', calories: 78, protein: 6, carbs: 0.6, fat: 5, image_url: 'https://images.unsplash.com/photo-1491524062933-cb028df96960?w=400' },
    { id: 'local_4', product_name: 'Ekmek (1 Dilim)', calories: 67, protein: 2, carbs: 13, fat: 1, image_url: 'https://images.unsplash.com/photo-1598373182133-52452f7691ef?w=400' },
    { id: 'local_12', product_name: 'Beyaz Peynir', calories: 75, protein: 5, carbs: 1, fat: 6, image_url: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400' },
    { id: 'local_21', product_name: 'Simit', calories: 270, protein: 9, carbs: 50, fat: 4, image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Turkish_bagel_%28simit%29.jpg/600px-Turkish_bagel_%28simit%29.jpg' },
    { id: 'local_31', product_name: 'Kaşarlı Tost', calories: 350, protein: 18, carbs: 30, fat: 18, image_url: 'https://images.unsplash.com/photo-1525351484163-7529414395d8?w=400' },
    { id: 'local_14', product_name: 'Yulaf Ezmesi', calories: 190, protein: 6, carbs: 34, fat: 3, image_url: 'https://images.unsplash.com/photo-1517673400267-02514409980d?w=400' },

    // --- ANA YEMEKLER ---
    { id: 'local_5', product_name: 'Izgara Tavuk', calories: 165, protein: 31, carbs: 0, fat: 3.6, image_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400' },
    { id: 'local_6', product_name: 'Pirinç Pilavı', calories: 200, protein: 4, carbs: 44, fat: 0.5, image_url: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=400' },
    { id: 'local_7', product_name: 'Makarna', calories: 220, protein: 8, carbs: 43, fat: 1, image_url: 'https://images.unsplash.com/photo-1598965402089-897ce52e8355?w=400' },
    { id: 'local_11', product_name: 'Izgara Köfte', calories: 60, protein: 5, carbs: 1, fat: 4, image_url: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=400' },
    { id: 'local_23', product_name: 'Menemen', calories: 250, protein: 15, carbs: 10, fat: 18, image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Menemen_Turkish.JPG/600px-Menemen_Turkish.JPG' },
    { id: 'local_24', product_name: 'Lahmacun', calories: 300, protein: 15, carbs: 35, fat: 12, image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Lahmacun.jpg/600px-Lahmacun.jpg' },
    { id: 'local_25', product_name: 'İskender Kebap', calories: 750, protein: 45, carbs: 50, fat: 45, image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Iskender_kebab_01.jpg/600px-Iskender_kebab_01.jpg' },
    { id: 'local_35', product_name: 'Adana Kebap', calories: 350, protein: 30, carbs: 5, fat: 23, image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Adana_kebab.jpg/600px-Adana_kebab.jpg' },
    { id: 'local_10', product_name: 'Mercimek Çorbası', calories: 130, protein: 9, carbs: 18, fat: 3, image_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400' },
    { id: 'local_16', product_name: 'Izgara Balık', calories: 250, protein: 30, carbs: 0, fat: 12, image_url: 'https://images.unsplash.com/photo-1544025162-d76690b67f11?w=400' },

    // --- ATIŞTIRMALIK & TATLI ---
    { id: 'local_26', product_name: 'Baklava (1 Dilim)', calories: 250, protein: 3, carbs: 35, fat: 12, image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Baklava%281%29.png/600px-Baklava%281%29.png' },
    { id: 'local_33', product_name: 'Sigara Böreği', calories: 120, protein: 5, carbs: 10, fat: 7, image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Sigara_boregi.jpg/600px-Sigara_boregi.jpg' },
    { id: 'local_28', product_name: 'Patates Kızartması', calories: 280, protein: 3, carbs: 35, fat: 15, image_url: 'https://images.unsplash.com/photo-1573080496987-a199f8cd75ec?w=400' },
    { id: 'local_18', product_name: 'Çikolata', calories: 60, protein: 1, carbs: 7, fat: 4, image_url: 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=400' },
    { id: 'local_17', product_name: 'Kuruyemiş', calories: 180, protein: 5, carbs: 6, fat: 16, image_url: 'https://images.unsplash.com/photo-1596283733072-c598006e8e59?w=400' },

    // --- İÇECEKLER ---
    { id: 'local_27', product_name: 'Çay', calories: 1, protein: 0, carbs: 0, fat: 0, image_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400' },
    { id: 'local_19', product_name: 'Türk Kahvesi', calories: 2, protein: 0, carbs: 0, fat: 0, image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400' },
    { id: 'local_22', product_name: 'Ayran', calories: 60, protein: 3, carbs: 5, fat: 3, image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Ayran_in_a_glass.jpg/600px-Ayran_in_a_glass.jpg' },
    { id: 'local_29', product_name: 'Coca Cola', calories: 140, protein: 0, carbs: 39, fat: 0, image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400' },
    { id: 'local_15', product_name: 'Süt', calories: 120, protein: 8, carbs: 12, fat: 5, image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400' },
];

export default function AddFoodModal({ visible, onClose, onFoodAdd }) {
    const [activeTab, setActiveTab] = useState('search');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [history, setHistory] = useState([]);
    const [frequent, setFrequent] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            loadLists();
            if (activeTab === 'search' && query === '') {
                setResults(localFoods);
            }
        }
    }, [visible, activeTab]);

    const loadLists = async () => {
        const dummyHistory = localFoods.slice(0, 5);
        setHistory(dummyHistory);
        setFavorites([]);
        setFrequent([]);
    };

    const handleToggleFavorite = async (item) => {
        console.log(`Favori ekleme/çıkarma denendi: ${item.product_name}`);
    };

    const searchFood = async () => {
        if (query.trim() === '') {
            setResults(localFoods);
            return;
        }
        setIsLoading(true);
        setResults([]);

        // 1. Lokal DB araması
        const localMatches = localFoods.filter(food =>
            food.product_name.toLowerCase().includes(query.toLowerCase())
        );

        // 2. OpenFoodFacts API araması (Hibrid)
        const url = `https://tr.openfoodfacts.org/cgi/search.pl?search_terms=${query}&json=1&page_size=10`;
        try {
            const response = await axios.get(url);
            let apiProducts = [];
            if (response.data && response.data.products) {
                apiProducts = response.data.products;
            }

            // Makro verilerini OFA'dan çekiyoruz
            const formattedApiProducts = apiProducts.map(item => ({
                id: item.code || Math.random().toString(),
                product_name: item.product_name || 'Bilinmeyen Ürün',
                calories: Math.round(item.nutriments?.['energy-kcal_100g'] || 0),
                protein: Math.round(item.nutriments?.['proteins_100g'] || 0),
                carbs: Math.round(item.nutriments?.['carbohydrates_100g'] || 0),
                fat: Math.round(item.nutriments?.['fat_100g'] || 0),
                // OFA'nın kendi görselini kullan
                image_url: item.image_small_url
            }));

            setResults([...localMatches, ...formattedApiProducts]);
        } catch (error) {
            setResults(localMatches);
        } finally {
            setIsLoading(false);
        }
    };

    const renderItem = ({ item }) => {
        const name = item.product_name || item.name;
        // const isFav = isFavorite(favorites, name); 

        // GÖRSELİN YOKSA, YEMEK İKONU KULLAN
        const imageToDisplay = item.image_url ? { uri: item.image_url } : null;

        return (
            <View style={styles.itemContainer}>
                <TouchableOpacity
                    style={styles.itemContent}
                    onPress={() => {
                        onFoodAdd({
                            name: name,
                            calories: item.calories,
                            protein: item.protein,
                            carbs: item.carbs,
                            fat: item.fat,
                            portion: '1 Porsiyon'
                        });
                    }}
                >
                    {/* YENİ: GÖRSEL ALANI (Hata vermemesi için Image yerine View fallback) */}
                    {imageToDisplay ? (
                        <Image source={imageToDisplay} style={styles.productImage} />
                    ) : (
                        <View style={[styles.productImage, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
                            <Text style={{ fontSize: 20 }}>🍽️</Text>
                        </View>
                    )}

                    {/* Yazı Alanı */}
                    <View style={styles.textContainer}>
                        <Text style={styles.itemName}>{name}</Text>
                        <Text style={styles.itemCalories}>{item.calories} kcal</Text>

                        {/* Makro Değerleri */}
                        {item.protein !== undefined && item.protein !== 0 && (
                            <Text style={styles.itemMacros}>
                                P:{item.protein} K:{item.carbs} Y:{item.fat}
                            </Text>
                        )}
                    </View>
                </TouchableOpacity>

                {/* Favori Butonu (Dummy) */}
                <TouchableOpacity onPress={() => handleToggleFavorite(item)} style={styles.favBtn}>
                    <Ionicons name={"heart-outline"} size={24} color={"#8E8E93"} />
                </TouchableOpacity>
            </View>
        );
    };

    const getData = () => {
        switch (activeTab) {
            case 'search': return results;
            case 'favorites': return favorites;
            case 'history': return history;
            case 'frequent': return frequent;
            default: return [];
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Yiyecek Ekle</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* TABS */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity onPress={() => setActiveTab('search')} style={[styles.tab, activeTab === 'search' && styles.activeTab]}>
                        <Ionicons name="search" size={20} color={activeTab === 'search' ? '#000' : '#8E8E93'} />
                        <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>Ara</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab('favorites')} style={[styles.tab, activeTab === 'favorites' && styles.activeTab]}>
                        <Ionicons name="heart" size={20} color={activeTab === 'favorites' ? '#000' : '#8E8E93'} />
                        <Text style={[styles.tabText, activeTab === 'favorites' && styles.activeTabText]}>Favoriler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab('history')} style={[styles.tab, activeTab === 'history' && styles.activeTab]}>
                        <Ionicons name="time" size={20} color={activeTab === 'history' ? '#000' : '#8E8E93'} />
                        <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>Geçmiş</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab('frequent')} style={[styles.tab, activeTab === 'frequent' && styles.activeTab]}>
                        <Ionicons name="stats-chart" size={20} color={activeTab === 'frequent' ? '#000' : '#8E8E93'} />
                        <Text style={[styles.tabText, activeTab === 'frequent' && styles.activeTabText]}>Sık</Text>
                    </TouchableOpacity>
                </View>

                {activeTab === 'search' && (
                    <View style={styles.searchBox}>
                        <Ionicons name="search" size={20} color="#8E8E93" style={{ marginRight: 10 }} />
                        <TextInput
                            style={styles.input}
                            placeholder="Ne yediniz? (Örn: Simit, Tost)..."
                            placeholderTextColor="#666"
                            value={query}
                            onChangeText={setQuery}
                            onSubmitEditing={searchFood}
                        />
                        <TouchableOpacity onPress={searchFood} style={styles.searchBtn}>
                            <Text style={{ color: '#000', fontWeight: 'bold' }}>Ara</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {isLoading ? (
                    <ActivityIndicator size="large" color="#CCFF00" style={{ marginTop: 40 }} />
                ) : (
                    <FlatList
                        data={getData()}
                        renderItem={renderItem}
                        keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
                        style={styles.list}
                        contentContainerStyle={{ paddingBottom: 40 }}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>
                                    {activeTab === 'favorites' ? 'Henüz favori eklemediniz.' :
                                        activeTab === 'history' ? 'Geçmiş kaydı bulunamadı.' :
                                            activeTab === 'frequent' ? 'Henüz yeterli veri yok.' :
                                                'Sonuç bulunamadı. Lütfen aramanızı değiştirin.'}
                                </Text>
                            </View>
                        }
                    />
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingTop: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    closeBtn: {
        padding: 5,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 4,
        marginBottom: 15,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        gap: 5
    },
    activeTab: {
        backgroundColor: '#CCFF00',
    },
    tabText: {
        color: '#8E8E93',
        fontWeight: '600',
        fontSize: 12
    },
    activeTabText: {
        color: '#000',
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        paddingHorizontal: 10,
        marginBottom: 15,
        height: 50
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        height: '100%'
    },
    searchBtn: {
        backgroundColor: '#CCFF00',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginLeft: 10
    },
    list: {
        flex: 1,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        padding: 12,
        borderRadius: 16,
        marginBottom: 10,
    },
    itemContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    // GÖRSEL ALAN (Resim moduna geri döndük)
    productImage: {
        width: 50,
        height: 50,
        borderRadius: 10,
        marginRight: 15,
        resizeMode: 'cover' // Görselin kutuya tam oturmasını sağlar
    },
    textContainer: {
        flex: 1,
    },
    itemName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    itemCalories: {
        color: '#8E8E93',
        fontSize: 14,
        marginTop: 2,
    },
    itemMacros: {
        color: '#636366',
        fontSize: 11,
        marginTop: 2,
    },
    favBtn: {
        padding: 10,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        color: '#666',
        fontSize: 16,
    }
});