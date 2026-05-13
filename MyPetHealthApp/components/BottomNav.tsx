// components/BottomNav.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/hooks/AuthContext';
import { AppScreen } from '../src/types/navigation';

const BASE_URL = 'http://192.168.0.59:3001';

interface BottomNavigationProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export default function BottomNavigation({
  currentScreen,
  onNavigate,
}: BottomNavigationProps) {
  const { user, avatarUri } = useAuth();

  const displayAvatarUri =
    avatarUri || (user?.avatar_path ? `${BASE_URL}${user.avatar_path}` : null);

  const navItems: {
    screen: AppScreen;
    icon: IoniconName;
    label: string;
  }[] = [
    {
      screen: 'medications' as AppScreen,
      icon: 'calendar-outline',
      label: 'Прививки',
    },
    {
      screen: 'main' as AppScreen,
      icon: 'home-outline',
      label: 'Главная',
    },
    {
      screen: 'addPet' as AppScreen,
      icon: 'paw-outline',
      label: 'Питомцы',
    },
  ];

  return (
    <View style={styles.navWrapper}>
      <View style={styles.bottomNav}>
        {navItems.map((item) => {
          const isActive = currentScreen === item.screen;

          return (
            <TouchableOpacity
              key={item.screen}
              style={styles.navButton}
              onPress={() => onNavigate(item.screen)}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.iconCircle,
                  isActive && styles.activeIconCircle,
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={26}
                  color="#FFFFFF"
                />
              </View>

              <Text
                style={[
                  styles.navLabel,
                  isActive && styles.activeNavLabel,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => onNavigate('profile')}
          activeOpacity={0.85}
        >
          <View
            style={[
              styles.iconCircle,
              currentScreen === 'profile' && styles.activeIconCircle,
            ]}
          >
            {displayAvatarUri ? (
              <Image
                source={{ uri: displayAvatarUri }}
                style={styles.profileAvatar}
                resizeMode="cover"
              />
            ) : (
              <Ionicons
                name="person-outline"
                size={27}
                color="#FFFFFF"
              />
            )}
          </View>

          <Text
            style={[
              styles.navLabel,
              currentScreen === 'profile' && styles.activeNavLabel,
            ]}
          >
            Профиль
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navWrapper: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 18,
    alignItems: 'center',
  },

  bottomNav: {
    width: '100%',
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FF5C68',
    borderRadius: 34,
    paddingHorizontal: 10,
    paddingVertical: 10,
    shadowColor: '#123F32',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 8,
  },

  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginBottom: 4,
  },

  activeIconCircle: {
    backgroundColor: '#123F32',
  },

  navLabel: {
    fontSize: 11,
    lineHeight: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    opacity: 0.84,
  },

  activeNavLabel: {
    color: '#FFFFFF',
    opacity: 1,
    fontWeight: '800',
  },

  profileAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});