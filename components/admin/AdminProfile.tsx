// components/admin/AdminProfile.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/AuthContext';
import { BASE_URL } from '../../src/config/api';

const cardBg = require('../../assets/images/ФонГлавБел.jpg');

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

interface AdminProfileProps {
  onLogout: () => void;
  onBack?: () => void;
}

export default function AdminProfile({ onLogout, onBack }: AdminProfileProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const firstLetter = user?.name
    ? user.name.charAt(0).toUpperCase()
    : user?.email.charAt(0).toUpperCase() || '?';

  const displayAvatarUri = user?.avatar_path
    ? `${BASE_URL}${user.avatar_path}`
    : null;

  const handleLogout = () => {
    Alert.alert('Выход', 'Вы уверены, что хотите выйти из аккаунта?', [
      {
        text: 'Отмена',
        style: 'cancel',
      },
      {
        text: 'Выйти',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);

          try {
            await onLogout();
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity
              onPress={onBack}
              style={styles.backButton}
              activeOpacity={0.85}
            >
              <Ionicons name="chevron-back" size={22} color={COLORS.text} />
            </TouchableOpacity>
          )}

          <View style={styles.adminBadge}>
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color={COLORS.white}
            />
            <Text style={styles.adminBadgeText}>Администратор</Text>
          </View>

          <Text style={styles.title}>Профиль</Text>

          <Text style={styles.subtitle}>
            Данные административного аккаунта HealthyPaws
          </Text>
        </View>

        <ImageBackground
          source={cardBg}
          style={styles.profileCard}
          imageStyle={styles.cardImage}
          resizeMode="cover"
        >
          <View style={styles.avatarContainer}>
            {displayAvatarUri ? (
              <Image source={{ uri: displayAvatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarLetter}>{firstLetter}</Text>
              </View>
            )}

            <View style={styles.avatarBadge}>
              <Ionicons
                name="shield-checkmark"
                size={18}
                color={COLORS.white}
              />
            </View>
          </View>

          <Text style={styles.profileName} numberOfLines={1}>
            {user?.name || 'Администратор'}
          </Text>

          <Text style={styles.profileEmail} numberOfLines={1}>
            {user?.email || 'Email не указан'}
          </Text>
        </ImageBackground>

        <ImageBackground
          source={cardBg}
          style={styles.infoCard}
          imageStyle={styles.cardImage}
          resizeMode="cover"
        >
          <View style={styles.infoHeader}>
            <View style={styles.infoIconCircle}>
              <Ionicons name="person-outline" size={23} color={COLORS.white} />
            </View>

            <View style={styles.infoTitleBlock}>
              <Text style={styles.infoLabel}>Имя</Text>
              <Text style={styles.infoHint}>Отображаемое имя администратора</Text>
            </View>
          </View>

          <View style={styles.valueBox}>
            <Text style={styles.infoValue} numberOfLines={1}>
              {user?.name || 'Не указано'}
            </Text>
          </View>
        </ImageBackground>

        <ImageBackground
          source={cardBg}
          style={styles.infoCard}
          imageStyle={styles.cardImage}
          resizeMode="cover"
        >
          <View style={styles.infoHeader}>
            <View style={styles.infoIconCircle}>
              <Ionicons name="mail-outline" size={23} color={COLORS.white} />
            </View>

            <View style={styles.infoTitleBlock}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoHint}>Почта административного аккаунта</Text>
            </View>
          </View>

          <View style={styles.valueBox}>
            <Text style={styles.infoValue} numberOfLines={1}>
              {user?.email || 'Не указан'}
            </Text>
          </View>
        </ImageBackground>

        <ImageBackground
          source={cardBg}
          style={styles.infoCard}
          imageStyle={styles.cardImage}
          resizeMode="cover"
        >
          <View style={styles.infoHeader}>
            <View style={styles.infoIconCircle}>
              <Ionicons
                name="shield-checkmark-outline"
                size={23}
                color={COLORS.white}
              />
            </View>

            <View style={styles.infoTitleBlock}>
              <Text style={styles.infoLabel}>Роль</Text>
              <Text style={styles.infoHint}>Уровень доступа в системе</Text>
            </View>
          </View>

          <View style={styles.roleBadge}>
            <Ionicons
              name="shield-checkmark"
              size={18}
              color={COLORS.white}
            />
            <Text style={styles.roleText}>Администратор</Text>
          </View>
        </ImageBackground>

        <TouchableOpacity
          style={[styles.logoutButton, loading && styles.logoutButtonDisabled]}
          onPress={handleLogout}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={22} color={COLORS.white} />
              <Text style={styles.logoutButtonText}>Выйти из аккаунта</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 34,
  },

  header: {
    marginBottom: 18,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 3,
  },

  adminBadge: {
    alignSelf: 'flex-start',
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 14,
  },

  adminBadgeText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
  },

  title: {
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -1.2,
  },

  subtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 21,
    color: COLORS.textSoft,
    fontWeight: '600',
  },

  profileCard: {
    borderRadius: 32,
    padding: 22,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 6,
  },

  cardImage: {
    borderRadius: 32,
  },

  avatarContainer: {
    width: 118,
    height: 118,
    marginBottom: 16,
  },

  avatar: {
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 4,
    borderColor: COLORS.white,
    backgroundColor: COLORS.cardSoft,
  },

  avatarFallback: {
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: COLORS.accent,
    borderWidth: 4,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarLetter: {
    fontSize: 46,
    color: COLORS.white,
    fontWeight: '900',
  },

  avatarBadge: {
    position: 'absolute',
    right: 2,
    bottom: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accent,
    borderWidth: 3,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileName: {
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
    textAlign: 'center',
  },

  profileEmail: {
    marginTop: 5,
    fontSize: 14,
    color: COLORS.textSoft,
    fontWeight: '700',
    textAlign: 'center',
  },

  infoCard: {
    borderRadius: 32,
    padding: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 4,
  },

  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  infoIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  infoTitleBlock: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },

  infoHint: {
    marginTop: 2,
    fontSize: 13,
    color: COLORS.textSoft,
    fontWeight: '600',
  },

  valueBox: {
    minHeight: 56,
    backgroundColor: COLORS.white,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },

  infoValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },

  roleBadge: {
    alignSelf: 'flex-start',
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 21,
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  roleText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 14,
  },

  logoutButton: {
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.coral,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    shadowColor: COLORS.coralDark,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    elevation: 4,
  },

  logoutButtonDisabled: {
    opacity: 0.7,
  },

  logoutButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '900',
  },
});