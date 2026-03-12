// App.tsx
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image
} from 'react-native';

import AddPetScreen from './components/AddPetScreen';
import SplashScreen from './components/SplashScreen';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import ProfileScreen from './components/ProfileScreen';

import { AuthProvider, useAuth } from './src/hooks/AuthContext';
import { petsAPI } from './src/services/api';
import { Pet } from './src/types';
import { analyzePetHealthByCategory, SizeCategory } from './src/utils/healthCheck';

const BASE_URL = 'http://192.168.0.59:3001';

type AppState = 'splash' | 'login' | 'register' | 'main' | 'profile' | 'addPet';

function MainApp() {
  const [appState, setAppState] = useState<AppState>('splash');
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
  if (appState === 'login') return <LoginScreen onSwitchToRegister={() => setAppState('register')} />;
  if (appState === 'register')
    return <RegisterScreen onRegister={() => setAppState('main')} onSwitchToLogin={() => setAppState('login')} />;
  if (appState === 'addPet') return <AddPetScreen onBack={() => setAppState('main')} />;
  if (appState === 'profile')
    return (
      <ProfileScreen
        onBack={() => setAppState('main')}
        onLogout={async () => {
          await logout();
          setAppState('login');
        }}
      />
    );

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
          <Text style={styles.addPetButtonText}>➕ Добавить питомца</Text>
        </TouchableOpacity>

        {loadingPets && <ActivityIndicator style={{ marginTop: 20 }} />}

        {pets.length > 0 && (
          <View style={styles.petsContainer}>
            <Text style={styles.petsTitle}>Ваши питомцы</Text>

            {pets.map((pet) => {
              const health = analyzePetHealthByCategory({
                sizeCategory: (pet.breed_size_category ?? 'medium') as SizeCategory,
                weight: pet.weight ?? 0,
                height: pet.height ?? 0,
                age: pet.age ?? 0,
                sex: pet.sex ?? 'male',
                neutered: pet.neutered ?? false,
              });

              return (
                <View key={pet.id} style={styles.petCard}>
                  <Text style={styles.petName}>{pet.name}</Text>
                  <Text style={styles.petInfo}>{pet.species === 'dog' ? '🐶 Собака' : '🐱 Кошка'}</Text>
                  {pet.breed_name && <Text style={styles.petInfo}>Порода: {pet.breed_name}</Text>}
                  {pet.weight && <Text style={styles.petInfo}>Вес: {pet.weight} кг</Text>}
                  {pet.height && <Text style={styles.petInfo}>Рост: {pet.height} см</Text>}
                  {pet.age && <Text style={styles.petInfo}>Возраст: {pet.age} лет</Text>}

                  {health && (
                    <View style={styles.chartsSection}>
                      <Text style={styles.chartsTitle}>Сравнение с нормой</Text>

                      <View style={styles.metricCard}>
                        <Text style={styles.metricName}>⚖️ Вес</Text>
                        <Text style={styles.petInfo}>
                          {pet.weight} кг / {health.weightRange?.min}-{health.weightRange?.max} кг
                        </Text>
                      </View>

                      <View style={styles.metricCard}>
                        <Text style={styles.metricName}>📏 Рост</Text>
                        <Text style={styles.petInfo}>
                          {pet.height} см / {health.heightRange?.min}-{health.heightRange?.max} см
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Bottom nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navButton}>
          <Text style={styles.navText}>?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={() => setAppState('main')}>
          <Text style={styles.navText}>🏠</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton}>
          <Text style={styles.navText}>?</Text>
        </TouchableOpacity>

        {user && (
          <TouchableOpacity style={styles.profileButton} onPress={() => setAppState('profile')}>
            {user.avatar_path ? (
              <Image
                source={{ uri: `${BASE_URL}${user.avatar_path}?t=${Date.now()}` }}
                style={styles.profileAvatar}
              />
            ) : (
              <Text style={styles.profileText}>
                {(user.name ?? user.email).charAt(0).toUpperCase()}
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
  },

  addPetButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

  petsContainer: { marginTop: 30 },

  petsTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },

  petCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },

  petName: { fontSize: 18, fontWeight: '700' },

  petInfo: { fontSize: 14, color: '#7A8F88', marginTop: 4 },

  chartsSection: { marginTop: 16 },

  chartsTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },

  metricCard: {
    backgroundColor: '#F8FCFA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },

  metricName: { fontSize: 15, fontWeight: '600' },

  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 70,
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    elevation: 5,
    alignSelf: 'center',
    paddingHorizontal: 20,
    position: 'absolute',
    bottom: 25,
  },

  navButton: { flex: 1, alignItems: 'center' },

  navText: { fontSize: 24, color: '#7A8F88' },

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

  profileText: { fontSize: 18, fontWeight: '700', color: '#7BC9A8' },
});