/**
 * Baraya App
 * React Native application with secure authentication
 *
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import Toast from './src/components/Toast';
import useAuthStore from './src/stores/authStore';
import useNotificationStore from './src/stores/notificationStore';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const { startPolling, stopPolling } = useNotificationStore();
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const token = useAuthStore((state) => state.token);

  // Handle polling lifecycle based on auth state
  useEffect(() => {
    if (token) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [token, startPolling, stopPolling]);

  // Restore session once on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  return (
    <View style={styles.container}>
      <RootNavigator />
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
