// components/PetPedigree.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Pet } from '../src/types';

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
  border: '#EADDF8',
  shadow: '#8E78A8',
};

interface PetPedigreeProps {
  visible: boolean;
  pet: Pet;
  onClose: () => void;
}

export default function PetPedigree({
  visible,
  pet,
  onClose,
}: PetPedigreeProps) {
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
              Информация о происхождении питомца
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
          </ImageBackground>

          <ImageBackground
            source={cardBg}
            style={styles.card}
            imageStyle={styles.cardImage}
            resizeMode="cover"
          >
            <Text style={styles.sectionTitle}>Данные родословной</Text>

            <View style={styles.emptyBlock}>
              <View style={styles.emptyIconCircle}>
                <Ionicons
                  name="document-text-outline"
                  size={32}
                  color={COLORS.white}
                />
              </View>

              <Text style={styles.emptyTitle}>Родословная пока не заполнена</Text>

              <Text style={styles.emptyText}>
                Здесь можно будет хранить информацию о родителях, заводчике,
                клубе, номере документа и поколениях питомца.
              </Text>
            </View>
          </ImageBackground>

          <ImageBackground
            source={cardBg}
            style={styles.card}
            imageStyle={styles.cardImage}
            resizeMode="cover"
          >
            <Text style={styles.sectionTitle}>Что можно добавить позже</Text>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="paw-outline" size={20} color={COLORS.white} />
              </View>
              <Text style={styles.infoText}>Клички родителей питомца</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons
                  name="ribbon-outline"
                  size={20}
                  color={COLORS.white}
                />
              </View>
              <Text style={styles.infoText}>Номер родословной или клуба</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons
                  name="business-outline"
                  size={20}
                  color={COLORS.white}
                />
              </View>
              <Text style={styles.infoText}>Информация о заводчике</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={COLORS.white}
                />
              </View>
              <Text style={styles.infoText}>Дата выдачи документа</Text>
            </View>
          </ImageBackground>

          <TouchableOpacity
            style={styles.closeMainButton}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.closeMainButtonText}>Закрыть</Text>
          </TouchableOpacity>
        </ScrollView>
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
    shadowOffset: {
      width: 0,
      height: 10,
    },
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

  card: {
    borderRadius: 32,
    padding: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 4,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 16,
  },

  emptyBlock: {
    alignItems: 'center',
    paddingVertical: 18,
  },

  emptyIconCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSoft,
    fontWeight: '600',
    textAlign: 'center',
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },

  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '800',
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
    shadowOffset: {
      width: 0,
      height: 7,
    },
    elevation: 5,
  },

  closeMainButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '900',
  },
});