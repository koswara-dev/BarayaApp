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
    TextInput
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchImageLibrary } from 'react-native-image-picker';

import { getImageUrl } from '../config/api';
import useAuthStore from '../stores/authStore';
import { Role } from '../types/auth';
import useEventStore from '../stores/eventStore';
import useToastStore from '../stores/toastStore';
import { Event } from '../types/event';
import Markdown from 'react-native-markdown-display';
export default function EventDetailScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { event, id } = route.params || {};

    const { user } = useAuthStore();
    const { updateEvent, getEventById } = useEventStore();
    const showToast = useToastStore(state => state.showToast);

    // Permissions
    const canEdit = user?.role === Role.SUPERADMIN || user?.role === Role.EXECUTIVE || user?.role === Role.ADMIN;

    // State
    const [currentEvent, setCurrentEvent] = useState<Event | null>(event || null);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        judul: '',
        deskripsi: '',
        lokasi: '',
        tanggalMulai: new Date(),
        tanggalSelesai: new Date(),
        dinasId: 0,
        foto: null as any
    });

    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    useEffect(() => {
        const load = async () => {
            if (!event && id) {
                setLoading(true);
                const data = await getEventById(Number(id));
                if (data) {
                    setCurrentEvent(data);
                    initForm(data);
                }
                setLoading(false);
            } else if (event) {
                initForm(event);
            }
        };
        load();
    }, [event, id]);

    const initForm = (data: Event) => {
        setFormData({
            judul: data.judul || '',
            deskripsi: data.deskripsi || '',
            lokasi: data.lokasi || '',
            tanggalMulai: data.tanggalMulai ? new Date(data.tanggalMulai) : new Date(),
            tanggalSelesai: data.tanggalSelesai ? new Date(data.tanggalSelesai) : new Date(),
            dinasId: data.dinasId || 0,
            foto: null
        });
    };

    const handleImagePick = async () => {
        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 0.7,
            selectionLimit: 1,
        });

        if (result.assets && result.assets.length > 0) {
            setFormData({ ...formData, foto: result.assets[0] });
        }
    };

    const handleSave = async () => {
        if (!currentEvent) return;
        if (!formData.judul || !formData.deskripsi) {
            showToast('Judul dan Deskripsi wajib diisi', 'info');
            return;
        }

        setIsSaving(true);
        try {
            // Helper to get YYYY-MM-DD in local time
            const toLocalISOString = (date: Date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            const payload = {
                ...formData,
                tanggalMulai: toLocalISOString(formData.tanggalMulai),
                tanggalSelesai: toLocalISOString(formData.tanggalSelesai)
            };

            const updatedData = await updateEvent(currentEvent.id, payload);
            if (updatedData) {
                showToast('Event berhasil diperbarui', 'success');
                setCurrentEvent(updatedData);
                setIsEditing(false);
            }
        } catch (error) {
            showToast('Terjadi kesalahan saat menyimpan', 'error');
        } finally {
            setIsSaving(false);
        }
    };

     const formatDate = (date: Date) => {
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#F59E0B" />
            </View>
        );
    }

    if (!currentEvent) {
        return (
            <View style={styles.centerContainer}>
                <Text>Agenda tidak ditemukan</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 10 }}>
                    <Text style={{ color: '#F59E0B' }}>Kembali</Text>
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
                ) : currentEvent.urlGambar ? (
                    <Image source={{ uri: getImageUrl(currentEvent.urlGambar) }} style={styles.headerImage} resizeMode="cover" />
                ) : (
                    <View style={[styles.headerImage, styles.placeholderImage]}>
                        <Icon name="calendar" size={80} color="#CBD5E1" />
                    </View>
                )}
                <View style={styles.overlay} />

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

                 {isEditing && (
                    <TouchableOpacity onPress={handleImagePick} style={styles.changePhotoBtn}>
                        <Icon name="camera" size={20} color="#FFF" />
                        <Text style={styles.changePhotoText}>Ganti Foto</Text>
                    </TouchableOpacity>
                )}
                
                 {/* Cancel Edit Button */}
                 {isEditing && (
                    <TouchableOpacity 
                        onPress={() => {
                            setIsEditing(false);
                            initForm(currentEvent);
                        }} 
                        style={styles.cancelBtn}
                    >
                        <Text style={styles.cancelBtnText}>Batal</Text>
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Title Section */}
                 <View style={styles.titleSection}>
                    <View style={styles.dinasBadge}>
                        <Text style={styles.dinasText}>{currentEvent.dinasNama || 'Instansi'}</Text>
                    </View>
                    {isEditing ? (
                        <TextInput
                            value={formData.judul}
                            onChangeText={(text) => setFormData({ ...formData, judul: text })}
                            style={styles.inputTitle}
                            placeholder="Judul Agenda"
                            multiline
                        />
                    ) : (
                        <Text style={styles.titleText}>{currentEvent.judul}</Text>
                    )}
                </View>

                {/* Date & Location Info */}
                <View style={styles.infoCard}>
                    <View style={styles.infoItem}>
                         <View style={styles.iconBox}>
                            <Icon name="calendar-outline" size={20} color="#F59E0B" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.infoLabel}>Waktu Pelaksanaan</Text>
                            {isEditing ? (
                                <View style={{ gap: 8 }}>
                                    <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.datePickerBtn}>
                                        <Text>{formatDate(formData.tanggalMulai)}</Text>
                                    </TouchableOpacity>
                                    <Text style={{ fontSize: 12, color: '#94A3B8' }}>sampai</Text>
                                      <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.datePickerBtn}>
                                        <Text>{formatDate(formData.tanggalSelesai)}</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <Text style={styles.infoValue}>
                                    {formatDate(new Date(currentEvent.tanggalMulai))} s/d {formatDate(new Date(currentEvent.tanggalSelesai))}
                                </Text>
                            )}
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.infoItem}>
                         <View style={styles.iconBox}>
                            <Icon name="location-outline" size={20} color="#EF4444" />
                        </View>
                         <View style={{ flex: 1 }}>
                            <Text style={styles.infoLabel}>Lokasi</Text>
                             {isEditing ? (
                                <TextInput
                                    value={formData.lokasi}
                                    onChangeText={(text) => setFormData({ ...formData, lokasi: text })}
                                    style={styles.input}
                                    placeholder="Lokasi acara"
                                />
                            ) : (
                                <Text style={styles.infoValue}>{currentEvent.lokasi}</Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Description */}
                <View style={styles.descSection}>
                    <Text style={styles.sectionTitle}>Deskripsi Kegiatan</Text>
                    {isEditing ? (
                         <TextInput
                            value={formData.deskripsi}
                            onChangeText={(text) => setFormData({ ...formData, deskripsi: text })}
                            style={[styles.input, styles.textArea]}
                            multiline
                            placeholder="Deskripsi lengkap kegiatan..."
                        />
                    ) : (
                        <Markdown style={markdownStyles}>
                            {currentEvent.deskripsi}
                        </Markdown>
                    )}
                </View>

            </ScrollView>

             {/* Date Pickers */}
            {showStartPicker && (
                <DateTimePicker
                    value={formData.tanggalMulai}
                    mode="date" // Simplify to date for now, can be 'datetime'
                    display="default"
                    onChange={(event: any, selectedDate?: Date) => {
                        setShowStartPicker(false);
                        if (selectedDate) setFormData({ ...formData, tanggalMulai: selectedDate });
                    }}
                />
            )}
            {showEndPicker && (
                <DateTimePicker
                    value={formData.tanggalSelesai}
                    mode="date"
                    display="default"
                    onChange={(event: any, selectedDate?: Date) => {
                        setShowEndPicker(false);
                        if (selectedDate) setFormData({ ...formData, tanggalSelesai: selectedDate });
                    }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FCFDFF',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerImageContainer: {
        height: 300,
        position: 'relative',
    },
    headerImage: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
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
    changePhotoBtn: {
        position: 'absolute',
        bottom: 32,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 8,
        gap: 8,
    },
    changePhotoText: {
        color: '#FFF',
        fontWeight: '600',
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
    content: {
        flex: 1,
        marginTop: -30,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        backgroundColor: '#FCFDFF',
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    titleSection: {
        marginBottom: 20,
    },
    dinasBadge: {
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    dinasText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#D97706',
        textTransform: 'uppercase',
    },
    titleText: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1E293B',
        lineHeight: 30,
    },
    inputTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1E293B',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingVertical: 4,
    },
    infoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 14,
        color: '#0F172A',
        fontWeight: '600',
        lineHeight: 20,
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 16,
    },
    descSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 12,
    },
    descText: {
        fontSize: 15,
        lineHeight: 26,
        color: '#334155',
        textAlign: 'justify',
    },
    input: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#F8FAFC',
        color: '#0F172A',
        fontSize: 14,
    },
    textArea: {
        height: 150,
        textAlignVertical: 'top',
    },
    datePickerBtn: {
        padding: 10,
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    }
});

const markdownStyles = StyleSheet.create({
    body: {
        fontSize: 15,
        lineHeight: 26,
        color: '#334155',
        textAlign: 'justify',
    },
    heading1: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 10,
        marginTop: 10,
    },
    heading2: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 8,
        marginTop: 8,
    },
    bullet_list: {
        marginBottom: 8,
    },
    ordered_list: {
        marginBottom: 8,
    },
    list_item: {
        marginBottom: 4,
    },
    link: {
        color: '#2563EB',
        textDecorationLine: 'underline',
    },
    paragraph: {
        marginBottom: 10,
    }
});
