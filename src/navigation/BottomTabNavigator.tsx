import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Feather';
import HomeScreen from '../screens/HomeScreen';
import ServiceScreen from '../screens/ServiceScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProfileStackNavigator from './ProfileStackNavigator';
import NewsScreen from '../screens/NewsScreen';
import EmergencyScreen from '../screens/EmergencyScreen';
import { BottomTabParamList } from './types';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export default function BottomTabNavigator() {
  return (
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
            <Icon name="grid" size={20} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Darurat"
        component={EmergencyScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="alert-circle" size={20} color={color} />
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
            <Icon name="user" size={20} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
