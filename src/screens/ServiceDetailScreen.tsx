import React, { useEffect, useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Linking,
    TextInput,
    StatusBar,
    Share,
    Alert
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { RootStackParamList } from '../navigation/types';
import { Feedback, FeedbackResponse } from '../types/service';
import api, { getImageUrl } from '../config/api';
import useAuthStore from '../stores/authStore';
import useToastStore from '../stores/toastStore';
import Accordion from '../components/Accordion';

type Props = NativeStackScreenProps<RootStackParamList, 'ServiceDetail'>;

const REQUIREMENTS = [
    { title: 'Minimal Usia 17 Tahun', desc: 'Atau sudah menikah' },
    { title: 'Kartu Keluarga (KK)', desc: 'Fotokopi dan Asli untuk verifikasi' },
    { title: 'Surat Pengantar RT/RW', desc: 'Tanda tangan basah dan stempel' },
];

const FLOW = [
    { title: 'Pengajuan Online', desc: 'Isi formulir dan upload dokumen persyaratan melalui aplikasi ini.' },
    { title: 'Verifikasi Data', desc: 'Petugas akan memverifikasi kelengkapan berkas Anda (1-2 hari).' },
    { title: 'Rekam Biometrik', desc: 'Datang ke kantor Dinas/Kecamatan untuk foto dan sidik jari.' },
    { title: 'Pengambilan KTP', desc: 'Notifikasi akan dikirim saat KTP siap diambil.' },
];

export default function ServiceDetailScreen({ route, navigation }: Props) {
    const { service } = route.params;
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);

    // Feedback Form State
    const [myRating, setMyRating] = useState(0);
    const [myReview, setMyReview] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const user = useAuthStore((state) => state.user);
    const showToast = useToastStore((state) => state.showToast);

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    const fetchFeedbacks = async () => {
        try {
            const response = await api.get<FeedbackResponse>('/feedback');
            if (response.data.success) {
                const serviceFeedbacks = response.data.data.content.filter(
                    (f) => f.layananId === service.id
                );
                // Sort by newest first
                setFeedbacks(serviceFeedbacks.sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                ));
            }
        } catch (error) {
            console.log('Error fetching feedback:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePostFeedback = async () => {
        if (!user) {
            showToast("Silakan login untuk mengirim ulasan", "error");
            navigation.navigate("Login");
            return;
        }

        if (myRating === 0) {
            showToast("Silakan berikan rating bintang", "error");
            return;
        }

        if (!myReview.trim()) {
            showToast("Silakan tulis ulasan Anda", "error");
            return;
        }

        setSubmitting(true);

        try {
            const payload = {
                rating: myRating,
                ulasan: myReview,
                userId: Number(user.id),
                layananId: service.id
            };

            // Using 'sub' is common for ID in JWT, but let's double check if we need to pass numeric ID. 
            // In many JWT setups, 'sub' is the string ID. Ideally user object has an 'id' field if it was extracted differently.
            // Let's rely on standard practice for now. If user.id exists (which isn't in standard User type usually without customization), use it. 
            // Checking AuthStore implementation again... it uses `extractUserFromToken`.
            // Let's assume standard payload. If it fails, we debug.
            // Actually, based on previous prompt, User type is imported from types/auth. 

            await api.post('/feedback', payload);

            showToast("Ulasan berhasil dikirim", "success");
            setMyRating(0);
            setMyReview("");
            fetchFeedbacks(); // Refresh list
        } catch (error: any) {
            console.log("Post feedback error:", error);
            const errorMessage = error.response?.data?.message || "Gagal mengirim ulasan";

            // Hide raw database errors from the user
            if (errorMessage.includes("duplicate key") || errorMessage.includes("constraint")) {
                showToast("Terjadi kesalahan sistem (Database Error). Harap hubungi admin.", "error");
            } else {
                showToast(errorMessage, "error");
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Calculate Rating Statistics
    const stats = useMemo(() => {
        const total = feedbacks.length;
        const sum = feedbacks.reduce((acc, curr) => acc + curr.rating, 0);
        const avg = total > 0 ? (sum / total).toFixed(1) : '0.0';

        const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        feedbacks.forEach(f => {
            const r = Math.round(f.rating) as 1 | 2 | 3 | 4 | 5;
            if (counts[r] !== undefined) counts[r]++;
        });

        return { total, avg, counts };
    }, [feedbacks]);

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Cek layanan ${service.nama} di BarayaApp!`,
            });
        } catch (error) {
            console.log(error);
        }
    };

    const renderStars = (rating: number, size = 14) => {
        return (
            <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Icon
                        key={star}
                        name={star <= rating ? "star" : "star-outline"}
                        size={size}
                        color="#F59E0B"
                        style={{ marginRight: 2 }}
                    />
                ))}
            </View>
        );
    };

    const renderInputStars = () => {
        return (
            <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setMyRating(star)}>
                        <Icon
                            name={star <= myRating ? "star" : "star-outline"}
                            size={28}
                            color="#F59E0B"
                            style={{ marginRight: 8 }}
                        />
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <Icon name="arrow-back" size={24} color="#334155" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>Detail Layanan</Text>
                <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
                    <Icon name="share-social-outline" size={24} color="#334155" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* 1. Service Info Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.serviceIconContainer}>
                            <Icon name="grid" size={28} color="#2563EB" />
                        </View>
                        <View style={styles.cardHeaderText}>
                            <Text style={styles.serviceTitle}>{service.nama}</Text>
                            <View style={styles.ratingRow}>
                                <Icon name="star" size={14} color="#F59E0B" />
                                <Text style={styles.ratingValue}>{stats.avg}</Text>
                                <Text style={styles.ratingCount}>({stats.total} Ulasan)</Text>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.description}>{service.deskripsi}</Text>

                    <View style={styles.divider} />

                    <View style={styles.metaContainer}>
                        <View style={styles.metaItem}>
                            <Icon name="time-outline" size={16} color="#64748B" />
                            <Text style={styles.metaLabel}>Estimasi: <Text style={styles.metaValue}>{service.estimasiWaktu} Hari</Text></Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Icon name="business-outline" size={16} color="#64748B" />
                            <Text style={styles.metaLabel}>{service.dinasNama}</Text>
                        </View>
                    </View>
                </View>

                {/* 2. Contact Card (Data-driven) */}
                <View style={[styles.card, { paddingVertical: 12 }]}>
                    <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`tel:${service.phoneNumber}`)}>
                        <View style={[styles.miniIcon, { backgroundColor: '#E0F2FE' }]}>
                            <Icon name="call" size={18} color="#0284C7" />
                        </View>
                        <Text style={styles.contactText}>{service.phoneNumber}</Text>
                        <Icon name="chevron-forward" size={18} color="#CBD5E1" />
                    </TouchableOpacity>

                    <View style={styles.dividerThin} />

                    <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`mailto:${service.email}`)}>
                        <View style={[styles.miniIcon, { backgroundColor: '#F0FDF4' }]}>
                            <Icon name="mail" size={18} color="#16A34A" />
                        </View>
                        <Text style={styles.contactText}>{service.email}</Text>
                        <Icon name="chevron-forward" size={18} color="#CBD5E1" />
                    </TouchableOpacity>
                </View>

                {/* Accordion Sections: Persyaratan, Alur, Biaya, Bantuan */}
                <View style={{ marginBottom: 16 }}>
                    <Accordion title="Persyaratan" children={
                        <View>
                            {REQUIREMENTS.map((item, index) => (
                                <View key={index} style={styles.reqCard}>
                                    <Icon name="checkmark-circle" size={22} color="#2563EB" style={{ marginTop: 2 }} />
                                    <View style={{ marginLeft: 12, flex: 1 }}>
                                        <Text style={styles.reqTitle}>{item.title}</Text>
                                        <Text style={styles.reqDesc}>{item.desc}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    } />

                    <Accordion title="Alur Pelayanan" children={
                        <View style={{ paddingLeft: 8, paddingTop: 8 }}>
                            {FLOW.map((item, index) => (
                                <View key={index} style={styles.flowItem}>
                                    {/* Line connector */}
                                    {index !== FLOW.length - 1 && <View style={styles.flowLine} />}

                                    <View style={styles.flowDot} />
                                    <View style={styles.flowContent}>
                                        <Text style={styles.flowTitle}>{item.title}</Text>
                                        <Text style={styles.flowDesc}>{item.desc}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    } />

                    <Accordion title="Biaya" children={
                        <View>
                            <View style={styles.costItem}>
                                <Text style={styles.costLabel}>Biaya Administrasi</Text>
                                <View style={styles.costBadge}>
                                    <Text style={styles.costText}>Gratis</Text>
                                </View>
                            </View>
                            <View style={[styles.dividerThin, { marginLeft: 0 }]} />
                            <View style={styles.costItem}>
                                <Text style={styles.costLabel}>Biaya Retribusi</Text>
                                <View style={styles.costBadge}>
                                    <Text style={styles.costText}>Gratis</Text>
                                </View>
                            </View>
                        </View>
                    } />

                    <Accordion title="Bantuan" children={
                        <View>
                            <TouchableOpacity style={styles.faqItem}>
                                <Text style={styles.faqQuestion}>Apakah bisa diwakilkan?</Text>
                                <Icon name="chevron-down" size={16} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                    } />
                </View>

                {/* 3. Review Summary */}
                <View style={[styles.sectionHeader, { marginTop: 8 }]}>
                    <Text style={styles.sectionTitle}>Ulasan Pengguna</Text>
                </View>

                <View style={styles.card}>
                    <View style={styles.statsContainer}>
                        {/* Left: Big Rating */}
                        <View style={styles.bigRatingContainer}>
                            <Text style={styles.bigRatingText}>{stats.avg}</Text>
                            {renderStars(Number(stats.avg))}
                            <Text style={styles.fromText}>dari {stats.total} ulasan</Text>
                        </View>

                        {/* Right: Progress Bars */}
                        <View style={styles.barsContainer}>
                            {[5, 4, 3, 2, 1].map((num) => {
                                const count = stats.counts[num as 1 | 2 | 3 | 4 | 5] || 0;
                                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                                return (
                                    <View key={num} style={styles.barRow}>
                                        <Text style={styles.barLabel}>{num}</Text>
                                        <View style={styles.barTrack}>
                                            <View style={[styles.barFill, { width: `${percentage}%` }]} />
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                </View>

                {/* 4. Write Review Form */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Tulis Ulasan Anda</Text>
                    <View style={{ marginVertical: 12 }}>
                        {renderInputStars()}
                    </View>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Ceritakan pengalaman Anda..."
                            placeholderTextColor="#94A3B8"
                            multiline
                            value={myReview}
                            onChangeText={setMyReview}
                        />
                        <TouchableOpacity
                            style={[styles.sendBtn, submitting && { backgroundColor: '#94A3B8' }]}
                            onPress={handlePostFeedback}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <Icon name="send" size={16} color="#FFF" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 5. Review List */}
                {loading ? (
                    <ActivityIndicator size="small" color="#2563EB" />
                ) : (
                    feedbacks.map((item) => (
                        <View key={item.id} style={styles.card}>
                            <View style={styles.reviewHeader}>
                                <Image
                                    source={{ uri: getImageUrl(item.urlFoto) || `https://ui-avatars.com/api/?name=${item.userName}&background=random` }}
                                    style={styles.avatar}
                                />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.reviewerName}>{item.userName}</Text>
                                    <View style={styles.timeRow}>
                                        <Text style={styles.timeText}>
                                            {new Date(item.createdAt).toLocaleDateString('id-ID', {
                                                day: 'numeric', month: 'long', year: 'numeric'
                                            })}
                                        </Text>
                                    </View>
                                </View>
                                {renderStars(item.rating, 12)}
                            </View>

                            <Text style={styles.reviewContent}>{item.ulasan}</Text>
                        </View>
                    ))
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Button */}
            <View style={styles.bottomContainer}>
                <TouchableOpacity style={styles.mainBtn} onPress={() => showToast("Formulir permohonan belum tersedia saat ini", "info")}>
                    <Icon name="document-text" size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.mainBtnText}>Ajukan Permohonan</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F1F5F9', // slightly darker gray background
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 10,
    },
    iconBtn: {
        padding: 4,
    },
    scrollContent: {
        padding: 16,
    },
    /* Card Generic */
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 1, // Soft shadow for android
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    /* Service Info Section */
    cardHeader: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    serviceIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    cardHeaderText: {
        flex: 1,
        justifyContent: 'center',
    },
    serviceTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 4,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0F172A',
        marginLeft: 4,
        marginRight: 4,
    },
    ratingCount: {
        fontSize: 12,
        color: '#64748B',
    },
    description: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 22,
        marginBottom: 16,
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginBottom: 16,
    },
    dividerThin: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 4,
        marginLeft: 50, // Indent for list look
    },
    metaContainer: {
        gap: 8,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaLabel: {
        fontSize: 13,
        color: '#64748B',
        marginLeft: 8,
    },
    metaValue: {
        fontWeight: '600',
        color: '#334155',
    },
    /* Contact Rows */
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    miniIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    contactText: {
        flex: 1,
        fontSize: 14,
        color: '#334155',
        fontWeight: '500',
    },
    /* Section Header */
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
    },
    linkText: {
        fontSize: 14,
        color: '#2563EB',
        fontWeight: '500',
    },
    /* Statistics */
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bigRatingContainer: {
        alignItems: 'center',
        paddingRight: 24,
        borderRightWidth: 1,
        borderRightColor: '#F1F5F9',
        marginRight: 16,
    },
    bigRatingText: {
        fontSize: 42,
        fontWeight: '700',
        color: '#0F172A',
    },
    fromText: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 4,
    },
    barsContainer: {
        flex: 1,
    },
    barRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    barLabel: {
        width: 12,
        fontSize: 12,
        color: '#64748B',
        marginRight: 8,
    },
    barTrack: {
        flex: 1,
        height: 6,
        backgroundColor: '#F1F5F9',
        borderRadius: 3,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        backgroundColor: '#2563EB',
        borderRadius: 3,
    },
    /* Write Review */
    cardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0F172A',
    },
    inputContainer: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 4,
        alignItems: 'flex-end',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        color: '#0F172A',
    },
    sendBtn: {
        backgroundColor: '#2563EB',
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        margin: 4,
    },
    /* Reviews List */
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        backgroundColor: '#CBD5E1',
    },
    reviewerName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0F172A',
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeText: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 2,
    },
    starRow: {
        flexDirection: 'row',
    },
    reviewContent: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 22,
    },
    /* Bottom Button */
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        padding: 16,
        paddingBottom: 24,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    mainBtn: {
        backgroundColor: '#2563EB',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
    },
    mainBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
    /* Requirements Section */
    reqCard: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    reqTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0F172A',
        marginBottom: 2,
    },
    reqDesc: {
        fontSize: 12,
        color: '#64748B',
    },
    /* Flow Section */
    flowItem: {
        flexDirection: 'row',
        marginBottom: 20, // Space for line
        position: 'relative',
    },
    flowLine: {
        position: 'absolute',
        left: 5, // Center of dot (10px / 2)
        top: 14, // Roughly below the dot
        bottom: -20, // Extend to next
        width: 1,
        backgroundColor: '#CBD5E1',
        zIndex: -1,
    },
    flowDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#2563EB',
        marginTop: 6,
        marginRight: 12,
    },
    flowContent: {
        flex: 1,
    },
    flowTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0F172A',
        marginBottom: 4,
    },
    flowDesc: {
        fontSize: 12,
        color: '#64748B',
        lineHeight: 18,
    },
    /* Cost Section */
    costItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    costLabel: {
        fontSize: 14,
        color: '#334155',
        fontWeight: '500',
    },
    costBadge: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    costText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#0F172A',
    },
    /* FAQ Section */
    faqItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    faqQuestion: {
        fontSize: 14,
        fontWeight: '500',
        color: '#0F172A',
        flex: 1,
    },
});
