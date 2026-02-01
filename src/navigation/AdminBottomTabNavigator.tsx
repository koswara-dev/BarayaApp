import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import ProfileStackNavigator from './ProfileStackNavigator';
import EmergencyScreen from '../screens/EmergencyScreen';
import FeatherIcon from 'react-native-vector-icons/Feather';
import ApplicationScreen from '../screens/admin/ApplicationScreen';
import ScanQRScreen from '../screens/ScanQRScreen';

const Tab = createBottomTabNavigator();

const PlaceholderScreen = ({ name }: { name: string }) => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <Icon name="construction" size={60} color="#CBD5E1" />
        <View style={{ height: 20 }} />
        <Icon name="work-outline" size={24} color="#94A3B8" />
        <Text style={{ marginTop: 10, color: '#64748B' }}>Modul {name} segera hadir</Text>
    </View>
);



export default function AdminBottomTabNavigator() {
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#FFB800',
                tabBarInactiveTintColor: '#94A3B8',
                tabBarStyle: {
                    ...styles.tabBar,
                    height: 60 + insets.bottom,
                    paddingBottom: insets.bottom,
                },
                tabBarLabelStyle: styles.tabBarLabel,
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={AdminDashboardScreen}
                options={{
                    tabBarIcon: ({ color }) => <Icon name="dashboard" size={24} color={color} />,
                }}
            />
            <Tab.Screen
                name="MenuApp"
                component={ApplicationScreen}
                options={{
                    tabBarIcon: ({ color }) => <Icon name="grid-view" size={24} color={color} />,
                }}
            />
            <Tab.Screen
                name="Scan"
                component={ScanQRScreen}
                options={{
                    tabBarLabel: () => null,
                    tabBarStyle: { display: 'none' }, // Hide tab bar when on Scan screen
                    tabBarIcon: () => (
                        <View style={{
                            width: 56,
                            height: 56,
                            backgroundColor: '#FFB800',
                            borderRadius: 12,
                            borderColor: '#f5eed9ff',
                            borderWidth: 2,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 30,
                            elevation: 5,
                            shadowColor: '#FFB800',
                            shadowOpacity: 0.2,
                            shadowOffset: { width: 0, height: 3 },
                        }}>
                            <Icon name="qr-code-scanner" size={28} color="#fff" />
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="Darurat"
                component={EmergencyScreen}
                options={{
                    tabBarActiveTintColor: '#EC4899',
                    tabBarIcon: ({ color, focused }) => <FeatherIcon name="alert-circle" size={22} color={focused ? '#EC4899' : color} />,
                }}
            />
            <Tab.Screen
                name="Profil"
                component={ProfileStackNavigator}
                options={{
                    tabBarIcon: ({ color }) => <Icon name="person" size={24} color={color} />,
                }}
            />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        // height and paddingBottom handled dynamically
        paddingTop: 10,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    tabBarLabel: {
        fontSize: 12,
        fontWeight: '700',
    },

});
