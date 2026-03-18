// components/PetMedicationsScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Pet, Medication } from '../src/types';
import rawMedicationsDataJson from '../src/data/medications.json';

// Приводим JSON к типу Medication[]
const rawMedicationsData = rawMedicationsDataJson as Medication[];

interface PetMedicationsScreenProps {
  pets: Pet[];
  onBack: () => void;
}

// Фильтруем препараты по питомцу
const getMedicationsForPet = (pet: Pet): Medication[] => {
  if (pet.age == null || pet.weight == null) return []; // безопасно проверяем undefined
  return rawMedicationsData.filter((med) =>
    med.species === pet.species &&
    pet.age >= med.age_min &&
    pet.age <= med.age_max &&
    pet.weight >= med.weight_min &&
    pet.weight <= med.weight_max
  );
};

// Компонент экрана
const PetMedicationsScreen: React.FC<PetMedicationsScreenProps> = ({ pets, onBack }) => {
  const [selectedPet, setSelectedPet] = useState<Pet | null>(pets[0] || null);
  const [medications, setMedications] = useState<Medication[]>([]);

  useEffect(() => {
    if (selectedPet) {
      setMedications(getMedicationsForPet(selectedPet));
    }
  }, [selectedPet]);

  const getNextApplicationDate = (intervalDays: number) => {
    const now = new Date();
    const nextDate = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
    return nextDate.toLocaleDateString();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>⬅️ Назад</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Календарь прививок и обработок</Text>
      </View>

      {pets.length === 0 ? (
        <View style={styles.noPets}>
          <Text>У вас ещё нет питомцев. Добавьте питомца, чтобы увидеть календарь.</Text>
        </View>
      ) : (
        <>
          {/* Выбор питомца */}
          <ScrollView horizontal style={styles.petSelector}>
            {pets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                style={[
                  styles.petButton,
                  selectedPet?.id === pet.id && styles.petButtonSelected,
                ]}
                onPress={() => setSelectedPet(pet)}
              >
                <Text style={styles.petButtonText}>
                  {pet.name} {pet.species === 'dog' ? '🐶' : '🐱'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Список медикаментов */}
          <ScrollView contentContainerStyle={styles.medicationsContainer}>
            {medications.length === 0 ? (
              <Text style={styles.noMedsText}>
                Нет подходящих препаратов для выбранного питомца.
              </Text>
            ) : (
              medications.map((med) => (
                <View key={med.id} style={styles.medCard}>
                  <Text style={styles.medName}>{med.name}</Text>
                  <Text style={styles.medType}>Тип: {med.type}</Text>
                  <Text style={styles.medNotes}>{med.notes}</Text>
                  <Text style={styles.medDate}>
                    Следующее применение: {getNextApplicationDate(med.application_interval_days)}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
};

export default PetMedicationsScreen;

// Стили
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F9F7' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    fontSize: 18,
    color: '#7BC9A8',
    marginRight: 16,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#2F4F4F' },

  noPets: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  petSelector: { margin: 16 },
  petButton: {
    padding: 10,
    backgroundColor: '#EEE',
    borderRadius: 8,
    marginRight: 8,
  },
  petButtonSelected: { backgroundColor: '#7BC9A8' },
  petButtonText: { fontSize: 16 },

  medicationsContainer: { paddingHorizontal: 16, paddingBottom: 100 },

  medCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  medName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  medType: { fontSize: 14, color: '#7A8F88', marginBottom: 4 },
  medNotes: { fontSize: 14, color: '#7A8F88', marginBottom: 4 },
  medDate: { fontSize: 14, fontWeight: '600', color: '#4CAF50' },

  noMedsText: { textAlign: 'center', marginTop: 20, color: '#7A8F88' },
});