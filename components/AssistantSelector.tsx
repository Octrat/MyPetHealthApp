// components/AssistantSelector.tsx
// AssistantSelector.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,  // ← ДОБАВЬТЕ ЭТУ СТРОКУ
} from 'react-native';
import { Pet } from '../src/types';

interface AssistantSelectorProps {
  pets: Pet[];
  selectedAssistant: 'general' | number;
  onSelect: (assistant: 'general' | number) => void;
}

export default function AssistantSelector({ pets, selectedAssistant, onSelect }: AssistantSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🤖 Выберите ассистента</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {/* Общий ассистент */}
        <TouchableOpacity
          style={[
            styles.assistantCard,
            selectedAssistant === 'general' && styles.assistantCardActive,
          ]}
          onPress={() => onSelect('general')}
        >
          <Text style={styles.assistantIcon}>🩺</Text>
          <Text style={[
            styles.assistantName,
            selectedAssistant === 'general' && styles.assistantNameActive,
          ]}>
            Общий
          </Text>
          <Text style={styles.assistantDesc}>
            Вопросы о любых питомцах
          </Text>
        </TouchableOpacity>

        {/* Ассистенты для каждого питомца */}
        {pets.map((pet) => (
          <TouchableOpacity
            key={pet.id}
            style={[
              styles.assistantCard,
              selectedAssistant === pet.id && styles.assistantCardActive,
            ]}
            onPress={() => onSelect(pet.id)}
          >
            {pet.photo_url ? (
              <Image 
                source={{ uri: pet.photo_url }}
                style={styles.assistantAvatar}
              />
            ) : (
              <Text style={styles.assistantIcon}>
                {pet.species === 'dog' ? '🐶' : '🐱'}
              </Text>
            )}
            <Text style={[
              styles.assistantName,
              selectedAssistant === pet.id && styles.assistantNameActive,
            ]}>
              {pet.name}
            </Text>
            <Text style={styles.assistantDesc}>
              {pet.age ? `${pet.age} лет` : 'Возраст не указан'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2F4F4F',
    marginBottom: 12,
  },
  assistantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    width: 100,
    borderWidth: 1,
    borderColor: '#E8F0EC',
  },
  assistantCardActive: {
    borderColor: '#7BC9A8',
    backgroundColor: '#F8FCFA',
  },
  assistantIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  assistantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 8,
  },
  assistantName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2F4F4F',
    marginBottom: 4,
  },
  assistantNameActive: {
    color: '#7BC9A8',
  },
  assistantDesc: {
    fontSize: 10,
    color: '#7A8F88',
    textAlign: 'center',
  },
});