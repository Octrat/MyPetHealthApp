// App.tsx
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AddPetScreen from './components/AddPetScreen';
import SplashScreen from './components/SplashScreen';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import ProfileScreen from './components/ProfileScreen';
import PetMedicationsScreen from './components/PetMedicationsScreen';
import PetAssistant from './components/PetAssistant';
import BottomNav from './components/BottomNav';
import AdminPanel from './components/admin/AdminPanel';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AuthProvider, useAuth } from './src/hooks/AuthContext';
import { petsAPI } from './src/services/api';
import { Pet } from './src/types';
import { AppScreen } from './src/types/navigation';

const BASE_URL = 'http://192.168.0.29:3001';

interface Chat {
  id: number;
  pet_id: number | null;
  pet_name?: string;
  pet_species?: string;
  title: string;
  messages: any[];
  created_at: string;
  updated_at: string;
}

function MainApp() {
  const [appState, setAppState] = useState<AppScreen>('splash');
  const { user, logout, isLoading } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loadingPets, setLoadingPets] = useState(false);
  
  // Состояния для чата
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [currentPetId, setCurrentPetId] = useState<number | null>(null);
  const [currentChatTitle, setCurrentChatTitle] = useState('Доктор Хвост');
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  const isActive = (screen: AppScreen) => {
    return appState === screen;
  };

  const loadPets = async () => {
    if (!user) return;
    setLoadingPets(true);
    try {
      const data = await petsAPI.getPets(user.id);
      setPets(data);
    } catch (err) {
      console.log('Ошибка загрузки питомцев', err);
    } finally {
      setLoadingPets(false);
    }
  };

  // Загрузка списка чатов
  const loadChats = async (): Promise<Chat[]> => {
    if (!user) return [];
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${BASE_URL}/api/assistant/chats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Ошибка загрузки чатов:', error);
      return [];
    }
  };

  // Создание чата для питомца
  const createChatForPet = async (petId: number, petName: string): Promise<Chat | null> => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const title = `Чат с ${petName}`;
      const response = await fetch(`${BASE_URL}/api/assistant/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ petId, title }),
      });
      const newChat = await response.json();
      return newChat;
    } catch (error) {
      console.error('Ошибка создания чата:', error);
      return null;
    }
  };

  // Создание общего чата
  const createGeneralChat = async (): Promise<Chat | null> => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${BASE_URL}/api/assistant/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ petId: null, title: 'Общий диалог' }),
      });
      const newChat = await response.json();
      return newChat;
    } catch (error) {
      console.error('Ошибка создания общего чата:', error);
      return null;
    }
  };

  // Переключение на общий чат
  const switchToGeneralChat = async () => {
    setIsLoadingChat(true);
    try {
      let generalChat = chats.find((c: Chat) => !c.pet_id);
      
      if (!generalChat) {
        const newChat = await createGeneralChat();
        if (newChat) {
          generalChat = newChat;
          setChats((prev: Chat[]) => [...prev, newChat]);
        }
      }
      
      if (generalChat) {
        setCurrentChatId(generalChat.id);
        setCurrentPetId(null);
        setCurrentChatTitle(generalChat.title);
      }
    } catch (error) {
      console.error('Ошибка переключения на общий чат:', error);
    } finally {
      setIsLoadingChat(false);
    }
  };

  // Переключение на чат питомца
  const switchToPetChat = async (pet: Pet) => {
    setIsLoadingChat(true);
    try {
      let petChat = chats.find((c: Chat) => c.pet_id === pet.id);
      
      if (!petChat) {
        const newChat = await createChatForPet(pet.id, pet.name);
        if (newChat) {
          petChat = newChat;
          setChats((prev: Chat[]) => [...prev, newChat]);
        }
      }
      
      if (petChat) {
        setCurrentChatId(petChat.id);
        setCurrentPetId(pet.id);
        setCurrentChatTitle(petChat.title);
      }
    } catch (error) {
      console.error('Ошибка переключения на чат питомца:', error);
    } finally {
      setIsLoadingChat(false);
    }
  };

  // Инициализация чатов при загрузке
  const initializeChats = async () => {
    setIsLoadingChat(true);
    try {
      let loadedChats = await loadChats();
      if (!loadedChats) loadedChats = [];
      
      let generalChat = loadedChats.find((c: Chat) => !c.pet_id);
      if (!generalChat) {
        const newGeneralChat = await createGeneralChat();
        if (newGeneralChat) {
          generalChat = newGeneralChat;
          loadedChats.push(newGeneralChat);
        }
      }
      
      for (const pet of pets) {
        const hasChat = loadedChats.some((c: Chat) => c.pet_id === pet.id);
        if (!hasChat) {
          const newChat = await createChatForPet(pet.id, pet.name);
          if (newChat) {
            loadedChats.push(newChat);
          }
        }
      }
      
      setChats(loadedChats);
      
      if (generalChat && !currentChatId) {
        setCurrentChatId(generalChat.id);
        setCurrentPetId(null);
        setCurrentChatTitle(generalChat.title);
      }
    } catch (error) {
      console.error('Ошибка инициализации чатов:', error);
    } finally {
      setIsLoadingChat(false);
    }
  };

  useEffect(() => {
    if (appState === 'splash') {
      const timer = setTimeout(() => setAppState(user ? 'main' : 'login'), 2000);
      return () => clearTimeout(timer);
    }
  }, [appState, user]);

  useEffect(() => {
    if (appState === 'main') {
      loadPets();
    }
  }, [appState, user]);

  useEffect(() => {
    if (pets.length > 0 && user && appState === 'main') {
      initializeChats();
    }
  }, [pets, user, appState]);

  if (isLoading || appState === 'splash') return <SplashScreen />;
  
  if (appState === 'login') {
    return (
      <LoginScreen 
        onSwitchToRegister={() => setAppState('register')}
        onLoginSuccess={(userRole) => {
          if (userRole === 'admin') {
            setAppState('admin-panel');
          } else {
            setAppState('main');
          }
        }}
      />
    );
  }
  
  if (appState === 'register')
    return (
      <RegisterScreen 
        onRegister={() => setAppState('main')} 
        onSwitchToLogin={() => setAppState('login')} 
      />
    );
  
  if (appState === 'addPet') 
    return (
      <AddPetScreen 
        onBack={() => setAppState('main')}
        onNavigate={(screen: AppScreen) => setAppState(screen)}
      />
    );
  
  if (appState === 'profile')
    return (
      <ProfileScreen
        onBack={() => setAppState('main')}
        onLogout={async () => {
          await logout();
          setAppState('login');
        }}
        onNavigate={(screen: AppScreen) => setAppState(screen)}
      />
    );
  
  if (appState === 'medications')
    return (
      <PetMedicationsScreen
        onBack={() => setAppState('main')}
        pets={pets}
        onNavigate={(screen: AppScreen) => setAppState(screen)}
      />
    );
  
  if (appState === 'admin-panel') {
    return (
      <AdminPanel
        onBack={() => setAppState('main')}
        onNavigate={(screen) => setAppState(screen as AppScreen)}
      />
    );
  }

  // Главный экран с чатом и переключателем питомцев
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F9F7" />

      <View style={styles.header}>
        <Text style={styles.title}>🐾 HealthyPaws</Text>
      </View>

      {/* Переключатель питомцев */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.petSelector}
        contentContainerStyle={styles.petSelectorContent}
      >
        <TouchableOpacity
          style={[
            styles.petChip,
            !currentPetId && styles.petChipActive
          ]}
          onPress={switchToGeneralChat}
          disabled={isLoadingChat}
        >
          <Text style={styles.petChipIcon}>🩺</Text>
          <Text style={[
            styles.petChipText,
            !currentPetId && styles.petChipTextActive
          ]}>Общий диалог</Text>
        </TouchableOpacity>

        {pets.map(pet => (
          <TouchableOpacity
            key={pet.id}
            style={[
              styles.petChip,
              currentPetId === pet.id && styles.petChipActive
            ]}
            onPress={() => switchToPetChat(pet)}
            disabled={isLoadingChat}
          >
            <Text style={styles.petChipIcon}>
              {pet.species === 'dog' ? '🐶' : '🐱'}
            </Text>
            <Text style={[
              styles.petChipText,
              currentPetId === pet.id && styles.petChipTextActive
            ]}>
              {pet.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Чат */}
      <View style={styles.chatContainer}>
        {isLoadingChat ? (
          <View style={styles.loadingChat}>
            <ActivityIndicator size="large" color="#7BC9A8" />
            <Text style={styles.loadingChatText}>Загрузка диалога...</Text>
          </View>
        ) : currentChatId ? (
          <PetAssistant
            key={currentChatId}
            currentChatId={currentChatId}
            currentPetId={currentPetId}
            chatTitle={currentChatTitle}
            onBack={() => {}}
            onMessagesLoaded={() => {}}
          />
        ) : (
          <View style={styles.loadingChat}>
            <ActivityIndicator size="large" color="#7BC9A8" />
            <Text style={styles.loadingChatText}>Загрузка...</Text>
          </View>
        )}
      </View>

      {/* Статистика питомцев */}
      {!loadingPets && pets.length > 0 && (
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>📊 Ваши питомцы</Text>
          <Text style={styles.statsCount}>
            {pets.length} {pets.length === 1 ? 'питомец' : pets.length < 5 ? 'питомца' : 'питомцев'}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statBadge}>
              <Text style={styles.statBadgeIcon}>🐶</Text>
              <Text style={styles.statBadgeText}>
                {pets.filter(p => p.species === 'dog').length} собак
              </Text>
            </View>
            <View style={styles.statBadge}>
              <Text style={styles.statBadgeIcon}>🐱</Text>
              <Text style={styles.statBadgeText}>
                {pets.filter(p => p.species === 'cat').length} кошек
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.viewPetsButton}
            onPress={() => setAppState('addPet')}
          >
            <Text style={styles.viewPetsButtonText}>Управление питомцами →</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loadingPets && pets.length === 0 && (
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateEmoji}>🐕‍🦺</Text>
          <Text style={styles.emptyStateTitle}>Нет питомцев</Text>
          <Text style={styles.emptyStateText}>
            Добавьте своего первого питомца, чтобы получать персональные рекомендации
          </Text>
          <TouchableOpacity 
            style={styles.addPetButton}
            onPress={() => setAppState('addPet')}
          >
            <Text style={styles.addPetButtonText}>➕ Добавить питомца</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Нижняя навигация */}
      <BottomNav 
        currentScreen="main" 
        onNavigate={(screen: AppScreen) => setAppState(screen)} 
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F9F7' },
  header: {
    height: 70,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#2F4F4F' },
  
  petSelector: {
    maxHeight: 60,
    marginTop: 16,
    marginBottom: 8,
  },
  petSelectorContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  petChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E8F0EC',
    gap: 8,
  },
  petChipActive: {
    backgroundColor: '#7BC9A8',
    borderColor: '#7BC9A8',
  },
  petChipIcon: {
    fontSize: 18,
  },
  petChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2F4F4F',
  },
  petChipTextActive: {
    color: '#FFFFFF',
  },
  
  chatContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  loadingChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingChatText: {
    marginTop: 12,
    color: '#7A8F88',
  },

  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7A8F88',
    marginBottom: 4,
  },
  statsCount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2F4F4F',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FCFA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statBadgeIcon: {
    fontSize: 14,
  },
  statBadgeText: {
    fontSize: 13,
    color: '#2F4F4F',
  },
  viewPetsButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  viewPetsButtonText: {
    fontSize: 13,
    color: '#7BC9A8',
    fontWeight: '500',
  },

  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2F4F4F',
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#7A8F88',
    textAlign: 'center',
    marginBottom: 16,
  },
  addPetButton: {
    backgroundColor: '#7BC9A8',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 18,
    alignItems: 'center',
  },
  addPetButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});