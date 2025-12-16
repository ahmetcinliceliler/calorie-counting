import React, { useState, useRef } from 'react';
import {
    StyleSheet, View, TouchableOpacity, Text, Animated,
    TouchableWithoutFeedback, Modal
} from 'react-native';
import { AntDesign, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function FabGroup({ actions }) {
    const [isOpen, setIsOpen] = useState(false);
    const animation = useRef(new Animated.Value(0)).current;

    const toggleMenu = () => {
        const toValue = isOpen ? 0 : 1;
        Animated.spring(animation, {
            toValue,
            friction: 5,
            useNativeDriver: true,
        }).start();
        setIsOpen(!isOpen);
    };

    const closeMenu = () => {
        Animated.spring(animation, {
            toValue: 0,
            friction: 5,
            useNativeDriver: true,
        }).start();
        setIsOpen(false);
    };

    const getStyle = (index) => {
        const translateY = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -60 * (index + 1)],
        });
        const opacity = animation.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0, 1],
        });
        return {
            transform: [{ translateY }],
            opacity,
        };
    };

    const rotation = animation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '45deg'],
    });

    return (
        <View style={styles.container}>
            {isOpen && (
                <TouchableWithoutFeedback onPress={closeMenu}>
                    <View style={styles.backdrop} />
                </TouchableWithoutFeedback>
            )}

            {actions.map((action, index) => (
                <Animated.View
                    key={index}
                    style={[styles.buttonContainer, getStyle(index)]}
                >
                    <View style={styles.labelContainer}>
                        <Text style={styles.label}>{action.label}</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.secondaryButton, { backgroundColor: action.color || '#fff' }]}
                        onPress={() => {
                            closeMenu();
                            action.onPress();
                        }}
                    >
                        {action.icon}
                    </TouchableOpacity>
                </Animated.View>
            ))}

            <TouchableOpacity
                style={styles.mainButton}
                onPress={toggleMenu}
                activeOpacity={0.8}
            >
                <Animated.View style={{ transform: [{ rotate: rotation }] }}>
                    <AntDesign name="plus" size={32} color="black" />
                </Animated.View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 30,
        alignSelf: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    backdrop: {
        position: 'absolute',
        width: 1000, // Geniş bir alan kaplaması için
        height: 1000,
        bottom: -500, // Merkezi hizalamak için
        left: -500,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 500, // Yuvarlak backdrop efekti
    },
    mainButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#CCFF00',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#CCFF00',
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 10,
    },
    buttonContainer: {
        position: 'absolute',
        bottom: 10,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        right: -70, // Butonları sağa yaslamak yerine ortadan çıkıyorlar ama label solda kalsın
        width: 200, // Label için yer
    },
    secondaryButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
        marginLeft: 10,
    },
    labelContainer: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
    },
    label: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 12,
    },
});
