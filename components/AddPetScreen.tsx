// components/AddPetScreen.tsx
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
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../src/hooks/AuthContext';
import { Pet } from '../src/types';
import { petsAPI } from '../src/services/api';
import {
  analyzePetHealthByCategory,
  SizeCategory,
} from '../src/utils/healthCheck';
import { AppScreen } from '../src/types/navigation';
import BreedRecognizer from './BreedRecognizer';
import PetQRCode from './PetQRCode';
import PetPassport from './PetPassport';
import PetPedigree from './PetPedigree';
import NotificationsPanel from './NotificationsPanel';
import BottomNav from './BottomNav';
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
  warning: '#FF7A6B',
};

type Breed = {
  id: number;
  name: string;
  name_ru?: string;
};

interface AddPetScreenProps {
  onBack?: () => void;
  onNavigate?: (screen: AppScreen) => void;
}

export default function AddPetScreen({
  onBack,
  onNavigate,
}: AddPetScreenProps) {
  const { user } = useAuth();

  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [showRecognizer, setShowRecognizer] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showPassportModal, setShowPassportModal] = useState(false);
  const [showPedigreeModal, setShowPedigreeModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const [editingPetId, setEditingPetId] = useState<number | null>(null);
  const [selectedPetForQR, setSelectedPetForQR] = useState<any>(null);
  const [selectedPetForPassport, setSelectedPetForPassport] =
    useState<any>(null);
  const [selectedPetForPedigree, setSelectedPetForPedigree] =
    useState<any>(null);

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

  const [selectedSpeciesForScanner, setSelectedSpeciesForScanner] =
    useState<'dog' | 'cat'>('dog');

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

  useEffect(() => {
    loadPets();
  }, [user]);

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

  const getPetPhotoUri = (photo?: string | null) => {
    if (!photo) return null;

    if (photo.startsWith('http')) return photo;
    if (photo.startsWith('/')) return `${BASE_URL}${photo}`;
    if (photo.startsWith('data:')) return photo;

    return `data:image/jpeg;base64,${photo}`;
  };

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

  const showImagePickerOptions = () => {
    Alert.alert(
      'Фото питомца',
      'Выберите способ добавления фото',
      [
        {
          text: 'Отмена',
          style: 'cancel',
        },
        {
          text: 'Сделать фото',
          onPress: takePhoto,
        },
        {
          text: 'Выбрать из галереи',
          onPress: pickImage,
        },
      ],
      {
        cancelable: true,
      }
    );
  };

  const handleBreedDetected = (detectedBreed: string, breedData?: any) => {
    setBreedQuery(detectedBreed);
    setSelectedBreed(null);
    setShowRecognizer(false);

    let message = `Предполагаемая порода: ${detectedBreed}`;

    if (breedData?.description) {
      message += `\n\n${breedData.description}`;
    }

    if (breedData?.care_tips?.length) {
      message += `\n\nСовет: ${breedData.care_tips[0]}`;
    }

    Alert.alert('Порода определена', message, [{ text: 'OK' }]);
  };

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

  const savePet = async () => {
    if (!editingPetId) {
      if (
        !name ||
        !species ||
        !selectedBreed ||
        !weight ||
        !height ||
        !age ||
        !sex
      ) {
        Alert.alert('Ошибка', 'Заполните все обязательные поля');
        return;
      }
    } else {
      if (!name) {
        Alert.alert('Ошибка', 'Введите имя питомца');
        return;
      }
    }

    try {
      const photoData = petPhoto || undefined;

      if (editingPetId) {
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

        await loadPets();

        Alert.alert('Успех', `Данные питомца ${name} обновлены!`);
      } else {
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

        setPets((prev) => [...prev, newPet]);

        Alert.alert('Успех', `Питомец ${name} сохранен!`);
      }

      setShowForm(false);
      resetForm();
    } catch (err: any) {
      console.error('Save error:', err);
      Alert.alert('Ошибка', err.message || 'Не удалось сохранить питомца');
    }
  };

  const startEditPet = (pet: Pet) => {
    setEditingPetId(pet.id);
    setName(pet.name);
    setSpecies(pet.species as 'dog' | 'cat');
    setBreedQuery(pet.breed_name || '');
    setSelectedBreed(
      pet.breed_id
        ? {
            id: pet.breed_id,
            name: pet.breed_name || '',
          }
        : null
    );
    setWeight(pet.weight?.toString() || '');
    setHeight(pet.height?.toString() || '');
    setAge(pet.age?.toString() || '');
    setSex((pet.sex as 'male' | 'female') || null);
    setNeutered(pet.neutered || false);
    setDescription(pet.description || '');

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

  const deletePet = (petId: number, petName: string) => {
    Alert.alert('Удалить питомца', `Вы уверены, что хотите удалить ${petName}?`, [
      {
        text: 'Отмена',
        style: 'cancel',
      },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await petsAPI.deletePet(petId);
            await loadPets();
            Alert.alert('Успех', 'Питомец удален');
          } catch (err: any) {
            Alert.alert('Ошибка', err.message);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View>
            {onBack && (
              <TouchableOpacity
                onPress={onBack}
                style={styles.backButton}
                activeOpacity={0.85}
              >
                <Ionicons name="chevron-back" size={22} color={COLORS.text} />
              </TouchableOpacity>
            )}

            <Text style={styles.title}>Мои питомцы</Text>
            <Text style={styles.subtitle}>
              Добавляйте питомцев, ведите паспорт и данные здоровья
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowNotifications(true)}
            style={styles.notificationIcon}
            activeOpacity={0.85}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={COLORS.text}
            />
          </TouchableOpacity>
        </View>

        {!showForm && (
          <TouchableOpacity
            style={styles.addPetButton}
            onPress={() => {
              resetForm();
              setShowForm(true);
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={22} color={COLORS.white} />
            <Text style={styles.addPetButtonText}>Добавить питомца</Text>
          </TouchableOpacity>
        )}

        {showForm && (
          <ImageBackground
            source={cardBg}
            style={styles.formCard}
            imageStyle={styles.cardImage}
            resizeMode="cover"
          >
            <Text style={styles.formTitle}>
              {editingPetId ? 'Редактировать питомца' : 'Новый питомец'}
            </Text>

            <TouchableOpacity
              onPress={showImagePickerOptions}
              style={styles.photoContainer}
              activeOpacity={0.85}
            >
              {petPhoto ? (
                <Image
                  source={{ uri: `data:image/jpeg;base64,${petPhoto}` }}
                  style={styles.petPhoto}
                />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="camera-outline" size={34} color={COLORS.textSoft} />
                  <Text style={styles.photoPlaceholderLabel}>
                    Добавить фото
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.label}>Имя *</Text>
            <TextInput
              style={styles.input}
              placeholder="Например, Крошка"
              placeholderTextColor={COLORS.textSoft}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Вид животного *</Text>
            <View style={styles.choiceRow}>
              <TouchableOpacity
                onPress={() => setSpecies('dog')}
                style={[
                  styles.choicePill,
                  species === 'dog' && styles.choicePillActive,
                ]}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.choiceText,
                    species === 'dog' && styles.choiceTextActive,
                  ]}
                >
                  Собака
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSpecies('cat')}
                style={[
                  styles.choicePill,
                  species === 'cat' && styles.choicePillActive,
                ]}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.choiceText,
                    species === 'cat' && styles.choiceTextActive,
                  ]}
                >
                  Кошка
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Пол *</Text>
            <View style={styles.choiceRow}>
              <TouchableOpacity
                onPress={() => setSex('male')}
                style={[
                  styles.choicePill,
                  sex === 'male' && styles.choicePillActive,
                ]}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.choiceText,
                    sex === 'male' && styles.choiceTextActive,
                  ]}
                >
                  Мужской
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSex('female')}
                style={[
                  styles.choicePill,
                  sex === 'female' && styles.choicePillActive,
                ]}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.choiceText,
                    sex === 'female' && styles.choiceTextActive,
                  ]}
                >
                  Женский
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Стерилизация</Text>
            <TouchableOpacity
              style={[
                styles.singleOption,
                neutered && styles.choicePillActive,
              ]}
              onPress={() => setNeutered(!neutered)}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.choiceText,
                  neutered && styles.choiceTextActive,
                ]}
              >
                {neutered ? 'Да, стерилизован(а)' : 'Нет'}
              </Text>
            </TouchableOpacity>

            {species && (
              <View>
                <Text style={styles.label}>Порода *</Text>

                <View style={styles.breedInputRow}>
                  <TextInput
                    style={[styles.input, styles.breedInput]}
                    placeholder="Например, Лабрадор"
                    placeholderTextColor={COLORS.textSoft}
                    value={breedQuery}
                    onChangeText={(text) => {
                      setBreedQuery(text);
                      setSelectedBreed(null);
                    }}
                  />

                  <TouchableOpacity
                    style={styles.scanBreedButton}
                    onPress={() => {
                      if (!species) {
                        Alert.alert(
                          'Сначала выберите вид',
                          'Выберите собака или кошка перед распознаванием породы'
                        );
                        return;
                      }

                      setSelectedSpeciesForScanner(species);
                      setShowRecognizer(true);
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="camera-outline" size={23} color={COLORS.white} />
                  </TouchableOpacity>
                </View>

                {breedOptions.length > 0 && (
                  <View style={styles.breedOptionsContainer}>
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
                        activeOpacity={0.85}
                      >
                        <Text style={styles.breedItemText}>
                          {b.name_ru ? `${b.name_ru} (${b.name})` : b.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            <View style={styles.twoColumnRow}>
              <View style={styles.twoColumnItem}>
                <Text style={styles.label}>Вес, кг *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={COLORS.textSoft}
                  keyboardType="numeric"
                  value={weight}
                  onChangeText={setWeight}
                />
              </View>

              <View style={styles.twoColumnItem}>
                <Text style={styles.label}>Рост, см *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={COLORS.textSoft}
                  keyboardType="numeric"
                  value={height}
                  onChangeText={setHeight}
                />
              </View>
            </View>

            <Text style={styles.label}>Возраст, лет *</Text>
            <TextInput
              style={styles.input}
              placeholder="Возраст питомца"
              placeholderTextColor={COLORS.textSoft}
              keyboardType="numeric"
              value={age}
              onChangeText={setAge}
            />

            <Text style={styles.label}>Описание</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Расскажите о характере, привычках и особенностях питомца..."
              placeholderTextColor={COLORS.textSoft}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={savePet}
              activeOpacity={0.85}
            >
              <Text style={styles.saveText}>
                {editingPetId ? 'Сохранить изменения' : 'Сохранить питомца'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowForm(false);
                resetForm();
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.cancel}>Отмена</Text>
            </TouchableOpacity>
          </ImageBackground>
        )}

        {loading && (
          <ActivityIndicator
            style={{ marginTop: 20 }}
            size="large"
            color={COLORS.accentDark}
          />
        )}

        {pets.map((pet) => {
          const health = analyzePetHealthByCategory({
            sizeCategory: (pet.breed_size_category ?? 'medium') as SizeCategory,
            weight: pet.weight ?? 0,
            height: pet.height ?? 0,
            age: pet.age ?? 0,
            sex: pet.sex ?? 'male',
            neutered: pet.neutered ?? false,
          });

          const photoUri = getPetPhotoUri(pet.photo_url);

          return (
            <ImageBackground
              key={pet.id}
              source={cardBg}
              style={styles.card}
              imageStyle={styles.cardImage}
              resizeMode="cover"
            >
              <View style={styles.cardHeader}>
                <View style={styles.petHeaderLeft}>
                  {photoUri ? (
                    <Image source={{ uri: photoUri }} style={styles.cardPhoto} />
                  ) : (
                    <View style={styles.cardPhotoPlaceholder}>
                      <Text style={styles.cardPhotoEmoji}>
                        {pet.species === 'dog' ? '🐶' : '🐱'}
                      </Text>
                    </View>
                  )}

                  <View style={styles.petTitleBlock}>
                    <Text style={styles.petName} numberOfLines={1}>
                      {pet.name}
                    </Text>

                    <Text style={styles.petType}>
                      {pet.species === 'dog' ? 'Собака' : 'Кошка'}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.actionIconButton}
                    onPress={() => startEditPet(pet)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="create-outline" size={20} color={COLORS.text} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionIconButton}
                    onPress={() => deletePet(pet.id, pet.name)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="trash-outline" size={20} color={COLORS.coral} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.infoGrid}>
                {pet.breed_name && (
                  <View style={styles.infoPill}>
                    <Text style={styles.infoPillText}>
                      Порода: {pet.breed_name}
                      {pet.breed_name_ru ? ` (${pet.breed_name_ru})` : ''}
                    </Text>
                  </View>
                )}

                {pet.weight !== undefined && pet.weight > 0 && (
                  <View style={styles.infoPill}>
                    <Text style={styles.infoPillText}>Вес: {pet.weight} кг</Text>
                  </View>
                )}

                {pet.height !== undefined && pet.height > 0 && (
                  <View style={styles.infoPill}>
                    <Text style={styles.infoPillText}>
                      Рост: {pet.height} см
                    </Text>
                  </View>
                )}

                {pet.age !== undefined && pet.age > 0 && (
                  <View style={styles.infoPill}>
                    <Text style={styles.infoPillText}>
                      Возраст: {pet.age} лет
                    </Text>
                  </View>
                )}

                {pet.sex && (
                  <View style={styles.infoPill}>
                    <Text style={styles.infoPillText}>
                      Пол: {pet.sex === 'male' ? 'Мужской' : 'Женский'}
                    </Text>
                  </View>
                )}

                {pet.neutered && (
                  <View style={styles.infoPill}>
                    <Text style={styles.infoPillText}>Стерилизован(а)</Text>
                  </View>
                )}
              </View>

              {pet.description && (
                <View style={styles.descriptionSection}>
                  <Text style={styles.descriptionTitle}>Описание</Text>
                  <Text style={styles.descriptionText}>{pet.description}</Text>
                </View>
              )}

              {health && (pet.weight !== undefined || pet.height !== undefined) && (
                <View style={styles.chartsSection}>
                  <Text style={styles.chartsTitle}>Сравнение с нормой</Text>

                  {pet.weight !== undefined && pet.weight > 0 && (
                    <View style={styles.metricCard}>
                      <View>
                        <Text style={styles.metricName}>Вес</Text>
                        <Text style={styles.metricValue}>
                          {pet.weight} кг / {health.weightRange?.min}-
                          {health.weightRange?.max} кг
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.statusText,
                          {
                            color:
                              health.weightStatus === 'норма'
                                ? COLORS.success
                                : COLORS.warning,
                          },
                        ]}
                      >
                        {health.weightStatus === 'норма'
                          ? 'В норме'
                          : 'Отклонение'}
                      </Text>
                    </View>
                  )}

                  {pet.height !== undefined && pet.height > 0 && (
                    <View style={styles.metricCard}>
                      <View>
                        <Text style={styles.metricName}>Рост</Text>
                        <Text style={styles.metricValue}>
                          {pet.height} см / {health.heightRange?.min}-
                          {health.heightRange?.max} см
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.statusText,
                          {
                            color:
                              health.heightStatus === 'норма'
                                ? COLORS.success
                                : COLORS.warning,
                          },
                        ]}
                      >
                        {health.heightStatus === 'норма'
                          ? 'В норме'
                          : 'Отклонение'}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.cardButtons}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    if (pet && pet.id) {
                      setSelectedPetForQR(pet);
                      setShowQRModal(true);
                    } else {
                      Alert.alert('Ошибка', 'Данные питомца не найдены');
                    }
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="qr-code-outline" size={18} color={COLORS.text} />
                  <Text style={styles.secondaryButtonText}>QR-код</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    setSelectedPetForPassport(pet);
                    setShowPassportModal(true);
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="document-text-outline" size={18} color={COLORS.text} />
                  <Text style={styles.secondaryButtonText}>Паспорт</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    setSelectedPetForPedigree(pet);
                    setShowPedigreeModal(true);
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="git-network-outline" size={18} color={COLORS.text} />
                  <Text style={styles.secondaryButtonText}>Родословная</Text>
                </TouchableOpacity>
              </View>
            </ImageBackground>
          );
        })}
      </ScrollView>

      <Modal
        visible={showRecognizer}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRecognizer(false)}
      >
        <BreedRecognizer
          visible={showRecognizer}
          species={selectedSpeciesForScanner}
          onClose={() => setShowRecognizer(false)}
          onBreedSelected={handleBreedDetected}
        />
      </Modal>

      {selectedPetForQR && (
        <PetQRCode
          visible={showQRModal}
          pet={selectedPetForQR}
          onClose={() => {
            setShowQRModal(false);
            setSelectedPetForQR(null);
          }}
          onSave={loadPets}
        />
      )}

      {selectedPetForPassport && (
        <PetPassport
          visible={showPassportModal}
          pet={selectedPetForPassport}
          onClose={() => {
            setShowPassportModal(false);
            setSelectedPetForPassport(null);
          }}
          onSave={loadPets}
        />
      )}

      {selectedPetForPedigree && (
          <PetPedigree
            visible={showPedigreeModal}
            pet={selectedPetForPedigree}
            pets={pets}
            onClose={() => {
              setShowPedigreeModal(false);
              setSelectedPetForPedigree(null);
            }}
        />
      )}

      <NotificationsPanel
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        pets={pets}
      />

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
    backgroundColor: COLORS.background,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 28,
    paddingBottom: 130,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -1.2,
  },

  subtitle: {
    marginTop: 8,
    maxWidth: 290,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSoft,
    fontWeight: '600',
  },

  notificationIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 3,
  },

  addPetButton: {
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    shadowColor: COLORS.accentDark,
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    elevation: 5,
  },

  addPetButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '900',
  },

  formCard: {
    borderRadius: 32,
    padding: 18,
    marginBottom: 18,
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

  formTitle: {
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 18,
    textAlign: 'center',
  },

  label: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 10,
  },

  input: {
    minHeight: 56,
    backgroundColor: COLORS.white,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 10,
  },

  textArea: {
    minHeight: 104,
    paddingTop: 16,
    borderRadius: 24,
  },

  choiceRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },

  choicePill: {
    flex: 1,
    minHeight: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  choicePillActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },

  choiceText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '800',
  },

  choiceTextActive: {
    color: COLORS.white,
  },

  singleOption: {
    minHeight: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    marginBottom: 10,
  },

  breedInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  breedInput: {
    flex: 1,
  },

  scanBreedButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  breedOptionsContainer: {
    maxHeight: 210,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 10,
  },

  breedItem: {
    padding: 13,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },

  breedItemText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },

  twoColumnRow: {
    flexDirection: 'row',
    gap: 10,
  },

  twoColumnItem: {
    flex: 1,
  },

  saveButton: {
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    shadowColor: COLORS.accentDark,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 4,
  },

  saveText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '900',
  },

  cancel: {
    textAlign: 'center',
    marginTop: 14,
    color: COLORS.textSoft,
    fontSize: 14,
    fontWeight: '800',
  },

  photoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },

  petPhoto: {
    width: 122,
    height: 122,
    borderRadius: 61,
    borderWidth: 4,
    borderColor: COLORS.white,
    backgroundColor: COLORS.cardSoft,
  },

  photoPlaceholder: {
    width: 122,
    height: 122,
    borderRadius: 61,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },

  photoPlaceholderLabel: {
    fontSize: 12,
    color: COLORS.textSoft,
    marginTop: 8,
    fontWeight: '700',
  },

  card: {
    borderRadius: 32,
    padding: 18,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 5,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  petHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },

  cardPhoto: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 3,
    borderColor: COLORS.white,
    backgroundColor: COLORS.cardSoft,
  },

  cardPhotoPlaceholder: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  cardPhotoEmoji: {
    fontSize: 26,
  },

  petTitleBlock: {
    flex: 1,
    marginLeft: 12,
  },

  petName: {
    fontSize: 23,
    lineHeight: 28,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.4,
  },

  petType: {
    marginTop: 2,
    fontSize: 13,
    color: COLORS.textSoft,
    fontWeight: '700',
  },

  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },

  actionIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },

  infoPill: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  infoPillText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '700',
  },

  descriptionSection: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  descriptionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 5,
  },

  descriptionText: {
    fontSize: 14,
    color: COLORS.textSoft,
    lineHeight: 20,
    fontWeight: '600',
  },

  chartsSection: {
    marginTop: 16,
  },

  chartsTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 10,
    color: COLORS.text,
  },

  metricCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  metricName: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 4,
  },

  metricValue: {
    fontSize: 13,
    color: COLORS.textSoft,
    fontWeight: '700',
  },

  statusText: {
    fontSize: 13,
    fontWeight: '900',
  },

  cardButtons: {
    marginTop: 16,
    gap: 9,
  },

  secondaryButton: {
    minHeight: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.text,
  },
});