import React, { useEffect, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Platform,
    Image,
    Animated,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import useEmergencyStore from '../stores/emergencyStore';
import { getImageUrl } from '../config/api';
import { navigate } from '../navigation/navigationRef';
import { playEmergencySound, stopSound } from '../utils/soundPlayer';

const { width } = Dimensions.get('window');

const GlobalEmergencyModal = () => {
    const { showEmergencyModal, modalData, setModalVisible, loading } = useEmergencyStore();
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const flashAnim = useRef(new Animated.Value(0)).current;
    const stripeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (showEmergencyModal) {
            // Pulsing icon animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.25,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            // Flashing background for warning text
            Animated.loop(
                Animated.sequence([
                    Animated.timing(flashAnim, {
                        toValue: 1,
                        duration: 600,
                        useNativeDriver: false,
                    }),
                    Animated.timing(flashAnim, {
                        toValue: 0,
                        duration: 600,
                        useNativeDriver: false,
                    }),
                ])
            ).start();

            // Sliding hazard stripes animation
            Animated.loop(
                Animated.timing(stripeAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                })
            ).start();

            // Play emergency alarm sound
            playEmergencySound();
        } else {
            // Stop sound if modal is hidden
            stopSound();
        }

        // Cleanup on unmount
        return () => stopSound();
    }, [showEmergencyModal]);

    if (!showEmergencyModal) return null;

    const imageUrl = modalData?.urlFoto ? getImageUrl(modalData.urlFoto) : null;

    const openMap = () => {
        if (!modalData) return;
        const lat = Number(modalData.latitude);
        const lng = Number(modalData.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
            setModalVisible(false);
            setTimeout(() => {
                navigate('MapEmergency', {
                    viewMode: true,
                    initialLocation: { lat, lng }
                } as any);
            }, 300);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'pending': return { label: 'MENUNGGU RESPON', color: '#F59E0B', icon: 'time' };
            case 'diterima': return { label: 'DITERIMA SISTEM', color: '#3B82F6', icon: 'business' };
            case 'diproses': return { label: 'SEDANG DITANGANI', color: '#8B5CF6', icon: 'flash' };
            case 'selesai': return { label: 'SUDAH TERATASI', color: '#10B981', icon: 'checkmark-done' };
            case 'dibatalkan': return { label: 'LAPORAN DIBATALKAN', color: '#EF4444', icon: 'close-circle' };
            default: return { label: status?.toUpperCase() || 'UNKNOWN', color: '#64748B', icon: 'help-circle' };
        }
    };

    const statusInfo = getStatusInfo(modalData?.status || 'pending');

    const flashColor = flashAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['#EF4444', '#991B1B']
    });

    const stripeTranslate = stripeAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -80]
    });

    return (
        <Modal
            transparent
            visible={showEmergencyModal}
            animationType="fade"
            onRequestClose={() => setModalVisible(false)}
        >
            <View style={styles.overlay}>
                {/* Background Shadow Overlay */}
                <View style={StyleSheet.absoluteFillObject}>
                    <View style={styles.darkOverlay} />
                </View>

                {/* Animated Hazard Background (Top) */}
                <View style={styles.hazardContainerTop}>
                    <Animated.View style={[styles.hazardStripesRow, { transform: [{ translateX: stripeTranslate }] }]}>
                        {[...Array(20)].map((_, i) => (
                            <View key={i} style={styles.hazardStripe} />
                        ))}
                    </Animated.View>
                </View>

                <View style={styles.modalFullContainer}>
                    {/* Urgency Header */}
                    <Animated.View style={[styles.header, { backgroundColor: flashColor }]}>
                        <View style={styles.headerContent}>
                            <Animated.View style={[styles.alertIconContainer, { transform: [{ scale: pulseAnim }] }]}>
                                <Icon name="warning" size={32} color="#FFFFFF" />
                            </Animated.View>
                            <View style={styles.titleStack}>
                                <Text style={styles.alertLabel}>STATE OF EMERGENCY</Text>
                                <Text style={styles.headerTitle}>LOKASI KRITIS TERDETEKSI</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={() => setModalVisible(false)}
                            style={styles.closeBtn}
                        >
                            <Icon name="close" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </Animated.View>

                    {loading ? (
                        <View style={styles.loadingBody}>
                            <ActivityIndicator size="large" color="#EF4444" />
                            <Text style={styles.loadingText}>MENGAMBIL DATA DARURAT...</Text>
                        </View>
                    ) : (
                        <View style={styles.body}>
                            {/* Evidence Section */}
                            <View style={styles.evidenceFrame}>
                                {imageUrl ? (
                                    <Image
                                        source={{ uri: imageUrl }}
                                        style={styles.image}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={styles.noImagePlaceholder}>
                                        <Icon name="camera-reverse-outline" size={48} color="#475569" />
                                        <View style={styles.noImageTextBlock}>
                                            <Text style={styles.noImageText}>TIDAK ADA FOTO BUKTI</Text>
                                            <Text style={styles.noImageSubtext}>Lampiran visual tidak tersedia</Text>
                                        </View>
                                    </View>
                                )}
                                <View style={styles.evidenceTag}>
                                    <View style={styles.liveDot} />
                                    <Text style={styles.evidenceTagText}>LIVE REPORT</Text>
                                </View>
                                <View style={styles.imageOverlay} />
                            </View>

                            <View style={styles.infoSection}>
                                {/* Meta Data Information */}
                                <View style={styles.metadataRow}>
                                    <View style={styles.idBox}>
                                        <Text style={styles.idLabel}>ID LAPORAN</Text>
                                        <Text style={styles.idValue}>#EMG-{modalData?.id || '000'}</Text>
                                    </View>
                                    <View style={styles.timeBox}>
                                        <Icon name="time-outline" size={14} color="#64748B" />
                                        <Text style={styles.timeText}>{formatDate(modalData?.createdAt || new Date().toISOString())}</Text>
                                    </View>
                                </View>

                                {/* Service and status badges */}
                                <View style={styles.badgeRow}>
                                    <View style={styles.emergencyTypeBadge}>
                                        <Icon name="shield-half" size={14} color="#EAB308" />
                                        <Text style={styles.emergencyTypeText}>
                                            {modalData?.dinasNama ? modalData.dinasNama.toUpperCase() : 'UNIT REAKSI CEPAT'}
                                        </Text>
                                    </View>
                                    <View style={[styles.statusBadgeFull, { backgroundColor: statusInfo.color + '15', borderColor: statusInfo.color }]}>
                                        <Icon name={statusInfo.icon} size={14} color={statusInfo.color} />
                                        <Text style={[styles.statusTextLive, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                                    </View>
                                </View>

                                <View style={styles.industrialCard}>
                                    <View style={styles.detailRow}>
                                        <View style={styles.iconBox}>
                                            <Icon name="person" size={18} color="#EF4444" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.detailLabel}>NAMA PELAPOR</Text>
                                            <Text style={styles.detailValue}>{modalData?.fullName || 'WARGA'}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <View style={styles.iconBox}>
                                            <Icon name="call" size={18} color="#EF4444" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.detailLabel}>KONTAK DARURAT</Text>
                                            <Text style={styles.detailValue}>{modalData?.phoneNumber || '-'}</Text>
                                        </View>
                                    </View>

                                    {modalData?.latitude && (
                                        <View style={styles.detailRow}>
                                            <View style={styles.iconBox}>
                                                <Icon name="location-sharp" size={18} color="#EF4444" />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.detailLabel}>KOORDINAT GPS LOKASI</Text>
                                                <Text style={styles.coordTextValue}>
                                                    {Number(modalData.latitude).toFixed(6)}, {Number(modalData.longitude).toFixed(6)}
                                                </Text>
                                            </View>
                                        </View>
                                    )}

                                    <View style={styles.messageBox}>
                                        <View style={styles.quoteBar} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.messageLabel}>CATATAN SITUASI:</Text>
                                            <Text style={styles.messageText}>"{modalData?.pesan || 'Laporan tanpa keterangan tambahan.'}"</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.systemAlertBanner}>
                                    <Icon name="shield-checkmark" size={18} color="#10B981" />
                                    <Text style={styles.systemAlertText}>
                                        Sistem sedang melakukan pelacakan lokasi secara real-time. Tim operator Command Center telah menerima koordinat ini.
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Footer Actions */}
                    {!loading && (
                        <View style={styles.footer}>
                            {modalData?.latitude && modalData?.longitude ? (
                                <TouchableOpacity
                                    style={styles.primaryActionBtn}
                                    onPress={openMap}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.btnContent}>
                                        <Icon name="map" size={20} color="#0F172A" />
                                        <Text style={styles.primaryActionBtnText}>BUKA PETA LOKASI</Text>
                                    </View>
                                    <View style={styles.btnTri} />
                                </TouchableOpacity>
                            ) : null}

                            <TouchableOpacity
                                style={styles.secondaryActionBtn}
                                onPress={() => setModalVisible(false)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.secondaryActionBtnText}>SAYA MENGERTI</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Animated Hazard Background (Bottom) */}
                <View style={styles.hazardContainerBottom}>
                    <Animated.View style={[styles.hazardStripesRow, { transform: [{ translateX: stripeTranslate }] }]}>
                        {[...Array(20)].map((_, i) => (
                            <View key={i} style={styles.hazardStripe} />
                        ))}
                    </Animated.View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    darkOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
    },
    hazardContainerTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 12,
        backgroundColor: '#EAB308',
        overflow: 'hidden',
    },
    hazardContainerBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 12,
        backgroundColor: '#EAB308',
        overflow: 'hidden',
    },
    hazardStripesRow: {
        flexDirection: 'row',
        width: width * 2,
    },
    hazardStripe: {
        width: 40,
        height: 40,
        backgroundColor: '#171717',
        transform: [{ rotate: '45deg' }, { translateX: -10 }],
        marginRight: 40,
    },
    modalFullContainer: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 2,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#EF4444',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 24,
    },
    header: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    alertIconContainer: {
        width: 48,
        height: 48,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
    },
    titleStack: {
        justifyContent: 'center',
    },
    alertLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: 'rgba(255, 255, 255, 0.8)',
        letterSpacing: 1.5,
        marginBottom: 2,
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 0.2,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    body: {
        backgroundColor: '#FFFFFF',
    },
    loadingBody: {
        padding: 60,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        backgroundColor: '#FFFFFF',
    },
    loadingText: {
        fontSize: 12,
        fontWeight: '900',
        color: '#1E293B',
        letterSpacing: 1,
    },
    evidenceFrame: {
        width: '100%',
        height: 200,
        backgroundColor: '#0F172A',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15, 23, 42, 0.1)',
    },
    noImagePlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#F1F5F9',
    },
    noImageTextBlock: {
        alignItems: 'center',
    },
    noImageText: {
        fontSize: 12,
        fontWeight: '900',
        color: '#64748B',
        letterSpacing: 0.5,
    },
    noImageSubtext: {
        fontSize: 10,
        color: '#94A3B8',
        marginTop: 4,
    },
    evidenceTag: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: '#EF4444',
        paddingHorizontal: 10,
        paddingVertical: 5,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        zIndex: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FFFFFF',
    },
    evidenceTagText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1,
    },
    infoSection: {
        padding: 20,
    },
    metadataRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    idBox: {
        flex: 1,
    },
    idLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1,
        marginBottom: 2,
    },
    idValue: {
        fontSize: 20,
        fontWeight: '900',
        color: '#0F172A',
    },
    timeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 4,
    },
    timeText: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '700',
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    emergencyTypeBadge: {
        flex: 1,
        backgroundColor: '#1E293B',
        paddingVertical: 10,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#EAB308',
    },
    statusBadgeFull: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderWidth: 1,
        borderRadius: 0,
        gap: 8,
    },
    statusTextLive: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    emergencyTypeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    industrialCard: {
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
        gap: 16,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 36,
        height: 36,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 2,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        elevation: 1,
    },
    detailLabel: {
        fontSize: 8,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1,
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0F172A',
    },
    coordTextValue: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1E293B',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    messageBox: {
        flexDirection: 'row',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        gap: 12,
    },
    quoteBar: {
        width: 3,
        backgroundColor: '#CBD5E1',
        borderRadius: 2,
    },
    messageLabel: {
        fontSize: 8,
        fontWeight: '900',
        color: '#94A3B8',
        marginBottom: 4,
    },
    messageText: {
        fontSize: 14,
        color: '#334155',
        fontWeight: '600',
        lineHeight: 20,
        fontStyle: 'italic',
    },
    systemAlertBanner: {
        flexDirection: 'row',
        gap: 12,
        backgroundColor: '#ECFDF5',
        padding: 12,
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    systemAlertText: {
        flex: 1,
        fontSize: 10,
        color: '#065F46',
        fontWeight: '600',
        lineHeight: 16,
    },
    footer: {
        padding: 20,
        backgroundColor: '#F8FAFC',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        flexDirection: 'row',
        gap: 12,
    },
    primaryActionBtn: {
        flex: 1.2,
        backgroundColor: '#EAB308',
        height: 54,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    btnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        zIndex: 2,
    },
    btnTri: {
        position: 'absolute',
        right: -10,
        bottom: -10,
        width: 30,
        height: 30,
        backgroundColor: 'rgba(0,0,0,0.05)',
        transform: [{ rotate: '45deg' }],
    },
    primaryActionBtnText: {
        color: '#0F172A',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
    },
    secondaryActionBtn: {
        flex: 1,
        backgroundColor: '#0F172A',
        height: 54,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    secondaryActionBtnText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
    },
});

export default GlobalEmergencyModal;
