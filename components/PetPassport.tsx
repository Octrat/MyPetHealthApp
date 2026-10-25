
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

type PassportStatus = 'pending' | 'approved' | 'rejected';

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
  status: PassportStatus | '';
  review_comment: string;
}

const EMPTY_PASSPORT: PassportData = {
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
  status: '',
  review_comment: '',
};

// ===============================
// Форматирование даты
// ===============================

const formatDate = (text: string) => {
  let cleaned = text.replace(/\D/g, '');
  cleaned = cleaned.slice(0, 8);

  if (cleaned.length <= 4) {
    return cleaned;
  }

  let formatted = cleaned.slice(0, 4);

  if (cleaned.length >= 5) {
    formatted += '-' + cleaned.slice(4, 6);
  }

  if (cleaned.length >= 7) {
    formatted += '-' + cleaned.slice(6, 8);
  }

  return formatted;
};

// ===============================
// Проверка даты
// ===============================

const isValidDate = (dateStr: string) => {
  if (!dateStr) {
    return true;
  }

  const regex = /^\d{4}-\d{2}-\d{2}$/;

  if (!regex.test(dateStr)) {
    return false;
  }

  const [year, month, day] = dateStr.split('-').map(Number);

  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

export default function PetPassport({
  visible,
  pet,
  onClose,
  onSave,
}: PetPassportProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [passport, setPassport] =
    useState<PassportData>(EMPTY_PASSPORT);

  const [isEditing, setIsEditing] = useState(true);

  // ===============================
  // Загрузка паспорта
  // ===============================

  useEffect(() => {
    if (visible && pet?.id) {
      loadPassport();
    }

    if (!visible) {
      setPassport(EMPTY_PASSPORT);
      setIsEditing(true);
    }
  }, [visible, pet?.id]);

  const loadPassport = async () => {
    if (!pet?.id) {
      return;
    }

    setLoading(true);

    // Перед загрузкой нового питомца полностью очищаем старые данные
    setPassport(EMPTY_PASSPORT);
    setIsEditing(true);

    try {
      const token = await AsyncStorage.getItem('userToken');

      if (!token) {
        Alert.alert(
          'Ошибка',
          'Не найден токен авторизации. Пожалуйста, войдите в аккаунт заново.'
        );
        return;
      }

      const response = await fetch(
        `${BASE_URL}/api/pets/${pet.id}/passport`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      console.log('Passport GET:', data);

      if (!response.ok) {
        throw new Error(
          data?.message || 'Не удалось загрузить паспорт'
        );
      }

      // ==========================================
      // Сервер возвращает:
      //
      // passport_number
      // passport_issued_by
      // passport_issued_date
      // ...
      //
      // Поэтому преобразуем данные
      // в формат компонента.
      // ==========================================

      const hasPassportData =
        data &&
        (
          data.passport_number ||
          data.passport_issued_by ||
          data.passport_issued_date ||
          data.passport_chip_number ||
          data.passport_chip_location ||
          data.passport_chip_date ||
          data.passport_color ||
          data.passport_character ||
          data.passport_breeding_place ||
          data.passport_owner_name ||
          data.passport_owner_phone
        );

      // ==========================================
      // НОВЫЙ / НЕ ОТПРАВЛЕННЫЙ ПАСПОРТ
      // ==========================================

      if (!hasPassportData) {
        console.log('Паспорт пока не заполнен');

        setPassport(EMPTY_PASSPORT);

        // Новый паспорт можно редактировать
        setIsEditing(true);

        return;
      }

      // ==========================================
      // Существующий паспорт
      // ==========================================

      const status: PassportStatus | '' =
        data.passport_status === 'pending' ||
        data.passport_status === 'approved' ||
        data.passport_status === 'rejected'
          ? data.passport_status
          : '';

      const loadedPassport: PassportData = {
        number: data.passport_number || '',
        issued_by: data.passport_issued_by || '',
        issued_date: data.passport_issued_date
          ? String(data.passport_issued_date).slice(0, 10)
          : '',
        chip_number: data.passport_chip_number || '',
        chip_location: data.passport_chip_location || '',
        chip_date: data.passport_chip_date
          ? String(data.passport_chip_date).slice(0, 10)
          : '',
        color: data.passport_color || '',
        character: data.passport_character || '',
        breeding_place: data.passport_breeding_place || '',
        owner_name: data.passport_owner_name || '',
        owner_phone: data.passport_owner_phone || '',
        status,
        review_comment: data.passport_review_comment || '',
      };

      setPassport(loadedPassport);

      // ==========================================
      // ЛОГИКА РЕДАКТИРОВАНИЯ
      // ==========================================
      //
      // Не отправлено → можно редактировать
      // pending → нельзя
      // approved → нельзя
      // rejected → можно
      //

      if (!status) {
        setIsEditing(true);
      } else if (status === 'rejected') {
        setIsEditing(true);
      } else {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Ошибка загрузки паспорта:', error);

      Alert.alert(
        'Ошибка',
        error instanceof Error
          ? error.message
          : 'Не удалось загрузить паспорт'
      );
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // Изменение поля
  // ===============================

  const updateField = (
    field: keyof PassportData,
    value: string
  ) => {
    setPassport((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ===============================
  // Отправка паспорта
  // ===============================

  const submitPassport = async () => {
    if (!pet?.id) {
      return;
    }

    // Нельзя отправлять уже проверенный паспорт
    if (
      passport.status === 'pending' ||
      passport.status === 'approved'
    ) {
      Alert.alert(
        'Паспорт нельзя изменить',
        passport.status === 'pending'
          ? 'Паспорт уже находится на проверке.'
          : 'Паспорт уже принят администратором.'
      );

      return;
    }

    // Проверяем дату выдачи

    if (
      passport.issued_date &&
      !isValidDate(passport.issued_date)
    ) {
      Alert.alert(
        'Ошибка',
        'Неверная дата выдачи.\nИспользуйте формат ГГГГ-ММ-ДД.'
      );

      return;
    }

    // Проверяем дату чипирования

    if (
      passport.chip_date &&
      !isValidDate(passport.chip_date)
    ) {
      Alert.alert(
        'Ошибка',
        'Неверная дата чипирования.\nИспользуйте формат ГГГГ-ММ-ДД.'
      );

      return;
    }

    setSaving(true);

    try {
      const token = await AsyncStorage.getItem('userToken');

      if (!token) {
        throw new Error(
          'Не найден токен авторизации'
        );
      }

      // ==========================================
      // Отправляем именно те названия полей,
      // которые ожидает backend.
      // ==========================================

      const body = {
        number: passport.number.trim(),
        issued_by: passport.issued_by.trim(),
        issued_date: passport.issued_date || null,

        chip_number: passport.chip_number.trim(),
        chip_location: passport.chip_location.trim(),
        chip_date: passport.chip_date || null,

        color: passport.color.trim(),
        character: passport.character.trim(),

        breeding_place:
          passport.breeding_place.trim(),

        owner_name:
          passport.owner_name.trim(),

        owner_phone:
          passport.owner_phone.trim(),
      };

      console.log(
        'Отправка паспорта:',
        body
      );

      const response = await fetch(
        `${BASE_URL}/api/pets/${pet.id}/passport`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      console.log(
        'Passport POST response:',
        response.status,
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            'Не удалось сохранить паспорт'
        );
      }

      // После успешной отправки паспорт становится pending
      setPassport((prev) => ({
        ...prev,
        status: 'pending',
        review_comment: '',
      }));

      setIsEditing(false);

      Alert.alert(
        'Успешно',
        'Данные паспорта отправлены на рассмотрение администратору.',
        [
          {
            text: 'OK',
            onPress: () => {
              onSave();
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error(
        'Ошибка сохранения паспорта:',
        error
      );

      Alert.alert(
        'Ошибка',
        error instanceof Error
          ? error.message
          : 'Не удалось сохранить паспорт'
      );
    } finally {
      setSaving(false);
    }
  };

  // ===============================
  // Кнопка сохранения
  // ===============================

  const savePassport = () => {
    const hasRequiredFields =
      passport.number.trim() ||
      passport.chip_number.trim() ||
      passport.breeding_place.trim();

    if (!hasRequiredFields) {
      Alert.alert(
        'Паспорт пустой',
        'Вы можете отправить паспорт даже без заполненных полей, но рекомендуется указать хотя бы номер паспорта, номер чипа или место рождения.',
        [
          {
            text: 'Отмена',
            style: 'cancel',
          },
          {
            text: 'Отправить',
            onPress: submitPassport,
          },
        ]
      );

      return;
    }

    submitPassport();
  };

  // ===============================
  // Статус
  // ===============================

  const getStatusText = () => {
    switch (passport.status) {
      case 'approved':
        return '✅ Принято';

      case 'rejected':
        return '❌ Отклонено';

      case 'pending':
        return '⏳ Отправлено на рассмотрение';

      default:
        return '📝 Не отправлено';
    }
  };

  const getStatusColor = () => {
    switch (passport.status) {
      case 'approved':
        return '#4CAF50';

      case 'rejected':
        return '#F44336';

      case 'pending':
        return '#FF9800';

      default:
        return '#7BC9A8';
    }
  };

  // ===============================
  // Проверка питомца
  // ===============================

  if (!pet?.id) {
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
              <Text style={styles.closeButtonText}>
                ✕
              </Text>
            </TouchableOpacity>

            <Text style={styles.title}>
              Ошибка
            </Text>

            <View style={{ width: 40 }} />
          </View>

          <View style={styles.content}>
            <Text style={styles.errorText}>
              Данные питомца не загружены
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  // ===============================
  // Загрузка
  // ===============================

  if (loading) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={onClose}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.loaderContainer}>
            <ActivityIndicator
              size="large"
              color="#7BC9A8"
            />

            <Text style={styles.loadingText}>
              Загружаем паспорт...
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  // ===============================
  // Основной экран
  // ===============================

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* HEADER */}

        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>
              ✕
            </Text>
          </TouchableOpacity>

          <Text
            style={styles.title}
            numberOfLines={1}
          >
            📋 Паспорт {pet.name}
          </Text>

          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* ===============================
              СТАТУС ОБРАЩЕНИЯ
          =============================== */}

          <View
            style={[
              styles.statusCard,
              {
                backgroundColor:
                  getStatusColor() + '20',
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color: getStatusColor(),
                },
              ]}
            >
              {getStatusText()}
            </Text>

            {/* НЕ ОТПРАВЛЕНО */}

            {!passport.status && (
              <Text style={styles.statusDescription}>
                Паспорт ещё не отправлен на рассмотрение.
                Заполните необходимые данные и отправьте
                их администратору на проверку.
              </Text>
            )}

            {/* ОТПРАВЛЕНО НА РАССМОТРЕНИЕ */}

            {passport.status === 'pending' && (
              <Text style={styles.statusDescription}>
                Данные отправлены администратору.
                После проверки паспорт будет принят
                или отклонён с указанием причины.
              </Text>
            )}

            {/* ОТКЛОНЕНО */}

            {passport.status === 'rejected' && (
              <Text style={styles.statusDescription}>
                Паспорт был отклонён администратором.
                Исправьте данные с учётом комментария
                и отправьте паспорт повторно.
              </Text>
            )}

            {/* ПРИНЯТО */}

            {passport.status === 'approved' && (
              <Text style={styles.statusDescription}>
                Паспорт проверен и принят администратором.
                Данные паспорта подтверждены.
              </Text>
            )}

            {/* КОММЕНТАРИЙ АДМИНИСТРАТОРА */}

            {passport.review_comment && (
              <View style={styles.commentContainer}>
                <Text style={styles.commentTitle}>
                  Комментарий администратора:
                </Text>

                <Text style={styles.reviewComment}>
                  {passport.review_comment}
                </Text>
              </View>
            )}
          </View>

          {/* ===============================
              ОСНОВНАЯ ИНФОРМАЦИЯ
          =============================== */}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              📌 Основная информация
            </Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Номер паспорта
              </Text>

              <Text style={styles.optionalBadge}>
                необязательно
              </Text>
            </View>

            <TextInput
              style={[
                styles.input,
                !isEditing &&
                  styles.disabledInput,
              ]}
              placeholder="Например: РК 123456"
              value={passport.number}
              onChangeText={(text) =>
                updateField('number', text)
              }
              editable={isEditing}
            />

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Кем выдан
              </Text>

              <Text style={styles.optionalBadge}>
                необязательно
              </Text>
            </View>

            <TextInput
              style={[
                styles.input,
                !isEditing &&
                  styles.disabledInput,
              ]}
              placeholder="Название организации"
              value={passport.issued_by}
              onChangeText={(text) =>
                updateField(
                  'issued_by',
                  text
                )
              }
              editable={isEditing}
            />

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Дата выдачи
              </Text>

              <Text style={styles.optionalBadge}>
                необязательно
              </Text>

              <Text style={styles.dateHint}>
                (ГГГГ-ММ-ДД)
              </Text>
            </View>

            <TextInput
              style={[
                styles.input,
                !isEditing &&
                  styles.disabledInput,
              ]}
              placeholder="2024-05-15"
              value={passport.issued_date}
              onChangeText={(text) =>
                updateField(
                  'issued_date',
                  formatDate(text)
                )
              }
              editable={isEditing}
              maxLength={10}
              keyboardType="numeric"
            />
          </View>

          {/* ===============================
              ЧИПИРОВАНИЕ
          =============================== */}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              🔍 Чипирование
            </Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Номер чипа
              </Text>

              <Text style={styles.optionalBadge}>
                необязательно
              </Text>
            </View>

            <TextInput
              style={[
                styles.input,
                !isEditing &&
                  styles.disabledInput,
              ]}
              placeholder="15-значный номер"
              value={passport.chip_number}
              onChangeText={(text) =>
                updateField(
                  'chip_number',
                  text.replace(/\D/g, '').slice(0, 15)
                )
              }
              editable={isEditing}
              keyboardType="numeric"
              maxLength={15}
            />

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Место чипирования
              </Text>

              <Text style={styles.optionalBadge}>
                необязательно
              </Text>
            </View>

            <TextInput
              style={[
                styles.input,
                !isEditing &&
                  styles.disabledInput,
              ]}
              placeholder="Ветеринарная клиника"
              value={passport.chip_location}
              onChangeText={(text) =>
                updateField(
                  'chip_location',
                  text
                )
              }
              editable={isEditing}
            />

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Дата чипирования
              </Text>

              <Text style={styles.optionalBadge}>
                необязательно
              </Text>

              <Text style={styles.dateHint}>
                (ГГГГ-ММ-ДД)
              </Text>
            </View>

            <TextInput
              style={[
                styles.input,
                !isEditing &&
                  styles.disabledInput,
              ]}
              placeholder="2024-05-15"
              value={passport.chip_date}
              onChangeText={(text) =>
                updateField(
                  'chip_date',
                  formatDate(text)
                )
              }
              editable={isEditing}
              maxLength={10}
              keyboardType="numeric"
            />
          </View>

          {/* ===============================
              ВНЕШНОСТЬ
          =============================== */}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              🎨 Внешность и характер
            </Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Окрас
              </Text>

              <Text style={styles.optionalBadge}>
                необязательно
              </Text>
            </View>

            <TextInput
              style={[
                styles.input,
                !isEditing &&
                  styles.disabledInput,
              ]}
              placeholder="Например: Рыжий с белыми пятнами"
              value={passport.color}
              onChangeText={(text) =>
                updateField('color', text)
              }
              editable={isEditing}
            />

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Характер
              </Text>

              <Text style={styles.optionalBadge}>
                необязательно
              </Text>
            </View>

            <TextInput
              style={[
                styles.input,
                styles.textArea,
                !isEditing &&
                  styles.disabledInput,
              ]}
              placeholder="Особенности характера"
              value={passport.character}
              onChangeText={(text) =>
                updateField(
                  'character',
                  text
                )
              }
              multiline
              numberOfLines={3}
              editable={isEditing}
            />
          </View>

          {/* ===============================
              ПРОИСХОЖДЕНИЕ
          =============================== */}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              🏠 Происхождение
            </Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Место рождения
              </Text>

              <Text style={styles.optionalBadge}>
                необязательно
              </Text>
            </View>

            <TextInput
              style={[
                styles.input,
                !isEditing &&
                  styles.disabledInput,
              ]}
              placeholder="Питомник или город"
              value={passport.breeding_place}
              onChangeText={(text) =>
                updateField(
                  'breeding_place',
                  text
                )
              }
              editable={isEditing}
            />

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Имя владельца
              </Text>

              <Text style={styles.optionalBadge}>
                необязательно
              </Text>
            </View>

            <TextInput
              style={[
                styles.input,
                !isEditing &&
                  styles.disabledInput,
              ]}
              placeholder="Ваше полное имя"
              value={passport.owner_name}
              onChangeText={(text) =>
                updateField(
                  'owner_name',
                  text
                )
              }
              editable={isEditing}
            />

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Телефон владельца
              </Text>

              <Text style={styles.optionalBadge}>
                необязательно
              </Text>
            </View>

            <TextInput
              style={[
                styles.input,
                !isEditing &&
                  styles.disabledInput,
              ]}
              placeholder="+7 (XXX) XXX-XX-XX"
              value={passport.owner_phone}
              onChangeText={(text) =>
                updateField(
                  'owner_phone',
                  text
                )
              }
              editable={isEditing}
              keyboardType="phone-pad"
            />
          </View>

          {/* ===============================
              КНОПКА
          =============================== */}

          {isEditing && (
            <TouchableOpacity
              style={[
                styles.saveButton,
                saving &&
                  styles.saveButtonDisabled,
              ]}
              onPress={savePassport}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving
                  ? 'Отправка...'
                  : passport.status === 'rejected'
                  ? '📤 Отправить повторно'
                  : '📤 Отправить на проверку'}
              </Text>
            </TouchableOpacity>
          )}

          {/* ===============================
              ИНФОРМАЦИЯ ДЛЯ PENDING
          =============================== */}

          {passport.status === 'pending' &&
            !isEditing && (
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>
                  ⏳ Ожидается проверка
                </Text>

                <Text style={styles.infoText}>
                  Пока администратор проверяет
                  паспорт, изменить его данные
                  нельзя.
                </Text>
              </View>
            )}

          {/* ===============================
              ИНФОРМАЦИЯ ДЛЯ APPROVED
          =============================== */}

          {passport.status === 'approved' &&
            !isEditing && (
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>
                  ✅ Паспорт подтверждён
                </Text>

                <Text style={styles.infoText}>
                  Данные паспорта были проверены
                  и одобрены администратором.
                </Text>
              </View>
            )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F9F7',
  },

  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F9F7',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#7A8F88',
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
    width: 40,
    alignItems: 'center',
  },

  closeButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#7A8F88',
  },

  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#2F4F4F',
  },

  content: {
    padding: 16,
    paddingBottom: 50,
  },

  errorText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#7A8F88',
    fontSize: 16,
  },

  // ===============================
  // STATUS
  // ===============================

  statusCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },

  statusText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },

  statusDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#5F716B',
    textAlign: 'center',
  },

  commentContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#DDE8E3',
    width: '100%',
  },

  commentTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2F4F4F',
    marginBottom: 4,
    textAlign: 'center',
  },

  reviewComment: {
    fontSize: 14,
    color: '#5F716B',
    textAlign: 'center',
    lineHeight: 20,
  },

  // ===============================
  // SECTION
  // ===============================

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

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2F4F4F',
  },

  optionalBadge: {
    fontSize: 11,
    color: '#A0B8B0',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },

  dateHint: {
    fontSize: 10,
    color: '#A0B8B0',
    marginLeft: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9FBFA',
    color: '#2F4F4F',
  },

  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },

  disabledInput: {
    backgroundColor: '#F0F0F0',
    color: '#7A8F88',
  },

  // ===============================
  // SAVE
  // ===============================

  saveButton: {
    backgroundColor: '#7BC9A8',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 10,
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // ===============================
  // INFO
  // ===============================

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
  },

  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2F4F4F',
    marginBottom: 6,
    textAlign: 'center',
  },

  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#7A8F88',
    textAlign: 'center',
  },
});