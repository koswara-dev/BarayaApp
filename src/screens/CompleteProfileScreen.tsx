import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Platform,
    StatusBar,
    KeyboardAvoidingView,
    ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import useUserStore from '../stores/userStore';
import useAuthStore from '../stores/authStore';
import useToastStore from '../stores/toastStore';
import api from '../config/api';

export default function CompleteProfileScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { requireNik } = route.params || {};
    const { user } = useAuthStore();
    const { profile, fetchUserProfile } = useUserStore();
    const showToast = useToastStore(state => state.showToast);

    const [fullName, setFullName] = useState(profile?.fullName || user?.fullName || '');
    const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber || '');
    const [nik, setNik] = useState(profile?.nik || '');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profile) {
            if (!fullName && profile.fullName) setFullName(profile.fullName);
            if (!phoneNumber && profile.phoneNumber) setPhoneNumber(profile.phoneNumber);
            if (!nik && profile.nik) setNik(profile.nik);
        }
    }, [profile]);

    const handleSubmit = async () => {
        if (!fullName.trim() || fullName.length < 3) {
            showToast("Nama lengkap minimal 3 karakter", "error");
            return;
        }

        // NIK Validation
        if (requireNik) {
             if (!nik.trim()) {
                showToast("NIK harus diisi karena pengaduan bisa sampai ke Pusat", "error");
                return;
             }
        }

        // if filled must be 16 digits
        if (nik.trim() && nik.length !== 16) {
             showToast("NIK harus 16 digit angka", "error");
             return;
        }

        let finalPhoneNumber = phoneNumber.trim();
        
        // Auto-convert 08 -> 628
        if (finalPhoneNumber.startsWith('08')) {
            finalPhoneNumber = '62' + finalPhoneNumber.substring(1);
        } else if (finalPhoneNumber.startsWith('8')) {
             finalPhoneNumber = '62' + finalPhoneNumber;
        }

        if (!finalPhoneNumber.startsWith('628') || finalPhoneNumber.length < 10) {
            showToast("Nomor Whatsapp tidak valid (harus diawali 628)", "error");
            return;
        }

        setLoading(true);
        try {
            // Update profile via API
            // Assuming PUT /users/{id} accepts these fields
            const payload = {
                fullName,
                phoneNumber: finalPhoneNumber,
                nik
            };

            const response = await api.put(`/users/${user?.id}`, payload);
            
            if (response.data.success) {
                showToast("Profil berhasil dilengkapi", "success");
                // Refresh profile to trigger navigation update in RootNavigator
                if (user?.id) {
                    await fetchUserProfile(user.id);
                }
            } else {
                showToast(response.data.message || "Gagal mengupdate profil", "error");
            }
        } catch (error: any) {
            console.error('Update profile error:', error);
            showToast(error.message || "Terjadi kesalahan", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <View style={styles.iconBox}>
                        <Icon name="person-circle" size={60} color="#FFB800" />
                    </View>
                    <Text style={styles.title}>Lengkapi Profil</Text>
                    <Text style={styles.subtitle}>
                        Mohon lengkapi data diri Anda untuk melanjutkan menggunakan aplikasi Smart Service Kuningan.
                    </Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>Nama Lengkap</Text>
                    <View style={styles.inputBox}>
                        <Icon name="person-outline" size={20} color="#94A3B8" />
                        <TextInput
                            style={styles.input}
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="Nama sesuai KTP"
                            placeholderTextColor="#CBD5E1"
                        />
                    </View>

                    <Text style={styles.label}>NIK {requireNik ? '(Wajib)' : '(Opsional)'}</Text>
                     <View style={styles.inputBox}>
                        <Icon name="card-outline" size={20} color="#94A3B8" />
                        <TextInput
                            style={styles.input}
                            value={nik}
                            onChangeText={(text) => setNik(text.replace(/\D/g, ''))}
                            placeholder={`16 digit NIK ${requireNik ? '(Wajib)' : '(Opsional)'}`}
                            placeholderTextColor="#CBD5E1"
                            keyboardType="numeric"
                            maxLength={16}
                        />
                    </View>

                    <Text style={styles.label}>Nomor Whatsapp</Text>
                    <View style={styles.inputBox}>
                        <Icon name="logo-whatsapp" size={20} color="#94A3B8" />
                        <TextInput
                            style={styles.input}
                            value={phoneNumber}
                            onChangeText={(text) => setPhoneNumber(text.replace(/\D/g, ''))}
                            placeholder="628xxxxxxxxxx"
                            placeholderTextColor="#CBD5E1"
                            keyboardType="phone-pad"
                        />
                    </View>

                    <TouchableOpacity 
                        style={styles.submitBtn} 
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#0F172A" />
                        ) : (
                            <Text style={styles.submitText}>Simpan & Lanjutkan</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        padding: 24,
        flexGrow: 1,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconBox: {
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
    },
    form: {
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 8,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 50,
        marginBottom: 20,
        backgroundColor: '#F8FAFC',
    },
    input: {
        flex: 1,
        marginLeft: 10,
        color: '#0F172A',
        fontSize: 15,
    },
    submitBtn: {
        backgroundColor: '#FFB800',
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
    },
    submitText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
    }
});
