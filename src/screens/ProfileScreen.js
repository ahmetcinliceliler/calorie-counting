import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, Modal, TextInput, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from "react-native-chart-kit";
import Badges from '../components/Badges';

const screenWidth = Dimensions.get("window").width;

export default function ProfileScreen({ navigation }) {
    const [profile, setProfile] = useState(null);
    const [weightHistory, setWeightHistory] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [targetModalVisible, setTargetModalVisible] = useState(false);
    const [newWeight, setNewWeight] = useState('');
    const [newTargetWeight, setNewTargetWeight] = useState('');
    const [badgeStats, setBadgeStats] = useState({
        streak: 0, waterGoalReached: 0, totalDays: 0,
        totalExercises: 0, startWeight: 0, currentWeight: 0, targetWeight: 0
    });

    useEffect(() => {
        loadProfile();
        loadWeightHistory();
        calculateBadgeStats();
    }, []);

    const loadProfile = async () => {
        try {
            const p = await AsyncStorage.getItem('@user_profile');
            if (p) setProfile(JSON.parse(p));
        } catch (e) { console.error(e); }
    };

    const loadWeightHistory = async () => {
        try {
            const h = await AsyncStorage.getItem('@weight_history');
            if (h) setWeightHistory(JSON.parse(h));
        } catch (e) { console.error(e); }
    };

    const calculateBadgeStats = async () => {
        try {
            const storedData = await AsyncStorage.getItem('@DietTracker:CalAI_Ultra_Final_V3');
            if (!storedData) return;

            const data = JSON.parse(storedData);
            const dates = Object.keys(data).sort();
            const totalDays = dates.length;

            let waterGoalReached = 0;
            let streak = 0;
            let currentStreak = 0;

            // Basit streak mantığı: Tarihleri kontrol et
            // Gerçek bir streak için tarih farklarına bakmak lazım ama şimdilik ardışık varoluş yeterli
            // Daha sağlam olması için:
            const today = new Date().toISOString().split('T')[0];
            let lastDate = null;

            // Sondan başa doğru streak kontrolü
            for (let i = dates.length - 1; i >= 0; i--) {
                const d = dates[i];
                const dayData = data[d];

                // Su hedefi (8 bardak varsayılan)
                if ((dayData.water || 0) >= 8) waterGoalReached++;

                // Streak
                if (lastDate) {
                    const diff = (new Date(lastDate) - new Date(d)) / (1000 * 60 * 60 * 24);
                    if (diff === 1) {
                        currentStreak++;
                    } else if (diff > 1 && d !== today) {
                        // Zincir kırıldı
                        break;
                    }
                } else {
                    // İlk (en son) gün
                    if (d === today || (new Date(today) - new Date(d)) / (1000 * 60 * 60 * 24) === 1) {
                        currentStreak = 1;
                    }
                }
                lastDate = d;
            }

            // Eğer hiç veri yoksa veya bugün/dün veri girilmediyse streak 0 olabilir, 
            // ama yukarıdaki mantık en son girilen günden geriye sayar. 
            // Kullanıcı dün girdi bugün girmediyse streak devam ediyor sayılabilir mi? 
            // Genelde "bugün girmediysen streak tehlikede" denir ama henüz kırılmamıştır.
            // Basitleştirmek için: En son kayıt bugün veya dün ise streak geçerli.

            let totalExercises = 0;
            dates.forEach(d => {
                if (data[d].exercises) totalExercises += data[d].exercises.length;
            });

            // Kilo verileri
            let startWeight = 0;
            let currentWeight = 0;
            let targetWeight = 0;

            const p = await AsyncStorage.getItem('@user_profile');
            if (p) {
                const profileData = JSON.parse(p);
                currentWeight = profileData.weight;
                targetWeight = profileData.targetWeight;

                // Başlangıç kilosunu bulmaya çalış (ilk history kaydı veya profil)
                const h = await AsyncStorage.getItem('@weight_history');
                if (h) {
                    const history = JSON.parse(h);
                    if (history.length > 0) startWeight = history[0].weight;
                    else startWeight = currentWeight;
                } else {
                    startWeight = currentWeight;
                }
            }

            setBadgeStats({
                streak: currentStreak,
                waterGoalReached,
                totalDays,
                totalExercises,
                startWeight,
                currentWeight,
                targetWeight
            });

        } catch (e) { console.error(e); }
    };

    const handleUpdateTargetWeight = async () => {
        if (!newTargetWeight || isNaN(newTargetWeight)) {
            Alert.alert("Hata", "Geçerli bir hedef kilo giriniz.");
            return;
        }
        const targetVal = parseFloat(newTargetWeight);
        const updatedProfile = { ...profile, targetWeight: targetVal };

        try {
            await AsyncStorage.setItem('@user_profile', JSON.stringify(updatedProfile));
            setProfile(updatedProfile);
            setTargetModalVisible(false);
            setNewTargetWeight('');
            Alert.alert("Başarılı", "Hedef kilonuz güncellendi! 🎯");
        } catch (e) {
            console.error(e);
            Alert.alert("Hata", "Kaydedilirken bir sorun oluştu.");
        }
    };

    const handleUpdateWeight = async () => {
        if (!newWeight || isNaN(newWeight)) {
            Alert.alert("Hata", "Geçerli bir kilo giriniz.");
            return;
        }

        const weightVal = parseFloat(newWeight);
        const updatedProfile = { ...profile, weight: weightVal };
        const today = new Date().toISOString().split('T')[0];

        // Geçmişe ekle (Eğer bugün zaten varsa güncelle)
        let newHistory = [...weightHistory];
        const existingIndex = newHistory.findIndex(item => item.date === today);

        if (existingIndex >= 0) {
            newHistory[existingIndex].weight = weightVal;
        } else {
            newHistory.push({ date: today, weight: weightVal });
        }

        // Tarihe göre sırala
        newHistory.sort((a, b) => new Date(a.date) - new Date(b.date));

        try {
            await AsyncStorage.setItem('@user_profile', JSON.stringify(updatedProfile));
            await AsyncStorage.setItem('@weight_history', JSON.stringify(newHistory));

            setProfile(updatedProfile);
            setWeightHistory(newHistory);
            setModalVisible(false);
            setNewWeight('');
            Alert.alert("Başarılı", "Kilonuz güncellendi! 🎉");
        } catch (e) {
            console.error(e);
            Alert.alert("Hata", "Kaydedilirken bir sorun oluştu.");
        }
    };

    const clearData = async () => {
        Alert.alert(
            "Verileri Sıfırla",
            "Tüm verileriniz ve profiliniz silinecek. Emin misiniz?",
            [
                { text: "Vazgeç", style: "cancel" },
                {
                    text: "Sil",
                    style: "destructive",
                    onPress: async () => {
                        await AsyncStorage.clear();
                        Alert.alert("Başarılı", "Veriler silindi. Uygulamayı yeniden başlatın.");
                    }
                }
            ]
        );
    };

    if (!profile) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={{ color: 'white' }}>Yükleniyor...</Text>
            </SafeAreaView>
        );
    }

    // Grafik Verileri (Son 7 kayıt)
    const { finalLabels, finalData } = useMemo(() => {
        const chartData = weightHistory.slice(-7);
        const labels = chartData.map(d => d.date.split('-').slice(1).join('/')); // Ay/Gün
        const dataPoints = chartData.map(d => d.weight);

        // Eğer veri yoksa grafiği boş göstermemek için dummy data
        const fLabels = labels.length > 0 ? labels : ["Bugün"];
        const fData = dataPoints.length > 0 ? dataPoints : [profile ? profile.weight : 0];

        return { finalLabels: fLabels, finalData: fData };
    }, [weightHistory, profile]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topHeader}>
                <TouchableOpacity onPress={() => navigation.navigate('Ana Sayfa')} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profil</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <View style={styles.avatar}>
                        <Text style={{ fontSize: 40 }}>{profile.gender === 'male' ? '👨' : '👩'}</Text>
                    </View>
                    <Text style={styles.name}>Kullanıcı</Text>
                    <Text style={styles.subText}>{profile.age} Yaş • {profile.height} cm</Text>
                </View>

                {/* KİLO KARTI & GRAFİK */}
                <View style={styles.weightCard}>
                    <View style={styles.weightHeader}>
                        <View>
                            <Text style={styles.weightLabel}>Güncel Kilo</Text>
                            <Text style={styles.weightValue}>{profile.weight} kg</Text>
                        </View>
                        <TouchableOpacity style={styles.updateBtn} onPress={() => setModalVisible(true)}>
                            <Text style={styles.updateBtnText}>Güncelle</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.weightHeader, { marginTop: 15, borderTopWidth: 1, borderTopColor: '#333', paddingTop: 15 }]}>
                        <View>
                            <Text style={styles.weightLabel}>Hedef Kilo</Text>
                            <Text style={[styles.weightValue, { color: '#CCFF00' }]}>{profile.targetWeight || '--'} kg</Text>
                        </View>
                        <TouchableOpacity style={styles.updateBtn} onPress={() => setTargetModalVisible(true)}>
                            <Text style={styles.updateBtnText}>Hedef Belirle</Text>
                        </TouchableOpacity>
                    </View>

                    <LineChart
                        data={{
                            labels: finalLabels,
                            datasets: [{ data: finalData }]
                        }}
                        width={screenWidth - 80} // paddinglerden dolayı
                        height={220}
                        yAxisSuffix="kg"
                        chartConfig={{
                            backgroundColor: "#1C1C1E",
                            backgroundGradientFrom: "#1C1C1E",
                            backgroundGradientTo: "#1C1C1E",
                            decimalPlaces: 1,
                            color: (opacity = 1) => `rgba(204, 255, 0, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                            style: { borderRadius: 16 },
                            propsForDots: { r: "6", strokeWidth: "2", stroke: "#CCFF00" }
                        }}
                        bezier
                        style={{ marginVertical: 8, borderRadius: 16 }}
                    />
                </View>

                <View style={styles.statsCard}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>BMR</Text>
                        <Text style={styles.statValue}>{profile.bmr}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Günlük Hedef</Text>
                        <Text style={[styles.statValue, { color: '#CCFF00' }]}>{profile.dailyGoal}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Hedef</Text>
                    <View style={styles.infoRow}>
                        <Ionicons name="flag" size={24} color="#888" />
                        <Text style={styles.infoText}>
                            {profile.goal === 'lose' ? 'Kilo Vermek' :
                                profile.goal === 'gain' ? 'Kilo Almak' : 'Korumak'}
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Aktivite</Text>
                    <View style={styles.infoRow}>
                        <Ionicons name="walk" size={24} color="#888" />
                        <Text style={styles.infoText}>
                            {profile.activity === 'sedentary' ? 'Hareketsiz' :
                                profile.activity === 'light' ? 'Az Hareketli' :
                                    profile.activity === 'moderate' ? 'Orta Hareketli' : 'Çok Hareketli'}
                        </Text>
                    </View>
                </View>

                <Badges stats={badgeStats} />

                <TouchableOpacity style={styles.logoutBtn} onPress={clearData}>
                    <Text style={styles.logoutText}>Verileri Sıfırla ve Çıkış Yap</Text>
                </TouchableOpacity>

            </ScrollView>

            {/* KİLO GÜNCELLEME MODALI */}
            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Kilonuzu Güncelleyin</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Yeni Kilo (kg)"
                            placeholderTextColor="#666"
                            keyboardType="numeric"
                            value={newWeight}
                            onChangeText={setNewWeight}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                                <Text style={styles.cancelText}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleUpdateWeight} style={styles.saveBtn}>
                                <Text style={styles.saveText}>Kaydet</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* HEDEF KİLO GÜNCELLEME MODALI */}
            <Modal visible={targetModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Hedef Kilonuzu Belirleyin</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Hedef Kilo (kg)"
                            placeholderTextColor="#666"
                            keyboardType="numeric"
                            value={newTargetWeight}
                            onChangeText={setNewTargetWeight}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setTargetModalVisible(false)} style={styles.cancelBtn}>
                                <Text style={styles.cancelText}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleUpdateTargetWeight} style={styles.saveBtn}>
                                <Text style={styles.saveText}>Kaydet</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212' },
    topHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    scrollContent: { padding: 20 },
    header: { alignItems: 'center', marginBottom: 20 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderWidth: 2, borderColor: '#CCFF00' },
    name: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    subText: { color: '#888', marginTop: 5 },

    weightCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        alignItems: 'center'
    },
    weightHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        alignItems: 'center',
        marginBottom: 10
    },
    weightLabel: { color: '#888', fontSize: 12 },
    weightValue: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
    updateBtn: { backgroundColor: '#333', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 15 },
    updateBtnText: { color: '#CCFF00', fontWeight: 'bold', fontSize: 12 },

    statsCard: { flexDirection: 'row', backgroundColor: '#1C1C1E', borderRadius: 20, padding: 20, marginBottom: 20 },
    statItem: { flex: 1, alignItems: 'center' },
    statLabel: { color: '#888', fontSize: 12, marginBottom: 5 },
    statValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    divider: { width: 1, backgroundColor: '#333' },
    section: { marginBottom: 20 },
    sectionTitle: { color: '#666', fontSize: 14, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase' },
    infoRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', padding: 15, borderRadius: 15, gap: 15 },
    infoText: { color: '#fff', fontSize: 16 },
    logoutBtn: { marginTop: 20, backgroundColor: 'rgba(255, 69, 58, 0.1)', padding: 15, borderRadius: 15, alignItems: 'center' },
    logoutText: { color: '#FF453A', fontWeight: 'bold' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '80%', backgroundColor: '#1C1C1E', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
    modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    input: { backgroundColor: '#2C2C2E', color: '#fff', padding: 12, borderRadius: 10, marginBottom: 20, fontSize: 16 },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
    cancelBtn: { padding: 10 },
    cancelText: { color: '#888' },
    saveBtn: { backgroundColor: '#CCFF00', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
    saveText: { color: '#000', fontWeight: 'bold' }
});
