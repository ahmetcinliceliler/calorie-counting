import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal,
    Alert, Platform, ActivityIndicator, TextInput, StatusBar, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, AntDesign, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import DatePicker from '@react-native-community/datetimepicker';
import ConfettiCannon from 'react-native-confetti-cannon';

import AddExerciseModal from '../components/AddExerciseModal';
import BarcodeScannerModal from '../components/BarcodeScannerModal';
import AddFoodModal from '../components/AddFoodModal';
import CameraScreen from '../../CameraScreen';
import Sidebar from '../components/Sidebar';
import FabGroup from '../components/FabGroup';
import WaterTracker from '../components/WaterTracker';

import DailyQuests from '../components/DailyQuests';
import AIChefModal from '../components/AIChefModal';
import { addToHistory, updateFrequent } from '../utils/foodStorage';

import Constants from 'expo-constants';
const API_KEY = Constants.expoConfig.extra.geminiApiKey;

// --- AYARLAR ---
// BASE_GOAL artık dinamik olarak hesaplanıyor
const WATER_GOAL = 8; // YENİ: Günlük 8 bardak su hedefi
const STORAGE_KEY = '@DietTracker:CalAI_Ultra_Final_V3';

const screenWidth = Dimensions.get('window').width;

export default function HomeScreen({ navigation }) {
    const [dailyData, setDailyData] = useState({});
    const [dailyGoal, setDailyGoal] = useState(2000); // Varsayılan 2000
    const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
    const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [cameraVisible, setCameraVisible] = useState(false);
    const [scannerVisible, setScannerVisible] = useState(false);
    const [exerciseModalVisible, setExerciseModalVisible] = useState(false);
    const [chefVisible, setChefVisible] = useState(false);
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [prevCompletedCount, setPrevCompletedCount] = useState(0);
    const confettiRef = React.useRef(null);

    useEffect(() => { loadData(); }, []);
    useEffect(() => { saveData(dailyData); }, [dailyData]);

    const loadData = async () => {
        try {
            const storedData = await AsyncStorage.getItem(STORAGE_KEY);
            if (storedData !== null) setDailyData(JSON.parse(storedData));

            const profile = await AsyncStorage.getItem('@user_profile');
            if (profile !== null) {
                const { dailyGoal } = JSON.parse(profile);
                setDailyGoal(dailyGoal);
            }
        } catch (e) { console.error(e); }
    };

    const saveData = async (data) => {
        try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
        catch (e) { console.error(e); }
    };

    const currentDayObj = useMemo(() => dailyData[currentDate] || { foods: [], exercises: [], water: 0 }, [dailyData, currentDate]);
    const foods = useMemo(() => currentDayObj.foods || [], [currentDayObj]);
    const exercises = useMemo(() => currentDayObj.exercises || [], [currentDayObj]);
    const waterCount = currentDayObj.water || 0;

    const { eatenCalories, burnedCalories, totalProtein, totalCarbs, totalFat } = useMemo(() => {
        const eaten = foods.reduce((sum, item) => sum + item.calories, 0);
        const burned = exercises.reduce((sum, item) => sum + item.calories, 0);
        const protein = foods.reduce((sum, item) => sum + (item.protein || 0), 0);
        const carbs = foods.reduce((sum, item) => sum + (item.carbs || 0), 0);
        const fat = foods.reduce((sum, item) => sum + (item.fat || 0), 0);
        return { eatenCalories: eaten, burnedCalories: burned, totalProtein: protein, totalCarbs: carbs, totalFat: fat };
    }, [foods, exercises]);

    const dynamicGoal = useMemo(() => dailyGoal + burnedCalories, [dailyGoal, burnedCalories]);
    const remainingCalories = useMemo(() => dynamicGoal - eatenCalories, [dynamicGoal, eatenCalories]);
    const progressPercent = useMemo(() => Math.min(1, eatenCalories / (dynamicGoal || 1)), [eatenCalories, dynamicGoal]);

    // SU İLERLEMESİ
    const waterPercent = useMemo(() => Math.min(1, waterCount / WATER_GOAL), [waterCount]);

    const weeklyData = useMemo(() => {
        const days = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayData = dailyData[dateStr] || { foods: [] };
            const cals = (dayData.foods || []).reduce((sum, item) => sum + item.calories, 0);
            days.push({ day: d.getDate(), cals: cals, fullDate: dateStr });
        }
        return days;
    }, [dailyData]);

    const maxWeeklyCal = useMemo(() => Math.max(...weeklyData.map(d => d.cals), 2000), [weeklyData]);

    const getTodayISO = () => new Date().toISOString().split('T')[0];
    const isToday = currentDate === getTodayISO();

    // GÜNLÜK GÖREVLER
    const quests = useMemo(() => [
        {
            title: 'Su Hedefine Ulaş',
            isCompleted: waterCount >= WATER_GOAL,
            subtitle: `${waterCount}/${WATER_GOAL} Bardak`
        },
        {
            title: 'Öğün Ekle',
            isCompleted: foods.length > 0,
            subtitle: foods.length > 0 ? 'Tamamlandı' : 'Henüz eklenmedi'
        },
        {
            title: 'Egzersiz Yap',
            isCompleted: exercises.length > 0,
            subtitle: exercises.length > 0 ? 'Tamamlandı' : 'Hareket zamanı!'
        },
        {
            title: 'Kalori Sınırında Kal',
            isCompleted: remainingCalories >= 0,
            subtitle: remainingCalories >= 0 ? 'Başarılı' : 'Dikkat!'
        }
    ], [waterCount, foods.length, exercises.length, remainingCalories]);

    useEffect(() => {
        const completedCount = quests.filter(q => q.isCompleted).length;
        if (completedCount > prevCompletedCount) {
            confettiRef.current && confettiRef.current.start();
        }
        setPrevCompletedCount(completedCount);
    }, [quests]);

    const handleDateChange = useCallback((event, selectedDate) => {
        if (Platform.OS !== 'ios') setIsDatePickerVisible(false);
        if (selectedDate) {
            if (selectedDate > new Date()) {
                Alert.alert("Uyarı", "Gelecek tarihe işlem yapamazsınız.");
                setCurrentDate(getTodayISO());
            } else {
                setCurrentDate(selectedDate.toISOString().split('T')[0]);
            }
        }
    }, []);

    const changeDate = useCallback((days) => {
        setCurrentDate(prevDate => {
            const d = new Date(prevDate);
            d.setDate(d.getDate() + days);
            const newDateISO = d.toISOString().split('T')[0];
            if (newDateISO > getTodayISO()) return prevDate;
            return newDateISO;
        });
    }, []);

    const getDisplayDate = () => {
        const today = getTodayISO();
        if (currentDate === today) return 'Bugün';
        return currentDate.split('-').reverse().join('.');
    };

    const updateDailyData = useCallback((type, item) => {
        setDailyData(prevDailyData => {
            const prevObj = prevDailyData[currentDate] || { foods: [], exercises: [], water: 0 };
            const newData = { ...prevDailyData };

            if (type === 'add_food') {
                newData[currentDate] = { ...prevObj, foods: [...(prevObj.foods || []), item] };
                // Add to history and frequent
                addToHistory(item);
                updateFrequent(item);
            } else if (type === 'add_exercise') {
                newData[currentDate] = { ...prevObj, exercises: [...(prevObj.exercises || []), item] };
            } else if (type === 'delete_food') {
                const newFoods = prevObj.foods.filter((_, i) => i !== item);
                newData[currentDate] = { ...prevObj, foods: newFoods };
            } else if (type === 'delete_exercise') {
                const newEx = prevObj.exercises.filter((_, i) => i !== item);
                newData[currentDate] = { ...prevObj, exercises: newEx };
            } else if (type === 'add_water') {
                newData[currentDate] = { ...prevObj, water: (prevObj.water || 0) + 1 };
            } else if (type === 'remove_water') {
                newData[currentDate] = { ...prevObj, water: Math.max(0, (prevObj.water || 0) - 1) };
            }
            return newData;
        });

        setModalVisible(false); setCameraVisible(false); setExerciseModalVisible(false); setScannerVisible(false);
    }, [currentDate]);

    const analyzeFoodWithGemini = async (photoUri) => {
        setIsAnalyzing(true);
        setCameraVisible(false);
        try {
            const base64Img = await FileSystem.readAsStringAsync(photoUri, { encoding: 'base64' });

            if (!API_KEY) {
                Alert.alert("Hata", "API Anahtarı bulunamadı. Lütfen yapılandırmayı kontrol edin.");
                setIsAnalyzing(false);
                return;
            }

            const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

            const requestBody = {
                contents: [{
                    parts: [
                        { text: "Bu yemek fotoğrafını analiz et. Porsiyonu tahmin et. Sadece şu JSON formatında cevap ver: {\"food_name\": \"Yemek Adı\", \"calories\": 100, \"protein_g\": 10, \"carbs_g\": 20, \"fat_g\": 5, \"portion\": \"1 Porsiyon\"}" },
                        { inline_data: { mime_type: "image/jpeg", data: base64Img } }
                    ]
                }]
            };

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            if (!data.candidates) throw new Error("AI Cevap vermedi.");

            const textResponse = data.candidates[0].content.parts[0].text;
            const cleanedText = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            const foodData = JSON.parse(cleanedText);

            Alert.alert("AI Analizi 🤖", `${foodData.food_name}\nKalori: ${foodData.calories} kcal`, [
                { text: "İptal", style: "cancel" },
                {
                    text: "Ekle", onPress: () => updateDailyData('add_food', {
                        name: foodData.food_name, calories: foodData.calories, protein: foodData.protein_g,
                        carbs: foodData.carbs_g, fat: foodData.fat_g, portion: foodData.portion || '1 Porsiyon'
                    })
                }
            ]
            );
        } catch (error) {
            console.error("AI Hatası:", error);
            Alert.alert("Hata", "Analiz başarısız oldu.");
        } finally { setIsAnalyzing(false); }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#121212" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => setSidebarVisible(true)} style={styles.menuBtn}>
                    <Ionicons name="menu" size={28} color="#CCFF00" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => changeDate(-1)}><AntDesign name="left" size={20} color="#CCFF00" /></TouchableOpacity>
                <TouchableOpacity onPress={() => setIsDatePickerVisible(true)} style={styles.dateBtn}>
                    <Text style={styles.dateText}>{getDisplayDate()}</Text>
                    <MaterialIcons name="keyboard-arrow-down" size={20} color="#CCFF00" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => changeDate(1)} disabled={isToday}><AntDesign name="right" size={20} color={isToday ? '#333' : '#CCFF00'} /></TouchableOpacity>
            </View>
            {isDatePickerVisible && (<DatePicker value={new Date(currentDate)} mode="date" display="default" onChange={handleDateChange} maximumDate={new Date()} />)}

            <ScrollView style={styles.container}>
                <View style={styles.heroCard}>
                    <View style={styles.heroTextContainer}>
                        <Text style={styles.heroTitle}>Kalan Kalori</Text>
                        <Text style={[styles.heroValue, { color: remainingCalories < 0 ? '#FF453A' : '#fff' }]}>{remainingCalories}</Text>
                        <Text style={styles.heroSubtitle}>Hedef: {dynamicGoal}</Text>
                    </View>
                    <View style={styles.ringContainer}>
                        <View style={[styles.ringInner, { height: `${progressPercent * 100}%`, backgroundColor: remainingCalories < 0 ? '#FF453A' : '#CCFF00' }]} />
                    </View>
                </View>

                <View style={styles.gridContainer}>
                    {/* Makrolar */}
                    <View style={styles.gridColumn}>
                        <View style={[styles.bentoBox, { flex: 1, alignItems: 'flex-start', paddingLeft: 15 }]}>
                            <Text style={[styles.macroTitle, { color: '#32D74B' }]}>Protein</Text>
                            <Text style={styles.macroVal}>{totalProtein}g</Text>
                            <View style={[styles.macroBar, { backgroundColor: '#32D74B', width: '60%' }]} />

                            <Text style={[styles.macroTitle, { color: '#0A84FF', marginTop: 10 }]}>Karb</Text>
                            <Text style={styles.macroVal}>{totalCarbs}g</Text>
                            <View style={[styles.macroBar, { backgroundColor: '#0A84FF', width: '50%' }]} />

                            <Text style={[styles.macroTitle, { color: '#FF9F0A', marginTop: 10 }]}>Yağ</Text>
                            <Text style={styles.macroVal}>{totalFat}g</Text>
                            <View style={[styles.macroBar, { backgroundColor: '#FF9F0A', width: '30%' }]} />
                        </View>
                    </View>

                    {/* Sağ Kolon: Yakılan (Genişletildi) */}
                    <View style={[styles.gridColumn, { gap: 10 }]}>
                        <View style={[styles.bentoBox, { backgroundColor: '#1C1C1E', flex: 1 }]}>
                            <Text style={styles.bentoLabel}>Yakılan</Text>
                            <Text style={[styles.bentoValue, { color: '#FF453A', fontSize: 28 }]}>{burnedCalories}</Text>
                            <Text style={{ color: '#666', fontSize: 12 }}>kcal</Text>
                            <Ionicons name="flame" size={24} color="#FF453A" style={{ marginTop: 10 }} />
                        </View>
                    </View>
                </View>

                <WaterTracker
                    current={waterCount * 200}
                    target={WATER_GOAL * 200}
                    onAdd={() => updateDailyData('add_water')}
                    onRemove={() => updateDailyData('remove_water')}
                />

                <DailyQuests quests={quests} />


                <View style={styles.chartContainer}>
                    <Text style={styles.sectionTitle}>Son 7 Gün</Text>
                    <View style={styles.chartRow}>
                        {weeklyData.map((day, index) => {
                            const barHeight = (day.cals / maxWeeklyCal) * 100;
                            const isSelected = day.fullDate === currentDate;
                            return (
                                <View key={index} style={styles.chartBarWrapper}>
                                    <View style={[styles.chartBar, { height: `${Math.max(barHeight, 5)}%`, backgroundColor: isSelected ? '#CCFF00' : '#3A3A3C' }]} />
                                    <Text style={[styles.chartDayText, { color: isSelected ? '#CCFF00' : '#666' }]}>{day.day}</Text>
                                </View>
                            )
                        })}
                    </View>
                </View>

                <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Yediklerin</Text></View>
                {foods.map((item, index) => (
                    <View key={`food-${index}`} style={styles.listItem}>
                        <View style={styles.listIconBox}><Text style={{ fontSize: 18 }}>🍎</Text></View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={styles.listItemName}>{item.name}</Text>
                            <Text style={styles.listItemSub}>{item.calories} kcal • {item.portion}</Text>
                            {(item.protein !== undefined || item.carbs !== undefined || item.fat !== undefined) && (
                                <View style={{ flexDirection: 'row', marginTop: 4, gap: 8 }}>
                                    <Text style={{ color: '#32D74B', fontSize: 11, fontWeight: '600' }}>P: {item.protein || 0}g</Text>
                                    <Text style={{ color: '#0A84FF', fontSize: 11, fontWeight: '600' }}>K: {item.carbs || 0}g</Text>
                                    <Text style={{ color: '#FF9F0A', fontSize: 11, fontWeight: '600' }}>Y: {item.fat || 0}g</Text>
                                </View>
                            )}
                        </View>
                        <TouchableOpacity onPress={() => updateDailyData('delete_food', index)}><Ionicons name="close-circle" size={24} color="#3A3A3C" /></TouchableOpacity>
                    </View>
                ))}
                {exercises.map((item, index) => (
                    <View key={`ex-${index}`} style={styles.listItem}>
                        <View style={[styles.listIconBox, { backgroundColor: 'rgba(255, 69, 58, 0.2)' }]}>
                            <Text style={{ fontSize: 18 }}>🔥</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={styles.listItemName}>{item.name}</Text>
                            <Text style={styles.listItemSub}>
                                {item.duration ? `${item.duration} dk • ` : ''}-{item.calories} kcal
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => updateDailyData('delete_exercise', index)}>
                            <Ionicons name="close-circle" size={24} color="#3A3A3C" />
                        </TouchableOpacity>
                    </View>
                ))}
                <View style={{ height: 120 }} />
            </ScrollView>

            <Sidebar
                visible={sidebarVisible}
                onClose={() => setSidebarVisible(false)}
                navigation={navigation}
            />

            <FabGroup
                actions={[
                    {
                        icon: <Ionicons name="fast-food" size={20} color="black" />,
                        label: 'Yemek Ekle',
                        onPress: () => setModalVisible(true),
                        color: '#CCFF00'
                    },
                    {
                        icon: <FontAwesome5 name="running" size={20} color="black" />,
                        label: 'Egzersiz',
                        onPress: () => setExerciseModalVisible(true),
                        color: '#fff'
                    },
                    {
                        icon: <Ionicons name="camera" size={20} color="black" />,
                        label: 'Kamera',
                        onPress: () => setCameraVisible(true),
                        color: '#fff'
                    },
                    {
                        icon: <Ionicons name="barcode" size={20} color="black" />,
                        label: 'Barkod',
                        onPress: () => setScannerVisible(true),
                        color: '#fff'
                    },
                    {
                        icon: <MaterialCommunityIcons name="chef-hat" size={20} color="black" />,
                        label: 'AI Şef',
                        onPress: () => setChefVisible(true),
                        color: '#fff'
                    }
                ]}
            />

            {
                isAnalyzing && (
                    <View style={styles.loadingOverlay}><ActivityIndicator size="large" color="#CCFF00" /><Text style={{ color: '#CCFF00', marginTop: 10, fontWeight: 'bold' }}>AI Analiz Ediyor...</Text></View>
                )
            }

            <AddFoodModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onFoodAdd={(food) => updateDailyData('add_food', food)}
            />
            <Modal visible={cameraVisible} animationType="slide">
                <CameraScreen onClose={() => setCameraVisible(false)} onPhotoTaken={analyzeFoodWithGemini} />
            </Modal>
            <AddExerciseModal
                visible={exerciseModalVisible}
                onClose={() => setExerciseModalVisible(false)}
                onAdd={(exercise) => updateDailyData('add_exercise', exercise)}
            />
            <BarcodeScannerModal
                visible={scannerVisible}
                onClose={() => setScannerVisible(false)}
                onFoodFound={(food) => updateDailyData('add_food', food)}
            />
            <AIChefModal
                visible={chefVisible}
                onClose={() => setChefVisible(false)}
            />

            <ConfettiCannon
                count={200}
                origin={{ x: -10, y: 0 }}
                autoStart={false}
                ref={confettiRef}
                fadeOut={true}
            />
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#121212' },
    container: { flex: 1, padding: 16 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#121212' },
    menuBtn: { marginRight: 10 },
    dateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20 },
    dateText: { color: '#fff', fontWeight: 'bold', marginRight: 5 },
    heroCard: { backgroundColor: '#1C1C1E', borderRadius: 24, padding: 20, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#2C2C2E' },
    heroTitle: { color: '#8E8E93', fontSize: 14, fontWeight: '600' },
    heroValue: { fontSize: 42, fontWeight: 'bold', marginVertical: 5 },
    heroSubtitle: { color: '#636366', fontSize: 12 },
    ringContainer: { width: 80, height: 80, borderRadius: 40, borderWidth: 8, borderColor: '#2C2C2E', justifyContent: 'flex-end', overflow: 'hidden' },
    ringInner: { width: '100%', backgroundColor: '#CCFF00' },
    gridContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, height: 220 }, // Hizalama Sabit Yükseklik
    gridColumn: { width: '48%', height: '100%' },
    bentoBox: { borderRadius: 20, padding: 15, justifyContent: 'center', alignItems: 'center', minHeight: 100, backgroundColor: '#1C1C1E' },
    bentoValue: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 5 },
    bentoLabel: { color: '#8E8E93', fontSize: 12 },
    macroTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 2 },
    macroVal: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    macroBar: { height: 4, borderRadius: 2 },
    waterBtn: { backgroundColor: 'rgba(255,255,255,0.2)', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    chartContainer: { backgroundColor: '#1C1C1E', borderRadius: 20, padding: 20, marginBottom: 20 },
    chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 100, marginTop: 10 },
    chartBarWrapper: { alignItems: 'center', width: '12%' },
    chartBar: { width: '100%', borderRadius: 4 },
    chartDayText: { fontSize: 12, marginTop: 5 },
    sectionHeader: { marginBottom: 10 },
    sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', padding: 12, borderRadius: 16, marginBottom: 10 },
    listIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(204, 255, 0, 0.1)', justifyContent: 'center', alignItems: 'center' },
    listItemName: { color: '#fff', fontWeight: '600', fontSize: 16 },
    listItemSub: { color: '#8E8E93', fontSize: 12, marginTop: 2 },
    // floatingContainer: { position: 'absolute', bottom: 30, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 20, backgroundColor: '#1C1C1E', padding: 10, paddingHorizontal: 20, borderRadius: 40, borderWidth: 1, borderColor: '#333' },
    // floatBtnMain: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#CCFF00', justifyContent: 'center', alignItems: 'center', marginBottom: 20, shadowColor: '#CCFF00', shadowOpacity: 0.4, shadowRadius: 10, elevation: 10 },
    // floatBtnSmall: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '80%', backgroundColor: '#1C1C1E', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
    modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    modalInput: { backgroundColor: '#2C2C2E', color: '#fff', padding: 12, borderRadius: 10, marginBottom: 10 },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    modalBtnCancel: { padding: 10 },
    modalBtnAdd: { backgroundColor: '#CCFF00', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
    loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
});
