import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity
} from 'react-native';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import useToastStore from '../stores/toastStore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import api from '../config/api';

export default function RegisterScreen({ navigation }: any) {
    const showToast = useToastStore((state) => state.showToast);

    // Steps: 1 = Data Diri, 2 = Email & Password
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        nik: '',
        phoneNumber: '',
        alamat: '',
        email: '',
        username: '',
        password: '',
    });

    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Validation states for Step 1
    const [fullNameValid, setFullNameValid] = useState<'valid' | 'invalid' | 'neutral'>('neutral');
    const [nikValid, setNikValid] = useState<'valid' | 'invalid' | 'neutral'>('neutral');
    const [phoneValid, setPhoneValid] = useState<'valid' | 'invalid' | 'neutral'>('neutral');
    const [alamatValid, setAlamatValid] = useState<'valid' | 'invalid' | 'neutral'>('neutral');

    // Validation states for Step 2
    const [emailValid, setEmailValid] = useState<'valid' | 'invalid' | 'neutral'>('neutral');
    const [usernameValid, setUsernameValid] = useState<'valid' | 'invalid' | 'neutral'>('neutral');
    const [passValid, setPassValid] = useState<'valid' | 'invalid' | 'neutral'>('neutral');
    const [confirmValid, setConfirmValid] = useState<'valid' | 'invalid' | 'neutral'>('neutral');

    const handleChange = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    // ========== STEP 1 VALIDATIONS ==========

    // Full Name validation
    useEffect(() => {
        const name = formData.fullName.trim();
        if (name.length === 0) {
            setFullNameValid('neutral');
        } else if (name.length >= 3) {
            setFullNameValid('valid');
        } else {
            setFullNameValid('invalid');
        }
    }, [formData.fullName]);

    // NIK validation (must be 16 digits)
    useEffect(() => {
        const nik = formData.nik;
        if (nik.length === 0) {
            setNikValid('neutral');
        } else if (nik.length === 16 && /^\d+$/.test(nik)) {
            setNikValid('valid');
        } else {
            setNikValid('invalid');
        }
    }, [formData.nik]);

    // Phone validation
    useEffect(() => {
        const phone = formData.phoneNumber;
        if (phone.length === 0) {
            setPhoneValid('neutral');
        } else if (phone.length >= 10 && phone.length <= 13 && /^08\d+$/.test(phone)) {
            setPhoneValid('valid');
        } else {
            setPhoneValid('invalid');
        }
    }, [formData.phoneNumber]);

    // Address validation
    useEffect(() => {
        const alamat = formData.alamat.trim();
        if (alamat.length === 0) {
            setAlamatValid('neutral');
        } else if (alamat.length >= 10) {
            setAlamatValid('valid');
        } else {
            setAlamatValid('invalid');
        }
    }, [formData.alamat]);

    // ========== STEP 2 VALIDATIONS ==========

    // Email validation
    useEffect(() => {
        const email = formData.email.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email.length === 0) {
            setEmailValid('neutral');
        } else if (emailRegex.test(email)) {
            setEmailValid('valid');
        } else {
            setEmailValid('invalid');
        }
    }, [formData.email]);

    // Username validation
    useEffect(() => {
        const username = formData.username.trim();
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (username.length === 0) {
            setUsernameValid('neutral');
        } else if (username.length >= 4 && usernameRegex.test(username)) {
            setUsernameValid('valid');
        } else {
            setUsernameValid('invalid');
        }
    }, [formData.username]);

    // Password validation
    useEffect(() => {
        const pass = formData.password;
        if (pass.length === 0) {
            setPassValid('neutral');
        } else if (pass.length >= 6) {
            setPassValid('valid');
        } else {
            setPassValid('invalid');
        }
    }, [formData.password]);

    // Confirm password validation
    useEffect(() => {
        if (confirmPassword.length === 0) {
            setConfirmValid('neutral');
        } else if (confirmPassword === formData.password && formData.password.length >= 6) {
            setConfirmValid('valid');
        } else {
            setConfirmValid('invalid');
        }
    }, [confirmPassword, formData.password]);

    // Step 1: Validate and proceed
    const handleNextToStep2 = () => {
        if (fullNameValid !== 'valid') {
            showToast("Nama lengkap minimal 3 karakter", "error");
            return;
        }
        if (nikValid !== 'valid') {
            showToast("NIK harus 16 digit angka", "error");
            return;
        }
        if (phoneValid !== 'valid') {
            showToast("Nomor telepon tidak valid (contoh: 08123456789)", "error");
            return;
        }
        if (alamatValid !== 'valid') {
            showToast("Alamat minimal 10 karakter", "error");
            return;
        }

        setStep(2);
    };

    // Step 2: Validate and register
    const handleSubmitToOtp = async () => {
        if (emailValid !== 'valid') {
            showToast("Format email tidak valid", "error");
            return;
        }
        if (usernameValid !== 'valid') {
            showToast("Username minimal 4 karakter (huruf, angka, underscore)", "error");
            return;
        }
        if (passValid !== 'valid') {
            showToast("Password minimal 6 karakter", "error");
            return;
        }
        if (confirmValid !== 'valid') {
            showToast("Konfirmasi password tidak cocok", "error");
            return;
        }

        setLoading(true);

        try {
            // Artificial delay as requested (1-3 seconds)
            await new Promise(resolve => setTimeout(() => resolve(true), 2000));

            // Register directly
            const response = await api.post('/auth/register', formData);

            if (response.status === 200 || response.status === 201 || response.data?.success) {
                showToast("Data berhasil disimpan, silakan verifikasi email", "success");
                navigation.navigate('RegisterForm', {
                    formData: formData,
                    otpSent: true // Flag to indicate OTP was likely sent by register
                });
            } else {
                showToast(response.data?.message || "Gagal mendaftar", "error");
            }
        } catch (error: any) {
            console.error("Register Error:", error);
            const msg = error.response?.data?.message || "Gagal menghubungkan ke server";
            showToast(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (step === 2) {
            setStep(1);
        } else {
            navigation.goBack();
        }
    };

    // Render Step 1: Personal Data
    const renderStep1 = () => (
        <View>
            <View style={styles.header}>
                <Text style={styles.title}>Data Diri</Text>
                <Text style={styles.subtitle}>
                    Langkah 1: Lengkapi identitas Anda sesuai KTP.
                </Text>
            </View>

            <InputField
                label="Nama Lengkap"
                icon="account-outline"
                placeholder="Nama sesuai KTP"
                value={formData.fullName}
                onChangeText={(val) => handleChange('fullName', val)}
                validationState={fullNameValid}
                validationMessage={
                    fullNameValid === 'invalid'
                        ? "Nama minimal 3 karakter"
                        : fullNameValid === 'valid'
                            ? "Nama valid ✓"
                            : undefined
                }
            />

            <InputField
                label="NIK"
                icon="card-account-details-outline"
                placeholder="16 digit NIK"
                value={formData.nik}
                onChangeText={(val) => handleChange('nik', val.replace(/\D/g, ''))}
                keyboardType="numeric"
                maxLength={16}
                validationState={nikValid}
                validationMessage={
                    nikValid === 'invalid'
                        ? `NIK harus 16 digit (${formData.nik.length}/16)`
                        : nikValid === 'valid'
                            ? "NIK valid ✓"
                            : "Masukkan 16 digit NIK"
                }
            />

            <InputField
                label="Nomor Telepon"
                icon="phone-outline"
                placeholder="08xxxxxxxxxx"
                value={formData.phoneNumber}
                onChangeText={(val) => handleChange('phoneNumber', val.replace(/\D/g, ''))}
                keyboardType="phone-pad"
                maxLength={13}
                validationState={phoneValid}
                validationMessage={
                    phoneValid === 'invalid'
                        ? "Format: 08xxxxxxxxxx (10-13 digit)"
                        : phoneValid === 'valid'
                            ? "Nomor telepon valid ✓"
                            : "Contoh: 08123456789"
                }
            />

            <InputField
                label="Alamat Lengkap"
                icon="map-marker-outline"
                placeholder="Jalan, RT/RW, Kelurahan, Kecamatan"
                value={formData.alamat}
                onChangeText={(val) => handleChange('alamat', val)}
                multiline
                validationState={alamatValid}
                validationMessage={
                    alamatValid === 'invalid'
                        ? "Alamat minimal 10 karakter"
                        : alamatValid === 'valid'
                            ? "Alamat valid ✓"
                            : "Masukkan alamat lengkap"
                }
            />

            <PrimaryButton
                title="Lanjut ke Akun"
                onPress={handleNextToStep2}
                style={{ marginTop: 24 }}
            />

            <View style={styles.footer}>
                <Text style={styles.footerText}>Sudah punya akun? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.linkText}>Masuk</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // Render Step 2: Email & Password
    const renderStep2 = () => (
        <View>
            <View style={styles.header}>
                <Text style={styles.title}>Buat Akun</Text>
                <Text style={styles.subtitle}>
                    Langkah 2: Masukkan email dan buat password untuk akun Anda.
                </Text>
            </View>

            <InputField
                label="Email"
                icon="email-outline"
                placeholder="nama@email.com"
                value={formData.email}
                onChangeText={(val) => handleChange('email', val)}
                keyboardType="email-address"
                autoCapitalize="none"
                validationState={emailValid}
                validationMessage={
                    emailValid === 'invalid'
                        ? "Format email tidak valid"
                        : emailValid === 'valid'
                            ? "Email valid ✓"
                            : "Contoh: nama@email.com"
                }
            />

            <InputField
                label="Username"
                icon="account-circle-outline"
                placeholder="Buat username unik"
                value={formData.username}
                onChangeText={(val) => handleChange('username', val.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                autoCapitalize="none"
                validationState={usernameValid}
                validationMessage={
                    usernameValid === 'invalid'
                        ? "Username minimal 4 karakter (huruf, angka, _)"
                        : usernameValid === 'valid'
                            ? "Username tersedia ✓"
                            : "Huruf, angka, dan underscore saja"
                }
            />

            <InputField
                label="Kata Sandi"
                icon="lock-outline"
                placeholder="Minimal 6 karakter"
                value={formData.password}
                onChangeText={(val) => handleChange('password', val)}
                secureTextEntry={!showPassword}
                rightIcon={showPassword ? "eye" : "eye-off"}
                onRightIconPress={() => setShowPassword(!showPassword)}
                validationState={passValid}
                validationMessage={
                    passValid === 'invalid'
                        ? `Password terlalu pendek (${formData.password.length}/6)`
                        : passValid === 'valid'
                            ? "Password kuat ✓"
                            : "Minimal 6 karakter"
                }
            />

            <InputField
                label="Konfirmasi Kata Sandi"
                icon="lock-check-outline"
                placeholder="Ulangi kata sandi"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                validationState={confirmValid}
                validationMessage={
                    confirmValid === 'invalid'
                        ? "Password tidak cocok"
                        : confirmValid === 'valid'
                            ? "Password cocok ✓"
                            : "Ulangi password di atas"
                }
            />

            <PrimaryButton
                title={loading ? "Menyimpan Data..." : "Lanjut Verifikasi Email"}
                onPress={handleSubmitToOtp}
                loading={loading}
                style={{ marginTop: 24 }}
            />
        </View>
    );

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color="#1E293B" />
                </TouchableOpacity>

                {/* Progress Indicators */}
                <View style={styles.progressContainer}>
                    <View style={[styles.stepDot, styles.activeDot]} />
                    <View style={[styles.stepLine, step >= 2 ? styles.activeLine : styles.inactiveLine]} />
                    <View style={[styles.stepDot, step >= 2 ? styles.activeDot : styles.inactiveDot]} />
                    <View style={[styles.stepLine, styles.inactiveLine]} />
                    <View style={[styles.stepDot, styles.inactiveDot]} />
                </View>

                {step === 1 ? renderStep1() : renderStep2()}

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
        marginBottom: 24,
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
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
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
