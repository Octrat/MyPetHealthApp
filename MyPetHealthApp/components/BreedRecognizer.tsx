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
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.0.29:3001';

interface RecognitionResult {
  success: boolean;
  breed: {
    name: string;
    name_en?: string;
    confidence: number;
  };
  description?: string;
  traits?: {
    size: string;
    coat_type: string;
    energy_level: string;
    shedding: string;
  };
  care_tips?: string[];
  health_notes?: string[];
  alternative_breeds?: string[];
}

interface Props {
  visible: boolean;
  species: 'dog' | 'cat';
  onClose: () => void;
  onBreedSelected: (breedName: string, breedData?: RecognitionResult) => void;
}

export default function BreedRecognizer({ visible, species, onClose, onBreedSelected }: Props) {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [step, setStep] = useState<'select' | 'result'>('select');

  const pickImage = async (useCamera: boolean) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permission.granted) {
      Alert.alert('Нужен доступ', `Разрешите доступ к ${useCamera ? 'камере' : 'галерее'} для определения породы`);
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
      
      if (data.success) {
        setResult(data);
      } else {
        Alert.alert('Ошибка', data.error || 'Не удалось определить породу');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      Alert.alert('Ошибка', 'Проверьте соединение с сервером');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBreed = () => {
    if (result && result.breed.name && result.breed.name !== 'Неизвестная порода') {
      onBreedSelected(result.breed.name, result);
      onClose();
    } else {
      Alert.alert('Порода не определена', 'Попробуйте другое фото или введите породу вручную');
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return '#4CAF50';
    if (confidence >= 0.4) return '#FFC107';
    return '#FF5722';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.7) return 'Высокая уверенность';
    if (confidence >= 0.4) return 'Средняя уверенность';
    return 'Низкая уверенность';
  };

  const getSizeText = (size: string) => {
    const sizes: Record<string, string> = {
      'Small': 'Маленькая (до 10 кг)',
      'Medium': 'Средняя (10-25 кг)',
      'Large': 'Крупная (25-45 кг)',
      'Giant': 'Огромная (45+ кг)',
    };
    return sizes[size] || size;
  };

  const getEnergyText = (energy: string) => {
    const energies: Record<string, string> = {
      'low': 'Низкая 🦥',
      'medium': 'Средняя 🐕',
      'high': 'Высокая ⚡',
      'very_high': 'Очень высокая 🔥',
    };
    return energies[energy] || energy;
  };

  const getCoatText = (coat: string) => {
    const coats: Record<string, string> = {
      'short': 'Короткая',
      'medium': 'Средняя',
      'long': 'Длинная',
      'curly': 'Кудрявая',
      'wirehaired': 'Жесткая',
      'hairless': 'Без шерсти',
    };
    return coats[coat] || coat;
  };

  const getSheddingText = (shedding: string) => {
    const shed: Record<string, string> = {
      'low': 'Мало линяет',
      'medium': 'Линет умеренно',
      'high': 'Обильно линяет',
    };
    return shed[shedding] || shedding;
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            🐕 Определение породы {species === 'dog' ? 'собаки' : 'кошки'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {step === 'select' && !image && (
          <View style={styles.selectContainer}>
            <Text style={styles.selectText}>
              Сфотографируйте питомца или выберите фото из галереи
            </Text>
            <Text style={styles.selectHint}>
              Для лучшего результата фото должно быть:{'\n'}
              • При хорошем освещении{'\n'}
              • Питомец в полный рост или анфас{'\n'}
              • Четкое изображение
            </Text>
            
            <TouchableOpacity style={styles.cameraButton} onPress={() => pickImage(true)}>
              <Text style={styles.cameraButtonIcon}>📷</Text>
              <Text style={styles.cameraButtonText}>Сделать фото</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.galleryButton} onPress={() => pickImage(false)}>
              <Text style={styles.galleryButtonIcon}>🖼️</Text>
              <Text style={styles.galleryButtonText}>Выбрать из галереи</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'result' && (
          <ScrollView style={styles.resultContainer} showsVerticalScrollIndicator={false}>
            {image && (
              <Image source={{ uri: image }} style={styles.previewImage} />
            )}
            
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7BC9A8" />
                <Text style={styles.loadingText}>
                  🤖 Gemini анализирует фото...
                </Text>
                <Text style={styles.loadingSubtext}>
                  Определяем породу и характеристики
                </Text>
              </View>
            )}

            {!loading && result && (
              <View>
                {/* Результат */}
                <View style={styles.breedCard}>
                  <Text style={styles.breedName}>{result.breed.name}</Text>
                  
                  <View style={styles.confidenceContainer}>
                    <View style={[styles.confidenceBar, { width: `${result.breed.confidence * 100}%`, backgroundColor: getConfidenceColor(result.breed.confidence) }]} />
                    <Text style={styles.confidenceText}>
                      {getConfidenceText(result.breed.confidence)} — {Math.round(result.breed.confidence * 100)}%
                    </Text>
                  </View>

                  {result.description && (
                    <Text style={styles.description}>{result.description}</Text>
                  )}
                </View>

                {/* Характеристики */}
                {result.traits && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📊 Характеристики</Text>
                    <View style={styles.traitsGrid}>
                      <View style={styles.traitItem}>
                        <Text style={styles.traitLabel}>Размер</Text>
                        <Text style={styles.traitValue}>{getSizeText(result.traits.size)}</Text>
                      </View>
                      <View style={styles.traitItem}>
                        <Text style={styles.traitLabel}>Шерсть</Text>
                        <Text style={styles.traitValue}>{getCoatText(result.traits.coat_type)}</Text>
                      </View>
                      <View style={styles.traitItem}>
                        <Text style={styles.traitLabel}>Активность</Text>
                        <Text style={styles.traitValue}>{getEnergyText(result.traits.energy_level)}</Text>
                      </View>
                      <View style={styles.traitItem}>
                        <Text style={styles.traitLabel}>Линька</Text>
                        <Text style={styles.traitValue}>{getSheddingText(result.traits.shedding)}</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Советы по уходу */}
                {result.care_tips && result.care_tips.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>💡 Советы по уходу</Text>
                    {result.care_tips.map((tip, index) => (
                      <View key={index} style={styles.tipItem}>
                        <Text style={styles.tipBullet}>•</Text>
                        <Text style={styles.tipText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Заметки о здоровье */}
                {result.health_notes && result.health_notes.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🩺 Здоровье</Text>
                    {result.health_notes.map((note, index) => (
                      <View key={index} style={styles.tipItem}>
                        <Text style={styles.tipBullet}>•</Text>
                        <Text style={styles.tipText}>{note}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Альтернативные породы */}
                {result.alternative_breeds && result.alternative_breeds.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🔍 Похожие породы</Text>
                    <View style={styles.alternativesContainer}>
                      {result.alternative_breeds.map((breed, index) => (
                        <View key={index} style={styles.alternativeBadge}>
                          <Text style={styles.alternativeText}>{breed}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Кнопки действий */}
                <View style={styles.actionsContainer}>
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
                    <Text style={styles.retryButtonText}>📸 Определить другую породу</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

// Стили (добавьте в конец файла)
const styles = StyleSheet.create({
  modalContainer: {
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
    fontSize: 18,
    fontWeight: '600',
    color: '#2F4F4F',
    textAlign: 'center',
    marginBottom: 16,
  },
  selectHint: {
    fontSize: 14,
    color: '#7A8F88',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  cameraButton: {
    backgroundColor: '#7BC9A8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    width: '100%',
    marginBottom: 12,
  },
  cameraButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  cameraButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  galleryButton: {
    backgroundColor: '#E8F0EC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    width: '100%',
  },
  galleryButtonIcon: {
    fontSize: 24,
    marginRight: 12,
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
    fontWeight: '600',
    color: '#2F4F4F',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 13,
    color: '#7A8F88',
    marginTop: 8,
  },
  breedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  breedName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2F4F4F',
    marginBottom: 12,
  },
  confidenceContainer: {
    marginBottom: 16,
  },
  confidenceBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  confidenceText: {
    fontSize: 12,
    color: '#7A8F88',
  },
  description: {
    fontSize: 14,
    color: '#5A6F68',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2F4F4F',
    marginBottom: 12,
  },
  traitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  traitItem: {
    backgroundColor: '#F8FCFA',
    padding: 12,
    borderRadius: 12,
    width: '47%',
  },
  traitLabel: {
    fontSize: 12,
    color: '#7A8F88',
    marginBottom: 4,
  },
  traitValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2F4F4F',
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  tipBullet: {
    fontSize: 14,
    color: '#7BC9A8',
    marginRight: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#5A6F68',
    flex: 1,
    lineHeight: 20,
  },
  alternativesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  alternativeBadge: {
    backgroundColor: '#E8F0EC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  alternativeText: {
    fontSize: 12,
    color: '#2F4F4F',
  },
  actionsContainer: {
    marginBottom: 40,
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

// Добавьте SafeAreaView в импорты
import { SafeAreaView } from 'react-native-safe-area-context';