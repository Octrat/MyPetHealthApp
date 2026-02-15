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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/hooks/AuthContext';
import { RegisterData } from '../src/types';

interface RegisterScreenProps {
  onSwitchToLogin: () => void;
  onRegister: () => void;
}

export default function RegisterScreen({ onSwitchToLogin, onRegister }: RegisterScreenProps) {
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
      Alert.alert('Ошибка сети');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.logo}>🐾</Text>
            <Text style={styles.title}>HealthyPaws</Text>
            <Text style={styles.subtitle}>Создайте аккаунт</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              placeholder="Email"
              placeholderTextColor="#9BB8AE"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />

            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="Пароль"
                placeholderTextColor="#9BB8AE"
                style={styles.inputInner}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={securePassword}
                editable={!isLoading}
              />
              <TouchableOpacity onPress={() => setSecurePassword(!securePassword)} disabled={isLoading}>
                <Ionicons
                  name={securePassword ? 'eye-off' : 'eye'}
                  size={22}
                  color="#7A8F88"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="Подтвердите пароль"
                placeholderTextColor="#9BB8AE"
                style={styles.inputInner}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={secureConfirm}
                editable={!isLoading}
              />
              <TouchableOpacity onPress={() => setSecureConfirm(!secureConfirm)} disabled={isLoading}>
                <Ionicons
                  name={secureConfirm ? 'eye-off' : 'eye'}
                  size={22}
                  color="#7A8F88"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.registerButtonText}>Зарегистрироваться</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={onSwitchToLogin} disabled={isLoading}>
              <Text style={styles.loginText}>
                Уже есть аккаунт? <Text style={styles.loginTextBold}>Войти</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F9F7',
    justifyContent: 'center',
    padding: 20,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 40,
    paddingHorizontal: 25,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },

  header: {
    alignItems: 'center',
    marginBottom: 30,
  },

  logo: {
    fontSize: 52,
    marginBottom: 10,
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2F4F4F',
  },

  subtitle: {
    fontSize: 15,
    color: '#7A8F88',
    marginTop: 6,
    textAlign: 'center',
  },

  form: {
    marginTop: 10,
  },

  input: {
    backgroundColor: '#F9FBFA',
    padding: 16,
    borderRadius: 16,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E3ECE8',
    color: '#2F4F4F',
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FBFA',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E3ECE8',
    marginBottom: 15,
    paddingHorizontal: 14,
  },

  inputInner: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#2F4F4F',
  },

  registerButton: {
    backgroundColor: '#7BC9A8',
    padding: 16,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 10,
  },

  registerButtonDisabled: {
    backgroundColor: '#CFEDE2',
  },

  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },

  loginText: {
    color: '#7A8F88',
    fontSize: 15,
    marginTop: 20,
    textAlign: 'center',
  },

  loginTextBold: {
    color: '#7BC9A8',
    fontWeight: '600',
  },
});
