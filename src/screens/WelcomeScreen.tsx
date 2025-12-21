import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Dimensions,
    Image,
    SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }: any) {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Background Pattern Mockup (Optional) */}
            <View style={styles.bgPatternContainer}>
                <View style={styles.circle1} />
                <View style={styles.circle2} />
                <View style={styles.circle3} />
            </View>

            <View style={styles.content}>
                {/* Logo Section */}
                <View style={styles.logoWrapper}>
                    <View style={styles.logoStackUnderlay} />
                    <View style={styles.logoMainBox}>
                        <View style={styles.logoInnerContent}>
                            <Image
                                source={{ uri: 'https://kuningankab.go.id/id/wp-content/uploads/2021/04/LOGO-KUNINGAN-300x300.png' }}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                            <Text style={styles.logoText}>I KUNINGAN</Text>
                            <Text style={styles.logoTagline}>LAYANAN JADI MUDAH</Text>
                        </View>
                    </View>
                </View>

                {/* Title Section */}
                <View style={styles.titleSection}>
                    <Text style={styles.welcomeText}>SELAMAT DATANG DI</Text>
                    <Text style={styles.brandPrimary}>Kuningan</Text>
                    <Text style={styles.brandSecondary}>Melesat</Text>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Description */}
                <Text style={styles.description}>
                    Smart Service terintegrasi untuk masyarakat Kabupaten Kuningan.
                    Kelola layanan publik dengan cepat, mudah, dan transparan.
                </Text>
            </View>

            {/* Bottom Section - Buttons */}
            <View style={styles.actionsBox}>
                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={() => navigation.navigate('Login')}
                    activeOpacity={0.8}
                >
                    <Icon name="log-in-outline" size={24} color="#0F172A" />
                    <Text style={styles.loginText}>Masuk</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.registerButton}
                    onPress={() => navigation.navigate('Register')}
                    activeOpacity={0.8}
                >
                    <Icon name="person-add-outline" size={20} color="#0F172A" />
                    <Text style={styles.registerText}>Daftar Akun</Text>
                </TouchableOpacity>

                <Text style={styles.footerText}>
                    PEMERINTAH KABUPATEN KUNINGAN © 2024
                </Text>
            </View>

            {/* Bottom Yellow Stripe */}
            <View style={styles.yellowStripe} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    bgPatternContainer: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: -1,
    },
    circle1: {
        width: 300,
        height: 300,
        borderRadius: 150,
        borderWidth: 1,
        borderColor: '#F8FAFC',
        position: 'absolute',
    },
    circle2: {
        width: 500,
        height: 500,
        borderRadius: 250,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        position: 'absolute',
    },
    circle3: {
        width: 700,
        height: 700,
        borderRadius: 350,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        position: 'absolute',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingTop: height * 0.1,
    },
    logoWrapper: {
        width: 200,
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
    },
    logoStackUnderlay: {
        width: 160,
        height: 160,
        backgroundColor: '#FEF3C7',
        position: 'absolute',
        transform: [{ rotate: '-6deg' }],
        borderRadius: 8,
        opacity: 0.5,
    },
    logoMainBox: {
        width: 170,
        height: 170,
        backgroundColor: '#FFFFFF',
        borderRadius: 4,
        padding: 2,
    },
    logoInnerContent: {
        flex: 1,
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
        backgroundColor: '#F8F9F3', // Creamy background like the image
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 2,
    },
    logoImage: {
        width: 60,
        height: 60,
        marginBottom: 8,
    },
    logoText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#166534',
        letterSpacing: 1,
    },
    logoTagline: {
        fontSize: 6,
        fontWeight: '700',
        color: '#166534',
        opacity: 0.6,
    },
    titleSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    welcomeText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#FFB800',
        letterSpacing: 1.5,
        marginBottom: 8,
    },
    brandPrimary: {
        fontSize: 48,
        fontWeight: '900',
        color: '#0F172A',
        lineHeight: 52,
    },
    brandSecondary: {
        fontSize: 48,
        fontWeight: '900',
        color: '#FFB800',
        lineHeight: 52,
    },
    divider: {
        width: 60,
        height: 4,
        backgroundColor: '#F1F5F9',
        borderRadius: 2,
        marginBottom: 24,
    },
    description: {
        paddingHorizontal: 54,
        textAlign: 'center',
        fontSize: 15,
        color: '#64748B',
        lineHeight: 24,
        fontWeight: '500',
    },
    actionsBox: {
        paddingHorizontal: 32,
        paddingBottom: 40,
        alignItems: 'center',
    },
    loginButton: {
        width: '100%',
        height: 60,
        backgroundColor: '#FFB800',
        borderRadius: 4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 16,
    },
    loginText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0F172A',
    },
    registerButton: {
        width: '100%',
        height: 60,
        backgroundColor: '#FFFFFF',
        borderRadius: 4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        marginBottom: 40,
    },
    registerText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0F172A',
    },
    footerText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#CBD5E1',
        letterSpacing: 1,
    },
    yellowStripe: {
        height: 8,
        backgroundColor: '#FFB800',
        width: '100%',
        position: 'absolute',
        bottom: 0,
    },
});
