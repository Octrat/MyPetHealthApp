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
  ScrollView,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../src/config/api';

const cardBg = require('../assets/images/ФонГлавБел.jpg');

const COLORS = {
  background: '#FFFFFF',
  white: '#FFFFFF',
  cardSoft: '#FFE8E1',
  text: '#202020',
  textSoft: '#6F6578',
  accent: '#C9A7FF',
  accentDark: '#A984E8',
  coral: '#FF7A6B',
  coralDark: '#E95F53',
  border: '#EADDF8',
  shadow: '#8E78A8',
  success: '#65B891',
  warning: '#F4B740',
};

interface Props {
  visible: boolean;
  species: 'dog' | 'cat';
  onClose: () => void;
  onBreedSelected: (breedName: string) => void;
}

export default function BreedRecognizer({
  visible,
  species,
  onClose,
  onBreedSelected,
}: Props) {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    name: string;
    confidence: number;
  } | null>(null);
  const [step, setStep] = useState<'select' | 'result'>('select');

  const pickImage = async (useCamera: boolean) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Нужен доступ',
        `Разрешите доступ к ${useCamera ? 'камере' : 'галерее'}`
      );
      return;
    }

    const pickerResult = useCamera
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

    if (!pickerResult.canceled && pickerResult.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${pickerResult.assets[0].base64}`;

      setImage(pickerResult.assets[0].uri);
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
          species,
        }),
      });

      const data = await response.json();

      if (data.success && data.breed) {
        setResult({
          name: data.breed.name,
          confidence: data.breed.confidence,
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

  const resetRecognizer = () => {
    setImage(null);
    setResult(null);
    setStep('select');
    setLoading(false);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return COLORS.success;
    if (confidence >= 0.4) return COLORS.warning;
    return COLORS.coral;
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.7) return 'Высокая';
    if (confidence >= 0.4) return 'Средняя';
    return 'Низкая';
  };

  if (!visible) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>

          <Text style={styles.title}>Определение породы</Text>

          <Text style={styles.subtitle}>
            Загрузите фото {species === 'dog' ? 'собаки' : 'кошки'}, и ИИ
            попробует определить породу.
          </Text>
        </View>

        {step === 'select' && !image && (
          <ImageBackground
            source={cardBg}
            style={styles.selectCard}
            imageStyle={styles.cardImage}
            resizeMode="cover"
          >
            <View style={styles.heroIcon}>
              <Ionicons name="camera-outline" size={36} color={COLORS.white} />
            </View>

            <Text style={styles.selectTitle}>
              Фото питомца
            </Text>

            <Text style={styles.selectText}>
              Лучше всего подойдёт чёткое фото мордочки при хорошем освещении.
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => pickImage(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="camera-outline" size={22} color={COLORS.white} />
              <Text style={styles.primaryButtonText}>Сделать фото</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => pickImage(false)}
              activeOpacity={0.85}
            >
              <Ionicons name="image-outline" size={22} color={COLORS.text} />
              <Text style={styles.secondaryButtonText}>
                Выбрать из галереи
              </Text>
            </TouchableOpacity>
          </ImageBackground>
        )}

        {(step === 'result' || image) && (
          <View style={styles.resultContainer}>
            {image && (
              <ImageBackground
                source={cardBg}
                style={styles.imageCard}
                imageStyle={styles.cardImage}
                resizeMode="cover"
              >
                <Image source={{ uri: image }} style={styles.previewImage} />
              </ImageBackground>
            )}

            {loading && (
              <ImageBackground
                source={cardBg}
                style={styles.loadingCard}
                imageStyle={styles.cardImage}
                resizeMode="cover"
              >
                <ActivityIndicator size="large" color={COLORS.accentDark} />

                <Text style={styles.loadingTitle}>Определяем породу...</Text>

                <Text style={styles.loadingText}>
                  Это может занять несколько секунд
                </Text>
              </ImageBackground>
            )}

            {!loading && result && (
              <ImageBackground
                source={cardBg}
                style={styles.resultCard}
                imageStyle={styles.cardImage}
                resizeMode="cover"
              >
                <View style={styles.resultIcon}>
                  <Ionicons name="sparkles-outline" size={30} color={COLORS.white} />
                </View>

                <Text style={styles.resultLabel}>Предполагаемая порода</Text>

                <Text style={styles.breedName}>{result.name}</Text>

                <View style={styles.confidenceContainer}>
                  <View style={styles.confidenceTrack}>
                    <View
                      style={[
                        styles.confidenceBar,
                        {
                          width: `${Math.max(
                            8,
                            Math.round(result.confidence * 100)
                          )}%`,
                          backgroundColor: getConfidenceColor(
                            result.confidence
                          ),
                        },
                      ]}
                    />
                  </View>

                  <Text style={styles.confidenceText}>
                    Уверенность: {getConfidenceText(result.confidence)} (
                    {Math.round(result.confidence * 100)}%)
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleSelectBreed}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="checkmark"
                    size={22}
                    color={COLORS.white}
                  />
                  <Text style={styles.primaryButtonText}>
                    Выбрать эту породу
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={resetRecognizer}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="refresh-outline"
                    size={22}
                    color={COLORS.text}
                  />
                  <Text style={styles.secondaryButtonText}>Другое фото</Text>
                </TouchableOpacity>
              </ImageBackground>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 34,
  },

  header: {
    marginBottom: 18,
  },

  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 3,
  },

  title: {
    fontSize: 38,
    lineHeight: 42,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -1.1,
  },

  subtitle: {
    marginTop: 9,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textSoft,
    fontWeight: '600',
  },

  selectCard: {
    borderRadius: 32,
    padding: 22,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 6,
  },

  cardImage: {
    borderRadius: 32,
  },

  heroIcon: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: COLORS.white,
    marginBottom: 16,
  },

  selectTitle: {
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },

  selectText: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSoft,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 22,
  },

  primaryButton: {
    width: '100%',
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    shadowColor: COLORS.accentDark,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 4,
  },

  primaryButtonText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '900',
  },

  secondaryButton: {
    width: '100%',
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },

  secondaryButtonText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '900',
  },

  resultContainer: {
    gap: 16,
  },

  imageCard: {
    borderRadius: 32,
    padding: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 6,
  },

  previewImage: {
    width: '100%',
    height: 260,
    borderRadius: 24,
    backgroundColor: COLORS.cardSoft,
  },

  loadingCard: {
    borderRadius: 32,
    padding: 28,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  loadingTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
  },

  loadingText: {
    marginTop: 6,
    fontSize: 14,
    color: COLORS.textSoft,
    fontWeight: '600',
    textAlign: 'center',
  },

  resultCard: {
    borderRadius: 32,
    padding: 22,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 6,
  },

  resultIcon: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    marginBottom: 14,
  },

  resultLabel: {
    fontSize: 13,
    color: COLORS.textSoft,
    fontWeight: '800',
    marginBottom: 5,
  },

  breedName: {
    fontSize: 27,
    lineHeight: 32,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 18,
    letterSpacing: -0.5,
  },

  confidenceContainer: {
    width: '100%',
    marginBottom: 12,
  },

  confidenceTrack: {
    width: '100%',
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },

  confidenceBar: {
    height: '100%',
    borderRadius: 5,
  },

  confidenceText: {
    fontSize: 13,
    color: COLORS.textSoft,
    textAlign: 'center',
    fontWeight: '700',
  },
});