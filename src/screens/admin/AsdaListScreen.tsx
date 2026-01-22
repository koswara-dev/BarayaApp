import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import useAsdaStore from '../../stores/asdaStore';
import { useDebounce } from 'use-debounce';
import { getImageUrl } from '../../config/api';
import { usePermissions } from '../../hooks/usePermissions';
import { Role } from '../../types/auth';

export default function AsdaListScreen() {
    const navigation = useNavigation<any>();
    const { asdaList, fetchAsda, loading, hasMore } = useAsdaStore();
    const { hasRole } = usePermissions();
    const canManage = hasRole([Role.SUPERADMIN, Role.EXECUTIVE, Role.ADMIN]);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch] = useDebounce(searchQuery, 500);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchAsda(0, 10, debouncedSearch);
    }, [debouncedSearch]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchAsda(0, 10, debouncedSearch);
        setRefreshing(false);
    };

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            fetchAsda(undefined, 10, debouncedSearch, true);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('AsdaDetail', { id: item.id })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                     {item.userUrlFoto ? (
                        <Image
                            source={{ uri: getImageUrl(item.userUrlFoto) }}
                            style={styles.avatarImage}
                        />
                    ) : (
                        <Icon name="person" size={24} color="#F59E0B" />
                    )}
                </View>
                <View style={styles.headerText}>
                    <Text style={styles.asdaTitle} numberOfLines={2}>{item.nama}</Text>
                    <Text style={styles.asdaSubtitle}>{item.userName || 'Nama Pejabat Belum Ada'}</Text>
                </View>
                <Icon name="chevron-forward" size={20} color="#CBD5E1" />
            </View>
            
            <View style={styles.cardFooter}>
                <View style={styles.badge}>
                    <Icon name="business-outline" size={14} color="#0F172A" />
                    <Text style={styles.badgeText}>{item.dinas ? item.dinas.length : 0} Dinas Terkait</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Daftar ASDA</Text>
                {canManage && (
                    <TouchableOpacity 
                        style={styles.addButton}
                        onPress={() => navigation.navigate('CreateAsda')}
                    >
                        <Icon name="add" size={24} color="#F59E0B" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBox}>
                    <Icon name="search" size={20} color="#94A3B8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Cari Asisten Daerah..."
                        placeholderTextColor="#94A3B8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Icon name="close-circle" size={20} color="#94A3B8" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* List */}
            <FlatList
                data={asdaList}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F59E0B']} />
                }
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                    loading && !refreshing ? (
                        <View style={{ padding: 20 }}>
                            <ActivityIndicator color="#F59E0B" />
                        </View>
                    ) : null
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <Icon name="people-outline" size={48} color="#CBD5E1" />
                            <Text style={styles.emptyText}>Tidak ada data ASDA ditemukan</Text>
                        </View>
                    ) : null
                }
            />
        </SafeAreaView>
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
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
        flex: 1,
    },
    addButton: {
        padding: 4,
    },
    searchContainer: {
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 48,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        color: '#0F172A',
    },
    listContent: {
        padding: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        // Shadow matches WelcomeScreen aesthetic
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFFBEB',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: '#FEF3C7',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    headerText: {
        flex: 1,
        marginRight: 12,
    },
    asdaTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 4,
        lineHeight: 20,
    },
    asdaSubtitle: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F8FAFC',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    badgeText: {
        fontSize: 11,
        color: '#475569',
        fontWeight: '600',
        marginLeft: 6,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyText: {
        marginTop: 16,
        color: '#94A3B8',
        fontSize: 14,
    },
});
