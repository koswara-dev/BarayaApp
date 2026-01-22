import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Image,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import useCamatStore from '../../stores/camatStore';
import { getImageUrl } from '../../config/api';
import { usePermissions } from '../../hooks/usePermissions';
import { Role } from '../../types/auth';

export default function CamatDetailScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { id } = route.params;
    const { getKecamatanById } = useCamatStore();
    const [camat, setCamat] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { hasRole } = usePermissions();
    const canManage = hasRole([Role.SUPERADMIN, Role.EXECUTIVE, Role.ADMIN]);

    useEffect(() => {
        loadData();
    }, [id]);

    // Reload on focus if returning from edit
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
             if (camat) loadData();
        });
        return unsubscribe;
    }, [navigation, camat]);

    const loadData = async () => {
        setLoading(true);
        const data = await getKecamatanById(id);
        setCamat(data);
        setLoading(false);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F59E0B" />
            </View>
        );
    }

    if (!camat) {
        return (
            <View style={styles.errorContainer}>
                <Icon name="alert-circle-outline" size={48} color="#EF4444" />
                <Text style={styles.errorText}>Data tidak ditemukan</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>Kembali</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
            
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header Profile Section */}
                <View style={styles.profileHeader}>
                    <TouchableOpacity 
                        style={styles.headerBackBtn}
                        onPress={() => navigation.goBack()}
                    >
                        <Icon name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>

                    <View style={styles.profileContent}>
                        <View style={styles.avatarContainer}>
                            {camat.userUrlFoto ? (
                                <Image 
                                    source={{ uri: getImageUrl(camat.userUrlFoto) }} 
                                    style={styles.avatar} 
                                />
                            ) : (
                                <Icon name="person" size={40} color="#F59E0B" />
                            )}
                        </View>
                        <Text style={styles.profileName}>{camat.userName || 'Nama Belum Ada'}</Text>
                        <Text style={styles.profileRole} numberOfLines={2}>Camat {camat.kecamatan}</Text>
                    </View>

                    {/* Decorative Circles similar to WelcomeScreen */}
                    <View style={styles.circle1} />
                    <View style={styles.circle2} />

                    {canManage && (
                        <TouchableOpacity 
                            style={styles.editButton}
                            onPress={() => navigation.navigate('CreateCamat', { item: camat })}
                        >
                             <Icon name="create-outline" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Content Section */}
                <View style={styles.contentSection}>
                    
                    <Text style={styles.sectionTitle}>Informasi Kecamatan</Text>
                    
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <View style={styles.iconBox}>
                                <Icon name="map-outline" size={20} color="#F59E0B" />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Nama Kecamatan</Text>
                                <Text style={styles.infoValue}>{camat.kecamatan}</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.infoRow}>
                            <View style={styles.iconBox}>
                                <Icon name="location-outline" size={20} color="#F59E0B" />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Alamat Kantor</Text>
                                <Text style={styles.infoValue}>{camat.alamatKantor || '-'}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FCFDFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        marginTop: 12,
        marginBottom: 20,
        color: '#64748B',
    },
    backBtn: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
    },
    backBtnText: {
        color: '#0F172A',
        fontWeight: '600',
    },
    
    // Header Styles
    profileHeader: {
        backgroundColor: '#0F172A',
        paddingTop: 20,
        paddingBottom: 40,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        position: 'relative',
        overflow: 'hidden',
    },
    headerBackBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    profileContent: {
        alignItems: 'center',
        zIndex: 10,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFFBEB',
        borderWidth: 3,
        borderColor: '#F59E0B',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    profileName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8,
        textAlign: 'center',
    },
    profileRole: {
        fontSize: 13,
        color: '#CBD5E1',
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 20,
    },
    
    // Decorative Bg
    circle1: {
        position: 'absolute',
        top: -50,
        right: -50,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    circle2: {
        position: 'absolute',
        bottom: -20,
        left: -20,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(245, 158, 11, 0.1)', // Amber tint
    },

    // Content
    contentSection: {
        padding: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 16,
    },
    infoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#FFFBEB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 16,
    },
    editButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
    },
});
