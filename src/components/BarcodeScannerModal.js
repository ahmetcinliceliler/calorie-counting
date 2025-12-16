import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

import Constants from 'expo-constants';

const { width } = Dimensions.get('window');
const API_KEY = Constants.expoConfig.extra.geminiApiKey;

export default function BarcodeScannerModal({ visible, onClose, onFoodFound }) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);
    const processingRef = useRef(false);

    useEffect(() => {
        if (visible) {
            setScanned(false);
            setLoading(false);
            processingRef.current = false;
        }
    }, [visible]);

    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <Modal visible={visible} animationType="slide">
                <View style={styles.container}>
                    <Text style={styles.text}>Kamerayı kullanmak için izne ihtiyacımız var.</Text>
                    <TouchableOpacity style={styles.button} onPress={requestPermission}>
                        <Text style={styles.buttonText}>İzin Ver</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Text style={styles.closeText}>Kapat</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        );
    }

    const estimateNutritionWithAI = async (productName) => {
        try {
            if (!API_KEY) {
                console.warn("API Key missing for AI estimation");
                return null;
            }
            const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
            const requestBody = {
                contents: [{
                    parts: [{
                        text: `Analyze this food product: "${productName}". Estimate the standard package size (e.g. 45g, 330ml, 1 bar) and nutritional values for BOTH that package AND for 100g. Return ONLY JSON format: { "portion": {"calories": 100, "protein": 10, "carbs": 20, "fat": 5}, "100g": {"calories": 200, "protein": 20, "carbs": 40, "fat": 10}, "portion_string": "1 Paket (45g)" }`
                    }]
                }]
            };

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            if (!data.candidates) throw new Error("AI Cevap vermedi.");

            const textResponse = data.candidates[0].content.parts[0].text;
            const cleanedText = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanedText);
        } catch (error) {
            console.error("AI Estimation Error:", error);
            return null;
        }
    };

    const resetScanner = () => {
        setScanned(false);
        setLoading(false);
        processingRef.current = false;
    };

    const showResult = (
        name,
        calP, protP, carbP, fatP,
        cal100, prot100, carb100, fat100,
        isAi, portionLabel
    ) => {
        setLoading(false);

        const message = `${name}\n\n` +
            `📦 ${portionLabel}:\n` +
            `Kalori: ${calP} kcal • P: ${protP}g • K: ${carbP}g • Y: ${fatP}g\n\n` +
            `⚖️ 100g Değerleri:\n` +
            `Kalori: ${cal100} kcal • P: ${prot100}g • K: ${carb100}g • Y: ${fat100}g`;

        Alert.alert(
            isAi ? "AI Tahmini 🤖" : "Ürün Bulundu! 🍫",
            message,
            [
                {
                    text: "İptal",
                    style: "cancel",
                    onPress: () => resetScanner()
                },
                {
                    text: "Ekle",
                    onPress: () => {
                        onFoodFound({
                            name,
                            calories: calP,
                            protein: protP,
                            carbs: carbP,
                            fat: fatP,
                            portion: portionLabel
                        });
                        onClose();
                        // Modal kapanınca resetlemeye gerek yok, tekrar açılınca useEffect resetliyor
                    }
                }
            ]
        );
    };

    const handleBarCodeScanned = async ({ type, data }) => {
        if (scanned || loading || processingRef.current) return;

        processingRef.current = true;
        setScanned(true);
        setLoading(true);

        try {
            // OpenFoodFacts API
            const response = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${data}.json`);

            if (response.data.status === 1) {
                const product = response.data.product;
                const name = product.product_name || "Bilinmeyen Ürün";
                const nutriments = product.nutriments || {};

                // 1. Önce API'den miktar bilgisi var mı bak (örn: "330 ml", "45 g")
                let quantityStr = product.quantity || product.serving_size || "";

                let calories100g = Math.round(nutriments['energy-kcal_100g'] || 0);
                let protein100g = Math.round(nutriments['proteins_100g'] || 0);
                let carbs100g = Math.round(nutriments['carbohydrates_100g'] || 0);
                let fat100g = Math.round(nutriments['fat_100g'] || 0);

                // Eğer kalori bilgisi yoksa AI devreye girsin (OTOMATİK)
                if (calories100g === 0) {
                    // Kullanıcıya sormadan direkt AI çağır
                    const aiData = await estimateNutritionWithAI(name);
                    if (aiData) {
                        const portionData = aiData.portion || {};
                        const data100g = aiData['100g'] || {};

                        // AI'dan gelen porsiyon bilgisini kullan, yoksa varsayılan
                        const portionStr = aiData.portion_string || '1 Porsiyon (Tahmini)';

                        showResult(
                            name,
                            portionData.calories, portionData.protein, portionData.carbs, portionData.fat,
                            data100g.calories, data100g.protein, data100g.carbs, data100g.fat,
                            true, portionStr
                        );
                    } else {
                        Alert.alert("Hata", "Ürün ismi bulundu ancak besin değerleri alınamadı.", [{ text: "Tamam", onPress: () => resetScanner() }]);
                    }
                } else {
                    // Kalori var, miktar bilgisini kontrol et
                    let portionLabel = '100g';
                    let caloriesPortion = calories100g;
                    let proteinPortion = protein100g;
                    let carbsPortion = carbs100g;
                    let fatPortion = fat100g;

                    // Eğer API'den gelen miktar bilgisi varsa onu kullan (örn: "330ml")
                    if (quantityStr) {
                        portionLabel = quantityStr;

                        if (nutriments['energy-kcal_serving']) {
                            caloriesPortion = Math.round(nutriments['energy-kcal_serving']);
                            proteinPortion = Math.round(nutriments['proteins_serving'] || 0);
                            carbsPortion = Math.round(nutriments['carbohydrates_serving'] || 0);
                            fatPortion = Math.round(nutriments['fat_serving'] || 0);
                            // Porsiyon etiketini serving size yap
                            portionLabel = product.serving_size || quantityStr;
                        }
                    }

                    showResult(
                        name,
                        caloriesPortion, proteinPortion, carbsPortion, fatPortion,
                        calories100g, protein100g, carbs100g, fat100g,
                        false, portionLabel
                    );
                }
            } else {
                Alert.alert("Bulunamadı", "Bu barkod veritabanında bulunamadı.", [
                    { text: "Tamam", onPress: () => resetScanner() }
                ]);
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Hata", "Ürün bilgileri alınırken bir hata oluştu.", [
                { text: "Tamam", onPress: () => resetScanner() }
            ]);
        } finally {
            if (!scanned) {
                setLoading(false);
                processingRef.current = false;
            }
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.container}>
                <CameraView
                    style={styles.camera}
                    facing="back"
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
                    }}
                >
                    <View style={styles.overlay}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Barkodu Taratın</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
                                <Ionicons name="close-circle" size={36} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.scanArea}>
                            <View style={styles.scanCornerTL} />
                            <View style={styles.scanCornerTR} />
                            <View style={styles.scanCornerBL} />
                            <View style={styles.scanCornerBR} />
                        </View>

                        <View style={styles.footer}>
                            {loading && (
                                <View style={styles.loadingBox}>
                                    <ActivityIndicator size="large" color="#CCFF00" />
                                    <Text style={styles.loadingText}>Ürün Aranıyor...</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </CameraView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'space-between',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 40,
    },
    title: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    closeIcon: {
        padding: 5,
    },
    scanArea: {
        width: width * 0.7,
        height: width * 0.5,
        alignSelf: 'center',
        justifyContent: 'space-between',
    },
    scanCornerTL: {
        position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#CCFF00'
    },
    scanCornerTR: {
        position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderTopWidth: 4, borderRightWidth: 4, borderColor: '#CCFF00'
    },
    scanCornerBL: {
        position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: '#CCFF00'
    },
    scanCornerBR: {
        position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderBottomWidth: 4, borderRightWidth: 4, borderColor: '#CCFF00'
    },
    footer: {
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingBox: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
    },
    loadingText: {
        color: '#CCFF00',
        marginTop: 10,
        fontWeight: 'bold',
    },
    text: {
        color: '#fff',
        textAlign: 'center',
        marginBottom: 20,
        fontSize: 16
    },
    button: {
        backgroundColor: '#CCFF00',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        width: 200,
        alignItems: 'center'
    },
    buttonText: {
        color: '#000',
        fontWeight: 'bold'
    },
    closeBtn: {
        padding: 15,
    },
    closeText: {
        color: '#fff',
        textDecorationLine: 'underline'
    }
});
