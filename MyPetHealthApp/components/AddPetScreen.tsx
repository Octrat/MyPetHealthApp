import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../src/hooks/AuthContext';
import { Pet } from '../src/types';
import { petsAPI } from '../src/services/api';
import { analyzePetHealthByCategory, SizeCategory } from '../src/utils/healthCheck';
import { AppScreen } from '../src/types/navigation';
import BreedRecognizer from './BreedRecognizer';
import BottomNav from './BottomNav';

const BASE_URL = 'http://192.168.0.29:3001';

type Breed = { 
  id: number; 
  name: string; 
  name_ru?: string;
};

interface AddPetScreenProps {
  onBack?: () => void;
  onNavigate?: (screen: AppScreen) => void;
}

export default function AddPetScreen({ onBack, onNavigate }: AddPetScreenProps) {
  const { user } = useAuth();

  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [showRecognizer, setShowRecognizer] = useState(false);
  const [editingPetId, setEditingPetId] = useState<number | null>(null);

  // Форма добавления/редактирования
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<'dog' | 'cat' | null>(null);
  const [breedQuery, setBreedQuery] = useState('');
  const [breedOptions, setBreedOptions] = useState<Breed[]>([]);
  const [selectedBreed, setSelectedBreed] = useState<Breed | null>(null);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<'male' | 'female' | null>(null);
  const [neutered, setNeutered] = useState(false);
  const [description, setDescription] = useState('');
  const [petPhoto, setPetPhoto] = useState<string | null>(null);

  // Загрузка списка питомцев
  useEffect(() => {
    const loadPets = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const data = await petsAPI.getPets(user.id);
        setPets(data);
      } catch (err: any) {
        Alert.alert('Ошибка', err.message);
      } finally {
        setLoading(false);
      }
    };

    loadPets();
  }, [user]);

  // Поиск пород
  useEffect(() => {
    const fetchBreeds = async () => {
      if (!species) return;
      try {
        const data = await petsAPI.getBreeds(species, breedQuery);
        setBreedOptions(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchBreeds();
  }, [species, breedQuery]);

  // Выбор фото
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Ошибка', 'Нужно разрешение для доступа к фотографиям');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setPetPhoto(result.assets[0].base64);
    }
  };

  // Сделать фото
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Ошибка', 'Нужно разрешение для доступа к камере');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setPetPhoto(result.assets[0].base64);
    }
  };

  // Показать меню выбора фото
  const showImagePickerOptions = () => {
    Alert.alert(
      'Фото питомца',
      'Выберите способ добавления фото',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Сделать фото', onPress: takePhoto },
        { text: 'Выбрать из галереи', onPress: pickImage },
      ],
      { cancelable: true }
    );
  };

  // Обработчик распознанной породы
  const handleBreedDetected = (detectedBreed: string) => {
    setBreedQuery(detectedBreed);
    setSelectedBreed(null);
    setShowRecognizer(false);
    Alert.alert(
      'Порода определена', 
      `Предполагаемая порода: ${detectedBreed}\n\nЕсли порода не точная, вы можете отредактировать её вручную.`,
      [{ text: 'OK' }]
    );
  };

  // Сброс формы
  const resetForm = () => {
    setName('');
    setSpecies(null);
    setBreedQuery('');
    setSelectedBreed(null);
    setWeight('');
    setHeight('');
    setAge('');
    setSex(null);
    setNeutered(false);
    setDescription('');
    setPetPhoto(null);
    setEditingPetId(null);
  };

  // Сохранение питомца
  const savePet = async () => {
    // Базовая проверка только для новых питомцев
    if (!editingPetId) {
      // Новая запись - проверяем все поля
      if (!name || !species || !selectedBreed || !weight || !height || !age || !sex) {
        Alert.alert('Ошибка', 'Заполните все поля');
        return;
      }
    } else {
      // Редактирование - проверяем только имя
      if (!name) {
        Alert.alert('Ошибка', 'Введите имя питомца');
        return;
      }
    }

    try {
      const photoData = petPhoto || undefined;

      if (editingPetId) {
        // Обновление существующего питомца
        await petsAPI.updatePet(
          editingPetId,
          name,
          species || 'dog',
          selectedBreed?.id || 1,
          weight ? Number(weight) : 0,
          height ? Number(height) : 0,
          age ? Number(age) : 0,
          sex || 'male',
          neutered,
          description,
          photoData
        );
        
        // Обновляем список питомцев
        const updatedPets = await petsAPI.getPets(user!.id);
        setPets(updatedPets);
        
        Alert.alert('Успех', `Данные питомца ${name} обновлены!`);
      } else {
        // Добавление нового питомца
        const newPet = await petsAPI.addPet(
          user!.id,
          name,
          species!,
          selectedBreed!.id,
          Number(weight),
          Number(height),
          Number(age),
          sex!,
          neutered,
          description,
          photoData
        );
        setPets(prev => [...prev, newPet]);
        Alert.alert('Успех', `Питомец ${name} сохранен!`);
      }

      setShowForm(false);
      resetForm();

    } catch (err: any) {
      console.error('Save error:', err);
      Alert.alert('Ошибка', err.message || 'Не удалось сохранить питомца');
    }
  };

  // Начало редактирования питомца
  const startEditPet = (pet: Pet) => {
    setEditingPetId(pet.id);
    setName(pet.name);
    setSpecies(pet.species as 'dog' | 'cat');
    setBreedQuery(pet.breed_name || '');
    setSelectedBreed(pet.breed_id ? { id: pet.breed_id, name: pet.breed_name || '' } : null);
    setWeight(pet.weight?.toString() || '');
    setHeight(pet.height?.toString() || '');
    setAge(pet.age?.toString() || '');
    setSex(pet.sex as 'male' | 'female' || null);
    setNeutered(pet.neutered || false);
    setDescription(pet.description || '');
    
    // Извлекаем base64 из photo_url, если там есть данные
    if (pet.photo_url) {
      let base64String = pet.photo_url;
      if (base64String.startsWith('data:image')) {
        base64String = base64String.split(',')[1];
      }
      setPetPhoto(base64String);
    } else {
      setPetPhoto(null);
    }
    
    setShowForm(true);
    setShowRecognizer(false);
  };

  // Удаление питомца
  const deletePet = (petId: number, petName: string) => {
    Alert.alert(
      'Удалить питомца',
      `Вы уверены, что хотите удалить ${petName}?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await petsAPI.deletePet(petId);
              setPets(prev => prev.filter(p => p.id !== petId));
              Alert.alert('Успех', 'Питомец удален');
            } catch (err: any) {
              Alert.alert('Ошибка', err.message);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Кнопка назад */}
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Назад</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.title}>🐾 Мои питомцы</Text>

        {!showForm && (
          <TouchableOpacity
            style={styles.addPetButton}
            onPress={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <Text style={styles.addPetButtonText}>➕ Добавить питомца</Text>
          </TouchableOpacity>
        )}

        {/* Форма добавления/редактирования */}
        {showForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              {editingPetId ? '✏️ Редактировать питомца' : '➕ Новый питомец'}
            </Text>

            {/* Фото питомца */}
            <TouchableOpacity onPress={showImagePickerOptions} style={styles.photoContainer}>
              {petPhoto ? (
                <Image 
                  source={{ uri: `data:image/jpeg;base64,${petPhoto}` }}
                  style={styles.petPhoto}
                />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderText}>📷</Text>
                  <Text style={styles.photoPlaceholderLabel}>Добавить фото</Text>
                </View>
              )}
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Имя *"
              value={name}
              onChangeText={setName}
            />

            {/* вид животного */}
            <Text style={styles.label}>Вид животного *</Text>
            <View style={styles.row}>
              <TouchableOpacity onPress={() => setSpecies('dog')}>
                <Text style={[styles.option, species === 'dog' && styles.active]}>🐶 Собака</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setSpecies('cat')}>
                <Text style={[styles.option, species === 'cat' && styles.active]}>🐱 Кошка</Text>
              </TouchableOpacity>
            </View>

            {/* пол */}
            <Text style={styles.label}>Пол *</Text>
            <View style={styles.row}>
              <TouchableOpacity onPress={() => setSex('male')}>
                <Text style={[styles.option, sex === 'male' && styles.active]}>♂ Муж</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setSex('female')}>
                <Text style={[styles.option, sex === 'female' && styles.active]}>♀ Жен</Text>
              </TouchableOpacity>
            </View>

            {/* стерилизация */}
            <Text style={styles.label}>Стерилизация:</Text>
            <TouchableOpacity
              style={[styles.option, neutered && styles.active]}
              onPress={() => setNeutered(!neutered)}
            >
              <Text>{neutered ? '✅ Да (кастрирован/стерилизован)' : '❌ Нет'}</Text>
            </TouchableOpacity>

            {/* порода с кнопкой распознавания */}
            {species && (
              <View>
                <Text style={styles.label}>Порода *</Text>
                <View style={styles.breedRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Введите или выберите породу"
                    value={breedQuery}
                    onChangeText={(text) => {
                      setBreedQuery(text);
                      setSelectedBreed(null);
                    }}
                  />

                  {/* Кнопка распознавания породы */}
                  <TouchableOpacity
                    style={styles.recognizeButton}
                    onPress={() => setShowRecognizer(true)}
                  >
                    <Text style={styles.recognizeButtonText}>🔍</Text>
                  </TouchableOpacity>

                  {breedQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        setBreedQuery('');
                        setSelectedBreed(null);
                        setBreedOptions([]);
                      }}
                      style={styles.clearButton}
                    >
                      <Text style={styles.clearButtonText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {breedOptions.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    style={styles.breedItem}
                    onPress={() => {
                      setSelectedBreed(b);
                      setBreedQuery(
                        b.name_ru && b.name
                          ? `${b.name_ru} (${b.name})`
                          : b.name
                      );
                      setBreedOptions([]);
                    }}
                  >
                    <Text>
                      {b.name_ru ? `${b.name_ru} (${b.name})` : b.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.label}>Вес (кг) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Вес (кг)"
              keyboardType="numeric"
              value={weight}
              onChangeText={setWeight}
            />

            <Text style={styles.label}>Рост (см) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Рост (см)"
              keyboardType="numeric"
              value={height}
              onChangeText={setHeight}
            />

            <Text style={styles.label}>Возраст (лет) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Возраст (лет)"
              keyboardType="numeric"
              value={age}
              onChangeText={setAge}
            />

            <Text style={styles.label}>Описание</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Расскажите о характере, привычках и особенностях питомца..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity style={styles.saveButton} onPress={savePet}>
              <Text style={styles.saveText}>
                {editingPetId ? '💾 Сохранить изменения' : '✅ Сохранить питомца'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => {
              setShowForm(false);
              resetForm();
            }}>
              <Text style={styles.cancel}>Отмена</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && <ActivityIndicator style={{ marginTop: 20 }} />}

        {/* список питомцев */}
        {pets.map((pet) => {
          const health = analyzePetHealthByCategory({
            sizeCategory: (pet.breed_size_category ?? 'medium') as SizeCategory,
            weight: pet.weight ?? 0,
            height: pet.height ?? 0,
            age: pet.age ?? 0,
            sex: pet.sex ?? 'male',
            neutered: pet.neutered ?? false,
          });

          return (
            <View key={pet.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.petHeaderLeft}>
                  {pet.photo_url ? (
                    <Image 
                      source={{ uri: pet.photo_url.startsWith('data:') 
                        ? pet.photo_url 
                        : `data:image/jpeg;base64,${pet.photo_url}`
                      }}
                      style={styles.cardPhoto}
                    />
                  ) : (
                    <View style={styles.cardPhotoPlaceholder}>
                      <Text>{pet.species === 'dog' ? '🐶' : '🐱'}</Text>
                    </View>
                  )}
                  <Text style={styles.petName}>{pet.name}</Text>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => startEditPet(pet)}
                  >
                    <Text style={styles.editButtonText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => deletePet(pet.id, pet.name)}
                  >
                    <Text style={styles.deleteButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.petInfo}>
                {pet.species === 'dog' ? '🐶 Собака' : '🐱 Кошка'}
              </Text>

              {/* Отображение породы */}
              {pet.breed_name && (
                <Text style={styles.petInfo}>
                  🐕 Порода: {pet.breed_name}
                  {pet.breed_name_ru ? ` (${pet.breed_name_ru})` : ''}
                </Text>
              )}

              {pet.weight !== undefined && pet.weight > 0 && (
                <Text style={styles.petInfo}>⚖️ Вес: {pet.weight} кг</Text>
              )}
              {pet.height !== undefined && pet.height > 0 && (
                <Text style={styles.petInfo}>📏 Рост: {pet.height} см</Text>
              )}
              {pet.age !== undefined && pet.age > 0 && (
                <Text style={styles.petInfo}>🎂 Возраст: {pet.age} лет</Text>
              )}
              {pet.sex && (
                <Text style={styles.petInfo}>
                  {pet.sex === 'male' ? '♂ Пол: Мужской' : '♀ Пол: Женский'}
                </Text>
              )}
              {pet.neutered && <Text style={styles.petInfo}>✅ Стерилизован(а)</Text>}
              
              {pet.description && (
                <View style={styles.descriptionSection}>
                  <Text style={styles.descriptionTitle}>📝 Описание:</Text>
                  <Text style={styles.descriptionText}>{pet.description}</Text>
                </View>
              )}

              {health && (pet.weight !== undefined || pet.height !== undefined) && (
                <View style={styles.chartsSection}>
                  <Text style={styles.chartsTitle}>📊 Сравнение с нормой</Text>

                  {pet.weight !== undefined && pet.weight > 0 && (
                    <View style={styles.metricCard}>
                      <Text style={styles.metricName}>Вес</Text>
                      <Text>
                        {pet.weight} кг / {health.weightRange?.min}-{health.weightRange?.max} кг
                      </Text>
                      <Text
                        style={[
                          styles.statusText,
                          { color: health.weightStatus === 'норма' ? '#4CAF50' : '#FF6347' }
                        ]}
                      >
                        {health.weightStatus === 'норма' ? '✓ В норме' : '⚠ Отклонение'}
                      </Text>
                    </View>
                  )}

                  {pet.height !== undefined && pet.height > 0 && (
                    <View style={styles.metricCard}>
                      <Text style={styles.metricName}>Рост</Text>
                      <Text>
                        {pet.height} см / {health.heightRange?.min}-{health.heightRange?.max} см
                      </Text>
                      <Text
                        style={[
                          styles.statusText,
                          { color: health.heightStatus === 'норма' ? '#4CAF50' : '#FF6347' }
                        ]}
                      >
                        {health.heightStatus === 'норма' ? '✓ В норме' : '⚠ Отклонение'}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Модальное окно для распознавания породы */}
      <Modal
        visible={showRecognizer}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRecognizer(false)}
      >
        <View style={styles.modalOverlay}>
          <BreedRecognizer
            onBreedDetected={handleBreedDetected}
            onClose={() => setShowRecognizer(false)}
            preselectedSpecies={species || undefined}
          />
        </View>
      </Modal>

      {/* Bottom Navigation - используем компонент */}
      <BottomNav 
        currentScreen="addPet" 
        onNavigate={(screen) => onNavigate?.(screen)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F6F9F7' 
  },
  content: { 
    padding: 16, 
    paddingBottom: 100 
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#7BC9A8',
    fontWeight: '600',
  },
  title: { 
    fontSize: 22, 
    fontWeight: '700', 
    marginBottom: 16,
    color: '#2F4F4F',
  },
  addPetButton: {
    backgroundColor: '#7BC9A8',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  addPetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2F4F4F',
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  option: {
    padding: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 10,
    fontSize: 16,
  },
  active: {
    backgroundColor: '#7BC9A8',
    color: '#FFF',
    borderColor: '#7BC9A8',
  },
  breedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  recognizeButton: {
    backgroundColor: '#7BC9A8',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recognizeButtonText: {
    fontSize: 20,
  },
  clearButton: {
    backgroundColor: '#FF6347',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  breedItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#EEE',
  },
  saveButton: {
    backgroundColor: '#7BC9A8',
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 16,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancel: {
    textAlign: 'center',
    marginTop: 12,
    color: '#999',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  petHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  petName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2F4F4F',
  },
  editButton: {
    padding: 8,
  },
  editButtonText: {
    fontSize: 18,
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  petInfo: {
    fontSize: 14,
    color: '#7A8F88',
    marginTop: 4,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  petPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#7BC9A8',
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#7BC9A8',
    borderStyle: 'dashed',
  },
  photoPlaceholderText: {
    fontSize: 40,
  },
  photoPlaceholderLabel: {
    fontSize: 12,
    color: '#7A8F88',
    marginTop: 8,
  },
  cardPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  cardPhotoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  descriptionSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  descriptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2F4F4F',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: '#7A8F88',
    lineHeight: 20,
  },
  chartsSection: {
    marginTop: 16,
  },
  chartsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#2F4F4F',
  },
  metricCard: {
    backgroundColor: '#F8FCFA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  metricName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2F4F4F',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
  },
});