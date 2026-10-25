
// components/NotificationsPanel.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pet } from '../src/types';
import { BASE_URL } from '../src/config/api';

interface NotificationsPanelProps {
  visible: boolean;
  onClose: () => void;
  pets: Pet[];
}

interface PassportInfo {
  petId: number;
  petName: string;
  petSpecies: string;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  updatedAt: string;
}

interface LocationReport {
  id: number;
  petId: number;
  petName: string;
  latitude: number;
  longitude: number;
  reported_at: string;
}

interface PedigreeInfo {
  id: number;
  petId: number;
  petName: string;
  petSpecies: string;

  relativePetId?: number | null;
  relativeName: string;
  relativeSpecies?: string | null;
  relativeBreed?: string | null;
  relativeSex?: string | null;

  relativeType: string;

  status: 'not_submitted' | 'pending' | 'approved' | 'rejected';

  comment?: string | null;
  updatedAt: string;
}

export default function NotificationsPanel({
  visible,
  onClose,
  pets,
}: NotificationsPanelProps) {
  const [activeTab, setActiveTab] = useState<
    'passport' | 'pedigree' | 'location'
  >('passport');

  const [passports, setPassports] = useState<PassportInfo[]>([]);
  const [pedigrees, setPedigrees] = useState<PedigreeInfo[]>([]);
  const [locationReports, setLocationReports] = useState<LocationReport[]>([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadAllData();
    }
  }, [visible, pets]);

  const loadAllData = async () => {
    setLoading(true);

    await Promise.all([
      loadAllPassports(),
      loadAllPedigrees(),
      loadAllLocationReports(),
    ]);

    setLoading(false);
  };

  // ============================================================
  // ПАСПОРТА
  // ============================================================

  const loadAllPassports = async () => {
    const passportStatuses: PassportInfo[] = [];

    for (const pet of pets) {
      try {
        const token = await AsyncStorage.getItem('userToken');

        const response = await fetch(
          `${BASE_URL}/api/pets/${pet.id}/passport`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (response.ok) {
          passportStatuses.push({
            petId: pet.id,
            petName: pet.name,
            petSpecies: pet.species,
            status: data.passport_status || 'pending',
            comment: data.passport_review_comment,
            updatedAt:
              data.passport_reviewed_at ||
              data.created_at ||
              new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error(
          `Ошибка загрузки паспорта для ${pet.name}:`,
          error
        );
      }
    }

    setPassports(passportStatuses);
  };

  // ============================================================
  // РОДОСЛОВНАЯ
  // ============================================================

  const loadAllPedigrees = async () => {
    const allPedigrees: PedigreeInfo[] = [];

    for (const pet of pets) {
      try {
        const token = await AsyncStorage.getItem('userToken');

        const url = `${BASE_URL}/api/pets/${pet.id}/pedigree`;

        console.log('🐾 LOAD PEDIGREE NOTIFICATIONS:', url);

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        console.log(
          '🐾 PEDIGREE NOTIFICATIONS STATUS:',
          response.status
        );

        console.log(
          '🐾 PEDIGREE NOTIFICATIONS DATA:',
          data
        );

        if (!response.ok) {
          continue;
        }

        if (!Array.isArray(data)) {
          console.warn(
            `Родословная для ${pet.name} пришла не массивом:`,
            data
          );
          continue;
        }

        data.forEach((item: any) => {
          const relativePet = item.relative_pet || {};

          allPedigrees.push({
            id: item.id,

            petId: pet.id,
            petName: pet.name,
            petSpecies: pet.species,

            relativePetId:
              item.relative_pet_id ??
              relativePet.id ??
              null,

            relativeName:
              item.relative_name ||
              relativePet.name ||
              'Неизвестный питомец',

            relativeSpecies:
              item.species ||
              relativePet.species ||
              null,

            relativeBreed:
              item.breed ||
              relativePet.breed_name ||
              null,

            relativeSex:
              item.sex ||
              relativePet.sex ||
              null,

            relativeType:
              item.relative_type || 'relative',

            status:
              item.status || 'pending',

            comment:
              item.review_comment || null,

            updatedAt:
              item.reviewed_at ||
              item.updated_at ||
              item.created_at ||
              new Date().toISOString(),
          });
        });
      } catch (error) {
        console.error(
          `Ошибка загрузки родословной для ${pet.name}:`,
          error
        );
      }
    }

    allPedigrees.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() -
        new Date(a.updatedAt).getTime()
    );

    setPedigrees(allPedigrees);
  };

  // ============================================================
  // СООБЩЕНИЯ О НАХОДКАХ
  // ============================================================

  const loadAllLocationReports = async () => {
    const allReports: LocationReport[] = [];

    for (const pet of pets) {
      try {
        const token = await AsyncStorage.getItem('userToken');

        const response = await fetch(
          `${BASE_URL}/api/pets/${pet.id}/reports`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (response.ok && Array.isArray(data) && data.length > 0) {
          data.forEach((report: any) => {
            allReports.push({
              id: report.id,
              petId: pet.id,
              petName: pet.name,
              latitude: report.latitude,
              longitude: report.longitude,
              reported_at: report.reported_at,
            });
          });
        }
      } catch (error) {
        console.error(
          `Ошибка загрузки репортов для ${pet.name}:`,
          error
        );
      }
    }

    setLocationReports(
      allReports.sort(
        (a, b) =>
          new Date(b.reported_at).getTime() -
          new Date(a.reported_at).getTime()
      )
    );
  };

  // ============================================================
  // СТАТУСЫ
  // ============================================================

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          text: '✅ Одобрена',
          color: '#4CAF50',
          bg: '#E8F5E9',
        };

      case 'rejected':
        return {
          text: '❌ Отклонена',
          color: '#F44336',
          bg: '#FFEBEE',
        };

      case 'pending':
        return {
          text: '⏳ На проверке',
          color: '#FF9800',
          bg: '#FFF3E0',
        };

      default:
        return {
          text: 'ℹ️ Не отправлена',
          color: '#78909C',
          bg: '#ECEFF1',
        };
    }
  };

  // ============================================================
  // НАЗВАНИЯ РОДСТВА
  // ============================================================

  const getRelationText = (relation: string) => {
    switch (relation) {
      case 'mother':
        return 'Мать';

      case 'father':
        return 'Отец';

      case 'grandmother':
        return 'Бабушка';

      case 'grandfather':
        return 'Дедушка';

      case 'daughter':
        return 'Дочь';

      case 'son':
        return 'Сын';

      case 'sister':
        return 'Сестра';

      case 'brother':
        return 'Брат';

      default:
        return relation;
    }
  };

  // ============================================================
  // ДАТА
  // ============================================================

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ============================================================
  // КАРТА
  // ============================================================

  const openMap = (latitude: number, longitude: number) => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;

    Alert.alert(
      'Открыть карту',
      `Широта: ${latitude}, Долгота: ${longitude}`,
      [
        {
          text: 'Отмена',
          style: 'cancel',
        },
        {
          text: 'Открыть в Google Maps',
          onPress: () => Linking.openURL(url),
        },
      ]
    );
  };

  // ============================================================
  // СЧЁТЧИКИ
  // ============================================================

  const getPendingPassportCount = () =>
    passports.filter(p => p.status === 'pending').length;

  const getPendingPedigreeCount = () =>
    pedigrees.filter(p => p.status === 'pending').length;

  const getPendingCount = () =>
    getPendingPassportCount() + getPendingPedigreeCount();

  const getLocationCount = () =>
    locationReports.length;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>
              ← Назад
            </Text>
          </TouchableOpacity>

          <Text style={styles.title}>
            🔔 Уведомления
          </Text>

          <View style={{ width: 50 }} />
        </View>

        {/* SUMMARY */}
        <View style={styles.summary}>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>
              {getPendingCount()}
            </Text>

            <Text style={styles.summaryLabel}>
              Заявок на проверке
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>
              {getLocationCount()}
            </Text>

            <Text style={styles.summaryLabel}>
              Сообщений о находках
            </Text>
          </View>

        </View>

        {/* TABS */}
        <View style={styles.tabs}>

          {/* ПАСПОРТА */}
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'passport' && styles.tabActive,
            ]}
            onPress={() => setActiveTab('passport')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'passport' &&
                  styles.tabTextActive,
              ]}
            >
              📋 Паспорта
            </Text>

            {getPendingPassportCount() > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {getPendingPassportCount()}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* РОДОСЛОВНАЯ */}
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'pedigree' && styles.tabActive,
            ]}
            onPress={() => setActiveTab('pedigree')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'pedigree' &&
                  styles.tabTextActive,
              ]}
            >
              🧬 Родословная
            </Text>

            {getPendingPedigreeCount() > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {getPendingPedigreeCount()}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* НАХОДКИ */}
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'location' && styles.tabActive,
            ]}
            onPress={() => setActiveTab('location')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'location' &&
                  styles.tabTextActive,
              ]}
            >
              📍 Находки
            </Text>

            {getLocationCount() > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {getLocationCount()}
                </Text>
              </View>
            )}
          </TouchableOpacity>

        </View>

        {/* CONTENT */}
        <ScrollView
          contentContainerStyle={styles.content}
        >

          {loading ? (

            <ActivityIndicator
              size="large"
              color="#7BC9A8"
              style={{ marginTop: 40 }}
            />

          ) : activeTab === 'passport' ? (

            /* ==================================================
               ПАСПОРТА
               ================================================== */

            passports.length === 0 ? (

              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>
                  📭
                </Text>

                <Text style={styles.emptyTitle}>
                  Нет заявок
                </Text>

                <Text style={styles.emptyText}>
                  У вас пока нет поданных заявок на паспорта
                </Text>
              </View>

            ) : (

              passports.map(p => {
                const status = getStatusText(p.status);

                return (
                  <View
                    key={p.petId}
                    style={[
                      styles.notificationCard,
                      {
                        backgroundColor: status.bg,
                      },
                    ]}
                  >

                    <View style={styles.cardHeader}>

                      <Text style={styles.petIcon}>
                        {p.petSpecies === 'dog'
                          ? '🐶'
                          : '🐱'}
                      </Text>

                      <Text style={styles.petName}>
                        {p.petName}
                      </Text>

                      <Text
                        style={[
                          styles.statusBadge,
                          {
                            color: status.color,
                          },
                        ]}
                      >
                        {status.text}
                      </Text>

                    </View>

                    {p.comment && (
                      <Text style={styles.comment}>
                        💬 {p.comment}
                      </Text>
                    )}

                    <Text style={styles.date}>
                      📅 {formatDate(p.updatedAt)}
                    </Text>

                  </View>
                );
              })
            )

          ) : activeTab === 'pedigree' ? (

            /* ==================================================
               РОДОСЛОВНАЯ
               ================================================== */

            pedigrees.length === 0 ? (

              <View style={styles.emptyState}>

                <Text style={styles.emptyEmoji}>
                  🧬
                </Text>

                <Text style={styles.emptyTitle}>
                  Нет заявок
                </Text>

                <Text style={styles.emptyText}>
                  Здесь появятся заявки на добавление родственников
                </Text>

              </View>

            ) : (

              pedigrees.map(item => {
                const status = getStatusText(item.status);

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.notificationCard,
                      {
                        backgroundColor: status.bg,
                      },
                    ]}
                  >

                    {/* HEADER */}

                    <View style={styles.cardHeader}>

                      <Text style={styles.petIcon}>
                        {item.petSpecies === 'dog'
                          ? '🐶'
                          : '🐱'}
                      </Text>

                      <View style={{ flex: 1 }}>

                        <Text style={styles.petName}>
                          {item.petName}
                        </Text>

                        <Text style={styles.relationText}>
                          Добавление родственника
                        </Text>

                      </View>

                      <Text
                        style={[
                          styles.statusBadge,
                          {
                            color: status.color,
                          },
                        ]}
                      >
                        {status.text}
                      </Text>

                    </View>

                    {/* RELATIVE */}

                    <View style={styles.relativeBox}>

                      <Text style={styles.relativeLabel}>
                        Родственник
                      </Text>

                      <Text style={styles.relativeName}>
                        {item.relativeName}
                      </Text>

                      <Text style={styles.relativeRelation}>
                        {getRelationText(
                          item.relativeType
                        )}
                      </Text>

                      {item.relativeBreed && (
                        <Text style={styles.relativeInfo}>
                          🐾 {item.relativeBreed}
                        </Text>
                      )}

                    </View>

                    {/* COMMENT */}

                    {item.comment && (
                      <View style={styles.commentBox}>

                        <Text style={styles.commentTitle}>
                          💬 Комментарий администратора
                        </Text>

                        <Text style={styles.comment}>
                          {item.comment}
                        </Text>

                      </View>
                    )}

                    {/* DATE */}

                    <Text style={styles.date}>
                      📅 {formatDate(item.updatedAt)}
                    </Text>

                  </View>
                );
              })
            )

          ) : (

            /* ==================================================
               НАХОДКИ
               ================================================== */

            locationReports.length === 0 ? (

              <View style={styles.emptyState}>

                <Text style={styles.emptyEmoji}>
                  📍
                </Text>

                <Text style={styles.emptyTitle}>
                  Нет сообщений
                </Text>

                <Text style={styles.emptyText}>
                  Когда кто-то найдёт вашего питомца,
                  здесь появятся координаты
                </Text>

              </View>

            ) : (

              locationReports.map(report => (

                <TouchableOpacity
                  key={report.id}
                  style={styles.locationCard}
                  onPress={() =>
                    openMap(
                      report.latitude,
                      report.longitude
                    )
                  }
                >

                  <View style={styles.locationHeader}>

                    <Text style={styles.locationEmoji}>
                      📍
                    </Text>

                    <Text style={styles.locationPetName}>
                      {report.petName}
                    </Text>

                  </View>

                  <Text style={styles.locationCoords}>
                    {report.latitude.toFixed(6)}°,
                    {' '}
                    {report.longitude.toFixed(6)}°
                  </Text>

                  <Text style={styles.locationDate}>
                    📅 {formatDate(report.reported_at)}
                  </Text>

                  <Text style={styles.locationHint}>
                    Нажмите, чтобы открыть карту
                  </Text>

                </TouchableOpacity>

              ))
            )
          )}

        </ScrollView>

      </SafeAreaView>
    </Modal>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F6F9F7',
  },

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

  closeButton: {
    padding: 8,
  },

  closeButtonText: {
    fontSize: 16,
    color: '#7BC9A8',
    fontWeight: '600',
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2F4F4F',
  },

  summary: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
  },

  summaryItem: {
    alignItems: 'center',
  },

  summaryNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2F4F4F',
  },

  summaryLabel: {
    fontSize: 12,
    color: '#7A8F88',
    marginTop: 4,
  },

  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E8F0EC',
  },

  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F0EC',
  },

  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },

  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#7BC9A8',
  },

  tabText: {
    fontSize: 12,
    color: '#7A8F88',
  },

  tabTextActive: {
    color: '#7BC9A8',
    fontWeight: '600',
  },

  badge: {
    backgroundColor: '#FF9800',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },

  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2F4F4F',
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 14,
    color: '#7A8F88',
    textAlign: 'center',
  },

  notificationCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  petIcon: {
    fontSize: 24,
    marginRight: 12,
  },

  petName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2F4F4F',
    flex: 1,
  },

  relationText: {
    fontSize: 12,
    color: '#7A8F88',
    marginTop: 2,
  },

  statusBadge: {
    fontSize: 13,
    fontWeight: '500',
  },

  relativeBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    marginBottom: 10,
  },

  relativeLabel: {
    fontSize: 11,
    color: '#A0B8B0',
    marginBottom: 3,
  },

  relativeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2F4F4F',
  },

  relativeRelation: {
    fontSize: 13,
    color: '#7BC9A8',
    fontWeight: '600',
    marginTop: 3,
  },

  relativeInfo: {
    fontSize: 12,
    color: '#7A8F88',
    marginTop: 5,
  },

  commentBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },

  commentTitle: {
    fontSize: 11,
    color: '#7A8F88',
    marginBottom: 3,
  },

  comment: {
    fontSize: 13,
    color: '#7A8F88',
    marginBottom: 6,
  },

  date: {
    fontSize: 11,
    color: '#A0B8B0',
  },

  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8F0EC',
  },

  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  locationEmoji: {
    fontSize: 24,
    marginRight: 12,
  },

  locationPetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2F4F4F',
  },

  locationCoords: {
    fontSize: 14,
    color: '#2F4F4F',
    marginBottom: 4,
  },

  locationDate: {
    fontSize: 12,
    color: '#A0B8B0',
    marginBottom: 8,
  },

  locationHint: {
    fontSize: 11,
    color: '#7BC9A8',
  },

});
