import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/ProfileScreen';
import ProfileDetailScreen from '../screens/ProfileDetailScreen';
import ServiceHistoryScreen from '../screens/ServiceHistoryScreen';
import ComplaintHistoryScreen from '../screens/ComplaintHistoryScreen';

const Stack = createNativeStackNavigator();

export default function ProfileStackNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ProfileMain" component={ProfileScreen} />
            <Stack.Screen name="ProfileDetail" component={ProfileDetailScreen} />
            <Stack.Screen name="ServiceHistory" component={ServiceHistoryScreen} />
            <Stack.Screen name="ComplaintHistory" component={ComplaintHistoryScreen} />
        </Stack.Navigator>
    );
}
