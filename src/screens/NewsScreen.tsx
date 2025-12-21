import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Image,
    Platform,
    StatusBar,
    Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const CATEGORIES = ['TERKINI', 'PENGUMUMAN', 'PEMERINTAHAN', 'WISATA', 'INOVASI'];

const NEWS_DATA = [
    {
        id: '1',
        title: 'Jadwal Pemeliharaan Server Layanan Kependudukan Tanggal 15 Oktober 2023',
        description: 'Diberitahukan kepada seluruh warga Kabupaten Kuningan bahwa akan dilakukan pemeliharaan server untuk meningkatkan kualitas layanan kependudukan...',
        category: 'PENGUMUMAN',
        time: '2 Jam yang lalu',
        image: 'https://images.unsplash.com/photo-1558444349-29d29f993d3e?auto=format&fit=crop&q=80&w=400',
    },
    {
        id: '2',
        title: 'Jadwal SIM Keliling Wilayah Kuningan Minggu Ini (16-22 Oktober)',
        description: 'Simak lokasi dan jadwal lengkap pelayanan SIM keliling untuk wilayah Kabupaten Kuningan selama satu minggu kedepan...',
        category: 'LAYANAN PUBLIK',
        time: 'Kemarin',
        image: 'https://images.unsplash.com/photo-1614035030394-b6e5b01e0737?auto=format&fit=crop&q=80&w=400',
    },
    {
        id: '3',
        title: 'Festival Durian Lokal Siap Meriahkan Akhir Pekan di Kebun...',
        description: 'Puluhan petani durian lokal akan memamerkan hasil panen terbaik mereka dalam ajang tahunan yang digelar di desa wisata...',
        category: 'WISATA',
        time: '2 Hari lalu',
        image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=400',
    },
    {
        id: '4',
        title: 'Peringatan Dini Potensi Hujan Lebat Disertai Angin Kencang',
        description: 'BMKG menghimbau masyarakat di wilayah pegunungan untuk waspada terhadap potensi bencana hidrometeorologi dalam beberapa hari kedepan...',
        category: 'INFO CUACA',
        time: '3 Hari lalu',
        image: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?auto=format&fit=crop&q=80&w=400',
    },
    {
        id: '5',
        title: 'Desa Wisata Cibuntu Raih Penghargaan Desa Digital Terbaik...',
        description: 'Pencapaian membanggakan bagi sektor pariwisata berbasis komunitas di wilayah kaki gunung Ciremai dengan pemanfaatan teknologi...',
        category: 'INOVASI',
        time: '4 Hari lalu',
        image: 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&q=80&w=400',
    },
];

export default function NewsScreen() {
    const navigation = useNavigation();
    const [activeCategory, setActiveCategory] = useState('TERKINI');
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Kabar Kuningan</Text>
                <TouchableOpacity style={styles.headerBtn}>
                    <Icon name="notifications" size={24} color="#0F172A" />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBox}>
                    <Icon name="search-outline" size={20} color="#94A3B8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Cari berita atau pengumuman..."
                        placeholderTextColor="#94A3B8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {/* Categories */}
            <View style={styles.categoryContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                    {CATEGORIES.map(cat => (
                        <TouchableOpacity
                            key={cat}
                            style={[styles.categoryTab, activeCategory === cat && styles.activeCategoryTab]}
                            onPress={() => setActiveCategory(cat)}
                        >
                            <Text style={[styles.categoryText, activeCategory === cat && styles.activeCategoryText]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Featured News */}
                <TouchableOpacity style={styles.featuredCard}>
                    <Image
                        source={{ uri: 'https://img.freepik.com/free-vector/gradient-dynamic-blue-lines-background_23-2148995756.jpg' }}
                        style={styles.featuredImage}
                    />
                    <View style={styles.featuredOverlay}>
                        <View style={styles.featuredHeader}>
                            <View style={styles.mainNewsBadge}>
                                <Text style={styles.mainNewsBadgeText}>BERITA UTAMA</Text>
                            </View>
                        </View>
                        <View style={styles.featuredContent}>
                            <Text style={styles.featuredMeta}>12 Okt 2023  •  Pemerintahan</Text>
                            <Text style={styles.featuredTitle} numberOfLines={2}>
                                Bupati Resmikan Pusat Data Terpadu "Kuningan Satu Data" Untuk...
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* News List */}
                <View style={styles.newsList}>
                    {NEWS_DATA.map(news => (
                        <TouchableOpacity key={news.id} style={styles.newsItem}>
                            <View style={styles.newsTextContent}>
                                <View style={styles.newsHeader}>
                                    <View style={styles.newsCategoryBadge}>
                                        <Text style={styles.newsCategoryText}>{news.category}</Text>
                                    </View>
                                    <View style={styles.newsTimeRow}>
                                        <Icon name="time-outline" size={14} color="#94A3B8" />
                                        <Text style={styles.newsTimeText}>{news.time}</Text>
                                    </View>
                                </View>
                                <Text style={styles.newsTitle} numberOfLines={2}>{news.title}</Text>
                                <Text style={styles.newsDesc} numberOfLines={2}>{news.description}</Text>
                            </View>
                            {news.image && (
                                <Image source={{ uri: news.image }} style={styles.newsItemImage} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Load More */}
                <TouchableOpacity style={styles.loadMoreBtn}>
                    <Text style={styles.loadMoreText}>Muat Lebih Banyak</Text>
                    <Icon name="chevron-down" size={20} color="#FFB800" />
                </TouchableOpacity>

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
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 16,
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
        fontSize: 18,
        fontWeight: "900",
        color: "#0F172A",
    },
    searchContainer: {
        padding: 16,
        backgroundColor: '#FFFFFF',
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 4,
        paddingHorizontal: 12,
        height: 48,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: '#0F172A',
        fontWeight: '500',
    },
    categoryContainer: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    categoryScroll: {
        paddingHorizontal: 16,
        gap: 8,
    },
    categoryTab: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
    },
    activeCategoryTab: {
        backgroundColor: '#FFB800',
        borderColor: '#FFB800',
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '900',
        color: '#64748B',
    },
    activeCategoryText: {
        color: '#FFFFFF',
    },
    content: {
        flex: 1,
        backgroundColor: '#FCFDFF',
    },
    scrollContent: {
        paddingBottom: 20,
    },
    featuredCard: {
        width: width,
        height: 240,
        backgroundColor: '#0F172A',
        position: 'relative',
    },
    featuredImage: {
        width: '100%',
        height: '100%',
        opacity: 0.6,
    },
    featuredHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    featuredOverlay: {
        ...StyleSheet.absoluteFillObject,
        padding: 20,
        justifyContent: 'space-between',
    },
    mainNewsBadge: {
        backgroundColor: '#EF4444',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    mainNewsBadgeText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    featuredContent: {
        marginBottom: 10,
    },
    featuredMeta: {
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: '700',
        marginBottom: 8,
        opacity: 0.9,
    },
    featuredTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFFFFF',
        lineHeight: 30,
    },
    newsList: {
        backgroundColor: '#FFFFFF',
    },
    newsItem: {
        flexDirection: 'row',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    newsTextContent: {
        flex: 1,
        paddingRight: 16,
    },
    newsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    newsCategoryBadge: {
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 2,
    },
    newsCategoryText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#3B82F6',
        letterSpacing: 0.5,
    },
    newsTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    newsTimeText: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '700',
    },
    newsTitle: {
        fontSize: 15,
        fontWeight: '900',
        color: '#1E293B',
        lineHeight: 22,
        marginBottom: 8,
    },
    newsDesc: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 20,
        fontWeight: '500',
    },
    newsItemImage: {
        width: 100,
        height: 100,
        borderRadius: 4,
        backgroundColor: '#F1F5F9',
    },
    loadMoreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
        gap: 4,
    },
    loadMoreText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#FFB800',
    },
});
