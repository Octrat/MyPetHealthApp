// components/PetAssistant.tsx
import React, { useState, useRef } from 'react';
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

const BASE_URL = 'http://192.168.0.77:3001';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// Быстрые вопросы для подсказки
const QUICK_QUESTIONS = [
  'Чем кормить щенка? 🐶',
  'Как понять, что кошка больна? 🐱',
  'Как часто мыть собаку? 🛁',
  'Что делать при отравлении? ⚠️',
];

export default function PetAssistant() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '🐾 Привет! Я Доктор Хвост!\n\nЗадайте мне любой вопрос о здоровье, уходе или воспитании вашего питомца. Я постараюсь помочь!',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const sendQuestion = async (text?: string) => {
    const questionText = text || question;
    if (!questionText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: questionText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      // 🔥 ДОБАВЛЯЕМ ИСТОРИЮ СООБЩЕНИЙ 🔥
      // Берем последние 6 сообщений для контекста (исключая только что добавленное)
      const historyMessages = messages.slice(-6);
      const history = historyMessages.map(msg => ({
        text: msg.text,
        isUser: msg.isUser
      }));
      
      const response = await fetch(`${BASE_URL}/api/assistant/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          question: questionText,
          history: history  // ← ОТПРАВЛЯЕМ ИСТОРИЮ НА СЕРВЕР
        }),
      });

      const data = await response.json();
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.answer || '😞 Извините, не могу ответить сейчас. Попробуйте переформулировать вопрос.',
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      console.error('Ошибка:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: '😞 Ошибка соединения. Проверьте интернет и попробуйте снова.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        text: '🐾 Привет! Я Доктор Хвост!\n\nЗадайте мне любой вопрос о здоровье, уходе или воспитании вашего питомца. Я постараюсь помочь!',
        isUser: false,
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>🩺</Text>
          <View>
            <Text style={styles.headerTitle}>Доктор Хвост</Text>
            <Text style={styles.headerSubtitle}>Ваш ветеринарный помощник</Text>
          </View>
        </View>
        <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.chatContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.chatContent}
      >
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

      {/* Быстрые вопросы */}
      {messages.length < 3 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.quickQuestionsContainer}
          contentContainerStyle={styles.quickQuestionsContent}
        >
          {QUICK_QUESTIONS.map((q, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickQuestion}
              onPress={() => sendQuestion(q)}
            >
              <Text style={styles.quickQuestionText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    backgroundColor: '#F6F9F7',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8F0EC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#7BC9A8',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    fontSize: 28,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 20,
  },
  chatContainer: {
    maxHeight: 400,
  },
  chatContent: {
    padding: 12,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 20,
    marginBottom: 12,
  },
  userBubble: {
    backgroundColor: '#7BC9A8',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: '#2F4F4F',
  },
  messageTime: {
    fontSize: 10,
    color: '#A0B8B0',
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  loadingBubble: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 12,
    color: '#7A8F88',
  },
  quickQuestionsContainer: {
    maxHeight: 50,
    marginBottom: 8,
  },
  quickQuestionsContent: {
    paddingHorizontal: 12,
  },
  quickQuestion: {
    backgroundColor: '#E8F0EC',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  quickQuestionText: {
    fontSize: 12,
    color: '#2F4F4F',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8F0EC',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#F8FCFA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2F4F4F',
    maxHeight: 80,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7BC9A8',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#C5E0D4',
  },
  sendButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  disclaimer: {
    fontSize: 10,
    color: '#A0B8B0',
    textAlign: 'center',
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
});