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
  Image,
} from 'react-native';
import { useAuth } from '../src/hooks/AuthContext';
import { Pet } from '../src/types';
import { petsAPI } from '../src/services/api';
import { analyzePetHealthByCategory, SizeCategory } from '../src/utils/healthCheck';
import { AppScreen } from '../src/types/navigation';

const BASE_URL = 'http://192.168.0.59:3001';

type Breed = { 
  id: number; 
  name: string; 
  name_ru?: string; 
  size_category: SizeCategory 
};

type Props = { 
  onBack: () => void;
  onNavigate?: (screen: AppScreen) => void;
};

export default function AddPetScreen({ onBack, onNavigate }: Props) {
  const { user } = useAuth();

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

  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);

  const firstLetter = user?.name 
    ? user.name.charAt(0).toUpperCase() 
    : user?.email.charAt(0).toUpperCase() || '?';

  const avatarUri = user?.avatar_path ? `${BASE_URL}${user.avatar_path}` : '';

  // Загрузка питомцев
  useEffect(() => {
    const loadPets = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const data: Pet[] = await petsAPI.getPets(user.id);
        setPets(data);
      } catch (error: any) {
        Alert.alert('Ошибка', error.message || 'Не удалось загрузить питомцев');
      } finally {
        setLoading(false);
      }
    };
    loadPets();
  }, [user]);

  // Загрузка пород
  useEffect(() => {
    const fetchBreeds = async () => {
      if (!species) {
        setBreedOptions([]);
        return;
      }
      try {
        const data: Breed[] = await petsAPI.getBreeds(species, breedQuery);
        setBreedOptions(data);
      } catch (err) {
        console.error('Ошибка загрузки пород:', err);
      }
    };
    fetchBreeds();
  }, [species, breedQuery]);

  // Сохранение питомца
  const savePet = async () => {
    if (
      !name.trim() || !species || !selectedBreed || !weight || !height || !age || !sex
    ) {
      Alert.alert(
        'Ошибка',
        'Введите все поля: имя, тип, породу, вес, рост, возраст, пол и кастрацию'
      );
      return;
    }

    setLoading(true);
    try {
      const data: Pet = await petsAPI.addPet(
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

      setPets((prev) => [...prev, data]);

      // Анализ здоровья по категории
      if (selectedBreed.size_category) {
        const health = analyzePetHealthByCategory({
          sizeCategory: selectedBreed.size_category,
          weight: Number(weight),
          height: Number(height),
          age: Number(age),
          sex,
          neutered,
        });

        if (health) {
          Alert.alert(
            'Статус здоровья питомца',
            `Вес: ${health.weightStatus} (${health.weightRange.min}-${health.weightRange.max} кг)\n` +
            `Рост: ${health.heightStatus} (${health.heightRange.min}-${health.heightRange.max} см)`
          );
        }
      }

      Alert.alert(
        'Успешно',
        'Питомец добавлен!',
        [
          { 
            text: 'Остаться здесь', 
            style: 'cancel' 
          },
          { 
            text: 'На главную', 
            onPress: () => onNavigate?.('main') 
          }
        ]
      );

      // Сброс формы
      setName('');
      setSpecies(null);
      setBreedQuery('');
      setSelectedBreed(null);
      setBreedOptions([]);
      setWeight('');
      setHeight('');
      setAge('');
      setSex(null);
      setNeutered(false);
    } catch (err: any) {
      console.error('Ошибка добавления питомца:', err);
      Alert.alert('Ошибка', err.message || 'Не удалось добавить питомца');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={onBack} style={styles.backButtonWrapper}>
          <Text style={styles.backButton}>← Назад</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Добавить питомца</Text>

        {/* Имя */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Имя питомца</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Введите имя" 
            placeholderTextColor="#9BB8AE"
            value={name} 
            onChangeText={setName} 
          />
        </View>

        {/* Тип */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Тип животного</Text>
          <View style={styles.speciesButtons}>
            {['dog', 'cat'].map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.speciesButton, species === s && styles.speciesButtonSelected]}
                onPress={() => setSpecies(s as 'dog' | 'cat')}
              >
                <Text style={[styles.speciesButtonText, species === s && styles.speciesButtonTextSelected]}>
                  {s === 'dog' ? '🐶 Собака' : '🐱 Кошка'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Пол */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Пол питомца</Text>
          <View style={styles.speciesButtons}>
            {['male', 'female'].map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.speciesButton, sex === p && styles.speciesButtonSelected]}
                onPress={() => setSex(p as 'male' | 'female')}
              >
                <Text style={[styles.speciesButtonText, sex === p && styles.speciesButtonTextSelected]}>
                  {p === 'male' ? '👦 Мальчик' : '👧 Девочка'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Кастрация */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Кастрация / стерилизация</Text>
          <TouchableOpacity
            style={[styles.speciesButton, neutered && styles.speciesButtonSelected]}
            onPress={() => setNeutered(!neutered)}
          >
            <Text style={[styles.speciesButtonText, neutered && styles.speciesButtonTextSelected]}>
              {neutered ? '✅ Да' : '❌ Нет'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Порода */}
        {species && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Порода</Text>
            <TextInput
              style={styles.input}
              placeholder="Начните вводить породу"
              placeholderTextColor="#9BB8AE"
              value={breedQuery}
              onChangeText={(text) => { setBreedQuery(text); setSelectedBreed(null); }}
            />
            {breedOptions.length > 0 && (
              <ScrollView style={styles.autocompleteList} nestedScrollEnabled>
                {breedOptions.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    style={styles.autocompleteItem}
                    onPress={() => {
                      setSelectedBreed(b);
                      setBreedQuery(b.name);
                      setBreedOptions([]);
                    }}
                  >
                    <Text style={styles.autocompleteText}>
                      {b.name_ru ? `${b.name_ru} (${b.name})` : b.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* Вес */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Вес (кг)</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Введите вес" 
            placeholderTextColor="#9BB8AE"
            keyboardType="numeric" 
            value={weight} 
            onChangeText={setWeight} 
          />
        </View>

        {/* Рост */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Рост (см)</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Введите рост" 
            placeholderTextColor="#9BB8AE"
            keyboardType="numeric" 
            value={height} 
            onChangeText={setHeight} 
          />
        </View>

        {/* Возраст */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Возраст (лет)</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Введите возраст" 
            placeholderTextColor="#9BB8AE"
            keyboardType="numeric" 
            value={age} 
            onChangeText={setAge} 
          />
        </View>

        {/* Сохранить */}
        <TouchableOpacity 
          style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
          onPress={savePet} 
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? '⏳ Сохраняем...' : '💾 Сохранить питомца'}
          </Text>
        </TouchableOpacity>

        {loading && <ActivityIndicator style={{ marginTop: 20 }} color="#7BC9A8" />}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => onNavigate?.('medications')}
        >
          <Text style={styles.navText}>📅</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => onNavigate?.('main')}
        >
          <Text style={styles.navText}>🏠</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => Alert.alert('Добавление питомца', 'Заполните все поля, чтобы добавить нового питомца')}
        >
          <Text style={styles.navText}>?</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.profileButton, styles.activeProfileButton]} 
          onPress={() => onNavigate?.('profile')}
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.profileAvatar} />
          ) : (
            <Text style={styles.profileText}>{firstLetter}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F6F9F7' 
  },
  
  scrollContent: { 
    padding: 16,
    paddingBottom: 120,
  },

  backButtonWrapper: { 
    marginBottom: 12 
  },
  
  backButton: { 
    color: '#7BC9A8', 
    fontSize: 16,
    fontWeight: '500',
  },

  title: { 
    fontSize: 24, 
    fontWeight: '700', 
    color: '#2F4F4F', 
    marginBottom: 20,
    textAlign: 'center',
  },

  formGroup: { 
    marginBottom: 20 
  },

  label: { 
    fontSize: 15, 
    marginBottom: 8, 
    color: '#2F4F4F',
    fontWeight: '600',
  },

  input: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    fontSize: 16, 
    borderWidth: 1, 
    borderColor: '#E8F0EC',
    color: '#2F4F4F',
  },

  speciesButtons: { 
    flexDirection: 'row', 
    gap: 12,
  },

  speciesButton: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: '#E8F0EC', 
    borderRadius: 16, 
    paddingVertical: 14, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF',
  },
  
  speciesButtonSelected: { 
    backgroundColor: '#7BC9A8',
    borderColor: '#7BC9A8',
  },
  
  speciesButtonText: { 
    fontSize: 15, 
    color: '#2F4F4F',
    fontWeight: '500',
  },
  
  speciesButtonTextSelected: { 
    color: '#FFFFFF', 
    fontWeight: '600',
  },

  saveButton: { 
    marginTop: 20, 
    backgroundColor: '#7BC9A8', 
    paddingVertical: 16, 
    borderRadius: 18, 
    alignItems: 'center' 
  },
  
  saveButtonDisabled: {
    backgroundColor: '#B8E0D0',
  },
  
  saveButtonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: '700' 
  },

  autocompleteList: { 
    marginTop: 4, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#E8F0EC', 
    maxHeight: 150,
    elevation: 3,
  },
  
  autocompleteItem: { 
    padding: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#E8F0EC' 
  },

  autocompleteText: {
    color: '#2F4F4F',
    fontSize: 14,
  },

  // Bottom Navigation Styles
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
  
  activeProfileButton: {
    borderColor: '#2F4F4F',
    borderWidth: 3,
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
});