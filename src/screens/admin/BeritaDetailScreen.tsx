import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    StatusBar,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import useBeritaStore from '../../stores/beritaStore';
import useToastStore from '../../stores/toastStore';
import { getImageUrl } from '../../config/api';
import useAuthStore from '../../stores/authStore';
import { Role } from '../../types/auth';
import Markdown from 'react-native-markdown-display';

export default function AdminBeritaDetailScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { item } = route.params || {};

    const { deleteBerita } = useBeritaStore();
    const { user } = useAuthStore();
    const showToast = useToastStore((state) => state.showToast);
    const [deleting, setDeleting] = useState(false);

    if (!item) return null;

    const handleDelete = () => {
        Alert.alert(
            'Konfirmasi Hapus',
            'Apakah Anda yakin ingin menghapus berita ini?',
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus',
                    style: 'destructive',
                    onPress: async () => {
                        setDeleting(true);
                        try {
                            await deleteBerita(item.id);
                            showToast('Berita berhasil dihapus', 'success');
                            navigation.goBack();
                        } catch (error: any) {
                            showToast(error.message || 'Gagal menghapus berita', 'error');
                        } finally {
                            setDeleting(false);
                        }
                    }
                }
            ]
        );
    };

    const handleEdit = () => {
        navigation.navigate('CreateBerita', { item });
    };

    const canManage = user?.role === Role.SUPERADMIN || user?.role === Role.EXECUTIVE || (user?.role === Role.ADMIN && user?.dinasId === item.dinasId);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detail Berita Kuningan Melesat</Text>
                {canManage && (
                    <TouchableOpacity onPress={handleEdit} style={styles.headerBtn}>
                        <Icon name="create-outline" size={24} color="#0F172A" />
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView style={styles.content}>
                <Image
                    source={item.urlGambar ? { uri: getImageUrl(item.urlGambar) } : { uri: 'https://placehold.co/600x400/png?text=No+Image' }}
                    style={styles.image}
                    resizeMode="cover"
                />

                <View style={styles.body}>
                    <View style={styles.metaRow}>
                        <View style={styles.dateTag}>
                            <Icon name="calendar" size={12} color="#64748B" />
                            <Text style={styles.dateText}>
                                {new Date(item.createdAt).toLocaleDateString('id-ID', {
                                    day: 'numeric', month: 'long', year: 'numeric'
                                })}
                            </Text>
                        </View>
                        {item.dinasNama && (
                            <View style={styles.dinasTag}>
                                <Icon name="business" size={12} color="#3B82F6" />
                                <Text style={styles.dinasText}>{item.dinasNama}</Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.title}>{item.judul}</Text>
                    <Markdown style={markdownStyles}>
                        {item.deskripsi}
                    </Markdown>
                </View>

                {canManage && (
                    <View style={styles.actionSection}>
                        <TouchableOpacity 
                            style={styles.deleteBtn} 
                            onPress={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <Icon name="trash-outline" size={20} color="#FFF" />
                                    <Text style={styles.deleteText}>HAPUS BERITA</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
                
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
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
        fontWeight: '700',
        color: '#0F172A',
    },
    content: {
        flex: 1,
    },
    image: {
        width: '100%',
        height: 240,
        backgroundColor: '#F1F5F9',
    },
    body: {
        padding: 20,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        flexWrap: 'wrap',
    },
    dateTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    dateText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    dinasTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    dinasText: {
        fontSize: 12,
        color: '#3B82F6',
        fontWeight: '600',
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 16,
        lineHeight: 30,
    },
    // desc style removed as it is replaced by markdownStyles
    actionSection: {
        padding: 20,
        paddingTop: 0,
        alignItems: 'center',
    },
    deleteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#EF4444',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        width: '100%',
    },
    deleteText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
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
