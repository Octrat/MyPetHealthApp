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
} from 'react-native';
import { useAuth } from '../src/hooks/AuthContext';
import { Pet } from '../src/types';
import { petsAPI } from '../src/services/api';

type Breed = { id: number; name: string };

type Props = {
  onBack: () => void;
};

export default function AddPetScreen({ onBack }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<'dog' | 'cat' | null>(null);
  const [breedQuery, setBreedQuery] = useState('');
  const [breedOptions, setBreedOptions] = useState<Breed[]>([]);
  const [selectedBreed, setSelectedBreed] = useState<Breed | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔹 Загрузка питомцев пользователя
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

  // 🔹 Автокомплит пород
  useEffect(() => {
    const fetchBreeds = async () => {
      if (!species || !breedQuery) {
        setBreedOptions([]);
        return;
      }

      try {
        const data: Breed[] = await petsAPI.getBreeds(species);
        const filtered = data.filter((b) =>
          b.name.toLowerCase().startsWith(breedQuery.toLowerCase())
        );
        setBreedOptions(filtered);
      } catch (err) {
        console.error('Ошибка загрузки пород:', err);
      }
    };

    fetchBreeds();
  }, [breedQuery, species]);

  // 🔹 Добавление нового питомца
  const savePet = async () => {
    if (!name.trim() || !species || !selectedBreed) {
      Alert.alert('Ошибка', 'Введите имя, тип и выберите породу');
      return;
    }

    setLoading(true);
    try {
      const data: Pet = await petsAPI.addPet(user!.id, name, species, selectedBreed.id);
      setPets((prev) => [...prev, data]);
      Alert.alert('Успешно', `Питомец ${data.name} добавлен!`);
      setName('');
      setSpecies(null);
      setBreedQuery('');
      setSelectedBreed(null);
      setBreedOptions([]);
    } catch (err: any) {
      console.error('Ошибка добавления питомца:', err);
      Alert.alert('Ошибка', err.message || 'Не удалось добавить питомца');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
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
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Вид */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Тип животного</Text>
          <View style={styles.speciesButtons}>
            <TouchableOpacity
              style={[styles.speciesButton, species === 'dog' && styles.speciesButtonSelected]}
              onPress={() => setSpecies('dog')}
            >
              <Text style={[styles.speciesButtonText, species === 'dog' && styles.speciesButtonTextSelected]}>
                Собака
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.speciesButton, species === 'cat' && styles.speciesButtonSelected]}
              onPress={() => setSpecies('cat')}
            >
              <Text style={[styles.speciesButtonText, species === 'cat' && styles.speciesButtonTextSelected]}>
                Кошка
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Порода */}
        {species && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Порода</Text>
            <TextInput
              style={styles.input}
              placeholder="Начните вводить породу"
              value={selectedBreed ? selectedBreed.name : breedQuery}
              onChangeText={(text) => {
                setBreedQuery(text);
                setSelectedBreed(null);
              }}
            />
            <View style={styles.autocompleteList}>
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
                  <Text>{b.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Кнопка сохранить */}
        <TouchableOpacity style={styles.saveButton} onPress={savePet} disabled={loading}>
          <Text style={styles.saveButtonText}>{loading ? 'Сохраняем...' : '💾 Сохранить'}</Text>
        </TouchableOpacity>

        {loading && <ActivityIndicator style={{ marginTop: 20 }} />}

        {/* Список питомцев */}
        {pets.length > 0 && (
          <View style={styles.petList}>
            <Text style={styles.petListTitle}>Ваши питомцы:</Text>
            {pets.map((pet) => (
              <View key={pet.id} style={styles.petCard}>
                <Text style={styles.petName}>{pet.name}</Text>
                <Text style={styles.petSpecies}>{pet.species === 'dog' ? 'Собака' : 'Кошка'}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F9F7' },
  scrollContent: { padding: 16 },

  backButtonWrapper: { marginBottom: 20 },
  backButton: { color: '#7BC9A8', fontSize: 16 },

  title: { fontSize: 22, fontWeight: '700', color: '#2F4F4F', marginBottom: 10 },

  formGroup: { marginBottom: 20 },
  label: { fontSize: 16, marginBottom: 8, color: '#2F4F4F' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#CFEDE2',
  },

  speciesButtons: { flexDirection: 'row', gap: 16 },
  speciesButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CFEDE2',
    borderRadius: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  speciesButtonSelected: { backgroundColor: '#7BC9A8' },
  speciesButtonText: { fontSize: 16, color: '#2F4F4F' },
  speciesButtonTextSelected: { color: '#fff', fontWeight: '700' },

  saveButton: {
    marginTop: 20,
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  autocompleteList: {
    marginTop: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CFEDE2',
    maxHeight: 150,
  },
  autocompleteItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#CFEDE2',
  },

  petList: { marginTop: 30 },
  petListTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#2F4F4F' },
  petCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#CFEDE2',
  },
  petName: { fontSize: 16, fontWeight: '600' },
  petSpecies: { fontSize: 14, color: '#7A8F88' },
});
