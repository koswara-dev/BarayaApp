import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import useAuthStore from '../stores/authStore';

export default function SplashScreen() {
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
