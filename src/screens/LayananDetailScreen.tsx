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
    ActivityIndicator,
    TextInput,
    Linking,
    Switch
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { getImageUrl } from '../config/api';
import useAuthStore from '../stores/authStore';
import { Role } from '../types/auth';
import useLayananStore from '../stores/layananStore';
import useToastStore from '../stores/toastStore';
import { Service } from '../types/service';
import Markdown from 'react-native-markdown-display';
import useFeedbackStore from '../stores/feedbackStore';

export default function LayananDetailScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { item, id } = route.params || {};

    const { user } = useAuthStore();
    const { updateLayanan, getLayananById } = useLayananStore();
    const { feedbacks, averageRating, fetchFeedbacks, loading: feedbackLoading } = useFeedbackStore();
    const showToast = useToastStore(state => state.showToast);

    // Permissions
    const canEdit = user?.role === Role.SUPERADMIN || user?.role === Role.ADMIN || user?.role === Role.STAFF;

    // State
    const [service, setService] = useState<Service | null>(item || null);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        nama: '',
        deskripsi: '',
        estimasiWaktu: '',
        phoneNumber: '',
        email: '',
        informasiDetail: '',
        urlWebLayanan: '',
        online: true,
        dinasId: 0,
        foto: null as any
    });

    const handleImagePick = async () => {
        const { launchImageLibrary } = require('react-native-image-picker');
        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 0.7,
            selectionLimit: 1,
        });

        if (result.assets && result.assets.length > 0) {
            setFormData({ ...formData, foto: result.assets[0] });
        }
    };

    useEffect(() => {
        const load = async () => {
            if (!item && id) {
                setLoading(true);
                const data = await getLayananById(Number(id));
                if (data) {
                    setService(data);
                    initForm(data);
                    fetchFeedbacks(data.id);
                }
                setLoading(false);
            } else if (item) {
                initForm(item);
                fetchFeedbacks(item.id);
            }
        };
        load();
    }, [item, id]);

    const initForm = (data: Service) => {
        setFormData({
            nama: data.nama || '',
            deskripsi: data.deskripsi || '',
            estimasiWaktu: String(data.estimasiWaktu || 0),
            phoneNumber: data.phoneNumber || '',
            email: data.email || '',
            informasiDetail: data.informasiDetail || '',
            urlWebLayanan: data.urlWebLayanan || '',
            online: data.online !== undefined ? data.online : true,
            dinasId: data.dinasId || 0,
            foto: null
        });
    };

    const handleSave = async () => {
        if (!service) return;

        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                estimasiWaktu: parseInt(formData.estimasiWaktu) || 0
            };
            
            const success = await updateLayanan(service.id, payload);
            if (success) {
                showToast('Layanan berhasil diperbarui', 'success');
                setService({ ...service, ...payload } as Service);
                setIsEditing(false);
            } else {
                showToast('Gagal memperbarui layanan', 'error');
            }
        } catch (error) {
            showToast('Terjadi kesalahan saat menyimpan', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    if (!service) {
        return (
            <View style={styles.centerContainer}>
                <Text>Layanan tidak ditemukan</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 10 }}>
                    <Text style={{ color: '#3B82F6'}}>Kembali</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            
            {/* Header Image */}
            <View style={styles.headerImageContainer}>
                {isEditing && formData.foto ? (
                    <Image source={{ uri: formData.foto.uri }} style={styles.headerImage} resizeMode="cover" />
                ) : service.urlGambar ? (
                    <Image 
                        source={{ uri: getImageUrl(service.urlGambar) }} 
                        style={styles.headerImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.headerImage, { backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' }]}>
                        <Icon name="layers" size={80} color="#93C5FD" />
                    </View>
                )}
                <View style={styles.overlay} />
                
                {isEditing && (
                    <TouchableOpacity onPress={handleImagePick} style={styles.changePhotoBtn}>
                        <Icon name="camera" size={20} color="#FFF" />
                        <Text style={styles.changePhotoText}>Ganti Foto</Text>
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
                            initForm(service);
                        }} 
                        style={styles.cancelBtn}
                    >
                        <Text style={styles.cancelBtnText}>Batal</Text>
                    </TouchableOpacity>
                )}

                <View style={styles.headerInfo}>
                    <View style={[styles.badge, service.online ? {backgroundColor:'#10B981'} : {backgroundColor:'#64748B'}]}>
                        <Text style={styles.badgeText}>{service.online ? 'LAYANAN ONLINE' : 'OFFLINE'}</Text>
                    </View>
                    <Text style={styles.headerTitle} numberOfLines={2}>
                        {service.nama}
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        {service.dinasNama}
                    </Text>
                </View>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>

                {/* Main Info */}
                <View style={styles.section}>
                    <View style={styles.iconHeader}>
                        <Icon name="information-circle-outline" size={20} color="#3B82F6" />
                        <Text style={styles.sectionTitle}>Deskripsi Layanan</Text>
                    </View>
                    {isEditing ? (
                        <>
                            <Text style={styles.label}>Nama Layanan</Text>
                            <TextInput
                                value={formData.nama}
                                onChangeText={(text) => setFormData({ ...formData, nama: text })}
                                style={[styles.input, { marginBottom: 10 }]}
                                multiline
                            />
                            <Text style={styles.label}>Deskripsi Singkat</Text>
                            <TextInput
                                value={formData.deskripsi}
                                onChangeText={(text) => setFormData({ ...formData, deskripsi: text })}
                                style={[styles.input, styles.textArea]}
                                multiline
                            />
                             <Text style={styles.label}>Informasi Detail / Syarat</Text>
                            <TextInput
                                value={formData.informasiDetail}
                                onChangeText={(text) => setFormData({ ...formData, informasiDetail: text })}
                                style={[styles.input, styles.textArea, { marginTop: 10 }]}
                                multiline
                                placeholder="Detail persyaratan, dsb."
                            />
                        </>
                    ) : (
                        <>
                            <Text style={styles.descriptionText}>
                                {service.deskripsi}
                            </Text>
                             {service.informasiDetail && (
                                <View style={styles.infoBox}>
                                    <Text style={styles.infoBoxTitle}>Persyaratan / Detail:</Text>
                                    <Markdown
                                        style={{
                                            body: { fontSize: 13, color: '#1E3A8A', lineHeight: 20 },
                                            paragraph: { marginBottom: 8 },
                                            list_item: { marginBottom: 4 },
                                            bullet_list: { marginBottom: 8 },
                                        }}
                                    >
                                        {service.informasiDetail}
                                    </Markdown>
                                </View>
                            )}
                        </>
                    )}
                </View>

                {/* Operational Info */}
                <View style={styles.section}>
                    <View style={styles.iconHeader}>
                        <Icon name="timer-outline" size={20} color="#F59E0B" />
                        <Text style={styles.sectionTitle}>Informasi Operasional</Text>
                    </View>
                    
                    {isEditing ? (
                        <>
                           <View style={styles.formRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Estimasi (Hari)</Text>
                                    <TextInput
                                        value={formData.estimasiWaktu}
                                        onChangeText={(text) => setFormData({ ...formData, estimasiWaktu: text })}
                                        style={styles.input}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={{ flex: 1, alignItems:'center' }}>
                                    <Text style={styles.label}>Status Online</Text>
                                    <Switch 
                                        value={formData.online} 
                                        onValueChange={(val) => setFormData({...formData, online: val})} 
                                        trackColor={{ false: "#767577", true: "#3B82F6" }}
                                    />
                                </View>
                           </View>

                            <Text style={styles.label}>No. Telepon</Text>
                            <TextInput
                                value={formData.phoneNumber}
                                onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
                                style={[styles.input, { marginBottom: 10 }]}
                                keyboardType="phone-pad"
                            />
                            <Text style={styles.label}>Email Pengaduan</Text>
                            <TextInput
                                value={formData.email}
                                onChangeText={(text) => setFormData({ ...formData, email: text })}
                                style={[styles.input, { marginBottom: 10 }]}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                             <Text style={styles.label}>URL Web Layanan</Text>
                            <TextInput
                                value={formData.urlWebLayanan}
                                onChangeText={(text) => setFormData({ ...formData, urlWebLayanan: text })}
                                style={styles.input}
                                autoCapitalize="none"
                            />
                        </>
                    ) : (
                        <View style={styles.metaGrid}>
                            <View style={styles.metaItem}>
                                <Icon name="time-outline" size={18} color="#64748B" />
                                <View>
                                    <Text style={styles.metaLabel}>Estimasi</Text>
                                    <Text style={styles.metaValue}>{service.estimasiWaktu} Hari Kerja</Text>
                                </View>
                            </View>
                            <View style={styles.metaItem}>
                                <Icon name="call-outline" size={18} color="#64748B" />
                                <View>
                                     <Text style={styles.metaLabel}>Kontak</Text>
                                     <Text style={styles.metaValue}>{service.phoneNumber}</Text>
                                </View>
                            </View>
                            <View style={styles.metaItem}>
                                <Icon name="mail-outline" size={18} color="#64748B" />
                                <View>
                                     <Text style={styles.metaLabel}>Email</Text>
                                     <Text style={styles.metaValue}>{service.email}</Text>
                                </View>
                            </View>
                            {service.urlWebLayanan && (
                                <TouchableOpacity onPress={() => Linking.openURL(service.urlWebLayanan!)} style={styles.linkBtn}>
                                    <Text style={styles.linkBtnText}>Kunjungi Website Layanan</Text>
                                    <Icon name="open-outline" size={14} color="#3B82F6" />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>

                {/* Feedback Section */}
                {!isEditing && (
                    <View style={[styles.section, { marginBottom: 20 }]}>
                         <View style={styles.iconHeader}>
                            <Icon name="star" size={20} color="#F59E0B" />
                            <Text style={styles.sectionTitle}>Ulasan & Rating</Text>
                        </View>

                        {/* Summary */}
                        <View style={styles.ratingSummary}>
                            <View>
                                <Text style={styles.bigRating}>{averageRating || '0.0'}</Text>
                                <View style={styles.starsRow}>
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <Icon 
                                            key={i} 
                                            name={i <= Math.round(averageRating) ? "star" : "star-outline"} 
                                            size={16} 
                                            color="#F59E0B" 
                                        />
                                    ))}
                                </View>
                                <Text style={styles.totalReviews}>{feedbacks.length} Ulasan</Text>
                            </View>
                        </View>

                        {/* List */}
                        {feedbackLoading ? (
                            <ActivityIndicator color="#3B82F6" style={{ marginTop: 20 }} />
                        ) : feedbacks.length === 0 ? (
                            <Text style={styles.emptyText}>Belum ada ulasan untuk layanan ini.</Text>
                        ) : (
                            <View style={styles.reviewList}>
                                {feedbacks.map((fb) => (
                                    <View key={fb.id} style={styles.reviewItem}>
                                        <View style={styles.reviewHeader}>
                                            {fb.urlFoto && !fb.urlFoto.startsWith('http') ? (
                                                 <Image source={{ uri: getImageUrl(fb.urlFoto) }} style={styles.avatar} />
                                            ) : fb.urlFoto ? (
                                                 <Image source={{ uri: fb.urlFoto }} style={styles.avatar} />
                                            ) : (
                                                <View style={styles.avatarPlaceholder}>
                                                    <Text style={styles.avatarInitial}>{fb.userName?.charAt(0) || 'U'}</Text>
                                                </View>
                                            )}
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.reviewerName}>{fb.userName}</Text>
                                                <Text style={styles.reviewDate}>
                                                    {new Date(fb.createdAt).toLocaleDateString('id-ID', {
                                                        day: 'numeric', month: 'long', year: 'numeric'
                                                    })}
                                                </Text>
                                            </View>
                                            <View style={styles.miniRating}>
                                                <Icon name="star" size={12} color="#F59E0B" />
                                                <Text style={styles.miniRatingText}>{fb.rating}</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.reviewContent}>{fb.ulasan}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}
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
        height: 260,
        position: 'relative',
    },
    headerImage: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
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
        backgroundColor: '#3B82F6',
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
        bottom: 30,
        left: 20,
        right: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#E2E8F0',
        fontWeight: '500',
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    content: {
        flex: 1,
        marginTop: -20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        backgroundColor: '#F8FAFC',
        overflow: 'hidden',
    },
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 20,
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    iconHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
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
    infoBox: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#3B82F6',
    },
    infoBoxTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1E40AF',
        marginBottom: 4,
    },
    infoBoxText: {
        fontSize: 13,
        color: '#1E3A8A',
        lineHeight: 20,
    },
    metaGrid: {
        gap: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    metaLabel: {
        fontSize: 12,
        color: '#94A3B8',
        marginBottom: 2,
    },
    metaValue: {
        fontSize: 14,
        color: '#0F172A',
        fontWeight: '500',
    },
    linkBtn: {
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
    },
    linkBtnText: {
        color: '#3B82F6',
        fontWeight: '600',
        fontSize: 14,
    },
    // Form Styles
    label: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 4,
        fontWeight: '600',
        marginTop: 10,
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
        height: 80,
        textAlignVertical: 'top',
    },
    formRow: {
        flexDirection: 'row',
        gap: 12,
    },
    changePhotoBtn: {
        position: 'absolute',
        bottom: 100, // Adjust position to not conflict with header info
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
    // Feedback Styles
    ratingSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    bigRating: {
        fontSize: 48,
        fontWeight: '900',
        color: '#0F172A',
        lineHeight: 56,
    },
    starsRow: {
        flexDirection: 'row',
        gap: 2,
        marginVertical: 4,
    },
    totalReviews: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    emptyText: {
        textAlign: 'center',
        color: '#94A3B8',
        fontStyle: 'italic',
        marginTop: 20,
    },
    reviewList: {
        gap: 16,
    },
    reviewItem: {
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        paddingBottom: 16,
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E2E8F0',
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 16,
    },
    reviewerName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
    },
    reviewDate: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 2,
    },
    miniRating: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    miniRatingText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#B45309',
    },
    reviewContent: {
        fontSize: 14,
        color: '#334155',
        lineHeight: 22,
    },
});
