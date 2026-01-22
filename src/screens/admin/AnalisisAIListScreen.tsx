import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import useAnalisisAIStore from '../../stores/analisisAIStore';
import { AnalisisAI } from '../../types/analisis';
import useAuthStore from '../../stores/authStore';
import { Role } from '../../types/auth';

export default function AnalisisAIListScreen() {
    const navigation = useNavigation<any>();
    const { list, loading, fetchAnalisis, loadMoreAnalisis } = useAnalisisAIStore();
    const user = useAuthStore(state => state.user);

    useEffect(() => {
        fetchAnalisis();
    }, []);

    const renderItem = ({ item }: { item: AnalisisAI }) => {
        // Determine color/icon based on category
        let color = '#64748B';
        let icon = 'document-text-outline';
        
        if (item.kategori === 'PENGADUAN') {
            color = '#3B82F6'; // Blue
            icon = 'alert-circle-outline';
        } else if (item.kategori === 'DARURAT') {
            color = '#EF4444'; // Red
            icon = 'warning-outline';
        } else if (item.kategori === 'FEEDBACK') {
            color = '#10B981'; // Green
            icon = 'chatbubbles-outline';
        }

        return (
            <TouchableOpacity 
                style={styles.card} 
                onPress={() => navigation.navigate('AnalisisAIDetail', { item })}
            >
                <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
                    <Icon name={icon} size={24} color={color} />
                </View>
                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.badge, { backgroundColor: color }]}>
                            <Text style={styles.badgeText}>{item.kategori}</Text>
                        </View>
                        <Text style={styles.dateText}>
                            {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </Text>
                    </View>
                    <Text style={styles.snippet} numberOfLines={2}>
                        {item.hasilAnalisis}
                    </Text>
                </View>
                <Icon name="chevron-forward" size={20} color="#CBD5E1" />
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFB800" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Analisis AI</Text>
                    <Text style={styles.headerSubtitle}>Hasil analisis otomatis</Text>
                </View>
                {/* Only SUPERADMIN can create new analysis */
                (user?.role === Role.SUPERADMIN || user?.role === Role.EXECUTIVE) && (
                    <TouchableOpacity 
                        style={styles.addBtn}
                        onPress={() => navigation.navigate('CreateAnalisisAI')}
                    >
                        <Icon name="add" size={24} color="#FFF" />
                    </TouchableOpacity>
                )}
            </View>

            {loading && list.length === 0 ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#FFB800" />
                </View>
            ) : (
                <FlatList
                    data={list}
                    renderItem={renderItem}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Icon name="analytics-outline" size={64} color="#CBD5E1" />
                            <Text style={styles.emptyText}>Belum ada data analisis</Text>
                        </View>
                    }
                    refreshing={loading && list.length === 0}
                    onRefresh={() => fetchAnalisis(0)}
                    onEndReached={() => loadMoreAnalisis()}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                        loading && list.length > 0 ? (
                            <View style={{ padding: 16 }}>
                                <ActivityIndicator size="small" color="#FFB800" />
                            </View>
                        ) : null
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: '#FFB800',
        paddingTop: 48,
        paddingBottom: 24,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#334155',
        marginTop: 2,
    },
    addBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#10B981', // Green for Add
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        padding: 20,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardContent: {
        flex: 1,
        marginRight: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFF',
    },
    dateText: {
        fontSize: 10,
        color: '#94A3B8',
    },
    snippet: {
        fontSize: 12,
        color: '#334155',
        lineHeight: 18,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 16,
        color: '#94A3B8',
        fontSize: 14,
    }
});
