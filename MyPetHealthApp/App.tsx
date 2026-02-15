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

        {/* Верхняя шапка */}
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

          <TouchableOpacity
            style={styles.addPetButton}
            onPress={() => setAppState('addPet')}
          >
            <Text style={styles.addPetButtonText}>➕ Добавить питомца</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Нижняя панель */}
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

  if (appState === 'addPet') return <AddPetScreen onBack={() => setAppState('main')} />;

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
  container: { flex: 1, backgroundColor: '#F6F9F7' },

  header: {
    height: 70,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2F4F4F',
    textAlign: 'center',
    flex: 1,
  },

  content: {
    padding: 16,
    alignItems: 'center',
    paddingBottom: 120, // чтобы нижняя панель не перекрывала контент
  },

  welcomeCard: {
    width: '100%',
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
    paddingHorizontal: 32,
    borderRadius: 18,
    alignItems: 'center',
    width: '100%',
  },

  addPetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 70,
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20, // все углы закруглены
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
    alignSelf: 'center',
    paddingHorizontal: 20,
    position: 'absolute',
    bottom: 25, // подняли выше края экрана
  },

  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
