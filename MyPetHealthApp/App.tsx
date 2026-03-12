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

type AppState = 'splash' | 'login' | 'register' | 'main' | 'profile' | 'addPet';

function MainApp() {
  const [appState, setAppState] = useState<AppState>('splash');
  const { user, logout, isLoading } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loadingPets, setLoadingPets] = useState(false);

  // Splash screen
  useEffect(() => {
    if (appState === 'splash') {
      const timer = setTimeout(() => setAppState(user ? 'main' : 'login'), 2000);
      return () => clearTimeout(timer);
    }
  }, [appState, user]);

  // Redirect login -> main
  useEffect(() => {
    if (user && appState === 'login') setAppState('main');
  }, [user, appState]);

  // Load pets
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

  // Главный экран
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F9F7" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🐾 HealthyPaws</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Welcome */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Добро пожаловать!</Text>
          <Text style={styles.welcomeText}>
            Заботьтесь о здоровье вашего питомца вместе с HealthyPaws.
          </Text>
        </View>

        {/* Add pet button */}
        <TouchableOpacity style={styles.addPetButton} onPress={() => setAppState('addPet')}>
          <Text style={styles.addPetButtonText}>➕ Добавить питомца</Text>
        </TouchableOpacity>

        {/* Pets list */}
        {loadingPets && <ActivityIndicator style={{ marginTop: 20 }} />}
        {pets.length > 0 && (
          <View style={styles.petsContainer}>
            <Text style={styles.petsTitle}>Ваши питомцы</Text>

            {pets.map((pet) => {
              // Для анализа здоровья
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

                  {/* Графики сравнения с идеальными значениями */}
                  {health && (
                    <View style={styles.chartsSection}>
                      <Text style={styles.chartsTitle}>Сравнение с нормой</Text>
                      
                      {/* Вес */}
                      <View style={styles.metricCard}>
                        <View style={styles.metricHeader}>
                          <View style={styles.metricTitleContainer}>
                            <Text style={styles.metricEmoji}>⚖️</Text>
                            <Text style={styles.metricName}>Вес</Text>
                          </View>
                          <View style={styles.metricValues}>
                            <Text style={styles.currentValue}>{pet.weight} кг</Text>
                            <Text style={styles.separator}>/</Text>
                            <Text style={styles.idealValue}>
                              {health.weightRange?.min}-{health.weightRange?.max} кг
                            </Text>
                          </View>
                        </View>
                        
                        <View style={styles.comparisonBar}>
                          {/* Шкала идеального диапазона */}
                          <View style={styles.idealRangeBar}>
                            <View 
                              style={[
                                styles.idealRange,
                                {
                                  left: `${((health.weightRange?.min ?? 0) / (health.weightRange?.max ?? 1)) * 100}%`,
                                  width: `${((health.weightRange?.max ?? 0) - (health.weightRange?.min ?? 0)) / (health.weightRange?.max ?? 1) * 100}%`
                                }
                              ]}
                            />
                          </View>
                          
                          {/* Текущее значение */}
                          <View 
                            style={[
                              styles.currentMarker,
                              {
                                left: `${Math.min((pet.weight ?? 0) / (health.weightRange?.max ?? 1) * 100, 100)}%`,
                                backgroundColor: health.weightStatus === 'норма' ? '#4CAF50' : '#FF6347'
                              }
                            ]}
                          >
                            <View style={[styles.markerDot, { backgroundColor: health.weightStatus === 'норма' ? '#4CAF50' : '#FF6347' }]} />
                          </View>
                        </View>
                        
                        {/* Статус */}
                        <Text style={[
                          styles.statusText,
                          { color: health.weightStatus === 'норма' ? '#4CAF50' : '#FF6347' }
                        ]}>
                          {health.weightStatus === 'норма' ? '✓ В норме' : '⚠ Отклонение'}
                        </Text>
                      </View>

                      {/* Рост */}
                      <View style={styles.metricCard}>
                        <View style={styles.metricHeader}>
                          <View style={styles.metricTitleContainer}>
                            <Text style={styles.metricEmoji}>📏</Text>
                            <Text style={styles.metricName}>Рост</Text>
                          </View>
                          <View style={styles.metricValues}>
                            <Text style={styles.currentValue}>{pet.height} см</Text>
                            <Text style={styles.separator}>/</Text>
                            <Text style={styles.idealValue}>
                              {health.heightRange?.min}-{health.heightRange?.max} см
                            </Text>
                          </View>
                        </View>
                        
                        <View style={styles.comparisonBar}>
                          {/* Шкала идеального диапазона */}
                          <View style={styles.idealRangeBar}>
                            <View 
                              style={[
                                styles.idealRange,
                                {
                                  left: `${((health.heightRange?.min ?? 0) / (health.heightRange?.max ?? 1)) * 100}%`,
                                  width: `${((health.heightRange?.max ?? 0) - (health.heightRange?.min ?? 0)) / (health.heightRange?.max ?? 1) * 100}%`
                                }
                              ]}
                            />
                          </View>
                          
                          {/* Текущее значение */}
                          <View 
                            style={[
                              styles.currentMarker,
                              {
                                left: `${Math.min((pet.height ?? 0) / (health.heightRange?.max ?? 1) * 100, 100)}%`,
                                backgroundColor: health.heightStatus === 'норма' ? '#4CAF50' : '#FF6347'
                              }
                            ]}
                          >
                            <View style={[styles.markerDot, { backgroundColor: health.heightStatus === 'норма' ? '#4CAF50' : '#FF6347' }]} />
                          </View>
                        </View>
                        
                        {/* Статус */}
                        <Text style={[
                          styles.statusText,
                          { color: health.heightStatus === 'норма' ? '#4CAF50' : '#FF6347' }
                        ]}>
                          {health.heightStatus === 'норма' ? '✓ В норме' : '⚠ Отклонение'}
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
            <Text style={styles.profileText}>{(user.name ?? user.email).charAt(0).toUpperCase()}</Text>
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
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#2F4F4F' },
  content: { padding: 16, paddingBottom: 120 },
  welcomeCard: { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 24, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 15, elevation: 2 },
  welcomeTitle: { fontSize: 20, fontWeight: '700', color: '#2F4F4F', marginBottom: 8 },
  welcomeText: { fontSize: 16, color: '#7A8F88' },
  addPetButton: { backgroundColor: '#7BC9A8', paddingVertical: 16, borderRadius: 18, alignItems: 'center' },
  addPetButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  petsContainer: { marginTop: 30 },
  petsTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#2F4F4F' },
  petCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  petName: { fontSize: 18, fontWeight: '700', color: '#2F4F4F' },
  petInfo: { fontSize: 14, color: '#7A8F88', marginTop: 4 },
  
  // Новые стили для графиков
  chartsSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8F0EC',
  },
  chartsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2F4F4F',
    marginBottom: 12,
  },
  metricCard: {
    backgroundColor: '#F8FCFA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricEmoji: {
    fontSize: 20,
  },
  metricName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2F4F4F',
  },
  metricValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  currentValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2F4F4F',
  },
  separator: {
    fontSize: 14,
    color: '#A0B8B0',
  },
  idealValue: {
    fontSize: 14,
    color: '#7A8F88',
  },
  comparisonBar: {
    height: 40,
    position: 'relative',
    marginBottom: 8,
  },
  idealRangeBar: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: '#E8F0EC',
    borderRadius: 4,
  },
  idealRange: {
    position: 'absolute',
    top: 0,
    height: 8,
    backgroundColor: '#C5E0D4',
    borderRadius: 4,
  },
  currentMarker: {
    position: 'absolute',
    top: 8,
    width: 24,
    height: 24,
    marginLeft: -12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  
  // Остальные стили
  healthContainer: { marginTop: 8 }, // Оставлен для обратной совместимости
  healthText: { fontSize: 14, color: '#4CAF50', fontWeight: '600' },
  chartContainer: { marginTop: 10 }, // Оставлен для обратной совместимости
  chartRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  chartLabel: { width: 50, fontSize: 14, color: '#2F4F4F' },
  chartBarBackground: { flex: 1, height: 12, backgroundColor: '#E0E0E0', borderRadius: 6, position: 'relative' },
  chartBar: { height: 12, borderRadius: 6, position: 'absolute', left: 0 },
  chartBarNormal: {
    position: 'absolute',
    top: -2,
    width: 2,
    height: 16,
    backgroundColor: '#000',
  },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 70, width: '90%', backgroundColor: '#FFFFFF', borderRadius: 20, elevation: 5, alignSelf: 'center', paddingHorizontal: 20, position: 'absolute', bottom: 25 },
  navButton: { flex: 1, alignItems: 'center' },
  navText: { fontSize: 24, color: '#7A8F88' },
  profileButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#7BC9A8', justifyContent: 'center', alignItems: 'center' },
  profileText: { fontSize: 18, fontWeight: '700', color: '#7BC9A8' },
});