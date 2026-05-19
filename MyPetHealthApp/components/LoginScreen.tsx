// components/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ImageBackground,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/hooks/AuthContext';

const formBg = require('../assets/images/ФонГлавБел.jpg');
const appLogo = require('../assets/images/Логотип.png');

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
};

interface LoginScreenProps {
  onSwitchToRegister: () => void;
  onLoginSuccess?: (userRole: string) => void;
}

export default function LoginScreen({
  onSwitchToRegister,
  onLoginSuccess,
}: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [securePassword, setSecurePassword] = useState(true);

  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все поля');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login({ email, password });

      if (result.success && result.data) {
        const userRole = result.data.user.role;
        onLoginSuccess?.(userRole);
      } else {
        Alert.alert('Ошибка', result.error || 'Не удалось войти');
      }
    } catch {
      Alert.alert('Ошибка', 'Ошибка сети. Проверьте подключение к интернету');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.background}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>
                Добро{'\n'}пожаловать
              </Text>

              <Text style={styles.subtitle}>
                Войдите в HealthyPaws и продолжайте заботиться о питомце.
              </Text>
            </View>

            <ImageBackground
              source={formBg}
              style={styles.formCard}
              imageStyle={styles.formCardImage}
              resizeMode="cover"
            >
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={22}
                  color={COLORS.text}
                  style={styles.inputIcon}
                />

                <TextInput
                  style={styles.inputInner}
                  placeholder="Электронная почта"
                  placeholderTextColor={COLORS.textSoft}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={22}
                  color={COLORS.text}
                  style={styles.inputIcon}
                />

                <TextInput
                  style={styles.inputInner}
                  placeholder="Пароль"
                  placeholderTextColor={COLORS.textSoft}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={securePassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                />

                <TouchableOpacity
                  onPress={() => setSecurePassword(!securePassword)}
                  disabled={isLoading}
                  hitSlop={10}
                >
                  <Ionicons
                    name={securePassword ? 'eye-off-outline' : 'eye-outline'}
                    size={23}
                    color={COLORS.text}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.loginButton,
                  isLoading && styles.loginButtonDisabled,
                ]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.loginButtonText}>Войти</Text>
                )}
              </TouchableOpacity>
            </ImageBackground>

            <View style={styles.bottomBlock}>
              <View style={styles.dividerRow}>
                <View style={styles.divider} />

                <Image
                  source={appLogo}
                  style={styles.bottomLogo}
                  resizeMode="contain"
                />

                <View style={styles.divider} />
              </View>

              <TouchableOpacity onPress={onSwitchToRegister} disabled={isLoading}>
                <Text style={styles.registerText}>
                  Нет аккаунта?{' '}
                  <Text style={styles.registerTextBold}>
                    Зарегистрироваться
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 74,
    paddingBottom: 34,
    justifyContent: 'center',
  },

  header: {
    marginBottom: 24,
  },

  title: {
    fontSize: 46,
    lineHeight: 50,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -1.2,
  },

  subtitle: {
    marginTop: 14,
    maxWidth: 315,
    fontSize: 16,
    lineHeight: 23,
    color: COLORS.textSoft,
    fontWeight: '600',
  },

  formCard: {
    borderRadius: 34,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 22,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    elevation: 8,
  },

  formCardImage: {
    borderRadius: 34,
  },

  inputWrapper: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 32,
    marginBottom: 15,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  inputIcon: {
    marginRight: 14,
  },

  inputInner: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 15,
    fontWeight: '600',
  },

  loginButton: {
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: COLORS.accentDark,
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 6,
  },

  loginButtonDisabled: {
    backgroundColor: '#DCCCF6',
  },

  loginButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '900',
  },

  bottomBlock: {
    marginTop: 24,
    alignItems: 'center',
  },

  dividerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },

  bottomLogo: {
    width: 34,
    height: 34,
    marginHorizontal: 16,
  },

  registerText: {
    color: COLORS.textSoft,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },

  registerTextBold: {
    color: COLORS.accentDark,
    fontWeight: '900',
  },
});