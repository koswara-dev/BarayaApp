import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from "react-native";

import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import useToastStore from "../stores/toastStore";
import useAuthActions from "../hooks/useAuthActions";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function LoginScreen({ navigation }: any) {
    const { login, logout } = useAuthActions();
    const showToast = useToastStore((state) => state.showToast);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        // Validation
        if (!email.trim()) {
            showToast("Email tidak boleh kosong", "error");
            return;
        }
        if (!password.trim()) {
            showToast("Kata sandi tidak boleh kosong", "error");
            return;
        }

        setLoading(true);

        const result = await login({ email, password });

        setLoading(false);

        if (result.success) {
            // Check verification status from response data
            // Adjust property names based on your actual API response
            const responseData = result.data || {};
            const userData = responseData.user || {};

            // Check common flags for unverified status
            const isUnverified =
                userData.emailVerified === false ||
                userData.isVerified === false ||
                userData.verified === false ||
                responseData.isVerified === false ||
                userData.status === 'unverified' ||
                userData.status === 'pending';

            if (isUnverified) {
                // If unverified, ensure we don't keep the session and redirect to OTP
                logout();
                showToast("Silakan verifikasi email Anda terlebih dahulu", "info");
                navigation.navigate('OtpVerification', { email: email });
                return;
            }

            showToast("Login Berhasil", "success");
            navigation.replace("Main");
        } else {
            showToast(result.message || "Email atau kata sandi salah", "error");
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color="#1E293B" />
                </TouchableOpacity>

                <View style={styles.iconCircle}>
                    <Icon name="shield-account" size={40} color="#2563EB" />
                </View>

                <Text style={styles.title}>Hallo!</Text>
                <Text style={styles.subtitle}>
                    Selamat datang kembali...
                </Text>

                <InputField
                    label="Email"
                    icon="email-outline"
                    placeholder="nama@email.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <InputField
                    label="Kata Sandi"
                    icon="lock-outline"
                    placeholder="Masukkan kata sandi"
                    secureTextEntry={!showPass}
                    value={password}
                    onChangeText={setPassword}
                    rightIcon={showPass ? "eye" : "eye-off"}
                    onRightIconPress={() => setShowPass(!showPass)}
                />

                <PrimaryButton
                    title="Masuk"
                    loading={loading}
                    onPress={handleLogin}
                    style={{ marginTop: 8 }}
                />

                <View style={styles.footer}>
                    <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                        <Text style={styles.forgotPassword}>Lupa Kata Sandi?</Text>
                    </TouchableOpacity>

                    <View style={styles.registerContainer}>
                        <Text style={styles.footerText}>Belum punya akun? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.linkText}>Daftar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
    },
    scrollContent: {
        padding: 24,
        flexGrow: 1,
    },
    backButton: {
        marginBottom: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    iconCircle: {
        alignSelf: "center",
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: "#EFF6FF",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 20,
        marginBottom: 20,
        elevation: 3,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        textAlign: "center",
        color: "#0F172A",
    },
    subtitle: {
        fontSize: 14,
        textAlign: "center",
        color: "#64748B",
        marginVertical: 12,
        marginBottom: 32,
    },
    footer: {
        marginTop: 24,
        alignItems: 'center',
    },
    forgotPassword: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 20,
    },
    registerContainer: {
        flexDirection: 'row',
    },
    footerText: {
        fontSize: 14,
        color: '#64748B',
    },
    linkText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2563EB',
    },
});
