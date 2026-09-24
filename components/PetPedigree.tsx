// components/PetPedigree.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pet } from '../src/types';
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
  blue: '#7FA7FF',
};

type RelativeType =
  | 'father'
  | 'mother'
  | 'grandfather'
  | 'grandmother'
  | 'child'
  | 'other';

type EntrySource = 'existing' | 'manual';

interface RelativePet {
  id: number;
  name: string;
  species: 'dog' | 'cat';
  sex?: 'male' | 'female';
  age?: number;
  weight?: number;
  height?: number;
  photo_url?: string;
  breed_name?: string;
  breed_name_ru?: string;
}

interface PedigreeEntry {
  id: number;
  pet_id: number;
  relative_pet_id?: number | null;
  relative_type: RelativeType;
  relative_name: string;
  species?: 'dog' | 'cat' | null;
  breed?: string | null;
  sex?: 'male' | 'female' | null;
  birth_date?: string | null;
  document_number?: string | null;
  breeder_name?: string | null;
  club_name?: string | null;
  notes?: string | null;
  relative_pet?: RelativePet | null;
}

interface PetPedigreeProps {
  visible: boolean;
  pet: Pet;
  pets: Pet[];
  onClose: () => void;
}

const RELATIVE_LABELS: Record<RelativeType, string> = {
  father: 'Отец',
  mother: 'Мать',
  grandfather: 'Дедушка',
  grandmother: 'Бабушка',
  child: 'Потомок',
  other: 'Другое',
};

const RELATIVE_ICONS: Record<RelativeType, keyof typeof Ionicons.glyphMap> = {
  father: 'male-outline',
  mother: 'female-outline',
  grandfather: 'ribbon-outline',
  grandmother: 'flower-outline',
  child: 'paw-outline',
  other: 'git-network-outline',
};

export default function PetPedigree({
  visible,
  pet,
  pets,
  onClose,
}: PetPedigreeProps) {
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<PedigreeEntry[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PedigreeEntry | null>(null);

  const [entrySource, setEntrySource] = useState<EntrySource>('existing');
  const [relativePetId, setRelativePetId] = useState<number | null>(null);
  const [relativeType, setRelativeType] = useState<RelativeType>('father');
  const [relativeName, setRelativeName] = useState('');
  const [species, setSpecies] = useState<'dog' | 'cat' | null>(null);
  const [breed, setBreed] = useState('');
  const [sex, setSex] = useState<'male' | 'female' | null>(null);
  const [birthDate, setBirthDate] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [breederName, setBreederName] = useState('');
  const [clubName, setClubName] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (visible && pet?.id) {
      loadPedigree();
    }
  }, [visible, pet?.id]);

  const availablePets = pets.filter((item) => item.id !== pet.id);

  const getPetPhotoUri = (photo?: string | null) => {
    if (!photo) return null;

    if (photo.startsWith('http')) return photo;
    if (photo.startsWith('/')) return `${BASE_URL}${photo}`;
    if (photo.startsWith('data:')) return photo;

    return `data:image/jpeg;base64,${photo}`;
  };

  const normalizeDate = (value?: string | null) => {
    if (!value) return '';
    return String(value).split('T')[0];
  };

  const loadPedigree = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem('userToken');

      const response = await fetch(`${BASE_URL}/api/pets/${pet.id}/pedigree`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEntries(data);
      } else {
        const errorData = await response.json().catch(() => null);
        console.log('Pedigree load error:', errorData || response.status);
      }
    } catch (error) {
      console.error('Ошибка загрузки родословной:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingEntry(null);
    setEntrySource('existing');
    setRelativePetId(null);
    setRelativeType('father');
    setRelativeName('');
    setSpecies(null);
    setBreed('');
    setSex(null);
    setBirthDate('');
    setDocumentNumber('');
    setBreederName('');
    setClubName('');
    setNotes('');
  };

  const openCreateForm = () => {
    resetForm();
    setFormVisible(true);
  };

  const openEditForm = (entry: PedigreeEntry) => {
    setEditingEntry(entry);
    setRelativeType(entry.relative_type);
    setRelativePetId(entry.relative_pet_id || null);
    setEntrySource(entry.relative_pet_id ? 'existing' : 'manual');
    setRelativeName(entry.relative_name || '');
    setSpecies((entry.species as 'dog' | 'cat') || null);
    setBreed(entry.breed || '');
    setSex((entry.sex as 'male' | 'female') || null);
    setBirthDate(normalizeDate(entry.birth_date));
    setDocumentNumber(entry.document_number || '');
    setBreederName(entry.breeder_name || '');
    setClubName(entry.club_name || '');
    setNotes(entry.notes || '');
    setFormVisible(true);
  };

  const saveEntry = async () => {
    if (!relativeType) {
      Alert.alert('Ошибка', 'Выберите тип родственной связи');
      return;
    }
  
    if (entrySource === 'existing' && !relativePetId) {
      Alert.alert('Ошибка', 'Выберите питомца из списка');
      return;
    }
  
    if (entrySource === 'manual' && !relativeName.trim()) {
      Alert.alert('Ошибка', 'Введите кличку родственника');
      return;
    }
  
    try {
      const token = await AsyncStorage.getItem('userToken');
  
      const payload = {
        relative_pet_id: entrySource === 'existing' ? relativePetId : null,
        relative_type: relativeType,
        relative_name: entrySource === 'manual' ? relativeName.trim() : '',
        species: entrySource === 'manual' ? species : null,
        breed: entrySource === 'manual' ? breed.trim() : null,
        sex: entrySource === 'manual' ? sex : null,
        birth_date: entrySource === 'manual' && birthDate ? birthDate : null,
        document_number: documentNumber.trim() || null,
        breeder_name: breederName.trim() || null,
        club_name: clubName.trim() || null,
        notes: notes.trim() || null,
      };
  
      console.log('PEDIGREE SAVE PAYLOAD:', payload);
  
      const url = editingEntry
        ? `${BASE_URL}/api/pets/${pet.id}/pedigree/${editingEntry.id}`
        : `${BASE_URL}/api/pets/${pet.id}/pedigree`;
  
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
  
        console.log('PEDIGREE SAVE ERROR:', response.status, errorData);
  
        Alert.alert(
          'Ошибка',
          errorData?.message || 'Не удалось сохранить запись'
        );
  
        return;
      }
  
      await loadPedigree();
  
      setFormVisible(false);
      resetForm();
  
      Alert.alert('Успех', 'Родословная обновлена');
    } catch (error) {
      console.error('Ошибка сохранения родословной:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить запись');
    }
  };

  const deleteEntry = (entry: PedigreeEntry) => {
    Alert.alert(
      'Удалить запись',
      `Удалить "${entry.relative_name}" из родословной?`,
      [
        {
          text: 'Отмена',
          style: 'cancel',
        },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');

              const response = await fetch(
                `${BASE_URL}/api/pets/${pet.id}/pedigree/${entry.id}`,
                {
                  method: 'DELETE',
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (response.ok) {
                await loadPedigree();
                Alert.alert('Успех', 'Запись удалена');
              } else {
                Alert.alert('Ошибка', 'Не удалось удалить запись');
              }
            } catch (error) {
              console.error('Ошибка удаления:', error);
              Alert.alert('Ошибка', 'Не удалось удалить запись');
            }
          },
        },
      ]
    );
  };

  const getEntriesByType = (type: RelativeType) => {
    return entries.filter((entry) => entry.relative_type === type);
  };

  const getEntryDisplay = (entry: PedigreeEntry) => {
    if (entry.relative_pet) {
      return {
        name: entry.relative_pet.name,
        species: entry.relative_pet.species,
        sex: entry.relative_pet.sex,
        breed:
          entry.relative_pet.breed_name_ru ||
          entry.relative_pet.breed_name ||
          entry.breed ||
          '',
        photo: entry.relative_pet.photo_url,
        linked: true,
      };
    }

    return {
      name: entry.relative_name,
      species: entry.species,
      sex: entry.sex,
      breed: entry.breed || '',
      photo: null,
      linked: false,
    };
  };

  const renderRelativeCard = (entry: PedigreeEntry) => {
    const display = getEntryDisplay(entry);
    const photoUri = getPetPhotoUri(display.photo);

    return (
      <View key={entry.id} style={styles.relativeCard}>
        <View style={styles.relativeTopLine}>
          <View style={styles.relativeLeft}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.relativePhoto} />
            ) : (
              <View style={styles.relativePhotoPlaceholder}>
                <Text style={styles.relativeEmoji}>
                  {display.species === 'dog' ? '🐶' : '🐱'}
                </Text>
              </View>
            )}

            <View style={styles.relativeTextBlock}>
              <Text style={styles.relativeRole}>
                {RELATIVE_LABELS[entry.relative_type]}
              </Text>

              <Text style={styles.relativeName}>{display.name}</Text>

              <Text style={styles.relativeInfo}>
                {display.species === 'dog'
                  ? 'Собака'
                  : display.species === 'cat'
                    ? 'Кошка'
                    : 'Вид не указан'}
                {display.breed ? ` • ${display.breed}` : ''}
              </Text>

              {display.linked && (
                <Text style={styles.linkedLabel}>Связан с моим питомцем</Text>
              )}
            </View>
          </View>

          <View style={styles.relativeActions}>
            <TouchableOpacity
              style={styles.smallActionButton}
              onPress={() => openEditForm(entry)}
              activeOpacity={0.85}
            >
              <Ionicons name="create-outline" size={18} color={COLORS.text} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.smallActionButton}
              onPress={() => deleteEntry(entry)}
              activeOpacity={0.85}
            >
              <Ionicons name="trash-outline" size={18} color={COLORS.coral} />
            </TouchableOpacity>
          </View>
        </View>

        {(entry.document_number || entry.breeder_name || entry.club_name || entry.notes) && (
          <View style={styles.relativeDetails}>
            {entry.document_number ? (
              <Text style={styles.relativeDetailText}>
                Документ: {entry.document_number}
              </Text>
            ) : null}

            {entry.breeder_name ? (
              <Text style={styles.relativeDetailText}>
                Заводчик: {entry.breeder_name}
              </Text>
            ) : null}

            {entry.club_name ? (
              <Text style={styles.relativeDetailText}>
                Клуб: {entry.club_name}
              </Text>
            ) : null}

            {entry.notes ? (
              <Text style={styles.relativeDetailText}>Заметки: {entry.notes}</Text>
            ) : null}
          </View>
        )}
      </View>
    );
  };

  const renderSection = (title: string, type: RelativeType) => {
    const sectionEntries = getEntriesByType(type);

    return (
      <ImageBackground
        source={cardBg}
        style={styles.card}
        imageStyle={styles.cardImage}
        resizeMode="cover"
      >
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleLeft}>
            <View style={styles.sectionIcon}>
              <Ionicons
                name={RELATIVE_ICONS[type]}
                size={20}
                color={COLORS.white}
              />
            </View>

            <Text style={styles.sectionTitle}>{title}</Text>
          </View>

          <Text style={styles.sectionCount}>{sectionEntries.length}</Text>
        </View>

        {sectionEntries.length === 0 ? (
          <Text style={styles.emptySectionText}>Записи пока нет</Text>
        ) : (
          sectionEntries.map(renderRelativeCard)
        )}
      </ImageBackground>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.85}
            >
              <Ionicons name="chevron-back" size={22} color={COLORS.text} />
            </TouchableOpacity>

            <Text style={styles.title}>Родословная</Text>
            <Text style={styles.subtitle}>
              Добавляйте родителей, предков и потомков питомца
            </Text>
          </View>

          <ImageBackground
            source={cardBg}
            style={styles.heroCard}
            imageStyle={styles.cardImage}
            resizeMode="cover"
          >
            <View style={styles.heroIcon}>
              <Ionicons
                name="git-network-outline"
                size={34}
                color={COLORS.white}
              />
            </View>

            <Text style={styles.petName}>{pet.name}</Text>

            <Text style={styles.petInfo}>
              {pet.species === 'dog' ? 'Собака' : 'Кошка'}
              {pet.breed_name ? ` • ${pet.breed_name}` : ''}
            </Text>

            <TouchableOpacity
              style={styles.addButton}
              onPress={openCreateForm}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={20} color={COLORS.white} />
              <Text style={styles.addButtonText}>Добавить родственника</Text>
            </TouchableOpacity>
          </ImageBackground>

          {loading ? (
            <ActivityIndicator
              style={{ marginTop: 20 }}
              size="large"
              color={COLORS.accentDark}
            />
          ) : (
            <>
              {renderSection('Родители', 'father')}
              {renderSection('Мать', 'mother')}
              {renderSection('Дедушки', 'grandfather')}
              {renderSection('Бабушки', 'grandmother')}
              {renderSection('Потомки', 'child')}
              {renderSection('Прочие связи', 'other')}
            </>
          )}

          <TouchableOpacity
            style={styles.closeMainButton}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.closeMainButtonText}>Закрыть</Text>
          </TouchableOpacity>
        </ScrollView>

        <Modal
          visible={formVisible}
          animationType="slide"
          transparent
          onRequestClose={() => {
            setFormVisible(false);
            resetForm();
          }}
        >
          <View style={styles.formOverlay}>
            <ImageBackground
              source={cardBg}
              style={styles.formModal}
              imageStyle={styles.formModalImage}
              resizeMode="stretch"
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.formContent}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.formHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.formTitle}>
                      {editingEntry ? 'Редактировать запись' : 'Новый родственник'}
                    </Text>
                    <Text style={styles.formSubtitle}>
                      Для питомца {pet.name}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.formCloseButton}
                    onPress={() => {
                      setFormVisible(false);
                      resetForm();
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="close" size={22} color={COLORS.text} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>Тип связи</Text>
                <View style={styles.typeGrid}>
                  {(
                    [
                      'father',
                      'mother',
                      'grandfather',
                      'grandmother',
                      'child',
                      'other',
                    ] as RelativeType[]
                  ).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        relativeType === type && styles.typeButtonActive,
                      ]}
                      onPress={() => setRelativeType(type)}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          relativeType === type && styles.typeButtonTextActive,
                        ]}
                      >
                        {RELATIVE_LABELS[type]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Источник</Text>
                <View style={styles.sourceRow}>
                  <TouchableOpacity
                    style={[
                      styles.sourceButton,
                      entrySource === 'existing' && styles.sourceButtonActive,
                    ]}
                    onPress={() => setEntrySource('existing')}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.sourceButtonText,
                        entrySource === 'existing' &&
                          styles.sourceButtonTextActive,
                      ]}
                    >
                      Мой питомец
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.sourceButton,
                      entrySource === 'manual' && styles.sourceButtonActive,
                    ]}
                    onPress={() => setEntrySource('manual')}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.sourceButtonText,
                        entrySource === 'manual' &&
                          styles.sourceButtonTextActive,
                      ]}
                    >
                      Вручную
                    </Text>
                  </TouchableOpacity>
                </View>

                {entrySource === 'existing' ? (
                  <>
                    <Text style={styles.label}>Выберите питомца</Text>

                    {availablePets.length === 0 ? (
                      <Text style={styles.emptySectionText}>
                        У вас пока нет других питомцев. Используйте ввод вручную.
                      </Text>
                    ) : (
                      <View style={styles.existingPetsList}>
                        {availablePets.map((item) => {
                          const active = relativePetId === item.id;
                          const photoUri = getPetPhotoUri(item.photo_url);

                          return (
                            <TouchableOpacity
                              key={item.id}
                              style={[
                                styles.existingPetButton,
                                active && styles.existingPetButtonActive,
                              ]}
                              onPress={() => setRelativePetId(item.id)}
                              activeOpacity={0.85}
                            >
                              {photoUri ? (
                                <Image
                                  source={{ uri: photoUri }}
                                  style={styles.existingPetPhoto}
                                />
                              ) : (
                                <View style={styles.existingPetPhotoPlaceholder}>
                                  <Text>
                                    {item.species === 'dog' ? '🐶' : '🐱'}
                                  </Text>
                                </View>
                              )}

                              <View style={{ flex: 1 }}>
                                <Text
                                  style={[
                                    styles.existingPetName,
                                    active && styles.existingPetNameActive,
                                  ]}
                                >
                                  {item.name}
                                </Text>
                                <Text
                                  style={[
                                    styles.existingPetInfo,
                                    active && styles.existingPetNameActive,
                                  ]}
                                >
                                  {item.species === 'dog' ? 'Собака' : 'Кошка'}
                                  {item.breed_name ? ` • ${item.breed_name}` : ''}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </>
                ) : (
                  <>
                    <Text style={styles.label}>Кличка *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Например, Барон"
                      placeholderTextColor={COLORS.textSoft}
                      value={relativeName}
                      onChangeText={setRelativeName}
                    />

                    <Text style={styles.label}>Вид</Text>
                    <View style={styles.sourceRow}>
                      <TouchableOpacity
                        style={[
                          styles.sourceButton,
                          species === 'dog' && styles.sourceButtonActive,
                        ]}
                        onPress={() => setSpecies('dog')}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.sourceButtonText,
                            species === 'dog' && styles.sourceButtonTextActive,
                          ]}
                        >
                          Собака
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.sourceButton,
                          species === 'cat' && styles.sourceButtonActive,
                        ]}
                        onPress={() => setSpecies('cat')}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.sourceButtonText,
                            species === 'cat' && styles.sourceButtonTextActive,
                          ]}
                        >
                          Кошка
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>Порода</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Порода"
                      placeholderTextColor={COLORS.textSoft}
                      value={breed}
                      onChangeText={setBreed}
                    />

                    <Text style={styles.label}>Пол</Text>
                    <View style={styles.sourceRow}>
                      <TouchableOpacity
                        style={[
                          styles.sourceButton,
                          sex === 'male' && styles.sourceButtonActive,
                        ]}
                        onPress={() => setSex('male')}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.sourceButtonText,
                            sex === 'male' && styles.sourceButtonTextActive,
                          ]}
                        >
                          Мужской
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.sourceButton,
                          sex === 'female' && styles.sourceButtonActive,
                        ]}
                        onPress={() => setSex('female')}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.sourceButtonText,
                            sex === 'female' && styles.sourceButtonTextActive,
                          ]}
                        >
                          Женский
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>Дата рождения</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="ГГГГ-ММ-ДД"
                      placeholderTextColor={COLORS.textSoft}
                      value={birthDate}
                      onChangeText={setBirthDate}
                    />
                  </>
                )}

                <Text style={styles.label}>Номер документа</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Номер родословной / документа"
                  placeholderTextColor={COLORS.textSoft}
                  value={documentNumber}
                  onChangeText={setDocumentNumber}
                />

                <Text style={styles.label}>Заводчик</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ФИО или название питомника"
                  placeholderTextColor={COLORS.textSoft}
                  value={breederName}
                  onChangeText={setBreederName}
                />

                <Text style={styles.label}>Клуб</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Название клуба"
                  placeholderTextColor={COLORS.textSoft}
                  value={clubName}
                  onChangeText={setClubName}
                />

                <Text style={styles.label}>Заметки</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Дополнительная информация"
                  placeholderTextColor={COLORS.textSoft}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                <View style={styles.formButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setFormVisible(false);
                      resetForm();
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.cancelButtonText}>Отмена</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={saveEntry}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.saveButtonText}>Сохранить</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </ImageBackground>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
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
    shadowOffset: { width: 0, height: 5 },
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
    fontSize: 15,
    lineHeight: 21,
    color: COLORS.textSoft,
    fontWeight: '600',
  },

  heroCard: {
    borderRadius: 32,
    padding: 22,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },

  cardImage: {
    borderRadius: 32,
  },

  heroIcon: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 4,
    borderColor: COLORS.white,
  },

  petName: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
  },

  petInfo: {
    marginTop: 5,
    fontSize: 14,
    color: COLORS.textSoft,
    fontWeight: '700',
    textAlign: 'center',
  },

  addButton: {
    marginTop: 18,
    height: 52,
    paddingHorizontal: 20,
    borderRadius: 26,
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  addButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '900',
  },

  card: {
    borderRadius: 32,
    padding: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  sectionTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  sectionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },

  sectionCount: {
    fontSize: 13,
    color: COLORS.white,
    fontWeight: '900',
    backgroundColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  emptySectionText: {
    fontSize: 14,
    color: COLORS.textSoft,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 14,
  },

  relativeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },

  relativeTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  relativeLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  relativePhoto: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: COLORS.border,
  },

  relativePhotoPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  relativeEmoji: {
    fontSize: 24,
  },

  relativeTextBlock: {
    flex: 1,
    marginLeft: 12,
  },

  relativeRole: {
    fontSize: 12,
    color: COLORS.accentDark,
    fontWeight: '900',
  },

  relativeName: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '900',
    marginTop: 2,
  },

  relativeInfo: {
    fontSize: 12,
    color: COLORS.textSoft,
    fontWeight: '700',
    marginTop: 3,
  },

  linkedLabel: {
    marginTop: 5,
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '900',
  },

  relativeActions: {
    flexDirection: 'row',
    gap: 7,
    marginLeft: 8,
  },

  smallActionButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  relativeDetails: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  relativeDetailText: {
    fontSize: 12,
    color: COLORS.textSoft,
    fontWeight: '700',
    marginBottom: 3,
  },

  closeMainButton: {
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.accentDark,
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 5,
  },

  closeMainButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '900',
  },

  formOverlay: {
    flex: 1,
    backgroundColor: 'rgba(32, 32, 32, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  formModal: {
    width: '94%',
    height: '88%',
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardSoft,
  },

  formModalImage: {
    borderRadius: 28,
    width: '100%',
    height: '100%',
  },

  formContent: {
    padding: 18,
    paddingBottom: 28,
  },

  formHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  formTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
  },

  formSubtitle: {
    marginTop: 5,
    fontSize: 13,
    color: COLORS.textSoft,
    fontWeight: '700',
  },

  formCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  label: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 12,
  },

  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  typeButton: {
    width: '48%',
    minHeight: 42,
    borderRadius: 21,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },

  typeButtonActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },

  typeButtonText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '800',
  },

  typeButtonTextActive: {
    color: COLORS.white,
  },

  sourceRow: {
    flexDirection: 'row',
    gap: 10,
  },

  sourceButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },

  sourceButtonActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },

  sourceButtonText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '800',
  },

  sourceButtonTextActive: {
    color: COLORS.white,
  },

  existingPetsList: {
    gap: 8,
  },

  existingPetButton: {
    minHeight: 64,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
  },

  existingPetButtonActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },

  existingPetPhoto: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: COLORS.white,
  },

  existingPetPhotoPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  existingPetName: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '900',
  },

  existingPetInfo: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.textSoft,
    fontWeight: '700',
  },

  existingPetNameActive: {
    color: COLORS.white,
  },

  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 15,
    backgroundColor: COLORS.white,
    color: COLORS.text,
    fontWeight: '600',
  },

  textArea: {
    height: 90,
    borderRadius: 18,
    paddingTop: 14,
  },

  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
  },

  cancelButton: {
    flex: 1,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    color: COLORS.textSoft,
    fontWeight: '900',
    fontSize: 15,
  },

  saveButton: {
    flex: 1,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveButtonText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 15,
  },
});