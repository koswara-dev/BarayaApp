import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Alert,
    ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import Markdown from 'react-native-markdown-display';
import useAuthStore from '../../stores/authStore';
import useAnalisisStore from '../../stores/analisisAIStore';
import { Role } from '../../types/auth';

export default function AnalisisAIDetailScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { item } = route.params || {};
    const { user } = useAuthStore();
    const { deleteAnalisis } = useAnalisisStore();
    const [isDeleting, setIsDeleting] = useState(false);

    if (!item) return null;

    let color = '#64748B';
    if (item.kategori === 'PENGADUAN') color = '#3B82F6';
    else if (item.kategori === 'DARURAT') color = '#EF4444';
    else if (item.kategori === 'FEEDBACK') color = '#10B981';

    const handleDelete = () => {
        Alert.alert(
            "Hapus Analisis",
            "Apakah Anda yakin ingin menghapus hasil analisis ini? Tindakan ini tidak dapat dibatalkan.",
            [
                { text: "Batal", style: "cancel" },
                {
                    text: "Hapus",
                    style: "destructive",
                    onPress: async () => {
                        setIsDeleting(true);
                        try {
                            const success = await deleteAnalisis(item.id);
                            if (success) {
                                Alert.alert("Berhasil", "Data analisis berhasil dihapus", [
                                    { text: "OK", onPress: () => navigation.goBack() }
                                ]);
                            } else {
                                Alert.alert("Gagal", "Gagal menghapus data analisis");
                            }
                        } catch (error) {
                            Alert.alert("Error", "Terjadi kesalahan saat menghapus");
                        } finally {
                            setIsDeleting(false);
                        }
                    }
                }
            ]
        );
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
                    <Text style={styles.headerTitle}>Detail Analisis</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.metaCard}>
                    <View style={styles.row}>
                        <View style={[styles.badge, { backgroundColor: color }]}>
                            <Text style={styles.badgeText}>{item.kategori}</Text>
                        </View>
                        <Text style={styles.date}>
                            {new Date(item.createdAt).toLocaleString('id-ID')}
                        </Text>
                    </View>
                </View>

                <View style={styles.resultCard}>
                    <View style={styles.resultHeader}>
                        <Icon name="sparkles" size={20} color="#FFB800" />
                        <Text style={styles.resultTitle}>Hasil Analisis AI</Text>
                    </View>
                    <View style={styles.markdownBox}>
                        <Markdown style={{
                            body: { color: '#334155', fontSize: 14, lineHeight: 22 },
                            heading1: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginBottom: 10 },
                            heading2: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 8, marginTop: 12 },
                            strong: { fontWeight: 'bold', color: '#0F172A' },
                            list_item: { marginBottom: 6 },
                            bullet_list: { marginBottom: 12 }
                        }}>
                            {item.hasilAnalisis}
                        </Markdown>
                    </View>
                </View>

                {/* Delete Button for SUPERADMIN */}
                {user?.role === Role.SUPERADMIN && (
                    <TouchableOpacity 
                        style={styles.deleteButton} 
                        onPress={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Icon name="trash-outline" size={20} color="#FFF" />
                                <Text style={styles.deleteText}>Hapus Analisis</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}
                
                <View style={{ height: 40 }} />
            </ScrollView>
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
    metaCard: {
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    badgeText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 12,
    },
    date: {
        color: '#64748B',
        fontSize: 14,
    },
    resultCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    resultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        paddingBottom: 16,
    },
    resultTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0F172A',
    },
    markdownBox: {
        minHeight: 200,
    },
    deleteButton: {
        marginTop: 24,
        backgroundColor: '#EF4444',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
        shadowColor: "#EF4444",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    deleteText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
