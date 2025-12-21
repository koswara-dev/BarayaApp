import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    TextInput,
    StatusBar,
    Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import useToastStore from '../stores/toastStore';
import api from '../config/api';
import LoadingOverlay from '../components/LoadingOverlay';

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
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Validation states
    const [validity, setValidity] = useState({
        fullName: 'neutral',
        nik: 'neutral',
        phoneNumber: 'neutral',
        alamat: 'neutral',
        email: 'neutral',
        username: 'neutral',
        password: 'neutral',
        confirmPassword: 'neutral'
    } as any);

    const handleChange = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    // Real-time Validations
    useEffect(() => {
        // Full Name
        const name = formData.fullName.trim();
        if (name.length === 0) setValidity((p: any) => ({ ...p, fullName: 'neutral' }));
        else if (name.length >= 3) setValidity((p: any) => ({ ...p, fullName: 'valid' }));
        else setValidity((p: any) => ({ ...p, fullName: 'invalid' }));

        // NIK
        const nik = formData.nik;
        if (nik.length === 0) setValidity((p: any) => ({ ...p, nik: 'neutral' }));
        else if (nik.length === 16) setValidity((p: any) => ({ ...p, nik: 'valid' }));
        else setValidity((p: any) => ({ ...p, nik: 'invalid' }));

        // Phone
        const phone = formData.phoneNumber;
        if (phone.length === 0) setValidity((p: any) => ({ ...p, phoneNumber: 'neutral' }));
        else if (phone.startsWith('08') && phone.length >= 10) setValidity((p: any) => ({ ...p, phoneNumber: 'valid' }));
        else setValidity((p: any) => ({ ...p, phoneNumber: 'invalid' }));

        // Alamat
        const alamat = formData.alamat.trim();
        if (alamat.length === 0) setValidity((p: any) => ({ ...p, alamat: 'neutral' }));
        else if (alamat.length >= 10) setValidity((p: any) => ({ ...p, alamat: 'valid' }));
        else setValidity((p: any) => ({ ...p, alamat: 'invalid' }));

        // Email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email.length === 0) setValidity((p: any) => ({ ...p, email: 'neutral' }));
        else if (emailRegex.test(formData.email)) setValidity((p: any) => ({ ...p, email: 'valid' }));
        else setValidity((p: any) => ({ ...p, email: 'invalid' }));

        // Username
        const user = formData.username.trim();
        if (user.length === 0) setValidity((p: any) => ({ ...p, username: 'neutral' }));
        else if (user.length >= 4) setValidity((p: any) => ({ ...p, username: 'valid' }));
        else setValidity((p: any) => ({ ...p, username: 'invalid' }));

        // Password
        if (formData.password.length === 0) setValidity((p: any) => ({ ...p, password: 'neutral' }));
        else if (formData.password.length >= 6) setValidity((p: any) => ({ ...p, password: 'valid' }));
        else setValidity((p: any) => ({ ...p, password: 'invalid' }));

        // Confirm Password
        if (confirmPassword.length === 0) setValidity((p: any) => ({ ...p, confirmPassword: 'neutral' }));
        else if (confirmPassword === formData.password && formData.password.length >= 6) setValidity((p: any) => ({ ...p, confirmPassword: 'valid' }));
        else setValidity((p: any) => ({ ...p, confirmPassword: 'invalid' }));

    }, [formData, confirmPassword]);

    const handleNextToStep2 = async () => {
        if (validity.fullName !== 'valid') { showToast("Nama lengkap minimal 3 karakter", "error"); return; }
        if (validity.nik !== 'valid') { showToast("NIK harus 16 digit angka", "error"); return; }
        if (validity.phoneNumber !== 'valid') { showToast("Nomor telepon tidak valid", "error"); return; }
        if (validity.alamat !== 'valid') { showToast("Alamat minimal 10 karakter", "error"); return; }

        setLoading(true);
        await new Promise(resolve => setTimeout(() => resolve(true), 1500));
        setLoading(false);
        setStep(2);
    };

    const handleSubmitToOtp = async () => {
        if (validity.email !== 'valid') { showToast("Format email tidak valid", "error"); return; }
        if (validity.username !== 'valid') { showToast("Username minimal 4 karakter", "error"); return; }
        if (validity.password !== 'valid') { showToast("Password minimal 6 karakter", "error"); return; }
        if (validity.confirmPassword !== 'valid') { showToast("Konfirmasi password tidak cocok", "error"); return; }

        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(() => resolve(true), 1500));
            const response = await api.post('/auth/register', formData);

            if (response.status === 200 || response.status === 201 || response.data?.success) {
                showToast("Pendaftaran berhasil, silakan cek email Anda", "success");
                navigation.navigate('OtpVerification', {
                    email: formData.email,
                    isFromRegister: true
                });
            } else {
                showToast(response.data?.message || "Gagal mendaftar", "error");
            }
        } catch (error: any) {
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
            navigation.navigate('Welcome');
        }
    };

    const getBorderColor = (state: string) => {
        if (state === 'valid') return '#10B981';
        if (state === 'invalid') return '#EF4444';
        return '#E2E8F0';
    };

    const getIconColor = (state: string) => {
        if (state === 'valid') return '#10B981';
        if (state === 'invalid') return '#EF4444';
        return '#94A3B8';
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <LoadingOverlay visible={loading} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.headerBtn}>
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => showToast("Bantuan Daftar", "info")} style={styles.headerBtn}>
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
                        <Icon name="person-add" size={32} color="#FFB800" />
                    </View>
                </View>

                <Text style={styles.title}>Daftar Akun</Text>
                <Text style={styles.subtitle}>
                    {step === 1
                        ? "Langkah 1: Lengkapi identitas diri Anda sesuai dengan data KTP."
                        : "Langkah 2: Buat keamanan akun dengan email dan kata sandi."}
                </Text>

                {/* UI Alur (Progress Indicator) */}
                <View style={styles.progressContainer}>
                    <View style={[styles.stepDot, styles.activeDot]} />
                    <View style={[styles.stepLine, step >= 2 ? styles.activeLine : styles.inactiveLine]} />
                    <View style={[styles.stepDot, step >= 2 ? styles.activeDot : styles.inactiveDot]} />
                    <View style={[styles.stepLine, styles.inactiveLine]} />
                    <View style={[styles.stepDot, styles.inactiveDot]} />
                </View>

                {step === 1 ? (
                    <View style={styles.formContainer}>
                        <Text style={styles.inputLabel}>Nama Lengkap</Text>
                        <View style={[styles.inputBox, { borderColor: getBorderColor(validity.fullName) }]}>
                            <Icon name="person-outline" size={20} color={getIconColor(validity.fullName)} />
                            <TextInput
                                style={styles.input}
                                placeholder="Nama sesuai KTP"
                                placeholderTextColor="#94A3B8"
                                value={formData.fullName}
                                onChangeText={(val) => handleChange('fullName', val)}
                            />
                            {validity.fullName === 'valid' && <Icon name="checkmark-circle" size={20} color="#10B981" />}
                        </View>
                        <Text style={[styles.helperText, validity.fullName === 'invalid' && styles.errorHelper]}>
                            {validity.fullName === 'invalid' ? 'Nama minimal 3 karakter' : 'Masukkan nama lengkap sesuai KTP'}
                        </Text>

                        <Text style={styles.inputLabel}>NIK</Text>
                        <View style={[styles.inputBox, { borderColor: getBorderColor(validity.nik) }]}>
                            <Icon name="card-outline" size={20} color={getIconColor(validity.nik)} />
                            <TextInput
                                style={styles.input}
                                placeholder="16 Digit NIK"
                                placeholderTextColor="#94A3B8"
                                value={formData.nik}
                                onChangeText={(val) => handleChange('nik', val.replace(/\D/g, ''))}
                                keyboardType="numeric"
                                maxLength={16}
                            />
                            {validity.nik === 'valid' && <Icon name="checkmark-circle" size={20} color="#10B981" />}
                        </View>
                        <Text style={[styles.helperText, validity.nik === 'invalid' && styles.errorHelper]}>
                            {validity.nik === 'invalid' ? 'NIK harus 16 digit angka' : 'Masukkan 16 digit nomor induk kependudukan'}
                        </Text>

                        <Text style={styles.inputLabel}>Nomor Telepon</Text>
                        <View style={[styles.inputBox, { borderColor: getBorderColor(validity.phoneNumber) }]}>
                            <Icon name="call-outline" size={20} color={getIconColor(validity.phoneNumber)} />
                            <TextInput
                                style={styles.input}
                                placeholder="08xxxxxxxxxx"
                                placeholderTextColor="#94A3B8"
                                value={formData.phoneNumber}
                                onChangeText={(val) => handleChange('phoneNumber', val.replace(/\D/g, ''))}
                                keyboardType="phone-pad"
                            />
                            {validity.phoneNumber === 'valid' && <Icon name="checkmark-circle" size={20} color="#10B981" />}
                        </View>
                        <Text style={[styles.helperText, validity.phoneNumber === 'invalid' && styles.errorHelper]}>
                            {validity.phoneNumber === 'invalid' ? 'Nomor harus diawali 08' : 'Contoh: 08123456789'}
                        </Text>

                        <Text style={styles.inputLabel}>Alamat Lengkap</Text>
                        <View style={[styles.inputBox, { height: 100, alignItems: 'flex-start', paddingTop: 16, borderColor: getBorderColor(validity.alamat) }]}>
                            <Icon name="map-outline" size={20} color={getIconColor(validity.alamat)} />
                            <TextInput
                                style={[styles.input, { textAlignVertical: 'top' }]}
                                placeholder="Alamat sesuai domisili"
                                placeholderTextColor="#94A3B8"
                                value={formData.alamat}
                                onChangeText={(val) => handleChange('alamat', val)}
                                multiline
                            />
                        </View>
                        <Text style={[styles.helperText, validity.alamat === 'invalid' && styles.errorHelper]}>
                            {validity.alamat === 'invalid' ? 'Alamat minimal 10 karakter' : 'Contoh: Jl. Merdeka No. 1, Kuningan'}
                        </Text>

                        <TouchableOpacity
                            style={[styles.primaryBtn]}
                            onPress={handleNextToStep2}
                            disabled={loading}
                        >
                            <Text style={styles.primaryBtnText}>Selanjutnya</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.formContainer}>
                        <Text style={styles.inputLabel}>Alamat Email</Text>
                        <View style={[styles.inputBox, { borderColor: getBorderColor(validity.email) }]}>
                            <Icon name="mail-outline" size={20} color={getIconColor(validity.email)} />
                            <TextInput
                                style={styles.input}
                                placeholder="nama@email.com"
                                placeholderTextColor="#94A3B8"
                                value={formData.email}
                                onChangeText={(val) => handleChange('email', val)}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            {validity.email === 'valid' && <Icon name="checkmark-circle" size={20} color="#10B981" />}
                        </View>
                        <Text style={[styles.helperText, validity.email === 'invalid' && styles.errorHelper]}>
                            {validity.email === 'invalid' ? 'Format email tidak valid' : 'Gunakan email aktif (Gmail/Yahoo/dll)'}
                        </Text>

                        <Text style={styles.inputLabel}>Username</Text>
                        <View style={[styles.inputBox, { borderColor: getBorderColor(validity.username) }]}>
                            <Icon name="at-outline" size={20} color={getIconColor(validity.username)} />
                            <TextInput
                                style={styles.input}
                                placeholder="Buat username"
                                placeholderTextColor="#94A3B8"
                                value={formData.username}
                                onChangeText={(val) => handleChange('username', val.toLowerCase())}
                                autoCapitalize="none"
                            />
                            {validity.username === 'valid' && <Icon name="checkmark-circle" size={20} color="#10B981" />}
                        </View>
                        <Text style={[styles.helperText, validity.username === 'invalid' && styles.errorHelper]}>
                            {validity.username === 'invalid' ? 'Username minimal 4 karakter' : 'Gunakan nama unik tanpa spasi'}
                        </Text>

                        <Text style={styles.inputLabel}>Kata Sandi</Text>
                        <View style={[styles.inputBox, { borderColor: getBorderColor(validity.password) }]}>
                            <Icon name="lock-closed-outline" size={20} color={getIconColor(validity.password)} />
                            <TextInput
                                style={styles.input}
                                placeholder="........."
                                placeholderTextColor="#94A3B8"
                                secureTextEntry={!showPassword}
                                value={formData.password}
                                onChangeText={(val) => handleChange('password', val)}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ marginRight: 8 }}>
                                <Icon name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#94A3B8" />
                            </TouchableOpacity>
                            {validity.password === 'valid' && <Icon name="checkmark-circle" size={20} color="#10B981" />}
                        </View>
                        <Text style={[styles.helperText, validity.password === 'invalid' && styles.errorHelper]}>
                            {validity.password === 'invalid' ? 'Password minimal 6 karakter' : 'Gunakan kombinasi huruf & angka'}
                        </Text>

                        <Text style={styles.inputLabel}>Konfirmasi Kata Sandi</Text>
                        <View style={[styles.inputBox, { borderColor: getBorderColor(validity.confirmPassword) }]}>
                            <Icon name="lock-check-outline" size={20} color={getIconColor(validity.confirmPassword)} />
                            <TextInput
                                style={styles.input}
                                placeholder="........."
                                placeholderTextColor="#94A3B8"
                                secureTextEntry={!showConfirmPassword}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                            />
                            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ marginRight: 8 }}>
                                <Icon name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#94A3B8" />
                            </TouchableOpacity>
                            {validity.confirmPassword === 'valid' && <Icon name="checkmark-circle" size={20} color="#10B981" />}
                        </View>
                        <Text style={[styles.helperText, validity.confirmPassword === 'invalid' && styles.errorHelper]}>
                            {validity.confirmPassword === 'invalid' ? 'Password tidak cocok' : 'Ulangi kembali password di atas'}
                        </Text>

                        <TouchableOpacity
                            style={[styles.primaryBtn]}
                            onPress={handleSubmitToOtp}
                            disabled={loading}
                        >
                            <Text style={styles.primaryBtnText}>Daftar Sekarang</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={[styles.loginFooter, { marginTop: 24 }]}>
                    <Text style={styles.footerText}>Sudah punya akun? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.loginLink}>Masuk Disini</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

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
        paddingHorizontal: 10,
        marginBottom: 32,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
        paddingHorizontal: 40,
    },
    stepDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
    },
    inactiveDot: {
        backgroundColor: '#E2E8F0',
    },
    activeDot: {
        backgroundColor: '#FFB800',
    },
    stepLine: {
        flex: 1,
        height: 3,
        marginHorizontal: 4,
    },
    inactiveLine: {
        backgroundColor: '#E2E8F0',
    },
    activeLine: {
        backgroundColor: '#FFB800',
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
        borderWidth: 1.5,
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
    primaryBtn: {
        width: '100%',
        height: 56,
        backgroundColor: '#FFB800',
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        marginBottom: 8,
    },
    primaryBtnText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0F172A',
    },
    loginFooter: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    loginLink: {
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
    helperText: {
        fontSize: 10,
        color: '#94A3B8',
        marginTop: -12,
        marginBottom: 16,
        paddingLeft: 4,
        fontWeight: '700',
    },
    errorHelper: {
        color: '#EF4444',
    },
});
