import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput
} from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import useToastStore from '../stores/toastStore';
import api from '../config/api';
import Icon from 'react-native-vector-icons/Ionicons';

export default function OtpVerificationScreen({ navigation, route }: any) {
    const { email } = route.params;
    const showToast = useToastStore((state) => state.showToast);

    // Simple 6 digit OTP input state
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(60); // 60 seconds countdown
    const [canResend, setCanResend] = useState(false);

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

    const handleOtpChange = (value: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto focus next input
        if (value && index < 5) {
            // This is a naive implementation without refs for brevity, 
            // a proper one would use verify refs to focus next.
        }
    };

    // Auto-submit when all 6 digits filled
    useEffect(() => {
        const otpCode = otp.join('');
        if (otpCode.length === 6 && !loading) {
            handleVerify();
        }
    }, [otp]);

    const getOtpString = () => otp.join('');

    const handleVerify = async () => {
        const otpCode = getOtpString();
        if (otpCode.length < 6) {
            showToast("Masukkan 6 digit kode OTP", "error");
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/verify-otp', { email, otp: otpCode });
            if (response.data && (response.data.success || response.status === 200)) {
                showToast("Verifikasi berhasil! Silakan login.", "success");
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                });
            } else {
                showToast(response.data.message || "Kode OTP salah", "error");
            }
        } catch (error: any) {
            console.error("OTP Verify Error:", error);
            const msg = error.response?.data?.message || "Verifikasi gagal";
            showToast(msg, "error");
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

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Icon name="mail-unread-outline" size={60} color="#2563EB" />
                </View>

                <Text style={styles.title}>Verifikasi Email</Text>
                <Text style={styles.subtitle}>
                    Kami telah mengirimkan kode verifikasi 6 digit ke email{' '}
                    <Text style={styles.emailText}>{email}</Text>
                </Text>

                <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                        <TextInput
                            key={index}
                            style={styles.otpInput}
                            value={digit}
                            onChangeText={(val) => handleOtpChange(val, index)}
                            keyboardType="number-pad"
                            maxLength={1}
                            textAlign="center"
                        />
                    ))}
                </View>

                <PrimaryButton
                    title="Verifikasi"
                    onPress={handleVerify}
                    loading={loading}
                    style={{ marginTop: 30 }}
                />

                <View style={styles.resendContainer}>
                    <Text style={styles.resendText}>Tidak menerima kode? </Text>
                    <TouchableOpacity onPress={handleResend} disabled={!canResend}>
                        <Text style={[styles.resendLink, !canResend && styles.disabledLink]}>
                            {canResend ? "Kirim Ulang" : `Tunggu ${timer}s`}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        padding: 24,
        justifyContent: 'center',
    },
    content: {
        alignItems: 'center',
    },
    iconContainer: {
        width: 100,
        height: 100,
        backgroundColor: '#DBEAFE',
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    emailText: {
        fontWeight: '700',
        color: '#0F172A',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 10,
    },
    otpInput: {
        width: 45,
        height: 55,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        backgroundColor: '#FFF',
        fontSize: 24,
        fontWeight: '700',
        color: '#0F172A',
    },
    resendContainer: {
        flexDirection: 'row',
        marginTop: 24,
    },
    resendText: {
        color: '#64748B',
    },
    resendLink: {
        fontWeight: '700',
        color: '#2563EB',
    },
    disabledLink: {
        color: '#94A3B8',
    },
});
