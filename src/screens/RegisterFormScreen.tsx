import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    TextInput
} from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import useToastStore from '../stores/toastStore';
import api from '../config/api';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LoadingOverlay from '../components/LoadingOverlay';
import CustomAlert from '../components/CustomAlert';

export default function RegisterFormScreen({ navigation, route }: any) {
    const { formData } = route.params;
    const showToast = useToastStore((state) => state.showToast);
    const [loading, setLoading] = useState(false);

    // OTP State
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const otpRefs = useRef<Array<TextInput | null>>([]);

    // Timer
    const [timer, setTimer] = useState(60);

    // OTP validation state
    const [otpError, setOtpError] = useState('');
    const [otpSuccess, setOtpSuccess] = useState(false);
    const [otpSent, setOtpSent] = useState(route.params?.otpSent || false);
    const [showAlert, setShowAlert] = useState(false);

    // Send OTP on mount - DISABLED because register triggers it
    // useEffect(() => {
    //     sendOtp();
    // }, []);

    // Timer countdown
    useEffect(() => {
        let interval: any;
        if (timer > 0) { // Removed otpSent check since we assume it's sent
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    // Auto-submit when all 6 digits filled
    useEffect(() => {
        const otpCode = otp.join('');
        if (otpCode.length === 6 && !loading && otpSent) {
            handleVerifyOtp();
        }
    }, [otp, loading, otpSent]);

    // ... (keep auto-focus logic)

    const handleVerifyOtp = async () => {
        const otpCode = otp.join('');
        if (otpCode.length < 6) {
            setOtpError("Masukkan 6 digit kode OTP");
            return;
        }

        setLoading(true);
        setOtpError('');
        try {
            const verifyResponse = await api.post('/auth/verify-otp', {
                email: formData.email,
                otp: otpCode
            });

            if (verifyResponse.status === 200 || verifyResponse.data?.success) {
                setOtpSuccess(true);
                setLoading(false);
                setShowAlert(true);
            } else {
                setOtpError(verifyResponse.data?.message || "Kode OTP salah");
                setOtp(['', '', '', '', '', '']);
                otpRefs.current[0]?.focus();
            }
        } catch (error: any) {
            console.error("Verify Error:", error);
            const msg = error.response?.data?.message || "Verifikasi gagal";
            setOtpError(msg);
            setOtp(['', '', '', '', '', '']);
            setOtpSuccess(false);
            otpRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (val: string, index: number) => {
        if (val && !/^\d+$/.test(val)) return;

        const newOtp = [...otp];
        newOtp[index] = val;
        setOtp(newOtp);
        setOtpError('');

        if (val.length === 1 && index < 5) {
            setTimeout(() => {
                otpRefs.current[index + 1]?.focus();
            }, 10);
        }
    };

    const handleKeyPress = ({ nativeEvent: { key } }: any, index: number) => {
        if (key === 'Backspace') {
            if (otp[index] === '' && index > 0) {
                const newOtp = [...otp];
                newOtp[index - 1] = '';
                setOtp(newOtp);
                setTimeout(() => {
                    otpRefs.current[index - 1]?.focus();
                }, 10);
            } else if (otp[index] !== '') {
                const newOtp = [...otp];
                newOtp[index] = '';
                setOtp(newOtp);
            }
        }
    };

    const sendOtp = async () => {
        setLoading(true);
        try {
            const response = await api.post('/auth/resend-otp', { email: formData.email });
            if (response.status === 200 || response.data?.success) {
                showToast("Kode OTP telah dikirimkan ke email Anda", "success");
                setOtpSent(true);
                setTimer(60);
            } else {
                showToast(response.data?.message || "Gagal mengirim OTP", "error");
            }
        } catch (error: any) {
            console.error("OTP Send Error:", error);
            const msg = error.response?.data?.message || "Gagal mengirim OTP";
            showToast(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = () => {
        if (timer > 0) return;
        setOtp(['', '', '', '', '', '']);
        setOtpError('');
        setOtpSuccess(false);
        sendOtp();
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
            {/* Loading Overlay */}
            <LoadingOverlay visible={loading} message="Memverifikasi..." />

            <CustomAlert
                visible={showAlert}
                title="Pendaftaran Berhasil"
                message="Selamat! Akun Anda telah berhasil dibuat. Silakan masuk untuk mulai menggunakan layanan Kuningan Melesat."
                onClose={() => {
                    setShowAlert(false);
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                    });
                }}
            />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color="#1E293B" />
                </TouchableOpacity>

                {/* Progress Indicators */}
                <View style={styles.progressContainer}>
                    <View style={[styles.stepDot, styles.activeDot]} />
                    <View style={[styles.stepLine, styles.activeLine]} />
                    <View style={[styles.stepDot, styles.activeDot]} />
                    <View style={[styles.stepLine, styles.activeLine]} />
                    <View style={[styles.stepDot, styles.activeDot]} />
                </View>

                <View style={styles.header}>
                    <Text style={styles.title}>Verifikasi Email</Text>
                    <Text style={styles.subtitle}>
                        Langkah 3: Masukkan kode 6 digit yang dikirim ke{'\n'}
                        <Text style={styles.emailText}>{formData.email}</Text>
                    </Text>
                </View>

                {/* OTP Input */}
                <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => { otpRefs.current[index] = ref }}
                            style={[
                                styles.otpInput,
                                digit ? styles.otpInputFilled : {},
                                otpError ? styles.otpInputError : {},
                                otpSuccess ? styles.otpInputSuccess : {},
                            ]}
                            value={digit}
                            onChangeText={(val) => handleOtpChange(val, index)}
                            onKeyPress={(e) => handleKeyPress(e, index)}
                            keyboardType="number-pad"
                            maxLength={1}
                            textAlign="center"
                            editable={!otpSuccess}
                        />
                    ))}
                </View>

                {otpError ? (
                    <Text style={styles.errorText}>{otpError}</Text>
                ) : null}

                <PrimaryButton
                    title="Verifikasi & Daftar"
                    onPress={handleVerifyOtp}
                    style={{ marginTop: 24 }}
                />

                <TouchableOpacity
                    onPress={handleResend}
                    disabled={timer > 0}
                    style={{ marginTop: 24, alignItems: 'center' }}
                >
                    <Text style={{ color: timer > 0 ? '#94A3B8' : '#2563EB', fontWeight: '600' }}>
                        {timer > 0 ? `Kirim ulang dalam ${timer}s` : "Kirim Ulang Kode"}
                    </Text>
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
        flexGrow: 1,
    },
    backButton: {
        marginBottom: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 22,
    },
    emailText: {
        color: '#2563EB',
        fontWeight: '600',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
        paddingHorizontal: 20,
    },
    stepDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    inactiveDot: {
        backgroundColor: '#E2E8F0',
    },
    activeDot: {
        backgroundColor: '#10B981',
    },
    stepLine: {
        flex: 1,
        height: 2,
        marginHorizontal: 4,
    },
    inactiveLine: {
        backgroundColor: '#E2E8F0',
    },
    activeLine: {
        backgroundColor: '#10B981',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 8,
    },
    otpInput: {
        flex: 1,
        height: 56,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        backgroundColor: '#FFF',
        fontSize: 24,
        fontWeight: '700',
        color: '#0F172A',
        textAlign: 'center',
    },
    otpInputFilled: {
        borderColor: '#2563EB',
        backgroundColor: '#EFF6FF',
    },
    otpInputError: {
        borderColor: '#EF4444',
        backgroundColor: '#FEF2F2',
    },
    otpInputSuccess: {
        borderColor: '#22C55E',
        backgroundColor: '#F0FDF4',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 8,
    },
});
