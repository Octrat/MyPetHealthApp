// components/BreedRecognizer.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.0.59:3001';

interface Props {
  visible: boolean;
  species: 'dog' | 'cat';
  onClose: () => void;
  onBreedSelected: (breedName: string) => void;
}

export default function BreedRecognizer({ visible, species, onClose, onBreedSelected }: Props) {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ name: string; confidence: number } | null>(null);
  const [step, setStep] = useState<'select' | 'result'>('select');

  const pickImage = async (useCamera: boolean) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permission.granted) {
      Alert.alert('Нужен доступ', `Разрешите доступ к ${useCamera ? 'камере' : 'галерее'}`);
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
          base64: true,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
          base64: true,
        });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setImage(result.assets[0].uri);
      analyzeBreed(base64Image);
    }
  };

  const analyzeBreed = async (base64Image: string) => {
    setLoading(true);
    setStep('result');
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      const response = await fetch(`${BASE_URL}/api/vision/gemini-recognize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          image: base64Image,
          species: species,
        }),
      });

      const data = await response.json();
      
      if (data.success && data.breed) {
        setResult({
          name: data.breed.name,
          confidence: data.breed.confidence
        });
      } else {
        Alert.alert('Ошибка', 'Не удалось определить породу');
        setStep('select');
        setImage(null);
      }
    } catch (error) {
      console.error('Ошибка:', error);
      Alert.alert('Ошибка', 'Проверьте соединение');
      setStep('select');
      setImage(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBreed = () => {
    if (result && result.name && result.name !== 'Не удалось определить') {
      onBreedSelected(result.name);
      onClose();
    } else {
      Alert.alert('Порода не определена', 'Попробуйте другое фото');
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return '#4CAF50';
    if (confidence >= 0.4) return '#FFC107';
    return '#FF5722';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.7) return 'Высокая';
    if (confidence >= 0.4) return 'Средняя';
    return 'Низкая';
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          📸 Определение породы {species === 'dog' ? 'собаки' : 'кошки'}
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      {step === 'select' && !image && (
        <View style={styles.selectContainer}>
          <Text style={styles.selectText}>
            Сфотографируйте питомца или выберите фото
          </Text>
          
          <TouchableOpacity style={styles.cameraButton} onPress={() => pickImage(true)}>
            <Text style={styles.cameraButtonText}>📷 Сделать фото</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.galleryButton} onPress={() => pickImage(false)}>
            <Text style={styles.galleryButtonText}>🖼️ Выбрать из галереи</Text>
          </TouchableOpacity>
        </View>
      )}

      {(step === 'result' || image) && (
        <View style={styles.resultContainer}>
          {image && (
            <Image source={{ uri: image }} style={styles.previewImage} />
          )}
          
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#7BC9A8" />
              <Text style={styles.loadingText}>Определяем породу...</Text>
            </View>
          )}

          {!loading && result && (
            <View style={styles.resultCard}>
              <Text style={styles.breedName}>{result.name}</Text>
              
              <View style={styles.confidenceContainer}>
                <View style={[styles.confidenceBar, { width: `${result.confidence * 100}%`, backgroundColor: getConfidenceColor(result.confidence) }]} />
                <Text style={styles.confidenceText}>
                  Уверенность: {getConfidenceText(result.confidence)} ({Math.round(result.confidence * 100)}%)
                </Text>
              </View>

              <View style={styles.buttonsRow}>
                <TouchableOpacity style={styles.selectButton} onPress={handleSelectBreed}>
                  <Text style={styles.selectButtonText}>✓ Выбрать эту породу</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.retryButton} 
                  onPress={() => {
                    setImage(null);
                    setResult(null);
                    setStep('select');
                  }}
                >
                  <Text style={styles.retryButtonText}>🔄 Другое фото</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F9F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#7BC9A8',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  selectContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2F4F4F',
    textAlign: 'center',
    marginBottom: 32,
  },
  cameraButton: {
    backgroundColor: '#7BC9A8',
    padding: 16,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  cameraButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  galleryButton: {
    backgroundColor: '#E8F0EC',
    padding: 16,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  galleryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2F4F4F',
  },
  resultContainer: {
    flex: 1,
    padding: 16,
  },
  previewImage: {
    width: '100%',
    height: 250,
    borderRadius: 20,
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#2F4F4F',
    marginTop: 16,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
  },
  breedName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2F4F4F',
    textAlign: 'center',
    marginBottom: 16,
  },
  confidenceContainer: {
    marginBottom: 24,
  },
  confidenceBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  confidenceText: {
    fontSize: 14,
    color: '#7A8F88',
    textAlign: 'center',
  },
  buttonsRow: {
    gap: 12,
  },
  selectButton: {
    backgroundColor: '#7BC9A8',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  retryButton: {
    backgroundColor: '#E8F0EC',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2F4F4F',
  },
});