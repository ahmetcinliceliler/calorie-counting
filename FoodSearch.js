import React, { useState } from 'react';
import { 
  StyleSheet, View, TextInput, Button, FlatList, Text, 
  ActivityIndicator, TouchableOpacity, Image 
} from 'react-native';
import axios from 'axios';

const localFoods = [
  { id: 'local_1', product_name: 'Taze Elma (Orta Boy)', calories: 52, image_url: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Red_Apple.jpg' },
  { id: 'local_2', product_name: 'Muz (Orta Boy)', calories: 89, image_url: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Banana-Single.jpg' },
  { id: 'local_3', product_name: 'Haşlanmış Yumurta', calories: 155, image_url: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Chicken_egg_2009-06-04.jpg' },
  { id: 'local_4', product_name: 'Ekmek (1 Dilim)', calories: 67, image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Anadama_bread_%281%29.jpg/800px-Anadama_bread_%281%29.jpg' },
  { id: 'local_5', product_name: 'Izgara Tavuk Göğsü (100g)', calories: 165, image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Good_Food_Display_-_NCI_Visuals_Online.jpg/800px-Good_Food_Display_-_NCI_Visuals_Online.jpg' },
];

// DİKKAT: Artık 'onClose' diye bir yetki daha alıyor
const FoodSearch = ({ onFoodAdd, onClose }) => {
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchFood = async () => {
    if (query.trim() === '') return;
    setIsLoading(true);
    setResults([]);
    const localMatches = localFoods.filter(food => food.product_name.toLowerCase().includes(query.toLowerCase()));
    const url = `https://tr.openfoodfacts.org/cgi/search.pl?search_terms=${query}&json=1&page_size=10`;
    try {
      const response = await axios.get(url);
      let apiProducts = [];
      if (response.data && response.data.products) {
        apiProducts = response.data.products;
      }
      const formattedApiProducts = apiProducts.map(item => ({
        id: item.code || Math.random().toString(),
        product_name: item.product_name || 'Bilinmeyen Ürün',
        calories: item.nutriments?.['energy-kcal_100g'] || 0,
        image_url: item.image_small_url 
      }));
      setResults([...localMatches, ...formattedApiProducts]);
    } catch (error) {
      setResults(localMatches);
    } finally {
      setIsLoading(false);
    }
  };

  const renderFoodItem = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.itemContainer} 
        onPress={() => {
          onFoodAdd(item.product_name, item.calories); // Ekle
          setResults([]); 
          setQuery('');
          // DİKKAT: Modalı burada kapatmıyoruz, App.js kapatıyor.
        }}
      >
        {item.image_url ? (
           <Image source={{ uri: item.image_url }} style={styles.productImage} />
        ) : (
           <View style={[styles.productImage, { backgroundColor: '#eee' }]} />
        )}
        <View style={styles.textContainer}>
          <Text style={styles.itemName}>{item.product_name}</Text>
          <Text style={styles.itemCalories}>{item.calories} kcal</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Üst Başlık ve Kapat Butonu */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Yiyecek Ekle</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Vazgeç X</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Ne yediniz? (Örn: Muz)..."
        value={query}
        onChangeText={setQuery}
      />
      <Button title="Ara" onPress={searchFood} color="#2196F3" />

      {isLoading && <ActivityIndicator size="large" color="#2196F3" style={{ marginTop: 20 }} />}

      <FlatList
        data={results}
        renderItem={renderFoodItem}
        keyExtractor={(item) => item.id.toString()} 
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    flex: 1, 
    padding: 10,
    paddingTop: 60, // <-- BU SATIRI EKLE VEYA SAYIYI BÜYÜT (50-60 idealdir)
    backgroundColor: '#fff' // Beyaz arka plan 
   },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  closeButton: { padding: 10 },
  closeButtonText: { color: 'red', fontWeight: 'bold', fontSize: 16 },
  
  input: { height: 50, borderColor: '#ddd', borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, marginBottom: 10, backgroundColor: '#f9f9f9' },
  list: { marginTop: 10 },
  itemContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  productImage: { width: 50, height: 50, borderRadius: 5, marginRight: 15, resizeMode: 'contain', backgroundColor: 'white' },
  textContainer: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: 'bold' },
  itemCalories: { fontSize: 14, color: '#888' },
});

export default FoodSearch;