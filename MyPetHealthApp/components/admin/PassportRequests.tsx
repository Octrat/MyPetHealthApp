// components/admin/PassportRequests.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.0.29:3001';

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

export default function PassportRequests() {
  const [requests, setRequests] = useState<PassportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PassportRequest | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${BASE_URL}/api/admin/passports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      console.log('📋 ТИП ДАННЫХ:', typeof data);
      console.log('📋 ЯВЛЯЕТСЯ МАССИВОМ:', Array.isArray(data));
      console.log('📋 КОЛИЧЕСТВО ЗАЯВОК:', data.length);
      console.log('📋 ПЕРВАЯ ЗАЯВКА (ПОЛНОСТЬЮ):', JSON.stringify(data[0], null, 2));
      console.log('📋 ID ПЕРВОЙ ЗАЯВКИ:', data[0]?.id);
      setRequests(data);
    } catch (error) {
      console.error('Ошибка загрузки заявок:', error);
    } finally {
      setLoading(false);
    }
  };

  const reviewRequest = async (status: 'approved' | 'rejected') => {
    if (!selectedRequest) {
      Alert.alert('Ошибка', 'Заявка не выбрана');
      return;
    }
    
    const petId = selectedRequest.id;
    console.log('📋 Отправка запроса для питомца ID:', petId);
    
    if (!petId) {
      Alert.alert('Ошибка', 'ID питомца не найден');
      return;
    }
    
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
        setShowModal(false);
        setReviewComment('');
        loadRequests();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Ошибка обработки');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      Alert.alert('Ошибка', 'Не удалось обработать заявку');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#7BC9A8" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📋 Заявки на паспорта</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {requests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>Нет новых заявок</Text>
            <Text style={styles.emptyText}>Все заявки обработаны</Text>
          </View>
        ) : (
          requests.map(req => (
            <TouchableOpacity
              key={req.id}
              style={styles.requestCard}
              onPress={() => {
                console.log('📋 Выбрана заявка ID:', req.id);
                setSelectedRequest(req);
                setShowModal(true);
              }}
            >
              <View style={styles.requestHeader}>
                <Text style={styles.petName}>{req.name}</Text>
                <Text style={styles.petSpecies}>{req.species === 'dog' ? '🐶' : '🐱'}</Text>
              </View>
              <Text style={styles.ownerInfo}>Владелец: {req.owner_name || req.owner_email}</Text>
              {req.passport_number && <Text style={styles.passportInfo}>№ паспорта: {req.passport_number}</Text>}
              {req.passport_chip_number && <Text style={styles.passportInfo}>Чип: {req.passport_chip_number}</Text>}
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>⏳ Ожидает проверки</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" onRequestClose={() => setShowModal(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.modalBackButton}>← Назад</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Заявка на паспорт</Text>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>🐾 Питомец</Text>
              <Text>Имя: {selectedRequest?.name}</Text>
              <Text>Вид: {selectedRequest?.species === 'dog' ? 'Собака' : 'Кошка'}</Text>
              <Text>Порода: {selectedRequest?.breed_name || 'Не указана'}</Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>👤 Владелец</Text>
              <Text>Имя: {selectedRequest?.owner_name || 'Не указано'}</Text>
              <Text>Email: {selectedRequest?.owner_email}</Text>
              <Text>Телефон: {selectedRequest?.passport_owner_phone || 'Не указан'}</Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>📋 Данные паспорта</Text>
              <Text>Номер паспорта: {selectedRequest?.passport_number || 'Не указан'}</Text>
              <Text>Кем выдан: {selectedRequest?.passport_issued_by || 'Не указано'}</Text>
              <Text>Номер чипа: {selectedRequest?.passport_chip_number || 'Не указан'}</Text>
              <Text>Окрас: {selectedRequest?.passport_color || 'Не указан'}</Text>
              <Text>Характер: {selectedRequest?.passport_character || 'Не указан'}</Text>
              <Text>Место рождения: {selectedRequest?.passport_breeding_place || 'Не указано'}</Text>
            </View>

            <TextInput
              style={styles.commentInput}
              placeholder="Комментарий (при отклонении)"
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.rejectButton]}
                onPress={() => reviewRequest('rejected')}
              >
                <Text style={styles.modalButtonText}>❌ Отклонить</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.approveButton]}
                onPress={() => reviewRequest('approved')}
              >
                <Text style={styles.modalButtonText}>✅ Одобрить</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F9F7' },
  header: { padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E8F0EC' },
  title: { fontSize: 20, fontWeight: '700', color: '#2F4F4F' },
  content: { padding: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#2F4F4F', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#7A8F88' },
  requestCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 12 },
  requestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  petName: { fontSize: 18, fontWeight: '700', color: '#2F4F4F' },
  petSpecies: { fontSize: 20 },
  ownerInfo: { fontSize: 13, color: '#7A8F88', marginBottom: 4 },
  passportInfo: { fontSize: 12, color: '#7A8F88', marginTop: 2 },
  statusBadge: { marginTop: 8, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#FF980020' },
  statusText: { fontSize: 12, color: '#FF9800' },
  modalContainer: { flex: 1, backgroundColor: '#F6F9F7' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E8F0EC' },
  modalBackButton: { fontSize: 16, color: '#7BC9A8', fontWeight: '600' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#2F4F4F' },
  modalContent: { padding: 16 },
  infoCard: { backgroundColor: '#F8FCFA', borderRadius: 16, padding: 16, marginBottom: 16 },
  infoTitle: { fontSize: 16, fontWeight: '700', color: '#2F4F4F', marginBottom: 8 },
  commentInput: { borderWidth: 1, borderColor: '#DDD', borderRadius: 12, padding: 12, height: 80, textAlignVertical: 'top', marginBottom: 16 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  approveButton: { backgroundColor: '#4CAF50' },
  rejectButton: { backgroundColor: '#F44336' },
  modalButtonText: { color: '#FFFFFF', fontWeight: '600' },
});