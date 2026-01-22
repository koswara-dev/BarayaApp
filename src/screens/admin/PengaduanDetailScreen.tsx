import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Platform,
    StatusBar,
    ActivityIndicator,
    Modal
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getImageUrl } from '../../config/api';
import usePengaduanStore from '../../stores/pengaduanStore';
import useToastStore from '../../stores/toastStore';
import useAuthStore from '../../stores/authStore';
import { Role } from '../../types/auth';
import IndustrialImagePicker from '../../components/Form/IndustrialImagePicker';

const TimelineStep = ({ title, date, description, isActive, isLast }: any) => (
    <View style={styles.timelineRow}>
        <View style={styles.timelineLeft}>
            <View style={[styles.timelineDot, isActive ? styles.timelineDotActive : null]}>
                {isActive && <View style={styles.timelineDotInner} />}
            </View>
            {!isLast && <View style={styles.timelineLine} />}
        </View>
        <View style={[styles.timelineContent, { paddingBottom: isLast ? 0 : 24 }]}>
            <Text style={[styles.timelineTitle, isActive ? { color: '#0F172A' } : { color: '#64748B' }]}>{title}</Text>
            {date && <Text style={styles.timelineDate}>{date}</Text>}
            {description && <Text style={styles.timelineDesc}>{description}</Text>}
        </View>
    </View>
);

export default function AdminPengaduanDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { item, id } = route.params || {};

    const { updatePengaduanStatus, getPengaduanById, loading } = usePengaduanStore();
    const showToast = useToastStore(state => state.showToast);
    
    // Auth Check
    const user = useAuthStore(state => state.user);
    const userRole = user?.role;
    const canManage = [Role.ADMIN, Role.STAFF, Role.EXECUTIVE, Role.SUPERADMIN].includes(userRole as Role);
    
    // Local state for fetched item if passed only ID
    const [fetchedItem, setFetchedItem] = useState<any>(null);
    const [isFetching, setIsFetching] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);
    const [completionPhoto, setCompletionPhoto] = useState<any>(null);
    const [zoomImage, setZoomImage] = useState<string | null>(null);

    const list = usePengaduanStore(state => state.list);
    
    // Find item from list if available
    const listItem = React.useMemo(() => {
        if (!id && !item) return null;
        return list.find(i => String(i.id) === String(item?.id || id));
    }, [list, item, id]);

    const loadData = async () => {
        if (id) {
                // Always fetch to ensure we have latest data (especially after update)
                setIsFetching((prev) => !fetchedItem && prev); // Only show loading content on first load or explicit refresh
                try {
                    const data = await getPengaduanById(id);
                    if (data) {
                        setFetchedItem(data);
                    }
                } catch (e) {
                    console.log('Fetch error', e);
                } finally {
                    setIsFetching(false);
                }
        }
    };

    React.useEffect(() => {
        if (!item && id && !listItem && !fetchedItem) {
             setIsFetching(true);
             loadData();
        }
    }, [item, id, listItem]);

    if (isFetching && !fetchedItem && !item && !listItem) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center'}]}>
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    const displayItem = fetchedItem || item || listItem;

    if (!displayItem) return (
         <View style={[styles.container, { justifyContent: 'center', alignItems: 'center'}]}>
             <Text>Data laporan tidak ditemukan</Text>
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16, padding: 10 }}>
                 <Text style={{ color: '#3B82F6'}}>Kembali</Text>
             </TouchableOpacity>
         </View>
    );

    const isSubmitted = true;
    const isProcessed = ['diproses', 'selesai'].includes(displayItem.status?.toLowerCase());
    const isFinished = displayItem.status?.toLowerCase() === 'selesai';
    const isRejected = displayItem.status?.toLowerCase() === 'ditolak';
    
    // Check if user belongs to the same dinas as the report
    // Note: SUPERADMIN might not have dinasId, or might have access to all. 
    // Assuming strict request: "only same dinasId"
    const isSameDinas = user?.dinasId && displayItem.dinasId && (Number(user.dinasId) === Number(displayItem.dinasId));

    const submitStatusUpdate = async (newStatus: string) => {
        try {
            // Updated to pass photo if available
            await updatePengaduanStatus(displayItem.id, newStatus, displayItem, completionPhoto);
            
            showToast(`Status berhasil diubah menjadi ${newStatus}`, 'success');
            
            // Refresh data to show new photo/status
            await loadData();

            setIsCompleting(false);
            setCompletionPhoto(null);
        } catch (error: any) {
            showToast(error.message || 'Gagal mengubah status', 'error');
        }
    };

    // Keep handleUpdateStatus for compatibility if needed or just alias it
    const handleUpdateStatus = submitStatusUpdate;



    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detail Laporan (Admin)</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* ADMIN CONTROL PANEL */}
                {canManage && (
                    <View style={styles.adminPanel}>
                        <View style={styles.cardHeaderRow}>
                            <Icon name="construct-outline" size={20} color="#2563EB" style={{ marginRight: 8 }} />
                            <Text style={styles.adminPanelTitle}>Admin Control</Text>
                        </View>
                        <Text style={styles.adminPanelDesc}>Ubah status laporan ini untuk memperbarui progres kepada warga.</Text>

                        {/* Completion Form */}
                        {isCompleting ? (
                            <View style={{ marginBottom: 16 }}>
                                <Text style={[styles.sectionTitle, { color: '#0F172A', marginBottom: 8 }]}>Bukti Penyelesaian</Text>
                                <IndustrialImagePicker
                                    photo={completionPhoto}
                                    onPhotoSelected={setCompletionPhoto}
                                    onPhotoRemoved={() => setCompletionPhoto(null)}
                                />
                                <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                                    <TouchableOpacity
                                        style={[styles.adminStatusBtn, { backgroundColor: '#ECFDF5', borderColor: '#10B981', flex: 2 }]}
                                        onPress={() => submitStatusUpdate('selesai')}
                                    >
                                        {loading ? (
                                            <ActivityIndicator size="small" color="#059669" />
                                        ) : (
                                            <>
                                                <Icon name="checkmark-done-circle" size={18} color="#059669" />
                                                <Text style={[styles.adminStatusBtnText, { color: '#059669' }]}>KIRIM PENYELESAIAN</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.adminStatusBtn, { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1', flex: 1 }]}
                                        onPress={() => {
                                            setIsCompleting(false);
                                            setCompletionPhoto(null);
                                        }}
                                        disabled={loading}
                                    >
                                        <Text style={[styles.adminStatusBtnText, { color: '#64748B' }]}>BATAL</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            !isFinished && (
                                <View style={styles.adminBtnRow}>
                                    <TouchableOpacity
                                        style={[styles.adminStatusBtn, { backgroundColor: '#FFFBEB', borderColor: '#F59E0B' }]}
                                        onPress={() => submitStatusUpdate('diproses')}
                                    >
                                        <Icon name="time-outline" size={18} color="#D97706" />
                                        <Text style={[styles.adminStatusBtnText, { color: '#D97706' }]}>PROSES</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.adminStatusBtn, { backgroundColor: '#ECFDF5', borderColor: '#10B981', opacity: isSameDinas ? 1 : 0.5 }]}
                                        onPress={() => {
                                            if (isSameDinas) {
                                                setIsCompleting(true);
                                            } else {
                                                showToast('Hanya petugas dinas terkait yang dapat menyelesaikan laporan ini', 'error');
                                            }
                                        }}
                                    >
                                        <Icon name="checkmark-done-outline" size={18} color="#059669" />
                                        <Text style={[styles.adminStatusBtnText, { color: '#059669' }]}>SELESAI</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.adminStatusBtn, { backgroundColor: '#FEF2F2', borderColor: '#EF4444' }]}
                                        onPress={() => submitStatusUpdate('ditolak')}
                                    >
                                        <Icon name="close-circle-outline" size={18} color="#DC2626" />
                                        <Text style={[styles.adminStatusBtnText, { color: '#DC2626' }]}>TOLAK</Text>
                                    </TouchableOpacity>
                                </View>
                            )
                        )}
                        
                        {loading && !isCompleting && <ActivityIndicator size="small" color="#3B82F6" style={{ marginTop: 10 }} />}
                    </View>
                )}

                <View style={styles.statusSection}>
                    <View style={[styles.statusBadge,
                    isFinished ? { backgroundColor: '#ECFDF5' } :
                        isRejected ? { backgroundColor: '#FEF2F2' } :
                            { backgroundColor: '#FFFBEB' }
                    ]}>
                        <Icon
                            name={isFinished ? "checkmark-circle" : isRejected ? "close-circle" : "time-outline"}
                            size={20}
                            color={isFinished ? "#10B981" : isRejected ? "#EF4444" : "#F59E0B"}
                        />
                        <Text style={[styles.statusText,
                        isFinished ? { color: '#059669' } :
                            isRejected ? { color: '#DC2626' } :
                                { color: '#D97706' }
                        ]}>
                            {displayItem.status?.toUpperCase() || 'DIAJUKAN'}
                        </Text>
                    </View>
                    <Text style={styles.ticketId}>ID Laporan: #{displayItem.id}</Text>
                    {displayItem.updatedByNama && (
                         <Text style={[styles.ticketId, { marginTop: 4, color: '#64748B' }]}>
                             Updated by: {displayItem.updatedByNama}
                         </Text>
                    )}
                </View>

                <View style={styles.section}>
                    <View style={styles.userHead}>
                        <View style={styles.avatar}>
                            <Icon name="person" size={20} color="#FFFFFF" />
                        </View>
                        <View>
                            <Text style={styles.userName}>{displayItem.userNama}</Text>
                            <Text style={styles.userRole}>Warga</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                        <View style={styles.iconBox}>
                            <Icon name="business-outline" size={20} color="#3B82F6" />
                        </View>
                        <Text style={styles.sectionTitle}>Instansi Tujuan</Text>
                    </View>
                    <Text style={styles.dinasName}>{displayItem.dinasNama}</Text>
                </View>

                <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                        <View style={[styles.iconBox, { backgroundColor: '#FFFBEB' }]}>
                            <Icon name="chatbox-ellipses-outline" size={20} color="#F59E0B" />
                        </View>
                        <Text style={styles.sectionTitle}>Isi Laporan</Text>
                    </View>
                    
                    <View style={styles.quoteContainer}>
                        <Text style={styles.messageText}>{displayItem.pesan}</Text>
                    </View>

                    {displayItem.urlFoto && (
                        <TouchableOpacity
                            style={styles.imageContainer}
                            onPress={() => setZoomImage(getImageUrl(displayItem.urlFoto))}
                        >
                            <Image
                                source={{ uri: getImageUrl(displayItem.urlFoto) }}
                                style={styles.evidenceImage}
                                resizeMode="cover"
                            />
                            <View style={styles.imageCaption}>
                                <Icon name="image-outline" size={12} color="#FFFFFF" />
                                <Text style={styles.imageCaptionText}>Bukti Foto (Ketuk untuk perbesar)</Text>
                            </View>
                        </TouchableOpacity>
                    )}

                    {displayItem.urlFotoSelesai && (
                        <TouchableOpacity
                            style={[styles.imageContainer, { marginTop: 16 }]}
                            onPress={() => setZoomImage(getImageUrl(displayItem.urlFotoSelesai))}
                        >
                            <Image
                                source={{ uri: getImageUrl(displayItem.urlFotoSelesai) }}
                                style={styles.evidenceImage}
                                resizeMode="cover"
                            />
                            <View style={[styles.imageCaption, { backgroundColor: 'rgba(16, 185, 129, 0.9)' }]}>
                                <Icon name="checkmark-circle" size={12} color="#FFFFFF" />
                                <Text style={styles.imageCaptionText}>Bukti Penyelesaian (Ketuk untuk perbesar)</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                        <View style={[styles.iconBox, { backgroundColor: '#F1F5F9' }]}>
                            <Icon name="git-network-outline" size={20} color="#64748B" />
                        </View>
                        <Text style={styles.sectionTitle}>Tracking</Text>
                    </View>
                    <View style={styles.timelineContainer}>
                        <TimelineStep
                            title="Laporan Diterima"
                            date={new Date(displayItem.createdAt).toLocaleDateString()}
                            isActive={isSubmitted}
                            description="Verifikasi sistem berhasil."
                        />
                        <TimelineStep
                            title="Disposisi Dinas/Proses"
                            date={isProcessed ? "Sedang ditinjau" : null}
                            isActive={isProcessed}
                            description="Tindak lanjut oleh petugas."
                        />
                        <TimelineStep
                            title="Selesai"
                            isActive={isFinished}
                            isLast
                            description={isFinished ? `Laporan ditutup.${displayItem.updatedByNama ? ' Oleh: ' + displayItem.updatedByNama : ''}` : "Menunggu penyelesaian."}
                        />
                    </View>
                </View>

            </ScrollView>

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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
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
        borderBottomColor: '#E2E8F0',
    },
    headerBtn: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: 1,
    },
    scrollContent: {
        padding: 20,
    },
    statusSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    statusLabel: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 8,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
        marginBottom: 8,
    },
    statusText: {
        fontWeight: '800',
        fontSize: 14,
        letterSpacing: 1,
    },
    ticketId: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '600',
    },
    section: {
        marginBottom: 20,
    },
    userHead: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#334155',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    userName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
    },
    userRole: {
        fontSize: 12,
        color: '#64748B',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#94A3B8',
        marginBottom: 16,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    dinasRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dinasIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    dinasName: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: '#0F172A',
        lineHeight: 20,
    },
    messageText: {
        fontSize: 16,
        color: '#0F172A',
        lineHeight: 26,
        fontStyle: 'italic',
    },
    quoteContainer: {
        backgroundColor: '#FFFBEB', // Light yellow background
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#F59E0B', // Yellow accent border
    },
    quoteIcon: {
        marginBottom: 12,
        opacity: 0.8,
        color: '#F59E0B',
    },
    imageContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    evidenceImage: {
        width: '100%',
        height: 200,
        backgroundColor: '#F1F5F9',
    },
    imageCaption: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    imageCaptionText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '600',
    },
    timelineContainer: {
        paddingLeft: 8,
    },
    timelineRow: {
        flexDirection: 'row',
    },
    timelineLeft: {
        alignItems: 'center',
        marginRight: 16,
        width: 20,
    },
    timelineDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#E2E8F0',
        borderWidth: 2,
        borderColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    timelineDotActive: {
        borderColor: '#3B82F6',
        backgroundColor: '#FFFFFF',
    },
    timelineDotInner: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#3B82F6',
    },
    timelineLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 4,
    },
    timelineContent: {
        flex: 1,
    },
    timelineTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
    },
    timelineDate: {
        fontSize: 11,
        color: '#94A3B8',
        marginBottom: 4,
    },
    timelineDesc: {
        fontSize: 12,
        color: '#64748B',
        lineHeight: 18,
    },
    // Admin Panel Styles
    adminPanel: {
        backgroundColor: '#EFF6FF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    adminPanelTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1E40AF',
        marginBottom: 4,
    },
    adminPanelDesc: {
        fontSize: 12,
        color: '#3B82F6',
        marginBottom: 16,
    },
    adminBtnRow: {
        flexDirection: 'row',
        gap: 8,
    },
    adminStatusBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
    },
    adminStatusBtnText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
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
    }
});
