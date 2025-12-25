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
    ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getImageUrl } from '../../config/api';
import usePengaduanStore from '../../stores/pengaduanStore';
import useToastStore from '../../stores/toastStore';

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
    const { item } = route.params || {};

    const { updatePengaduanStatus, loading } = usePengaduanStore();
    const showToast = useToastStore(state => state.showToast);

    if (!item) return null;

    const storeItem = usePengaduanStore(state => state.list.find(i => i.id === item.id));
    const displayItem = storeItem || item;

    const isSubmitted = true;
    const isProcessed = ['diproses', 'selesai'].includes(displayItem.status?.toLowerCase());
    const isFinished = displayItem.status?.toLowerCase() === 'selesai';
    const isRejected = displayItem.status?.toLowerCase() === 'ditolak';

    const handleUpdateStatus = async (newStatus: string) => {
        try {
            await updatePengaduanStatus(displayItem.id, newStatus);
            showToast(`Status berhasil diubah menjadi ${newStatus}`, 'success');
            (navigation as any).setParams({ item: { ...displayItem, status: newStatus } });
        } catch (error: any) {
            showToast(error.message || 'Gagal mengubah status', 'error');
        }
    };

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
                <View style={styles.adminPanel}>
                    <Text style={styles.adminPanelTitle}>Admin Control</Text>
                    <Text style={styles.adminPanelDesc}>Ubah status laporan ini untuk memperbarui progres kepada warga.</Text>

                    {!isFinished && (
                        <View style={styles.adminBtnRow}>
                            <TouchableOpacity
                                style={[styles.adminStatusBtn, { backgroundColor: '#F59E0B' }]}
                                onPress={() => handleUpdateStatus('diproses')}
                            >
                                <Icon name="time" size={16} color="#FFF" />
                                <Text style={styles.adminStatusBtnText}>Proses</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.adminStatusBtn, { backgroundColor: '#10B981' }]}
                                onPress={() => handleUpdateStatus('selesai')}
                            >
                                <Icon name="checkmark" size={16} color="#FFF" />
                                <Text style={styles.adminStatusBtnText}>Selesai</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.adminStatusBtn, { backgroundColor: '#EF4444' }]}
                                onPress={() => handleUpdateStatus('ditolak')}
                            >
                                <Icon name="close" size={16} color="#FFF" />
                                <Text style={styles.adminStatusBtnText}>Tolak</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    {loading && <ActivityIndicator size="small" color="#3B82F6" style={{ marginTop: 10 }} />}
                </View>

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
                            <Icon name="business" size={24} color="#3B82F6" />
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
                        <View style={styles.imageContainer}>
                            <Image
                                source={{ uri: getImageUrl(displayItem.urlFoto) }}
                                style={styles.evidenceImage}
                                resizeMode="cover"
                            />
                            <View style={styles.imageCaption}>
                                <Icon name="image" size={12} color="#FFFFFF" />
                                <Text style={styles.imageCaptionText}>Bukti Foto Terlampir</Text>
                            </View>
                        </View>
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
    }
});
