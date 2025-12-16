import React, { useState } from 'react';
import {
    StyleSheet, Text, View, Modal, TouchableOpacity, TextInput,
    FlatList, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { EXERCISE_TYPES, calculateCalories } from '../utils/exercises';

export default function AddExerciseModal({ visible, onClose, onAdd }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [duration, setDuration] = useState('');
    const [customName, setCustomName] = useState('');
    const [customCalories, setCustomCalories] = useState('');
    const [mode, setMode] = useState('list'); // 'list' or 'custom'

    const filteredExercises = EXERCISE_TYPES.filter(ex =>
        ex.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAdd = () => {
        if (mode === 'list' && selectedExercise && duration) {
            const calories = calculateCalories(selectedExercise.met, parseInt(duration));
            onAdd({
                name: selectedExercise.name,
                calories: calories,
                duration: parseInt(duration),
                type: 'predefined'
            });
            resetAndClose();
        } else if (mode === 'custom' && customName && customCalories) {
            onAdd({
                name: customName,
                calories: parseInt(customCalories),
                duration: duration ? parseInt(duration) : 0,
                type: 'custom'
            });
            resetAndClose();
        }
    };

    const resetAndClose = () => {
        setSearchQuery('');
        setSelectedExercise(null);
        setDuration('');
        setCustomName('');
        setCustomCalories('');
        setMode('list');
        onClose();
    };

    const renderExerciseItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.exerciseItem,
                selectedExercise?.id === item.id && styles.selectedItem
            ]}
            onPress={() => setSelectedExercise(item)}
        >
            <View style={[
                styles.iconBox,
                selectedExercise?.id === item.id && styles.selectedIconBox
            ]}>
                <Ionicons name={item.icon === 'run' || item.icon === 'walk' || item.icon === 'bicycle' || item.icon === 'water' || item.icon === 'barbell' || item.icon === 'body' || item.icon === 'flash' || item.icon === 'basketball' || item.icon === 'football' ? item.icon : 'fitness'} size={24} color={selectedExercise?.id === item.id ? '#000' : '#CCFF00'} />
            </View>
            <Text style={[
                styles.exerciseName,
                selectedExercise?.id === item.id && styles.selectedText
            ]}>{item.name}</Text>
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={resetAndClose}
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Egzersiz Ekle</Text>
                    <TouchableOpacity onPress={resetAndClose} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, mode === 'list' && styles.activeTab]}
                        onPress={() => setMode('list')}
                    >
                        <Text style={[styles.tabText, mode === 'list' && styles.activeTabText]}>Listeden Seç</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, mode === 'custom' && styles.activeTab]}
                        onPress={() => setMode('custom')}
                    >
                        <Text style={[styles.tabText, mode === 'custom' && styles.activeTabText]}>Özel Ekle</Text>
                    </TouchableOpacity>
                </View>

                {mode === 'list' ? (
                    <View style={{ flex: 1 }}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Egzersiz Ara..."
                            placeholderTextColor="#666"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />

                        <FlatList
                            data={filteredExercises}
                            renderItem={renderExerciseItem}
                            keyExtractor={item => item.id}
                            style={styles.list}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        />

                        {selectedExercise && (
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>{selectedExercise.name} - Süre (dk)</Text>
                                <TextInput
                                    style={styles.durationInput}
                                    placeholder="30"
                                    placeholderTextColor="#666"
                                    keyboardType="numeric"
                                    value={duration}
                                    onChangeText={setDuration}
                                />
                                {duration ? (
                                    <Text style={styles.calcText}>
                                        Tahmini: <Text style={{ color: '#CCFF00' }}>
                                            {calculateCalories(selectedExercise.met, parseInt(duration))} kcal
                                        </Text>
                                    </Text>
                                ) : null}
                            </View>
                        )}
                    </View>
                ) : (
                    <ScrollView style={{ flex: 1 }}>
                        <View style={styles.customForm}>
                            <Text style={styles.label}>Aktivite Adı</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Örn: Bahçe İşleri"
                                placeholderTextColor="#666"
                                value={customName}
                                onChangeText={setCustomName}
                            />

                            <Text style={styles.label}>Yakılan Kalori</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Örn: 200"
                                placeholderTextColor="#666"
                                keyboardType="numeric"
                                value={customCalories}
                                onChangeText={setCustomCalories}
                            />

                            <Text style={styles.label}>Süre (Opsiyonel - dk)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Örn: 45"
                                placeholderTextColor="#666"
                                keyboardType="numeric"
                                value={duration}
                                onChangeText={setDuration}
                            />
                        </View>
                    </ScrollView>
                )}

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.addBtn, (!selectedExercise && mode === 'list') || (mode === 'custom' && (!customName || !customCalories)) ? styles.disabledBtn : null]}
                        onPress={handleAdd}
                        disabled={(!selectedExercise && mode === 'list') || (mode === 'custom' && (!customName || !customCalories))}
                    >
                        <Text style={styles.addBtnText}>Egzersizi Ekle</Text>
                    </TouchableOpacity>
                </View>
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
        marginBottom: 20,
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
        marginBottom: 20,
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeTab: {
        backgroundColor: '#333',
    },
    tabText: {
        color: '#8E8E93',
        fontWeight: '600',
    },
    activeTabText: {
        color: '#CCFF00',
    },
    searchInput: {
        backgroundColor: '#1C1C1E',
        color: '#fff',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        fontSize: 16,
    },
    list: {
        flex: 1,
    },
    exerciseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    selectedItem: {
        borderColor: '#CCFF00',
        backgroundColor: 'rgba(204, 255, 0, 0.1)',
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    selectedIconBox: {
        backgroundColor: '#CCFF00',
    },
    exerciseName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    selectedText: {
        color: '#CCFF00',
        fontWeight: 'bold',
    },
    inputContainer: {
        backgroundColor: '#1C1C1E',
        padding: 16,
        borderRadius: 16,
        marginTop: 10,
    },
    label: {
        color: '#8E8E93',
        marginBottom: 8,
        fontSize: 14,
    },
    durationInput: {
        backgroundColor: '#2C2C2E',
        color: '#fff',
        padding: 12,
        borderRadius: 10,
        fontSize: 18,
        fontWeight: 'bold',
    },
    calcText: {
        color: '#8E8E93',
        marginTop: 10,
        fontSize: 14,
        textAlign: 'right',
    },
    customForm: {
        padding: 10,
    },
    input: {
        backgroundColor: '#1C1C1E',
        color: '#fff',
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        fontSize: 16,
    },
    footer: {
        marginTop: 20,
        marginBottom: Platform.OS === 'ios' ? 20 : 0,
    },
    addBtn: {
        backgroundColor: '#CCFF00',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    disabledBtn: {
        backgroundColor: '#333',
        opacity: 0.5,
    },
    addBtnText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
