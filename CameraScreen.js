import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Button, Image, SafeAreaView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function CameraScreen({ onClose, onPhotoTaken }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState(null); 
  const cameraRef = useRef(null); 

  // Burada "modalVisible" veya "cameraVisible" gibi state'ler yok.
  // Çünkü bu dosya sadece kamerayı kontrol eder.

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={{ textAlign: 'center', marginBottom: 10, color: 'white' }}>Kamerayı kullanmak için izniniz gerekiyor</Text>
        <Button onPress={requestPermission} title="İzin Ver" />
        <Button onPress={onClose} title="Vazgeç" color="red" />
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photoData = await cameraRef.current.takePictureAsync({
          quality: 0.5, 
          base64: true, 
        });
        setPhoto(photoData.uri);
      } catch (error) {
        console.log("Hata:", error);
      }
    }
  };

  if (photo) {
    return (
      <SafeAreaView style={styles.container}>
        <Image source={{ uri: photo }} style={styles.preview} />
        <View style={styles.buttonRow}>
          <Button title="Tekrar Çek" onPress={() => setPhoto(null)} />
          <Button title="Bunu Kullan" onPress={() => onPhotoTaken(photo)} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back" ref={cameraRef}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
             <Text style={styles.text}>X</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.innerCircle} />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', backgroundColor: 'black' },
  permissionContainer: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'black' },
  camera: { flex: 1 },
  buttonContainer: { flex: 1, flexDirection: 'row', backgroundColor: 'transparent', margin: 64, justifyContent: 'center' },
  
  captureButton: {
    position: 'absolute', bottom: 20, alignSelf: 'center',
    width: 70, height: 70, borderRadius: 35, backgroundColor: 'white',
    justifyContent: 'center', alignItems: 'center'
  },
  innerCircle: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: 'black' },
  
  // KAPAT BUTONU SAĞ ÜSTTEKİ SON KONUMU
  closeButton: {
    position: 'absolute', 
    top: 40,    
    right: 20,   
    backgroundColor: 'rgba(0,0,0,0.5)', 
    padding: 10, 
    borderRadius: 5
  },
  text: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  
  preview: { flex: 1, resizeMode: 'contain' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 20, backgroundColor: 'white' }
});