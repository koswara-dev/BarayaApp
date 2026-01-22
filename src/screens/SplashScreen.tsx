import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, Alert, Linking, Platform } from 'react-native';
import api from '../config/api';

interface Props {
    onCheckComplete?: () => void;
}

export default function SplashScreen({ onCheckComplete }: Props) {
    useEffect(() => {
        checkVersion();
    }, []);

    const checkVersion = async () => {
        try {
            // Check version from API
            const response = await api.get('/pengaturan');
            const remoteVersion = response.data?.data?.versi || response.data?.versi;
            
            // Current app version (hardcoded or from package.json)
            const currentVersion = '1.0.0'; 

            if (remoteVersion && remoteVersion !== currentVersion) {
                Alert.alert(
                    'Pembaruan Tersedia',
                    'Versi aplikasi Anda sudah usang. Silakan update untuk melanjutkan.',
                    [
                        {
                            text: 'Update Aplikasi',
                            onPress: () => {
                                // Default store URLs or from API
                                const url = Platform.OS === 'android'
                                    ? 'market://details?id=com.barayaapp' // Replace with actual ID if known
                                    : 'https://apps.apple.com/app/id123456789';
                                Linking.openURL(url).catch(err => console.error('An error occurred', err));
                                // Do not proceed
                            }
                        }
                    ],
                    { cancelable: false }
                );
            } else {
                // Version match or no remote version returned -> proceed
                if (onCheckComplete) onCheckComplete();
            }
        } catch (error) {
            console.log('Version check failed, proceeding:', error);
            // Fail open regarding network errors to allow offline usage if needed (or minimal disruption)
            if (onCheckComplete) onCheckComplete();
        }
    };

    return (
        <View style={styles.container}>
            <Image 
                source={require('../assets/baraya.png')}
                style={styles.logo}
                resizeMode="contain"
            />
            <View style={styles.textContainer}>
                <Text style={styles.title}>Smart Service</Text>
                <Text style={styles.subtitle}>Kuningan Melesat</Text>
            </View>
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
        padding: 20,
    },
    logo: {
        width: 150,
        height: 150,
        marginBottom: 24,
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        color: '#2563EB',
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: 1,
        textAlign: 'center',
    },
    subtitle: {
        color: '#F59E0B', // Secondary color (Yellow/Gold often looks good with Blue) or match existing theme
        fontSize: 20,
        fontWeight: '700',
        marginTop: 4,
        textAlign: 'center',
    },
    loader: {
        marginTop: 24,
    },
});
