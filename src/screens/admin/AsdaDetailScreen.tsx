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
    Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import useAsdaStore from '../../stores/asdaStore';
import { getImageUrl } from '../../config/api';
import { usePermissions } from '../../hooks/usePermissions';
import { Role } from '../../types/auth';

export default function AsdaDetailScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { id } = route.params;
    const { getAsdaById } = useAsdaStore();
    const [asda, setAsda] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { hasRole } = usePermissions();
    const canManage = hasRole([Role.SUPERADMIN, Role.EXECUTIVE, Role.ADMIN]);

    useEffect(() => {
        loadData();
    }, [id]);

    // Refresh when navigating back from edit
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
             if (asda) loadData(); // Reload if we already loaded once
        });
        return unsubscribe;
    }, [navigation, asda]);

    const loadData = async () => {
        setLoading(true);
        const data = await getAsdaById(id);
        setAsda(data);
        setLoading(false);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F59E0B" />
            </View>
        );
    }

    if (!asda) {
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
                            {asda.userUrlFoto ? (
                                <Image 
                                    source={{ uri: getImageUrl(asda.userUrlFoto) }} 
                                    style={styles.avatar} 
                                />
                            ) : (
                                <Icon name="person" size={40} color="#F59E0B" />
                            )}
                        </View>
                        <Text style={styles.profileName}>{asda.userName || 'Nama Belum Ada'}</Text>
                        <Text style={styles.profileRole} numberOfLines={2}>{asda.nama}</Text>
                    </View>

                    {/* Decorative Circles similar to WelcomeScreen */}
                    <View style={styles.circle1} />
                    <View style={styles.circle2} />

                    {canManage && (
                        <TouchableOpacity 
                            style={styles.editButton}
                            onPress={() => navigation.navigate('CreateAsda', { item: asda })}
                        >
                             <Icon name="create-outline" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Content Section */}
                <View style={styles.contentSection}>
                    
                    {/* Dinas List Section */}
                    <Text style={styles.sectionTitle}>Dinas Terkait</Text>
                    <Text style={styles.sectionSubtitle}>
                        Daftar perangkat daerah di bawah koordinasi asisten ini.
                    </Text>

                    <View style={styles.dinasList}>
                        {asda.dinas && asda.dinas.length > 0 ? (
                            asda.dinas.map((d: any, index: number) => (
                                <View key={index} style={styles.dinasCard}>
                                    <View style={styles.dinasIconBox}>
                                        <Icon name="business" size={20} color="#F59E0B" />
                                    </View>
                                    <View style={styles.dinasContent}>
                                        <Text style={styles.dinasName}>{d.dinasNama}</Text>
                                        <Text style={styles.dinasKadis}>
                                            <Icon name="person-outline" size={12} color="#64748B" /> {d.dinasNamaKadis}
                                        </Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyDinas}>
                                <Text style={styles.emptyDinasText}>Belum ada dinas terkait</Text>
                            </View>
                        )}
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
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 20,
    },
    dinasList: {
        gap: 12,
    },
    dinasCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
    },
    dinasIconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#FFFBEB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    dinasContent: {
        flex: 1,
    },
    dinasName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
        lineHeight: 18,
    },
    dinasKadis: {
        fontSize: 11,
        color: '#64748B',
    },
    emptyDinas: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
    },
    emptyDinasText: {
        color: '#94A3B8',
        fontSize: 12,
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
