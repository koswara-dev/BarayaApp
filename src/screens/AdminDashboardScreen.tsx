import React from 'react';
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
    Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import useAuthStore from '../stores/authStore';
import useUserStore from '../stores/userStore';

const { width } = Dimensions.get('window');

export default function AdminDashboardScreen() {
    const user = useAuthStore((state) => state.user);
    const { profile } = useUserStore();

    const stats = [
        { label: 'PENGADUAN MASUK', count: 12, badge: '+5', color: '#EF4444', icon: 'chatbox' },
        { label: 'DALAM PROSES', count: 28, badge: '--', color: '#F59E0B', icon: 'time' },
        { label: 'SELESAI HARI INI', count: 45, badge: '98%', color: '#10B981', icon: 'checkmark-circle' },
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

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.logoBox}>
                        <Text style={styles.logoText}>KAB</Text>
                        <Text style={styles.logoText}>KNG</Text>
                    </View>
                    <View style={styles.titleContainer}>
                        <Text style={styles.headerTitle}>Dashboard Internal</Text>
                        <Text style={styles.headerSubtitle}>KUNINGAN SMART SERVICE</Text>
                    </View>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.iconButton}>
                        <Icon name="notifications" size={24} color="#64748B" />
                        <View style={styles.notifBadge} />
                    </TouchableOpacity>
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' }}
                        style={styles.avatar}
                    />
                </View>
            </View>

            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Greeting */}
                <View style={styles.greetingSection}>
                    <Text style={styles.greetingName}>Halo, {user?.fullName || 'Admin'}</Text>
                    <Text style={styles.greetingRole}>
                        {(user?.role || 'Staff').charAt(0).toUpperCase() + (user?.role || 'Staff').slice(1).toLowerCase()} - Kuningan Smart Service
                    </Text>
                </View>

                {/* Search */}
                <View style={styles.searchContainer}>
                    <Icon name="search-outline" size={20} color="#94A3B8" />
                    <TextInput
                        placeholder="Cari layanan, nomor tiket, atau laporan..."
                        placeholderTextColor="#94A3B8"
                        style={styles.searchInput}
                    />
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    {stats.map((stat, idx) => (
                        <View key={idx} style={styles.statCard}>
                            <View style={styles.statTop}>
                                <View style={[styles.statIconBox, { backgroundColor: stat.color + '15' }]}>
                                    <Icon name={stat.icon} size={18} color={stat.color} />
                                </View>
                                <View style={[styles.statBadge, { backgroundColor: stat.color + '10' }]}>
                                    <Text style={[styles.statBadgeText, { color: stat.color }]}>{stat.badge}</Text>
                                </View>
                            </View>
                            <Text style={styles.statCount}>{stat.count}</Text>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                        </View>
                    ))}
                </View>

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
        </SafeAreaView>
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoBox: {
        width: 36,
        height: 36,
        backgroundColor: '#FFB800',
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    logoText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#000000',
        lineHeight: 12,
    },
    titleContainer: {
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1E293B',
    },
    headerSubtitle: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94A3B8',
        letterSpacing: 0.5,
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
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
    },
    container: {
        flex: 1,
    },
    greetingSection: {
        paddingHorizontal: 20,
        paddingTop: 24,
        marginBottom: 20,
    },
    greetingName: {
        fontSize: 24,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 4,
    },
    greetingRole: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
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
});
