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
    Dimensions
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { RootStackParamList } from '../navigation/types';
import { Feedback, FeedbackResponse } from '../types/service';
import api, { getImageUrl } from '../config/api';
import useAuthStore from '../stores/authStore';
import useToastStore from '../stores/toastStore';

type Props = NativeStackScreenProps<RootStackParamList, 'ServiceDetail'>;

const { width } = Dimensions.get('window');

const REQUIREMENTS = [
    { id: 1, title: 'Kartu Tanda Penduduk (KTP)', desc: 'Scan KTP pemohon yang masih berlaku.', icon: 'card-outline' },
    { id: 2, title: 'Bukti Kepemilikan Tanah', desc: 'Sertifikat Hak Milik (SHM) atau bukti legal lainnya.', icon: 'map-outline' },
    { id: 3, title: 'Gambar Rencana Bangunan', desc: 'Denah, tampak, potongan, dan detail arsitektur.', icon: 'business-outline' },
    { id: 4, title: 'Bukti Lunas PBB', desc: 'Bukti pembayaran PBB tahun terakhir.', icon: 'document-text-outline' },
];

const FLOW = [
    { step: 1, title: 'Pengajuan Permohonan', desc: 'Pemohon mengisi formulir dan upload dokumen via aplikasi.' },
    { step: 2, title: 'Verifikasi Administrasi', desc: 'Pemeriksaan kelengkapan dokumen oleh petugas front office.' },
    { step: 3, title: 'Peninjauan Lapangan', desc: 'Tim teknis melakukan survei lokasi bangunan.' },
    { step: 4, title: 'Perhitungan Retribusi', desc: 'Penetapan besaran biaya retribusi daerah.' },
    { step: 5, title: 'Pembayaran', desc: 'Pemohon melakukan pembayaran retribusi.' },
    { step: 6, title: 'Penerbitan SK', desc: 'Surat Keputusan Izin diterbitkan.', isDone: true },
];

export default function ServiceDetailScreen({ route, navigation }: Props) {
    const { service } = route.params;
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedAbout, setExpandedAbout] = useState(false);

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
            await api.post('/feedback', payload);
            showToast("Ulasan berhasil dikirim", "success");
            setMyRating(0);
            setMyReview("");
            fetchFeedbacks();
        } catch (error: any) {
            console.log("Post feedback error:", error);
            const errorMessage = error.response?.data?.message || "Gagal mengirim ulasan";
            showToast(errorMessage, "error");
        } finally {
            setSubmitting(false);
        }
    };

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

    const renderStars = (rating: number, size = 14, color = "#FFC107") => {
        return (
            <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Icon
                        key={star}
                        name={star <= rating ? "star" : "star-outline"}
                        size={size}
                        color={color}
                        style={{ marginRight: 2 }}
                    />
                ))}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header with White Background */}
            <View style={styles.headerWhite}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitleDark}>Detail Layanan</Text>
                <TouchableOpacity onPress={handleShare} style={styles.headerBtn}>
                    <Icon name="share-social-outline" size={24} color="#0F172A" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Hero Section */}
                <View style={styles.heroContainer}>
                    <Image
                        source={{ uri: service.image || 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=800' }}
                        style={styles.heroImage}
                    />
                    <View style={styles.heroOverlay}>
                        <View style={styles.heroBadgeRow}>
                            <View style={styles.categoryBadge}>
                                <Text style={styles.categoryBadgeText}>PERIZINAN</Text>
                            </View>
                            <View style={styles.onlineBadge}>
                                <Text style={styles.onlineBadgeText}>Online</Text>
                            </View>
                        </View>
                        <Text style={styles.heroTitle}>{service.nama}</Text>
                    </View>
                </View>

                {/* Responsible Dept */}
                <View style={styles.deptCard}>
                    <View style={styles.deptIconBox}>
                        <MaterialIcon name="business" size={24} color="#64748B" />
                    </View>
                    <View style={styles.deptInfo}>
                        <Text style={styles.deptLabel}>DINAS PENANGGUNG JAWAB</Text>
                        <Text style={styles.deptName}>{service.dinasNama || 'Dinas Penanaman Modal dan PTSP'}</Text>
                    </View>
                </View>

                {/* Info Grid */}
                <View style={styles.infoGrid}>
                    <View style={styles.infoBox}>
                        <View style={styles.infoIconLabel}>
                            <Icon name="time-outline" size={16} color="#64748B" />
                            <Text style={styles.infoLabel}>ESTIMASI WAKTU</Text>
                        </View>
                        <Text style={styles.infoValue}>{service.estimasiWaktu || '14'} Hari Kerja</Text>
                    </View>
                    <View style={styles.infoBox}>
                        <View style={styles.infoIconLabel}>
                            <Icon name="wallet-outline" size={16} color="#64748B" />
                            <Text style={styles.infoLabel}>BIAYA</Text>
                        </View>
                        <Text style={styles.infoValue}>Retribusi Daerah</Text>
                    </View>
                    <View style={[styles.infoBox, { borderBottomWidth: 0 }]}>
                        <View style={styles.infoIconLabel}>
                            <Icon name="call-outline" size={16} color="#64748B" />
                            <Text style={styles.infoLabel}>TELEPON</Text>
                        </View>
                        <Text style={styles.infoValue}>{service.phoneNumber || '(0232) 871123'}</Text>
                    </View>
                    <View style={[styles.infoBox, { borderBottomWidth: 0 }]}>
                        <View style={styles.infoIconLabel}>
                            <Icon name="mail-outline" size={16} color="#64748B" />
                            <Text style={styles.infoLabel}>EMAIL</Text>
                        </View>
                        <Text style={styles.infoValue} numberOfLines={1}>{service.email || 'dpmptsp@kuningan.go.id'}</Text>
                    </View>
                </View>

                {/* About Section */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Tentang Layanan</Text>
                    <Text
                        style={styles.aboutText}
                        numberOfLines={expandedAbout ? undefined : 3}
                    >
                        {service.deskripsi || 'Layanan permohonan persetujuan bangunan gedung (PBG) pengganti IMB untuk memastikan bangunan gedung memenuhi standar teknis keandalan bangunan gedung yang menjamin keselamatan, kesehatan, kenyamanan, dan kemudahan.'}
                    </Text>
                    <TouchableOpacity onPress={() => setExpandedAbout(!expandedAbout)} style={styles.readMoreBtn}>
                        <Text style={styles.readMoreText}>{expandedAbout ? 'Tampilkan Lebih Sedikit' : 'Baca Selengkapnya'}</Text>
                        <Icon name={expandedAbout ? "chevron-up" : "chevron-down"} size={16} color="#FFC107" />
                    </TouchableOpacity>
                </View>

                {/* Process Alur */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Alur Proses</Text>
                        <View style={styles.stepsBadge}>
                            <Text style={styles.stepsBadgeText}>6 Langkah</Text>
                        </View>
                    </View>

                    <View style={styles.flowContainer}>
                        {FLOW.map((item, index) => (
                            <View key={item.step} style={styles.flowItem}>
                                <View style={styles.flowLeft}>
                                    <View style={[styles.flowDot, item.isDone && styles.flowDotDone]}>
                                        {item.isDone ? <Icon name="checkmark" size={12} color="#FFF" /> : <Text style={styles.flowStepText}>{item.step}</Text>}
                                    </View>
                                    {index < FLOW.length - 1 && <View style={styles.flowLine} />}
                                </View>
                                <View style={styles.flowRight}>
                                    <Text style={styles.flowTitle}>{item.title}</Text>
                                    <Text style={styles.flowDesc}>{item.desc}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Documents */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Persyaratan Dokumen</Text>
                        <View style={styles.wajibBadge}>
                            <Text style={styles.wajibBadgeText}>WAJIB</Text>
                        </View>
                    </View>

                    <View style={styles.docsList}>
                        {REQUIREMENTS.map((doc) => (
                            <View key={doc.id} style={styles.docCard}>
                                <View style={styles.docIconBox}>
                                    <Icon name={doc.icon} size={20} color="#FFC107" />
                                </View>
                                <View style={styles.docInfo}>
                                    <Text style={styles.docTitle}>{doc.title}</Text>
                                    <Text style={styles.docDesc}>{doc.desc}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    <TouchableOpacity style={styles.seeAllDocsBtn}>
                        <Text style={styles.seeAllDocsText}>Lihat Semua Persyaratan</Text>
                        <Icon name="chevron-down" size={18} color="#64748B" />
                    </TouchableOpacity>
                </View>

                {/* Reviews & Ratings */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Ulasan & Rating</Text>
                        <TouchableOpacity onPress={fetchFeedbacks}>
                            <Text style={styles.seeAllLink}>Lihat Semua</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.ratingSummary}>
                        <View style={styles.ratingLeft}>
                            <Text style={styles.avgRatingText}>{stats.avg}</Text>
                            {renderStars(Number(stats.avg), 20)}
                            <Text style={styles.totalUlasanText}>{stats.total} Ulasan</Text>
                        </View>
                        <View style={styles.ratingRight}>
                            {[5, 4, 3, 2, 1].map((num) => {
                                const count = stats.counts[num as 1 | 2 | 3 | 4 | 5] || 0;
                                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                                return (
                                    <View key={num} style={styles.barRow}>
                                        <Text style={styles.barNum}>{num}</Text>
                                        <View style={styles.barTrack}>
                                            <View style={[styles.barFill, { width: `${percentage}%` }]} />
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    <View style={styles.userExperienceBox}>
                        <Text style={styles.expTitle}>Bagaimana pengalaman Anda?</Text>
                        <View style={styles.expStarsRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity key={star} onPress={() => setMyRating(star)}>
                                    <Icon
                                        name={star <= myRating ? "star" : "star-outline"}
                                        size={30}
                                        color={star <= myRating ? "#FFC107" : "#CBD5E1"}
                                        style={{ marginHorizontal: 4 }}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.reviewFormContainer}>
                            <TextInput
                                style={styles.reviewInput}
                                placeholder="Tuliskan ulasan Anda mengenai layanan ini..."
                                placeholderTextColor="#94A3B8"
                                multiline
                                numberOfLines={4}
                                value={myReview}
                                onChangeText={setMyReview}
                                textAlignVertical="top"
                            />
                            <TouchableOpacity
                                style={[styles.tulisUlasanBtn, (submitting || !myReview.trim() || myRating === 0) && styles.btnDisabled]}
                                onPress={handlePostFeedback}
                                disabled={submitting || !myReview.trim() || myRating === 0}
                            >
                                {submitting ? (
                                    <ActivityIndicator size="small" color="#0F172A" />
                                ) : (
                                    <Text style={styles.tulisUlasanText}>Kirim Ulasan</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Feedback List */}
                    {loading ? (
                        <ActivityIndicator color="#FFC107" style={{ marginVertical: 20 }} />
                    ) : (
                        feedbacks.slice(0, 3).map((item) => (
                            <View key={item.id} style={styles.reviewItem}>
                                <View style={styles.reviewUserRow}>
                                    <View style={styles.userAvatar}>
                                        <Text style={styles.userAvatarText}>{item.userName?.substring(0, 2).toUpperCase()}</Text>
                                    </View>
                                    <View style={styles.userInfo}>
                                        <Text style={styles.userNameText}>{item.userName}</Text>
                                        <Text style={styles.reviewTimeText}>2 hari lalu</Text>
                                    </View>
                                </View>
                                {renderStars(item.rating, 16)}
                                <Text style={styles.reviewMessageText}>{item.ulasan}</Text>
                            </View>
                        ))
                    )}
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Bottom Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.applyBtn}
                    onPress={() => showToast("Layanan ini dapat diajukan secara langsung di kantor dinas terkait.", "info")}
                >
                    <Icon name="document-text" size={20} color="#0F172A" style={{ marginRight: 10 }} />
                    <Text style={styles.applyBtnText}>Ajukan Permohonan</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    headerWhite: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 40,
        paddingHorizontal: 16,
        paddingBottom: 16,
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        zIndex: 100,
    },
    headerTitleDark: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
    },
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingBottom: 0,
    },
    heroContainer: {
        width: width,
        height: 280,
        backgroundColor: '#FFF',
        position: 'relative',
        // Shadow at the bottom
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        padding: 24,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        justifyContent: 'flex-end',
    },
    heroBadgeRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    categoryBadge: {
        backgroundColor: '#FFC107',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
        marginRight: 8,
    },
    categoryBadgeText: {
        color: '#0F172A',
        fontSize: 10,
        fontWeight: '800',
    },
    onlineBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#FFF',
    },
    onlineBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '700',
    },
    heroTitle: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: '800',
        lineHeight: 30,
        textShadowColor: 'rgba(0, 0, 0, 0.4)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    deptCard: {
        flexDirection: 'row',
        padding: 20,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    deptIconBox: {
        width: 44,
        height: 44,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    deptInfo: {
        flex: 1,
    },
    deptLabel: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '700',
        marginBottom: 2,
    },
    deptName: {
        fontSize: 14,
        color: '#0F172A',
        fontWeight: '700',
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    infoBox: {
        width: '50%',
        padding: 20,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#F1F5F9',
    },
    infoIconLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    infoLabel: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '700',
        marginLeft: 6,
    },
    infoValue: {
        fontSize: 15,
        color: '#0F172A',
        fontWeight: '700',
    },
    sectionContainer: {
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
    },
    aboutText: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 22,
        marginBottom: 12,
    },
    readMoreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    readMoreText: {
        fontSize: 14,
        color: '#FFC107',
        fontWeight: '700',
        marginRight: 4,
    },
    stepsBadge: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    stepsBadgeText: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '700',
    },
    flowContainer: {
        marginTop: 10,
    },
    flowItem: {
        flexDirection: 'row',
        minHeight: 70,
    },
    flowLeft: {
        alignItems: 'center',
        marginRight: 16,
    },
    flowDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    flowDotDone: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
    },
    flowStepText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#64748B',
    },
    flowLine: {
        flex: 1,
        width: 2,
        backgroundColor: '#E2E8F0',
        marginVertical: 4,
    },
    flowRight: {
        flex: 1,
        paddingBottom: 24,
    },
    flowTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 4,
    },
    flowDesc: {
        fontSize: 12,
        color: '#64748B',
        lineHeight: 18,
    },
    wajibBadge: {
        backgroundColor: '#0F172A',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
    },
    wajibBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '800',
    },
    docsList: {
        marginTop: 0,
    },
    docCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        marginBottom: 12,
        alignItems: 'center',
    },
    docIconBox: {
        width: 40,
        height: 40,
        backgroundColor: '#FFF9E6',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    docInfo: {
        flex: 1,
    },
    docTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 2,
    },
    docDesc: {
        fontSize: 12,
        color: '#94A3B8',
    },
    seeAllDocsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        marginTop: 8,
    },
    seeAllDocsText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '700',
        marginRight: 8,
    },
    seeAllLink: {
        fontSize: 14,
        color: '#FFC107',
        fontWeight: '700',
    },
    ratingSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
    },
    ratingLeft: {
        alignItems: 'center',
        paddingRight: 24,
        borderRightWidth: 1,
        borderRightColor: '#F1F5F9',
        marginRight: 24,
    },
    avgRatingText: {
        fontSize: 42,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 4,
    },
    totalUlasanText: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 8,
    },
    ratingRight: {
        flex: 1,
    },
    barRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    barNum: {
        width: 12,
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '700',
        marginRight: 10,
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
        backgroundColor: '#FFC107',
        borderRadius: 3,
    },
    userExperienceBox: {
        backgroundColor: '#F8FAFC',
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 32,
    },
    expTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 16,
    },
    expStarsRow: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    tulisUlasanBtn: {
        width: '100%',
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tulisUlasanText: {
        fontSize: 14,
        color: '#0F172A',
        fontWeight: '700',
    },
    reviewFormContainer: {
        width: '100%',
    },
    reviewInput: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 16,
        fontSize: 14,
        color: '#0F172A',
        minHeight: 100,
        marginBottom: 16,
    },
    btnDisabled: {
        backgroundColor: '#F1F5F9',
        borderColor: '#F1F5F9',
        opacity: 0.6,
    },
    reviewItem: {
        marginBottom: 24,
    },
    reviewUserRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#DBEAFE',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    userAvatarText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#3B82F6',
    },
    userInfo: {
        flex: 1,
    },
    userNameText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
    },
    reviewTimeText: {
        fontSize: 12,
        color: '#94A3B8',
    },
    starRow: {
        flexDirection: 'row',
        marginVertical: 4,
    },
    reviewMessageText: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 22,
        marginTop: 8,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        paddingBottom: 32,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    applyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFC107',
        height: 56,
        borderRadius: 12,
        shadowColor: '#FFC107',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    applyBtnText: {
        fontSize: 16,
        color: '#0F172A',
        fontWeight: '800',
    },
});
