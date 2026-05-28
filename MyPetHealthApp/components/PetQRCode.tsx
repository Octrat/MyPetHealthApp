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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
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

export default function PetQRCode({ visible, pet, onClose, onSave }: PetQRCodeProps) {
  const [qrData, setQrData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    phone: '',
    address: '',
    additionalInfo: '',
    ownerName: '',
  });
  const [isEditing, setIsEditing] = useState(true);
  const qrRef = useRef<any>(null);

  // Проверка наличия pet
  useEffect(() => {
    if (visible && (!pet || !pet.id)) {
      Alert.alert('Ошибка', 'Данные питомца не загружены');
      onClose();
    }
  }, [visible, pet]);

  // Загрузка сохранённых контактов при открытии
  useEffect(() => {
    if (visible && pet && pet.id) {
      loadContactInfo();
    }
  }, [visible, pet]);

  const loadContactInfo = async () => {
    if (!pet) return;
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${BASE_URL}/api/pets/${pet.id}/qr-info`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && data) {
        setContactInfo({
          phone: data.phone || '',
          address: data.address || '',
          additionalInfo: data.additionalInfo || '',
          ownerName: data.ownerName || '',
        });
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Ошибка загрузки контактов:', error);
    }
  };

  const saveContactInfo = async () => {
    if (!pet) return;
    
    if (!contactInfo.phone && !contactInfo.address && !contactInfo.ownerName) {
      Alert.alert(
        'Внимание',
        'Вы не заполнили контактные данные. Люди не смогут связаться с вами, если найдут питомца.\n\nЖелаете продолжить?',
        [
          { text: 'Заполнить данные', style: 'cancel' },
          { 
            text: 'Всё равно продолжить', 
            onPress: () => {
              setIsEditing(false);
              generateQRCode();
            }
          },
        ]
      );
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${BASE_URL}/api/pets/${pet.id}/qr-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(contactInfo),
      });

      if (response.ok) {
        setIsEditing(false);
        generateQRCode();
        Alert.alert('Успех', 'Контактные данные сохранены');
        onSave?.();
      } else {
        throw new Error('Ошибка сохранения');
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить контактные данные');
    } finally {
      setLoading(false);
    }
  };
  const generateQRCode = () => {
    if (!pet) return;
    // Ссылка на веб-страницу для поиска питомца
    const qrPayload = `http://192.168.0.29:3001/pet-location.html?id=${pet.id}`;
    setQrData(qrPayload);
  };

  // Сохранение QR-кода в галерею
  const saveQRToGallery = async () => {
    if (!qrRef.current) {
      Alert.alert('Ошибка', 'QR-код не найден');
      return;
    }

    try {
      // Запрашиваем разрешение на сохранение
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Нужно разрешение для сохранения изображений');
        return;
      }

      setSaving(true);
      
      // Делаем скриншот QR-кода
      const uri = await captureRef(qrRef.current, {
        quality: 1,
        format: 'png',
        result: 'tmpfile',
      });
      
      // Сохраняем в галерею
      await MediaLibrary.saveToLibraryAsync(uri);
      
      Alert.alert('Готово!', 'QR-код сохранён в галерею. Теперь его можно распечатать.');
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить QR-код');
    } finally {
      setSaving(false);
    }
  };

  // Поделиться QR-кодом как изображением
  const shareQRCode = async () => {
    if (!qrRef.current) {
      Alert.alert('Ошибка', 'QR-код не найден');
      return;
    }

    try {
      setSaving(true);
      
      // Делаем скриншот QR-кода
      const uri = await captureRef(qrRef.current, {
        quality: 1,
        format: 'png',
        result: 'tmpfile',
      });
      
      // Делимся изображением
      await Share.share({
        url: uri,
        message: `QR-код для поиска питомца ${pet?.name || 'питомца'}`,
      });
    } catch (error) {
      console.error('Ошибка шаринга:', error);
      Alert.alert('Ошибка', 'Не удалось поделиться');
    } finally {
      setSaving(false);
    }
  };

  // Если pet нет, показываем пустой модал
  if (!pet || !pet.id) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Ошибка</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.content}>
            <Text style={{ textAlign: 'center', marginTop: 50 }}>
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
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>🔍 QR-код для {pet.name}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {isEditing ? (
            <View>
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>📞 Контактные данные владельца</Text>
                <Text style={styles.infoSubtitle}>
                  Эти данные увидят люди, которые найдут вашего питомца
                </Text>

                <Text style={styles.label}>Ваше имя (необязательно)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Как к вам обращаться"
                  value={contactInfo.ownerName}
                  onChangeText={(text) => setContactInfo({...contactInfo, ownerName: text})}
                />

                <Text style={styles.label}>Номер телефона</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+7 (XXX) XXX-XX-XX"
                  keyboardType="phone-pad"
                  value={contactInfo.phone}
                  onChangeText={(text) => setContactInfo({...contactInfo, phone: text})}
                />

                <Text style={styles.label}>Адрес проживания</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Город, улица, дом..."
                  multiline
                  numberOfLines={2}
                  value={contactInfo.address}
                  onChangeText={(text) => setContactInfo({...contactInfo, address: text})}
                />

                <Text style={styles.label}>Дополнительная информация</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Особые приметы, медицинские особенности..."
                  multiline
                  numberOfLines={3}
                  value={contactInfo.additionalInfo}
                  onChangeText={(text) => setContactInfo({...contactInfo, additionalInfo: text})}
                />
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>🐾 Информация о питомце</Text>
                <Text style={styles.infoSubtitle}>
                  Эти данные будут в QR-коде, чтобы помочь идентифицировать питомца
                </Text>

                <View style={styles.petInfoRow}>
                  <Text style={styles.petInfoLabel}>Кличка:</Text>
                  <Text style={styles.petInfoValue}>{pet.name}</Text>
                </View>
                <View style={styles.petInfoRow}>
                  <Text style={styles.petInfoLabel}>Вид:</Text>
                  <Text style={styles.petInfoValue}>{pet.species === 'dog' ? '🐶 Собака' : '🐱 Кошка'}</Text>
                </View>
                {pet.breed_name && (
                  <View style={styles.petInfoRow}>
                    <Text style={styles.petInfoLabel}>Порода:</Text>
                    <Text style={styles.petInfoValue}>{pet.breed_name}</Text>
                  </View>
                )}
                {pet.weight && pet.weight > 0 && (
                  <View style={styles.petInfoRow}>
                    <Text style={styles.petInfoLabel}>Вес:</Text>
                    <Text style={styles.petInfoValue}>{pet.weight} кг</Text>
                  </View>
                )}
                {pet.age && pet.age > 0 && (
                  <View style={styles.petInfoRow}>
                    <Text style={styles.petInfoLabel}>Возраст:</Text>
                    <Text style={styles.petInfoValue}>{pet.age} лет</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.generateButton}
                onPress={saveContactInfo}
                disabled={loading}
              >
                <Text style={styles.generateButtonText}>
                  {loading ? 'Сохранение...' : 'Создать QR-код →'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View style={styles.qrContainer} collapsable={false}>
                <View ref={qrRef}>
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
                <Text style={styles.instructionsTitle}>📋 Инструкция:</Text>
                <Text style={styles.instructionsText}>
                  1. Сохраните QR-код в галерею\n
                  2. Распечатайте его на самоклеющейся бумаге\n
                  3. Прикрепите к ошейнику питомца\n
                  4. Если питомец потеряется, сканирование QR-кода покажет ваши контакты
                </Text>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.saveButton]}
                  onPress={saveQRToGallery}
                  disabled={saving}
                >
                  <Text style={styles.actionButtonText}>
                    {saving ? 'Сохранение...' : '💾 Сохранить в галерею'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.shareButton]}
                  onPress={shareQRCode}
                  disabled={saving}
                >
                  <Text style={styles.actionButtonText}>
                    {saving ? 'Подготовка...' : '📤 Поделиться'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.editContactButton}
                onPress={() => setIsEditing(true)}
              >
                <Text style={styles.editContactButtonText}>✏️ Редактировать контакты</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F9F7' },
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
  closeButton: { padding: 8 },
  closeButtonText: { fontSize: 20, fontWeight: '600', color: '#7A8F88' },
  title: { fontSize: 18, fontWeight: '700', color: '#2F4F4F' },
  content: { padding: 16, paddingBottom: 40 },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: { fontSize: 16, fontWeight: '700', color: '#2F4F4F', marginBottom: 4 },
  infoSubtitle: { fontSize: 12, color: '#7A8F88', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#2F4F4F', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9FBFA',
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  petInfoRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#E8F0EC' },
  petInfoLabel: { width: 100, fontSize: 14, color: '#7A8F88' },
  petInfoValue: { flex: 1, fontSize: 14, color: '#2F4F4F', fontWeight: '500' },
  generateButton: {
    backgroundColor: '#7BC9A8',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  generateButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  qrContainer: { alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#FFFFFF', borderRadius: 20, marginBottom: 20 },
  instructionsCard: { backgroundColor: '#E8F0EC', borderRadius: 16, padding: 16, marginBottom: 20 },
  instructionsTitle: { fontSize: 14, fontWeight: '700', color: '#2F4F4F', marginBottom: 8 },
  instructionsText: { fontSize: 13, color: '#7A8F88', lineHeight: 22 },
  actionButtons: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  actionButton: { flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  saveButton: { backgroundColor: '#7BC9A8' },
  shareButton: { backgroundColor: '#E8F0EC' },
  actionButtonText: { fontSize: 14, fontWeight: '600', color: '#2F4F4F' },
  editContactButton: { alignItems: 'center', paddingVertical: 12 },
  editContactButtonText: { color: '#7BC9A8', fontSize: 14, fontWeight: '500' },
});