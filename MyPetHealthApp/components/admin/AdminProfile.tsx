// components/admin/AdminProfile.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../src/hooks/AuthContext';

const BASE_URL = 'http://192.168.0.59:3001';

interface AdminProfileProps {
  onLogout: () => void;
  onBack?: () => void;
}

export default function AdminProfile({ onLogout, onBack }: AdminProfileProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Выход',
      'Вы уверены, что хотите выйти из аккаунта?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Выйти',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            await onLogout();
            setLoading(false);
          },
        },
      ]
    );
  };

  const firstLetter = user?.name 
    ? user.name.charAt(0).toUpperCase() 
    : user?.email.charAt(0).toUpperCase() || '?';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Назад</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>👤 Профиль администратора</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Аватар */}
        <View style={styles.avatarContainer}>
          {user?.avatar_path ? (
            <Image
              source={{ uri: `${BASE_URL}${user.avatar_path}` }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarLetter}>{firstLetter}</Text>
            </View>
          )}
        </View>

        {/* Информация */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Имя</Text>
          <Text style={styles.infoValue}>{user?.name || 'Не указано'}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user?.email}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Роль</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>Администратор</Text>
          </View>
        </View>

        {/* Кнопка выхода */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={loading}
        >
          <Text style={styles.logoutButtonText}>
            {loading ? 'Выход...' : '🚪 Выйти из аккаунта'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F9F7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F0EC',
  },
  backButton: { padding: 8 },
  backButtonText: { fontSize: 16, color: '#7BC9A8', fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '700', color: '#2F4F4F' },
  content: { padding: 20, paddingBottom: 40 },
  avatarContainer: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#7BC9A8' },
  avatarFallback: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#7BC9A8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: { fontSize: 40, color: '#FFFFFF', fontWeight: '600' },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  infoLabel: { fontSize: 13, color: '#7A8F88', marginBottom: 4 },
  infoValue: { fontSize: 16, fontWeight: '500', color: '#2F4F4F' },
  roleBadge: {
    backgroundColor: '#7BC9A8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  roleText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  logoutButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});