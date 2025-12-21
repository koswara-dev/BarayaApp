import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, StatusBar, ActivityIndicator, Alert, Platform, Image, RefreshControl, Vibration, Modal, Animated, Linking } from 'react-native';
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
import { LogBox } from 'react-native';

// Ignore specific and common warnings
LogBox.ignoreLogs([
    'location cancelled',
    'EventEmitter.removeListener',
    'Non-serializable values were found in the navigation state',
]);

const EMERGENCY_TYPES = [
    { key: 'DAMKAR', label: 'DAMKAR', icon: 'flame-outline', searchKeywords: ['DAMKAR', 'PEMADAM', 'KEBAKARAN'] },
    { key: 'AMBULANCE', label: 'AMBULANCE', icon: 'medical-outline', searchKeywords: ['AMBULANS', 'RSU', 'KESEHATAN'] },
    { key: 'BENCANA', label: 'BENCANA', icon: 'warning-outline', searchKeywords: ['BPBD', 'BENCANA', 'BANJIR'] },
    { key: 'POLISI', label: 'POLISI', icon: 'shield-checkmark-outline', searchKeywords: ['POLISI', 'KEPOLISIAN', 'KEAMANAN'] },
];

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
    const [showLocModal, setShowLocModal] = useState(false);

    // Map static emergency types to real backend dinas data
    const mappedEmergencyOptions = React.useMemo(() => {
        return EMERGENCY_TYPES.map(type => {
            // Find matching dinas from API list based on keywords
            const matchedDinas = dinasList.find(d =>
                type.searchKeywords.some(keyword => d.nama.toUpperCase().includes(keyword))
            );
            return {
                ...type,
                backendDinas: matchedDinas // This contains id, nama, etc. from backend
            };
        });
    }, [dinasList]);

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
                // Jangan tampilkan alert jika dibatalkan oleh request lain (sering terjadi saat pindah screen)
                if (error.code !== 'CANCELLED' && !error.message?.includes('cancelled')) {
                    Alert.alert('Gagal', 'Gagal mendapatkan lokasi GPS: ' + error.message);
                }
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
            showToast('Laporan Anda telah berhasil diterima', 'success');

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
            showToast('Laporan dan notifikasi telah dikirimkan secara luas', 'success');
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
            case 'pending': return { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' };
            case 'diterima': return { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' };
            case 'diproses': return { bg: '#FEF9C3', text: '#854D0E', dot: '#EAB308' };
            case 'selesai': return { bg: '#DCFCE7', text: '#166534', dot: '#22C55E' };
            case 'dibatalkan': return { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' };
            default: return { bg: '#F1F5F9', text: '#64748B', dot: '#94A3B8' };
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

    const handleLocationActions = () => {
        setShowLocModal(true);
    };

    const navigateToMap = () => {
        setShowLocModal(false);
        if (activeReport) {
            navigation.navigate('MapEmergency', {
                viewMode: true,
                initialLocation: { lat: activeReport.latitude, lng: activeReport.longitude }
            });
        }
    };

    const navigateToGoogleMaps = () => {
        setShowLocModal(false);
        if (activeReport) {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${activeReport.latitude},${activeReport.longitude}`;
            Linking.openURL(url).catch(() => {
                showToast('Gagal membuka Google Maps', 'error');
            });
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
                <View style={[styles.header, { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                        <Icon name="arrow-back" size={24} color="#0F172A" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>DETAIL LAPORAN</Text>
                    <TouchableOpacity onPress={() => { }} style={styles.headerBtn}>
                        <Icon name="share-social-outline" size={24} color="#0F172A" />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    {/* Status Card - Modern Detail */}
                    <View style={styles.statusDetailCard}>
                        <View style={styles.statusDetailLeft}>
                            <Text style={styles.statusDetailLabel}>ID LAPORAN</Text>
                            <Text style={styles.statusDetailId}>#EMG-{activeReport.id.toString().toUpperCase()}</Text>
                            <View style={styles.statusDetailDateRow}>
                                <Icon name="calendar-outline" size={14} color="#94A3B8" />
                                <Text style={styles.statusDetailDate}>{formatDate(activeReport.createdAt)}</Text>
                            </View>
                        </View>
                        <View style={[styles.statusDetailBadge, { backgroundColor: statusColors.bg }]}>
                            <View style={[styles.statusDotCircular, { backgroundColor: statusColors.dot }]} />
                            <Text style={[styles.statusDetailBadgeText, { color: statusColors.text }]}>
                                {getStatusLabel(activeReport.status).toUpperCase()}
                            </Text>
                        </View>
                    </View>

                    {/* Tracking Timeline - Modernized Design */}
                    <View style={styles.trackingCardFlat}>
                        <View style={styles.trackingCardHeaderFlat}>
                            <View style={styles.trackingHeaderStripeYellow} />
                            <Text style={styles.trackingCardTitleFlat}>STATUS PELACAKAN</Text>
                        </View>

                        <View style={styles.timelineModern}>
                            {trackingSteps.map((step, index) => {
                                const isLast = index === trackingSteps.length - 1;
                                const timeStr = step.timestamp ? new Date(step.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--';

                                // Format description to include dinasNama if it's the diproses step
                                let description = step.description;
                                if (step.status === 'diproses' && activeReport.dinasNama) {
                                    description = `Tim ${activeReport.dinasNama} sedang melakukan verifikasi dan persiapan unit menuju lokasi.`;
                                }

                                return (
                                    <View key={step.status} style={styles.timelineItemModern}>
                                        {/* Vertical Line */}
                                        {!isLast && (
                                            <View style={[
                                                styles.timelineLineModern,
                                                step.isCompleted && { backgroundColor: '#10B981' }
                                            ]} />
                                        )}

                                        {/* Icon Circle */}
                                        <View style={[
                                            styles.timelineIconModern,
                                            step.isCompleted && styles.timelineIconCompletedModern,
                                            step.isActive && styles.timelineIconActiveModern
                                        ]}>
                                            <Icon
                                                name={step.isCompleted ? 'checkmark' : step.icon + (step.icon.includes('-outline') ? '' : '-outline')}
                                                size={16}
                                                color={step.isCompleted ? '#FFF' : step.isActive ? '#EAB308' : '#94A3B8'}
                                            />
                                        </View>

                                        {/* Content Block */}
                                        <View style={styles.timelineContentModern}>
                                            <View style={styles.timelineHeaderRow}>
                                                <Text style={[
                                                    styles.timelineLabelModern,
                                                    (step.isCompleted || step.isActive) && styles.timelineLabelActiveModern
                                                ]}>
                                                    {step.label}
                                                </Text>
                                                <Text style={styles.timelineTimeModern}>{timeStr}</Text>
                                            </View>

                                            {step.isActive ? (
                                                <View style={styles.activeDescBox}>
                                                    <View style={styles.activeDescStripe} />
                                                    <Text style={styles.activeDescText}>{description}</Text>
                                                </View>
                                            ) : (
                                                <Text style={[
                                                    styles.timelineDescModern,
                                                    step.isCompleted && { color: '#64748B' }
                                                ]}>
                                                    {description}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    {/* Report Details - Professional Info Design */}
                    <View style={styles.detailSectionContainer}>
                        {/* Dinas Terkait */}
                        {activeReport.dinasNama && (
                            <View style={styles.detailBlock}>
                                <Text style={styles.detailSectionLabel}>DINAS TERKAIT</Text>
                                <View style={styles.dinasInfoBox}>
                                    <View style={styles.dinasIconCircle}>
                                        <Icon name="business" size={24} color="#3B82F6" />
                                    </View>
                                    <View style={styles.dinasTextContainer}>
                                        <Text style={styles.dinasNameText}>{activeReport.dinasNama.toUpperCase()}</Text>
                                        <Text style={styles.dinasDescText}>Unit Reaksi Cepat Penanganan Darurat</Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Reporter & Phone */}
                        <View style={styles.reporterRow}>
                            <View style={styles.reporterCol}>
                                <Text style={styles.detailSectionLabelMini}>PELAPOR</Text>
                                <Text style={styles.reporterValueText}>{activeReport.fullName}</Text>
                            </View>
                            <View style={styles.verticalDivider} />
                            <View style={styles.reporterCol}>
                                <Text style={styles.detailSectionLabelMini}>TELEPON</Text>
                                <View style={styles.phoneValueRow}>
                                    <Text style={styles.reporterValueText}>{activeReport.phoneNumber}</Text>
                                    <Icon name="checkmark-circle" size={16} color="#10B981" />
                                </View>
                            </View>
                        </View>

                        {/* Lokasi Kejadian */}
                        <View style={styles.detailBlock}>
                            <View style={styles.locationHeaderRowDetail}>
                                <Text style={styles.detailSectionLabel}>LOKASI KEJADIAN</Text>
                            </View>
                            <View style={styles.locationDetailBox}>
                                {/* Map Background Style */}
                                <View style={styles.mapBgPlaceholder}>
                                    <View style={styles.mapGridLineH} />
                                    <View style={[styles.mapGridLineH, { top: '60%' }]} />
                                    <View style={styles.mapGridLineV} />
                                    <View style={[styles.mapGridLineV, { left: '70%', top: -20, height: 180, transform: [{ rotate: '15deg' }] }]} />

                                    {/* Pulse Effect */}
                                    <View style={styles.pulseContainer}>
                                        <View style={styles.pulseDot} />
                                        <View style={styles.pulseRing} />
                                    </View>
                                </View>

                                <View style={styles.locationOverlayCenter}>
                                    <TouchableOpacity style={styles.detailMapBtn} onPress={handleLocationActions}>
                                        <Text style={styles.detailMapBtnText}>LIHAT DETAIL LOKASI</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.locationInfoBar}>
                                    <View style={styles.locationIconPinSmall}>
                                        <Icon name="location" size={14} color="#EF4444" />
                                    </View>
                                    <Text style={styles.locationCoordsSmall}>
                                        {activeReport.latitude?.toFixed(5)}, {activeReport.longitude?.toFixed(5)}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Pesan Laporan */}
                        <View style={styles.detailBlock}>
                            <Text style={styles.detailSectionLabel}>PESAN LAPORAN</Text>
                            <View style={styles.pesanQuoteBox}>
                                <View style={styles.pesanQuoteStripe} />
                                <Text style={styles.pesanQuoteText}>
                                    "{activeReport.pesan}"
                                </Text>
                            </View>
                        </View>

                        {activeReport.urlFoto && (
                            <View style={styles.detailBlock}>
                                <Text style={styles.detailSectionLabel}>BUKTI FOTO</Text>
                                <View style={styles.photoEvidenceWrapper}>
                                    <Image
                                        source={{ uri: getImageUrl(activeReport.urlFoto) }}
                                        style={styles.detailPhotoImageModern}
                                        resizeMode="cover"
                                    />
                                    <View style={styles.photoOverlayGradient}>
                                        <Icon name="camera" size={16} color="#FFF" />
                                        <Text style={styles.photoFilenameText}>
                                            Lampiran_{activeReport.id.toString().padStart(3, '0')}.jpg
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Contact Officer Action */}
                    <View style={styles.actionSectionOuter}>
                        <TouchableOpacity
                            style={styles.hubungiPetugasBtn}
                            onPress={() => Alert.alert('Hubungi Petugas', 'Menghubungi petugas dinas terkait...')}
                        >
                            <View style={styles.hubungiPetugasInner}>
                                <Icon name="call" size={20} color="#FFF" />
                                <Text style={styles.hubungiPetugasText}>HUBUNGI PETUGAS</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Complete Action */}
                    <TouchableOpacity style={styles.completeBtnFlat} onPress={handleCompleteReport}>
                        <Icon name="checkbox" size={20} color="#FFF" />
                        <Text style={styles.completeBtnTextFlat}>LAPORAN SELESAI / TERATASI</Text>
                    </TouchableOpacity>

                    <Text style={styles.completeHintFlat}>
                        Gunakan tombol di atas jika situasi sudah kondusif untuk menutup laporan ini.
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
                {/* Action Choice Modal (Navigation) */}
                <Modal
                    visible={showLocModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowLocModal(false)}
                >
                    <View style={styles.actionModalOverlay}>
                        <View style={styles.actionModalContainer}>
                            <Text style={styles.actionModalTitle}>NAVIGASI LOKASI</Text>
                            <Text style={styles.actionModalMsg}>Pilih metode untuk menjangkau lokasi kejadian.</Text>

                            <TouchableOpacity style={styles.actionBtnPrimary} onPress={navigateToMap}>
                                <Icon name="map-outline" size={20} color="#FFF" />
                                <Text style={styles.actionBtnText}>LIHAT DI PETA APLIKASI</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionBtnSecondary} onPress={navigateToGoogleMaps}>
                                <Icon name="navigate-outline" size={20} color="#0F172A" />
                                <Text style={styles.actionBtnTextDark}>BUKA RUTE GOOGLE MAPS</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionBtnCancel} onPress={() => setShowLocModal(false)}>
                                <Text style={styles.actionBtnTextCancel}>BATAL</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </View>
        );
    }

    // --- RENDER FORM VIEW ---
    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>PELAPORAN DARURAT</Text>
                <TouchableOpacity onPress={() => showToast("Fitur Riwayat Segera Hadir", "info")} style={styles.headerBtn}>
                    <Icon name="time-outline" size={26} color="#0F172A" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {/* Detected Location Card (Clickable to Edit) */}
                <TouchableOpacity style={styles.locationContainer} onPress={handleManualLocation}>
                    <View style={styles.locationFlatBox}>
                        <View style={styles.locationLeftLine} />
                        <View style={styles.locationInfo}>
                            <View style={styles.locationHeaderRow}>
                                <Icon name="location" size={16} color="#E11D48" />
                                <Text style={styles.locationLabel}>LOKASI KEJADIAN (TAP UNTUK EDIT)</Text>
                            </View>
                            <Text style={styles.addressLine} numberOfLines={1}>
                                {location.address}
                            </Text>
                            <View style={styles.accuracyRow}>
                                <Text style={styles.accuracyLine}>
                                    {location.lat.toFixed(5)}, {location.long.toFixed(5)}
                                </Text>
                                <View style={styles.dotSeparator} />
                                <Text style={styles.accuracyHint}>Geser pin untuk akurasi</Text>
                            </View>
                        </View>
                        <Icon name="chevron-forward" size={18} color="#94A3B8" />
                    </View>
                </TouchableOpacity>

                {/* Emergency Category */}
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionStripe} />
                    <Text style={styles.sectionTitle}>KATEGORI DARURAT</Text>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryScrollContent}
                    style={styles.categoryScroll}
                >
                    {mappedEmergencyOptions.map((option) => (
                        <TouchableOpacity
                            key={option.key}
                            style={[
                                styles.categoryCardSmall,
                                selectedDinas?.id === option.backendDinas?.id && styles.categoryCardSelected
                            ]}
                            onPress={() => {
                                if (option.backendDinas) {
                                    setSelectedDinas(option.backendDinas);
                                } else {
                                    showToast(`Layanan ${option.label} belum tersedia`, 'info');
                                }
                            }}
                        >
                            <View style={[
                                styles.categoryIconSmall,
                                selectedDinas?.id === option.backendDinas?.id && styles.categoryIconSelected
                            ]}>
                                <Icon
                                    name={option.icon}
                                    size={28}
                                    color={selectedDinas?.id === option.backendDinas?.id ? '#FFF' : '#94A3B8'}
                                />
                            </View>
                            <Text style={[
                                styles.categoryLabelSmall,
                                selectedDinas?.id === option.backendDinas?.id && styles.categoryLabelSelected
                            ]}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Message Input */}
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionStripe} />
                    <Text style={styles.sectionTitle}>DESKRIPSI DARURAT (WAJIB)</Text>
                </View>

                <View style={styles.messageBox}>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Jelaskan situasi darurat secara singkat..."
                        placeholderTextColor="#94A3B8"
                        multiline
                        maxLength={200}
                        value={message}
                        onChangeText={setMessage}
                        textAlignVertical="top"
                    />
                    <Text style={styles.charCounter}>{message.length}/200</Text>
                </View>

                {/* Photo Section */}
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionStripe} />
                    <Text style={styles.sectionTitle}>FOTO KEJADIAN (OPSIONAL)</Text>
                </View>

                <View style={styles.photoContainer}>
                    {photo ? (
                        <View style={styles.photoPreviewBox}>
                            <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
                            <TouchableOpacity style={styles.removePhotoBtn} onPress={removePhoto}>
                                <Icon name="close-circle" size={28} color="#E11D48" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.photoBtnRow}>
                            <TouchableOpacity style={styles.photoInputBtn} onPress={handleCamera}>
                                <Icon name="camera-outline" size={28} color="#64748B" />
                                <Text style={styles.photoBtnText}>Kamera</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.photoInputBtn} onPress={handleGallery}>
                                <Icon name="images-outline" size={28} color="#64748B" />
                                <Text style={styles.photoBtnText}>Galeri</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* SOS Button */}
                <TouchableOpacity
                    style={[styles.sosBtn, (!selectedDinas || !message.trim() || loading) && styles.sosDisabled]}
                    onPress={handleSubmit}
                    disabled={!selectedDinas || !message.trim() || loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <View style={styles.sosInner}>
                            <View style={styles.sosRow}>
                                <Text style={styles.sosSymbol}>SOS</Text>
                                <Text style={styles.sosMainText}>LAPORKAN DARURAT</Text>
                            </View>
                            <Text style={styles.sosSubText}>BANTUAN AKAN SEGERA DIKIRIM</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <Text style={styles.bottomDisclaimer}>
                    Dengan menekan tombol di atas, Anda menyetujui pengiriman data lokasi terkini kepada petugas terkait.
                </Text>

            </ScrollView>

            {/* Success Modal */}
            <Modal
                visible={showSuccessModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowSuccessModal(false)}
            >
                <View style={styles.successModalOverlay}>
                    <View style={styles.successModalContainer}>
                        <View style={styles.successIconCircle}>
                            <View style={styles.successIconInner}>
                                <Icon name="checkmark" size={48} color="#FFF" />
                            </View>
                        </View>
                        <Text style={styles.successModalTitle}>Laporan Terkirim!</Text>
                        <Text style={styles.successModalMessage}>
                            Bantuan akan segera datang. Tim kami telah menerima lokasi dan laporan Anda.
                        </Text>
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
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerBtn: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: 0.5,
    },
    content: {
        flex: 1,
    },
    locationContainer: {
        padding: 16,
    },
    locationFlatBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 0,
        paddingVertical: 18,
        paddingHorizontal: 20,
        position: 'relative',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    locationLeftLine: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        backgroundColor: '#E11D48',
    },
    locationHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    locationInfo: {
        flex: 1,
    },
    locationLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#E11D48',
        letterSpacing: 0.8,
    },
    addressLine: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 6,
    },
    accuracyRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    accuracyLine: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
    },
    dotSeparator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E2E8F0',
        marginHorizontal: 8,
    },
    accuracyHint: {
        fontSize: 12,
        color: '#94A3B8',
    },
    checkIconBox: {
        marginLeft: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginTop: 16,
        marginBottom: 16,
    },
    sectionStripe: {
        width: 4,
        height: 18,
        backgroundColor: '#FFB800',
        borderRadius: 2,
        marginRight: 10,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: 0.5,
    },
    categoryScroll: {
        maxHeight: 120,
    },
    categoryScrollContent: {
        paddingHorizontal: 16,
        gap: 12,
        paddingBottom: 8,
    },
    categoryCardSmall: {
        width: 100,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    categoryCardSelected: {
        borderColor: '#FFB800',
        backgroundColor: '#FFFBEB',
    },
    categoryIconSmall: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    categoryIconSelected: {
        backgroundColor: '#FFB800',
    },
    categoryLabelSmall: {
        fontSize: 11,
        fontWeight: '900',
        color: '#64748B',
        textAlign: 'center',
        letterSpacing: 0.2,
    },
    categoryLabelSelected: {
        color: '#FFB800',
    },
    messageBox: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    textInput: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
        padding: 16,
        minHeight: 120,
        fontSize: 14,
        color: '#0F172A',
        textAlignVertical: 'top',
    },
    charCounter: {
        textAlign: 'right',
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 6,
    },
    photoContainer: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    photoBtnRow: {
        flexDirection: 'row',
        gap: 12,
    },
    photoInputBtn: {
        flex: 1,
        height: 80,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
        borderStyle: 'dashed',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    photoBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
    },
    photoPreviewBox: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#F1F5F9',
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
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
    },
    sosBtn: {
        marginHorizontal: 16,
        backgroundColor: '#E11D48',
        borderRadius: 8,
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: '#E11D48',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 12,
    },
    sosDisabled: {
        backgroundColor: '#94A3B8',
        shadowOpacity: 0,
        elevation: 0,
    },
    sosInner: {
        alignItems: 'center',
    },
    sosRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    sosSymbol: {
        fontSize: 22,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.4)',
        marginRight: 10,
    },
    sosMainText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    sosSubText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    bottomDisclaimer: {
        fontSize: 12,
        color: '#94A3B8',
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 20,
        paddingHorizontal: 40,
        lineHeight: 18,
    },
    // Tracking View - Flat Industrial Styles
    trackingStatusCardFlat: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        marginBottom: 1, // Minimalist gap
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    trackingStatusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    trackingStatusBadgeFlat: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    trackingStatusBadgeText: {
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    trackingReportId: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '700',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    trackingReportDate: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '600',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 0,
    },
    trackingCardFlat: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    trackingCardHeaderFlat: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 12,
    },
    trackingHeaderStripe: {
        width: 3,
        height: 16,
        backgroundColor: '#E11D48',
    },
    trackingCardTitleFlat: {
        fontSize: 12,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: 1,
    },
    timelineFlat: {
        paddingLeft: 4,
    },
    timelineItemFlat: {
        flexDirection: 'row',
        marginBottom: 30,
        position: 'relative',
    },
    activeStatusText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#E11D48',
    },
    trackingHeaderStripeYellow: {
        width: 3,
        height: 16,
        backgroundColor: '#FFB800',
    },
    timelineModern: {
        paddingLeft: 4,
    },
    timelineItemModern: {
        flexDirection: 'row',
        marginBottom: 24,
        position: 'relative',
    },
    timelineLineModern: {
        position: 'absolute',
        left: 14,
        top: 28,
        bottom: -24,
        width: 2,
        backgroundColor: '#F1F5F9',
    },
    timelineIconModern: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        zIndex: 1,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    timelineIconCompletedModern: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
    },
    timelineIconActiveModern: {
        backgroundColor: '#FFFFFF',
        borderColor: '#FFB800',
        borderWidth: 2,
    },
    timelineContentModern: {
        flex: 1,
    },
    timelineHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    timelineLabelModern: {
        fontSize: 14,
        fontWeight: '800',
        color: '#94A3B8',
    },
    timelineLabelActiveModern: {
        color: '#1E293B',
    },
    timelineTimeModern: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    },
    timelineDescModern: {
        fontSize: 13,
        color: '#94A3B8',
        lineHeight: 20,
    },
    activeDescBox: {
        backgroundColor: '#FFFBEB',
        padding: 12,
        borderRadius: 4,
        marginTop: 4,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    activeDescStripe: {
        width: 3,
        backgroundColor: '#FFB800',
        position: 'absolute',
        left: 0,
        top: 10,
        bottom: 10,
    },
    activeDescText: {
        fontSize: 13,
        color: '#475569',
        lineHeight: 20,
        marginLeft: 8,
    },
    detailSectionContainer: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        marginBottom: 20,
    },
    detailBlock: {
        marginBottom: 24,
    },
    detailSectionLabel: {
        fontSize: 11,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1,
        marginBottom: 12,
    },
    detailSectionLabelMini: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1,
        marginBottom: 8,
    },
    dinasInfoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        backgroundColor: '#FFFFFF',
    },
    dinasIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 4,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    dinasTextContainer: {
        flex: 1,
    },
    dinasNameText: {
        fontSize: 15,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 2,
    },
    dinasDescText: {
        fontSize: 12,
        color: '#64748B',
    },
    reporterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    reporterCol: {
        flex: 1,
    },
    verticalDivider: {
        width: 1,
        height: 30,
        backgroundColor: '#F1F5F9',
        marginHorizontal: 16,
    },
    reporterValueText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
    },
    phoneValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    locationDetailBox: {
        height: 180,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        position: 'relative',
        overflow: 'hidden',
    },
    mapBgPlaceholder: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#F8FAFC',
    },
    mapGridLineH: {
        position: 'absolute',
        top: '30%',
        left: 0,
        right: 0,
        height: 15,
        backgroundColor: '#F1F5F9',
        transform: [{ rotate: '-2deg' }],
    },
    mapGridLineV: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: '25%',
        width: 15,
        backgroundColor: '#F1F5F9',
        transform: [{ rotate: '5deg' }],
    },
    pulseContainer: {
        position: 'absolute',
        top: '40%',
        left: '60%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pulseDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#EF4444',
    },
    pulseRing: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    locationOverlayCenter: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailMapBtn: {
        backgroundColor: '#0F172A',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 0,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    detailMapBtnText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1,
    },
    locationInfoBar: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        backgroundColor: 'rgba(255,255,255,0.95)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    locationIconPinSmall: {
        marginRight: 6,
    },
    locationCoordsSmall: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748B',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    actionModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    actionModalContainer: {
        backgroundColor: '#FFFFFF',
        width: '100%',
        padding: 24,
        borderRadius: 0,
        alignItems: 'center',
    },
    actionModalTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    actionModalMsg: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 18,
    },
    actionBtnPrimary: {
        width: '100%',
        backgroundColor: '#E11D48',
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 12,
    },
    actionBtnSecondary: {
        width: '100%',
        backgroundColor: '#F1F5F9',
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 20,
    },
    actionBtnCancel: {
        width: '100%',
        paddingVertical: 12,
        alignItems: 'center',
    },
    actionBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    actionBtnTextDark: {
        color: '#0F172A',
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    actionBtnTextCancel: {
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: '800',
    },
    pesanQuoteBox: {
        backgroundColor: '#F8FAFC',
        padding: 20,
        position: 'relative',
    },
    pesanQuoteStripe: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        backgroundColor: '#CBD5E1',
    },
    pesanQuoteText: {
        fontSize: 16,
        color: '#475569',
        fontStyle: 'italic',
        lineHeight: 26,
        fontWeight: '500',
    },
    detailPhotoImageModern: {
        width: '100%',
        height: 220,
        backgroundColor: '#F8FAFC',
    },
    locationHeaderRowDetail: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    viewMapText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#3B82F6',
        letterSpacing: 0.5,
    },
    photoEvidenceWrapper: {
        position: 'relative',
        borderRadius: 4,
        overflow: 'hidden',
    },
    photoOverlayGradient: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    photoFilenameText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    actionSectionOuter: {
        paddingHorizontal: 16,
        marginTop: 8,
        marginBottom: 16,
    },
    hubungiPetugasBtn: {
        backgroundColor: '#0F172A',
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 2, // Sharp but slight rounding
        // More subtle, premium shadow
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 3,
    },
    hubungiPetugasInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    hubungiPetugasText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '900',
        letterSpacing: 1,
    },
    contactIconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    contactTitleFlat: {
        fontSize: 12,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: 0.5,
    },
    emergencyCallBtnFlat: {
        backgroundColor: '#1E293B',
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emergencyCallTextFlat: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 1,
    },
    completeBtnFlat: {
        marginHorizontal: 16,
        backgroundColor: '#E11D48',
        paddingVertical: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginTop: 10,
        elevation: 4,
    },
    completeBtnTextFlat: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1,
    },
    completeHintFlat: {
        fontSize: 11,
        color: '#94A3B8',
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 16,
        paddingHorizontal: 40,
    },
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
    statusDetailCard: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    statusDetailLeft: {
        flex: 1,
    },
    statusDetailLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94A3B8',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    statusDetailId: {
        fontSize: 22,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 8,
    },
    statusDetailDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusDetailDate: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
    },
    statusDetailBadge: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: 4,
    },
    statusDetailBadgeText: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    statusDotCircular: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
});

