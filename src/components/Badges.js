import React from 'react';
import { StyleSheet, Text, View, ScrollView, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

export default function Badges({ stats }) {
    const badges = [
        {
            id: 'newbie',
            title: 'Yeni Başlayan',
            desc: 'İlk girişini yaptın!',
            icon: <Ionicons name="rocket" size={24} color="#fff" />,
            color: '#FF9F0A',
            condition: () => true // Her zaman açık
        },
        {
            id: 'water_warrior',
            title: 'Su Savaşçısı',
            desc: '3 gün su hedefine ulaştın.',
            icon: <Ionicons name="water" size={24} color="#fff" />,
            color: '#0A84FF',
            condition: () => stats.waterGoalReached >= 3
        },
        {
            id: 'streak_3',
            title: 'İstikrarlı',
            desc: '3 gün üst üste giriş yaptın.',
            icon: <MaterialCommunityIcons name="fire" size={24} color="#fff" />,
            color: '#FF453A',
            condition: () => stats.streak >= 3
        },
        {
            id: 'streak_7',
            title: 'Haftalık Seri',
            desc: '7 gün üst üste giriş yaptın.',
            icon: <FontAwesome5 name="crown" size={20} color="#fff" />,
            color: '#CCFF00',
            condition: () => stats.streak >= 7
        },
        {
            id: 'calorie_master',
            title: 'Kalori Uzmanı',
            desc: 'Toplam 10 gün kayıt tuttun.',
            icon: <MaterialCommunityIcons name="scale-balance" size={24} color="#fff" />,
            color: '#BF5AF2',
            condition: () => stats.totalDays >= 10
        },
        {
            id: 'gym_rat',
            title: 'Spor Tutkunu',
            desc: '5 farklı egzersiz kaydettin.',
            icon: <Ionicons name="barbell" size={24} color="#fff" />,
            color: '#FFD60A',
            condition: () => stats.totalExercises >= 5
        },
        {
            id: 'water_boss',
            title: 'Su Patronu',
            desc: '7 gün su hedefine ulaştın.',
            icon: <Ionicons name="water" size={24} color="#fff" />,
            color: '#64D2FF',
            condition: () => stats.waterGoalReached >= 7
        },
        {
            id: 'first_step',
            title: 'İlk Adım',
            desc: 'Kilo vermeye başladın!',
            icon: <MaterialCommunityIcons name="shoe-print" size={24} color="#fff" />,
            color: '#30D158',
            condition: () => stats.startWeight > stats.currentWeight
        },
        {
            id: 'goal_reached',
            title: 'Hedefe Vardım',
            desc: 'Hedef kilona ulaştın! 🎉',
            icon: <MaterialCommunityIcons name="trophy" size={24} color="#fff" />,
            color: '#FFD60A',
            condition: () => stats.targetWeight && stats.currentWeight <= stats.targetWeight + 0.5 && stats.currentWeight >= stats.targetWeight - 0.5
        }
    ];

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Rozetlerim</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {badges.map((badge) => {
                    const isUnlocked = badge.condition();
                    return (
                        <View key={badge.id} style={[styles.badgeCard, !isUnlocked && styles.lockedCard]}>
                            <View style={[styles.iconContainer, { backgroundColor: isUnlocked ? badge.color : '#333' }]}>
                                {isUnlocked ? badge.icon : <Ionicons name="lock-closed" size={20} color="#888" />}
                            </View>
                            <Text style={[styles.badgeTitle, !isUnlocked && { color: '#666' }]}>{badge.title}</Text>
                            <Text style={styles.badgeDesc}>{isUnlocked ? badge.desc : '???'}</Text>
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    title: {
        color: '#666',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    scrollContent: {
        gap: 15,
    },
    badgeCard: {
        backgroundColor: '#1C1C1E',
        width: 120,
        padding: 15,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    lockedCard: {
        opacity: 0.7,
        borderColor: '#222',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    badgeTitle: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 5,
    },
    badgeDesc: {
        color: '#888',
        fontSize: 10,
        textAlign: 'center',
    }
});
