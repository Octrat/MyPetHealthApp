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

const BASE_URL = 'http://192.168.0.59:3001'; // сервер для формирования URL аватара

export default function ProfileScreen({ onLogout, onBack, goHome }: any) {
  const { user, updateUser } = useAuth();
  const [editableName, setEditableName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUri, setAvatarUri] = useState(user?.avatar_path ? `${BASE_URL}${user.avatar_path}` : '');

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
      mediaTypes: 'images', // ✅ правильно — маленькими буквами
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

        // Обновляем локально user
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backText: { fontSize: 18, color: '#333' },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  avatarContainer: { alignItems: 'center', marginVertical: 20 },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  avatarFallback: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { fontSize: 48, color: '#fff' },
  changeAvatarButton: { marginTop: 10, padding: 8, backgroundColor: '#4CAF50', borderRadius: 8 },
  changeAvatarText: { color: '#fff', fontWeight: 'bold' },
  card: { marginVertical: 10, padding: 15, backgroundColor: '#f2f2f2', borderRadius: 8 },
  label: { fontWeight: 'bold', marginBottom: 5 },
  input: { backgroundColor: '#fff', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#ccc' },
  saveButton: { marginTop: 10, backgroundColor: '#4CAF50', padding: 10, borderRadius: 6 },
  saveButtonDisabled: { backgroundColor: '#a5d6a7' },
  saveButtonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  value: { fontSize: 16 },
  logoutButton: { marginTop: 20, backgroundColor: '#f44336', padding: 10, borderRadius: 6 },
  logoutButtonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
});