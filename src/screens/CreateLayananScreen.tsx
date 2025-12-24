import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
    StatusBar,
    KeyboardAvoidingView,
    Modal,
    FlatList,
    ActivityIndicator,
    Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import useLayananStore from '../stores/layananStore';
import useToastStore from '../stores/toastStore';
import LoadingOverlay from '../components/LoadingOverlay';
import IndustrialFormSection from '../components/Form/IndustrialFormSection';
import IndustrialInput from '../components/Form/IndustrialInput';

export default function CreateLayananScreen() {
    const navigation = useNavigation<any>();
    const { createLayanan, dinas, fetchDinas, loading } = useLayananStore();
    const showToast = useToastStore((state) => state.showToast);

    const [form, setForm] = useState({
        nama: '',
        deskripsi: '',
        informasiDetail: '',
        estimasiWaktu: '',
        phoneNumber: '',
        email: '',
        dinasId: null as number | null,
        dinasNama: '',
    });

    const [dinasModalVisible, setDinasModalVisible] = useState(false);
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);

    // Animation values
    const [slideAnimDinas] = useState(new Animated.Value(300));
    const [slideAnimConfirm] = useState(new Animated.Value(300));

    useEffect(() => {
        if (dinasModalVisible) {
            Animated.timing(slideAnimDinas, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            slideAnimDinas.setValue(300);
        }
    }, [dinasModalVisible]);

    useEffect(() => {
        if (confirmModalVisible) {
            Animated.timing(slideAnimConfirm, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            slideAnimConfirm.setValue(300);
        }
    }, [confirmModalVisible]);

    useEffect(() => {
        fetchDinas();
    }, []);

    const handleSave = () => {
        if (!form.nama || !form.deskripsi || !form.dinasId) {
            showToast('Field Nama, Deskripsi, dan Dinas wajib diisi', 'error');
            return;
        }
        setConfirmModalVisible(true);
    };

    const confirmSubmit = async () => {
        setConfirmModalVisible(false);
        try {
            await createLayanan({
                nama: form.nama,
                deskripsi: form.deskripsi,
                informasiDetail: form.informasiDetail,
                estimasiWaktu: form.estimasiWaktu ? parseInt(form.estimasiWaktu) : 1,
                phoneNumber: form.phoneNumber,
                email: form.email,
                dinasId: form.dinasId,
            });
            showToast('Layanan berhasil dibuat', 'success');
            navigation.goBack();
        } catch (err: any) {
            showToast(err.message || 'Gagal membuat layanan', 'error');
        }
    };

    const selectDinas = (item: any) => {
        setForm({ ...form, dinasId: item.id, dinasNama: item.nama });
        setDinasModalVisible(false);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <LoadingOverlay
                visible={loading}
                message="Sedang Menyimpan Data Layanan..."
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Buat Layanan Baru</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                <IndustrialFormSection title="INFORMASI LAYANAN" stripeColor="#FFB800" />

                <IndustrialInput
                    placeholder="Nama Layanan (contoh: Pembuatan KTP)"
                    value={form.nama}
                    onChangeText={(val) => setForm({ ...form, nama: val })}
                    style={{ fontWeight: '900' }}
                />

                <View style={{ height: 12 }} />

                <IndustrialInput
                    placeholder="Deskripsi Singkat..."
                    multiline
                    maxLength={200}
                    value={form.deskripsi}
                    onChangeText={(val) => setForm({ ...form, deskripsi: val })}
                    showCounter
                />

                <View style={{ height: 12 }} />

                <IndustrialInput
                    placeholder="Informasi Detail / Persyaratan..."
                    multiline
                    value={form.informasiDetail}
                    onChangeText={(val) => setForm({ ...form, informasiDetail: val })}
                />

                <IndustrialFormSection title="INSTANSI PENANGGUNG JAWAB" stripeColor="#3B82F6" />

                <TouchableOpacity
                    style={styles.dinasSelector}
                    onPress={() => setDinasModalVisible(true)}
                >
                    <View style={styles.dinasSelectorInner}>
                        <Icon name="business-outline" size={20} color="#64748B" />
                        <Text style={[styles.dinasValue, !form.dinasId && { color: '#94A3B8' }]}>
                            {form.dinasNama || "Pilih Dinas / Instansi"}
                        </Text>
                    </View>
                    <Icon name="chevron-down" size={20} color="#64748B" />
                </TouchableOpacity>

                <IndustrialFormSection title="KONTAK & ESTIMASI" stripeColor="#E11D48" />

                <View style={styles.row}>
                    <View style={styles.col}>
                        <IndustrialInput
                            placeholder="No. Telepon"
                            keyboardType="phone-pad"
                            value={form.phoneNumber}
                            onChangeText={(val) => setForm({ ...form, phoneNumber: val })}
                        />
                    </View>
                    <View style={styles.col}>
                        <IndustrialInput
                            placeholder="Email"
                            keyboardType="email-address"
                            value={form.email}
                            onChangeText={(val) => setForm({ ...form, email: val })}
                        />
                    </View>
                </View>

                <View style={{ height: 12 }} />

                <IndustrialInput
                    placeholder="Estimasi Waktu (Hari)"
                    keyboardType="numeric"
                    value={form.estimasiWaktu}
                    onChangeText={(val) => setForm({ ...form, estimasiWaktu: val })}
                />

                {/* Footer Action matching CreateEvent style */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.publishBtn, loading && styles.publishBtnDisabled]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#0F172A" />
                        ) : (
                            <View style={styles.publishBtnInner}>
                                <Text style={styles.publishBtnText}>SIMPAN DATA LAYANAN</Text>
                                <Icon name="save-outline" size={20} color="#0F172A" />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

            </ScrollView>

            {/* Selection Modal */}
            <Modal visible={dinasModalVisible} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <Animated.View
                        style={[
                            styles.modalContent,
                            { transform: [{ translateY: slideAnimDinas }] }
                        ]}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>PILIH INSTANSI</Text>
                            <TouchableOpacity onPress={() => setDinasModalVisible(false)}>
                                <Icon name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>
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
                        />
                    </Animated.View>
                </View>
            </Modal>

            {/* Confirmation Modal */}
            <Modal visible={confirmModalVisible} transparent animationType="fade">
                <View style={styles.confirmOverlay}>
                    <Animated.View
                        style={[
                            styles.confirmContent,
                            { transform: [{ translateY: slideAnimConfirm }] }
                        ]}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>KONFIRMASI DATA LAYANAN</Text>
                            <TouchableOpacity onPress={() => setConfirmModalVisible(false)}>
                                <Icon name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>NAMA LAYANAN</Text>
                                <Text style={styles.summaryValue}>{form.nama}</Text>
                            </View>

                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>DESKRIPSI</Text>
                                <Text style={[styles.summaryValue, { fontWeight: '400', fontSize: 13 }]}>{form.deskripsi}</Text>
                            </View>

                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>INSTANSI PENANGGUNG JAWAB</Text>
                                <View style={styles.summaryRowInner}>
                                    <Icon name="business" size={16} color="#3B82F6" />
                                    <Text style={styles.summaryValue}>{form.dinasNama}</Text>
                                </View>
                            </View>

                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>ESTIMASI WAKTU PENGERJAAN</Text>
                                <View style={styles.tag}>
                                    <Text style={styles.tagText}>{form.estimasiWaktu || '1'} HARI KERJA</Text>
                                </View>
                            </View>

                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>KONTAK LAYANAN</Text>
                                <View style={styles.summaryRowInner}>
                                    <Icon name="call" size={16} color="#10B981" />
                                    <Text style={styles.summaryValue}>{form.phoneNumber || '-'}</Text>
                                </View>
                                <View style={styles.summaryRowInner}>
                                    <Icon name="mail" size={16} color="#64748B" />
                                    <Text style={[styles.summaryValue, { fontWeight: '500' }]}>{form.email || '-'}</Text>
                                </View>
                            </View>
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.confirmBtn}
                            onPress={confirmSubmit}
                        >
                            <Text style={styles.confirmBtnText}>YA, SIMPAN LAYANAN SEKARANG</Text>
                            <Icon name="checkmark-circle" size={20} color="#0F172A" />
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
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
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0F172A',
        textAlign: 'center',
        letterSpacing: 1,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    col: {
        flex: 1,
    },
    dinasSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    dinasSelectorInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    dinasValue: {
        fontSize: 13,
        fontWeight: '800',
        color: '#1E293B',
    },
    footer: {
        marginTop: 24,
    },
    publishBtn: {
        backgroundColor: '#FFB800',
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 0,
    },
    publishBtnDisabled: {
        backgroundColor: '#E2E8F0',
    },
    publishBtnInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    publishBtnText: {
        color: '#0F172A',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
    },
    // Modal Selection
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
    },
    dinasItem: {
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    dinasItemText: {
        fontSize: 14,
        color: '#334155',
        fontWeight: '700',
    },
    // Confirmation Modal
    confirmOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        justifyContent: 'center',
        padding: 20,
    },
    confirmContent: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 0,
        borderWidth: 2,
        borderColor: '#0F172A',
        width: '100%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 12,
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
    summaryRowInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    tag: {
        backgroundColor: '#F1F5F9',
        paddingVertical: 6,
        paddingHorizontal: 10,
        alignSelf: 'flex-start',
    },
    tagText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#475569',
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
});
