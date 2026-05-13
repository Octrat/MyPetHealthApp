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
  ImageBackground,
  Dimensions,
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

const BASE_URL = 'http://192.168.0.59:3001';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const mainBg = require('./assets/images/ФонГлав.png');
const appLogo = require('./assets/images/Логотип.png');

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

  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [currentPetId, setCurrentPetId] = useState<number | null>(null);
  const [currentChatTitle, setCurrentChatTitle] = useState('Доктор Хвост');
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);

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

  const loadChats = async (): Promise<Chat[]> => {
    if (!user) return [];

    try {
      const token = await AsyncStorage.getItem('userToken');

      const response = await fetch(`${BASE_URL}/api/assistant/chats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Ошибка загрузки чатов:', error);
      return [];
    }
  };

  const createChatForPet = async (
    petId: number,
    petName: string
  ): Promise<Chat | null> => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const title = `Чат с ${petName}`;

      const response = await fetch(`${BASE_URL}/api/assistant/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          petId,
          title,
        }),
      });

      const newChat = await response.json();
      return newChat;
    } catch (error) {
      console.error('Ошибка создания чата:', error);
      return null;
    }
  };

  const createGeneralChat = async (): Promise<Chat | null> => {
    try {
      const token = await AsyncStorage.getItem('userToken');

      const response = await fetch(`${BASE_URL}/api/assistant/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          petId: null,
          title: 'Общий диалог',
        }),
      });

      const newChat = await response.json();
      return newChat;
    } catch (error) {
      console.error('Ошибка создания общего чата:', error);
      return null;
    }
  };

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

  const initializeChats = async () => {
    setIsLoadingChat(true);

    try {
      let loadedChats = await loadChats();

      if (!loadedChats) {
        loadedChats = [];
      }

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
      const timer = setTimeout(() => {
        setAppState(user ? 'main' : 'login');
      }, 2000);

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

  if (isLoading || appState === 'splash') {
    return <SplashScreen />;
  }

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

  if (appState === 'register') {
    return (
      <RegisterScreen
        onRegister={() => setAppState('main')}
        onSwitchToLogin={() => setAppState('login')}
      />
    );
  }

  if (appState === 'addPet') {
    return (
      <AddPetScreen
        onBack={() => setAppState('main')}
        onNavigate={(screen: AppScreen) => setAppState(screen)}
      />
    );
  }

  if (appState === 'profile') {
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
  }

  if (appState === 'medications') {
    return (
      <PetMedicationsScreen
        onBack={() => setAppState('main')}
        pets={pets}
        onNavigate={(screen: AppScreen) => setAppState(screen)}
      />
    );
  }

  if (appState === 'admin-panel') {
    return (
      <AdminPanel
        onNavigate={(screen) => {
          if (screen === 'main') {
            setAppState('main');
          } else {
            setAppState(screen as AppScreen);
          }
        }}
        onLogout={async () => {
          await logout();
          setAppState('login');
        }}
      />
    );
  }

  return (
    <ImageBackground
      source={mainBg}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent
        />

        <ScrollView
          style={styles.mainScroll}
          contentContainerStyle={styles.mainScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.screenContent}>
            <View style={styles.header}>
              <Text style={styles.title}>HealthyPaws</Text>

              <View style={styles.subtitleBadge}>
                <Text style={styles.subtitle}>Забота о здоровье питомца</Text>
              </View>
            </View>

            <View style={styles.petSelectorWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.petSelector}
                contentContainerStyle={styles.petSelectorContent}
                nestedScrollEnabled
                bounces={false}
                overScrollMode="never"
              >
                <TouchableOpacity
                  style={[
                    styles.petChip,
                    !currentPetId && styles.petChipActive,
                  ]}
                  onPress={switchToGeneralChat}
                  disabled={isLoadingChat}
                  activeOpacity={0.85}
                >
                  <View
                    style={[
                      styles.petChipIconCircle,
                      !currentPetId && styles.petChipIconCircleActive,
                    ]}
                  >
                    <Text style={styles.petChipIcon}>🩺</Text>
                  </View>

                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[
                      styles.petChipText,
                      !currentPetId && styles.petChipTextActive,
                    ]}
                  >
                    Общий
                  </Text>
                </TouchableOpacity>

                {pets.map((pet) => (
                  <TouchableOpacity
                    key={pet.id}
                    style={[
                      styles.petChip,
                      currentPetId === pet.id && styles.petChipActive,
                    ]}
                    onPress={() => switchToPetChat(pet)}
                    disabled={isLoadingChat}
                    activeOpacity={0.85}
                  >
                    <View
                      style={[
                        styles.petChipIconCircle,
                        currentPetId === pet.id &&
                          styles.petChipIconCircleActive,
                      ]}
                    >
                      <Text style={styles.petChipIcon}>
                        {pet.species === 'dog' ? '🐶' : '🐱'}
                      </Text>
                    </View>

                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={[
                        styles.petChipText,
                        currentPetId === pet.id && styles.petChipTextActive,
                      ]}
                    >
                      {pet.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.chatContainer}>
              {isLoadingChat ? (
                <View style={styles.loadingChat}>
                  <ActivityIndicator size="large" color="#123F32" />
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
                  <ActivityIndicator size="large" color="#123F32" />
                  <Text style={styles.loadingChatText}>Загрузка...</Text>
                </View>
              )}
            </View>

            {!loadingPets && pets.length > 0 && (
              <View style={styles.statsCard}>
                <View style={styles.statsHeader}>
                  <View style={styles.statsTitleBlock}>
                    <Text style={styles.statsTitle}>Статистика питомцев</Text>
                    <Text style={styles.statsSubtitle}>
                      Краткий обзор ваших животных
                    </Text>
                  </View>

                  <View style={styles.statsLogoCircle}>
                    <Image
                      source={appLogo}
                      style={styles.statsLogo}
                      resizeMode="contain"
                    />
                  </View>
                </View>

                <Text style={styles.statsCount}>
                  {pets.length}{' '}
                  {pets.length === 1
                    ? 'питомец'
                    : pets.length < 5
                      ? 'питомца'
                      : 'питомцев'}
                </Text>

                <View style={styles.statsRow}>
                  <View style={styles.statBadge}>
                    <Text style={styles.statBadgeIcon}>🐶</Text>
                    <Text style={styles.statBadgeText}>
                      {pets.filter((p) => p.species === 'dog').length} собак
                    </Text>
                  </View>

                  <View style={styles.statBadge}>
                    <Text style={styles.statBadgeIcon}>🐱</Text>
                    <Text style={styles.statBadgeText}>
                      {pets.filter((p) => p.species === 'cat').length} кошек
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.viewPetsButton}
                  onPress={() => setAppState('addPet')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.viewPetsButtonText}>
                    Управление питомцами
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {!loadingPets && pets.length === 0 && (
              <View style={styles.emptyStateCard}>
                <View style={styles.emptyLogoCircle}>
                  <Image
                    source={appLogo}
                    style={styles.emptyLogo}
                    resizeMode="contain"
                  />
                </View>

                <Text style={styles.emptyStateTitle}>Питомцев пока нет</Text>

                <Text style={styles.emptyStateText}>
                  Добавьте первого питомца, чтобы получать персональные
                  рекомендации и вести отдельный диалог.
                </Text>

                <TouchableOpacity
                  style={styles.addPetButton}
                  onPress={() => setAppState('addPet')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.addPetButtonText}>Добавить питомца</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        <BottomNav
          currentScreen="main"
          onNavigate={(screen: AppScreen) => setAppState(screen)}
        />
      </SafeAreaView>
    </ImageBackground>
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
  background: {
    flex: 1,
    backgroundColor: '#F1FFC8',
  },

  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  mainScroll: {
    flex: 1,
  },

mainScrollContent: {
  paddingBottom: 140,
},

  screenContent: {
    paddingHorizontal: 18,
    paddingTop: 40,
  },

  header: {
    minHeight: 96,
    marginBottom: 14,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },

  title: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '900',
    color: '#123F32',
    letterSpacing: -1.2,
    textShadowColor: 'rgba(255, 255, 255, 0.85)',
    textShadowOffset: {
      width: 0,
      height: 2,
    },
    textShadowRadius: 8,
  },

  subtitleBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#EEF2E5',
  },

  subtitle: {
    fontSize: 15,
    color: '#35594F',
    fontWeight: '600',
  },

  petSelectorWrapper: {
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF2E5',
    justifyContent: 'center',
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#123F32',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 3,
  },

  petSelector: {
    maxHeight: 64,
  },

  petSelectorContent: {
    paddingLeft: 8,
    paddingRight: 14,
    alignItems: 'center',
    gap: 8,
  },

  petChip: {
    height: 54,
    maxWidth: 150,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingLeft: 6,
    paddingRight: 16,
    borderRadius: 28,
    gap: 8,
    overflow: 'hidden',
  },

  petChipActive: {
    backgroundColor: '#F1FFC8',
  },

  petChipIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FFD9',
    borderWidth: 1,
    borderColor: '#EEF2E5',
  },

  petChipIconCircleActive: {
    borderWidth: 2,
    borderColor: '#DDECB1',
    backgroundColor: '#FFFFFF',
  },

  petChipIcon: {
    fontSize: 20,
  },

  petChipText: {
    flexShrink: 1,
    maxWidth: 90,
    fontSize: 15,
    fontWeight: '700',
    color: '#123F32',
  },

  petChipTextActive: {
    color: '#123F32',
  },

  chatContainer: {
    height: SCREEN_HEIGHT * 0.52,
    minHeight: 410,
    backgroundColor: '#FF5C68',
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#123F32',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 6,
  },

  loadingChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FFD9',
  },

  loadingChatText: {
    marginTop: 12,
    color: '#35594F',
    fontSize: 15,
  },

  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#EEF2E5',
    shadowColor: '#123F32',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 4,
  },

  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  statsTitleBlock: {
    flex: 1,
    paddingRight: 12,
  },

  statsTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#123F32',
  },

  statsSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: '#35594F',
  },

  statsLogoCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FF5C68',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statsLogo: {
    width: 36,
    height: 36,
  },

  statsCount: {
    marginTop: 12,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '800',
    color: '#123F32',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    marginBottom: 14,
  },

  statBadge: {
    flex: 1,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1FFC8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 23,
    gap: 6,
  },

  statBadgeIcon: {
    fontSize: 18,
  },

  statBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#123F32',
  },

  viewPetsButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#123F32',
    alignItems: 'center',
    justifyContent: 'center',
  },

  viewPetsButtonText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 22,
    marginBottom: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEF2E5',
    shadowColor: '#123F32',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 4,
  },

  emptyLogoCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FF5C68',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  emptyLogo: {
    width: 54,
    height: 54,
  },

  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#123F32',
    marginBottom: 6,
  },

  emptyStateText: {
    fontSize: 14,
    color: '#35594F',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },

  addPetButton: {
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: '#123F32',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addPetButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});