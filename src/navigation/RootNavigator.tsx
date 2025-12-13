import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigator from './BottomTabNavigator';
import ServiceDetailScreen from '../screens/ServiceDetailScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={BottomTabNavigator} />
        <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
