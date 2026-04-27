import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BreedRecognizerProps {
  onBreedDetected?: (breed: string) => void;
  onClose?: () => void;
  preselectedSpecies?: 'dog' | 'cat'; // Добавляем пропс для вида
}

interface VisionResult {
  success: boolean;
  breed: {
    name: string;
    confidence: number;
  } | null;
  confidence: number;
  allLabels?: Array<{
    label: string;
    confidence: number;
  }>;
}

export default function BreedRecognizer({ onBreedDetected, onClose, preselectedSpecies }: BreedRecognizerProps) {
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<VisionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const API_URL = 'http://192.168.0.29:3001';

  // Запрос разрешения на камеру
  const requestCameraPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Ошибка', 'Нужен доступ к камере для фото');
      return false;
    }
    return true;
  };

  // Сделать фото
  const takePhoto = async (): Promise<void> => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.3,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImage(asset.uri || null);
      if (asset.base64) {
        recognizeBreed(asset.base64, preselectedSpecies);
      }
    }
  };

  // Выбрать из галереи
  const pickImage = async (): Promise<void> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.3,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImage(asset.uri || null);
      if (asset.base64) {
        recognizeBreed(asset.base64, preselectedSpecies);
      }
    }
  };

  // Распознать породу через бэкенд
  const recognizeBreed = async (base64Image: string, species?: string): Promise<void> => {
    setIsAnalyzing(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      const response = await fetch(`${API_URL}/api/vision/recognize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          image: `data:image/jpeg;base64,${base64Image}`,
          species: species || undefined
        })
      });

      const data: VisionResult = await response.json();
      console.log('Vision response:', data);
      
      if (data.success && data.breed) {
        setResult(data);
        if (onBreedDetected) {
          onBreedDetected(data.breed.name);
        }
      } else {
        Alert.alert('Ошибка', data.success === false ? 'Не удалось распознать породу' : 'Ошибка при распознавании');
      }
    } catch (error) {
      console.error('Recognition error:', error);
      Alert.alert('Ошибка', 'Проблема с подключением к серверу');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUseBreed = (): void => {
    if (result?.breed && onBreedDetected) {
      onBreedDetected(result.breed.name);
    }
    if (onClose) onClose();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔍 Распознавание породы</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {preselectedSpecies && (
        <View style={styles.speciesIndicator}>
          <Text style={styles.speciesText}>
            Выбранный вид: {preselectedSpecies === 'dog' ? '🐶 Собака' : '🐱 Кошка'}
          </Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.button, styles.cameraButton]} onPress={takePhoto}>
          <Text style={styles.buttonText}>📸 Сделать фото</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.galleryButton]} onPress={pickImage}>
          <Text style={styles.buttonText}>🖼️ Из галереи</Text>
        </TouchableOpacity>
      </View>

      {(isLoading || isAnalyzing) && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>
            {isLoading ? 'Загрузка...' : 'Анализируем фото...'}
          </Text>
        </View>
      )}

      {image && !isAnalyzing && (
        <ScrollView style={styles.resultScroll}>
          <Image source={{ uri: image }} style={styles.previewImage} />
          
          {result?.breed ? (
            <View style={styles.breedInfo}>
              <Text style={styles.breedName}>
                🐾 {result.breed.name}
              </Text>
              <Text style={styles.confidence}>
                Уверенность: {(result.confidence * 100).toFixed(1)}%
              </Text>
              
              {result.allLabels && result.allLabels.length > 0 && (
                <View style={styles.labelsContainer}>
                  <Text style={styles.labelsTitle}>Другие варианты:</Text>
                  {result.allLabels.slice(0, 3).map((label, idx) => (
                    <Text key={idx} style={styles.label}>
                      • {label.label} ({(label.confidence * 100).toFixed(1)}%)
                    </Text>
                  ))}
                </View>
              )}
              
              <TouchableOpacity style={styles.useButton} onPress={handleUseBreed}>
                <Text style={styles.useButtonText}>✓ Использовать эту породу</Text>
              </TouchableOpacity>
            </View>
          ) : result && (
            <View style={styles.errorInfo}>
              <Text style={styles.errorText}>
                Не удалось определить породу на этом фото.
              </Text>
              <Text style={styles.errorSubtext}>
                Попробуйте сделать фото более четко или выберите другое изображение.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#999',
  },
  speciesIndicator: {
    backgroundColor: '#e8f5e9',
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  speciesText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    flex: 0.45,
  },
  cameraButton: {
    backgroundColor: '#4CAF50',
  },
  galleryButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  resultScroll: {
    maxHeight: 500,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 15,
  },
  breedInfo: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 12,
  },
  breedName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  confidence: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 15,
  },
  labelsContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  labelsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: '#888',
    marginBottom: 4,
  },
  useButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  useButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorInfo: {
    backgroundColor: '#fff3e0',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#e65100',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});