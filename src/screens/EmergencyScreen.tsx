import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, StatusBar, ActivityIndicator, Alert, Platform, Image, RefreshControl, Vibration, Modal, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import useAuthStore from '../stores/authStore';
import useEmergencyStore, { EmergencyReport, TrackingStep } from '../stores/emergencyStore';
import useNotificationStore from '../stores/notificationStore';
import { useNavigation } from '@react-navigation/native';
import GetLocation from 'react-native-get-location';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { getImageUrl } from '../config/api';
import { ConfirmModal } from '../components/ConfirmModal';
import useToastStore from '../stores/toastStore';
import { notificationHelper } from '../utils/notificationHelper';
import { playEmergencySound } from '../utils/soundPlayer';
import useLayananStore from '../stores/layananStore';

const getDinasIcon = (nama: string) => {
    const n = nama.toUpperCase();
    if (n.includes('POLISI') || n.includes('KEPOLISIAN')) return 'shield';
    if (n.includes('PEMADAM') || n.includes('KEBAKARAN')) return 'flame';
    if (n.includes('AMBULANS') || n.includes('KESEHATAN') || n.includes('MEDIS')) return 'medkit';
    if (n.includes('BPBD') || n.includes('BENCANA')) return 'umbrella';
    if (n.includes('PENDIDIKAN')) return 'school';
    return 'business';
};

export default function EmergencyScreen() {
    const navigation = useNavigation<any>();
    const user = useAuthStore((state) => state.user);
    const {
        createReport,
        loading,
        activeReport,
        fetchMyActiveReport,
        completeReport,
        getTrackingSteps
    } = useEmergencyStore();
    const { sendNotification } = useNotificationStore();
    const showToast = useToastStore((state) => state.showToast);
    const { dinas: dinasList, fetchDinas } = useLayananStore();

    const [message, setMessage] = useState('');
    const [location, setLocation] = useState({
        lat: -6.9175,
        long: 107.6191,
        address: 'Menentukan lokasi...'
    });
    const [locLoading, setLocLoading] = useState(false);
    const [photo, setPhoto] = useState<any>(null);
    const [selectedDinas, setSelectedDinas] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Fetch active report on mount
    useEffect(() => {
        if (user?.id) {
            fetchMyActiveReport(user.id);
        }
        fetchDinas();
        // Inisialisasi channel notifikasi
        notificationHelper.createChannels();
    }, [user?.id]);

    useEffect(() => {
        if (!activeReport) {
            requestLocation();
        }
        requestNotificationPermission();
    }, [activeReport]);

    const requestNotificationPermission = async () => {
        if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
            const postNotificationPermission = (PERMISSIONS.ANDROID as any).POST_NOTIFICATIONS;
            if (postNotificationPermission) {
                const permissionCheck = await check(postNotificationPermission);
                if (permissionCheck === RESULTS.DENIED) {
                    await request(postNotificationPermission);
                }
            }
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        if (user?.id) {
            await fetchMyActiveReport(user.id);
        }
        setRefreshing(false);
    };

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
            try {
                const position = await GetLocation.getCurrentPosition({
                    enableHighAccuracy: true,
                    timeout: 15000,
                });

                const { latitude, longitude } = position;
                setLocation({
                    lat: latitude,
                    long: longitude,
                    address: `Lat: ${latitude.toFixed(5)}, Long: ${longitude.toFixed(5)}`
                });
            } catch (error: any) {
                Alert.alert('Gagal', 'Gagal mendapatkan lokasi GPS: ' + error.message);
            } finally {
                setLocLoading(false);
            }
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
            const reportPayload = {
                userId: user.id,
                fullName: user.fullName || "User",
                phoneNumber: (user as any)?.phoneNumber || "08123456789",
                latitude: location.lat,
                longitude: location.long,
                pesan: message,
                dinasId: selectedDinas?.id,
                dinasNama: selectedDinas?.nama,
                foto: photo
            };

            const result = await createReport(reportPayload);
            showToast('Laporan darurat berhasil disimpan', 'success');

            // Beri jeda 4 detik agar backend benar-benar selesai menyimpan data (mencegah "Event not found")
            await new Promise(resolve => setTimeout(() => resolve(null), 4000));

            try {
                // Send notification to API /api/v1/notifikasi
                await sendNotification({
                    judul: "Pesan Darurat!",
                    pesan: message,
                    read: false,
                    eventId: 1, // Menggunakan default value (ID 1) sesuai instruksi agar tidak error 'Event not found'
                    dinasId: selectedDinas?.id || null,
                    dinasNama: selectedDinas?.nama || null
                });
            } catch (notifError) {
                // Silently fail for backend notification sync
                console.log('Backend notification sync failed:', notifError);
            }

            // Tampilkan Notifikasi Lokal di HP (System Tray)
            await notificationHelper.displayNotification(
                "Pesan Darurat!",
                message,
                'emergency'
            );

            // Vibration pattern like Gojek order notification
            Vibration.vibrate([0, 200, 100, 200, 100, 300]);
            playEmergencySound();

            // Show success modal
            setShowSuccessModal(true);
            showToast('Laporan & Notifikasi berhasil terkirim ke semua pengguna', 'success');
            setMessage('');
            setPhoto(null);
            setSelectedDinas(null);

        } catch (error: any) {
            showToast(error.message || 'Terjadi kesalahan saat mengirim laporan.', 'error');
        }
    };

    const handleCompleteReport = () => {
        setShowCompleteModal(true);
    };

    const confirmCompleteReport = () => {
        setShowCompleteModal(false);
        completeReport();
    };

    const getInitials = (name: string) => {
        return name?.slice(0, 2).toUpperCase() || 'US';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'pending': return { bg: '#FEF3C7', text: '#92400E' };
            case 'diterima': return { bg: '#DBEAFE', text: '#1E40AF' };
            case 'diproses': return { bg: '#D1FAE5', text: '#065F46' };
            case 'selesai': return { bg: '#DCFCE7', text: '#166534' };
            case 'dibatalkan': return { bg: '#FEE2E2', text: '#991B1B' };
            default: return { bg: '#F1F5F9', text: '#64748B' };
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return 'Menunggu';
            case 'diterima': return 'Diterima';
            case 'diproses': return 'Diproses';
            case 'selesai': return 'Selesai';
            case 'dibatalkan': return 'Dibatalkan';
            default: return status;
        }
    };

    // --- RENDER ACTIVE REPORT WITH TRACKING ---
    if (activeReport) {
        const trackingSteps = getTrackingSteps();
        const statusColors = getStatusBadgeColor(activeReport.status);

        return (
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Icon name="arrow-back" size={24} color="#0F172A" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Status Laporan Darurat</Text>
                </View>

                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    {/* Status Card */}
                    <View style={styles.statusCard}>
                        <View style={styles.statusHeader}>
                            <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                                <Text style={[styles.statusBadgeText, { color: statusColors.text }]}>
                                    {getStatusLabel(activeReport.status)}
                                </Text>
                            </View>
                            <Text style={styles.reportId}>ID: #{activeReport.id}</Text>
                        </View>
                        <Text style={styles.reportDate}>{formatDate(activeReport.createdAt)}</Text>
                    </View>

                    {/* Tracking Timeline */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Icon name="navigate-circle" size={20} color="#2563EB" />
                            <Text style={styles.cardTitle}>Lacak Status</Text>
                        </View>

                        <View style={styles.timeline}>
                            {trackingSteps.map((step, index) => (
                                <View key={step.status} style={styles.timelineItem}>
                                    {/* Connector Line */}
                                    {index !== trackingSteps.length - 1 && (
                                        <View style={[
                                            styles.timelineLine,
                                            step.isCompleted && styles.timelineLineCompleted
                                        ]} />
                                    )}

                                    {/* Icon Circle */}
                                    <View style={[
                                        styles.timelineIcon,
                                        step.isCompleted && styles.timelineIconCompleted,
                                        step.isActive && styles.timelineIconActive
                                    ]}>
                                        <Icon
                                            name={step.icon}
                                            size={16}
                                            color={step.isCompleted || step.isActive ? '#FFF' : '#94A3B8'}
                                        />
                                    </View>

                                    {/* Content */}
                                    <View style={styles.timelineContent}>
                                        <Text style={[
                                            styles.timelineLabel,
                                            (step.isCompleted || step.isActive) && styles.timelineLabelActive
                                        ]}>
                                            {step.label}
                                        </Text>
                                        <Text style={styles.timelineDesc}>{step.description}</Text>
                                        {step.isActive && (
                                            <View style={styles.activePulse}>
                                                <Text style={styles.activePulseText}>Sedang berlangsung</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Report Details */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Icon name="document-text" size={20} color="#2563EB" />
                            <Text style={styles.cardTitle}>Detail Laporan</Text>
                        </View>

                        {/* Dinas Info */}
                        {activeReport.dinasNama && (
                            <View style={styles.detailRow}>
                                <View style={styles.detailIcon}>
                                    <Icon name="business" size={18} color="#64748B" />
                                </View>
                                <View style={styles.detailContent}>
                                    <Text style={styles.detailLabel}>Ditangani Oleh</Text>
                                    <Text style={styles.detailValue}>{activeReport.dinasNama}</Text>
                                </View>
                            </View>
                        )}

                        {/* Location */}
                        <View style={styles.detailRow}>
                            <View style={styles.detailIcon}>
                                <Icon name="location" size={18} color="#64748B" />
                            </View>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Lokasi Kejadian</Text>
                                <Text style={styles.detailValue}>
                                    Lat: {activeReport.latitude?.toFixed(5)}, Long: {activeReport.longitude?.toFixed(5)}
                                </Text>
                            </View>
                        </View>

                        {/* Message */}
                        <View style={styles.detailRow}>
                            <View style={styles.detailIcon}>
                                <Icon name="chatbubble-ellipses" size={18} color="#64748B" />
                            </View>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Pesan Darurat</Text>
                                <Text style={styles.detailValue}>{activeReport.pesan}</Text>
                            </View>
                        </View>

                        {/* Photo */}
                        {activeReport.urlFoto && (
                            <View style={styles.photoContainer}>
                                <Text style={styles.photoLabel}>Bukti Foto</Text>
                                <Image
                                    source={{ uri: getImageUrl(activeReport.urlFoto) }}
                                    style={styles.photoImage}
                                    resizeMode="cover"
                                />
                            </View>
                        )}
                    </View>

                    {/* Contact Info */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Icon name="call" size={20} color="#2563EB" />
                            <Text style={styles.cardTitle}>Kontak Darurat</Text>
                        </View>
                        <Text style={styles.contactInfo}>
                            Jika ada pertanyaan mendesak, hubungi call center: <Text style={styles.contactNumber}>112</Text>
                        </Text>
                    </View>

                    {/* Complete Button */}
                    <TouchableOpacity style={styles.completeBtn} onPress={handleCompleteReport}>
                        <Icon name="checkmark-done" size={20} color="#065F46" />
                        <Text style={styles.completeBtnText}>Tandai Selesai</Text>
                    </TouchableOpacity>

                    <Text style={styles.completeHint}>
                        Tekan tombol di atas jika masalah Anda sudah teratasi dan ingin membuat laporan baru
                    </Text>

                    <View style={{ height: 40 }} />
                </ScrollView>

                {/* Confirm Complete Modal */}
                <ConfirmModal
                    visible={showCompleteModal}
                    title="Selesaikan Laporan"
                    message="Apakah Anda yakin ingin menyelesaikan laporan ini? Anda akan dapat membuat laporan baru setelahnya."
                    onConfirm={confirmCompleteReport}
                    onCancel={() => setShowCompleteModal(false)}
                    confirmText="Ya, Selesaikan"
                    cancelText="Batal"
                    type="success"
                />
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
                        {dinasList
                            .filter(d => !d.nama.toUpperCase().includes('PENDIDIKAN'))
                            .sort((a, b) => {
                                const order = ['PEMADAM', 'AMBULANS', 'KESEHATAN', 'BPBD', 'KEPOLISIAN', 'POLISI'];
                                const getIdx = (nama: string) => {
                                    const n = nama.toUpperCase();
                                    return order.findIndex(o => n.includes(o));
                                };
                                const idxA = getIdx(a.nama);
                                const idxB = getIdx(b.nama);
                                return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
                            })
                            .map((dinasItem) => (
                                <TouchableOpacity
                                    key={dinasItem.id}
                                    style={[
                                        styles.dinasItem,
                                        selectedDinas?.id === dinasItem.id && styles.dinasItemSelected
                                    ]}
                                    onPress={() => setSelectedDinas(dinasItem)}
                                >
                                    <Icon
                                        name={getDinasIcon(dinasItem.nama)}
                                        size={20}
                                        color={selectedDinas?.id === dinasItem.id ? '#FFF' : '#64748B'}
                                    />
                                    <Text style={[
                                        styles.dinasText,
                                        selectedDinas?.id === dinasItem.id && styles.dinasTextSelected
                                    ]}>
                                        {dinasItem.nama}
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

            {/* Success Modal - Like Gojek Order Confirmation */}
            <Modal
                visible={showSuccessModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowSuccessModal(false)}
            >
                <View style={styles.successModalOverlay}>
                    <View style={styles.successModalContainer}>
                        {/* Animated Checkmark Icon */}
                        <View style={styles.successIconCircle}>
                            <View style={styles.successIconInner}>
                                <Icon name="checkmark" size={48} color="#FFF" />
                            </View>
                        </View>

                        <Text style={styles.successModalTitle}>Laporan Terkirim!</Text>
                        <Text style={styles.successModalMessage}>
                            Bantuan akan segera datang. Tim kami telah menerima lokasi dan laporan Anda.
                        </Text>

                        {/* Service Info */}
                        {selectedDinas?.nama && (
                            <View style={styles.successServiceBadge}>
                                <Icon name="business" size={16} color="#2563EB" />
                                <Text style={styles.successServiceText}>{selectedDinas.nama}</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.successModalBtn}
                            onPress={() => setShowSuccessModal(false)}
                        >
                            <Text style={styles.successModalBtnText}>Lihat Status Laporan</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    locationBadge: {},
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
        fontFamily: 'monospace',
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
    // Status Card Styles
    statusCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    reportId: {
        fontSize: 12,
        color: '#64748B',
        fontFamily: 'monospace',
    },
    reportDate: {
        fontSize: 12,
        color: '#94A3B8',
    },
    // Timeline Styles
    timeline: {
        marginTop: 8,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 20,
        position: 'relative',
    },
    timelineLine: {
        position: 'absolute',
        left: 15,
        top: 36,
        bottom: -20,
        width: 2,
        backgroundColor: '#E2E8F0',
    },
    timelineLineCompleted: {
        backgroundColor: '#10B981',
    },
    timelineIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        zIndex: 1,
    },
    timelineIconCompleted: {
        backgroundColor: '#10B981',
    },
    timelineIconActive: {
        backgroundColor: '#2563EB',
    },
    timelineContent: {
        flex: 1,
        paddingTop: 4,
    },
    timelineLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#94A3B8',
        marginBottom: 2,
    },
    timelineLabelActive: {
        color: '#0F172A',
    },
    timelineDesc: {
        fontSize: 12,
        color: '#64748B',
        lineHeight: 18,
    },
    activePulse: {
        marginTop: 6,
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    activePulseText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#2563EB',
    },
    // Detail Styles
    detailRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    detailIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 11,
        color: '#94A3B8',
        marginBottom: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailValue: {
        fontSize: 14,
        color: '#0F172A',
        lineHeight: 20,
    },
    photoContainer: {
        marginTop: 8,
    },
    photoLabel: {
        fontSize: 11,
        color: '#94A3B8',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    photoImage: {
        width: '100%',
        height: 180,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
    },
    contactInfo: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 20,
    },
    contactNumber: {
        fontWeight: '700',
        color: '#EF4444',
    },
    completeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        backgroundColor: '#D1FAE5',
        borderRadius: 12,
        marginTop: 8,
    },
    completeBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#065F46',
    },
    completeHint: {
        fontSize: 11,
        color: '#94A3B8',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 16,
    },
    // Success Modal Styles
    successModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    successModalContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 32,
        width: '100%',
        maxWidth: 320,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    successIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#DCFCE7',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    successIconInner: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    successModalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 12,
        textAlign: 'center',
    },
    successModalMessage: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 20,
    },
    successServiceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 24,
        marginBottom: 24,
        gap: 8,
    },
    successServiceText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2563EB',
    },
    successModalBtn: {
        width: '100%',
        backgroundColor: '#2563EB',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    successModalBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});

