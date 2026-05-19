// components/BottomNav.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/hooks/AuthContext';
import { AppScreen } from '../src/types/navigation';

const BASE_URL = 'http://192.168.0.59:3001';

const navBg = require('../assets/images/ФонГлав.jpg');

interface BottomNavigationProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const COLORS = {
  panelFallback: '#EBC8B6',
  active: '#FF9F1C',
  activeDark: '#E97812',
  white: '#FFFFFF',
  text: '#2B251F',
};

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
      <ImageBackground
        source={navBg}
        style={styles.bottomNav}
        imageStyle={styles.bottomNavImage}
        resizeMode="cover"
      >
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
                <Ionicons name={item.icon} size={26} color={COLORS.white} />
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
                style={[
                  styles.profileAvatar,
                  currentScreen === 'profile' && styles.activeProfileAvatar,
                ]}
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="person-outline" size={27} color={COLORS.white} />
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
      </ImageBackground>
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
    backgroundColor: COLORS.panelFallback,
    borderRadius: 34,
    paddingHorizontal: 10,
    paddingVertical: 10,
    overflow: 'hidden',
    shadowColor: COLORS.text,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 8,
  },

  bottomNavImage: {
    borderRadius: 34,
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
    backgroundColor: COLORS.active,
    shadowColor: COLORS.activeDark,
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 5,
  },

  navLabel: {
    fontSize: 11,
    lineHeight: 14,
    color: COLORS.white,
    fontWeight: '700',
    opacity: 0.9,
  },

  activeNavLabel: {
    color: COLORS.white,
    opacity: 1,
    fontWeight: '900',
  },

  profileAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: COLORS.white,
  },

  activeProfileAvatar: {
    borderColor: COLORS.white,
  },
});