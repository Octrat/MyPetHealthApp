// components/ChatList.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pet } from '../src/types';

const BASE_URL = 'http://192.168.0.29:3001';

interface Chat {
  id: number;
  pet_id: number | null;
  pet_name?: string;
  pet_species?: string;
  title: string;
  messages: any[];
  created_at: string;
  updated_at: string;
}

interface ChatListProps {
  pets: Pet[];
  onSelectChat: (chatId: number, petId: number | null, title: string) => void;
  onNewChat: () => void;
  refreshTrigger?: number;
}

export default function ChatList({ pets, onSelectChat, onNewChat, refreshTrigger }: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingChatId, setEditingChatId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    loadChats();
  }, [refreshTrigger]);

  const loadChats = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${BASE_URL}/api/assistant/chats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setChats(data);
    } catch (error) {
      console.error('Ошибка загрузки чатов:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteChat = async (chatId: number) => {
    Alert.alert(
      'Удалить чат',
      'Вы уверены? История диалога будет удалена.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');
              await fetch(`${BASE_URL}/api/assistant/chats/${chatId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              await loadChats();
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось удалить чат');
            }
          },
        },
      ]
    );
  };

  const renameChat = async (chatId: number) => {
    if (!editTitle.trim()) return;
    try {
      const token = await AsyncStorage.getItem('userToken');
      await fetch(`${BASE_URL}/api/assistant/chats/${chatId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: editTitle }),
      });
      setEditingChatId(null);
      await loadChats();
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось переименовать чат');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);
    
    if (diff < 1) return 'только что';
    if (diff < 60) return `${diff} мин назад`;
    if (diff < 1440) return `${Math.floor(diff / 60)} ч назад`;
    return `${Math.floor(diff / 1440)} д назад`;
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#7BC9A8" />
      </View>
    );
  }

  const generalChats = chats.filter(c => !c.pet_id);
  const petChats = chats.filter(c => c.pet_id);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>💬 Мои диалоги</Text>
        <TouchableOpacity style={styles.newChatButton} onPress={onNewChat}>
          <Text style={styles.newChatButtonText}>+ Новый диалог</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Общий чат */}
        {generalChats.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>📌 Общие диалоги</Text>
            {generalChats.map(chat => (
              <TouchableOpacity
                key={chat.id}
                style={styles.chatCard}
                onPress={() => onSelectChat(chat.id, null, chat.title)}
              >
                <View style={styles.chatInfo}>
                  <Text style={styles.chatIcon}>🩺</Text>
                  <View style={styles.chatDetails}>
                    <Text style={styles.chatTitle}>{chat.title}</Text>
                    <Text style={styles.chatDate}>{formatDate(chat.updated_at)}</Text>
                  </View>
                </View>
                <View style={styles.chatActions}>
                  <TouchableOpacity onPress={() => {
                    setEditingChatId(chat.id);
                    setEditTitle(chat.title);
                  }}>
                    <Text style={styles.editButton}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteChat(chat.id)}>
                    <Text style={styles.deleteButton}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Чаты питомцев */}
        {petChats.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>🐾 Диалоги о питомцах</Text>
            {petChats.map(chat => (
              <TouchableOpacity
                key={chat.id}
                style={styles.chatCard}
                onPress={() => onSelectChat(chat.id, chat.pet_id, chat.title)}
              >
                <View style={styles.chatInfo}>
                  <Text style={styles.chatIcon}>
                    {chat.pet_species === 'dog' ? '🐶' : '🐱'}
                  </Text>
                  <View style={styles.chatDetails}>
                    <Text style={styles.chatTitle}>{chat.title}</Text>
                    <Text style={styles.chatPetName}>{chat.pet_name}</Text>
                    <Text style={styles.chatDate}>{formatDate(chat.updated_at)}</Text>
                  </View>
                </View>
                <View style={styles.chatActions}>
                  <TouchableOpacity onPress={() => {
                    setEditingChatId(chat.id);
                    setEditTitle(chat.title);
                  }}>
                    <Text style={styles.editButton}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteChat(chat.id)}>
                    <Text style={styles.deleteButton}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {chats.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>💬</Text>
            <Text style={styles.emptyStateTitle}>Нет диалогов</Text>
            <Text style={styles.emptyStateText}>
              Нажмите "+ Новый диалог" чтобы начать общение с Доктором Хвостом
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Модальное окно для переименования */}
      <Modal
        visible={editingChatId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingChatId(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Переименовать диалог</Text>
            <TextInput
              style={styles.modalInput}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Название диалога"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditingChatId(null)}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={() => renameChat(editingChatId!)}
              >
                <Text style={styles.saveButtonText}>Сохранить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F9F7',
  },
  loaderContainer: {
    padding: 40,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F0EC',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2F4F4F',
  },
  newChatButton: {
    backgroundColor: '#7BC9A8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  newChatButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7A8F88',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  chatCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
  },
  chatInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  chatIcon: {
    fontSize: 32,
  },
  chatDetails: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2F4F4F',
  },
  chatPetName: {
    fontSize: 12,
    color: '#7BC9A8',
    marginTop: 2,
  },
  chatDate: {
    fontSize: 11,
    color: '#A0B8B0',
    marginTop: 2,
  },
  chatActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    fontSize: 18,
    padding: 4,
  },
  deleteButton: {
    fontSize: 18,
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2F4F4F',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#7A8F88',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2F4F4F',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E8F0EC',
  },
  cancelButtonText: {
    color: '#7A8F88',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#7BC9A8',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
});