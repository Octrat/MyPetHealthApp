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
// Импорт:
import { SafeAreaView } from 'react-native-safe-area-context';
import AddPetScreen from './components/AddPetScreen';
import SplashScreen from './components/SplashScreen';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import ProfileScreen from './components/ProfileScreen';
import PetMedicationsScreen from './components/PetMedicationsScreen';
import PetAssistant from './components/PetAssistant';

import { AuthProvider, useAuth } from './src/hooks/AuthContext';
import { petsAPI } from './src/services/api';
import { Pet } from './src/types';
import { AppScreen } from './src/types/navigation';

const BASE_URL = 'http://192.168.0.29:3001';

function MainApp() {
  const isActive = (screen: AppScreen) => {
    return appState === screen;
  };
  
  const [appState, setAppState] = useState<AppScreen>('splash');
  const { user, logout, isLoading } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loadingPets, setLoadingPets] = useState(false);

  useEffect(() => {
    if (appState === 'splash') {
      const timer = setTimeout(() => setAppState(user ? 'main' : 'login'), 2000);
      return () => clearTimeout(timer);
    }
  }, [appState, user]);

  useEffect(() => {
    if (user && appState === 'login') setAppState('main');
  }, [user, appState]);

  useEffect(() => {
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
    if (appState === 'main') loadPets();
  }, [appState, user]);

  if (isLoading || appState === 'splash') return <SplashScreen />;
  
  if (appState === 'login') 
    return <LoginScreen onSwitchToRegister={() => setAppState('register')} />;
  
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

  // Main screen - с AI помощником
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F9F7" />

      <View style={styles.header}>
        <Text style={styles.title}>🐾 HealthyPaws</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Добро пожаловать!</Text>
          <Text style={styles.welcomeText}>
            Заботьтесь о здоровье вашего питомца вместе с HealthyPaws.
          </Text>
        </View>

        <TouchableOpacity style={styles.addPetButton} onPress={() => setAppState('addPet')}>
          <Text style={styles.addPetButtonText}>🐾 Управление питомцами</Text>
        </TouchableOpacity>

        {/* Статистика или полезная информация */}
        {!loadingPets && pets.length > 0 && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>📊 Ваши питомцы</Text>
            <Text style={styles.statsCount}>
              У вас {pets.length} {pets.length === 1 ? 'питомец' : pets.length < 5 ? 'питомца' : 'питомцев'}
            </Text>
            <TouchableOpacity 
              style={styles.viewPetsButton}
              onPress={() => setAppState('addPet')}
            >
              <Text style={styles.viewPetsButtonText}>Посмотреть всех →</Text>
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
          </View>
        )}

        {/* 🤖 AI ПОМОЩНИК */}
        <PetAssistant />

      </ScrollView>

      <View style={styles.bottomNav}>
        {/* 📅 Календарь */}
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => setAppState('medications')}
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
          onPress={() => setAppState('main')}
        >
          <Text style={[
            styles.navText,
            isActive('main') && styles.activeNavText
          ]}>
            🏠
          </Text>
        </TouchableOpacity>

        {/* 🐶 Питомцы */}
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => setAppState('addPet')}
        >
          <Text style={styles.navText}>
            🐶
          </Text>
        </TouchableOpacity>

        {user && (
          <TouchableOpacity 
            style={[
              styles.profileButton,
              isActive('profile') && styles.activeProfileButton
            ]} 
            onPress={() => setAppState('profile')}
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

  content: { padding: 16, paddingBottom: 120 },

  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    marginBottom: 20,
  },

  welcomeTitle: { fontSize: 20, fontWeight: '700', color: '#2F4F4F' },

  welcomeText: { fontSize: 16, color: '#7A8F88' },

  addPetButton: {
    backgroundColor: '#7BC9A8',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 16,
  },

  addPetButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

  // Стили для статистики
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2F4F4F',
    marginBottom: 8,
  },
  statsCount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#7BC9A8',
    marginBottom: 12,
  },
  viewPetsButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  viewPetsButtonText: {
    fontSize: 14,
    color: '#7BC9A8',
    fontWeight: '500',
  },

  // Стили для пустого состояния
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2F4F4F',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#7A8F88',
    textAlign: 'center',
    lineHeight: 20,
  },

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