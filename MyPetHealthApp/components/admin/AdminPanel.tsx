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
  ImageBackground,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../src/hooks/AuthContext';
import AdminProfile from './AdminProfile';

const BASE_URL = 'http://192.168.0.59:3001';

const cardBg = require('../../assets/images/ФонГлавБел.jpg');
const navBg = require('../../assets/images/ФонГлав.jpg');

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
  success: '#65B891',
  warning: '#F4B740',
};

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

const BottomNav = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: 'stats' | 'passports' | 'profile';
  setActiveTab: (tab: 'stats' | 'passports' | 'profile') => void;
}) => {
  const navItems = [
    {
      key: 'stats',
      icon: 'bar-chart-outline',
      label: 'Статистика',
    },
    {
      key: 'passports',
      icon: 'document-text-outline',
      label: 'Заявки',
    },
    {
      key: 'profile',
      icon: 'person-outline',
      label: 'Профиль',
    },
  ] as const;

  return (
    <View style={styles.navWrapper}>
      <ImageBackground
        source={navBg}
        style={styles.bottomNav}
        imageStyle={styles.bottomNavImage}
        resizeMode="cover"
      >
        <View style={styles.navOverlay} />

        {navItems.map((item) => {
          const isActive = activeTab === item.key;

          return (
            <TouchableOpacity
              key={item.key}
              style={styles.navButton}
              onPress={() => setActiveTab(item.key)}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.navIconCircle,
                  isActive && styles.navIconCircleActive,
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={24}
                  color={COLORS.white}
                />
              </View>

              <Text
                style={[
                  styles.navLabel,
                  isActive && styles.navLabelActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ImageBackground>
    </View>
  );
};

export default function AdminPanel({
  onNavigate,
  onLogout,
}: AdminPanelProps) {
  const { user, isAdmin, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<
    'stats' | 'passports' | 'profile'
  >('stats');

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

  const [selectedPassport, setSelectedPassport] =
    useState<PassportRequest | null>(null);
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (response.ok) {
        setStats(data);
        setError(null);
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

      const response = await fetch(
        `${BASE_URL}/api/admin/passports/${petId}/review`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
            comment: reviewComment,
          }),
        }
      );

      if (response.ok) {
        Alert.alert(
          'Успех',
          `Заявка ${status === 'approved' ? 'одобрена' : 'отклонена'}`
        );

        setShowPassportModal(false);
        setReviewComment('');
        setSelectedPassport(null);
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

  const retryLoad = () => {
    setLoadingStats(true);
    setError(null);
    loadStats();
    loadPassports();
  };

  if (activeTab === 'profile') {
    return (
      <AdminProfile
        onLogout={handleLogout}
        onBack={() => setActiveTab('stats')}
      />
    );
  }

  if (loadingStats) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ImageBackground
            source={cardBg}
            style={styles.loaderCard}
            imageStyle={styles.cardImage}
            resizeMode="cover"
          >
            <ActivityIndicator size="large" color={COLORS.accentDark} />
            <Text style={styles.loaderTitle}>Админ панель</Text>
            <Text style={styles.loaderText}>Загружаем данные...</Text>
          </ImageBackground>
        </View>

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Админ панель</Text>
            <Text style={styles.subtitle}>Управление системой HealthyPaws</Text>
          </View>

          <ImageBackground
            source={cardBg}
            style={styles.errorCard}
            imageStyle={styles.cardImage}
            resizeMode="cover"
          >
            <View style={styles.errorIconCircle}>
              <Ionicons
                name="warning-outline"
                size={34}
                color={COLORS.white}
              />
            </View>

            <Text style={styles.errorTitle}>Ошибка загрузки</Text>
            <Text style={styles.errorText}>{error}</Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={retryLoad}
              activeOpacity={0.85}
            >
              <Ionicons name="refresh-outline" size={20} color={COLORS.white} />
              <Text style={styles.retryButtonText}>Повторить</Text>
            </TouchableOpacity>
          </ImageBackground>
        </ScrollView>

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.adminBadge}>
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color={COLORS.white}
            />
            <Text style={styles.adminBadgeText}>Администратор</Text>
          </View>

          <Text style={styles.title}>Админ панель</Text>

          <Text style={styles.subtitle}>
            Здравствуйте, {user?.name || user?.email}
          </Text>
        </View>

        {activeTab === 'stats' ? (
          <>
            <ImageBackground
              source={cardBg}
              style={styles.statsCard}
              imageStyle={styles.cardImage}
              resizeMode="cover"
            >
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconCircle}>
                  <Ionicons
                    name="bar-chart-outline"
                    size={24}
                    color={COLORS.white}
                  />
                </View>

                <View style={styles.sectionTitleBlock}>
                  <Text style={styles.sectionTitle}>Статистика системы</Text>
                  <Text style={styles.sectionSubtitle}>
                    Общая сводка по пользователям и питомцам
                  </Text>
                </View>
              </View>

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
            </ImageBackground>

            <ImageBackground
              source={cardBg}
              style={styles.quickInfoCard}
              imageStyle={styles.cardImage}
              resizeMode="cover"
            >
              <Text style={styles.quickInfoTitle}>Рабочая зона</Text>

              <Text style={styles.quickInfoText}>
                Здесь отображается основная статистика приложения. Заявки на
                паспорта доступны во вкладке «Заявки».
              </Text>
            </ImageBackground>
          </>
        ) : (
          <ImageBackground
            source={cardBg}
            style={styles.passportsSection}
            imageStyle={styles.cardImage}
            resizeMode="cover"
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconCircle}>
                <Ionicons
                  name="document-text-outline"
                  size={24}
                  color={COLORS.white}
                />
              </View>

              <View style={styles.sectionTitleBlock}>
                <Text style={styles.sectionTitle}>Заявки на паспорта</Text>
                <Text style={styles.sectionSubtitle}>
                  Проверка данных питомцев и владельцев
                </Text>
              </View>
            </View>

            {loadingPassports ? (
              <View style={styles.inlineLoader}>
                <ActivityIndicator color={COLORS.accentDark} />
                <Text style={styles.inlineLoaderText}>Загрузка заявок...</Text>
              </View>
            ) : passports.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons
                    name="checkmark-done-outline"
                    size={34}
                    color={COLORS.white}
                  />
                </View>

                <Text style={styles.emptyStateTitle}>Нет новых заявок</Text>

                <Text style={styles.emptyStateText}>
                  Все заявки обработаны или пока не поступали.
                </Text>
              </View>
            ) : (
              passports.map((req) => (
                <TouchableOpacity
                  key={req.id}
                  style={styles.passportCard}
                  onPress={() => {
                    setSelectedPassport(req);
                    setShowPassportModal(true);
                  }}
                  activeOpacity={0.85}
                >
                  <View style={styles.passportHeader}>
                    <View style={styles.passportPetIcon}>
                      <Text style={styles.passportPetEmoji}>
                        {req.species === 'dog' ? '🐶' : '🐱'}
                      </Text>
                    </View>

                    <View style={styles.passportTitleBlock}>
                      <Text style={styles.passportPetName}>{req.name}</Text>

                      <Text style={styles.passportOwner}>
                        {req.owner_name || req.owner_email}
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={21}
                      color={COLORS.textSoft}
                    />
                  </View>

                  {req.passport_number && (
                    <Text style={styles.passportInfo}>
                      № паспорта: {req.passport_number}
                    </Text>
                  )}

                  {req.passport_chip_number && (
                    <Text style={styles.passportInfo}>
                      Чип: {req.passport_chip_number}
                    </Text>
                  )}

                  <View style={styles.statusBadge}>
                    <Ionicons
                      name="time-outline"
                      size={14}
                      color={COLORS.warning}
                    />
                    <Text style={styles.statusText}>Ожидает проверки</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ImageBackground>
        )}
      </ScrollView>

      <Modal
        visible={showPassportModal}
        animationType="slide"
        onRequestClose={() => setShowPassportModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowPassportModal(false)}
                style={styles.modalBackButton}
                activeOpacity={0.85}
              >
                <Ionicons name="chevron-back" size={22} color={COLORS.text} />
              </TouchableOpacity>

              <Text style={styles.modalTitle}>Заявка на паспорт</Text>

              <Text style={styles.modalSubtitle}>
                Проверьте данные перед одобрением
              </Text>
            </View>

            <ImageBackground
              source={cardBg}
              style={styles.modalInfoCard}
              imageStyle={styles.cardImage}
              resizeMode="cover"
            >
              <View style={styles.modalInfoHeader}>
                <View style={styles.modalInfoIcon}>
                  <Ionicons name="paw-outline" size={24} color={COLORS.white} />
                </View>

                <Text style={styles.modalInfoTitle}>Информация о питомце</Text>
              </View>

              <Text style={styles.modalInfoText}>
                Имя: {selectedPassport?.name || 'Не указано'}
              </Text>

              <Text style={styles.modalInfoText}>
                Вид:{' '}
                {selectedPassport?.species === 'dog' ? 'Собака' : 'Кошка'}
              </Text>

              <Text style={styles.modalInfoText}>
                Порода: {selectedPassport?.breed_name || 'Не указана'}
              </Text>
            </ImageBackground>

            <ImageBackground
              source={cardBg}
              style={styles.modalInfoCard}
              imageStyle={styles.cardImage}
              resizeMode="cover"
            >
              <View style={styles.modalInfoHeader}>
                <View style={styles.modalInfoIcon}>
                  <Ionicons
                    name="person-outline"
                    size={24}
                    color={COLORS.white}
                  />
                </View>

                <Text style={styles.modalInfoTitle}>
                  Информация о владельце
                </Text>
              </View>

              <Text style={styles.modalInfoText}>
                Имя: {selectedPassport?.owner_name || 'Не указано'}
              </Text>

              <Text style={styles.modalInfoText}>
                Email: {selectedPassport?.owner_email || 'Не указан'}
              </Text>

              <Text style={styles.modalInfoText}>
                Телефон:{' '}
                {selectedPassport?.passport_owner_phone || 'Не указан'}
              </Text>
            </ImageBackground>

            <ImageBackground
              source={cardBg}
              style={styles.modalInfoCard}
              imageStyle={styles.cardImage}
              resizeMode="cover"
            >
              <View style={styles.modalInfoHeader}>
                <View style={styles.modalInfoIcon}>
                  <Ionicons
                    name="document-text-outline"
                    size={24}
                    color={COLORS.white}
                  />
                </View>

                <Text style={styles.modalInfoTitle}>Данные паспорта</Text>
              </View>

              <Text style={styles.modalInfoText}>
                Номер паспорта:{' '}
                {selectedPassport?.passport_number || 'Не указан'}
              </Text>

              <Text style={styles.modalInfoText}>
                Кем выдан:{' '}
                {selectedPassport?.passport_issued_by || 'Не указано'}
              </Text>

              <Text style={styles.modalInfoText}>
                Номер чипа:{' '}
                {selectedPassport?.passport_chip_number || 'Не указан'}
              </Text>

              <Text style={styles.modalInfoText}>
                Окрас: {selectedPassport?.passport_color || 'Не указан'}
              </Text>

              <Text style={styles.modalInfoText}>
                Характер:{' '}
                {selectedPassport?.passport_character || 'Не указан'}
              </Text>

              <Text style={styles.modalInfoText}>
                Место рождения:{' '}
                {selectedPassport?.passport_breeding_place || 'Не указано'}
              </Text>
            </ImageBackground>

            <ImageBackground
              source={cardBg}
              style={styles.modalInfoCard}
              imageStyle={styles.cardImage}
              resizeMode="cover"
            >
              <Text style={styles.modalInfoTitle}>Комментарий администратора</Text>

              <TextInput
                style={styles.commentInput}
                value={reviewComment}
                onChangeText={setReviewComment}
                placeholder="Можно оставить комментарий к решению..."
                placeholderTextColor={COLORS.textSoft}
                multiline
                textAlignVertical="top"
              />
            </ImageBackground>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.rejectButton]}
                onPress={() => reviewPassport('rejected')}
                activeOpacity={0.85}
              >
                <Ionicons name="close" size={21} color={COLORS.white} />
                <Text style={styles.modalButtonText}>Отклонить</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.approveButton]}
                onPress={() => reviewPassport('approved')}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark" size={21} color={COLORS.white} />
                <Text style={styles.modalButtonText}>Одобрить</Text>
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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 130,
  },

  header: {
    marginBottom: 18,
  },

  adminBadge: {
    alignSelf: 'flex-start',
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 14,
  },

  adminBadgeText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
  },

  title: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -1.1,
  },

  subtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 21,
    color: COLORS.textSoft,
    fontWeight: '600',
  },

  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
  },

  loaderCard: {
    borderRadius: 32,
    padding: 30,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  cardImage: {
    borderRadius: 32,
  },

  loaderTitle: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
  },

  loaderText: {
    marginTop: 6,
    color: COLORS.textSoft,
    fontSize: 15,
    fontWeight: '600',
  },

  errorCard: {
    borderRadius: 32,
    padding: 26,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 6,
  },

  errorIconCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: COLORS.coral,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 4,
    borderColor: COLORS.white,
  },

  errorTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 8,
  },

  errorText: {
    fontSize: 15,
    color: COLORS.textSoft,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 21,
    fontWeight: '600',
  },

  retryButton: {
    height: 52,
    paddingHorizontal: 22,
    borderRadius: 26,
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  retryButtonText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 15,
  },

  statsCard: {
    borderRadius: 32,
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 6,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  sectionIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  sectionTitleBlock: {
    flex: 1,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
  },

  sectionSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: COLORS.textSoft,
    fontWeight: '600',
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  statItem: {
    width: '47%',
    minHeight: 112,
    backgroundColor: COLORS.white,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },

  statNumber: {
    fontSize: 34,
    lineHeight: 39,
    fontWeight: '900',
    color: COLORS.text,
  },

  statLabel: {
    fontSize: 13,
    color: COLORS.textSoft,
    marginTop: 5,
    fontWeight: '800',
    textAlign: 'center',
  },

  quickInfoCard: {
    borderRadius: 32,
    padding: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  quickInfoTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 8,
  },

  quickInfoText: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSoft,
    fontWeight: '600',
  },

  passportsSection: {
    borderRadius: 32,
    padding: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 6,
  },

  inlineLoader: {
    alignItems: 'center',
    paddingVertical: 30,
  },

  inlineLoaderText: {
    marginTop: 10,
    color: COLORS.textSoft,
    fontWeight: '700',
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },

  emptyIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 4,
    borderColor: COLORS.white,
  },

  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 6,
  },

  emptyStateText: {
    fontSize: 14,
    color: COLORS.textSoft,
    textAlign: 'center',
    fontWeight: '600',
  },

  passportCard: {
    backgroundColor: COLORS.white,
    borderRadius: 26,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  passportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  passportPetIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  passportPetEmoji: {
    fontSize: 24,
  },

  passportTitleBlock: {
    flex: 1,
  },

  passportPetName: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },

  passportOwner: {
    marginTop: 3,
    fontSize: 13,
    color: COLORS.textSoft,
    fontWeight: '700',
  },

  passportInfo: {
    fontSize: 13,
    color: COLORS.textSoft,
    marginTop: 4,
    fontWeight: '600',
  },

  statusBadge: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: 'rgba(244, 183, 64, 0.16)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  statusText: {
    fontSize: 12,
    color: COLORS.warning,
    fontWeight: '900',
  },

  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 34,
  },

  modalHeader: {
    marginBottom: 18,
  },

  modalBackButton: {
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

  modalTitle: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -1,
  },

  modalSubtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 21,
    color: COLORS.textSoft,
    fontWeight: '600',
  },

  modalInfoCard: {
    borderRadius: 32,
    padding: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 3,
  },

  modalInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  modalInfoIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  modalInfoTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },

  modalInfoText: {
    fontSize: 14,
    color: COLORS.textSoft,
    marginBottom: 7,
    fontWeight: '700',
    lineHeight: 20,
  },

  commentInput: {
    minHeight: 110,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingTop: 14,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
    marginTop: 12,
  },

  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },

  modalButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },

  approveButton: {
    backgroundColor: COLORS.success,
  },

  rejectButton: {
    backgroundColor: COLORS.coral,
  },

  modalButtonText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 15,
  },

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
    backgroundColor: '#F0C9BE',
    borderRadius: 34,
    paddingHorizontal: 10,
    paddingVertical: 10,
    overflow: 'hidden',
    shadowColor: COLORS.text,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 8,
  },

  bottomNavImage: {
    borderRadius: 34,
    opacity: 0.16,
  },

  navOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(240, 201, 190, 0.84)',
    borderRadius: 34,
  },

  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },

  navIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginBottom: 4,
  },

  navIconCircleActive: {
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.accentDark,
    shadowOpacity: 0.24,
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
    opacity: 0.92,
  },

  navLabelActive: {
    color: COLORS.white,
    opacity: 1,
    fontWeight: '900',
  },
});