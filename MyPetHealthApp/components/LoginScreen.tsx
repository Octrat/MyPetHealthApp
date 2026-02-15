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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/hooks/AuthContext';

interface LoginScreenProps {
  onSwitchToRegister: () => void;
}

export default function LoginScreen({ onSwitchToRegister }: LoginScreenProps) {
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

      if (!result.success) {
        Alert.alert('Ошибка', result.error || 'Не удалось войти');
      }
    } catch {
      Alert.alert('Ошибка', 'Ошибка сети. Проверьте подключение к интернету');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.logo}>🐾</Text>
          <Text style={styles.title}>HealthyPaws</Text>
          <Text style={styles.subtitle}>
            Забота о здоровье вашего питомца
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#9BB8AE"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.inputInner}
              placeholder="Пароль"
              placeholderTextColor="#9BB8AE"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={securePassword}
              autoCapitalize="none"
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setSecurePassword(!securePassword)}
              disabled={isLoading}
            >
              <Ionicons
                name={securePassword ? 'eye-off' : 'eye'}
                size={22}
                color="#7A8F88"
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
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Войти</Text>
            )}
          </TouchableOpacity>

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

  loginButton: {
    backgroundColor: '#7BC9A8',
    padding: 16,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 10,
  },

  loginButtonDisabled: {
    backgroundColor: '#CFEDE2',
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },

  registerText: {
    color: '#7A8F88',
    fontSize: 15,
    marginTop: 20,
    textAlign: 'center',
  },

  registerTextBold: {
    color: '#7BC9A8',
    fontWeight: '600',
  },
});
