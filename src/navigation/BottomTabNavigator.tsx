import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { TourGuideProvider, TourGuideZone } from 'rn-tourguide';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import ServiceScreen from '../screens/ServiceScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProfileStackNavigator from './ProfileStackNavigator';
import NewsScreen from '../screens/NewsScreen';
import EmergencyScreen from '../screens/EmergencyScreen';
import ScanQRScreen from '../screens/ScanQRScreen';
import { BottomTabParamList } from './types';

const Tab = createBottomTabNavigator<BottomTabParamList>();

const PlaceholderScreen = ({ name }: { name: string }) => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <MaterialIcon name="construction" size={60} color="#CBD5E1" />
        <View style={{ height: 20 }} />
        <MaterialIcon name="work-outline" size={24} color="#94A3B8" />
        <Text style={{ marginTop: 10, color: '#64748B' }}>Modul {name} segera hadir</Text>
    </View>
);

export default function BottomTabNavigator() {
  const insets = useSafeAreaInsets();
  return (
    <TourGuideProvider
        androidStatusBarVisible
        borderRadius={16}
        labels={{
            previous: 'KEMBALI',
            next: 'LANJUT',
            skip: 'LEWATI',
            finish: 'SELESAI',
        }}
    >
        <Tab.Navigator
        screenOptions={{
            headerShown: false,
        tabBarActiveTintColor: '#FFC107',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          elevation: 0
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600'
        }
      }}>
      <Tab.Screen
        name="Beranda"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="home" size={20} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Layanan"
        component={ServiceScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <TourGuideZone
                zone={5}
                text="Lihat semua layanan yang tersedia"
                shape="circle"
            >
                <Icon name="grid" size={20} color={color} />
            </TourGuideZone>
          ),
        }}
      />

      <Tab.Screen
        name="Scan"
        component={ScanQRScreen}
        options={{
          tabBarLabel: () => null,
          tabBarStyle: { display: 'none' }, // Hide tab bar when on Scan screen
          tabBarIcon: () => (
            <TourGuideZone
                zone={6}
                text="Scan QR Code untuk akses cepat"
                shape="rectangle"
                style={{ borderRadius: 12 }}
            >
                <View style={{
                    width: 56,
                    height: 56,
                    backgroundColor: '#FFC107',
                    borderRadius: 12,
                    borderColor: '#f5eed9ff',
                    borderWidth: 2,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 30,
                    elevation: 5,
                    shadowColor: '#FFC107',
                    shadowOpacity: 0.2,
                    shadowOffset: { width: 0, height: 3 },
                }}>
                    <MaterialIcon name="qr-code-scanner" size={28} color="#fff" />
                </View>
            </TourGuideZone>
          ),
        }}
      />

      <Tab.Screen
        name="Darurat"
        component={EmergencyScreen}
        options={{
          tabBarActiveTintColor: '#EC4899',
          tabBarIcon: ({ color, focused }) => (
            <TourGuideZone
                zone={7}
                text="Tombol darurat untuk situasi urgent"
                shape="circle"
            >
                <Icon name="alert-circle" size={20} color={focused ? '#EC4899' : color} />
            </TourGuideZone>
          ),
        }}
      />

      {/* <Tab.Screen
        name="Berita"
        component={NewsScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="newspaper" size={20} color={color} />
          ),
        }}
      /> */}

      <Tab.Screen
        name="Profil"
        component={ProfileStackNavigator}
        options={{
          tabBarIcon: ({ color }) => (
            <TourGuideZone
                zone={8}
                text="Kelola profil akun anda"
                shape="circle"
            >
                <Icon name="user" size={20} color={color} />
            </TourGuideZone>
          ),
        }}
      />
    </Tab.Navigator>
    </TourGuideProvider>
  );
}

const styles = StyleSheet.create({

});
