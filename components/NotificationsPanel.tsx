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

export default function NotificationsPanel({ visible, onClose, pets }: NotificationsPanelProps) {
  const [activeTab, setActiveTab] = useState<'passport' | 'location'>('passport');
  const [passports, setPassports] = useState<PassportInfo[]>([]);
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
      loadAllLocationReports(),
    ]);
    setLoading(false);
  };

  const loadAllPassports = async () => {
    const passportStatuses: PassportInfo[] = [];
    
    for (const pet of pets) {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const response = await fetch(`${BASE_URL}/api/pets/${pet.id}/passport`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        
        if (response.ok) {
          passportStatuses.push({
            petId: pet.id,
            petName: pet.name,
            petSpecies: pet.species,
            status: data.passport_status || 'pending',
            comment: data.passport_review_comment,
            updatedAt: data.passport_reviewed_at || data.created_at || new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error(`Ошибка загрузки паспорта для ${pet.name}:`, error);
      }
    }
    
    setPassports(passportStatuses);
  };

  const loadAllLocationReports = async () => {
    const allReports: LocationReport[] = [];
    
    for (const pet of pets) {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const response = await fetch(`${BASE_URL}/api/pets/${pet.id}/reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        
        if (response.ok && data.length > 0) {
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
        console.error(`Ошибка загрузки репортов для ${pet.name}:`, error);
      }
    }
    
    setLocationReports(allReports.sort((a, b) => 
      new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime()
    ));
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return { text: '✅ Одобрен', color: '#4CAF50', bg: '#E8F5E9' };
      case 'rejected': return { text: '❌ Отклонён', color: '#F44336', bg: '#FFEBEE' };
      default: return { text: '⏳ На проверке', color: '#FF9800', bg: '#FFF3E0' };
    }
  };

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

  const openMap = (latitude: number, longitude: number) => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    Alert.alert('Открыть карту', `Широта: ${latitude}, Долгота: ${longitude}`, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Открыть в Google Maps', onPress: () => Linking.openURL(url) },
    ]);
  };

  const getPendingCount = () => passports.filter(p => p.status === 'pending').length;
  const getLocationCount = () => locationReports.length;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>← Назад</Text>
          </TouchableOpacity>
          <Text style={styles.title}>🔔 Уведомления</Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{getPendingCount()}</Text>
            <Text style={styles.summaryLabel}>Заявок на проверке</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{getLocationCount()}</Text>
            <Text style={styles.summaryLabel}>Сообщений о находках</Text>
          </View>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, activeTab === 'passport' && styles.tabActive]} onPress={() => setActiveTab('passport')}>
            <Text style={[styles.tabText, activeTab === 'passport' && styles.tabTextActive]}>📋 Паспорта</Text>
            {getPendingCount() > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{getPendingCount()}</Text></View>}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'location' && styles.tabActive]} onPress={() => setActiveTab('location')}>
            <Text style={[styles.tabText, activeTab === 'location' && styles.tabTextActive]}>📍 Находки</Text>
            {getLocationCount() > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{getLocationCount()}</Text></View>}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {loading ? (
            <ActivityIndicator size="large" color="#7BC9A8" style={{ marginTop: 40 }} />
          ) : activeTab === 'passport' ? (
            passports.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📭</Text>
                <Text style={styles.emptyTitle}>Нет заявок</Text>
                <Text style={styles.emptyText}>У вас пока нет поданных заявок на паспорта</Text>
              </View>
            ) : (
              passports.map(p => {
                const status = getStatusText(p.status);
                return (
                  <View key={p.petId} style={[styles.notificationCard, { backgroundColor: status.bg }]}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.petIcon}>{p.petSpecies === 'dog' ? '🐶' : '🐱'}</Text>
                      <Text style={styles.petName}>{p.petName}</Text>
                      <Text style={[styles.statusBadge, { color: status.color }]}>{status.text}</Text>
                    </View>
                    {p.comment && <Text style={styles.comment}>💬 {p.comment}</Text>}
                    <Text style={styles.date}>📅 {formatDate(p.updatedAt)}</Text>
                  </View>
                );
              })
            )
          ) : (
            locationReports.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📍</Text>
                <Text style={styles.emptyTitle}>Нет сообщений</Text>
                <Text style={styles.emptyText}>Когда кто-то найдёт вашего питомца, здесь появятся координаты</Text>
              </View>
            ) : (
              locationReports.map(report => (
                <TouchableOpacity key={report.id} style={styles.locationCard} onPress={() => openMap(report.latitude, report.longitude)}>
                  <View style={styles.locationHeader}>
                    <Text style={styles.locationEmoji}>📍</Text>
                    <Text style={styles.locationPetName}>{report.petName}</Text>
                  </View>
                  <Text style={styles.locationCoords}>{report.latitude.toFixed(6)}°, {report.longitude.toFixed(6)}°</Text>
                  <Text style={styles.locationDate}>📅 {formatDate(report.reported_at)}</Text>
                  <Text style={styles.locationHint}>Нажмите, чтобы открыть карту</Text>
                </TouchableOpacity>
              ))
            )
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
  closeButton: { padding: 8 },
  closeButtonText: { fontSize: 16, color: '#7BC9A8', fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '700', color: '#2F4F4F' },
  summary: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: { alignItems: 'center' },
  summaryNumber: { fontSize: 28, fontWeight: '700', color: '#2F4F4F' },
  summaryLabel: { fontSize: 12, color: '#7A8F88', marginTop: 4 },
  summaryDivider: { width: 1, height: 40, backgroundColor: '#E8F0EC' },
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
    gap: 6,
  },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#7BC9A8' },
  tabText: { fontSize: 14, color: '#7A8F88' },
  tabTextActive: { color: '#7BC9A8', fontWeight: '600' },
  badge: { backgroundColor: '#FF9800', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' },
  content: { padding: 16, paddingBottom: 40 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#2F4F4F', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#7A8F88', textAlign: 'center' },
  notificationCard: { borderRadius: 18, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  petIcon: { fontSize: 24, marginRight: 12 },
  petName: { fontSize: 16, fontWeight: '600', color: '#2F4F4F', flex: 1 },
  statusBadge: { fontSize: 13, fontWeight: '500' },
  comment: { fontSize: 13, color: '#7A8F88', marginBottom: 6 },
  date: { fontSize: 11, color: '#A0B8B0' },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8F0EC',
  },
  locationHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  locationEmoji: { fontSize: 24, marginRight: 12 },
  locationPetName: { fontSize: 16, fontWeight: '600', color: '#2F4F4F' },
  locationCoords: { fontSize: 14, color: '#2F4F4F', marginBottom: 4 },
  locationDate: { fontSize: 12, color: '#A0B8B0', marginBottom: 8 },
  locationHint: { fontSize: 11, color: '#7BC9A8' },
});