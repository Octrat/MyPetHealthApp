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
  Platform,
  KeyboardAvoidingView,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.0.59:3001';

const chatBg = require('../assets/images/ФонГлав.jpg');

const COLORS = {
  background: '#F7F0FF',
  cream: '#FFFFFF',
  creamSoft: '#F7F0FF',
  peach: '#FFE8E1',
  peachLight: '#F7F0FF',
  orange: '#C9A7FF',
  orangeDark: '#A984E8',
  coral: '#C9A7FF',
  coralSoft: '#F7F0FF',
  text: '#202020',
  textSoft: '#6F6578',
  border: '#EADDF8',
  white: '#FFFFFF',
};

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
  onMessagesLoaded,
}: PetAssistantProps) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const scrollToBottom = (animated = true) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated });
    }, 120);
  };

  useEffect(() => {
    if (currentChatId && isFirstLoad) {
      loadMessages();
      setIsFirstLoad(false);
    } else if (!currentChatId) {
      setMessages([]);
    }
  }, [currentChatId, isFirstLoad]);

  useEffect(() => {
    setIsFirstLoad(true);
  }, [currentChatId]);

  const loadMessages = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');

      const response = await fetch(
        `${BASE_URL}/api/assistant/chats/${currentChatId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.messages && data.messages.length > 0) {
        const loadedMessages = data.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));

        setMessages(loadedMessages);
        onMessagesLoaded?.(loadedMessages);
        scrollToBottom(false);
      } else {
        setMessages([]);
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
        body: JSON.stringify({
          messages: newMessages,
        }),
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
    scrollToBottom(true);

    try {
      const token = await AsyncStorage.getItem('userToken');

      const history = newMessages.slice(-6).map((msg) => ({
        text: msg.text,
        isUser: msg.isUser,
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
          history,
        }),
      });

      const data = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.answer || 'Извините, сейчас не могу ответить.',
        isUser: false,
        timestamp: new Date(),
      };

      const finalMessages = [...newMessages, aiMessage];

      setMessages(finalMessages);
      saveMessages(finalMessages);
      scrollToBottom(true);
    } catch (error) {
      console.error('Ошибка:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Ошибка соединения. Проверьте интернет и попробуйте снова.',
        isUser: false,
        timestamp: new Date(),
      };

      const finalMessages = [...newMessages, errorMessage];

      setMessages(finalMessages);
      saveMessages(finalMessages);
      scrollToBottom(true);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ImageBackground
      source={chatBg}
      style={styles.background}
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <View style={styles.header}>
          <View style={styles.headerIconCircle}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={22}
              color={COLORS.orangeDark}
            />
          </View>

          <View style={styles.headerTextBlock}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {chatTitle}
            </Text>

            <Text style={styles.headerSubtitle}>
              ИИ-помощник по заботе о питомце
            </Text>
          </View>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.chatContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.chatContent}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollToBottom(true)}
        >
          {messages.length === 0 && (
            <View style={styles.welcomeContainer}>
              <View style={styles.welcomeIconCircle}>
                <Ionicons name="paw-outline" size={36} color={COLORS.white} />
              </View>

              <Text style={styles.welcomeTitle}>Доктор Хвост</Text>

              <Text style={styles.welcomeText}>
                Задайте вопрос о здоровье, уходе или поведении питомца.
              </Text>

              <View style={styles.hintPill}>
                <Text style={styles.hintText}>
                  Например: «Почему питомец мало ест?»
                </Text>
              </View>
            </View>
          )}

          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                msg.isUser ? styles.userMessageRow : styles.assistantMessageRow,
              ]}
            >
              {!msg.isUser && (
                <View style={styles.assistantAvatar}>
                  <Ionicons name="paw-outline" size={17} color={COLORS.white} />
                </View>
              )}

              <View
                style={[
                  styles.messageBubble,
                  msg.isUser ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    msg.isUser ? styles.userText : styles.assistantText,
                  ]}
                >
                  {msg.text}
                </Text>

                <Text
                  style={[
                    styles.messageTime,
                    msg.isUser
                      ? styles.userMessageTime
                      : styles.assistantMessageTime,
                  ]}
                >
                  {formatTime(msg.timestamp)}
                </Text>
              </View>
            </View>
          ))}

          {loading && (
            <View style={styles.messageRow}>
              <View style={styles.assistantAvatar}>
                <Ionicons name="paw-outline" size={17} color={COLORS.white} />
              </View>

              <View style={styles.loadingBubble}>
                <ActivityIndicator size="small" color={COLORS.orange} />
                <Text style={styles.loadingText}>Доктор Хвост печатает...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.bottomBlock}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Спросите о здоровье питомца..."
              placeholderTextColor={COLORS.textSoft}
              value={question}
              onChangeText={(text) => {
                setQuestion(text);
                scrollToBottom(true);
              }}
              onFocus={() => scrollToBottom(true)}
              multiline
              maxLength={500}
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                (!question.trim() || loading) && styles.sendButtonDisabled,
              ]}
              onPress={() => sendQuestion()}
              disabled={!question.trim() || loading}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-up" size={22} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.disclaimerPill}>
            <Ionicons
              name="warning-outline"
              size={13}
              color={COLORS.orangeDark}
            />
            <Text style={styles.disclaimer}>
              При серьёзных симптомах обратитесь к ветеринару
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  backgroundImage: {
    borderRadius: 30,
  },

  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  header: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },

  headerIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  headerTextBlock: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -0.4,
  },

  headerSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '700',
  },

  chatContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  chatContent: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 18,
  },

  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: 34,
    paddingHorizontal: 16,
  },

  welcomeIconCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: COLORS.text,
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 4,
  },

  welcomeTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 8,
    letterSpacing: -0.4,
  },

  welcomeText: {
    maxWidth: 280,
    fontSize: 15,
    lineHeight: 21,
    color: 'rgba(255, 255, 255, 0.92)',
    textAlign: 'center',
    fontWeight: '600',
  },

  hintPill: {
    marginTop: 16,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  hintText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '800',
    textAlign: 'center',
  },

  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },

  userMessageRow: {
    justifyContent: 'flex-end',
  },

  assistantMessageRow: {
    justifyContent: 'flex-start',
  },

  assistantAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 2,
  },

  messageBubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 22,
  },

  userBubble: {
    backgroundColor: COLORS.orange,
    borderBottomRightRadius: 7,
  },

  assistantBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 7,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2,
  },

  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },

  userText: {
    color: COLORS.white,
    fontWeight: '600',
  },

  assistantText: {
    color: COLORS.text,
    fontWeight: '600',
  },

  messageTime: {
    fontSize: 10,
    marginTop: 6,
    alignSelf: 'flex-end',
  },

  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.72)',
  },

  assistantMessageTime: {
    color: COLORS.textSoft,
  },

  loadingBubble: {
    maxWidth: '82%',
    minHeight: 46,
    backgroundColor: COLORS.white,
    borderRadius: 22,
    borderBottomLeftRadius: 7,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  loadingText: {
    fontSize: 12,
    color: COLORS.textSoft,
    fontWeight: '700',
  },

  bottomBlock: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 12 : 10,
  },

  inputContainer: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.white,
    borderRadius: 30,
    paddingLeft: 16,
    paddingRight: 7,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 3,
  },

  input: {
    flex: 1,
    maxHeight: 88,
    paddingTop: 10,
    paddingBottom: 10,
    paddingRight: 10,
    fontSize: 14,
    lineHeight: 19,
    color: COLORS.text,
    fontWeight: '600',
  },

  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.orangeDark,
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 4,
  },

  sendButtonDisabled: {
    backgroundColor: COLORS.peach,
    shadowOpacity: 0,
    elevation: 0,
  },

  disclaimerPill: {
    marginTop: 8,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 5,
  },

  disclaimer: {
    fontSize: 10,
    color: COLORS.textSoft,
    textAlign: 'center',
    fontWeight: '700',
  },
});