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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../src/hooks/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppScreen } from '../src/types/navigation';
import BottomNavigation from './BottomNav';

const BASE_URL = 'http://192.168.0.34:3001';

interface ProfileScreenProps {
  onLogout: () => void;
  onBack: () => void;
  onNavigate?: (screen: AppScreen) => void;
}

export default function ProfileScreen({ onLogout, onBack, onNavigate }: ProfileScreenProps) {
  const { user, updateUser } = useAuth();
  const [editableName, setEditableName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(true);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // Загрузка аватара
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
        // Предзагружаем изображение
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
    if (user?.name) setEditableName(user.name);
  }, [user?.name]);

  if (!user) return null;

  const firstLetter = user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase();

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
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
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

      // Сразу показываем локальное фото (мгновенно)
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
        if (!response.ok) throw new Error(resJson.message || 'Ошибка загрузки');

        // Обновляем данные пользователя
        await updateUser({ avatar_path: resJson.avatar_url });
        
        // Очищаем локальное фото, теперь используем кэшированное
        setLocalAvatarUri(null);
        
        Alert.alert('Успешно', 'Аватар обновлен!');
      } catch (error) {
        console.error('Avatar upload error:', error);
        Alert.alert('Ошибка', 'Не удалось загрузить аватар');
        setLocalAvatarUri(null);
      }
    }
  };

  // Текущее отображаемое фото
  const displayAvatarUri = localAvatarUri || avatarUri;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>← Назад</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Профиль</Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={styles.avatarContainer}>
          {isLoadingAvatar && !localAvatarUri ? (
            <View style={styles.avatar}>
              <ActivityIndicator size="large" color="#7BC9A8" />
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
          <TouchableOpacity style={styles.changeAvatarButton} onPress={handleChangeAvatar}>
            <Text style={styles.changeAvatarText}>Изменить аватар</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Ваше имя</Text>
          <TextInput
            style={styles.input}
            value={editableName}
            onChangeText={setEditableName}
            placeholder="Введите ваше имя"
            placeholderTextColor="#9BB8AE"
          />
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSaveName}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>{isSaving ? 'Сохраняем...' : 'Сохранить'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user.email}</Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutButtonText}>Выйти</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Navigation - используем компонент */}
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
    backgroundColor: '#F6F9F7' 
  },
  scrollContent: { 
    padding: 20,
    paddingBottom: 100,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  backText: { 
    fontSize: 16, 
    color: '#7A8F88',
    fontWeight: '500',
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '700',
    color: '#2F4F4F',
  },
  avatarContainer: { 
    alignItems: 'center', 
    marginVertical: 20 
  },
  avatar: { 
    width: 120, 
    height: 120, 
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#7BC9A8',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  avatarFallback: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    backgroundColor: '#7BC9A8', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarLetter: { 
    fontSize: 48, 
    color: '#FFFFFF',
    fontWeight: '600',
  },
  changeAvatarButton: { 
    marginTop: 12, 
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#7BC9A8', 
    borderRadius: 20,
  },
  changeAvatarText: { 
    color: '#FFFFFF', 
    fontWeight: '600',
    fontSize: 14,
  },
  card: { 
    marginVertical: 8, 
    padding: 20, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 22,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  label: { 
    fontWeight: '600', 
    marginBottom: 8,
    color: '#2F4F4F',
    fontSize: 15,
  },
  input: { 
    backgroundColor: '#F8FCFA', 
    padding: 14, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#E8F0EC',
    fontSize: 16,
    color: '#2F4F4F',
  },
  saveButton: { 
    marginTop: 12, 
    backgroundColor: '#7BC9A8', 
    padding: 14, 
    borderRadius: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: { 
    backgroundColor: '#B8E0D0',
  },
  saveButtonText: { 
    color: '#FFFFFF', 
    fontWeight: '600', 
    fontSize: 16,
  },
  value: { 
    fontSize: 16,
    color: '#2F4F4F',
    backgroundColor: '#F8FCFA',
    padding: 14,
    borderRadius: 16,
  },
  logoutButton: { 
    marginTop: 20, 
    backgroundColor: '#FF6B6B', 
    padding: 16, 
    borderRadius: 18,
    alignItems: 'center',
  },
  logoutButtonText: { 
    color: '#FFFFFF', 
    fontWeight: '700', 
    fontSize: 16,
  },
});