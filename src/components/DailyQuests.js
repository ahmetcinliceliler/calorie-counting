import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function DailyQuests({ quests }) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Günlük Görevler</Text>

            <View style={styles.questList}>
                {quests.map((quest, index) => (
                    <View key={index} style={styles.questItem}>
                        <View style={[styles.checkBox, quest.isCompleted && styles.checkedBox]}>
                            {quest.isCompleted && <Ionicons name="checkmark" size={16} color="#000" />}
                        </View>
                        <View style={styles.questContent}>
                            <Text style={[styles.questText, quest.isCompleted && styles.completedText]}>
                                {quest.title}
                            </Text>
                            {quest.subtitle && (
                                <Text style={styles.questSubtitle}>{quest.subtitle}</Text>
                            )}
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
}
export default React.memo(DailyQuests);

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1C1C1E',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
    },
    title: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    questList: {
        gap: 15,
    },
    questItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkBox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#CCFF00',
        marginRight: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkedBox: {
        backgroundColor: '#CCFF00',
    },
    questContent: {
        flex: 1,
    },
    questText: {
        color: '#fff',
        fontSize: 16,
    },
    completedText: {
        color: '#666',
        textDecorationLine: 'line-through',
    },
    questSubtitle: {
        color: '#666',
        fontSize: 12,
    }
});
