// components/admin/AdminPanel.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../src/hooks/AuthContext';

const BASE_URL = 'http://192.168.0.29:3001';

interface AdminPanelProps {
  onBack: () => void;
  onNavigate?: (screen: string) => void;
}

interface Stats {
  totalUsers: number;
  totalPets: number;
  totalDogs: number;
  totalCats: number;
}

export default function AdminPanel({ onBack, onNavigate }: AdminPanelProps) {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalPets: 0,
    totalDogs: 0,
    totalCats: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      Alert.alert('Доступ запрещён', 'У вас нет прав администратора');
      onBack();
    } else {
      loadStats();
    }
  }, []);

  const loadStats = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${BASE_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setStats(data);
      } else {
        console.error('Ошибка загрузки статистики:', data.message);
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { id: 'users', title: '👥 Пользователи', description: 'Управление пользователями', icon: '👥', screen: 'admin-users' },
    { id: 'pets', title: '🐾 Питомцы', description: 'Все питомцы в системе', icon: '🐾', screen: 'admin-pets' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#7BC9A8" />
          <Text style={styles.loaderText}>Загрузка панели администратора...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🛡️ Админ панель</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Приветствие */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>👋 Здравствуйте, {user?.name || user?.email}</Text>
          <Text style={styles.welcomeText}>Добро пожаловать в панель администратора</Text>
        </View>

        {/* Статистика */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>📊 Статистика системы</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalUsers}</Text>
              <Text style={styles.statLabel}>Пользователей</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalPets}</Text>
              <Text style={styles.statLabel}>Питомцев</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalDogs}</Text>
              <Text style={styles.statLabel}>Собак</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalCats}</Text>
              <Text style={styles.statLabel}>Кошек</Text>
            </View>
          </View>
        </View>

        {/* Меню */}
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuCard}
            onPress={() => onNavigate?.(item.screen)}
          >
            <View style={styles.menuLeft}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <View>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuDescription}>{item.description}</Text>
              </View>
            </View>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
        ))}
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
  title: { fontSize: 20, fontWeight: '700', color: '#2F4F4F' },
  content: { padding: 16, paddingBottom: 40 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: 12, color: '#7A8F88' },
  welcomeCard: {
    backgroundColor: '#7BC9A8',
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
  },
  welcomeTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  welcomeText: { fontSize: 14, color: '#FFFFFF', opacity: 0.9 },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
  },
  statsTitle: { fontSize: 16, fontWeight: '600', color: '#2F4F4F', marginBottom: 16 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 28, fontWeight: '700', color: '#2F4F4F' },
  statLabel: { fontSize: 12, color: '#7A8F88', marginTop: 4 },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  menuIcon: { fontSize: 28 },
  menuTitle: { fontSize: 16, fontWeight: '600', color: '#2F4F4F' },
  menuDescription: { fontSize: 12, color: '#7A8F88', marginTop: 2 },
  menuArrow: { fontSize: 18, color: '#A0B8B0' },
});