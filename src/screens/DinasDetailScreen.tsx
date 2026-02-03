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
    Linking,
    Modal
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { getImageUrl } from '../config/api';


import useAuthStore from '../stores/authStore';
import { Role } from '../types/auth';
import useDinasStore, { DinasItem } from '../stores/dinasStore';
import useToastStore from '../stores/toastStore';
import LayananDinasComponent from '../components/LayananDinasComponent';

const { width } = Dimensions.get('window');

export default function DinasDetailScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { item, id } = route.params || {};
    const insets = useSafeAreaInsets();

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
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');

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
        jumlahPegawai: '',
        dataPrestasi: '',
        mediaSosial: '',
        fotoGedung: null as any,
        fotoKadis: null as any,
        fotoStruktur: null as any
    });

    const handlePhotoPick = async (type: 'gedung' | 'kadis' | 'struktur') => {
        const { launchImageLibrary } = require('react-native-image-picker');
        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 0.7,
            selectionLimit: 1,
        });

        if (result.assets && result.assets.length > 0) {
            if (type === 'gedung') {
                setFormData({ ...formData, fotoGedung: result.assets[0] });
            } else if (type === 'kadis') {
                setFormData({ ...formData, fotoKadis: result.assets[0] });
            } else {
                setFormData({ ...formData, fotoStruktur: result.assets[0] });
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
            jumlahPegawai: data.jumlahPegawai ? String(data.jumlahPegawai) : '',
            dataPrestasi: data.dataPrestasi || '',
            mediaSosial: data.mediaSosial || '',
            fotoGedung: null,
            fotoKadis: null,
            fotoStruktur: null
        });
    };

    const handleSave = async () => {
        if (!dinas) return;

        setIsSaving(true);
        try {
            const success = await updateDinas(dinas.id, formData);
            if (success) {
                showToast('Data dinas berhasil diperbarui', 'success');
                setDinas({ 
                    ...dinas, 
                    ...formData, 
                    jumlahPegawai: formData.jumlahPegawai ? parseInt(formData.jumlahPegawai) : 0,
                    latitude: formData.latitude, 
                    longitude: formData.longitude 
                } as unknown as DinasItem); // Optimistic update
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
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
            
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

                {/* Struktur Organisasi Section */}
                <View style={styles.section}>
                    <View style={styles.iconHeader}>
                        <Icon name="people-outline" size={20} color="#3B82F6" />
                        <Text style={styles.sectionTitle}>Struktur Organisasi & Pegawai</Text>
                    </View>
                    
                    {isEditing ? (
                        <>
                             <Text style={styles.label}>Jumlah Pegawai</Text>
                            <TextInput
                                value={formData.jumlahPegawai}
                                onChangeText={(text) => setFormData({ ...formData, jumlahPegawai: text })}
                                style={[styles.input, { marginBottom: 10 }]}
                                keyboardType="numeric"
                                placeholder="0"
                            />
                            <Text style={styles.label}>Foto Struktur Organisasi</Text>
                            <TouchableOpacity onPress={() => handlePhotoPick('struktur')} style={styles.uploadBtn}>
                                <Icon name="cloud-upload-outline" size={24} color="#64748B" />
                                <Text style={styles.uploadBtnText}>
                                    {formData.fotoStruktur ? 'Ganti Foto Struktur' : 'Upload Foto Struktur'}
                                </Text>
                            </TouchableOpacity>
                            {formData.fotoStruktur && (
                                <Image source={{ uri: formData.fotoStruktur.uri }} style={styles.previewImage} resizeMode="contain" />
                            )}
                        </>
                    ) : (
                        <>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Jumlah Pegawai</Text>
                                <Text style={styles.infoText}>{dinas.jumlahPegawai || 0} Orang</Text>
                            </View>
                            
                            {dinas.urlStrukturOrganisasi ? (
                                <View>
                                    <Text style={[styles.label, { marginBottom: 8 }]}>Struktur Organisasi</Text>
                                    <TouchableOpacity onPress={() => {
                                        setPreviewUrl(getImageUrl(dinas.urlStrukturOrganisasi || ''));
                                        setPreviewVisible(true);
                                    }} style={styles.strukturImageContainer}>
                                        <Image 
                                            source={{ uri: getImageUrl(dinas.urlStrukturOrganisasi) }} 
                                            style={styles.strukturImage}
                                            resizeMode="contain"
                                        />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <Text style={styles.emptyText}>Belum ada info struktur organisasi.</Text>
                            )}
                        </>
                    )}
                </View>

                {/* Layanan Instansi Component */}
                {!isEditing && (
                    <LayananDinasComponent dinasId={dinas.id} />
                )}

                {/* Prestasi & Media Sosial Section */}
                <View style={styles.section}>
                     <View style={styles.iconHeader}>
                        <Icon name="trophy-outline" size={20} color="#F59E0B" />
                        <Text style={styles.sectionTitle}>Prestasi & Media Sosial</Text>
                    </View>

                    {isEditing ? (
                        <>
                             <Text style={styles.label}>Data Prestasi</Text>
                            <TextInput
                                value={formData.dataPrestasi}
                                onChangeText={(text) => setFormData({ ...formData, dataPrestasi: text })}
                                style={[styles.input, styles.textArea, { marginBottom: 10 }]}
                                multiline
                                placeholder="Daftar prestasi yang diraih..."
                            />
                             <Text style={styles.label}>Link Media Sosial (Pisahkan dengan koma)</Text>
                            <TextInput
                                value={formData.mediaSosial}
                                onChangeText={(text) => setFormData({ ...formData, mediaSosial: text })}
                                style={[styles.input]}
                                placeholder="https://facebook.com/..., https://instagram.com/..."
                                multiline
                            />
                             <Text style={styles.hintText}>Contoh: https://facebook.com/akun, https://instagram.com/akun</Text>
                        </>
                    ) : (
                        <>
                            <View style={{ marginBottom: 16 }}>
                                <Text style={styles.label}>Prestasi</Text>
                                <Text style={styles.descriptionText}>
                                    {dinas.dataPrestasi || 'Belum ada data prestasi.'}
                                </Text>
                            </View>

                             <View>
                                <Text style={styles.label}>Media Sosial</Text>
                                {dinas.mediaSosial ? (
                                    <View style={styles.socialGrid}>
                                        {dinas.mediaSosial.split(',').map((url, idx) => {
                                            const cleanUrl = url.trim();
                                            let iconName = "link-outline";
                                            let color = "#64748B";
                                            
                                            if (cleanUrl.includes('facebook')) { iconName = "logo-facebook"; color="#1877F2"; }
                                            else if (cleanUrl.includes('instagram')) { iconName = "logo-instagram"; color="#E4405F"; }
                                            else if (cleanUrl.includes('twitter') || cleanUrl.includes('x.com')) { iconName = "logo-twitter"; color="#000000"; }
                                            else if (cleanUrl.includes('youtube')) { iconName = "logo-youtube"; color="#FF0000"; }
                                            else if (cleanUrl.includes('tiktok')) { iconName = "logo-tiktok"; color="#000000"; }

                                            return (
                                                <TouchableOpacity key={idx} style={styles.socialBtn} onPress={() => Linking.openURL(cleanUrl)}>
                                                    <Icon name={iconName} size={24} color={color} />
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                ) : (
                                    <Text style={styles.emptyText}>Belum ada media sosial.</Text>
                                )}
                            </View>
                        </>
                    )}
                </View>

            </ScrollView>

            <Modal visible={previewVisible} transparent={true} animationType="fade" onRequestClose={() => setPreviewVisible(false)}>
                <View style={styles.modalContainer}>
                    <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setPreviewVisible(false)}>
                        <Icon name="close" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <WebView
                        source={{ 
                            html: `
                                <html>
                                <head>
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
                                    <style>
                                        body { margin: 0; background-color: #000; height: 100vh; display: flex; justify-content: center; align-items: center; }
                                        img { width: 100%; height: auto; max-width: 100%; object-fit: contain; }
                                    </style>
                                </head>
                                <body>
                                    <img src="${previewUrl}" />
                                </body>
                                </html>
                            ` 
                        }}
                        style={{ flex: 1, backgroundColor: 'transparent' }}
                        containerStyle={{ backgroundColor: 'black' }}
                    />
                </View>
            </Modal>
            {/* Submit Complaint Button Footer */}
            {!isEditing && (
                <View style={[styles.footerContainer, { paddingBottom: 16 + insets.bottom }]}>
                    <TouchableOpacity
                        style={styles.complaintBtn}
                        onPress={() => {
                            if (!user) {
                                Alert.alert('Login Diperlukan', 'Silakan login terlebih dahulu untuk menyampaikan pengaduan', [
                                    { text: 'Batal', style: 'cancel' },
                                    { text: 'Login', onPress: () => navigation.navigate('Login') }
                                ]);
                                return;
                            }
                            navigation.navigate('CreatePengaduan', { dinasId: dinas.id, dinasNama: dinas.nama });
                        }}
                    >
                        <Icon name="megaphone-outline" size={20} color="#FFF" />
                        <Text style={styles.complaintBtnText}>SAMPAIKAN PENGADUAN</Text>
                    </TouchableOpacity>
                </View>
            )}

        </SafeAreaView>
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
        top: 10,
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
        top: 10,
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
    },
    uploadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        borderRadius: 8,
        backgroundColor: '#F8FAFC',
        gap: 8,
        marginBottom: 10
    },
    uploadBtnText: {
        color: '#64748B',
        fontWeight: '600'
    },
    footerContainer: {
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    complaintBtn: {
        backgroundColor: '#445eefff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 8,
        gap: 8,
    },
    complaintBtnText: {
        color: '#FFFFFF',
        fontWeight: '900',
        fontSize: 16,
        letterSpacing: 1,
    },
    previewImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 10,
        backgroundColor: '#F1F5F9'
    },
    strukturImageContainer: {
        width: '100%',
        height: 250,
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    strukturImage: {
        width: '100%',
        height: '100%'
    },
    emptyText: {
        color: '#94A3B8',
        fontStyle: 'italic',
        fontSize: 13
    },
    hintText: {
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 4,
        marginBottom: 8
    },
    socialGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 8
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    modalCloseBtn: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 20,
        right: 20,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 8,
        borderRadius: 20,
    },
    socialBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0'
    }
});
