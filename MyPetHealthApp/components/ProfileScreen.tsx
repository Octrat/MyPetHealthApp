import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { useAuth } from '../src/hooks/AuthContext';

export default function ProfileScreen({ onLogout, onBack, goHome }: any) {
  const { user, updateUser } = useAuth();
  const [editableName, setEditableName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.name) setEditableName(user.name);
  }, [user]);

  if (!user) return null;

  const avatarSource = (user as any)?.avatar ? { uri: (user as any).avatar } : null;
  const firstLetter = user.name
    ? user.name.charAt(0).toUpperCase()
    : user.email.charAt(0).toUpperCase();

  const handleSave = async () => {
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
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Сохраняем...' : 'Сохранить'}
            </Text>
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

      {/* Нижняя закругленная панель */}
      <View style={styles.bottomNav}>
  <TouchableOpacity style={styles.navButton}>
    <Text style={styles.navText}>?</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.navButton} onPress={goHome}>
    <Text style={styles.navText}>🏠</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.navButton}>
    <Text style={styles.navText}>?</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.profileButton}>
    <Text style={styles.profileText}>{firstLetter}</Text>
  </TouchableOpacity>
</View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F9F7' },
  scrollContent: { padding: 16, paddingBottom: 100 },

  header: {
    height: 70,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  backText: { fontSize: 16, color: '#7BC9A8' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#2F4F4F' },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 15,
    elevation: 2,
  },
  label: { fontSize: 14, color: '#888', marginBottom: 8 },
  value: { fontSize: 18, fontWeight: '700', color: '#2F4F4F' },
  input: {
    backgroundColor: '#F9FBFA',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E3ECE8',
    fontSize: 16,
    color: '#2F4F4F',
  },
  saveButton: { marginTop: 12, backgroundColor: '#7BC9A8', paddingVertical: 14, borderRadius: 18, alignItems: 'center' },
  saveButtonDisabled: { backgroundColor: '#CFEDE2' },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  logoutButton: { marginTop: 30, backgroundColor: '#FF6B6B', paddingVertical: 16, borderRadius: 18, alignItems: 'center' },
  logoutButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 70,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,       // теперь все углы закруглены
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
  
    width: '90%',           // ширина панели
    alignSelf: 'center',    // центрирование
    paddingHorizontal: 20,
    position: 'absolute',   // фиксируем снизу
    bottom: 25,             // отступ от низа
  },
  
  
  
  navButton: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navText: { fontSize: 24, color: '#7A8F88' },
  profileButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#7BC9A8', justifyContent: 'center', alignItems: 'center' },
  profileText: { fontSize: 18, fontWeight: '700', color: '#7BC9A8' },
});
