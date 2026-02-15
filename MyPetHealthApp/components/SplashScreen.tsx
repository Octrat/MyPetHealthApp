import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.logo}>🐾</Text>
        <Text style={styles.title}>HealthyPaws</Text>
        <Text style={styles.subtitle}>Загружаемся...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F9F7',
    justifyContent: 'center',
    alignItems: 'center',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 40,
    paddingHorizontal: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },

  logo: {
    fontSize: 60,
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2F4F4F',
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 16,
    color: '#7A8F88',
  },
});
