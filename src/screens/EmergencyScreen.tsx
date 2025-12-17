import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, StatusBar, ActivityIndicator, Alert, Platform, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import useAuthStore from '../stores/authStore';
import useEmergencyStore from '../stores/emergencyStore';
import useNotificationStore from '../stores/notificationStore';
import { useNavigation } from '@react-navigation/native';
import { EmergencyReportCard } from '../components/EmergencyReportCard';
import Geolocation from 'react-native-geolocation-service';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

const DINAS_OPTIONS = [
    { id: 3, name: 'Polisi', icon: 'shield' },
    { id: 4, name: 'Pemadam Kebakaran', icon: 'flame' },
    { id: 5, name: 'Ambulans', icon: 'medkit' },
    { id: 6, name: 'BPBD', icon: 'umbrella' },
];

export default function EmergencyScreen() {
    const navigation = useNavigation<any>();
    const user = useAuthStore((state) => state.user);
    const { createReport, loading } = useEmergencyStore();
    const { sendNotification } = useNotificationStore();

    const [message, setMessage] = useState('');
    const [submittedReport, setSubmittedReport] = useState<any>(null);
    const [location, setLocation] = useState({
        lat: -6.9175,
        long: 107.6191,
        address: 'Menentukan lokasi...'
    });
    const [locLoading, setLocLoading] = useState(false);
    const [photo, setPhoto] = useState<any>(null);
    const [selectedDinas, setSelectedDinas] = useState<any>(null);

    useEffect(() => {
        requestLocation();
    }, []);

    const requestLocation = async () => {
        setLocLoading(true);
        let permissionCheck = '';
        if (Platform.OS === 'ios') {
            permissionCheck = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
            if (permissionCheck === RESULTS.DENIED) {
                const result = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
                permissionCheck = result;
            }
        } else {
            permissionCheck = await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
            if (permissionCheck === RESULTS.DENIED) {
                const result = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
                permissionCheck = result;
            }
        }

        if (permissionCheck === RESULTS.GRANTED) {
            Geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setLocation({
                        lat: latitude,
                        long: longitude,
                        address: `Lat: ${latitude.toFixed(5)}, Long: ${longitude.toFixed(5)}`
                    });
                    setLocLoading(false);
                },
                (error) => {
                    setLocLoading(false);
                    Alert.alert('Gagal', 'Gagal mendapatkan lokasi GPS: ' + error.message);
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
            );
        } else {
            setLocLoading(false);
            setLocation(prev => ({ ...prev, address: 'Izin lokasi ditolak' }));
        }
    };

    const handleLocationSelect = (newLoc: any) => {
        setLocation(newLoc);
    };

    const handleManualLocation = () => {
        navigation.navigate('MapEmergency', { onLocationSelect: handleLocationSelect });
    };

    const handleCamera = async () => {
        const result = await launchCamera({ mediaType: 'photo', quality: 0.5 });
        if (result.assets && result.assets.length > 0) {
            setPhoto(result.assets[0]);
        }
    };

    const handleGallery = async () => {
        const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.5 });
        if (result.assets && result.assets.length > 0) {
            setPhoto(result.assets[0]);
        }
    };

    const removePhoto = () => {
        setPhoto(null);
    };

    const handleSubmit = async () => {
        if (!message.trim()) return;

        if (!user?.id) {
            Alert.alert('Error', 'Sesi anda telah berakhir. Silahkan login kembali.');
            return;
        }

        try {
            // 1. Create Report
            const reportPayload = {
                userId: user.id,
                fullName: user.fullName || "User",
                phoneNumber: (user as any)?.phoneNumber || "08123456789", // Fallback if phone missing
                latitude: location.lat,
                longitude: location.long,
                pesan: message,
                dinasId: selectedDinas?.id,
                dinasNama: selectedDinas?.name,
                foto: photo
            };

            const result = await createReport(reportPayload);

            // 2. Create Notification
            await sendNotification({
                userId: user.id, // Add userId to ensure backend knows who to notify
                judul: "Laporan Darurat Diterima",
                pesan: `Laporan darurat dari ${user.fullName}: "${message.substring(0, 50)}..." telah diterima dan sedang diproses.`,
                isRead: false,
                eventId: result.id
            });

            // 3. Show Result
            setSubmittedReport(result);
            Alert.alert('Laporan Dikirim', 'Laporan berhasil dikirim, bantuan akan segera datang!');
            setMessage('');
            setPhoto(null);
            setSelectedDinas(null);

        } catch (error: any) {
            Alert.alert('Gagal Mengirim', error.message || 'Terjadi kesalahan saat mengirim laporan.');
        }
    };

    const handleReset = () => {
        setSubmittedReport(null);
        setMessage('');
        setPhoto(null);
        setSelectedDinas(null);
    };

    const getInitials = (name: string) => {
        return name?.slice(0, 2).toUpperCase() || 'US';
    };

    // --- RENDER SUCCESS VIEW ---
    if (submittedReport) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleReset} style={styles.backBtn}>
                        <Icon name="arrow-back" size={24} color="#0F172A" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Detail Laporan</Text>
                </View>

                <View style={[styles.content, { alignItems: 'center', paddingTop: 40 }]}>
                    <View style={styles.successIcon}>
                        <Icon name="checkmark-circle" size={80} color="#10B981" />
                    </View>
                    <Text style={styles.successTitle}>Laporan Berhasil Dibuat!</Text>
                    <Text style={styles.successDesc}>
                        Tim kami telah menerima posisi dan laporan Anda. Mohon tetap di lokasi jika aman.
                    </Text>

                    <View style={{ width: '100%', marginTop: 24 }}>
                        <EmergencyReportCard item={submittedReport} />
                    </View>

                    <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                        <Text style={styles.resetBtnText}>Buat Laporan Baru</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // --- RENDER FORM VIEW ---
    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Buat Laporan Darurat</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Location Section */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Icon name="locate" size={20} color="#2563EB" />
                        <Text style={styles.cardTitle}>Lokasi Kejadian</Text>
                        <View style={styles.locationBadge}>
                            <Icon name="navigate-circle" size={16} color="#10B981" />
                        </View>
                    </View>

                    <View style={styles.locationBox}>
                        <View style={styles.coordinateRow}>
                            <View style={styles.dot} />
                            <Text style={styles.coordinateLabel}>KOORDINAT TERKINI</Text>
                        </View>
                        <Text style={styles.coordinateValue}>
                            Lat: <Text style={styles.mono}>{location.lat}</Text>   Long: <Text style={styles.mono}>{location.long}</Text>
                        </Text>
                        <Text style={styles.address}>{location.address}</Text>
                    </View>

                    <TouchableOpacity style={styles.outlineBtn} onPress={handleManualLocation}>
                        <Icon name="map" size={18} color="#0F172A" />
                        <Text style={styles.outlineBtnText}>Sesuaikan Lokasi Manual</Text>
                    </TouchableOpacity>
                </View>

                {/* Dinas Selection */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Icon name="briefcase" size={20} color="#2563EB" />
                        <Text style={styles.cardTitle}>Jenis Layanan</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dinasScroll}>
                        {DINAS_OPTIONS.map((dinas) => (
                            <TouchableOpacity
                                key={dinas.id}
                                style={[
                                    styles.dinasItem,
                                    selectedDinas?.id === dinas.id && styles.dinasItemSelected
                                ]}
                                onPress={() => setSelectedDinas(dinas)}
                            >
                                <Icon
                                    name={dinas.icon}
                                    size={20}
                                    color={selectedDinas?.id === dinas.id ? '#FFF' : '#64748B'}
                                />
                                <Text style={[
                                    styles.dinasText,
                                    selectedDinas?.id === dinas.id && styles.dinasTextSelected
                                ]}>
                                    {dinas.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Message Section */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Pesan Darurat <Text style={{ color: '#EF4444' }}>*</Text></Text>
                    </View>
                    <TextInput
                        style={styles.textArea}
                        placeholder="Jelaskan secara singkat apa yang terjadi dan bantuan apa yang dibutuhkan..."
                        placeholderTextColor="#94A3B8"
                        multiline
                        numberOfLines={4}
                        value={message}
                        onChangeText={setMessage}
                        textAlignVertical="top"
                    />
                    <Text style={styles.charCount}>{message.length}/500 karakter</Text>
                </View>

                {/* Photo Section */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Bukti Foto <Text style={styles.optional}>(Opsional)</Text></Text>
                    </View>

                    {photo ? (
                        <View style={styles.photoPreviewContainer}>
                            <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
                            <TouchableOpacity style={styles.removePhotoBtn} onPress={removePhoto}>
                                <Icon name="close" size={16} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.photoGrid}>
                            <TouchableOpacity style={styles.photoBtn} onPress={handleCamera}>
                                <View style={styles.photoIconBg}>
                                    <Icon name="camera" size={24} color="#64748B" />
                                </View>
                                <Text style={styles.photoBtnText}>Ambil Foto</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.photoBtn} onPress={handleGallery}>
                                <View style={styles.photoIconBg}>
                                    <Icon name="images" size={24} color="#64748B" />
                                </View>
                                <Text style={styles.photoBtnText}>Pilih Galeri</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <View style={styles.reporterInfo}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{getInitials(user?.fullName || '')}</Text>
                    </View>
                    <Text style={styles.reporterText}>Melapor sebagai <Text style={styles.reporterName}>{user?.fullName || 'User'}</Text></Text>
                </View>

                <TouchableOpacity
                    style={[styles.submitBtn, (!message.trim() || loading) && styles.disabledBtn]}
                    onPress={handleSubmit}
                    disabled={!message.trim() || loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Icon name="paper-plane" size={20} color="#FFF" />
                            <Text style={styles.submitBtnText}>Kirim Laporan</Text>
                        </>
                    )}
                </TouchableOpacity>

                <Text style={styles.disclaimer}>
                    Dengan menekan tombol kirim, Anda menyatakan bahwa informasi yang diberikan adalah benar dan mendesak.
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#F8FAFC',
        // borderBottomWidth: 1,
        // borderBottomColor: '#E2E8F0',
    },
    backBtn: {
        marginRight: 16,
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
        marginLeft: 8,
        flex: 1,
    },
    locationBadge: {
        // backgroundColor: '#ECFDF5',
        // borderRadius: 12,
        // padding: 4,
    },
    locationBox: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    coordinateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10B981',
        marginRight: 6,
    },
    coordinateLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748B',
        letterSpacing: 0.5,
    },
    coordinateValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#0F172A',
        marginTop: 4,
        marginBottom: 2,
    },
    mono: {
        fontFamily: 'monospace', // Or Platform dependent monospace
    },
    address: {
        fontSize: 12,
        color: '#64748B',
        lineHeight: 18,
    },
    outlineBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 10,
        backgroundColor: '#FFF',
        gap: 8,
    },
    outlineBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#0F172A',
    },
    optional: {
        color: '#94A3B8',
        fontWeight: '400',
    },
    textArea: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 16,
        minHeight: 120,
        fontSize: 14,
        color: '#0F172A',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    charCount: {
        textAlign: 'right',
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 6,
    },
    photoGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    photoBtn: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#94A3B8',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        height: 120,
    },
    photoIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    photoBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#334155',
    },
    footer: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    reporterInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    avatarText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#475569',
    },
    reporterText: {
        fontSize: 13,
        color: '#64748B',
    },
    reporterName: {
        fontWeight: '700',
        color: '#0F172A',
    },
    submitBtn: {
        backgroundColor: '#2563EB',
        borderRadius: 12,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#2563EB',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 4,
    },
    disabledBtn: {
        backgroundColor: '#94A3B8',
        shadowOpacity: 0,
        elevation: 0,
    },
    submitBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    disclaimer: {
        fontSize: 11,
        color: '#94A3B8',
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 16,
    },
    /* Success Styles */
    successIcon: {
        marginBottom: 20,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 10,
        textAlign: 'center',
    },
    successDesc: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 22,
    },
    resetBtn: {
        marginTop: 24,
        paddingVertical: 14,
        paddingHorizontal: 32,
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
    },
    resetBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#475569',
    },
    dinasScroll: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    dinasItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#F1F5F9',
        borderRadius: 20,
        marginRight: 10,
        gap: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    dinasItemSelected: {
        backgroundColor: '#2563EB',
    },
    dinasText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },
    dinasTextSelected: {
        color: '#FFFFFF',
    },
    photoPreviewContainer: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    photoPreview: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    removePhotoBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
