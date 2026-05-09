// components/BottomNav.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useAuth } from '../src/hooks/AuthContext';
import { AppScreen } from '../src/types/navigation';

const BASE_URL = 'http://192.168.0.29:3001';

interface BottomNavigationProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
}

export default function BottomNavigation({ currentScreen, onNavigate }: BottomNavigationProps) {
  const { user, avatarUri } = useAuth(); // Измените cachedAvatarUri на avatarUri

  const firstLetter = user?.name 
    ? user.name.charAt(0).toUpperCase() 
    : user?.email.charAt(0).toUpperCase() || '?';

  // avatarUri уже есть в контексте, используем его напрямую
  const displayAvatarUri = avatarUri || (user?.avatar_path ? `${BASE_URL}${user.avatar_path}` : null);

  const navItems = [
    { screen: 'medications' as AppScreen, icon: '📅', label: 'Прививки' },
    { screen: 'main' as AppScreen, icon: '🏠', label: 'Главная' },
    { screen: 'addPet' as AppScreen, icon: '🐶', label: 'Питомцы' },
  ];

  return (
    <View style={styles.bottomNav}>
      {navItems.map((item) => (
        <TouchableOpacity
          key={item.screen}
          style={styles.navButton}
          onPress={() => onNavigate(item.screen)}
        >
          <Text style={[styles.navText, currentScreen === item.screen && styles.activeNavText]}>
            {item.icon}
          </Text>
          <Text style={[styles.navLabel, currentScreen === item.screen && styles.activeNavLabel]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[
          styles.profileButton,
          currentScreen === 'profile' && styles.activeProfileButton
        ]}
        onPress={() => onNavigate('profile')}
      >
        {displayAvatarUri ? (
          <Image source={{ uri: displayAvatarUri }} style={styles.profileAvatar} />
        ) : (
          <View style={styles.profileAvatarFallback}>
            <Text style={styles.profileText}>{firstLetter}</Text>
          </View>
        )}
        <Text style={[styles.navLabel, currentScreen === 'profile' && styles.activeNavLabel]}>
          Профиль
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 80,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8F0EC',
    paddingHorizontal: 16,
    paddingBottom: 10,
    position: 'absolute',
    bottom: 0,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  navText: {
    fontSize: 24,
    color: '#7A8F88',
  },
  activeNavText: {
    color: '#7BC9A8',
  },
  navLabel: {
    fontSize: 11,
    color: '#7A8F88',
    marginTop: 4,
  },
  activeNavLabel: {
    color: '#7BC9A8',
  },
  profileButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  activeProfileButton: {
    opacity: 1,
  },
  profileAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#7BC9A8',
  },
  profileAvatarFallback: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#7BC9A8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});