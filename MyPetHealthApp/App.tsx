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
import BottomNav from './components/BottomNav'; // Добавляем импорт BottomNav
import AdminPanel from './components/admin/AdminPanel'; // ← добавляем админ-панель


import { AuthProvider, useAuth } from './src/hooks/AuthContext';
import { petsAPI } from './src/services/api';
import { Pet } from './src/types';
import { AppScreen } from './src/types/navigation';

const BASE_URL = 'http://192.168.0.34:3001';

function MainApp() {
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

  // Удаляем автоматическое перенаправление, теперь оно через onLoginSuccess
  // useEffect(() => {
  //   if (user && appState === 'login') setAppState('main');
  // }, [user, appState]);

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
  
  // Обновленный LoginScreen с onLoginSuccess
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
  
  // ← НОВЫЙ ЭКРАН для админ-панели
  if (appState === 'admin-panel') {
    return (
      <AdminPanel
        onBack={() => setAppState('main')}
        onNavigate={(screen) => setAppState(screen as AppScreen)}
      />
    );
  }

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

      {/* Используем компонент BottomNav вместо дублирующегося кода */}
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

  content: { padding: 16, paddingBottom: 100 }, // Уменьшил отступ, так как BottomNav теперь внутри

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
});