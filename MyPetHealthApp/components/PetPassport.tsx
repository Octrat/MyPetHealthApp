// components/PetPassport.tsx
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../src/config/api';

interface PetPassportProps {
  visible: boolean;
  pet: {
    id: number;
    name: string;
  } | null;
  onClose: () => void;
  onSave: () => void;
}

interface PassportData {
  number: string;
  issued_by: string;
  issued_date: string;
  chip_number: string;
  chip_location: string;
  chip_date: string;
  color: string;
  character: string;
  breeding_place: string;
  owner_name: string;
  owner_phone: string;
  status: 'pending' | 'approved' | 'rejected';
  review_comment?: string;
}

// Функция форматирования даты ГГГГ-ММ-ДД
const formatDate = (text: string) => {
  let cleaned = text.replace(/\D/g, '');
  cleaned = cleaned.slice(0, 8);
  if (cleaned.length <= 4) return cleaned;
  let formatted = cleaned.slice(0, 4);
  if (cleaned.length >= 5) {
    formatted += '-' + cleaned.slice(4, 6);
  }
  if (cleaned.length >= 7) {
    formatted += '-' + cleaned.slice(6, 8);
  }
  return formatted;
};

// Валидация даты
const isValidDate = (dateStr: string) => {
  if (!dateStr) return true;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

export default function PetPassport({ visible, pet, onClose, onSave }: PetPassportProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [passport, setPassport] = useState<PassportData>({
    number: '',
    issued_by: '',
    issued_date: '',
    chip_number: '',
    chip_location: '',
    chip_date: '',
    color: '',
    character: '',
    breeding_place: '',
    owner_name: '',
    owner_phone: '',
    status: 'pending',
    review_comment: '',
  });
  const [isEditing, setIsEditing] = useState(true);
  const hasRequiredFields = passport.number || passport.chip_number || passport.breeding_place;

  useEffect(() => {
    if (visible && pet && pet.id) {
      loadPassport();
    }
  }, [visible, pet]);

  const loadPassport = async () => {
    if (!pet || !pet.id) return;
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${BASE_URL}/api/pets/${pet.id}/passport`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && data) {
        setPassport({
          number: data.number || '',
          issued_by: data.issued_by || '',
          issued_date: data.issued_date || '',
          chip_number: data.chip_number || '',
          chip_location: data.chip_location || '',
          chip_date: data.chip_date || '',
          color: data.color || '',
          character: data.character || '',
          breeding_place: data.breeding_place || '',
          owner_name: data.owner_name || '',
          owner_phone: data.owner_phone || '',
          status: data.status || 'pending',
          review_comment: data.review_comment || '',
        });
        setIsEditing(data.status === 'pending' || !data.number);
      }
    } catch (error) {
      console.error('Ошибка загрузки паспорта:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitPassport = async () => {
    if (!pet || !pet.id) return;
    
    if (passport.issued_date && !isValidDate(passport.issued_date)) {
      Alert.alert('Ошибка', 'Неверный формат даты выдачи');
      return;
    }
    if (passport.chip_date && !isValidDate(passport.chip_date)) {
      Alert.alert('Ошибка', 'Неверный формат даты чипирования');
      return;
    }
    
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${BASE_URL}/api/pets/${pet.id}/passport`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(passport),
      });

      if (response.ok) {
        Alert.alert('Успех', 'Данные паспорта отправлены на проверку');
        setIsEditing(false);
        onSave();
        onClose();
      } else {
        throw new Error('Ошибка сохранения');
      }
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось сохранить паспорт');
    } finally {
      setSaving(false);
    }
  };

  const savePassport = () => {
    if (!hasRequiredFields) {
      Alert.alert(
        'Рекомендуется заполнить',
        'Для оформления паспорта рекомендуется заполнить хотя бы одно поле',
        [
          { text: 'Отмена', onPress: onClose },
          { text: 'Продолжить', onPress: submitPassport },
        ]
      );
      return;
    }
    submitPassport();
  };

  const getStatusText = () => {
    switch (passport.status) {
      case 'approved': return '✅ Одобрено';
      case 'rejected': return '❌ Отклонено';
      default: return '⏳ На проверке';
    }
  };

  const getStatusColor = () => {
    switch (passport.status) {
      case 'approved': return '#4CAF50';
      case 'rejected': return '#F44336';
      default: return '#FF9800';
    }
  };

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
            <Text style={styles.errorText}>Данные питомца не загружены</Text>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  if (loading) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#7BC9A8" />
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>📋 Паспорт {pet.name}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {!isEditing && passport.status !== 'pending' && (
            <View style={[styles.statusCard, { backgroundColor: getStatusColor() + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor() }]}>{getStatusText()}</Text>
              {passport.review_comment && (
                <Text style={styles.reviewComment}>Комментарий: {passport.review_comment}</Text>
              )}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📌 Основная информация</Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Номер паспорта</Text>
              <Text style={styles.optionalBadge}>необязательно</Text>
            </View>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              placeholder="Например: РК 123456"
              value={passport.number}
              onChangeText={(text) => setPassport({ ...passport, number: text })}
              editable={isEditing}
            />

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Кем выдан</Text>
              <Text style={styles.optionalBadge}>необязательно</Text>
            </View>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              placeholder="Название организации"
              value={passport.issued_by}
              onChangeText={(text) => setPassport({ ...passport, issued_by: text })}
              editable={isEditing}
            />

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Дата выдачи</Text>
              <Text style={styles.optionalBadge}>необязательно</Text>
              <Text style={styles.dateHint}>(ГГГГ-ММ-ДД)</Text>
            </View>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              placeholder="2024-05-15"
              value={passport.issued_date}
              onChangeText={(text) => {
                const formatted = formatDate(text);
                setPassport({ ...passport, issued_date: formatted });
              }}
              editable={isEditing}
              maxLength={10}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔍 Чипирование</Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Номер чипа</Text>
              <Text style={styles.optionalBadge}>необязательно</Text>
            </View>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              placeholder="15-значный номер"
              value={passport.chip_number}
              onChangeText={(text) => setPassport({ ...passport, chip_number: text })}
              editable={isEditing}
              keyboardType="numeric"
              maxLength={15}
            />

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Место чипирования</Text>
              <Text style={styles.optionalBadge}>необязательно</Text>
            </View>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              placeholder="Ветеринарная клиника"
              value={passport.chip_location}
              onChangeText={(text) => setPassport({ ...passport, chip_location: text })}
              editable={isEditing}
            />

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Дата чипирования</Text>
              <Text style={styles.optionalBadge}>необязательно</Text>
              <Text style={styles.dateHint}>(ГГГГ-ММ-ДД)</Text>
            </View>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              placeholder="2024-05-15"
              value={passport.chip_date}
              onChangeText={(text) => {
                const formatted = formatDate(text);
                setPassport({ ...passport, chip_date: formatted });
              }}
              editable={isEditing}
              maxLength={10}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎨 Внешность и характер</Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Окрас</Text>
              <Text style={styles.optionalBadge}>необязательно</Text>
            </View>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              placeholder="Например: Рыжий с белыми пятнами"
              value={passport.color}
              onChangeText={(text) => setPassport({ ...passport, color: text })}
              editable={isEditing}
            />

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Характер</Text>
              <Text style={styles.optionalBadge}>необязательно</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea, !isEditing && styles.disabledInput]}
              placeholder="Особенности характера"
              value={passport.character}
              onChangeText={(text) => setPassport({ ...passport, character: text })}
              multiline
              numberOfLines={3}
              editable={isEditing}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏠 Происхождение</Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Место рождения</Text>
              <Text style={styles.optionalBadge}>необязательно</Text>
            </View>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              placeholder="Питомник или город"
              value={passport.breeding_place}
              onChangeText={(text) => setPassport({ ...passport, breeding_place: text })}
              editable={isEditing}
            />

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Имя владельца</Text>
              <Text style={styles.optionalBadge}>необязательно</Text>
            </View>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              placeholder="Ваше полное имя"
              value={passport.owner_name}
              onChangeText={(text) => setPassport({ ...passport, owner_name: text })}
              editable={isEditing}
            />

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Телефон владельца</Text>
              <Text style={styles.optionalBadge}>необязательно</Text>
            </View>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              placeholder="+7 (XXX) XXX-XX-XX"
              value={passport.owner_phone}
              onChangeText={(text) => setPassport({ ...passport, owner_phone: text })}
              editable={isEditing}
              keyboardType="phone-pad"
            />
          </View>

          {isEditing && (
            <TouchableOpacity style={styles.saveButton} onPress={savePassport} disabled={saving}>
              <Text style={styles.saveButtonText}>
                {saving ? 'Отправка...' : '📤 Отправить на проверку'}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F9F7' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  errorText: { textAlign: 'center', marginTop: 50, color: '#7A8F88', fontSize: 16 },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2F4F4F',
    marginBottom: 12,
  },
  fieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 12,
    marginBottom: 6,
  },
  label: { fontSize: 14, fontWeight: '600', color: '#2F4F4F' },
  optionalBadge: {
    fontSize: 11,
    color: '#A0B8B0',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  dateHint: { fontSize: 10, color: '#A0B8B0', marginLeft: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9FBFA',
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  disabledInput: { backgroundColor: '#F0F0F0', color: '#7A8F88' },
  saveButton: {
    backgroundColor: '#7BC9A8',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  statusCard: { borderRadius: 16, padding: 16, marginBottom: 16, alignItems: 'center' },
  statusText: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  reviewComment: { fontSize: 14, color: '#7A8F88', textAlign: 'center' },
});