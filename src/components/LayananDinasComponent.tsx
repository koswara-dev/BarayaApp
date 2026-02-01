import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import useLayananStore from '../stores/layananStore';
import { getImageUrl } from '../config/api';

interface Props {
    dinasId: number;
}

const LayananDinasComponent: React.FC<Props> = ({ dinasId }) => {
    const navigation = useNavigation<any>();
    const { layanan, fetchLayanan, loading } = useLayananStore();

    useEffect(() => {
        if (dinasId) {
            fetchLayanan({ dinasId, size: 10, ignoreAuthDinasId: true });
        }
    }, [dinasId]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                 <ActivityIndicator size="small" color="#F59E0B" />
                 <Text style={styles.loadingText}>Memuat layanan...</Text>
            </View>
        );
    }

    if (!layanan || layanan.length === 0) {
        // If empty, we prefer not to show the section or show an empty state. 
        // Showing empty state inside the component:
        return (
             <View style={styles.section}>
                <View style={styles.iconHeader}>
                    <Icon name="briefcase-outline" size={20} color="#8B5CF6" />
                    <Text style={styles.sectionTitle}>Layanan</Text>
                </View>
                <Text style={styles.emptyText}>Belum ada layanan tersedia di instansi ini.</Text>
            </View>
        );
    }

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('ServiceDetail', { service: item })}
        >
            <View style={styles.imageContainer}>
                {item.urlGambar ? (
                     <Image 
                        source={{ uri: getImageUrl(item.urlGambar) }} 
                        style={styles.cardImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.cardImage, styles.placeholderImage]}>
                         <Icon name="construct-outline" size={32} color="#CBD5E1" />
                    </View>
                )}
            </View>
            
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.nama}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>
                    {item.deskripsi || 'Tidak ada deskripsi'}
                </Text>
                 <View style={styles.cardFooter}>
                    <View style={styles.badge}>
                        <Icon name="time-outline" size={12} color="#B45309" />
                        <Text style={styles.badgeText}>{item.estimasiWaktu || '-'} hari</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <View style={styles.iconHeader}>
                    <Icon name="briefcase-outline" size={20} color="#8B5CF6" />
                    <Text style={styles.sectionTitle}>Layanan Tersedia</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('LayananList', { dinasId })}>
                    <Text style={styles.seeAllText}>Lihat Semua</Text>
                </TouchableOpacity>
            </View>
            
            <FlatList
                data={layanan}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                style={styles.flatList}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingVertical: 20,
        marginHorizontal: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    iconHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
    },
    seeAllText: {
        fontSize: 12,
        color: '#F59E0B',
        fontWeight: '600',
    },
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8
    },
    loadingText: {
        color: '#64748B',
        fontSize: 14,
    },
    emptyText: {
        color: '#94A3B8',
        fontStyle: 'italic',
        fontSize: 14,
    },
    listContent: {
        paddingHorizontal: 20,
        gap: 12
    },
    card: {
        width: 180,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    imageContainer: {
        height: 100,
        width: '100%',
        backgroundColor: '#E2E8F0',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardContent: {
        padding: 12,
        flex: 1,
        justifyContent: 'space-between'
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 4,
        lineHeight: 20,
        height: 44, 
    },
    cardDesc: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 8,
        lineHeight: 18,
        height: 40,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        gap: 4,
        alignSelf: 'flex-start'
    },
    badgeText: {
        fontSize: 10,
        color: '#B45309',
        fontWeight: '600',
    },
    flatList: {
        height: 270,
        flexGrow: 0
    }
});

export default LayananDinasComponent;
