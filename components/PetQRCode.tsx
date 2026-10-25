
// components/PetQRCode.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Share,
  InteractionManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../src/config/api';

interface PetQRCodeProps {
  visible: boolean;
  pet: {
    id: number;
    name: string;
    species: string;
    breed_name?: string;
    weight?: number;
    age?: number;
    photo_url?: string;
  } | null;
  onClose: () => void;
  onSave?: () => void;
}

export default function PetQRCode({
  visible,
  pet,
  onClose,
  onSave,
}: PetQRCodeProps) {
  const [qrData, setQrData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);

  const [contactInfo, setContactInfo] = useState({
    phone: '',
    address: '',
    additionalInfo: '',
    ownerName: '',
  });

  const [isEditing, setIsEditing] = useState(true);

  const qrRef = useRef<View | null>(null);

  // Ждём, пока QR-код реально появится на экране
  const waitForQRView = async () => {
    await new Promise<void>((resolve) => {
      InteractionManager.runAfterInteractions(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });
  };

  // Проверка наличия питомца
  useEffect(() => {
    if (visible && (!pet || !pet.id)) {
      Alert.alert('Ошибка', 'Данные питомца не загружены');
      onClose();
    }
  }, [visible, pet]);

  /**
   * Создаём QR-код из ID питомца.
   *
   * ВАЖНО:
   * QR-картинку не нужно хранить в базе.
   * Она всегда может быть создана заново из pet.id.
   */
  const generateQRCode = () => {
    if (!pet || !pet.id) {
      return;
    }

    const qrPayload =
      `http://192.168.0.29:3001/pet-location.html?id=${pet.id}`;

    setQrData(qrPayload);
  };

  /**
   * При каждом открытии окна:
   * 1. Загружаем сохранённые контакты.
   * 2. Восстанавливаем QR-код из ID питомца.
   */
  useEffect(() => {
    if (visible && pet && pet.id) {
      // QR всегда восстанавливается при повторном открытии
      generateQRCode();

      // Загружаем контакты владельца
      loadContactInfo();
    }
  }, [visible, pet?.id]);

  // Загрузка сохранённых контактов
  const loadContactInfo = async () => {
    if (!pet) return;

    try {
      const token = await AsyncStorage.getItem('userToken');

      const response = await fetch(
        `${BASE_URL}/api/pets/${pet.id}/qr-info`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data) {
        setContactInfo({
          phone: data.phone || '',
          address: data.address || '',
          additionalInfo: data.additionalInfo || '',
          ownerName: data.ownerName || '',
        });

        // Если данные уже были сохранены —
        // сразу показываем QR-экран
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Ошибка загрузки контактов:', error);

      // Даже если контакты не загрузились,
      // QR всё равно должен существовать
      generateQRCode();
    }
  };

  const saveContactInfo = async () => {
    if (!pet) return;

    if (
      !contactInfo.phone &&
      !contactInfo.address &&
      !contactInfo.ownerName
    ) {
      Alert.alert(
        'Внимание',
        'Вы не заполнили контактные данные. Люди не смогут связаться с вами, если найдут питомца.\n\nЖелаете продолжить?',
        [
          {
            text: 'Заполнить данные',
            style: 'cancel',
          },
          {
            text: 'Всё равно продолжить',
            onPress: () => {
              setIsEditing(false);

              // QR создаётся даже без контактных данных
              generateQRCode();
            },
          },
        ]
      );

      return;
    }

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem('userToken');

      const response = await fetch(
        `${BASE_URL}/api/pets/${pet.id}/qr-info`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(contactInfo),
        }
      );

      if (response.ok) {
        setIsEditing(false);

        // После сохранения снова создаём QR
        generateQRCode();

        Alert.alert('Успех', 'Контактные данные сохранены');

        onSave?.();
      } else {
        // Получаем реальную ошибку сервера
        let errorMessage = 'Ошибка сохранения';

        try {
          const errorData = await response.json();

          if (errorData?.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // Оставляем стандартное сообщение
        }

        throw new Error(
          `${errorMessage} (${response.status})`
        );
      }
    } catch (error) {
      console.error('Ошибка сохранения контактов:', error);

      Alert.alert(
        'Ошибка',
        'Не удалось сохранить контактные данные'
      );
    } finally {
      setLoading(false);
    }
  };

  // Создание изображения QR-кода
  const captureQRCode = async () => {
    if (!qrRef.current) {
      throw new Error('QR-код не найден');
    }

    // Ждём завершения рендера
    await waitForQRView();

    if (!qrRef.current) {
      throw new Error('QR-код исчез со страницы');
    }

    const uri = await captureRef(qrRef.current, {
      quality: 1,
      format: 'png',
      result: 'tmpfile',
    });

    return uri;
  };

  // Поделиться QR-кодом
  const shareQRCode = async () => {
    if (!qrData) {
      Alert.alert('Ошибка', 'QR-код ещё не создан');
      return;
    }

    if (!qrRef.current) {
      Alert.alert('Ошибка', 'QR-код не найден');
      return;
    }

    try {
      setSharing(true);

      const uri = await captureQRCode();

      console.log('📤 QR share URI:', uri);

      await Share.share({
        url: uri,
        message: `QR-код для поиска питомца ${
          pet?.name || 'питомца'
        }`,
      });
    } catch (error) {
      console.error('Ошибка шаринга:', error);

      Alert.alert(
        'Ошибка',
        'Не удалось поделиться QR-кодом'
      );
    } finally {
      setSharing(false);
    }
  };

  // Если pet нет
  if (!pet || !pet.id) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={onClose}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Ошибка</Text>

            <View style={{ width: 40 }} />
          </View>

          <View style={styles.content}>
            <Text
              style={{
                textAlign: 'center',
                marginTop: 50,
              }}
            >
              Данные питомца не загружены
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.title}>
            🔍 QR-код для {pet.name}
          </Text>

          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {isEditing ? (
            <View>
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>
                  📞 Контактные данные владельца
                </Text>

                <Text style={styles.infoSubtitle}>
                  Эти данные увидят люди, которые найдут вашего питомца
                </Text>

                <Text style={styles.label}>
                  Ваше имя (необязательно)
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Как к вам обращаться"
                  value={contactInfo.ownerName}
                  onChangeText={(text) =>
                    setContactInfo({
                      ...contactInfo,
                      ownerName: text,
                    })
                  }
                />

                <Text style={styles.label}>
                  Номер телефона
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="+7 (XXX) XXX-XX-XX"
                  keyboardType="phone-pad"
                  value={contactInfo.phone}
                  onChangeText={(text) =>
                    setContactInfo({
                      ...contactInfo,
                      phone: text,
                    })
                  }
                />

                <Text style={styles.label}>
                  Адрес проживания
                </Text>

                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                  ]}
                  placeholder="Город, улица, дом..."
                  multiline
                  numberOfLines={2}
                  value={contactInfo.address}
                  onChangeText={(text) =>
                    setContactInfo({
                      ...contactInfo,
                      address: text,
                    })
                  }
                />

                <Text style={styles.label}>
                  Дополнительная информация
                </Text>

                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                  ]}
                  placeholder="Особые приметы, медицинские особенности..."
                  multiline
                  numberOfLines={3}
                  value={contactInfo.additionalInfo}
                  onChangeText={(text) =>
                    setContactInfo({
                      ...contactInfo,
                      additionalInfo: text,
                    })
                  }
                />
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>
                  🐾 Информация о питомце
                </Text>

                <Text style={styles.infoSubtitle}>
                  Эти данные будут в QR-коде, чтобы помочь идентифицировать питомца
                </Text>

                <View style={styles.petInfoRow}>
                  <Text style={styles.petInfoLabel}>
                    Кличка:
                  </Text>

                  <Text style={styles.petInfoValue}>
                    {pet.name}
                  </Text>
                </View>

                <View style={styles.petInfoRow}>
                  <Text style={styles.petInfoLabel}>
                    Вид:
                  </Text>

                  <Text style={styles.petInfoValue}>
                    {pet.species === 'dog'
                      ? '🐶 Собака'
                      : '🐱 Кошка'}
                  </Text>
                </View>

                {pet.breed_name && (
                  <View style={styles.petInfoRow}>
                    <Text style={styles.petInfoLabel}>
                      Порода:
                    </Text>

                    <Text style={styles.petInfoValue}>
                      {pet.breed_name}
                    </Text>
                  </View>
                )}

                {pet.weight && pet.weight > 0 && (
                  <View style={styles.petInfoRow}>
                    <Text style={styles.petInfoLabel}>
                      Вес:
                    </Text>

                    <Text style={styles.petInfoValue}>
                      {pet.weight} кг
                    </Text>
                  </View>
                )}

                {pet.age && pet.age > 0 && (
                  <View style={styles.petInfoRow}>
                    <Text style={styles.petInfoLabel}>
                      Возраст:
                    </Text>

                    <Text style={styles.petInfoValue}>
                      {pet.age} лет
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.generateButton}
                onPress={saveContactInfo}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.generateButtonText}>
                    Создать QR-код →
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {/* QR-код */}
              <View style={styles.qrContainer}>
                <View
                  ref={qrRef}
                  collapsable={false}
                  style={styles.qrCaptureContainer}
                >
                  {qrData && (
                    <QRCode
                      value={JSON.stringify(qrData)}
                      size={250}
                      color="#2F4F4F"
                      backgroundColor="white"
                    />
                  )}
                </View>
              </View>

              <View style={styles.instructionsCard}>
                <Text style={styles.instructionsTitle}>
                  📋 Как использовать:
                </Text>

                <Text style={styles.instructionsText}>
                  1. Поделитесь QR-кодом с собой или распечатайте его{'\n'}
                  2. Прикрепите QR-код к ошейнику питомца{'\n'}
                  3. Если питомец потеряется, человек сможет отсканировать QR-код{'\n'}
                  4. После сканирования откроется страница с информацией и контактами владельца
                </Text>
              </View>

              {/* Только кнопка "Поделиться" */}
              <TouchableOpacity
                style={[
                  styles.shareButton,
                  sharing && styles.disabledButton,
                ]}
                onPress={shareQRCode}
                disabled={sharing}
              >
                {sharing ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color="#2F4F4F" />

                    <Text style={styles.actionButtonText}>
                      Подготовка...
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.actionButtonText}>
                    📤 Поделиться QR-кодом
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editContactButton}
                onPress={() => setIsEditing(true)}
              >
                <Text style={styles.editContactButtonText}>
                  ✏️ Редактировать контакты
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F0EC',
  },

  closeButton: {
    padding: 8,
  },

  closeButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#7A8F88',
  },

  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2F4F4F',
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2F4F4F',
    marginBottom: 4,
  },

  infoSubtitle: {
    fontSize: 12,
    color: '#7A8F88',
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2F4F4F',
    marginBottom: 6,
    marginTop: 12,
  },

  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9FBFA',
  },

  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },

  petInfoRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F0EC',
  },

  petInfoLabel: {
    width: 100,
    fontSize: 14,
    color: '#7A8F88',
  },

  petInfoValue: {
    flex: 1,
    fontSize: 14,
    color: '#2F4F4F',
    fontWeight: '500',
  },

  generateButton: {
    backgroundColor: '#7BC9A8',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 20,
  },

  qrCaptureContainer: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  instructionsCard: {
    backgroundColor: '#E8F0EC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },

  instructionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2F4F4F',
    marginBottom: 8,
  },

  instructionsText: {
    fontSize: 13,
    color: '#7A8F88',
    lineHeight: 22,
  },

  shareButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F0EC',
    marginBottom: 16,
  },

  disabledButton: {
    opacity: 0.6,
  },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2F4F4F',
  },

  editContactButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },

  editContactButtonText: {
    color: '#7BC9A8',
    fontSize: 14,
    fontWeight: '500',
  },
});
