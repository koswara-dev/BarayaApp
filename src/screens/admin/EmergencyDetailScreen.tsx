import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, StatusBar, ActivityIndicator, Alert, Platform, Linking, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation } from '@react-navigation/native';
import api, { getImageUrl } from '../../config/api';
import useEmergencyStore, { EmergencyReport, EmergencyStatus } from '../../stores/emergencyStore';
import useToastStore from '../../stores/toastStore';
import useAuthStore from '../../stores/authStore';
import { Role } from '../../types/auth';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { PermissionsAndroid } from 'react-native';

const STATUS_COLORS: Record<string, string> = {
    pending: '#94A3B8',
    diterima: '#F59E0B',
    diproses: '#3B82F6',
    selesai: '#10B981',
    dibatalkan: '#EF4444'
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

export default function EmergencyDetailScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { report } = route.params || {};
    const [updating, setUpdating] = useState(false);
    
    // State for handling fetch
    const [fetchedReport, setFetchedReport] = useState<EmergencyReport | null>(null);
    const [loading, setLoading] = useState(false);

    const { updateReportStatus, reports } = useEmergencyStore();
    const showToast = useToastStore(state => state.showToast);
    const userRole = useAuthStore(state => state.user?.role);
    const currentUser = useAuthStore(state => state.user);

    // State for finishing report
    const [finishModalVisible, setFinishModalVisible] = useState(false);
    const [resolutionPhoto, setResolutionPhoto] = useState<any>(null);
    const [zoomImage, setZoomImage] = useState<string | null>(null);

    React.useEffect(() => {
        const loadReport = async () => {
             // If we have full report (check common field like status or pesan), done.
             if (report && report.pesan) return;
             
             const reportId = report?.id;
             if (!reportId) return;
             
             setLoading(true);
             
             // Try store
             const storeReport = reports.find(r => String(r.id) === String(reportId));
             if (storeReport) {
                 setFetchedReport(storeReport);
                 setLoading(false);
                 return;
             }
             
             // Fetch via API
             try {
                const res = await api.get(`/darurat/${reportId}`);
                if (res.data.success && res.data.data) {
                    setFetchedReport(res.data.data);
                }
             } catch (err) {
                 console.log("Failed to fetch emergency report", err);
             } finally {
                 setLoading(false);
             }
        };
        loadReport();
    }, [report, reports]);
    
    // Placeholder to be replaced by next step
    const displayReport = fetchedReport || report;

    // Loading State
    if (loading) {
         return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#0F172A" />
            </View>
         );
    }
    
    // For now, let's assume report is passed or we handle null gracefully.
    if (!displayReport || !displayReport.status) {
         return (
             <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                         <Icon name="arrow-back" size={24} color="#0F172A" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Detail Darurat</Text>
                    <View style={{width: 40}} />
                </View>
                <View style={styles.centerContent}>
                    {/* Only show error if we are sure we tried fetching and failed */}
                    {!loading && (
                        <>
                            <Icon name="alert-circle-outline" size={48} color="#94A3B8" />
                            <Text style={styles.errorText}>Data laporan tidak ditemukan</Text>
                        </>
                    )}
                     {/* Auto-fetch in effect will fill this eventually if successful */}
                </View>
             </View>
         );
    }

    const currentReport = displayReport;
    const currentStatus = (currentReport.status || 'pending').toLowerCase();
    const canManage = [Role.ADMIN, Role.STAFF, Role.EXECUTIVE, Role.SUPERADMIN].includes(userRole as Role);

    const isSameDinas = currentUser?.dinasId && currentReport.dinasId && (Number(currentUser.dinasId) === Number(currentReport.dinasId));

    const handleUpdateStatus = async (newStatus: EmergencyStatus) => {
        Alert.alert(
            'Konfirmasi Update',
            `Ubah status menjadi ${newStatus.toUpperCase()}?`,
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Ya, Update',
                    onPress: async () => {
                        setUpdating(true);
                        const success = await updateReportStatus(report.id, newStatus, currentReport);
                        setUpdating(false);
                        if (success) {
                            showToast(`Status berhasil diubah ke ${newStatus}`, 'success');
                            navigation.goBack();
                        } else {
                            showToast('Gagal mengubah status', 'error');
                        }
                    }
                }
            ]
        );
    };

    const handleImagePick = async (type: 'camera' | 'library') => {
        const options: any = {
            mediaType: 'photo',
            quality: 0.8,
            includeBase64: false,
        };

        if (type === 'camera') {
            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                );
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                    Alert.alert('Izin Ditolak', 'Aplikasi membutuhkan izin kamera');
                    return;
                }
            }
            launchCamera(options, (response) => {
                if (response.didCancel) return;
                if (response.errorCode) {
                    Alert.alert('Error', response.errorMessage);
                    return;
                }
                if (response.assets && response.assets.length > 0) {
                    setResolutionPhoto(response.assets[0]);
                }
            });
        } else {
            launchImageLibrary(options, (response) => {
                if (response.didCancel) return;
                if (response.errorCode) {
                    Alert.alert('Error', response.errorMessage);
                    return;
                }
                if (response.assets && response.assets.length > 0) {
                    setResolutionPhoto(response.assets[0]);
                }
            });
        }
    };

    const submitFinishReport = async () => {
        if (!resolutionPhoto) {
            Alert.alert('Foto Wajib', 'Harap lampirkan foto bukti penyelesaian.');
            return;
        }

        setUpdating(true);
        try {
            const extraData = {
                fotoSelesai: resolutionPhoto,
                updatedBy: currentUser?.id,
                updatedByName: currentUser?.fullName
            };
            
            const success = await updateReportStatus(currentReport.id, 'selesai', currentReport, extraData);
            
            if (success) {
                showToast('Laporan berhasil diselesaikan', 'success');
                setFinishModalVisible(false);
                setResolutionPhoto(null);
                // Optionally go back or stay to see the updated status
                navigation.goBack();
            } else {
                showToast('Gagal menyelesaikan laporan', 'error');
            }
        } catch (error) {
            showToast('Terjadi kesalahan', 'error');
        } finally {
            setUpdating(false);
        }
    };


    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detail Laporan Darurat</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Status Banner - Updated to Badge Style */}
                <View style={styles.statusSection}>
                    <View style={[styles.statusBadge, { backgroundColor: STATUS_THEME[currentStatus]?.bg || '#F1F5F9' }]}>
                        <Icon name={STATUS_THEME[currentStatus]?.icon || 'help-circle-outline'} size={20} color={STATUS_THEME[currentStatus]?.text || '#64748B'} />
                        <Text style={[styles.statusText, { color: STATUS_THEME[currentStatus]?.text || '#64748B' }]}>
                            {currentStatus.toUpperCase()}
                        </Text>
                    </View>
                </View>

                {/* Sender Info - Updated Icons & Colors */}
                <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                        <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                             <Icon name="person" size={20} color="#3B82F6" />
                        </View>
                        <Text style={styles.sectionTitle}>Pelapor</Text>
                    </View>
                    <View style={styles.infoContent}>
                        <Text style={styles.senderName}>{currentReport.fullName || currentReport.userNama || 'Anonim'}</Text>
                        <TouchableOpacity onPress={() => {
                            if (currentReport.phoneNumber) {
                                let phone = currentReport.phoneNumber;
                                // Convert 08xxx to 628xxx for WhatsApp
                                if (phone.startsWith('0')) {
                                    phone = '62' + phone.substring(1);
                                }
                                Linking.openURL(`https://wa.me/${phone}`);
                            }
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Icon name="logo-whatsapp" size={16} color="#25D366" />
                                <Text style={[styles.senderPhone, { color: '#25D366', textDecorationLine: 'underline' }]}>
                                    {currentReport.phoneNumber || 'No Phone'}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Location */}
                <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                         <View style={[styles.iconBox, { backgroundColor: '#FEF2F2' }]}>
                             <Icon name="map" size={20} color="#EF4444" />
                        </View>
                        <Text style={styles.sectionTitle}>Lokasi Kejadian</Text>
                    </View>
                    <View style={styles.locationBox}>
                        <Text style={styles.locationText} selectable>{currentReport.latitude}, {currentReport.longitude}</Text>
                    </View>
                     <TouchableOpacity 
                        style={styles.mapBtn}
                        onPress={() => {
                            const url = `https://www.google.com/maps/search/?api=1&query=${currentReport.latitude},${currentReport.longitude}`;
                            Linking.openURL(url);
                        }}
                    >
                        <Text style={styles.mapBtnText}>Buka Google Maps</Text>
                        <Icon name="map" size={16} color="#3B82F6" />
                    </TouchableOpacity>
                </View>

                {/* Message & Photo */}
                <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                         <View style={[styles.iconBox, { backgroundColor: '#FFFBEB' }]}>
                             <Icon name="document-text" size={20} color="#F59E0B" />
                        </View>
                        <Text style={styles.sectionTitle}>Laporan</Text>
                    </View>
                    
                    <View style={styles.quoteBox}>
                        <Text style={styles.messageText}>{currentReport.pesan}</Text>
                    </View>
                    
                    {currentReport.urlFoto ? (
                        <TouchableOpacity 
                            style={styles.imageWrapper}
                            onPress={() => setZoomImage(getImageUrl(currentReport.urlFoto))}
                        >
                            <Image 
                                source={{ uri: getImageUrl(currentReport.urlFoto) }} 
                                style={styles.evidenceImage} 
                                resizeMode="cover" 
                            />
                             <View style={styles.imageBadge}>
                                <Icon name="image" size={12} color="#FFF" />
                                <Text style={styles.imageBadgeText}>Bukti Foto (Ketuk untuk perbesar)</Text>
                            </View>
                        </TouchableOpacity>
                    ) : (
                         <View style={styles.noPhotoBox}>
                             <Icon name="image-outline" size={32} color="#94A3B8" />
                             <Text style={styles.noPhotoText}>Tidak ada foto terlampir</Text>
                         </View>
                    )}
                    <Text style={styles.dateText}>Dilaporkan: {formatDate(currentReport.createdAt)}</Text>

                    {/* Completion Photo */}
                    {currentReport.urlFotoSelesai && (
                        <View style={{ marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
                            <View style={styles.cardHeaderRow}>
                                <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
                                    <Icon name="checkmark-done-circle" size={20} color="#10B981" />
                                </View>
                                <View>
                                    <Text style={styles.sectionTitle}>Penyelesaian</Text>
                                    <Text style={{ fontSize: 12, color: '#64748B' }}>
                                        Oleh: {currentReport.updatedByName || 'Petugas'}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity 
                                style={styles.imageWrapper}
                                onPress={() => setZoomImage(getImageUrl(currentReport.urlFotoSelesai))}
                            >
                                <Image 
                                    source={{ uri: getImageUrl(currentReport.urlFotoSelesai) }} 
                                    style={styles.evidenceImage} 
                                    resizeMode="cover" 
                                />
                                <View style={[styles.imageBadge, { backgroundColor: '#10B981' }]}>
                                    <Icon name="camera" size={12} color="#FFF" />
                                    <Text style={styles.imageBadgeText}>Bukti Selesai</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Admin Actions */}
                {canManage && (
                    <View style={styles.actionCard}>
                        <View style={styles.cardHeaderRow}>
                            <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                                <Icon name="options" size={20} color="#10B981" />
                            </View>
                            <Text style={styles.sectionTitle}>Update Status</Text>
                        </View>
                        
                        {updating ? (
                            <ActivityIndicator size="large" color="#3B82F6" style={{ marginVertical: 20 }} />
                        ) : (
                            <View style={styles.actionGrid}>
                                <TouchableOpacity 
                                    style={[styles.actionBtn, { backgroundColor: '#FFFBEB', borderColor: '#F59E0B' }, currentStatus === 'diterima' && { backgroundColor: '#F59E0B' }]} 
                                    onPress={() => handleUpdateStatus('diterima')}
                                >
                                     <Text style={[styles.actionBtnText, currentStatus !== 'diterima' && { color: '#D97706' }]}>TERIMA</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={[styles.actionBtn, { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' }, currentStatus === 'diproses' && { backgroundColor: '#3B82F6' }]} 
                                    onPress={() => handleUpdateStatus('diproses')}
                                >
                                     <Text style={[styles.actionBtnText, currentStatus !== 'diproses' && { color: '#2563EB' }]}>PROSES</Text>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={[styles.actionBtn, { backgroundColor: '#ECFDF5', borderColor: '#10B981', opacity: isSameDinas ? 1 : 0.5 }, currentStatus === 'selesai' && { backgroundColor: '#10B981' }]} 
                                    onPress={() => {
                                        if (currentStatus !== 'selesai') {
                                            if (isSameDinas) {
                                                setFinishModalVisible(true);
                                            } else {
                                                showToast('Hanya petugas dinas terkait yang dapat menyelesaikan laporan ini', 'error');
                                            }
                                        }
                                    }}
                                >
                                    <Text style={[styles.actionBtnText, currentStatus !== 'selesai' && { color: '#059669' }]}>SELESAI</Text>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={[styles.actionBtn, { backgroundColor: '#FEF2F2', borderColor: '#EF4444' }, currentStatus === 'dibatalkan' && { backgroundColor: '#EF4444' }]} 
                                    onPress={() => handleUpdateStatus('dibatalkan')}
                                >
                                    <Text style={[styles.actionBtnText, currentStatus !== 'dibatalkan' && { color: '#DC2626' }]}>TOLAK</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                <View style={{height: 40}} />
            </ScrollView>

            {/* Finish Report Modal */}
            {finishModalVisible && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Selesaikan Laporan</Text>
                        <Text style={styles.modalSubtitle}>Lampirkan foto bukti penyelesaian tugas</Text>

                        <TouchableOpacity 
                            style={styles.uploadBox} 
                            onPress={() => {
                                Alert.alert(
                                    'Ambil Foto',
                                    'Pilih sumber foto',
                                    [
                                        { text: 'Kamera', onPress: () => handleImagePick('camera') },
                                        { text: 'Galeri', onPress: () => handleImagePick('library') },
                                        { text: 'Batal', style: 'cancel' }
                                    ]
                                );
                            }}
                        >
                            {resolutionPhoto ? (
                                <View>
                                    <Image source={{ uri: resolutionPhoto.uri }} style={styles.uploadPreview} />
                                    <View style={styles.changePhotoBadge}>
                                        <Icon name="camera-reverse" size={16} color="#FFF" />
                                        <Text style={styles.changePhotoText}>Ubah</Text>
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.uploadPlaceholder}>
                                    <Icon name="camera-outline" size={32} color="#94A3B8" />
                                    <Text style={styles.uploadText}>Ketuk untuk ambil foto</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.cancelBtn]} 
                                onPress={() => {
                                    setFinishModalVisible(false);
                                    setResolutionPhoto(null);
                                }}
                                disabled={updating}
                            >
                                <Text style={styles.cancelBtnText}>Batal</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.confirmBtn, !resolutionPhoto && { opacity: 0.5 }]} 
                                onPress={submitFinishReport}
                                disabled={!resolutionPhoto || updating}
                            >
                                {updating ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <Text style={styles.confirmBtnText}>Selesai & Kirim</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* Modal Overlay Background */}
             {finishModalVisible && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100 }]} pointerEvents="none" />
            )}
            {/* Image Zoom Modal */}
            <Modal visible={!!zoomImage} transparent={true} onRequestClose={() => setZoomImage(null)}>
                <View style={styles.zoomContainer}>
                    <TouchableOpacity style={styles.zoomCloseBtn} onPress={() => setZoomImage(null)}>
                        <Icon name="close" size={30} color="#FFF" />
                    </TouchableOpacity>
                    {zoomImage && (
                        <Image 
                            source={{ uri: zoomImage }} 
                            style={styles.zoomImage} 
                            resizeMode="contain" 
                        />
                    )}
                </View>
            </Modal>
        </View>

    );
}

const STATUS_THEME: Record<string, { bg: string; text: string; icon: string }> = {
    pending: { bg: '#F1F5F9', text: '#64748B', icon: 'time-outline' },
    diterima: { bg: '#FFFBEB', text: '#D97706', icon: 'checkmark-circle-outline' },
    diproses: { bg: '#EFF6FF', text: '#2563EB', icon: 'construct-outline' },
    selesai: { bg: '#ECFDF5', text: '#059669', icon: 'checkmark-done-circle-outline' },
    dibatalkan: { bg: '#FEF2F2', text: '#DC2626', icon: 'close-circle-outline' }
};

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
        backgroundColor: '#FFFFFF',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
    },
    content: {
        padding: 16,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        marginTop: 12,
        color: '#64748B',
    },
    // New Styles
    statusSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
    },
    statusText: {
        fontWeight: '800',
        fontSize: 14,
        letterSpacing: 0.5,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
    },
    infoContent: {
        paddingLeft: 42,
    },
    senderName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 2,
    },
    senderPhone: {
        fontSize: 14,
        color: '#64748B',
    },
    locationBox: {
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    locationText: {
        color: '#334155',
        fontWeight: '500',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    mapBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: '#BFDBFE',
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
        gap: 8,
    },
    mapBtnText: {
        color: '#2563EB',
        fontWeight: '600',
    },
    quoteBox: {
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    messageText: {
        fontSize: 15,
        color: '#334155',
        lineHeight: 24,
    },
    imageWrapper: {
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
    },
    evidenceImage: {
        width: '100%',
        height: 220,
        backgroundColor: '#F1F5F9',
    },
    imageBadge: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    imageBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '600',
    },
    noPhotoBox: {
        width: '100%',
        height: 120,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
    },
    noPhotoText: {
        color: '#94A3B8',
        marginTop: 8,
        fontSize: 12,
    },
    dateText: {
        fontSize: 12,
        color: '#94A3B8',
        textAlign: 'right',
        marginTop: 4,
    },
    actionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    actionBtn: {
        flexBasis: '48%',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
    },
    actionBtnText: {
        fontWeight: '700',
        fontSize: 12,
    },
    // Modal Styles
    modalOverlay: {
        position: 'absolute',
        top: 0, 
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 101, // Above the dark overlay
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
        textAlign: 'center',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 20,
    },
    uploadBox: {
        width: '100%',
        height: 180,
        backgroundColor: '#F8FAFC',
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 24,
    },
    uploadPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadText: {
        color: '#94A3B8',
        marginTop: 8,
        fontSize: 14,
        fontWeight: '500',
    },
    uploadPreview: {
        width: '100%',
        height: '100%',
    },
    changePhotoBadge: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    changePhotoText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelBtn: {
        backgroundColor: '#F1F5F9',
    },
    cancelBtnText: {
        color: '#64748B',
        fontWeight: '700',
    },
    confirmBtn: {
        backgroundColor: '#10B981',
    },
    confirmBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    // Zoom Styles
    zoomContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    zoomImage: {
        width: '100%',
        height: '100%',
    },
    zoomCloseBtn: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 20,
        right: 20,
        zIndex: 10,
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 25,
    },
});
