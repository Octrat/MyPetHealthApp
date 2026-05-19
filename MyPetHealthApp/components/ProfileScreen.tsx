// components/ProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../src/hooks/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppScreen } from '../src/types/navigation';
import BottomNavigation from './BottomNav';

const BASE_URL = 'http://192.168.0.59:3001';

const cardBg = require('../assets/images/ФонГлавБел.jpg');

const COLORS = {
  background: '#FFFFFF',
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

interface ProfileScreenProps {
  onLogout: () => void;
  onBack: () => void;
  onNavigate?: (screen: AppScreen) => void;
}

export default function ProfileScreen({
  onLogout,
  onBack,
  onNavigate,
}: ProfileScreenProps) {
  const { user, updateUser } = useAuth();
  const [editableName, setEditableName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(true);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    const loadAvatar = async () => {
      if (!user?.avatar_path) {
        setAvatarUri(null);
        setIsLoadingAvatar(false);
        return;
      }

      setIsLoadingAvatar(true);

      const avatarUrl = `${BASE_URL}${user.avatar_path}`;

      try {
        await Image.prefetch(avatarUrl);
        setAvatarUri(avatarUrl);
      } catch (error) {
        console.log('Error loading avatar:', error);
        setAvatarUri(avatarUrl);
      } finally {
        setIsLoadingAvatar(false);
      }
    };

    loadAvatar();
  }, [user?.avatar_path]);

  useEffect(() => {
    if (user?.name) {
      setEditableName(user.name);
    }
  }, [user?.name]);

  if (!user) return null;

  const firstLetter = user.name
    ? user.name.charAt(0).toUpperCase()
    : user.email.charAt(0).toUpperCase();

  const displayAvatarUri = localAvatarUri || avatarUri;

  const handleSaveName = async () => {
    if (!editableName.trim()) {
      Alert.alert('Ошибка', 'Имя не может быть пустым');
      return;
    }

    setIsSaving(true);

    try {
      await updateUser({ name: editableName.trim() });
      Alert.alert('Успешно', 'Имя сохранено!');
    } catch (error) {
      console.log('Profile save error:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить имя');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeAvatar = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Нет доступа', 'Нужно разрешение на галерею');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.5,
      allowsEditing: true,
      aspect: [1, 1],
      base64: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      const image = result.assets[0];

      if (!image.uri) return;

      if (image.base64) {
        setLocalAvatarUri(`data:image/jpeg;base64,${image.base64}`);
      } else {
        setLocalAvatarUri(image.uri);
      }

      try {
        const formData = new FormData();

        formData.append('avatar', {
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: image.fileName || 'avatar.jpg',
        } as any);

        const token = await AsyncStorage.getItem('userToken');

        const response = await fetch(`${BASE_URL}/api/user/avatar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const resJson = await response.json();

        if (!response.ok) {
          throw new Error(resJson.message || 'Ошибка загрузки');
        }

        await updateUser({ avatar_path: resJson.avatar_url });
        setLocalAvatarUri(null);

        Alert.alert('Успешно', 'Аватар обновлен!');
      } catch (error) {
        console.error('Avatar upload error:', error);
        Alert.alert('Ошибка', 'Не удалось загрузить аватар');
        setLocalAvatarUri(null);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Профиль</Text>
        </View>

        <ImageBackground
          source={cardBg}
          style={styles.profileHero}
          imageStyle={styles.cardImage}
          resizeMode="cover"
        >
          <View style={styles.avatarBlock}>
            <TouchableOpacity
              style={styles.avatarTouchable}
              onPress={handleChangeAvatar}
              activeOpacity={0.9}
            >
              {isLoadingAvatar && !localAvatarUri ? (
                <View style={styles.avatar}>
                  <ActivityIndicator size="large" color={COLORS.accentDark} />
                </View>
              ) : displayAvatarUri ? (
                <Image
                  source={{ uri: displayAvatarUri }}
                  style={styles.avatar}
                  onError={() => console.log('Image load error')}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarLetter}>{firstLetter}</Text>
                </View>
              )}

              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={18} color={COLORS.white} />
              </View>
            </TouchableOpacity>

            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {user.name || 'Пользователь'}
              </Text>

              <Text style={styles.userEmail} numberOfLines={1}>
                {user.email}
              </Text>

              <TouchableOpacity
                style={styles.changeAvatarButton}
                onPress={handleChangeAvatar}
                activeOpacity={0.85}
              >
                <Text style={styles.changeAvatarText}>Изменить аватар</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>

        <ImageBackground
          source={cardBg}
          style={styles.card}
          imageStyle={styles.cardImage}
          resizeMode="cover"
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardIconCircle}>
              <Ionicons name="person-outline" size={23} color={COLORS.white} />
            </View>

            <View style={styles.cardTitleBlock}>
              <Text style={styles.cardTitle}>Ваше имя</Text>
              <Text style={styles.cardSubtitle}>
                Можно изменить отображаемое имя
              </Text>
            </View>
          </View>

          <TextInput
            style={styles.input}
            value={editableName}
            onChangeText={setEditableName}
            placeholder="Введите ваше имя"
            placeholderTextColor={COLORS.textSoft}
          />

          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSaveName}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            {isSaving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.saveButtonText}>Сохранить</Text>
            )}
          </TouchableOpacity>
        </ImageBackground>

        <ImageBackground
          source={cardBg}
          style={styles.card}
          imageStyle={styles.cardImage}
          resizeMode="cover"
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardIconCircle}>
              <Ionicons name="mail-outline" size={23} color={COLORS.white} />
            </View>

            <View style={styles.cardTitleBlock}>
              <Text style={styles.cardTitle}>Email</Text>
              <Text style={styles.cardSubtitle}>
                Почта, привязанная к аккаунту
              </Text>
            </View>
          </View>

          <View style={styles.emailBox}>
            <Text style={styles.emailText} numberOfLines={1}>
              {user.email}
            </Text>
          </View>
        </ImageBackground>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={onLogout}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={21} color={COLORS.white} />
          <Text style={styles.logoutButtonText}>Выйти</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNavigation
        currentScreen="profile"
        onNavigate={(screen) => onNavigate?.(screen)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 130,
  },

  header: {
    marginBottom: 18,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 3,
  },

  headerTitle: {
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -1.2,
  },

  profileHero: {
    borderRadius: 32,
    padding: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 6,
  },

  cardImage: {
    borderRadius: 32,
  },

  avatarBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatarTouchable: {
    width: 116,
    height: 116,
    marginRight: 18,
  },

  avatar: {
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 4,
    borderColor: COLORS.white,
    backgroundColor: COLORS.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarFallback: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: COLORS.accent,
    borderWidth: 4,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarLetter: {
    fontSize: 46,
    color: COLORS.white,
    fontWeight: '900',
  },

  cameraBadge: {
    position: 'absolute',
    right: 2,
    bottom: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },

  userInfo: {
    flex: 1,
  },

  userName: {
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
  },

  userEmail: {
    marginTop: 4,
    fontSize: 14,
    color: COLORS.textSoft,
    fontWeight: '600',
  },

  changeAvatarButton: {
    alignSelf: 'flex-start',
    marginTop: 14,
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 19,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },

  changeAvatarText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 13,
  },

  card: {
    borderRadius: 32,
    padding: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 4,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  cardIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  cardTitleBlock: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },

  cardSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: COLORS.textSoft,
    fontWeight: '600',
  },

  input: {
    minHeight: 58,
    backgroundColor: COLORS.white,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 18,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '700',
  },

  saveButton: {
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: COLORS.accentDark,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 4,
  },

  saveButtonDisabled: {
    backgroundColor: '#DCCCF6',
    shadowOpacity: 0,
    elevation: 0,
  },

  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '900',
  },

  emailBox: {
    minHeight: 58,
    backgroundColor: COLORS.white,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 18,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },

  emailText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '700',
  },

  logoutButton: {
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.coral,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    shadowColor: COLORS.coralDark,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    elevation: 4,
  },

  logoutButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '900',
  },
});