import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    Platform,
    StatusBar,
    Alert,
    Dimensions,
    ActivityIndicator,
    TextInput,
    Linking
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { getImageUrl } from '../config/api';
import useAuthStore from '../stores/authStore';
import { Role } from '../types/auth';
import useDinasStore, { DinasItem } from '../stores/dinasStore';
import useToastStore from '../stores/toastStore';

const { width } = Dimensions.get('window');

export default function DinasDetailScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { item, id } = route.params || {};

    const { user } = useAuthStore();
    const { updateDinas, getDinasById } = useDinasStore();
    const showToast = useToastStore(state => state.showToast);

    // Permissions
    const canEdit = user?.role === Role.SUPERADMIN || user?.role === Role.ADMIN;

    // State
    const [dinas, setDinas] = useState<DinasItem | null>(item || null);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        nama: '',
        deskripsi: '',
        alamat: '',
        website: '',
        namaKadis: '',
        jenis: '',
        latitude: '',
        longitude: '',
        fotoGedung: null as any,
        fotoKadis: null as any
    });

    const handlePhotoPick = async (type: 'gedung' | 'kadis') => {
        const { launchImageLibrary } = require('react-native-image-picker');
        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 0.7,
            selectionLimit: 1,
        });

        if (result.assets && result.assets.length > 0) {
            if (type === 'gedung') {
                setFormData({ ...formData, fotoGedung: result.assets[0] });
            } else {
                setFormData({ ...formData, fotoKadis: result.assets[0] });
            }
        }
    };

    useEffect(() => {
        const load = async () => {
            if (!item && id) {
                setLoading(true);
                const data = await getDinasById(id);
                if (data) {
                    setDinas(data);
                    initForm(data);
                }
                setLoading(false);
            } else if (item) {
                initForm(item);
            }
        };
        load();
    }, [item, id]);

    const initForm = (data: DinasItem) => {
        setFormData({
            nama: data.nama || '',
            deskripsi: data.deskripsi || '',
            alamat: data.alamat || '',
            website: data.website || '',
            namaKadis: data.namaKadis || '',
            jenis: data.jenis || 'Dinas',
            latitude: data.latitude ? String(data.latitude) : '',
            longitude: data.longitude ? String(data.longitude) : '',
            fotoGedung: null,
            fotoKadis: null
        });
    };

    const handleSave = async () => {
        if (!dinas) return;

        setIsSaving(true);
        try {
            const success = await updateDinas(dinas.id, formData);
            if (success) {
                showToast('Data dinas berhasil diperbarui', 'success');
                setDinas({ ...dinas, ...formData } as DinasItem); // Optimistic update
                setIsEditing(false);
            } else {
                showToast('Gagal memperbarui data dinas', 'error');
            }
        } catch (error) {
            showToast('Terjadi kesalahan saat menyimpan', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const openMap = () => {
        if (dinas?.latitude && dinas?.longitude) {
            // Navigate to map or open external map
            navigation.navigate('MapEmergency', { 
                initialLoc: { 
                    latitude: parseFloat(dinas.latitude), 
                    longitude: parseFloat(dinas.longitude) 
                } 
            });
        } else {
            showToast('Lokasi belum tersedia', 'info');
        }
    };

    const openWebsite = () => {
        if (dinas?.website) {
            navigation.navigate('Webview', { url: dinas.website, title: dinas.nama });
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#F59E0B" />
            </View>
        );
    }

    if (!dinas) {
        return (
            <View style={styles.centerContainer}>
                <Text>Data dinas tidak ditemukan</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 10 }}>
                    <Text style={{ color: '#F59E0B'}}>Kembali</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            
            {/* Header / Hero Image */}
            <View style={styles.headerImageContainer}>
                {isEditing && formData.fotoGedung ? (
                     <Image source={{ uri: formData.fotoGedung.uri }} style={styles.headerImage} resizeMode="cover" />
                ) : dinas.urlFotoGedung ? (
                    <Image 
                        source={{ uri: getImageUrl(dinas.urlFotoGedung) }} 
                        style={styles.headerImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.headerImage, { backgroundColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' }]}>
                        <Icon name="business" size={64} color="#94A3B8" />
                    </View>
                )}
                <View style={styles.overlay} />
                
                {isEditing && (
                    <TouchableOpacity onPress={() => handlePhotoPick('gedung')} style={styles.changePhotoHeaderBtn}>
                        <Icon name="camera" size={20} color="#FFF" />
                        <Text style={styles.changePhotoText}>Ganti Foto Gedung</Text>
                    </TouchableOpacity>
                )}

                {/* Navbar */}
                <View style={styles.navbar}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Icon name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    {canEdit && (
                        <TouchableOpacity 
                            onPress={() => isEditing ? handleSave() : setIsEditing(true)} 
                            style={styles.editBtn}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="#FFF" size="small" />
                            ) : (
                                <Icon name={isEditing ? "save" : "create-outline"} size={22} color="#FFF" />
                            )}
                        </TouchableOpacity>
                    )}
                </View>

                {/* Cancel Edit Button */}
                {isEditing && (
                    <TouchableOpacity 
                        onPress={() => {
                            setIsEditing(false);
                            initForm(dinas);
                        }} 
                        style={styles.cancelBtn}
                    >
                        <Text style={styles.cancelBtnText}>Batal</Text>
                    </TouchableOpacity>
                )}

                <View style={styles.headerInfo}>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{dinas.jenis || 'Instansi'}</Text>
                    </View>
                    <Text style={styles.headerTitle} numberOfLines={2}>
                        {dinas.nama}
                    </Text>
                </View>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Kadis Info Section - Floating Card */}
                <View style={styles.floatingCard}>
                    <View style={styles.kadisRow}>
                         <View style={{ position: 'relative' }}>
                            {isEditing && formData.fotoKadis ? (
                                <Image source={{ uri: formData.fotoKadis.uri }} style={styles.avatar} />
                            ) : (
                                <Image 
                                    source={dinas.urlFotoKadis ? { uri: getImageUrl(dinas.urlFotoKadis) } : { uri: 'https://ui-avatars.com/api/?name=' + dinas.namaKadis }}
                                    style={styles.avatar}
                                />
                            )}
                            {isEditing && (
                                <TouchableOpacity onPress={() => handlePhotoPick('kadis')} style={styles.editAvatarBtn}>
                                    <Icon name="camera" size={14} color="#FFF" />
                                </TouchableOpacity>
                            )}
                        </View>
                        
                        <View style={{ flex: 1 }}>
                            <Text style={styles.kadisLabel}>Kepala Dinas / Pimpinan</Text>
                            {isEditing ? (
                                <TextInput
                                    value={formData.namaKadis}
                                    onChangeText={(text) => setFormData({ ...formData, namaKadis: text })}
                                    style={styles.input}
                                    placeholder="Nama Kepala Dinas"
                                />
                            ) : (
                                <Text style={styles.kadisName}>{dinas.namaKadis || '-'}</Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Main Info */}
                <View style={styles.section}>
                    <View style={styles.iconHeader}>
                        <Icon name="information-circle-outline" size={20} color="#F59E0B" />
                        <Text style={styles.sectionTitle}>Tentang Instansi</Text>
                    </View>
                    {isEditing ? (
                        <>
                            <Text style={styles.label}>Nama Instansi</Text>
                            <TextInput
                                value={formData.nama}
                                onChangeText={(text) => setFormData({ ...formData, nama: text })}
                                style={[styles.input, { marginBottom: 10 }]}
                                multiline
                            />
                            <Text style={styles.label}>Deskripsi</Text>
                            <TextInput
                                value={formData.deskripsi}
                                onChangeText={(text) => setFormData({ ...formData, deskripsi: text })}
                                style={[styles.input, styles.textArea]}
                                multiline
                            />
                        </>
                    ) : (
                        <Text style={styles.descriptionText}>
                            {dinas.deskripsi || 'Belum ada deskripsi untuk instansi ini.'}
                        </Text>
                    )}
                </View>

                {/* Contact & Address */}
                <View style={styles.section}>
                    <View style={styles.iconHeader}>
                        <Icon name="location-outline" size={20} color="#EF4444" />
                        <Text style={styles.sectionTitle}>Lokasi & Kontak</Text>
                    </View>
                    
                    {isEditing ? (
                        <>
                            <Text style={styles.label}>Alamat Lengkap</Text>
                            <TextInput
                                value={formData.alamat}
                                onChangeText={(text) => setFormData({ ...formData, alamat: text })}
                                style={[styles.input, { marginBottom: 10 }]}
                                multiline
                            />
                            <Text style={styles.label}>Website URL</Text>
                            <TextInput
                                value={formData.website}
                                onChangeText={(text) => setFormData({ ...formData, website: text })}
                                style={[styles.input, { marginBottom: 10 }]}
                                autoCapitalize="none"
                            />
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Latitude</Text>
                                    <TextInput
                                        value={formData.latitude}
                                        onChangeText={(text) => setFormData({ ...formData, latitude: text })}
                                        style={styles.input}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Longitude</Text>
                                    <TextInput
                                        value={formData.longitude}
                                        onChangeText={(text) => setFormData({ ...formData, longitude: text })}
                                        style={styles.input}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>
                        </>
                    ) : (
                        <>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoText}>{dinas.alamat}</Text>
                            </View>
                            
                            <View style={styles.actionGrid}>
                                <TouchableOpacity 
                                    style={[styles.actionBtn, { backgroundColor: '#F0FDF4', borderColor: '#22C55E' }]}
                                    onPress={openWebsite}
                                >
                                    <Icon name="globe-outline" size={20} color="#16A34A" />
                                    <Text style={[styles.actionBtnText, { color: '#16A34A' }]}>Website</Text>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={[styles.actionBtn, { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' }]}
                                    onPress={openMap}
                                >
                                    <Icon name="map-outline" size={20} color="#2563EB" />
                                    <Text style={[styles.actionBtnText, { color: '#2563EB' }]}>Peta</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
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
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerImageContainer: {
        height: 280,
        position: 'relative',
    },
    headerImage: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    navbar: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 40 : 32,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        zIndex: 10,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F59E0B',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelBtn: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 40 : 32,
        right: 64,
        height: 40,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    cancelBtnText: {
        color: '#FFF',
        fontWeight: '600',
    },
    headerInfo: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    badge: {
        backgroundColor: '#F59E0B',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    content: {
        flex: 1,
        marginTop: -30,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        backgroundColor: '#F8FAFC',
        overflow: 'hidden',
    },
    floatingCard: {
        marginHorizontal: 20,
        marginTop: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 3,
        marginBottom: 20,
    },
    kadisRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#E2E8F0',
    },
    kadisLabel: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 4,
    },
    kadisName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
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
    iconHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
    },
    descriptionText: {
        fontSize: 14,
        lineHeight: 24,
        color: '#334155',
    },
    infoRow: {
        marginBottom: 16,
    },
    infoText: {
        fontSize: 14,
        color: '#334155',
        lineHeight: 22,
    },
    actionGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        gap: 8,
    },
    actionBtnText: {
        fontWeight: '600',
        fontSize: 14,
    },
    // Form Styles
    label: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 4,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        padding: 10,
        color: '#0F172A',
        backgroundColor: '#F8FAFC',
        fontSize: 14,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    changePhotoHeaderBtn: {
        position: 'absolute',
        bottom: 110,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 8,
        gap: 8,
        zIndex: 20
    },
    changePhotoText: {
        color: '#FFF',
        fontWeight: '600',
    },
    editAvatarBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#F59E0B',
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFF'
    }
});
