import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, StatusBar, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation } from '@react-navigation/native';
import api, { getImageUrl } from '../../config/api';
import useEmergencyStore, { EmergencyReport, EmergencyStatus } from '../../stores/emergencyStore';
import useToastStore from '../../stores/toastStore';
import useAuthStore from '../../stores/authStore';

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
    const canManage = ['ADMIN', 'SUPERADMIN', 'STAFF'].includes(userRole || '');

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
                        const success = await updateReportStatus(report.id, newStatus);
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
                {/* Status Banner */}
                <View style={[styles.statusBanner, { backgroundColor: STATUS_COLORS[currentStatus] || '#94A3B8' }]}>
                    <Text style={styles.statusText}>{currentStatus.toUpperCase()}</Text>
                </View>

                {/* Sender Info */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Pelapor</Text>
                    <View style={styles.row}>
                        <Icon name="person-circle-outline" size={40} color="#64748B" />
                        <View style={{ marginLeft: 12 }}>
                            <Text style={styles.senderName}>{currentReport.fullName || currentReport.userNama || 'Anonim'}</Text>
                            <Text style={styles.senderPhone}>{currentReport.phoneNumber || 'No Phone'}</Text>
                        </View>
                    </View>
                </View>

                {/* Location */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Lokasi Kejadian</Text>
                    <View style={styles.locationBox}>
                        <Icon name="location" size={24} color="#EF4444" />
                        <Text style={styles.locationText} selectable>{currentReport.latitude}, {currentReport.longitude}</Text>
                    </View>
                     <TouchableOpacity 
                        style={styles.mapBtn}
                        onPress={() => navigation.navigate('MapEmergency', { initialLoc: { latitude: currentReport.latitude, longitude: currentReport.longitude } })}
                    >
                        <Text style={styles.mapBtnText}>Lihat di Peta</Text>
                        <Icon name="open-outline" size={16} color="#3B82F6" />
                    </TouchableOpacity>
                </View>

                {/* Message & Photo */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Laporan</Text>
                    <Text style={styles.messageText}>{currentReport.pesan}</Text>
                    
                    {currentReport.urlFoto ? (
                        <Image 
                            source={{ uri: getImageUrl(currentReport.urlFoto) }} 
                            style={styles.evidenceImage} 
                            resizeMode="cover" 
                        />
                    ) : (
                         <View style={styles.noPhotoBox}>
                             <Icon name="image-outline" size={32} color="#CBD5E1" />
                             <Text style={styles.noPhotoText}>Tidak ada foto terlampir</Text>
                         </View>
                    )}
                    <Text style={styles.dateText}>Dilaporkan: {formatDate(currentReport.createdAt)}</Text>
                </View>

                {/* Admin Actions */}
                {canManage && (
                    <View style={styles.actionCard}>
                        <Text style={styles.sectionTitle}>Update Status Penanganan</Text>
                        {updating ? (
                            <ActivityIndicator size="large" color="#3B82F6" style={{ marginVertical: 20 }} />
                        ) : (
                            <View style={styles.actionGrid}>
                                <TouchableOpacity 
                                    style={[styles.actionBtn, { backgroundColor: '#F59E0B' }, currentStatus === 'diterima' && styles.actionBtnActive]} 
                                    onPress={() => handleUpdateStatus('diterima')}
                                >
                                    <Text style={styles.actionBtnText}>TERIMA</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={[styles.actionBtn, { backgroundColor: '#3B82F6' }, currentStatus === 'diproses' && styles.actionBtnActive]} 
                                    onPress={() => handleUpdateStatus('diproses')}
                                >
                                    <Text style={styles.actionBtnText}>PROSES UNIT</Text>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={[styles.actionBtn, { backgroundColor: '#10B981' }, currentStatus === 'selesai' && styles.actionBtnActive]} 
                                    onPress={() => handleUpdateStatus('selesai')}
                                >
                                    <Text style={styles.actionBtnText}>SELESAI</Text>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={[styles.actionBtn, { backgroundColor: '#EF4444' }, currentStatus === 'dibatalkan' && styles.actionBtnActive]} 
                                    onPress={() => handleUpdateStatus('dibatalkan')}
                                >
                                    <Text style={styles.actionBtnText}>TOLAK</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                <View style={{height: 40}} />
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
    statusBanner: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 16,
    },
    statusText: {
        color: '#FFFFFF',
        fontWeight: '800',
        letterSpacing: 1,
        fontSize: 14,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#94A3B8',
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    senderName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
    },
    senderPhone: {
        fontSize: 14,
        color: '#64748B',
    },
    locationBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    locationText: {
        marginLeft: 8,
        color: '#EF4444',
        fontWeight: '600',
    },
    mapBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: '#3B82F6',
        borderRadius: 8,
        gap: 8,
    },
    mapBtnText: {
        color: '#3B82F6',
        fontWeight: '700',
    },
    messageText: {
        fontSize: 16,
        color: '#1E293B',
        lineHeight: 24,
        marginBottom: 16,
    },
    evidenceImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
        marginBottom: 12,
    },
    noPhotoBox: {
        width: '100%',
        height: 120,
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
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
    },
    actionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    actionBtn: {
        flexBasis: '48%',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        opacity: 0.8,
    },
    actionBtnActive: {
        opacity: 1,
        borderWidth: 2,
        borderColor: '#0F172A', // Highlight active status
    },
    actionBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 12,
    }
});
