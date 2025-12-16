import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateBMR, calculateDailyGoal } from '../utils/calculations';

export default function OnboardingScreen({ onFinish }) {
    const [step, setStep] = useState(1);
    const [gender, setGender] = useState(null);
    const [weight, setWeight] = useState('');
    const [targetWeight, setTargetWeight] = useState('');
    const [height, setHeight] = useState('');
    const [age, setAge] = useState('');
    const [activity, setActivity] = useState('sedentary');
    const [goal, setGoal] = useState('maintain');

    const handleNext = async () => {
        if (step === 1) {
            if (!gender) return Alert.alert("Hata", "Lütfen cinsiyet seçiniz.");
            setStep(2);
        } else if (step === 2) {
            if (!weight || !height || !age) return Alert.alert("Hata", "Lütfen tüm alanları doldurunuz.");
            setStep(3);
        } else if (step === 3) {
            // Hesapla ve Kaydet
            const bmr = calculateBMR(parseFloat(weight), parseFloat(height), parseInt(age), gender);
            const dailyGoal = calculateDailyGoal(bmr, activity, goal);

            const userProfile = {
                gender,
                weight: parseFloat(weight),
                targetWeight: parseFloat(targetWeight),
                height: parseFloat(height),
                age: parseInt(age),
                activity,
                goal,
                bmr,
                dailyGoal
            };

            try {
                await AsyncStorage.setItem('@user_profile', JSON.stringify(userProfile));
                onFinish(); // App.js'e bittiğini bildir
            } catch (e) {
                Alert.alert("Hata", "Kayıt sırasında bir sorun oluştu.");
            }
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>Seni Tanıyalım 👋</Text>
                <Text style={styles.subtitle}>Adım {step} / 3</Text>

                {step === 1 && (
                    <View style={styles.stepContainer}>
                        <Text style={styles.question}>Cinsiyetin nedir?</Text>
                        <View style={styles.row}>
                            <TouchableOpacity
                                style={[styles.optionBtn, gender === 'male' && styles.selectedOption]}
                                onPress={() => setGender('male')}
                            >
                                <Text style={styles.optionText}>Erkek 👨</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.optionBtn, gender === 'female' && styles.selectedOption]}
                                onPress={() => setGender('female')}
                            >
                                <Text style={styles.optionText}>Kadın 👩</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {step === 2 && (
                    <View style={styles.stepContainer}>
                        <Text style={styles.question}>Vücut Ölçülerin?</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Mevcut Kilo (kg)"
                            placeholderTextColor="#666"
                            keyboardType="numeric"
                            value={weight}
                            onChangeText={setWeight}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Hedef Kilo (kg)"
                            placeholderTextColor="#666"
                            keyboardType="numeric"
                            value={targetWeight}
                            onChangeText={setTargetWeight}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Boy (cm)"
                            placeholderTextColor="#666"
                            keyboardType="numeric"
                            value={height}
                            onChangeText={setHeight}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Yaş"
                            placeholderTextColor="#666"
                            keyboardType="numeric"
                            value={age}
                            onChangeText={setAge}
                        />
                    </View>
                )}

                {step === 3 && (
                    <View style={styles.stepContainer}>
                        <Text style={styles.question}>Hedefin ve Aktivite Düzeyin?</Text>

                        <Text style={styles.label}>Aktivite:</Text>
                        <View style={styles.rowWrap}>
                            {['sedentary', 'light', 'moderate', 'active'].map((act) => (
                                <TouchableOpacity
                                    key={act}
                                    style={[styles.smallOption, activity === act && styles.selectedOption]}
                                    onPress={() => setActivity(act)}
                                >
                                    <Text style={styles.smallOptionText}>
                                        {act === 'sedentary' ? 'Hareketsiz' :
                                            act === 'light' ? 'Az Hareketli' :
                                                act === 'moderate' ? 'Orta' : 'Çok Hareketli'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.label, { marginTop: 20 }]}>Hedef:</Text>
                        <View style={styles.row}>
                            <TouchableOpacity style={[styles.optionBtn, goal === 'lose' && styles.selectedOption]} onPress={() => setGoal('lose')}>
                                <Text style={styles.optionText}>Kilo Ver 📉</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.optionBtn, goal === 'maintain' && styles.selectedOption]} onPress={() => setGoal('maintain')}>
                                <Text style={styles.optionText}>Koru ⚖️</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.optionBtn, goal === 'gain' && styles.selectedOption]} onPress={() => setGoal('gain')}>
                                <Text style={styles.optionText}>Kilo Al 📈</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                    <Text style={styles.nextBtnText}>{step === 3 ? 'Hesapla ve Başla 🚀' : 'Devam Et'}</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212' },
    scrollContent: { padding: 20, alignItems: 'center' },
    title: { fontSize: 28, fontWeight: 'bold', color: '#CCFF00', marginTop: 40, marginBottom: 10 },
    subtitle: { fontSize: 16, color: '#888', marginBottom: 40 },
    stepContainer: { width: '100%', alignItems: 'center' },
    question: { fontSize: 22, color: '#fff', marginBottom: 30, fontWeight: '600' },
    row: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', gap: 10 },
    rowWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
    optionBtn: { backgroundColor: '#1C1C1E', padding: 20, borderRadius: 15, borderWidth: 1, borderColor: '#333', flex: 1, alignItems: 'center' },
    selectedOption: { borderColor: '#CCFF00', backgroundColor: 'rgba(204, 255, 0, 0.1)' },
    optionText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    input: { width: '100%', backgroundColor: '#1C1C1E', color: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: '#333' },
    nextBtn: { backgroundColor: '#CCFF00', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30, marginTop: 50, width: '100%', alignItems: 'center' },
    nextBtnText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
    label: { color: '#888', alignSelf: 'flex-start', marginBottom: 10, marginLeft: 5 },
    smallOption: { backgroundColor: '#1C1C1E', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#333', minWidth: '45%', alignItems: 'center', marginBottom: 10 },
    smallOptionText: { color: '#fff' }
});
