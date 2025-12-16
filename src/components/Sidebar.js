import React, { useEffect, useRef } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity, Animated,
    Dimensions, Modal, TouchableWithoutFeedback, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
const { width, height } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75;

export default function Sidebar({ visible, onClose, navigation }) {
    const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
    const [profile, setProfile] = React.useState(null);

    useEffect(() => {
        if (visible) {
            loadProfile();
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: -SIDEBAR_WIDTH,
                duration: 300,
                useNativeDriver: true,
            }).start(() => onClose());
        }
    }, [visible]);

    const loadProfile = async () => {
        try {
            const p = await AsyncStorage.getItem('@user_profile');
            if (p) setProfile(JSON.parse(p));
        } catch (e) { console.error(e); }
    };

    const handleClose = () => {
        Animated.timing(slideAnim, {
            toValue: -SIDEBAR_WIDTH,
            duration: 300,
            useNativeDriver: true,
        }).start(() => onClose());
    };

    const navigateTo = (screen) => {
        handleClose();
        setTimeout(() => navigation.navigate(screen), 300);
    };

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="none">
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={handleClose}>
                    <View style={styles.backdrop} />
                </TouchableWithoutFeedback>

                <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Menü</Text>
                        <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* KİLO TAKİP KARTI (YENİ) */}
                    {profile && (
                        <View style={styles.weightCard}>
                            <Text style={styles.cardTitle}>Kilo Hedefin 🎯</Text>
                            <View style={styles.weightRow}>
                                <View>
                                    <Text style={styles.weightLabel}>Şu an</Text>
                                    <Text style={styles.weightVal}>{profile.weight} kg</Text>
                                </View>
                                <Ionicons name="arrow-forward" size={20} color="#666" />
                                <View>
                                    <Text style={styles.weightLabel}>Hedef</Text>
                                    <Text style={[styles.weightVal, { color: '#CCFF00' }]}>{profile.targetWeight || '?'} kg</Text>
                                </View>
                            </View>

                            {profile.targetWeight && (
                                <>
                                    <View style={styles.progressBarBg}>
                                        <View style={[styles.progressBarFill, {
                                            width: `${Math.min(100, Math.max(0, (1 - (Math.abs(profile.weight - profile.targetWeight) / 20)) * 100))}%`
                                        }]} />
                                    </View>
                                    <Text style={styles.remainingText}>
                                        {Math.abs(profile.weight - profile.targetWeight).toFixed(1)} kg kaldı
                                    </Text>
                                </>
                            )}

                            {!profile.targetWeight && (
                                <TouchableOpacity onPress={() => navigateTo('Profil')}>
                                    <Text style={styles.setGoalText}>Hedef Belirle →</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    <View style={styles.menuItems}>
                        <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('Ana Sayfa')}>
                            <View style={[styles.iconBox, { backgroundColor: '#CCFF00' }]}>
                                <Ionicons name="home" size={20} color="#000" />
                            </View>
                            <Text style={styles.menuText}>Ana Sayfa</Text>
                            <Ionicons name="chevron-forward" size={20} color="#666" style={{ marginLeft: 'auto' }} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('Geçmiş')}>
                            <View style={[styles.iconBox, { backgroundColor: '#32D74B' }]}>
                                <Ionicons name="calendar" size={20} color="#000" />
                            </View>
                            <Text style={styles.menuText}>Geçmiş</Text>
                            <Ionicons name="chevron-forward" size={20} color="#666" style={{ marginLeft: 'auto' }} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('Profil')}>
                            <View style={[styles.iconBox, { backgroundColor: '#0A84FF' }]}>
                                <Ionicons name="person" size={20} color="#000" />
                            </View>
                            <Text style={styles.menuText}>Profil</Text>
                            <Ionicons name="chevron-forward" size={20} color="#666" style={{ marginLeft: 'auto' }} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Diyet Uygulamam v1.1</Text>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    },
    sidebar: {
        width: SIDEBAR_WIDTH,
        height: '100%',
        backgroundColor: '#1C1C1E',
        paddingTop: 50,
        paddingHorizontal: 20,
        shadowColor: "#000",
        shadowOffset: { width: 5, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
        borderRightWidth: 1,
        borderRightColor: '#333'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 40,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333'
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    closeBtn: {
        padding: 5,
    },
    menuItems: {
        flex: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: '#2C2C2E',
        padding: 15,
        borderRadius: 16,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    menuText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        paddingBottom: 40,
        alignItems: 'center',
    },
    footerText: {
        color: '#666',
        fontSize: 12,
    },
    weightCard: {
        backgroundColor: '#2C2C2E',
        borderRadius: 16,
        padding: 15,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#333'
    },
    cardTitle: {
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 10,
        fontSize: 14
    },
    weightRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    weightLabel: {
        color: '#888',
        fontSize: 12
    },
    weightVal: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold'
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#1C1C1E',
        borderRadius: 3,
        marginBottom: 5
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#CCFF00',
        borderRadius: 3
    },
    remainingText: {
        color: '#CCFF00',
        fontSize: 12,
        textAlign: 'right'
    },
    setGoalText: {
        color: '#CCFF00',
        fontSize: 12,
        marginTop: 5,
        textDecorationLine: 'underline'
    }
});
