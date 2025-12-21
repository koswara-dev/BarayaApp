import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    StatusBar,
    Platform,
    KeyboardAvoidingView,
    ScrollView,
    Dimensions,
} from 'react-native';
import useToastStore from '../stores/toastStore';
import api from '../config/api';
import Icon from 'react-native-vector-icons/Ionicons';
import LoadingOverlay from '../components/LoadingOverlay';
import CustomAlert from '../components/CustomAlert';

export default function OtpVerificationScreen({ navigation, route }: any) {
    const { email } = route.params || { email: 'warga@kuningan.go.id' };
    const showToast = useToastStore((state) => state.showToast);

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const [error, setError] = useState('');
    const [showAlert, setShowAlert] = useState(false);

    const inputRefs = useRef<Array<TextInput | null>>([]);

    useEffect(() => {
        let interval: any;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [timer]);

    // Auto submit when all 6 digits are filled
    useEffect(() => {
        const otpCode = otp.join('');
        if (otpCode.length === 6) {
            handleVerify();
        }
    }, [otp]);

    const handleOtpChange = (value: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (error) setError('');

        // Auto focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const otpCode = otp.join('');
        if (otpCode.length < 6) {
            showToast("Masukkan 6 digit kode OTP", "error");
            return;
        }

        setLoading(true);
        setError('');
        try {
            const response = await api.post('/auth/verify-otp', { email, otp: otpCode });
            if (response.data && (response.data.success || response.status === 200)) {
                setLoading(false);
                setShowAlert(true);
            } else {
                setError(response.data.message || "Kode OTP salah");
            }
        } catch (error: any) {
            const msg = error.response?.data?.message || "Verifikasi gagal";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!canResend) return;

        setLoading(true);
        try {
            const response = await api.post('/auth/resend-otp', { email });
            if (response.data && (response.data.success || response.status === 200)) {
                showToast("Kode OTP baru telah dikirim", "success");
                setTimer(60);
                setCanResend(false);
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            } else {
                showToast(response.data.message || "Gagal mengirim ulang OTP", "error");
            }
        } catch (error: any) {
            const msg = error.response?.data?.message || "Gagal mengirim ulang";
            showToast(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleBack = () => {
        if (route.params?.isFromRegister) {
            navigation.navigate('Welcome');
        } else {
            navigation.goBack();
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            {/* Loading Overlay */}
            <LoadingOverlay visible={loading} message="Memverifikasi..." />

            <CustomAlert
                visible={showAlert}
                title="Verifikasi Berhasil"
                message="Selamat! Akun Anda telah berhasil diaktifkan. Silakan masuk untuk mulai menggunakan layanan Kuningan Melesat."
                onClose={() => {
                    setShowAlert(false);
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                    });
                }}
            />
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.headerBtn}>
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => showToast("Bantuan OTP", "info")} style={styles.headerBtn}>
                    <Icon name="help-circle" size={24} color="#64748B" />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Visual Icon */}
                <View style={styles.logoWrapper}>
                    <View style={styles.logoBox}>
                        <Icon name="lock-open" size={32} color="#FFB800" />
                    </View>
                </View>

                <Text style={styles.title}>Verifikasi OTP</Text>

                {/* UI Alur (Progress Indicator) if from register */}
                {route.params?.isFromRegister && (
                    <View style={styles.progressContainer}>
                        <View style={[styles.stepDot, styles.activeDot]} />
                        <View style={[styles.stepLine, styles.activeLine]} />
                        <View style={[styles.stepDot, styles.activeDot]} />
                        <View style={[styles.stepLine, styles.activeLine]} />
                        <View style={[styles.stepDot, styles.activeDot]} />
                    </View>
                )}

                <Text style={styles.subtitle}>
                    Kode verifikasi 6 digit telah dikirim ke email
                </Text>
                <Text style={styles.emailText}>{email}</Text>

                {/* OTP Inputs */}
                <View style={styles.otpWrapper}>
                    {otp.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(el) => { inputRefs.current[index] = el; }}
                            style={[
                                styles.otpInput,
                                otp[index] !== '' && styles.otpInputActive,
                                error !== '' && styles.otpInputError
                            ]}
                            value={digit}
                            onChangeText={(val) => handleOtpChange(val.replace(/[^0-9]/g, ''), index)}
                            onKeyPress={(e) => handleKeyPress(e, index)}
                            keyboardType="number-pad"
                            maxLength={1}
                            textAlign="center"
                            autoFocus={index === 0}
                        />
                    ))}
                </View>

                {error ? (
                    <Text style={styles.errorText}>{error}</Text>
                ) : null}

                <View style={styles.resendContainer}>
                    <Text style={styles.resendInfo}>Tidak menerima kode?</Text>
                    <TouchableOpacity onPress={handleResend} disabled={!canResend}>
                        <Text style={styles.resendLink}>
                            Kirim Ulang ({formatTime(timer)})
                        </Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.verifyBtn]}
                    onPress={handleVerify}
                    disabled={loading}
                >
                    <Text style={styles.verifyBtnText}>Verifikasi</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.changeMethodBtn}
                    onPress={() => showToast("Fitur sedang dikembangkan", "info")}
                >
                    <Icon name="shield-checkmark" size={18} color="#64748B" style={{ marginRight: 8 }} />
                    <Text style={styles.changeMethodText}>Ubah Metode Verifikasi</Text>
                </TouchableOpacity>

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
        backgroundColor: '#FFFFFF',
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
        paddingTop: 40,
        alignItems: 'center',
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
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 14,
        textAlign: "center",
        color: "#64748B",
        lineHeight: 22,
        fontWeight: '500',
        marginBottom: 8,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
        paddingHorizontal: 40,
        width: '100%',
    },
    stepDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
    },
    activeDot: {
        backgroundColor: '#FFB800',
    },
    stepLine: {
        flex: 1,
        height: 3,
        marginHorizontal: 4,
    },
    activeLine: {
        backgroundColor: '#FFB800',
    },
    emailText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#0F172A',
        textAlign: 'center',
        marginBottom: 40,
    },
    otpWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 40,
    },
    otpInput: {
        width: (Dimensions.get('window').width - 100) / 6,
        height: 64,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 4,
        fontSize: 24,
        fontWeight: '900',
        color: '#0F172A',
        backgroundColor: '#FFFFFF',
    },
    otpInputActive: {
        borderColor: '#FFB800',
        borderWidth: 1.5,
    },
    otpInputError: {
        borderColor: '#EF4444',
        borderWidth: 1.5,
        backgroundColor: '#FEF2F2',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 20,
        textAlign: 'center',
    },
    resendContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    resendInfo: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
        marginBottom: 8,
    },
    resendLink: {
        fontSize: 15,
        fontWeight: '900',
        color: '#0F172A',
        textDecorationLine: 'underline',
    },
    verifyBtn: {
        width: '100%',
        height: 56,
        backgroundColor: '#FFB800',
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    verifyBtnText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0F172A',
    },
    changeMethodBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    changeMethodText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#475569',
    },
    bottomStripe: {
        height: 8,
        backgroundColor: '#FFB800',
        width: '100%',
    },
});
