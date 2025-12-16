import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Takvim Türkçe ayarları
LocaleConfig.locales['tr'] = {
    monthNames: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
    monthNamesShort: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
    dayNames: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
    dayNamesShort: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
    today: "Bugün"
};
LocaleConfig.defaultLocale = 'tr';

const STORAGE_KEY = '@DietTracker:CalAI_Ultra_Final_V3';

export default function HistoryScreen({ navigation }) {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [historyData, setHistoryData] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const storedData = await AsyncStorage.getItem(STORAGE_KEY);
            if (storedData) {
                setHistoryData(JSON.parse(storedData));
            }
        } catch (error) {
            console.error("Geçmiş yüklenirken hata:", error);
        } finally {
            setLoading(false);
        }
    };

    // Takvimde işaretlenecek günler
    const markedDates = useMemo(() => {
        const marks = {};
        Object.keys(historyData).forEach(date => {
            marks[date] = { marked: true, dotColor: '#CCFF00' };
        });

        // Seçili gün
        marks[selectedDate] = {
            ...(marks[selectedDate] || {}),
            selected: true,
            selectedColor: '#CCFF00',
            selectedTextColor: '#000'
        };

        return marks;
    }, [historyData, selectedDate]);

    const currentDayData = useMemo(() => historyData[selectedDate] || { foods: [], exercises: [], water: 0 }, [historyData, selectedDate]);
    const foods = useMemo(() => currentDayData.foods || [], [currentDayData]);
    const exercises = useMemo(() => currentDayData.exercises || [], [currentDayData]);

    const { totalCalories, burnedCalories, netCalories, totalProtein, totalCarbs, totalFat } = useMemo(() => {
        const total = foods.reduce((sum, item) => sum + item.calories, 0);
        const burned = exercises.reduce((sum, item) => sum + item.calories, 0);
        const net = total - burned;

        const protein = foods.reduce((sum, item) => sum + (item.protein || 0), 0);
        const carbs = foods.reduce((sum, item) => sum + (item.carbs || 0), 0);
        const fat = foods.reduce((sum, item) => sum + (item.fat || 0), 0);

        return { totalCalories: total, burnedCalories: burned, netCalories: net, totalProtein: protein, totalCarbs: carbs, totalFat: fat };
    }, [foods, exercises]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate('Ana Sayfa')} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Geçmiş</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#CCFF00" />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Calendar
                        style={styles.calendar}
                        theme={{
                            backgroundColor: '#1C1C1E',
                            calendarBackground: '#1C1C1E',
                            textSectionTitleColor: '#b6c1cd',
                            selectedDayBackgroundColor: '#CCFF00',
                            selectedDayTextColor: '#000',
                            todayTextColor: '#CCFF00',
                            dayTextColor: '#fff',
                            textDisabledColor: '#333',
                            dotColor: '#CCFF00',
                            selectedDotColor: '#000',
                            arrowColor: '#CCFF00',
                            monthTextColor: '#fff',
                            indicatorColor: '#CCFF00',
                        }}
                        onDayPress={day => setSelectedDate(day.dateString)}
                        markedDates={markedDates}
                    />

                    <View style={styles.summaryCard}>
                        <Text style={styles.dateTitle}>{selectedDate.split('-').reverse().join('.')}</Text>

                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Alınan</Text>
                                <Text style={[styles.statValue, { color: '#fff' }]}>{totalCalories}</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Yakılan</Text>
                                <Text style={[styles.statValue, { color: '#FF453A' }]}>{burnedCalories}</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Net</Text>
                                <Text style={[styles.statValue, { color: '#CCFF00' }]}>{netCalories}</Text>
                            </View>
                        </View>

                        <View style={styles.macrosRow}>
                            <Text style={styles.macroText}>P: {totalProtein}g</Text>
                            <Text style={styles.macroText}>K: {totalCarbs}g</Text>
                            <Text style={styles.macroText}>Y: {totalFat}g</Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Yemekler</Text>
                        {foods.length === 0 ? (
                            <Text style={styles.emptyText}>Bu tarihte kayıt yok.</Text>
                        ) : (
                            foods.map((item, index) => (
                                <View key={index} style={styles.listItem}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    <Text style={styles.itemCal}>{item.calories} kcal</Text>
                                </View>
                            ))
                        )}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Egzersizler</Text>
                        {exercises.length === 0 ? (
                            <Text style={styles.emptyText}>Egzersiz kaydı yok.</Text>
                        ) : (
                            exercises.map((item, index) => (
                                <View key={index} style={styles.listItem}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    <Text style={[styles.itemCal, { color: '#FF453A' }]}>-{item.calories} kcal</Text>
                                </View>
                            ))
                        )}
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    header: {
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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    calendar: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    summaryCard: {
        backgroundColor: '#1C1C1E',
        margin: 20,
        padding: 20,
        borderRadius: 20,
    },
    dateTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statLabel: {
        color: '#888',
        fontSize: 12,
        marginBottom: 5,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    divider: {
        width: 1,
        backgroundColor: '#333',
    },
    macrosRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        backgroundColor: '#2C2C2E',
        padding: 10,
        borderRadius: 10,
    },
    macroText: {
        color: '#bbb',
        fontWeight: '600',
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        color: '#CCFF00',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    emptyText: {
        color: '#666',
        fontStyle: 'italic',
    },
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#1C1C1E',
        padding: 15,
        borderRadius: 12,
        marginBottom: 8,
    },
    itemName: {
        color: '#fff',
        fontSize: 16,
    },
    itemCal: {
        color: '#CCFF00',
        fontWeight: 'bold',
    }
});
