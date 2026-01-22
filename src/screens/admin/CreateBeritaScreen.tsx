import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Platform,
    StatusBar,
    Modal,
    Animated,
    Image,
    Dimensions,
    FlatList
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import DatePicker from 'react-native-date-picker';
import { useDebounce } from 'use-debounce';

import useBeritaStore from '../../stores/beritaStore';
import useToastStore from '../../stores/toastStore';
import useAuthStore from '../../stores/authStore';
import useLayananStore from '../../stores/layananStore';
import IndustrialInput from '../../components/Form/IndustrialInput';
import IndustrialImagePicker from '../../components/Form/IndustrialImagePicker';
import IndustrialFormSection from '../../components/Form/IndustrialFormSection';
import { getImageUrl } from '../../config/api';

const formatDisplayDate = (isoString: string) => {
    if (!isoString) return "";
    try {
        const date = new Date(isoString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    } catch (e) {
        return isoString;
    }
};

const formatToLocalDateTime = (date: Date) => {
    const pad = (num: number) => (num < 10 ? '0' : '') + num;
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export default function CreateBeritaScreen() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { item } = route.params || {}; // If item exists, it's edit mode
    const isEdit = !!item;

    const { createBerita, updateBerita, loading: storeLoading } = useBeritaStore();
    const { dinas, fetchDinas, loading: dinasLoading } = useLayananStore();
    const user = useAuthStore((state) => state.user);
    const showToast = useToastStore((state) => state.showToast);

    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState(item?.judul || '');
    const [description, setDescription] = useState(item?.deskripsi || '');
    const [photo, setPhoto] = useState<any>(item?.urlGambar ? { uri: getImageUrl(item.urlGambar), isRemote: true } : null);
    
    // New fields
    const [date, setDate] = useState(item?.tanggal || new Date().toISOString());
    const [dinasId, setDinasId] = useState(item?.dinasId || user?.dinasId);
    const [dinasNama, setDinasNama] = useState(item?.dinasNama || (user as any)?.dinasNama || '');

    // Modal & Animations
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    const [slideAnimConfirm] = useState(new Animated.Value(400));
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [slideAnimPicker] = useState(new Animated.Value(400));
    const [dinasModalVisible, setDinasModalVisible] = useState(false);
    const [slideAnimDinas] = useState(new Animated.Value(400));

    // Dinas Search
    const [dinasSearch, setDinasSearch] = useState('');
    const [debouncedDinasSearch] = useDebounce(dinasSearch, 500);

    useEffect(() => {
        if (confirmModalVisible) {
            Animated.timing(slideAnimConfirm, { toValue: 0, duration: 300, useNativeDriver: true }).start();
        } else {
            slideAnimConfirm.setValue(400);
        }
    }, [confirmModalVisible]);

    useEffect(() => {
        if (datePickerVisible) {
            Animated.timing(slideAnimPicker, { toValue: 0, duration: 300, useNativeDriver: true }).start();
        } else {
            slideAnimPicker.setValue(400);
        }
    }, [datePickerVisible]);

     useEffect(() => {
        if (dinasModalVisible) {
            Animated.timing(slideAnimDinas, { toValue: 0, duration: 300, useNativeDriver: true }).start();
        } else {
            slideAnimDinas.setValue(400);
        }
    }, [dinasModalVisible]);

    useEffect(() => {
        fetchDinas({ nama: debouncedDinasSearch });
    }, [debouncedDinasSearch]);

    const handleSave = () => {
        if (!title.trim() || !description.trim()) {
            showToast('Mohon isi judul dan deskripsi berita.', 'error');
            return;
        }

        if (!photo && !isEdit) {
            showToast('Mohon lampirkan foto utama berita.', 'error');
            return;
        }

        if (!dinasId) {
             showToast('Mohon pilih instansi penerbit berita.', 'error');
             return;
        }

        // Show summary modal
        setConfirmModalVisible(true);
    };

    const confirmSubmit = async () => {
        setConfirmModalVisible(false);
        setLoading(true);
        try {
            // Format date to YYYY-MM-DD for LocalDate backend requirement
            const dateObj = new Date(date);
            const pad = (num: number) => (num < 10 ? '0' : '') + num;
            const formattedDate = `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`;

            const payload: any = {
                judul: title,
                deskripsi: description,
                tanggal: formattedDate,
                dinasId: dinasId,
            };

            // Only send photo if it's new (not remote string) or if updating
            if (photo && !photo.isRemote) {
                payload.gambar = photo;
            }

            if (isEdit) {
                await updateBerita(item.id, payload);
            } else {
                await createBerita(payload);
            }

            showToast(`Berita berhasil ${isEdit ? 'diperbarui' : 'dibuat'}.`, 'success');
            setTimeout(() => {
                navigation.goBack();
            }, 500);

        } catch (error: any) {
            console.log('Error submitting berita:', error);
            showToast(error.message || 'Terjadi kesalahan saat menyimpan berita.', 'error');
        } finally {
            setLoading(false);
        }
    };
    
    const selectDinas = (item: any) => {
        setDinasId(item.id);
        setDinasNama(item.nama);
        setDinasModalVisible(false);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEdit ? 'Edit Berita' : 'Buat Berita Baru'}</Text>
                <TouchableOpacity onPress={handleSave} disabled={loading || storeLoading}>
                    {loading || storeLoading ? (
                        <ActivityIndicator size="small" color="#FFB800" />
                    ) : (
                        <Text style={styles.saveBtn}>SIMPAN</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Image Section */}
                <IndustrialFormSection title="FOTO UTAMA" stripeColor="#FFB800" />
                <IndustrialImagePicker
                    photo={photo}
                    onPhotoSelected={setPhoto}
                    onPhotoRemoved={() => setPhoto(null)}
                    placeholderText="Ketuk untuk tambah foto berita"
                />

                {/* Content Section */}
                <IndustrialFormSection title="KONTEN BERITA" stripeColor="#3B82F6" />
                
                <Text style={styles.label}>Judul Berita</Text>
                <IndustrialInput
                    placeholder="Masukkan judul berita menarik..."
                    value={title}
                    onChangeText={setTitle}
                    maxLength={100}
                />

                <Text style={styles.label}>Isi Berita</Text>
                <IndustrialInput
                    placeholder="Tuliskan detail berita disini..."
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    height={200}
                    textAlignVertical="top"
                />

                {/* Date & Dinas Section */}
                <IndustrialFormSection title="WAKTU & PENERBIT" stripeColor="#10B981" />

                 <Text style={styles.label}>Tanggal Publikasi</Text>
                 <TouchableOpacity
                    style={styles.fieldBtn}
                    onPress={() => setDatePickerVisible(true)}
                >
                    <Icon name="calendar-outline" size={20} color="#64748B" />
                    <Text style={styles.fieldBtnText}>{formatDisplayDate(date)}</Text>
                </TouchableOpacity>

                <Text style={styles.label}>Instansi Penerbit</Text>
                 <TouchableOpacity
                    style={styles.fieldBtn}
                    onPress={() => setDinasModalVisible(true)}
                >
                    <Icon name="business-outline" size={20} color="#64748B" />
                    <Text style={[styles.fieldBtnText, !dinasNama && { color: '#94A3B8' }]}>
                        {dinasNama || "Pilih Instansi..."}
                    </Text>
                    <Icon name="chevron-down" size={20} color="#94A3B8" style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>

            </ScrollView>

            {/* Confirmation Modal */}
            <Modal
                visible={confirmModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setConfirmModalVisible(false)}
            >
                <View style={styles.confirmOverlay}>
                    <Animated.View
                        style={[
                            styles.confirmContent,
                            { transform: [{ translateY: slideAnimConfirm }] }
                        ]}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>KONFIRMASI PUBLIKASI</Text>
                            <TouchableOpacity onPress={() => setConfirmModalVisible(false)}>
                                <Icon name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>JUDUL BERITA</Text>
                                <Text style={styles.summaryValue}>{title}</Text>
                            </View>

                             <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>TANGGAL</Text>
                                <Text style={styles.summaryValue}>{formatDisplayDate(date)}</Text>
                            </View>

                             <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>PENERBIT</Text>
                                <Text style={styles.summaryValue}>{dinasNama}</Text>
                            </View>

                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>KONTEN</Text>
                                <Text style={[styles.summaryValue, { fontWeight: '400', fontSize: 13 }]}>{description}</Text>
                            </View>

                            {photo && (
                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryLabel}>LAMPIRAN FOTO</Text>
                                    <Image source={{ uri: photo.uri }} style={styles.thumbnail} resizeMode="cover" />
                                </View>
                            )}
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.confirmBtn}
                            onPress={confirmSubmit}
                        >
                            <Text style={styles.confirmBtnText}>{isEdit ? 'YA, PERBARUI SEKARANG' : 'YA, PUBLIKASIKAN SEKARANG'}</Text>
                            <Icon name="checkmark-circle" size={20} color="#0F172A" />
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
            
            {/* Date Picker Modal */}
             <Modal visible={datePickerVisible} transparent animationType="fade" onRequestClose={() => setDatePickerVisible(false)}>
                <View style={styles.pickerOverlay}>
                    <Animated.View
                        style={[
                            styles.pickerContent,
                            { transform: [{ translateY: slideAnimPicker }] }
                        ]}
                    >
                         <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>PILIH TANGGAL</Text>
                            <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                                <Icon name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                        <View style={{ alignItems: 'center', padding: 16 }}>
                             <DatePicker
                                date={new Date(date)}
                                onDateChange={(d) => setDate(d.toISOString())}
                                mode="date"
                                theme="light"
                            />
                        </View>
                        <TouchableOpacity
                            style={styles.confirmBtn}
                            onPress={() => setDatePickerVisible(false)}
                        >
                            <Text style={styles.confirmBtnText}>SIMPAN TANGGAL</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>

             {/* Dinas Selection Modal */}
            <Modal
                visible={dinasModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setDinasModalVisible(false)}
            >
                <View style={[styles.pickerOverlay, { justifyContent: 'flex-end', padding: 0 }]}>
                    <Animated.View
                        style={[
                            styles.confirmContent,
                            { transform: [{ translateY: slideAnimDinas }], height: '80%', padding: 0 }
                        ]}
                    >
                         <View style={[styles.modalHeader, { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }]}>
                            <Text style={styles.modalTitle}>PILIH INSTANSI</Text>
                            <TouchableOpacity onPress={() => setDinasModalVisible(false)}>
                                <Icon name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                         <View style={{ padding: 16 }}>
                            <IndustrialInput
                                placeholder="Cari Instansi..."
                                value={dinasSearch}
                                onChangeText={setDinasSearch}
                            />
                        </View>

                         {dinasLoading ? (
                            <ActivityIndicator size="large" color="#F59E0B" style={{ marginVertical: 40 }} />
                        ) : (
                            <FlatList
                                data={dinas}
                                keyExtractor={(item) => String(item.id)}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.dinasItem}
                                        onPress={() => selectDinas(item)}
                                    >
                                        <Text style={styles.dinasItemText}>{item.nama}</Text>
                                    </TouchableOpacity>
                                )}
                                contentContainerStyle={{ paddingHorizontal: 20 }}
                            />
                        )}
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
    },
    saveBtn: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFB800',
    },
    content: {
        padding: 16,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 8,
        marginTop: 12,
    },
    // Field Button
    fieldBtn: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 16,
        height: 50,
        borderRadius: 0,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    fieldBtnText: {
        fontSize: 14,
        color: '#0F172A',
        fontWeight: '600',
    },
    // Confirm Modal Styles
    confirmOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        justifyContent: 'center',
        padding: 20,
    },
    pickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        justifyContent: 'center',
        padding: 20,
    },
    pickerContent: {
        backgroundColor: '#FFFFFF',
        padding: 0,
        borderRadius: 0,
    },
    confirmContent: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 0,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        padding: 20
    },
    modalTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: 1,
    },
    summaryItem: {
        marginBottom: 16,
    },
    summaryLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#64748B',
        letterSpacing: 1,
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '900',
        color: '#0F172A',
    },
    thumbnail: {
        width: '100%',
        height: 150,
        marginTop: 8,
        backgroundColor: '#F8FAFC',
    },
    confirmBtn: {
        backgroundColor: '#FFB800',
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginTop: 24,
    },
    confirmBtnText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: 1,
    },
    dinasItem: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    dinasItemText: {
        fontSize: 14,
        color: '#334155',
        fontWeight: '600'
    }
});
