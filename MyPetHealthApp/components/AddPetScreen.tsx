// src/components/AddPetScreen.tsx
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
  Image
} from 'react-native';

import { useAuth } from '../src/hooks/AuthContext';
import { Pet } from '../src/types';
import { petsAPI } from '../src/services/api';
import { analyzePetHealthByCategory, SizeCategory } from '../src/utils/healthCheck';
import { AppScreen } from '../src/types/navigation';

const BASE_URL = 'http://192.168.0.92:3001';

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

  const isActive = (screen: AppScreen) => {
    return screen === 'addPet';
  };

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

  const savePet = async () => {
    if (!name || !species || !selectedBreed || !weight || !height || !age || !sex) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    try {
      const newPet = await petsAPI.addPet(
        user!.id,
        name,
        species,
        selectedBreed.id,
        Number(weight),
        Number(height),
        Number(age),
        sex,
        neutered
      );

      setPets(prev => [...prev, newPet]);

      Alert.alert('Успех', `Питомец ${name} сохранен!`);

      setShowForm(false);

      setName('');
      setSpecies(null);
      setBreedQuery('');
      setSelectedBreed(null);
      setWeight('');
      setHeight('');
      setAge('');
      setSex(null);
      setNeutered(false);

    } catch (err: any) {
      Alert.alert('Ошибка', err.message);
    }
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
            onPress={() => setShowForm(true)}
          >
            <Text style={styles.addPetButtonText}>➕ Добавить питомца</Text>
          </TouchableOpacity>
        )}

        {showForm && (
          <View style={styles.formCard}>
            <TextInput
              style={styles.input}
              placeholder="Имя"
              value={name}
              onChangeText={setName}
            />

            {/* вид животного */}
            <View style={styles.row}>
              <TouchableOpacity onPress={() => setSpecies('dog')}>
                <Text style={[styles.option, species === 'dog' && styles.active]}>🐶</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setSpecies('cat')}>
                <Text style={[styles.option, species === 'cat' && styles.active]}>🐱</Text>
              </TouchableOpacity>
            </View>

            {/* пол */}
            <View style={{ marginVertical: 10 }}>
              <Text style={{ marginBottom: 6, fontWeight: '600' }}>
                Пол:
              </Text>

              <View style={styles.row}>
                <TouchableOpacity onPress={() => setSex('male')}>
                  <Text style={[styles.option, sex === 'male' && styles.active]}>
                    Муж
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setSex('female')}>
                  <Text style={[styles.option, sex === 'female' && styles.active]}>
                    Жен
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* стерилизация */}
            <View style={{ marginVertical: 10 }}>
              <Text style={{ marginBottom: 6, fontWeight: '600' }}>
                Стерилизация:
              </Text>

              <TouchableOpacity
                style={[
                  styles.option,
                  neutered && styles.active
                ]}
                onPress={() => setNeutered(!neutered)}
              >
                <Text>
                  {neutered ? 'Да (кастрирован/стерилизован)' : 'Нет'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* порода */}
            {species && (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Порода"
                    value={breedQuery}
                    onChangeText={(text) => {
                      setBreedQuery(text);
                      setSelectedBreed(null);
                    }}
                  />

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

            <TextInput
              style={styles.input}
              placeholder="Вес (кг)"
              keyboardType="numeric"
              value={weight}
              onChangeText={setWeight}
            />

            <TextInput
              style={styles.input}
              placeholder="Рост (см)"
              keyboardType="numeric"
              value={height}
              onChangeText={setHeight}
            />

            <TextInput
              style={styles.input}
              placeholder="Возраст (лет)"
              keyboardType="numeric"
              value={age}
              onChangeText={setAge}
            />

            <TouchableOpacity style={styles.saveButton} onPress={savePet}>
              <Text style={styles.saveText}>Сохранить</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowForm(false)}>
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
              <Text style={styles.petName}>{pet.name}</Text>

              <Text style={styles.petInfo}>
                {pet.species === 'dog' ? '🐶 Собака' : '🐱 Кошка'}
              </Text>

              {/* Отображение породы */}
              {pet.breed_name && (
                <Text style={styles.petInfo}>
                  Порода: {pet.breed_name}
                  {pet.breed_name_ru ? ` (${pet.breed_name_ru})` : ''}
                </Text>
              )}

              {pet.weight && <Text style={styles.petInfo}>Вес: {pet.weight} кг</Text>}
              {pet.height && <Text style={styles.petInfo}>Рост: {pet.height} см</Text>}
              {pet.age && <Text style={styles.petInfo}>Возраст: {pet.age} лет</Text>}

              {health && (
                <View style={styles.chartsSection}>
                  <Text style={styles.chartsTitle}>Сравнение с нормой</Text>

                  <View style={styles.metricCard}>
                    <Text style={styles.metricName}>Вес</Text>
                    <Text>
                      {pet.weight} кг / {health.weightRange?.min}-{health.weightRange?.max} кг
                    </Text>

                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            health.weightStatus === 'норма' ? '#4CAF50' : '#FF6347',
                        },
                      ]}
                    >
                      {health.weightStatus === 'норма' ? '✓ В норме' : '⚠ Отклонение'}
                    </Text>
                  </View>

                  <View style={styles.metricCard}>
                    <Text style={styles.metricName}>Рост</Text>
                    <Text>
                      {pet.height} см / {health.heightRange?.min}-{health.heightRange?.max} см
                    </Text>

                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            health.heightStatus === 'норма' ? '#4CAF50' : '#FF6347',
                        },
                      ]}
                    >
                      {health.heightStatus === 'норма' ? '✓ В норме' : '⚠ Отклонение'}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom nav - как в App.tsx */}
      <View style={styles.bottomNav}>
        {/* 📅 Календарь */}
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => onNavigate?.('medications')}
        >
          <Text style={[
            styles.navText,
            isActive('medications') && styles.activeNavText
          ]}>
            📅
          </Text>
        </TouchableOpacity>

        {/* 🏠 Главная */}
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => onNavigate?.('main')}
        >
          <Text style={[
            styles.navText,
            isActive('main') && styles.activeNavText
          ]}>
            🏠
          </Text>
        </TouchableOpacity>

        {/* 🐶 Питомцы (активная) */}
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => onNavigate?.('addPet')}
        >
          <Text style={[styles.navText, styles.activeNavText]}>
            🐶
          </Text>
        </TouchableOpacity>

        {/* Профиль с аватаркой */}
        {user && (
          <TouchableOpacity 
            style={[
              styles.profileButton,
              isActive('profile') && styles.activeProfileButton
            ]} 
            onPress={() => onNavigate?.('profile')}
          >
            {user.avatar_path ? (
              <Image
                source={{ uri: `${BASE_URL}${user.avatar_path}?t=${Date.now()}` }}
                style={styles.profileAvatar}
              />
            ) : (
              <Text style={styles.profileText}>
                {((user.name ?? user.email ?? ' ')[0] || '').toUpperCase()}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
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

  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },

  option: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 10,
  },

  active: {
    backgroundColor: '#7BC9A8',
    color: '#FFF',
  },

  clearButton: {
    marginLeft: 8,
    backgroundColor: '#FF6347',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },

  clearButtonText: {
    color: '#fff',
    fontWeight: '700',
  },

  breedItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#EEE',
  },

  saveButton: {
    backgroundColor: '#7BC9A8',
    paddingVertical: 12,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 10,
  },

  saveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  cancel: {
    textAlign: 'center',
    marginTop: 10,
    color: 'gray',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },

  petName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2F4F4F',
  },

  petInfo: {
    fontSize: 14,
    color: '#7A8F88',
    marginTop: 4,
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

  // Bottom navigation styles (как в App.tsx)
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 70,
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
    alignSelf: 'center',
    paddingHorizontal: 20,
    position: 'absolute',
    bottom: 25,
  },

  navButton: { 
    flex: 1, 
    alignItems: 'center',
    paddingVertical: 10,
  },

  navText: { 
    fontSize: 24, 
    color: '#7A8F88',
  },
  
  activeNavText: {
    color: '#7BC9A8',
    fontWeight: '600',
  },

  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#7BC9A8',
    justifyContent: 'center',
    alignItems: 'center',
  },

  profileAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },

  profileText: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#7BC9A8' 
  },
  
  activeProfileButton: {
    borderColor: '#2F4F4F',
    borderWidth: 3,
  },
});