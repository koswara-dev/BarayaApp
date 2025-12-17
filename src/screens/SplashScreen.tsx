import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import useAuthStore from '../stores/authStore';

export default function SplashScreen({ navigation }: any) {
    const isLoading = useAuthStore((state) => state.isLoading);
    const isHydrated = useAuthStore((state) => state.isHydrated);
    const token = useAuthStore((state) => state.token);

    useEffect(() => {
        // Wait for auth store to be hydrated (checkAuth completed)
        if (!isHydrated || isLoading) {
            return;
        }

        // Small delay to show branding
        const timer = setTimeout(() => {
            if (token) {
                navigation.replace('Main');
            } else {
                navigation.replace('Login');
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [isHydrated, isLoading, token, navigation]);

    return (
        <View style={styles.container}>
            <Text style={styles.text}>BARAYA</Text>
            <ActivityIndicator
                size="small"
                color="#2563EB"
                style={styles.loader}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        color: '#2563EB',
        fontSize: 32,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    loader: {
        marginTop: 24,
    },
});
