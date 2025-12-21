import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import ProfileStackNavigator from './ProfileStackNavigator';

const Tab = createBottomTabNavigator();

const PlaceholderScreen = ({ name }: { name: string }) => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <Icon name="construction" size={60} color="#CBD5E1" />
        <View style={{ height: 20 }} />
        <Icon name="work-outline" size={24} color="#94A3B8" />
    </View>
);

export default function AdminBottomTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#FFB800',
                tabBarInactiveTintColor: '#94A3B8',
                tabBarStyle: styles.tabBar,
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
                name="Aplikasi"
                component={() => <PlaceholderScreen name="Aplikasi" />}
                options={{
                    tabBarIcon: ({ color }) => <Icon name="assignment" size={24} color={color} />,
                }}
            />
            <Tab.Screen
                name="Darurat"
                component={() => <PlaceholderScreen name="Darurat" />}
                options={{
                    tabBarLabel: () => null,
                    tabBarButton: (props) => {
                        const { delayLongPress, ...rest } = props as any;
                        return (
                            <TouchableOpacity
                                {...rest}
                                style={styles.scanButtonContainer}
                                activeOpacity={0.8}
                            >
                                <View style={styles.scanButton}>
                                    <Icon name="notifications-active" size={28} color="#000000" />
                                </View>
                            </TouchableOpacity>
                        );
                    },
                }}
            />
            <Tab.Screen
                name="Pesan"
                component={() => <PlaceholderScreen name="Pesan" />}
                options={{
                    tabBarIcon: ({ color }) => <Icon name="email" size={24} color={color} />,
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
        height: 70,
        paddingBottom: 10,
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
