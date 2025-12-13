import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Feather';
import HomeScreen from '../screens/HomeScreen';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Beranda"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => <Icon name="home" size={20} color={color} />
        }}
      />
      <Tab.Screen
        name="Layanan"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => <Icon name="grid" size={20} color={color} />
        }}
      />
      <Tab.Screen
        name="Profil"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => <Icon name="user" size={20} color={color} />
        }}
      />
      <Tab.Screen
        name="Bantuan"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => <Icon name="help-circle" size={20} color={color} />
        }}
      />
    </Tab.Navigator>
  );
}
