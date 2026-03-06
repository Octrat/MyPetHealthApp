import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView, 
  StatusBar, 
  TouchableOpacity,
  ScrollView
} from 'react-native';

import AddPetScreen from './components/AddPetScreen';
import SplashScreen from './components/SplashScreen';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import ProfileScreen from './components/ProfileScreen';

import { AuthProvider, useAuth } from './src/hooks/AuthContext';
import { petsAPI } from './src/services/api';
import { Pet } from './src/types';

type AppState =
  | 'splash'
  | 'login'
  | 'register'
  | 'main'
  | 'profile'
  | 'addPet';

function MainApp() {
  const [appState, setAppState] = useState<AppState>('splash');
  const { user, logout, isLoading } = useAuth();

  const [pets, setPets] = useState<Pet[]>([]);

  React.useEffect(() => {
    if (appState === 'splash') {
      const timer = setTimeout(() => {
        setAppState(user ? 'main' : 'login');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [appState, user]);

  React.useEffect(() => {
    if (user && appState === 'login') {
      setAppState('main');
    }
  }, [user, appState]);

  // загрузка питомцев
  React.useEffect(() => {
    const loadPets = async () => {
      if (!user) return;

      try {
        const data = await petsAPI.getPets(user.id);
        setPets(data);
      } catch (err) {
        console.log('Ошибка загрузки питомцев', err);
      }
    };

    if (appState === 'main') {
      loadPets();
    }
  }, [appState, user]);

  if (isLoading || appState === 'splash') return <SplashScreen />;

  if (appState === 'login') {
    return <LoginScreen onSwitchToRegister={() => setAppState('register')} />;
  }

  if (appState === 'register') {
    return (
      <RegisterScreen
        onRegister={() => setAppState('main')}
        onSwitchToLogin={() => setAppState('login')}
      />
    );
  }

  if (appState === 'main') {
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

          {/* Add pet */}
          <TouchableOpacity
            style={styles.addPetButton}
            onPress={() => setAppState('addPet')}
          >
            <Text style={styles.addPetButtonText}>➕ Добавить питомца</Text>
          </TouchableOpacity>

          {/* Pets list */}
          {pets.length > 0 && (
            <View style={styles.petsContainer}>

              <Text style={styles.petsTitle}>Ваши питомцы</Text>

              {pets.map((pet) => (
                <View key={pet.id} style={styles.petCard}>

                  <Text style={styles.petName}>{pet.name}</Text>

                  <Text style={styles.petInfo}>
                    {pet.species === 'dog' ? '🐶 Собака' : '🐱 Кошка'}
                  </Text>

                  {pet.breed_name && (
                    <Text style={styles.petInfo}>
                      Порода: {pet.breed_name}
                    </Text>
                  )}

                </View>
              ))}

            </View>
          )}

        </ScrollView>

        {/* Bottom nav */}
        <View style={styles.bottomNav}>

          <TouchableOpacity style={styles.navButton}>
            <Text style={styles.navText}>?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => setAppState('main')}
          >
            <Text style={styles.navText}>🏠</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navButton}>
            <Text style={styles.navText}>?</Text>
          </TouchableOpacity>

          {user && (
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => setAppState('profile')}
            >
              <Text style={styles.profileText}>
                {(user.name ?? user.email).charAt(0).toUpperCase()}
              </Text>
            </TouchableOpacity>
          )}

        </View>

      </SafeAreaView>
    );
  }

  if (appState === 'addPet') {
    return <AddPetScreen onBack={() => setAppState('main')} />;
  }

  if (appState === 'profile') {
    return (
      <ProfileScreen
        onBack={() => setAppState('main')}
        onLogout={async () => {
          await logout();
          setAppState('login');
        }}
      />
    );
  }

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F6F9F7'
  },

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

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2F4F4F',
  },

  content: {
    padding: 16,
    paddingBottom: 120,
  },

  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 15,
    elevation: 2,
  },

  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2F4F4F',
    marginBottom: 8,
  },

  welcomeText: {
    fontSize: 16,
    color: '#7A8F88',
  },

  addPetButton: {
    backgroundColor: '#7BC9A8',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
  },

  addPetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  petsContainer: {
    marginTop: 30,
  },

  petsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#2F4F4F',
  },

  petCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },

  petName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2F4F4F',
  },

  petInfo: {
    fontSize: 14,
    color: '#7A8F88',
    marginTop: 4,
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
    alignSelf: 'center',
    paddingHorizontal: 20,
    position: 'absolute',
    bottom: 25,
  },

  navButton: {
    flex: 1,
    alignItems: 'center',
  },

  navText: {
    fontSize: 24,
    color: '#7A8F88',
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

  profileText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7BC9A8',
  },

});