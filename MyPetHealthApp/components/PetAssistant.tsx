// components/PetAssistant.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.0.29:3001';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface PetAssistantProps {
  currentChatId: number | null;
  currentPetId: number | null;
  chatTitle: string;
  onBack: () => void;
  onMessagesLoaded?: (messages: Message[]) => void;
}

export default function PetAssistant({ 
  currentChatId, 
  currentPetId, 
  chatTitle, 
  onBack, 
  onMessagesLoaded 
}: PetAssistantProps) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  useEffect(() => {
    if (currentChatId && isFirstLoad) {
      loadMessages();
      setIsFirstLoad(false);
    } else if (!currentChatId) {
      setMessages([]);
    }
  }, [currentChatId]);

  const loadMessages = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${BASE_URL}/api/assistant/chats/${currentChatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.messages && data.messages.length > 0) {
        const loadedMessages = data.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(loadedMessages);
        onMessagesLoaded?.(loadedMessages);
      }
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
    }
  };

  const saveMessages = async (newMessages: Message[]) => {
    if (!currentChatId) return;
    try {
      const token = await AsyncStorage.getItem('userToken');
      await fetch(`${BASE_URL}/api/assistant/chats/${currentChatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: newMessages }),
      });
    } catch (error) {
      console.error('Ошибка сохранения сообщений:', error);
    }
  };

  const sendQuestion = async (text?: string) => {
    const questionText = text || question;
    if (!questionText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: questionText,
      isUser: true,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setQuestion('');
    setLoading(true);
    saveMessages(newMessages);

    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const token = await AsyncStorage.getItem('userToken');
      
      const history = newMessages.slice(-6).map(msg => ({
        text: msg.text,
        isUser: msg.isUser
      }));
      
      let endpoint = `${BASE_URL}/api/assistant/ask`;
      if (currentPetId) {
        endpoint = `${BASE_URL}/api/assistant/pet/${currentPetId}/ask`;
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          question: questionText,
          history: history
        }),
      });

      const data = await response.json();
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.answer || '😞 Извините, не могу ответить сейчас.',
        isUser: false,
        timestamp: new Date(),
      };
      
      const finalMessages = [...newMessages, aiMessage];
      setMessages(finalMessages);
      saveMessages(finalMessages);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      console.error('Ошибка:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: '😞 Ошибка соединения. Проверьте интернет и попробуйте снова.',
        isUser: false,
        timestamp: new Date(),
      };
      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);
      saveMessages(finalMessages);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{chatTitle}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.chatContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.chatContent}
      >
        {messages.length === 0 && (
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeIcon}>🐾</Text>
            <Text style={styles.welcomeTitle}>Доктор Хвост</Text>
            <Text style={styles.welcomeText}>
              Задайте мне любой вопрос о здоровье, уходе или воспитании вашего питомца
            </Text>
          </View>
        )}
        
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageBubble,
              msg.isUser ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            <Text style={[
              styles.messageText,
              msg.isUser ? styles.userText : styles.assistantText,
            ]}>
              {msg.text}
            </Text>
            <Text style={styles.messageTime}>
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        ))}
        
        {loading && (
          <View style={styles.loadingBubble}>
            <ActivityIndicator size="small" color="#7BC9A8" />
            <Text style={styles.loadingText}>Доктор Хвост печатает...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Спросите о здоровье питомца..."
          placeholderTextColor="#A0B8B0"
          value={question}
          onChangeText={setQuestion}
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={[styles.sendButton, !question.trim() && styles.sendButtonDisabled]}
          onPress={() => sendQuestion()}
          disabled={!question.trim() || loading}
        >
          <Text style={styles.sendButtonText}>→</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.disclaimer}>
        ⚠️ При серьезных симптомах обязательно обратитесь к ветеринару
      </Text>
    </View>
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
  backButtonText: { fontSize: 16, color: '#7BC9A8', fontWeight: '500' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#2F4F4F', flex: 1, textAlign: 'center' },
  chatContainer: { flex: 1 },
  chatContent: { padding: 16 },
  welcomeContainer: { alignItems: 'center', paddingVertical: 40 },
  welcomeIcon: { fontSize: 48, marginBottom: 16 },
  welcomeTitle: { fontSize: 20, fontWeight: '700', color: '#2F4F4F', marginBottom: 8 },
  welcomeText: { fontSize: 14, color: '#7A8F88', textAlign: 'center', paddingHorizontal: 20 },
  messageBubble: { maxWidth: '85%', padding: 12, borderRadius: 20, marginBottom: 12 },
  userBubble: { backgroundColor: '#7BC9A8', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  assistantBubble: { backgroundColor: '#FFFFFF', alignSelf: 'flex-start', borderBottomLeftRadius: 4, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  messageText: { fontSize: 14, lineHeight: 20 },
  userText: { color: '#FFFFFF' },
  assistantText: { color: '#2F4F4F' },
  messageTime: { fontSize: 10, color: '#A0B8B0', marginTop: 6, alignSelf: 'flex-end' },
  loadingBubble: { backgroundColor: '#FFFFFF', padding: 12, borderRadius: 20, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  loadingText: { fontSize: 12, color: '#7A8F88' },
  inputContainer: { flexDirection: 'row', padding: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E8F0EC', alignItems: 'flex-end' },
  input: { flex: 1, backgroundColor: '#F8FCFA', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: '#2F4F4F', maxHeight: 80 },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#7BC9A8', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  sendButtonDisabled: { backgroundColor: '#C5E0D4' },
  sendButtonText: { fontSize: 20, color: '#FFFFFF' },
  disclaimer: { fontSize: 10, color: '#A0B8B0', textAlign: 'center', paddingVertical: 8, backgroundColor: '#FFFFFF' },
});