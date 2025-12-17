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

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const checkAuth = useAuthStore((state) => state.checkAuth);

  // Call checkAuth only once when the application starts
  // This restores the user session from secure storage
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
