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
                Создать{'\n'}аккаунт
              </Text>

              <Text style={styles.subtitle}>
                Присоединяйтесь к HealthyPaws и заботьтесь о здоровье питомца.
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
                  placeholder="Электронная почта"
                  placeholderTextColor={COLORS.textSoft}
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
                  color={COLORS.text}
                  style={styles.inputIcon}
                />

                <TextInput
                  placeholder="Пароль"
                  placeholderTextColor={COLORS.textSoft}
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
                    color={COLORS.text}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={22}
                  color={COLORS.text}
                  style={styles.inputIcon}
                />

                <TextInput
                  placeholder="Подтвердите пароль"
                  placeholderTextColor={COLORS.textSoft}
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
                    color={COLORS.text}
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
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.registerButtonText}>
                    Зарегистрироваться
                  </Text>
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

  registerButton: {
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

  registerButtonDisabled: {
    backgroundColor: '#DCCCF6',
  },

  registerButtonText: {
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

  loginText: {
    color: COLORS.textSoft,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },

  loginTextBold: {
    color: COLORS.accentDark,
    fontWeight: '900',
  },
});