// components/PetMedicationsScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { Pet, Medication } from '../src/types';
import { useAuth } from '../src/hooks/AuthContext';
import { AppScreen } from '../src/types/navigation';
import BottomNav from './BottomNav';
import rawMedicationsDataJson from '../src/data/medications.json';

const BASE_URL = 'http://192.168.0.34:3001';

// Приводим JSON к типу Medication[]
const rawMedicationsData = rawMedicationsDataJson as Medication[];

interface PetMedicationsScreenProps {
  pets: Pet[];
  onBack: () => void;
  onNavigate?: (screen: AppScreen) => void;
}

// Фильтруем препараты по питомцу
const getMedicationsForPet = (pet: Pet): Medication[] => {
  if (pet.age == null || pet.weight == null) return [];
  return rawMedicationsData.filter((med) =>
    med.species === pet.species &&
    pet.age >= med.age_min &&
    pet.age <= med.age_max &&
    pet.weight >= med.weight_min &&
    pet.weight <= med.weight_max
  );
};

// Компонент экрана
const PetMedicationsScreen: React.FC<PetMedicationsScreenProps> = ({ pets, onBack, onNavigate }) => {
  const { user } = useAuth();
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
    return nextDate.toLocaleDateString('ru-RU');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Календарь прививок и обработок</Text>
        <View style={{ width: 50 }} />
      </View>

      {pets.length === 0 ? (
        <View style={styles.noPets}>
          <Text style={styles.noPetsEmoji}>🐾</Text>
          <Text style={styles.noPetsText}>У вас ещё нет питомцев</Text>
          <Text style={styles.noPetsSubtext}>Добавьте питомца, чтобы увидеть календарь</Text>
          <TouchableOpacity 
            style={styles.addPetButton}
            onPress={() => onNavigate?.('addPet')}
          >
            <Text style={styles.addPetButtonText}>➕ Добавить питомца</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Выбор питомца */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.petSelector}>
            {pets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                style={[
                  styles.petButton,
                  selectedPet?.id === pet.id && styles.petButtonSelected,
                ]}
                onPress={() => setSelectedPet(pet)}
              >
                <Text style={[
                  styles.petButtonText,
                  selectedPet?.id === pet.id && styles.petButtonTextSelected
                ]}>
                  {pet.name} {pet.species === 'dog' ? '🐶' : '🐱'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Список медикаментов */}
          <ScrollView 
            contentContainerStyle={styles.medicationsContainer}
            showsVerticalScrollIndicator={false}
          >
            {medications.length === 0 ? (
              <View style={styles.noMedsContainer}>
                <Text style={styles.noMedsEmoji}>📋</Text>
                <Text style={styles.noMedsText}>
                  Нет подходящих препаратов для {selectedPet?.name}
                </Text>
                <Text style={styles.noMedsSubtext}>
                  Попробуйте обновить данные питомца (вес, возраст)
                </Text>
                <TouchableOpacity 
                  style={styles.updatePetButton}
                  onPress={() => onNavigate?.('addPet')}
                >
                  <Text style={styles.updatePetButtonText}>Перейти к питомцам</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.sectionTitle}>
                  Рекомендации для {selectedPet?.name}
                </Text>
                {medications.map((med) => (
                  <View key={med.id} style={styles.medCard}>
                    <View style={styles.medHeader}>
                      <Text style={styles.medName}>{med.name}</Text>
                      <View style={styles.medTypeBadge}>
                        <Text style={styles.medTypeBadgeText}>{med.type}</Text>
                      </View>
                    </View>
                    <Text style={styles.medNotes}>{med.notes}</Text>
                    <View style={styles.medFooter}>
                      <Text style={styles.medDateLabel}>Следующее применение:</Text>
                      <Text style={styles.medDate}>
                        {getNextApplicationDate(med.application_interval_days)}
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </ScrollView>
        </>
      )}

      {/* Bottom Navigation - используем компонент */}
      <BottomNav 
        currentScreen="medications" 
        onNavigate={(screen) => onNavigate?.(screen)} 
      />
    </SafeAreaView>
  );
};

export default PetMedicationsScreen;

// Стили
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F6F9F7' 
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F0EC',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#7A8F88',
    fontWeight: '500',
  },
  title: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#2F4F4F',
    flex: 1,
    textAlign: 'center',
  },

  noPets: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noPetsEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  noPetsText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2F4F4F',
    textAlign: 'center',
    marginBottom: 8,
  },
  noPetsSubtext: {
    fontSize: 16,
    color: '#7A8F88',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  addPetButton: {
    backgroundColor: '#7BC9A8',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 18,
    alignItems: 'center',
  },
  addPetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  petSelector: { 
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  petButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E8F0EC',
  },
  petButtonSelected: { 
    backgroundColor: '#7BC9A8',
    borderColor: '#7BC9A8',
  },
  petButtonText: { 
    fontSize: 15,
    color: '#2F4F4F',
    fontWeight: '500',
  },
  petButtonTextSelected: {
    color: '#FFFFFF',
  },

  medicationsContainer: { 
    paddingHorizontal: 16, 
    paddingBottom: 100, // Уменьшил отступ, так как BottomNav теперь внутри
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2F4F4F',
    marginBottom: 12,
    marginTop: 8,
  },

  noMedsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noMedsEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  noMedsText: { 
    textAlign: 'center', 
    fontSize: 18,
    color: '#2F4F4F',
    fontWeight: '600',
    marginBottom: 8,
  },
  noMedsSubtext: {
    textAlign: 'center',
    fontSize: 14,
    color: '#7A8F88',
    marginBottom: 20,
  },
  updatePetButton: {
    backgroundColor: '#E8F0EC',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  updatePetButtonText: {
    color: '#2F4F4F',
    fontSize: 14,
    fontWeight: '600',
  },

  medCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  medHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  medName: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#2F4F4F',
    flex: 1,
  },
  medTypeBadge: {
    backgroundColor: '#E8F0EC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  medTypeBadgeText: {
    fontSize: 12,
    color: '#2F4F4F',
    fontWeight: '500',
  },
  medNotes: { 
    fontSize: 14, 
    color: '#7A8F88', 
    marginBottom: 12,
    lineHeight: 20,
  },
  medFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E8F0EC',
  },
  medDateLabel: {
    fontSize: 13,
    color: '#7A8F88',
  },
  medDate: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#7BC9A8',
  },
});