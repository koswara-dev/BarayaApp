import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
    ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import useAnalisisAIStore from '../../stores/analisisAIStore';
import useToastStore from '../../stores/toastStore';

const CATEGORIES = ['PENGADUAN', 'DARURAT', 'FEEDBACK'];

export default function CreateAnalisisAIScreen() {
    const navigation = useNavigation<any>();
    const { createAnalisis, loading } = useAnalisisAIStore();
    const showToast = useToastStore(state => state.showToast);

    const [selectedCategory, setSelectedCategory] = useState('PENGADUAN');

    const handleAnalyze = async () => {
        const success = await createAnalisis(selectedCategory as any);
        if (success) {
            showToast('Analisis berhasil dibuat', 'success');
            navigation.goBack();
        } else {
            showToast('Gagal membuat analisis, pastikan data tersedia', 'error');
        }
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
                    <Text style={styles.headerTitle}>Buat Analisis Baru</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content}>
                <Text style={styles.sectionTitle}>Pilih Kategori</Text>
                <Text style={styles.description}>
                    Pilih kategori data yang akan dianalisis oleh AI untuk hari ini.
                </Text>

                <View style={styles.categoryGrid}>
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            style={[
                                styles.categoryCard,
                                selectedCategory === cat && styles.categoryCardActive
                            ]}
                            onPress={() => setSelectedCategory(cat)}
                        >
                            <View style={[
                                styles.radio,
                                selectedCategory === cat && styles.radioActive
                            ]}>
                                {selectedCategory === cat && <View style={styles.radioInner} />}
                            </View>
                            <Text style={[
                                styles.categoryLabel,
                                selectedCategory === cat && styles.categoryLabelActive
                            ]}>
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.infoBox}>
                    <Icon name="information-circle" size={20} color="#3B82F6" />
                    <Text style={styles.infoText}>
                        Sistem akan mengambil data {selectedCategory} untuk tanggal hari ini ({new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}) dan melakukan analisis otomatis menggunakan AI.
                    </Text>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity 
                    style={[styles.analyzeBtn, loading && { opacity: 0.7 }]}
                    onPress={handleAnalyze}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Icon name="sparkles" size={20} color="#FFF" />
                            <Text style={styles.analyzeBtnText}>Mulai Analisis AI</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
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
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 24,
        lineHeight: 20,
    },
    categoryGrid: {
        gap: 12,
    },
    categoryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 12,
    },
    categoryCardActive: {
        borderColor: '#FFB800',
        backgroundColor: '#FFFBEB',
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioActive: {
        borderColor: '#FFB800',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#FFB800',
    },
    categoryLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    categoryLabelActive: {
        color: '#B45309', // Dark Amber
    },
    infoBox: {
        marginTop: 32,
        backgroundColor: '#EFF6FF',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        gap: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#1E40AF',
        lineHeight: 20,
    },
    footer: {
        padding: 20,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    analyzeBtn: {
        backgroundColor: '#10B981', // Green
        paddingVertical: 16,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    analyzeBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
    }
});
