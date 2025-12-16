import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function WaterTracker({ current, target, onAdd, onRemove }) {
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const percentage = Math.min(current / target, 1);
        Animated.timing(progressAnim, {
            toValue: percentage,
            duration: 500,
            useNativeDriver: false,
        }).start();
    }, [current, target]);

    const widthInterpolated = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Su Takibi</Text>
                    <Text style={styles.subtitle}>Günlük Hedef: {target / 1000}L</Text>
                </View>
                <View style={styles.counter}>
                    <Text style={styles.currentText}>{current}</Text>
                    <Text style={styles.unitText}>ml</Text>
                </View>
            </View>

            <View style={styles.progressBarContainer}>
                <Animated.View style={[styles.progressBar, { width: widthInterpolated }]} />
            </View>

            <View style={styles.controls}>
                <TouchableOpacity style={styles.button} onPress={() => onRemove(200)}>
                    <Ionicons name="remove" size={24} color="#fff" />
                </TouchableOpacity>

                <View style={styles.glassInfo}>
                    <Ionicons name="water" size={20} color="#64D2FF" />
                    <Text style={styles.glassText}>1 Bardak (200ml)</Text>
                </View>

                <TouchableOpacity style={[styles.button, styles.addButton]} onPress={() => onAdd(200)}>
                    <Ionicons name="add" size={24} color="#000" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default React.memo(WaterTracker);

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1C1C1E',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    title: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    subtitle: {
        color: '#888',
        fontSize: 12,
        marginTop: 2,
    },
    counter: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    currentText: {
        color: '#64D2FF',
        fontSize: 24,
        fontWeight: 'bold',
    },
    unitText: {
        color: '#64D2FF',
        fontSize: 14,
        marginLeft: 2,
    },
    progressBarContainer: {
        height: 10,
        backgroundColor: '#2C2C2E',
        borderRadius: 5,
        marginBottom: 20,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#64D2FF',
        borderRadius: 5,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    button: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#2C2C2E',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButton: {
        backgroundColor: '#64D2FF',
    },
    glassInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    glassText: {
        color: '#888',
        fontSize: 14,
    }
});
