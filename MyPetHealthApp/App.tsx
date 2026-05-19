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
import { Asset } from 'expo-asset';

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

const mainBg = require('./assets/images/ФонГлав.jpg');
const lightCardBg = require('./assets/images/ФонГлавБел.jpg');
const appLogo = require('./assets/images/Логотип.png');

const imagesToPreload = [mainBg, lightCardBg, appLogo];

const COLORS = {
  pageBg: '#F7F0FF',
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
};

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
    <View style={styles.background}>
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
                <Text style={styles.subtitle}>
                  Забота о здоровье питомца
                </Text>
              </View>
            </View>

            <ImageBackground
              source={lightCardBg}
              style={styles.petSelectorWrapper}
              imageStyle={styles.patternCardImage}
              resizeMode="cover"
            >
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
            </ImageBackground>

            <View style={styles.chatContainer}>
              <ImageBackground
                source={lightCardBg}
                style={styles.chatBackground}
                imageStyle={styles.patternCardImage}
                resizeMode="cover"
              >
                {isLoadingChat ? (
                  <View style={styles.loadingChat}>
                    <ActivityIndicator size="large" color={COLORS.accentDark} />
                    <Text style={styles.loadingChatText}>
                      Загрузка диалога...
                    </Text>
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
                    <ActivityIndicator size="large" color={COLORS.accentDark} />
                    <Text style={styles.loadingChatText}>Загрузка...</Text>
                  </View>
                )}
              </ImageBackground>
            </View>

            {!loadingPets && pets.length > 0 && (
              <ImageBackground
                source={lightCardBg}
                style={styles.statsCard}
                imageStyle={styles.patternCardImage}
                resizeMode="cover"
              >
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
              </ImageBackground>
            )}

            {!loadingPets && pets.length === 0 && (
              <ImageBackground
                source={lightCardBg}
                style={styles.emptyStateCard}
                imageStyle={styles.patternCardImage}
                resizeMode="cover"
              >
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
              </ImageBackground>
            )}
          </View>
        </ScrollView>

        <BottomNav
          currentScreen="main"
          onNavigate={(screen: AppScreen) => setAppState(screen)}
        />
      </SafeAreaView>
    </View>
  );
}

export default function App() {
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  useEffect(() => {
    const loadAssets = async () => {
      try {
        await Asset.loadAsync(imagesToPreload);
      } catch (error) {
        console.log('Ошибка предзагрузки картинок:', error);
      } finally {
        setAssetsLoaded(true);
      }
    };

    loadAssets();
  }, []);

  if (!assetsLoaded) {
    return <SplashScreen />;
  }

  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: COLORS.pageBg,
  },

  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  mainScroll: {
    flex: 1,
  },

  mainScrollContent: {
    paddingBottom: 125,
  },

  screenContent: {
    paddingHorizontal: 18,
    paddingTop: 36,
  },

  header: {
    minHeight: 94,
    marginBottom: 14,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },

  title: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -1.1,
  },

  subtitleBadge: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  subtitle: {
    fontSize: 15,
    color: COLORS.textSoft,
    fontWeight: '700',
  },

  patternCardImage: {
    borderRadius: 28,
  },

  petSelectorWrapper: {
    minHeight: 78,
    borderRadius: 28,
    justifyContent: 'center',
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 4,
  },

  petSelector: {
    maxHeight: 70,
  },

  petSelectorContent: {
    paddingLeft: 10,
    paddingRight: 14,
    alignItems: 'center',
    gap: 8,
  },

  petChip: {
    height: 56,
    maxWidth: 160,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingLeft: 6,
    paddingRight: 16,
    borderRadius: 28,
    gap: 8,
  },

  petChipActive: {
    backgroundColor: COLORS.accent,
  },

  petChipIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  petChipIconCircleActive: {
    backgroundColor: COLORS.white,
    borderColor: 'transparent',
    borderWidth: 0,
  },

  petChipIcon: {
    fontSize: 20,
  },

  petChipText: {
    flexShrink: 1,
    maxWidth: 90,
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },

  petChipTextActive: {
    color: COLORS.white,
  },

  chatContainer: {
    height: SCREEN_HEIGHT * 0.47,
    minHeight: 350,
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.13,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 6,
  },

  chatBackground: {
    flex: 1,
    borderRadius: 30,
    overflow: 'hidden',
  },

  loadingChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingChatText: {
    marginTop: 12,
    color: COLORS.textSoft,
    fontSize: 15,
    fontWeight: '600',
  },

  statsCard: {
    borderRadius: 28,
    padding: 18,
    marginBottom: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.12,
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
    fontWeight: '900',
    color: COLORS.text,
  },

  statsSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: COLORS.textSoft,
    fontWeight: '500',
  },

  statsLogoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statsLogo: {
    width: 38,
    height: 38,
  },

  statsCount: {
    marginTop: 12,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
    color: COLORS.text,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    marginBottom: 14,
  },

  statBadge: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 23,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statBadgeIcon: {
    fontSize: 18,
  },

  statBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },

  viewPetsButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },

  viewPetsButtonText: {
    fontSize: 15,
    color: COLORS.white,
    fontWeight: '800',
  },

  emptyStateCard: {
    borderRadius: 28,
    padding: 22,
    marginBottom: 18,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 4,
  },

  emptyLogoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  emptyLogo: {
    width: 56,
    height: 56,
  },

  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 6,
  },

  emptyStateText: {
    fontSize: 14,
    color: COLORS.textSoft,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    fontWeight: '500',
  },

  addPetButton: {
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },

  addPetButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },
});