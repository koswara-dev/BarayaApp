import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    TextInput
} from 'react-native';
import useToastStore from '../stores/toastStore';
import api from '../config/api';
import Icon from 'react-native-vector-icons/Ionicons';
import LoadingOverlay from '../components/LoadingOverlay';

export default function ForgotPasswordScreen({ navigation }: any) {
    const showToast = useToastStore((state) => state.showToast);

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRequestReset = async () => {
        if (!email.trim()) {
            showToast("Mohon masukkan email Anda", "error");
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/forgot-password', { email });

            if (response.status === 200 || response.data?.success) {
                showToast("Kode verifikasi telah dikirim ke email Anda", "success");
                navigation.navigate('ResetPassword', { email: email });
            } else {
                showToast(response.data?.message || "Gagal mengirim kode", "error");
            }
        } catch (error: any) {
            console.error("Forgot Password Request Error:", error);
            const msg = error.response?.data?.message || "Terjadi kesalahan";
            showToast(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <LoadingOverlay visible={loading} message="Mengirim Kode..." />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.logoWrapper}>
                    <View style={styles.logoBox}>
                        <Icon name="lock-open-outline" size={32} color="#FFB800" />
                    </View>
                </View>

                <Text style={styles.title}>Lupa Kata Sandi?</Text>
                <Text style={styles.subtitle}>
                    Masukkan email yang terdaftar untuk menerima kode verifikasi pemulihan kata sandi.
                </Text>

                <View style={styles.formContainer}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <View style={styles.inputBox}>
                        <Icon name="mail-outline" size={20} color="#94A3B8" />
                        <TextInput
                            style={styles.input}
                            placeholder="nama@email.com"
                            placeholderTextColor="#94A3B8"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.loginBtn}
                        onPress={handleRequestReset}
                        disabled={loading}
                    >
                        <Text style={styles.loginBtnText}>Kirim Kode</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
            
            {/* Bottom Stripe */}
            <View style={styles.bottomStripe} />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
    },
    headerBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    logoWrapper: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logoBox: {
        width: 70,
        height: 70,
        borderWidth: 1.5,
        borderColor: '#FFB800',
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },
    title: {
        fontSize: 32,
        fontWeight: "900",
        textAlign: "center",
        color: "#0F172A",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        textAlign: "center",
        color: "#64748B",
        lineHeight: 22,
        paddingHorizontal: 20,
        marginBottom: 40,
    },
    formContainer: {
        width: '100%',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 8,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 4,
        paddingHorizontal: 16,
        height: 56,
        backgroundColor: '#FFFFFF',
        marginBottom: 24,
    },
    input: {
        flex: 1,
        marginLeft: 12,
        fontSize: 15,
        color: '#0F172A',
        fontWeight: '500',
    },
    loginBtn: {
        width: '100%',
        height: 56,
        backgroundColor: '#FFB800',
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    loginBtnText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0F172A',
    },
    bottomStripe: {
        height: 8,
        backgroundColor: '#FFB800',
        width: '100%',
    },
});
