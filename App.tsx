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
import useEmergencyStore from './src/stores/emergencyStore';
import GlobalEmergencyModal from './src/components/GlobalEmergencyModal';
import notifee, { EventType } from '@notifee/react-native';
import { notificationHelper } from './src/utils/notificationHelper';
import { navigate } from './src/navigation/navigationRef';



function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const startPolling = useNotificationStore((state) => state.startPolling);
  const stopPolling = useNotificationStore((state) => state.stopPolling);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const token = useAuthStore((state) => state.token);
  const isHydrated = useAuthStore((state) => state.isHydrated);

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

  // Setup FCM (Permission + Token + Foreground Listener)
  useEffect(() => {
      let unsubscribeFCM: (() => void) | undefined;

      const setupFCM = async () => {
          const hasPermission = await notificationHelper.requestUserPermission();
          if (hasPermission) {
              await notificationHelper.getFCMToken();
              await notificationHelper.subscribeToTopics();
              unsubscribeFCM = notificationHelper.setupFCMListener();
          }
      };


      setupFCM();

      return () => {
          if (unsubscribeFCM) {
              unsubscribeFCM();
          }
      };
  }, []);

  // Handle notification foreground events
  useEffect(() => {
    // Only handle events if we are sure about auth state
    if (!isHydrated) return;

    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        const { notification } = detail;
        const data = notification?.data;

        // Ensure data exists and check category
        const isEmergency = data?.category === 'DARURAT' ||
          notification?.android?.channelId === 'emergency' ||
          notification?.title === "Pesan Darurat!" ||
          data?.judul === "Pesan Darurat!";

        if (isEmergency) {
          const eventId = data?.eventId || data?.referenceId || data?.id;
          console.log('Emergency notification pressed, eventId:', eventId);

          if (eventId) {
            // Show the global high-priority alert modal
            useEmergencyStore.getState().showModalWithFetch(String(eventId));
          }
        }
      }
    });

    return () => unsubscribe();
  }, [isHydrated]);

  // Check for initial notification (app opened from notification)
  useEffect(() => {
    // CRITICAL: Must wait for hydration (token restoration) before 
    // fetching emergency data, otherwise API call fails with 401
    // and triggers "Session Expired" logout.
    if (!isHydrated) return;

    notifee.getInitialNotification().then((initialNotification) => {
      if (initialNotification) {
        const { notification } = initialNotification;
        const data = notification?.data;

        const isEmergency = data?.category === 'DARURAT' ||
          notification?.android?.channelId === 'emergency' ||
          notification.title === "Pesan Darurat!" ||
          data?.judul === "Pesan Darurat!";

        if (isEmergency) {
          const eventId = data?.eventId || data?.referenceId || data?.id;
          console.log('App opened from emergency notification, eventId:', eventId);

          if (eventId) {
            useEmergencyStore.getState().showModalWithFetch(String(eventId));
          }
        }
      }
    });
  }, [isHydrated]);

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
      <GlobalEmergencyModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
