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
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../src/hooks/AuthContext';
import AdminProfile from './AdminProfile';

const BASE_URL = 'http://192.168.0.29:3001';

interface AdminPanelProps {
  onNavigate?: (screen: string) => void;
  onLogout?: () => void;
}

interface Stats {
  totalUsers: number;
  totalPets: number;
  totalDogs: number;
  totalCats: number;
}

interface PassportRequest {
  id: number;
  name: string;
  species: string;
  breed_name?: string;
  owner_email: string;
  owner_name: string;
  passport_number: string;
  passport_issued_by: string;
  passport_chip_number: string;
  passport_color: string;
  passport_character: string;
  passport_breeding_place: string;
  passport_owner_name: string;
  passport_owner_phone: string;
  passport_status: string;
  passport_review_comment?: string;
}

// Отдельный компонент для нижней навигации
const BottomNav = ({ 
  activeTab, 
  setActiveTab 
}: { 
  activeTab: 'stats' | 'passports' | 'profile';
  setActiveTab: (tab: 'stats' | 'passports' | 'profile') => void;
}) => {
  const navItems = [
    { key: 'stats', icon: '📊', label: 'Статистика' },
    { key: 'passports', icon: '📋', label: 'Заявки' },
    { key: 'profile', icon: '👤', label: 'Профиль' },
  ] as const;

  return (
    <View style={styles.bottomNav}>
      {navItems.map((item) => (
        <TouchableOpacity
          key={item.key}
          style={[styles.navButton, activeTab === item.key && styles.navButtonActive]}
          onPress={() => setActiveTab(item.key)}
        >
          <Text style={[styles.navText, activeTab === item.key && styles.navTextActive]}>
            {item.icon}
          </Text>
          <Text style={[styles.navLabel, activeTab === item.key && styles.navLabelActive]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default function AdminPanel({ onNavigate, onLogout }: AdminPanelProps) {
  const { user, isAdmin, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'stats' | 'passports' | 'profile'>('stats');
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalPets: 0,
    totalDogs: 0,
    totalCats: 0,
  });
  const [passports, setPassports] = useState<PassportRequest[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingPassports, setLoadingPassports] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPassport, setSelectedPassport] = useState<PassportRequest | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [showPassportModal, setShowPassportModal] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      Alert.alert('Доступ запрещён', 'У вас нет прав администратора');
      onNavigate?.('login');
    } else {
      loadStats();
      loadPassports();
    }
  }, []);

  const loadStats = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${BASE_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const data = await response.json();
      if (response.ok) {
        setStats(data);
      } else {
        setError(data.message || 'Ошибка загрузки статистики');
      }
    } catch (err: any) {
      console.error('Ошибка загрузки статистики:', err);
      setError('Не удалось загрузить статистику');
    } finally {
      setLoadingStats(false);
    }
  };

  const loadPassports = async () => {
    setLoadingPassports(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${BASE_URL}/api/admin/passports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setPassports(data);
    } catch (error) {
      console.error('Ошибка загрузки заявок:', error);
    } finally {
      setLoadingPassports(false);
    }
  };

  const reviewPassport = async (status: 'approved' | 'rejected') => {
    if (!selectedPassport) return;
    
    const petId = selectedPassport.id;
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${BASE_URL}/api/admin/passports/${petId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, comment: reviewComment }),
      });

      if (response.ok) {
        Alert.alert('Успех', `Заявка ${status === 'approved' ? 'одобрена' : 'отклонена'}`);
        setShowPassportModal(false);
        setReviewComment('');
        loadPassports();
      } else {
        throw new Error('Ошибка обработки');
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось обработать заявку');
    }
  };

  const handleLogout = async () => {
    await logout();
    onLogout?.();
    onNavigate?.('login');
  };

  // Если выбран профиль — показываем отдельный компонент
  if (activeTab === 'profile') {
    return <AdminProfile onLogout={handleLogout} onBack={() => setActiveTab('stats')} />;
  }

  if (loadingStats) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#7BC9A8" />
          <Text style={styles.loaderText}>Загрузка панели администратора...</Text>
        </View>
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🛡️ Админ панель</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => {
            setLoadingStats(true);
            loadStats();
            loadPassports();
          }}>
            <Text style={styles.retryButtonText}>🔄 Повторить</Text>
          </TouchableOpacity>
        </View>
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🛡️ Админ панель</Text>
        <Text style={styles.subtitle}>Здравствуйте, {user?.name || user?.email}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'stats' ? (
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
        ) : (
          <View style={styles.passportsSection}>
            <Text style={styles.sectionTitle}>📋 Заявки на паспорта</Text>
            {loadingPassports ? (
              <ActivityIndicator color="#7BC9A8" />
            ) : passports.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Нет новых заявок</Text>
              </View>
            ) : (
              passports.map(req => (
                <TouchableOpacity
                  key={req.id}
                  style={styles.passportCard}
                  onPress={() => {
                    setSelectedPassport(req);
                    setShowPassportModal(true);
                  }}
                >
                  <View style={styles.passportHeader}>
                    <Text style={styles.passportPetName}>{req.name}</Text>
                    <Text style={styles.passportPetSpecies}>
                      {req.species === 'dog' ? '🐶' : '🐱'}
                    </Text>
                  </View>
                  <Text style={styles.passportOwner}>Владелец: {req.owner_name || req.owner_email}</Text>
                  {req.passport_number && (
                    <Text style={styles.passportInfo}>№ паспорта: {req.passport_number}</Text>
                  )}
                  {req.passport_chip_number && (
                    <Text style={styles.passportInfo}>Чип: {req.passport_chip_number}</Text>
                  )}
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>⏳ Ожидает проверки</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Модальное окно просмотра заявки */}
      <Modal visible={showPassportModal} animationType="slide" onRequestClose={() => setShowPassportModal(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPassportModal(false)} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>← Назад</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Заявка на паспорт</Text>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalInfoCard}>
              <Text style={styles.modalInfoTitle}>🐾 Информация о питомце</Text>
              <Text style={styles.modalInfoText}>Имя: {selectedPassport?.name}</Text>
              <Text style={styles.modalInfoText}>Вид: {selectedPassport?.species === 'dog' ? 'Собака' : 'Кошка'}</Text>
              <Text style={styles.modalInfoText}>Порода: {selectedPassport?.breed_name || 'Не указана'}</Text>
            </View>

            <View style={styles.modalInfoCard}>
              <Text style={styles.modalInfoTitle}>👤 Информация о владельце</Text>
              <Text style={styles.modalInfoText}>Имя: {selectedPassport?.owner_name || 'Не указано'}</Text>
              <Text style={styles.modalInfoText}>Email: {selectedPassport?.owner_email}</Text>
              <Text style={styles.modalInfoText}>Телефон: {selectedPassport?.passport_owner_phone || 'Не указан'}</Text>
            </View>

            <View style={styles.modalInfoCard}>
              <Text style={styles.modalInfoTitle}>📋 Данные паспорта</Text>
              <Text style={styles.modalInfoText}>Номер паспорта: {selectedPassport?.passport_number || 'Не указан'}</Text>
              <Text style={styles.modalInfoText}>Кем выдан: {selectedPassport?.passport_issued_by || 'Не указано'}</Text>
              <Text style={styles.modalInfoText}>Номер чипа: {selectedPassport?.passport_chip_number || 'Не указан'}</Text>
              <Text style={styles.modalInfoText}>Окрас: {selectedPassport?.passport_color || 'Не указан'}</Text>
              <Text style={styles.modalInfoText}>Характер: {selectedPassport?.passport_character || 'Не указан'}</Text>
              <Text style={styles.modalInfoText}>Место рождения: {selectedPassport?.passport_breeding_place || 'Не указано'}</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.rejectButton]}
                onPress={() => reviewPassport('rejected')}
              >
                <Text style={styles.modalButtonText}>❌ Отклонить</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.approveButton]}
                onPress={() => reviewPassport('approved')}
              >
                <Text style={styles.modalButtonText}>✅ Одобрить</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F9F7' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F0EC',
  },
  title: { fontSize: 24, fontWeight: '700', color: '#2F4F4F', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#7A8F88', textAlign: 'center', marginTop: 4 },
  content: { padding: 16, paddingBottom: 80 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: 12, color: '#7A8F88' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorEmoji: { fontSize: 48, marginBottom: 16 },
  errorText: { fontSize: 16, color: '#7A8F88', textAlign: 'center', marginBottom: 20 },
  retryButton: { backgroundColor: '#7BC9A8', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25 },
  retryButtonText: { color: '#FFFFFF', fontWeight: '600' },
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
  passportsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#2F4F4F', marginBottom: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyStateText: { fontSize: 14, color: '#7A8F88' },
  passportCard: {
    backgroundColor: '#F8FCFA',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8F0EC',
  },
  passportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  passportPetName: { fontSize: 16, fontWeight: '700', color: '#2F4F4F' },
  passportPetSpecies: { fontSize: 20 },
  passportOwner: { fontSize: 13, color: '#7A8F88', marginBottom: 4 },
  passportInfo: { fontSize: 12, color: '#7A8F88', marginTop: 2 },
  statusBadge: { marginTop: 8, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#FF980020' },
  statusText: { fontSize: 12, color: '#FF9800' },
  modalContainer: { flex: 1, backgroundColor: '#F6F9F7' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F0EC',
  },
  modalCloseButton: { padding: 8 },
  modalCloseText: { fontSize: 16, color: '#7BC9A8', fontWeight: '600' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#2F4F4F' },
  modalContent: { padding: 16, paddingBottom: 40 },
  modalInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  modalInfoTitle: { fontSize: 16, fontWeight: '700', color: '#2F4F4F', marginBottom: 12 },
  modalInfoText: { fontSize: 14, color: '#7A8F88', marginBottom: 6 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 10 },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  approveButton: { backgroundColor: '#4CAF50' },
  rejectButton: { backgroundColor: '#F44336' },
  modalButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 70,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8F0EC',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  navButtonActive: {
    backgroundColor: '#F8FCFA',
  },
  navText: {
    fontSize: 24,
    color: '#7A8F88',
  },
  navTextActive: {
    color: '#7BC9A8',
  },
  navLabel: {
    fontSize: 11,
    color: '#7A8F88',
    marginTop: 4,
  },
  navLabelActive: {
    color: '#7BC9A8',
  },
});