import React, { useState } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';

const API_KEY = Constants.expoConfig.extra.geminiApiKey;

export default function AIChefModal({ visible, onClose }) {
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [recipe, setRecipe] = useState(null);

    const generateRecipe = async () => {
        if (!inputText.trim()) {
            Alert.alert("Uyarı", "Lütfen elinizdeki malzemeleri veya isteğinizi yazın.");
            return;
        }

        setLoading(true);
        setRecipe(null);

        try {
            if (!API_KEY) {
                Alert.alert("Hata", "API Anahtarı bulunamadı. Lütfen yapılandırmayı kontrol edin.");
                setLoading(false);
                return;
            }

            const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
            const prompt = `Sen profesyonel bir diyetisyen ve şefsin. Kullanıcının isteğine göre sağlıklı, düşük kalorili ve lezzetli bir tarif oluştur.
            
            Kullanıcı İsteği: "${inputText}"
            
            Sadece şu JSON formatında cevap ver:
            {
                "title": "Yemek Adı",
                "calories": 350,
                "protein": 25,
                "carbs": 30,
                "fat": 10,
                "ingredients": ["Malzeme 1", "Malzeme 2"],
                "instructions": ["Adım 1", "Adım 2", "Adım 3"]
            }`;

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);

            const textResponse = data.candidates[0].content.parts[0].text;
            const cleanedText = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            const recipeData = JSON.parse(cleanedText);

            setRecipe(recipeData);

        } catch (error) {
            console.error(error);
            Alert.alert("Hata", "Tarif oluşturulamadı. Lütfen tekrar deneyin.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>AI Şef 👨‍🍳</Text>
                        <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity>
                    </View>

                    {!recipe ? (
                        <View style={styles.inputContainer}>
                            <Text style={styles.subtitle}>Bugün ne yemek istersin? Veya elinde hangi malzemeler var?</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Örn: Tavuk, brokoli ve pirinç var..."
                                placeholderTextColor="#666"
                                multiline
                                value={inputText}
                                onChangeText={setInputText}
                            />
                            <TouchableOpacity style={styles.generateBtn} onPress={generateRecipe} disabled={loading}>
                                {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Tarif Oluştur ✨</Text>}
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <ScrollView style={styles.resultContainer}>
                            <Text style={styles.recipeTitle}>{recipe.title}</Text>

                            <View style={styles.macrosRow}>
                                <View style={styles.macroItem}><Text style={styles.macroVal}>{recipe.calories}</Text><Text style={styles.macroLabel}>kcal</Text></View>
                                <View style={styles.macroItem}><Text style={[styles.macroVal, { color: '#32D74B' }]}>{recipe.protein}g</Text><Text style={styles.macroLabel}>Prot</Text></View>
                                <View style={styles.macroItem}><Text style={[styles.macroVal, { color: '#0A84FF' }]}>{recipe.carbs}g</Text><Text style={styles.macroLabel}>Karb</Text></View>
                                <View style={styles.macroItem}><Text style={[styles.macroVal, { color: '#FF9F0A' }]}>{recipe.fat}g</Text><Text style={styles.macroLabel}>Yağ</Text></View>
                            </View>

                            <Text style={styles.sectionTitle}>Malzemeler</Text>
                            {recipe.ingredients.map((item, i) => (
                                <Text key={i} style={styles.textItem}>• {item}</Text>
                            ))}

                            <Text style={styles.sectionTitle}>Hazırlanışı</Text>
                            {recipe.instructions.map((item, i) => (
                                <Text key={i} style={styles.textItem}>{i + 1}. {item}</Text>
                            ))}

                            <TouchableOpacity style={styles.newBtn} onPress={() => { setRecipe(null); setInputText(''); }}>
                                <Text style={styles.newBtnText}>Yeni Tarif</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    container: { backgroundColor: '#1C1C1E', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '85%', padding: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    inputContainer: { flex: 1, justifyContent: 'center' },
    subtitle: { color: '#ccc', fontSize: 16, marginBottom: 15, textAlign: 'center' },
    input: { backgroundColor: '#2C2C2E', color: '#fff', padding: 15, borderRadius: 12, height: 120, textAlignVertical: 'top', fontSize: 16, marginBottom: 20 },
    generateBtn: { backgroundColor: '#CCFF00', padding: 16, borderRadius: 12, alignItems: 'center' },
    btnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },

    resultContainer: { flex: 1 },
    recipeTitle: { color: '#CCFF00', fontSize: 22, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    macrosRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#2C2C2E', padding: 15, borderRadius: 12, marginBottom: 20 },
    macroItem: { alignItems: 'center' },
    macroVal: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    macroLabel: { color: '#888', fontSize: 12 },
    sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 15, marginBottom: 10 },
    textItem: { color: '#ccc', fontSize: 14, marginBottom: 5, lineHeight: 20 },
    newBtn: { marginTop: 30, backgroundColor: '#333', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
    newBtnText: { color: '#fff', fontWeight: 'bold' }
});
