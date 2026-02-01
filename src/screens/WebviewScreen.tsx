import React from 'react';
import { View, StyleSheet, ActivityIndicator, StatusBar, TouchableOpacity, Text, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import useAuthStore from '../stores/authStore';
import useToastStore from '../stores/toastStore';

export default function WebviewScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { url, title, isAuth, userAgent, headers } = route.params || {};
    
    const signIn = useAuthStore((state) => state.signIn);
    const showToast = useToastStore((state) => state.showToast);

    // Handler for intercepting login callbacks
    const handleNavigationStateChange = (navState: any) => {
        if (!isAuth) return;

        const { url } = navState;

        // Check if URL contains token (indication of successful login callback)
        // Adjust this pattern based on your actual backend response
        // Common patterns: ?token=... or ?accessToken=...
        if (url && (url.includes('?token=') || url.includes('&token=') || url.includes('?accessToken=') || url.includes('&accessToken='))) {
            try {
                // Parse URL parameters
                // Simple parser
                const regexToken = /[?&](token|accessToken)=([^&#]*)/;
                const regexRefreshToken = /[?&](refreshToken)=([^&#]*)/;
                
                const matchToken = url.match(regexToken);
                const matchRefreshToken = url.match(regexRefreshToken);

                if (matchToken && matchToken[2]) {
                    const token = matchToken[2];
                    const refreshToken = matchRefreshToken ? matchRefreshToken[2] : undefined;

                    signIn(token, refreshToken);
                    showToast("Login Google Berhasil", "success");
                    
                    // Navigate back or to Main
                    // We use reset to ensure the stack is clean
                     navigation.reset({
                        index: 0,
                        routes: [{ name: 'Main' }],
                    });
                }
            } catch (error) {
                console.error("Error parsing auth URL:", error);
                showToast("Gagal memproses login Google", "error");
                navigation.goBack();
            }
        }
    };

    // Redirect specific URLs to external browser
    React.useEffect(() => {
        if (url && url.includes('antrean.bpjs-kesehatan.go.id')) {
            Linking.openURL(url).catch(err => {
                console.error("Failed to open URL:", err);
                showToast("Gagal membuka browser eksternal", "error");
            });
            navigation.goBack();
        }
    }, [url]);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
             <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
             {/* Simple Header */}
             <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.title} numberOfLines={1}>{title || 'Website'}</Text>
                <View style={{ width: 40 }} />
             </View>

            <WebView
                source={{ 
                    uri: url,
                    headers: headers 
                }}
                userAgent={userAgent} // Only use custom UserAgent if provided via params
                startInLoadingState={true}
                renderLoading={() => (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#F59E0B" />
                    </View>
                )}
                onNavigationStateChange={handleNavigationStateChange}
                // Also hook into onShouldStartLoadWithRequest for iOS/Android consistency if needed
                // onShouldStartLoadWithRequest={(request) => {
                //    // can return false to stop loading if token detected
                //    return true; 
                // }}
                style={{ flex: 1 }}
                // Enable third party cookies for Google Login
                sharedCookiesEnabled={true}
                thirdPartyCookiesEnabled={true}
                domStorageEnabled={true}
                javaScriptEnabled={true}
                // Advanced DOM and Network permissions
                originWhitelist={['*']}
                allowFileAccess={true}
                allowUniversalAccessFromFileURLs={true}
                allowFileAccessFromFileURLs={true}
                mixedContentMode="always"
                setSupportMultipleWindows={false}
                // Removed custom userAgent to use system default for best compatibility with modern Angular apps
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        height: Platform.OS === 'ios' ? 44 : 56,
        marginTop: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        elevation: 2,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
        flex: 1,
        textAlign: 'center',
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC'
    }
});
