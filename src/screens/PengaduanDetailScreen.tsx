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
    Modal
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getImageUrl } from '../config/api';
import usePengaduanStore from '../stores/pengaduanStore';

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

export default function PengaduanDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { item, id } = route.params || {};

    const storeList = usePengaduanStore(state => state.list);
    
    // Determine the ID to look up
    const targetId = item?.id || id;
    
    // Try to find in store first
    const storeItem = storeList.find(i => i.id === targetId);
    
    // Use store item if found, otherwise fallback to passed item
    const displayItem = storeItem || item;
    
    // If still no item, we might need to fetch (omitted for brevity, expecting store or item)
    // For now, if no item found, show error or loading.
    if (!displayItem) {
         return (
             <View style={styles.container}>
                <View style={[styles.header, { justifyContent: 'flex-start' }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                        <Icon name="arrow-back" size={24} color="#0F172A" />
                    </TouchableOpacity>
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                     <Text style={{ color: '#64748B' }}>Data laporan tidak ditemukan.</Text>
                </View>
             </View>
         );
    }

    // Determine timeline based on status
    const isSubmitted = true;
    const isProcessed = ['diproses', 'selesai'].includes(displayItem.status?.toLowerCase());
    const isFinished = displayItem.status?.toLowerCase() === 'selesai';
    const isRejected = displayItem.status?.toLowerCase() === 'ditolak';

    const [zoomImage, setZoomImage] = useState<string | null>(null);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detail Laporan</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.statusSection}>
                    <Text style={styles.statusLabel}>Status Saat Ini</Text>
                    <View style={[styles.statusBadge,
                    isFinished ? { backgroundColor: '#ECFDF5' } :
                        isRejected ? { backgroundColor: '#FEF2F2' } :
                            { backgroundColor: '#FFFBEB' }
                    ]}>
                        <Icon
                            name={isFinished ? "checkmark-circle" : isRejected ? "close-circle" : "time"}
                            size={20}
                            color={isFinished ? "#10B981" : isRejected ? "#EF4444" : "#F59E0B"}
                        />
                        <Text style={[styles.statusText,
                        isFinished ? { color: '#10B981' } :
                            isRejected ? { color: '#EF4444' } :
                                { color: '#F59E0B' }
                        ]}>
                            {displayItem.status?.toUpperCase() || 'DIAJUKAN'}
                        </Text>
                    </View>
                    <Text style={styles.ticketId}>ID Laporan: #{displayItem.id}</Text>
                </View>

                <View style={styles.section}>
                    <View style={styles.userHead}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{displayItem.userNama?.charAt(0) || 'P'}</Text>
                        </View>
                        <View>
                            <Text style={styles.userName}>{displayItem.userNama}</Text>
                            <Text style={styles.userRole}>Warga</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Instansi Tujuan</Text>
                    <View style={styles.dinasRow}>
                        <View style={styles.dinasIcon}>
                            <Icon name="business" size={24} color="#F59E0B" />
                        </View>
                        <Text style={styles.dinasName}>{displayItem.dinasNama}</Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Isi Laporan</Text>
                    <View style={styles.quoteContainer}>
                        <Icon name="chatbox-ellipses" size={24} color="#F59E0B" style={styles.quoteIcon} />
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
                                <Icon name="image" size={12} color="#FFFFFF" />
                                <Text style={styles.imageCaptionText}>Bukti Foto (Ketuk untuk perbesar)</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Riwayat Penanganan (Tracking)</Text>
                    <View style={styles.timelineContainer}>
                        <TimelineStep
                            title="Laporan Diterima Sistem"
                            date={new Date(displayItem.createdAt).toLocaleString()}
                            isActive={isSubmitted}
                            description="Laporan Anda telah berhasil masuk ke sistem kami untuk diverifikasi."
                        />
                        <TimelineStep
                            title="Disposisi ke Dinas Terkait"
                            date={isProcessed ? "Sedang ditinjau petugas" : null}
                            isActive={isProcessed}
                            description="Petugas dinas sedang meninjau dan menindaklanjuti laporan ini."
                        />
                        <TimelineStep
                            title="Penanganan Selesai"
                            isActive={isFinished}
                            isLast
                            description={isFinished ? "Laporan telah selesai ditangani. Terima kasih atas masukan Anda." : "Menunggu tindak lanjut dinas."}
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
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        justifyContent: 'space-between',
        // Remove border for cleaner look
        borderBottomWidth: 0,
    },
    headerBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: '#F8FAFC',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: 0.5,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    statusSection: {
        alignItems: 'center',
        marginVertical: 24,
    },
    statusLabel: {
        fontSize: 12,
        color: '#94A3B8',
        marginBottom: 8,
        fontWeight: '600',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 30,
        gap: 8,
        marginBottom: 8,
    },
    statusText: {
        fontWeight: '800',
        fontSize: 14,
        letterSpacing: 1,
    },
    ticketId: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
        marginTop: 4,
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 24,
    },
    section: {
        marginBottom: 8,
    },
    // User Head - simplified
    userHead: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        color: '#64748B',
        fontSize: 18,
        fontWeight: '800',
    },
    userName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 2,
    },
    userRole: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    // Unified Card Style -> Flat Section
    card: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 16,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    dinasRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC', // Light bg for dinas box
        padding: 16,
        borderRadius: 12,
    },
    dinasIcon: {
        width: 40,
        height: 40,
        borderRadius: 20, // Circle
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        // Small shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    dinasName: {
        flex: 1,
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
        lineHeight: 20,
    },
    messageText: {
        fontSize: 16,
        color: '#0F172A', // Darker text for readability
        lineHeight: 26,
        fontStyle: 'italic', // Italic for quote style
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
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    evidenceImage: {
        width: '100%',
        height: 240,
        backgroundColor: '#F1F5F9',
    },
    imageCaption: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        backgroundColor: 'rgba(15, 23, 42, 0.8)', // Dark slate backdrop
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    imageCaptionText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },
    timelineContainer: {
        paddingLeft: 8,
        marginTop: 8,
    },
    timelineRow: {
        flexDirection: 'row',
    },
    timelineLeft: {
        alignItems: 'center',
        marginRight: 20,
        width: 24,
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#E2E8F0',
        zIndex: 10,
        marginTop: 4,
    },
    timelineDotActive: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#F59E0B', // Active dot yellow
        marginTop: 2,
        borderWidth: 3,
        borderColor: '#FEF3C7', // Light yellow ring
    },
    timelineDotInner: {
        display: 'none',
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
        fontSize: 12,
        color: '#94A3B8',
        marginBottom: 4,
    },
    timelineDesc: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 20,
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
