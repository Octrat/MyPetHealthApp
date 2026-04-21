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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../src/hooks/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppScreen } from '../src/types/navigation';

const BASE_URL = 'http://192.168.0.77:3001';

interface ProfileScreenProps {
  onLogout: () => void;
  onBack: () => void;
  onNavigate?: (screen: AppScreen) => void;
}

export default function ProfileScreen({ onLogout, onBack, onNavigate }: ProfileScreenProps) {
  const { user, updateUser } = useAuth();
  const [editableName, setEditableName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUri, setAvatarUri] = useState(user?.avatar_path ? `${BASE_URL}${user.avatar_path}` : '');

  const isActive = (screen: AppScreen) => {
    return screen === 'profile';
  };

  useEffect(() => {
    if (user?.name) setEditableName(user.name);
    if (user?.avatar_path) setAvatarUri(`${BASE_URL}${user.avatar_path}`);
  }, [user]);

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
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const image = result.assets[0];
      if (!image.uri) return;

      setAvatarUri(image.uri);

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

        await updateUser({ avatar_path: resJson.avatar_url });
        Alert.alert('Успешно', 'Аватар обновлен!');
      } catch (error) {
        console.error('Avatar upload error:', error);
        Alert.alert('Ошибка', 'Не удалось загрузить аватар');
      }
    }
  };

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
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
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

      {/* Bottom Navigation с иконкой собачки */}
      <View style={styles.bottomNav}>
        {/* 📅 Календарь */}
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => onNavigate?.('medications')}
        >
          <Text style={[
            styles.navText,
            isActive('medications') && styles.activeNavText
          ]}>
            📅
          </Text>
        </TouchableOpacity>

        {/* 🏠 Главная */}
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => onNavigate?.('main')}
        >
          <Text style={[
            styles.navText,
            isActive('main') && styles.activeNavText
          ]}>
            🏠
          </Text>
        </TouchableOpacity>

        {/* 🐶 Питомцы */}
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => onNavigate?.('addPet')}
        >
          <Text style={[
            styles.navText,
            isActive('addPet') && styles.activeNavText
          ]}>
            🐶
          </Text>
        </TouchableOpacity>

        {/* 👤 Профиль (активный) */}
        <TouchableOpacity 
          style={[
            styles.profileButton,
            isActive('profile') && styles.activeProfileButton
          ]} 
          onPress={() => onNavigate?.('profile')}
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.profileAvatar} />
          ) : (
            <Text style={styles.profileText}>{firstLetter}</Text>
          )}
        </TouchableOpacity>
      </View>
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
    paddingBottom: 120,
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

  // Bottom Navigation Styles
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 70,
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
    alignSelf: 'center',
    paddingHorizontal: 20,
    position: 'absolute',
    bottom: 25,
  },
  navButton: { 
    flex: 1, 
    alignItems: 'center',
    paddingVertical: 10,
  },
  navText: { 
    fontSize: 24, 
    color: '#7A8F88',
  },
  activeNavText: {
    color: '#7BC9A8',
    fontWeight: '600',
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
  activeProfileButton: {
    borderColor: '#2F4F4F',
    borderWidth: 3,
  },
  profileAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  profileText: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#7BC9A8' 
  },
});