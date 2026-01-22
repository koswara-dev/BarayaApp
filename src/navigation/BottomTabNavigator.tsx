import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { TourGuideProvider, TourGuideZone } from 'rn-tourguide';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
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
          height: 60,
          paddingBottom: 8,
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
          tabBarButton: (props) => {
            const { delayLongPress, ...rest } = props as any;
            return (
              <TouchableOpacity
                {...rest}
                style={styles.scanButtonContainer}
                activeOpacity={0.8}
              >
                <TourGuideZone
                    zone={6}
                    text="Scan QR Code untuk akses cepat"
                    shape="circle"
                >
                    <View style={styles.scanButton}>
                    <MaterialIcon name="qr-code-scanner" size={28} color="#000000" />
                    </View>
                </TourGuideZone>
              </TouchableOpacity>
            );
          },
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
  scanButtonContainer: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButton: {
    width: 60,
    height: 60,
    borderRadius: 12, // Square-ish from image but rounded
    backgroundColor: '#FFB800',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    elevation: 5,
    shadowColor: '#FFB800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
