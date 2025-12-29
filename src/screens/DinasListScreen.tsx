import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
    StatusBar,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import useLayananStore from '../stores/layananStore';
import SkeletonShimmer from '../components/SkeletonShimmer';

// Skeleton Card for Dinas
const DinasCardSkeleton = () => (
    <View style={styles.card}>
        <View style={styles.cardHeader}>
            <SkeletonShimmer style={styles.iconBox} />
            <View style={styles.titleBox}>
                <SkeletonShimmer style={{ width: '80%', height: 14, marginBottom: 4 }} />
                <SkeletonShimmer style={{ width: '50%', height: 12 }} />
            </View>
        </View>
        <View style={styles.cardBody}>
            <View style={styles.infoRow}>
                <SkeletonShimmer style={{ width: 14, height: 14 }} />
                <SkeletonShimmer style={{ width: '70%', height: 12, marginLeft: 8 }} />
            </View>
            <View style={styles.infoRow}>
                <SkeletonShimmer style={{ width: 14, height: 14 }} />
                <SkeletonShimmer style={{ width: '50%', height: 12, marginLeft: 8 }} />
            </View>
        </View>
    </View>
);

import { PermissionGuard } from '../components/PermissionGuard';
import { Role } from '../types/auth';

export default function DinasListScreen() {
    const navigation = useNavigation<any>();
    const { dinas, loading, fetchDinas } = useLayananStore();
    const [refreshing, setRefreshing] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            await fetchDinas();
            setIsInitialLoad(false);
        };
        loadData();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchDinas();
        setRefreshing(false);
    };

    const showSkeleton = isInitialLoad && loading;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Daftar Dinas</Text>
                <View style={styles.headerBtn}>
                    <PermissionGuard allowedRoles={[Role.SUPERADMIN]}>
                        <TouchableOpacity onPress={() => navigation.navigate('CreateDinas')}>
                            <Icon name="add-circle" size={28} color="#F59E0B" />
                        </TouchableOpacity>
                    </PermissionGuard>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F59E0B']} />
                }
            >
                {showSkeleton ? (
                    <View style={styles.list}>
                        {[1, 2, 3, 4].map((_, index) => (
                            <DinasCardSkeleton key={index} />
                        ))}
                    </View>
                ) : dinas.length === 0 && !loading ? (
                    <View style={styles.emptyContainer}>
                        <Icon name="business-outline" size={64} color="#E2E8F0" />
                        <Text style={styles.emptyText}>Belum ada data dinas</Text>
                    </View>
                ) : (
                    <View style={styles.list}>
                        {dinas.map((item) => (
                            <View key={item.id} style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.iconBox}>
                                        <Icon name="business" size={24} color="#F59E0B" />
                                    </View>
                                    <View style={styles.titleBox}>
                                        <Text style={styles.dinasName}>{item.nama}</Text>
                                        <Text style={styles.kadisName}>Kadis: {item.namaKadis || '-'}</Text>
                                    </View>
                                </View>
                                <View style={styles.cardBody}>
                                    <View style={styles.infoRow}>
                                        <Icon name="location-outline" size={14} color="#64748B" />
                                        <Text style={styles.infoText}>{item.alamat || 'Alamat tidak tersedia'}</Text>
                                    </View>
                                    {item.website && (
                                        <View style={styles.infoRow}>
                                            <Icon name="globe-outline" size={14} color="#64748B" />
                                            <Text style={styles.infoText}>{item.website}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {loading && !isInitialLoad && (
                    <View style={styles.loadingFooter}>
                        <ActivityIndicator color="#F59E0B" />
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FCFDFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "900",
        color: "#0F172A",
    },
    content: {
        flex: 1,
    },
    list: {
        paddingVertical: 16,
    },
    card: {
        backgroundColor: '#FFFFFF',
        marginBottom: 8,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#F1F5F9',
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    iconBox: {
        width: 48,
        height: 48,
        backgroundColor: '#FFFBEB',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    titleBox: {
        flex: 1,
        justifyContent: 'center',
    },
    dinasName: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1E293B',
        textTransform: 'uppercase',
    },
    kadisName: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
        marginTop: 2,
    },
    cardBody: {
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 6,
        gap: 8,
    },
    infoText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
        flex: 1,
    },
    emptyContainer: {
        paddingTop: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        marginTop: 16,
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: '600',
    },
    loadingFooter: {
        paddingVertical: 20,
    }
});
