import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar
} from 'react-native';
import useToastStore from '../stores/toastStore';
import api from '../config/api';
import Icon from 'react-native-vector-icons/Ionicons';
import LoadingOverlay from '../components/LoadingOverlay';
import CustomAlert from '../components/CustomAlert';

export default function ResetPasswordScreen({ navigation, route }: any) {
    const { email } = route.params || {};
    const showToast = useToastStore((state) => state.showToast);

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [newPass, setNewPass] = useState({ password: '', confirm: '' });
    const [showPass, setShowPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [otpError, setOtpError] = useState('');
    const [showAlert, setShowAlert] = useState(false);

    const otpRefs = useRef<Array<TextInput | null>>([]);

    const handleOtpChange = (val: string, index: number) => {
        if (val && !/^\d+$/.test(val)) return;

        const newOtp = [...otp];
        newOtp[index] = val;
        setOtp(newOtp);
        if (otpError) setOtpError('');

        if (val.length === 1 && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = ({ nativeEvent: { key } }: any, index: number) => {
        if (key === 'Backspace') {
            if (otp[index] === '' && index > 0) {
                const newOtp = [...otp];
                newOtp[index - 1] = '';
                setOtp(newOtp);
                otpRefs.current[index - 1]?.focus();
            } else if (otp[index] !== '') {
                const newOtp = [...otp];
                newOtp[index] = '';
                setOtp(newOtp);
            }
        }
    };

    const handleResetPassword = async () => {
        const otpCode = otp.join('');
        if (otpCode.length < 6) {
            showToast("Masukkan 6 digit kode OTP", "error");
            return;
        }

        if (newPass.password.length < 6) {
            showToast("Password minimal 6 karakter", "error");
            return;
        }
        if (newPass.password !== newPass.confirm) {
            showToast("Konfirmasi password tidak cocok", "error");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                email: email,
                otp: otpCode,
                newPassword: newPass.password,
                confirmPassword: newPass.confirm
            };
            
            const response = await api.post('/auth/reset-password', payload);

            if (response.status === 200 || response.data?.success) {
                setLoading(false);
                setShowAlert(true);
            } else {
                showToast(response.data?.message || "Gagal mereset password", "error");
            }
        } catch (error: any) {
            console.error("Reset Password Error:", error);
            const msg = error.response?.data?.message || "Gagal mereset password";
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
            <LoadingOverlay visible={loading} message="Memproses..." />
            <CustomAlert
                visible={showAlert}
                title="Berhasil"
                message="Kata sandi Anda telah berhasil diubah. Silakan masuk kembali dengan kata sandi baru Anda."
                onClose={() => {
                    setShowAlert(false);
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                    });
                }}
            />
            
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
                        <Icon name="key-outline" size={32} color="#FFB800" />
                    </View>
                </View>

                <Text style={styles.title}>Atur Ulang</Text>
                <Text style={styles.subtitle}>
                    Masukkan kode OTP yang dikirim ke <Text style={styles.emailText}>{email}</Text> dan buat kata sandi baru.
                </Text>

                <View style={styles.formContainer}>
                    {/* OTP Section */}
                    <Text style={styles.inputLabel}>Kode OTP</Text>
                    <View style={styles.otpContainer}>
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => { otpRefs.current[index] = ref; }}
                                style={[
                                    styles.otpInput,
                                    digit ? styles.otpInputActive : {},
                                    otpError ? styles.otpInputError : {}
                                ]}
                                value={digit}
                                onChangeText={(val) => handleOtpChange(val, index)}
                                onKeyPress={(e) => handleKeyPress(e, index)}
                                keyboardType="number-pad"
                                maxLength={1}
                                textAlign="center"
                            />
                        ))}
                    </View>
                    {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}

                    {/* Password Section */}
                    <Text style={[styles.inputLabel, { marginTop: 16 }]}>Password Baru</Text>
                    <View style={styles.inputBox}>
                        <Icon name="lock-closed-outline" size={20} color="#94A3B8" />
                        <TextInput
                            style={styles.input}
                            placeholder="Minimal 6 karakter"
                            placeholderTextColor="#94A3B8"
                            secureTextEntry={!showPass}
                            value={newPass.password}
                            onChangeText={(t) => setNewPass({ ...newPass, password: t })}
                        />
                         <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                            <Icon name={showPass ? "eye-outline" : "eye-off-outline"} size={20} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.inputLabel}>Konfirmasi Password</Text>
                     <View style={styles.inputBox}>
                        <Icon name="checkmark-circle-outline" size={20} color="#94A3B8" />
                        <TextInput
                            style={styles.input}
                            placeholder="Ulangi password baru"
                            placeholderTextColor="#94A3B8"
                            secureTextEntry={!showConfirmPass}
                            value={newPass.confirm}
                            onChangeText={(t) => setNewPass({ ...newPass, confirm: t })}
                        />
                         <TouchableOpacity onPress={() => setShowConfirmPass(!showConfirmPass)}>
                            <Icon name={showConfirmPass ? "eye-outline" : "eye-off-outline"} size={20} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.loginBtn}
                        onPress={handleResetPassword}
                        disabled={loading}
                    >
                        <Text style={styles.loginBtnText}>Simpan Password</Text>
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
    emailText: {
        fontWeight: 'bold',
        color: '#0F172A',
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
    loginBtn: {
        width: '100%',
        height: 56,
        backgroundColor: '#FFB800',
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
        marginTop: 16,
    },
    loginBtnText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0F172A',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    otpInput: {
        width: 48,
        height: 56,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 4,
        backgroundColor: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
        color: '#0F172A',
        textAlign: 'center',
    },
    otpInputActive: {
        borderColor: '#FFB800',
        borderWidth: 1.5,
        backgroundColor: '#FFFFFF',
    },
    otpInputError: {
        borderColor: '#EF4444',
        borderWidth: 1.5,
        backgroundColor: '#FEF2F2',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 13,
        fontWeight: '600',
        marginTop: 4,
        textAlign: 'center',
        marginBottom: 16,
    },
    bottomStripe: {
        height: 8,
        backgroundColor: '#FFB800',
        width: '100%',
    },
});
