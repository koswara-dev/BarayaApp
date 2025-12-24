import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    TextInput,
    StatusBar,
    SafeAreaView,
    Dimensions,
    ActivityIndicator,
    RefreshControl,
    processColor,
    ProcessedColorValue
} from 'react-native';
import api, { getImageUrl } from '../config/api';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { LineChart, BarChart, PieChart } from 'react-native-charts-wrapper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import useAuthStore from '../stores/authStore';
import useUserStore from '../stores/userStore';

const { width } = Dimensions.get('window');

interface StatsResponse {
    success: boolean;
    data: {
        totalDinas: number;
        totalLayanan: number;
        totalEvent: number;
        totalNotifikasiDarurat: number;
        totalUser: number;
        top5DinasLayanan: any[];
        top5DinasFeedback: any[];
        top5DinasEvent: any[];
        top5DinasNotifikasi: any[];
        top5LayananFeedback: any[];
        top5LayananLeastFeedback: any[];
        feedbackPerStatus: { status: string; count: number }[];
        notifikasiPerStatus: { status: string; count: number }[];
        userRegistrationHistory: any[];
    };
}

export default function AdminDashboardScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const user = useAuthStore((state) => state.user);
    const { profile, fetchUserProfile } = useUserStore();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [statsData, setStatsData] = useState<StatsResponse['data'] | null>(null);

    const fetchStats = useCallback(async () => {
        try {
            const response = await api.get<StatsResponse>('/statistik');
            if (response.data.success) {
                setStatsData(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
        if (user?.id) {
            fetchUserProfile(user.id);
        }
    }, [fetchStats, user?.id, fetchUserProfile]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchStats();
    }, [fetchStats]);

    const topStats = [
        {
            label: 'LAYANAN',
            count: statsData?.totalLayanan || 0,
            badge: statsData?.totalDinas ? `${statsData.totalDinas} Dinas` : '--',
            color: '#3B82F6',
            icon: 'grid'
        },
        {
            label: 'PENGADUAN',
            count: statsData?.feedbackPerStatus.reduce((acc, curr) => acc + curr.count, 0) || 0,
            badge: statsData?.feedbackPerStatus.find(s => s.status === 'pending')?.count ? `+${statsData.feedbackPerStatus.find(s => s.status === 'pending')?.count}` : '--',
            color: '#F59E0B',
            icon: 'chatbubbles'
        },
        {
            label: 'DARURAT',
            count: statsData?.totalNotifikasiDarurat || 0,
            badge: statsData?.notifikasiPerStatus.find(s => s.status === 'pending')?.count ? `${statsData.notifikasiPerStatus.find(s => s.status === 'pending')?.count} New` : '--',
            color: '#EF4444',
            icon: 'alert-circle'
        },
    ];

    const modules = [
        { label: 'Verifikasi Layanan', icon: 'file-tray-full', color: '#334155' },
        { label: 'Kelola Pengaduan', icon: 'people-circle', color: '#334155' },
        { label: 'Laporan Kinerja', icon: 'stats-chart', color: '#334155' },
        { label: 'Pengaturan Sistem', icon: 'settings', color: '#334155' },
    ];

    const tasks = [
        {
            id: 'REQ-2023-891',
            type: 'SEGERA',
            title: 'Jalan Berlubang di Jl. Siliwangi',
            reporter: 'Budi Santoso',
            time: '20 Menit yang lalu',
            icon: 'alert-triangle',
            color: '#EF4444'
        },
        {
            id: 'DOC-2023-112',
            type: 'VERIFIKASI',
            title: 'Permohonan KTP Digital',
            reporter: 'Siti Aminah',
            time: '1 Jam yang lalu',
            icon: 'person-badge',
            color: '#F59E0B'
        },
        {
            id: 'LAP-2023-004',
            type: 'REVIEW',
            title: 'Laporan Kinerja Bulanan',
            reporter: 'Divisi Pelayanan Umum',
            time: '3 Jam yang lalu',
            icon: 'file-text',
            color: '#3B82F6'
        }
    ];

    const getTimeGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 11) return 'Selamat Pagi';
        if (hour >= 11 && hour < 15) return 'Selamat Siang';
        if (hour >= 15 && hour < 18) return 'Selamat Sore';
        return 'Selamat Malam';
    };

    const greeting = getTimeGreeting();

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    {profile?.urlFoto ? (
                        <Image
                            source={{ uri: getImageUrl(profile.urlFoto) }}
                            style={styles.avatarMain}
                        />
                    ) : (
                        <View style={[styles.avatarMain, { justifyContent: 'center', alignItems: 'center' }]}>
                            <Icon name="person" size={30} color="#CBD5E1" />
                        </View>
                    )}
                    <View style={styles.titleContainer}>
                        <Text style={styles.headerGreeting}>{greeting},</Text>
                        <Text style={styles.headerTitle}>{user?.fullName || 'Admin'}</Text>
                        <View style={styles.subtitleContainer}>
                            <View style={styles.roleBadge}>
                                <Text style={styles.roleBadgeText}>{(user?.role || 'Staff').toUpperCase()}</Text>
                            </View>
                            <Text style={styles.headerDinasText}>Dinas Kependudukan</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => navigation.navigate('Notifikasi')}
                    >
                        <Icon name="notifications" size={28} color="#64748B" />
                        <View style={styles.notifBadge} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.container}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FFB800']} />
                }
            >
                <View style={{ height: 20 }} />

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    {topStats.map((stat, idx) => (
                        <View key={idx} style={styles.statCard}>
                            <View style={styles.statTop}>
                                <View style={[styles.statIconBox, { backgroundColor: stat.color + '15' }]}>
                                    <Icon name={stat.icon} size={18} color={stat.color} />
                                </View>
                                {stat.badge !== '--' && (
                                    <View style={[styles.statBadge, { backgroundColor: stat.color + '10' }]}>
                                        <Text style={[styles.statBadgeText, { color: stat.color }]}>{stat.badge}</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.statCount}>{stat.count}</Text>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Detailed Stats Sections */}
                {statsData && (
                    <>
                        {/* Summary Section */}
                        <View style={styles.summaryBg}>
                            <Text style={styles.summaryTitle}>Ringkasan Sistem</Text>
                            <View style={styles.summaryRow}>
                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryValue}>{statsData.totalUser}</Text>
                                    <Text style={styles.summaryLabel}>Total Pengguna</Text>
                                </View>
                                <View style={styles.dividerVertical} />
                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryValue}>{statsData.totalEvent}</Text>
                                    <Text style={styles.summaryLabel}>Total Event</Text>
                                </View>
                                <View style={styles.dividerVertical} />
                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryValue}>{statsData.totalLayanan}</Text>
                                    <Text style={styles.summaryLabel}>Total Layanan</Text>
                                </View>
                            </View>
                        </View>

                        {/* Registration History Chart */}
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionIndicator, { backgroundColor: '#10B981' }]} />
                            <Text style={styles.sectionTitle}>Riwayat Registrasi User</Text>
                        </View>
                        <View style={styles.chartContainer}>
                            <LineChart
                                style={styles.chart}
                                data={{
                                    dataSets: [{
                                        values: (statsData.userRegistrationHistory || []).slice(-7).map(h => ({ y: Number(h.count || 0) })),
                                        label: 'Registrasi User',
                                        config: {
                                            lineWidth: 2,
                                            drawCircles: true,
                                            circleRadius: 5,
                                            circleColor: processColor('#10B981'),
                                            color: processColor('#10B981'),
                                            drawFilled: true,
                                            fillColor: processColor('#10B981'),
                                            fillAlpha: 50,
                                            valueTextSize: 10,
                                            valueFormatter: "###",
                                        }
                                    }]
                                }}
                                xAxis={{
                                    valueFormatter: statsData.userRegistrationHistory.slice(-5).map(h => h.date.split('-').slice(2).join('/')),
                                    position: 'BOTTOM',
                                    granularityEnabled: true,
                                    granularity: 1,
                                    drawGridLines: false,
                                }}
                                yAxis={{
                                    left: {
                                        drawGridLines: true,
                                        gridColor: processColor('#F1F5F9'),
                                        granularityEnabled: true,
                                        granularity: 1,
                                    },
                                    right: {
                                        enabled: false
                                    }
                                }}
                                chartDescription={{ text: '' }}
                                legend={{ enabled: false }}
                                marker={{
                                    enabled: true,
                                    markerColor: processColor('#1E293B'),
                                    textColor: processColor('#FFFFFF'),
                                }}
                                touchEnabled={true}
                                dragEnabled={true}
                                scaleXEnabled={true}
                                scaleYEnabled={false}
                                pinchZoom={true}
                            />
                        </View>

                        {/* Status Stats (Pie Charts) */}
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionIndicator, { backgroundColor: '#F59E0B' }]} />
                            <Text style={styles.sectionTitle}>Status Laporan & Darurat</Text>
                        </View>
                        <View style={styles.pieChartsRow}>
                            <View style={styles.pieChartContainer}>
                                <Text style={styles.pieChartLabel}>Status Pengaduan</Text>
                                <PieChart
                                    style={styles.smallPie}
                                    logEnabled={false}
                                    chartBackgroundColor={processColor('#FFFFFF')}
                                    chartDescription={{ text: '' }}
                                    data={{
                                        dataSets: [{
                                            values: (statsData.feedbackPerStatus || []).map(s => ({ value: Number(s.count || 0), label: s.status })),
                                            label: '',
                                            config: {
                                                colors: [processColor('#F59E0B'), processColor('#3B82F6'), processColor('#10B981')],
                                                valueTextSize: 10,
                                                valueTextColor: processColor('#FFFFFF'),
                                                sliceSpace: 2,
                                                selectionShift: 5,
                                            }
                                        }]
                                    }}
                                    legend={{
                                        enabled: true,
                                        textSize: 8,
                                        form: 'CIRCLE',
                                        horizontalAlignment: "CENTER",
                                        verticalAlignment: "BOTTOM",
                                        orientation: "HORIZONTAL",
                                        wordWrapEnabled: true
                                    }}
                                    entryLabelColor={processColor('#00000000')}
                                    holeRadius={40}
                                    transparentCircleRadius={45}
                                    holeColor={processColor('#FFFFFF')}
                                />
                            </View>
                            <View style={styles.pieChartContainer}>
                                <Text style={styles.pieChartLabel}>Status Darurat</Text>
                                <PieChart
                                    style={styles.smallPie}
                                    logEnabled={false}
                                    chartBackgroundColor={processColor('#FFFFFF')}
                                    chartDescription={{ text: '' }}
                                    data={{
                                        dataSets: [{
                                            values: (statsData.notifikasiPerStatus || []).map(s => ({ value: Number(s.count || 0), label: s.status })),
                                            label: '',
                                            config: {
                                                colors: [processColor('#EF4444'), processColor('#3B82F6'), processColor('#10B981')],
                                                valueTextSize: 10,
                                                valueTextColor: processColor('#FFFFFF'),
                                                sliceSpace: 2,
                                                selectionShift: 5,
                                            }
                                        }]
                                    }}
                                    legend={{
                                        enabled: true,
                                        textSize: 8,
                                        form: 'CIRCLE',
                                        horizontalAlignment: "CENTER",
                                        verticalAlignment: "BOTTOM",
                                        orientation: "HORIZONTAL",
                                        wordWrapEnabled: true
                                    }}
                                    entryLabelColor={processColor('#00000000')}
                                    holeRadius={40}
                                    transparentCircleRadius={45}
                                    holeColor={processColor('#FFFFFF')}
                                />
                            </View>
                        </View>

                        {/* Top Dinas Notifications (Darurat) */}
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionIndicator, { backgroundColor: '#EF4444' }]} />
                            <Text style={styles.sectionTitle}>Darurat Terbanyak (Dinas)</Text>
                        </View>
                        <View style={styles.horizontalCardContainer}>
                            {statsData.top5DinasNotifikasi.map((item, idx) => (
                                <View key={idx} style={styles.rankCard}>
                                    <View style={styles.rankNumberBox}>
                                        <Text style={styles.rankNumber}>{idx + 1}</Text>
                                    </View>
                                    <View style={styles.rankContent}>
                                        <View style={styles.papanContainer}>
                                            <View style={[styles.papanProgress, {
                                                width: `${(item.count / (statsData.top5DinasNotifikasi[0].count || 1)) * 100}%`,
                                                backgroundColor: '#EF4444'
                                            }]} />
                                            <View style={styles.papanTextContent}>
                                                <Text style={styles.papanLabel} numberOfLines={1}>{item.dinasNama}</Text>
                                                <Text style={styles.papanCount}>{item.count} Laporan</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Top Dinas Services */}
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionIndicator, { backgroundColor: '#3B82F6' }]} />
                            <Text style={styles.sectionTitle}>Layanan Teraktif (Dinas)</Text>
                        </View>
                        <View style={styles.horizontalCardContainer}>
                            {statsData.top5DinasLayanan.map((item, idx) => (
                                <View key={idx} style={styles.rankCard}>
                                    <View style={[styles.rankNumberBox, { backgroundColor: '#3B82F6' }]}>
                                        <Text style={styles.rankNumber}>{idx + 1}</Text>
                                    </View>
                                    <View style={styles.rankContent}>
                                        <View style={styles.papanContainer}>
                                            <View style={[styles.papanProgress, {
                                                width: `${(item.count / (statsData.top5DinasLayanan[0].count || 1)) * 100}%`,
                                                backgroundColor: '#3B82F6'
                                            }]} />
                                            <View style={styles.papanTextContent}>
                                                <Text style={styles.papanLabel} numberOfLines={1}>{item.dinasNama}</Text>
                                                <Text style={styles.papanCount}>{item.count} Layanan</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                        {/* Top Layanan Feedback (Bar Chart) */}
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionIndicator, { backgroundColor: '#8B5CF6' }]} />
                            <Text style={styles.sectionTitle}>Layanan Terpopuler (Feedback)</Text>
                        </View>
                        <View style={styles.barChartContainer}>
                            <BarChart
                                style={styles.chart}
                                data={{
                                    dataSets: [{
                                        values: (statsData.top5LayananFeedback || []).map(l => ({ y: Number(l.count || 0) })),
                                        label: 'Jumlah Masukan',
                                        config: {
                                            color: processColor('#8B5CF6'),
                                            barShadowColor: processColor('#F1F5F9'),
                                            highlightAlpha: 90,
                                            highlightColor: processColor('#7C3AED'),
                                            valueTextSize: 10,
                                            valueFormatter: "###",
                                        }
                                    }]
                                }}
                                xAxis={{
                                    valueFormatter: (statsData.top5LayananFeedback || []).map(l => (l.layananNama || '').substring(0, 10) + '..'),
                                    position: 'BOTTOM',
                                    granularityEnabled: true,
                                    granularity: 1,
                                    drawGridLines: false,
                                    labelRotationAngle: -45,
                                }}
                                yAxis={{
                                    left: {
                                        drawGridLines: true,
                                        gridColor: processColor('#F1F5F9'),
                                        granularityEnabled: true,
                                        granularity: 1,
                                    },
                                    right: {
                                        enabled: false
                                    }
                                }}
                                chartDescription={{ text: '' }}
                                legend={{ enabled: false }}
                            />
                        </View>
                    </>
                )}

                {/* Modules Section */}
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionIndicator} />
                    <Text style={styles.sectionTitle}>Modul Internal</Text>
                    <TouchableOpacity style={styles.filterBtn}>
                        <Icon name="options-outline" size={16} color="#64748B" />
                        <Text style={styles.filterBtnText}>Atur</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.modulesGrid}>
                    {modules.map((mod, idx) => (
                        <TouchableOpacity key={idx} style={styles.moduleItem}>
                            <View style={styles.moduleIconBox}>
                                <Icon name={mod.icon} size={24} color="#334155" />
                            </View>
                            <Text style={styles.moduleLabel}>{mod.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Tasks Section */}
                <View style={styles.sectionHeader}>
                    <View style={[styles.sectionIndicator, { backgroundColor: '#EF4444' }]} />
                    <Text style={styles.sectionTitle}>Perlu Tindak Lanjut</Text>
                    <Icon name="filter-outline" size={20} color="#64748B" />
                </View>

                <View style={styles.filterRow}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {['Semua', 'Mendesak', 'Verifikasi', 'Laporan'].map((f, i) => (
                            <TouchableOpacity key={i} style={[styles.filterChip, i === 0 && styles.filterChipActive]}>
                                <Text style={[styles.filterChipText, i === 0 && styles.filterChipTextActive]}>{f}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.taskList}>
                    {tasks.map((task) => (
                        <TouchableOpacity key={task.id} style={styles.taskCard}>
                            <View style={[styles.taskIndicator, { backgroundColor: task.color }]} />
                            <View style={[styles.taskIconBox, { backgroundColor: task.color + '10' }]}>
                                <Icon name={task.icon === 'person-badge' ? 'person' : task.icon === 'file-text' ? 'document-text' : 'alert-circle'} size={24} color={task.color} />
                            </View>
                            <View style={styles.taskContent}>
                                <View style={styles.taskHeader}>
                                    <Text style={styles.taskId}>#{task.id} • <Text style={{ color: task.color }}>{task.type}</Text></Text>
                                    <Icon name="ellipsis-vertical" size={16} color="#CBD5E1" />
                                </View>
                                <Text style={styles.taskTitle}>{task.title}</Text>
                                <Text style={styles.taskFooter}>Pelapor: {task.reporter} • {task.time}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FCFDFF',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 0,
        paddingBottom: 0,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        height: 100, // Sedikit disesuaikan karena sekarang 3 baris
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarMain: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#F1F5F9',
        marginRight: 16,
        borderWidth: 2,
        borderColor: '#F1F5F9',
    },
    headerGreeting: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
        lineHeight: 22,
    },
    subtitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    roleBadge: {
        backgroundColor: '#FFB800', // Kuning Kab KNG
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 10,
    },
    roleBadgeText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#334155', // Black for contrast on Yellow
    },
    headerDinasText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#64748B',
    },
    titleContainer: {
        justifyContent: 'center',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        marginRight: 16,
        position: 'relative',
    },
    notifBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
        borderWidth: 1,
        borderColor: '#FFFFFF',
    },
    container: {
        flex: 1,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        marginHorizontal: 20,
        paddingHorizontal: 16,
        height: 50,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 24,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        color: '#0F172A',
    },
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    statCard: {
        width: (width - 60) / 3,
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    statTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statIconBox: {
        width: 30,
        height: 30,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statBadgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    statCount: {
        fontSize: 22,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94A3B8',
        lineHeight: 14,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    sectionIndicator: {
        width: 4,
        height: 16,
        backgroundColor: '#FFB800',
        borderRadius: 2,
        marginRight: 10,
    },
    sectionTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
    },
    filterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
    },
    filterBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
        marginLeft: 4,
    },
    modulesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 15,
        marginBottom: 32,
    },
    moduleItem: {
        width: (width - 30) / 4,
        alignItems: 'center',
        padding: 5,
    },
    moduleIconBox: {
        width: 56,
        height: 56,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        marginBottom: 8,
        // Small shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    moduleLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 14,
    },
    filterRow: {
        paddingLeft: 20,
        marginBottom: 16,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginRight: 8,
    },
    filterChipActive: {
        backgroundColor: '#0F172A',
        borderColor: '#0F172A',
    },
    filterChipText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
    },
    filterChipTextActive: {
        color: '#FFFFFF',
    },
    taskList: {
        paddingHorizontal: 20,
    },
    taskCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        position: 'relative',
        overflow: 'hidden',
    },
    taskIndicator: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
    },
    taskIconBox: {
        width: 48,
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    taskContent: {
        flex: 1,
    },
    taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    taskId: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94A3B8',
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 4,
    },
    taskFooter: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    },
    // New Statistics Styles
    horizontalCardContainer: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    rankCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    rankNumberBox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    rankNumber: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '900',
    },
    rankContent: {
        flex: 1,
    },
    papanContainer: {
        height: 44,
        backgroundColor: '#F1F5F9', // Light gray background
        borderRadius: 10,
        position: 'relative',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    papanProgress: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        borderRadius: 0,
        opacity: 0.2, // 20% opacity so text is still visible over the bar
    },
    papanTextContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        zIndex: 1,
    },
    papanLabel: {
        fontSize: 13,
        fontWeight: '900',
        color: '#1E293B', // Dark text for light background
        flex: 1,
        marginRight: 8,
    },
    papanCount: {
        fontSize: 11,
        fontWeight: '900',
        color: '#475569', // Semi-dark text
    },
    summaryBg: {
        backgroundColor: '#1E293B',
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 16,
        marginBottom: 32,
    },
    summaryTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
        marginBottom: 16,
        textAlign: 'center',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryItem: {
        alignItems: 'center',
        flex: 1,
    },
    summaryValue: {
        color: '#FFB800',
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 4,
    },
    summaryLabel: {
        color: '#94A3B8',
        fontSize: 10,
        fontWeight: '700',
        textAlign: 'center',
    },
    dividerVertical: {
        width: 1,
        height: 30,
        backgroundColor: '#334155',
    },
    chartContainer: {
        marginHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 10,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        height: 250,
    },
    chart: {
        flex: 1,
    },
    pieChartsRow: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    pieChartContainer: {
        width: (width - 50) / 2,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        alignItems: 'center',
        height: 220,
    },
    pieChartLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 10,
        textAlign: 'center',
    },
    smallPie: {
        flex: 1,
        width: '100%',
    },
    barChartContainer: {
        marginHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 15,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        height: 280,
    },
});
