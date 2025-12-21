import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TextInput,
    StatusBar,
    Image,
} from "react-native";
import Icon from 'react-native-vector-icons/Ionicons';
import useToastStore from "../stores/toastStore";
import useAuthActions from "../hooks/useAuthActions";
import useAuthStore from "../stores/authStore";
import LoadingOverlay from "../components/LoadingOverlay";
import CustomAlert from "../components/CustomAlert";

export default function LoginScreen({ navigation }: any) {
    const { login, logout } = useAuthActions();
    const showToast = useToastStore((state) => state.showToast);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [tempToken, setTempToken] = useState<string | null>(null);
    const signIn = useAuthStore((state) => state.signIn);

    const handleLogin = async () => {
        if (!email.trim()) {
            showToast("Email tidak boleh kosong", "error");
            return;
        }
        if (!password.trim()) {
            showToast("Kata sandi tidak boleh kosong", "error");
            return;
        }

        setLoading(true);
        const result = await login({ email, password }, false);

        if (result.success) {
            const responseData = result.data || {};
            const userData = responseData.user || {};

            const isUnverified =
                userData.emailVerified === false ||
                userData.isVerified === false ||
                userData.verified === false ||
                responseData.isVerified === false ||
                userData.status === 'unverified' ||
                userData.status === 'pending';

            if (isUnverified) {
                setLoading(false);
                logout();
                showToast("Silakan verifikasi email Anda terlebih dahulu", "info");
                navigation.navigate('OtpVerification', { email: email });
                return;
            }

            setLoading(false);
            setTempToken(result.data?.token || null);
            setShowAlert(true);
        } else {
            setLoading(false);
            if (result.message && (
                result.message.includes("User is disabled") ||
                result.message.includes("not verified")
            )) {
                showToast("Email Anda belum diverifikasi. Silakan masukkan kode OTP.", "info");
                navigation.navigate('OtpVerification', { email: email });
                return;
            }
            showToast(result.message || "Email atau kata sandi salah", "error");
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <LoadingOverlay visible={loading} message="Sedang Masuk..." />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate('Welcome')} style={styles.headerBtn}>
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => showToast("Bantuan Segera Hadir", "info")} style={styles.headerBtn}>
                    <Icon name="help-circle" size={24} color="#64748B" />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Logo Section */}
                <View style={styles.logoWrapper}>
                    <View style={styles.logoBox}>
                        <Icon name="log-in" size={32} color="#FFB800" />
                    </View>
                </View>

                <Text style={styles.title}>Masuk Akun</Text>
                <Text style={styles.subtitle}>
                    Silakan masuk untuk melanjutkan akses ke layanan Kuningan Melesat.
                </Text>

                {/* Form */}
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

                    <Text style={styles.inputLabel}>Kata Sandi</Text>
                    <View style={styles.inputBox}>
                        <Icon name="lock-closed-outline" size={20} color="#94A3B8" />
                        <TextInput
                            style={styles.input}
                            placeholder="........."
                            placeholderTextColor="#94A3B8"
                            secureTextEntry={!showPass}
                            value={password}
                            onChangeText={setPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                            <Icon name={showPass ? "eye-outline" : "eye-off-outline"} size={20} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('ForgotPassword')}
                        style={styles.forgotBtn}
                    >
                        <Text style={styles.forgotText}>Lupa Kata Sandi?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.loginBtn]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <Text style={styles.loginBtnText}>Login</Text>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.dividerContainer}>
                        <View style={styles.divider} />
                        <Text style={styles.dividerText}>Atau masuk dengan</Text>
                        <View style={styles.divider} />
                    </View>

                    {/* Google Login */}
                    <TouchableOpacity
                        style={styles.googleBtn}
                        onPress={() => showToast("Fitur Google Sign-In akan segera hadir", "info")}
                    >
                        <Image
                            source={{ uri: 'https://w7.pngwing.com/pngs/71/673/png-transparent-google-g-logo-google-search-google-account-google-s-google-pay-google-g-logo-google-logo-google-thumbnail.png' }}
                            style={styles.googleIcon}
                            resizeMode="contain"
                        />
                        <Text style={styles.googleBtnText}>Login dengan Google</Text>
                    </TouchableOpacity>

                    {/* Register Footer */}
                    <View style={styles.registerFooter}>
                        <Text style={styles.footerText}>Belum punya akun? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.registerLink}>Daftar Sekarang</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Bottom Stripe */}
            <View style={styles.bottomStripe} />

            <CustomAlert
                visible={showAlert}
                message="Akses masuk berhasil diverifikasi. Selamat datang kembali di Kuningan Melesat."
                onClose={() => {
                    setShowAlert(false);
                    if (tempToken) {
                        signIn(tempToken);
                    }
                }}
            />
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
        marginBottom: 16,
    },
    input: {
        flex: 1,
        marginLeft: 12,
        fontSize: 15,
        color: '#0F172A',
        fontWeight: '500',
    },
    forgotBtn: {
        alignSelf: 'flex-end',
        marginBottom: 32,
    },
    forgotText: {
        fontSize: 13,
        fontWeight: '900',
        color: '#0F172A',
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
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#F1F5F9',
    },
    dividerText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '700',
        marginHorizontal: 16,
    },
    googleBtn: {
        width: '100%',
        height: 56,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    googleIcon: {
        width: 24,
        height: 24,
        marginRight: 12,
    },
    googleBtnText: {
        fontSize: 15,
        fontWeight: '900',
        color: '#0F172A',
    },
    registerFooter: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    registerLink: {
        fontSize: 14,
        fontWeight: '900',
        color: '#0F172A',
        textDecorationLine: 'underline',
    },
    bottomStripe: {
        height: 8,
        backgroundColor: '#FFB800',
        width: '100%',
    },
});
