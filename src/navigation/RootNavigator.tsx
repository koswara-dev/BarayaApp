import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigator from './BottomTabNavigator';
import ServiceDetailScreen from '../screens/ServiceDetailScreen';

import LoginScreen from '../screens/LoginScreen';
import SplashScreen from '../screens/SplashScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import NotificationScreen from '../screens/NotificationScreen';
import MapEmergencyScreen from '../screens/MapEmergencyScreen';
import ProfileDetailScreen from '../screens/ProfileDetailScreen';

import RegisterScreen from '../screens/RegisterScreen';
import RegisterFormScreen from '../screens/RegisterFormScreen';
import OtpVerificationScreen from '../screens/OtpVerificationScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

import { navigationRef } from './navigationRef';
import useAuthStore from '../stores/authStore';

export default function RootNavigator() {
  const { token, isHydrated } = useAuthStore();

  // While checking auth status, show the Splash screen content directly
  if (!isHydrated) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          // Authenticated Stack - ONLY shows if token is present
          <>
            <Stack.Screen name="Main" component={BottomTabNavigator} />
            <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
            <Stack.Screen name="Notifikasi" component={NotificationScreen} />
            <Stack.Screen name="MapEmergency" component={MapEmergencyScreen} />
            <Stack.Screen name="ProfileDetail" component={ProfileDetailScreen} />
          </>
        ) : (
          // Unauthenticated Stack - ONLY shows if token is null
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="RegisterForm" component={RegisterFormScreen} />
            <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

