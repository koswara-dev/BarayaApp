import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Dimensions,
    ScrollView,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const slides = [
    {
        icon: 'shield-check',
        title: 'Layanan Publik Digital',
        description: 'Akses layanan administrasi publik dengan mudah, cepat, dan aman. Satu aplikasi untuk semua kebutuhan Anda.',
    },
    {
        icon: 'file-document-outline',
        title: 'Pengajuan Dokumen',
        description: 'Ajukan dokumen seperti KTP, KK, akta kelahiran, dan surat keterangan lainnya secara online.',
    },
    {
        icon: 'bell-ring-outline',
        title: 'Notifikasi Real-time',
        description: 'Dapatkan update status pengajuan dan informasi penting langsung di aplikasi Anda.',
    },
];

export default function WelcomeScreen({ navigation }: any) {
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(contentOffsetX / (width - 64));
        setActiveIndex(index);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

            {/* Top Section - Blue Background */}
            <View style={styles.topSection}>
                <View style={styles.logoContainer}>
                    <Icon name="earth" size={32} color="#FFF" />
                </View>
                <Text style={styles.brandName}>
                    <Text style={styles.brandBold}>Baraya</Text>
                    <Text style={styles.brandLight}>App</Text>
                </Text>
                <Text style={styles.adminPortal}>PELAYANAN PUBLIK</Text>
            </View>

            {/* Middle Section - Swipeable Content */}
            <View style={styles.middleSection}>
                <ScrollView
                    ref={scrollViewRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    contentContainerStyle={styles.scrollContent}
                    decelerationRate="fast"
                    snapToInterval={width - 64}
                    snapToAlignment="center"
                >
                    {slides.map((slide, index) => (
                        <View key={index} style={styles.slideContainer}>
                            <View style={styles.iconCard}>
                                <Icon name={slide.icon} size={48} color="#2563EB" />
                            </View>
                            <Text style={styles.title}>{slide.title}</Text>
                            <Text style={styles.description}>{slide.description}</Text>
                        </View>
                    ))}
                </ScrollView>

                {/* Pagination Dots */}
                <View style={styles.paginationContainer}>
                    {slides.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                activeIndex === index && styles.activeDot
                            ]}
                        />
                    ))}
                </View>
            </View>

            {/* Bottom Section - Buttons */}
            <View style={styles.bottomSection}>
                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={() => navigation.navigate('Login')}
                    activeOpacity={0.8}
                >
                    <Text style={styles.loginButtonText}>Masuk</Text>
                    <Icon name="arrow-right" size={20} color="#FFF" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.registerButton}
                    onPress={() => navigation.navigate('Register')}
                    activeOpacity={0.8}
                >
                    <Text style={styles.registerButtonText}>Daftar Akun</Text>
                </TouchableOpacity>

                {/* Footer Links */}
                <View style={styles.footerLinks}>
                    <Text style={styles.footerLink}>Kebijakan Privasi</Text>
                    <Text style={styles.footerDot}>•</Text>
                    <Text style={styles.footerLink}>Syarat Layanan</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F1F5F9',
    },
    // Top Section
    topSection: {
        backgroundColor: '#2563EB',
        paddingTop: 60,
        paddingBottom: 80,
        alignItems: 'center',
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    logoContainer: {
        width: 64,
        height: 64,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    brandName: {
        fontSize: 28,
        marginBottom: 4,
    },
    brandBold: {
        fontWeight: '700',
        color: '#FFF',
    },
    brandLight: {
        fontWeight: '400',
        color: 'rgba(255, 255, 255, 0.9)',
    },
    adminPortal: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
        letterSpacing: 2,
        fontWeight: '500',
    },
    // Middle Section
    middleSection: {
        flex: 1,
        marginTop: -40,
    },
    scrollContent: {
        paddingHorizontal: 32,
    },
    slideContainer: {
        width: width - 64,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    iconCard: {
        width: 100,
        height: 100,
        borderRadius: 24,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
        elevation: 8,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 8,
    },
    paginationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        marginBottom: 16,
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#CBD5E1',
    },
    activeDot: {
        width: 24,
        backgroundColor: '#2563EB',
    },
    // Bottom Section
    bottomSection: {
        paddingHorizontal: 24,
        paddingBottom: 32,
        paddingTop: 16,
        backgroundColor: '#FFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    loginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2563EB',
        paddingVertical: 16,
        borderRadius: 16,
        marginBottom: 12,
        gap: 8,
    },
    loginButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    registerButton: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        marginBottom: 20,
    },
    registerButtonText: {
        color: '#0F172A',
        fontSize: 16,
        fontWeight: '600',
    },
    footerLinks: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    footerLink: {
        fontSize: 12,
        color: '#94A3B8',
    },
    footerDot: {
        fontSize: 12,
        color: '#CBD5E1',
    },
});
