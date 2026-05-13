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

const authBg = require('../assets/images/Фон.png');
const appLogo = require('../assets/images/Логотип.png');

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
    <ImageBackground
      source={authBg}
      style={styles.background}
      resizeMode="cover"
    >
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
                Войдите в аккаунт HealthyPaws и продолжайте заботиться о питомце.
              </Text>
            </View>

            <View style={styles.decorBlock}>
              <Text style={styles.decorHeart}>♡</Text>
              <Text style={styles.decorStarOne}>✦</Text>
              <Text style={styles.decorStarTwo}>✧</Text>
            </View>

            <View style={styles.formCard}>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={22}
                  color="#183F35"
                  style={styles.inputIcon}
                />

                <TextInput
                  style={styles.inputInner}
                  placeholder="Электронная почта"
                  placeholderTextColor="#7A8F88"
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
                  color="#183F35"
                  style={styles.inputIcon}
                />

                <TextInput
                  style={styles.inputInner}
                  placeholder="Пароль"
                  placeholderTextColor="#7A8F88"
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
                    color="#183F35"
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
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginButtonText}>Войти</Text>
                )}
              </TouchableOpacity>
            </View>

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

              <TouchableOpacity
                onPress={onSwitchToRegister}
                disabled={isLoading}
              >
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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#F1FFC8',
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
    marginBottom: 16,
    zIndex: 3,
  },

  title: {
    fontSize: 44,
    lineHeight: 48,
    fontWeight: '800',
    color: '#183F35',
    letterSpacing: -1,
  },

  subtitle: {
    marginTop: 14,
    maxWidth: 320,
    fontSize: 16,
    lineHeight: 23,
    color: '#35594F',
  },

  decorBlock: {
    height: 56,
    marginTop: 0,
    marginBottom: 8,
    zIndex: 4,
  },

  decorHeart: {
    position: 'absolute',
    left: 12,
    top: 0,
    fontSize: 38,
    color: '#FF5C68',
    fontWeight: '700',
    transform: [{ rotate: '-18deg' }],
  },

  decorStarOne: {
    position: 'absolute',
    right: 70,
    top: 10,
    fontSize: 24,
    color: '#183F35',
  },

  decorStarTwo: {
    position: 'absolute',
    right: 20,
    top: 0,
    fontSize: 20,
    color: '#FF5C68',
  },

  formCard: {
    backgroundColor: '#FF5C68',
    borderRadius: 34,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 30,
    shadowColor: '#183F35',
    shadowOpacity: 0.14,
    shadowRadius: 22,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    elevation: 8,
    zIndex: 2,
  },

  inputWrapper: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FFD9',
    borderRadius: 32,
    marginBottom: 15,
    paddingHorizontal: 18,
  },

  inputIcon: {
    marginRight: 14,
  },

  inputInner: {
    flex: 1,
    fontSize: 16,
    color: '#183F35',
    paddingVertical: 15,
  },

  loginButton: {
    height: 68,
    borderRadius: 34,
    backgroundColor: '#123F32',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#123F32',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 6,
  },

  loginButtonDisabled: {
    backgroundColor: '#6C8F83',
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
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
    backgroundColor: 'rgba(24, 63, 53, 0.22)',
  },

  bottomLogo: {
    width: 34,
    height: 34,
    marginHorizontal: 16,
  },

  registerText: {
    color: '#35594F',
    fontSize: 16,
    textAlign: 'center',
  },

  registerTextBold: {
    color: '#FF5C68',
    fontWeight: '800',
  },
});