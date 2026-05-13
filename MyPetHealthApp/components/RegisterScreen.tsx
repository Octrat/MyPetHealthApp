import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  ImageBackground,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/hooks/AuthContext';
import { RegisterData } from '../src/types';

const authBg = require('../assets/images/Фон.png');
const appLogo = require('../assets/images/Логотип.png');

interface RegisterScreenProps {
  onSwitchToLogin: () => void;
  onRegister: () => void;
}

export default function RegisterScreen({
  onSwitchToLogin,
  onRegister,
}: RegisterScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [securePassword, setSecurePassword] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);

  const { register } = useAuth();

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все поля');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Ошибка', 'Пароли не совпадают');
      return;
    }

    setIsLoading(true);

    try {
      const data: RegisterData = { email, password };
      const result = await register(data);

      if (result.success) {
        Alert.alert('Успех', 'Регистрация прошла успешно!');
        onRegister();
      } else {
        Alert.alert('Ошибка', result.error || 'Не удалось зарегистрироваться');
      }
    } catch (error) {
      console.log('RegisterScreen error:', error);
      Alert.alert('Ошибка', 'Ошибка сети');
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
                Создать{'\n'}аккаунт
              </Text>

              <Text style={styles.subtitle}>
                Присоединяйтесь к HealthyPaws и заботьтесь о здоровье питомца.
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
                  placeholder="Электронная почта"
                  placeholderTextColor="#7A8F88"
                  style={styles.inputInner}
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
                  placeholder="Пароль"
                  placeholderTextColor="#7A8F88"
                  style={styles.inputInner}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={securePassword}
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

              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={22}
                  color="#183F35"
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="Подтвердите пароль"
                  placeholderTextColor="#7A8F88"
                  style={styles.inputInner}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={secureConfirm}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setSecureConfirm(!secureConfirm)}
                  disabled={isLoading}
                  hitSlop={10}
                >
                  <Ionicons
                    name={secureConfirm ? 'eye-off-outline' : 'eye-outline'}
                    size={23}
                    color="#183F35"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.registerButton,
                  isLoading && styles.registerButtonDisabled,
                ]}
                onPress={handleRegister}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.registerButtonText}>
                    Зарегистрироваться
                  </Text>
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

              <TouchableOpacity onPress={onSwitchToLogin} disabled={isLoading}>
                <Text style={styles.loginText}>
                  Уже есть аккаунт?{' '}
                  <Text style={styles.loginTextBold}>Войти</Text>
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
    maxWidth: 310,
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

  registerButton: {
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

  registerButtonDisabled: {
    backgroundColor: '#6C8F83',
  },

  registerButtonText: {
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

  loginText: {
    color: '#35594F',
    fontSize: 16,
    textAlign: 'center',
  },

  loginTextBold: {
    color: '#FF5C68',
    fontWeight: '800',
  },
});