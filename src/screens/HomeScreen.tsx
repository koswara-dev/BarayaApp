import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import useAuthStore from '../stores/authStore';
import useUserStore from '../stores/userStore';
import useLayananStore from '../stores/layananStore';
import { getImageUrl } from '../config/api';
import { useDebounce } from 'use-debounce';

import GetLocation from 'react-native-get-location';

const { width } = Dimensions.get('window');

const getServiceIcon = (name: string, category?: string) => {
  const lowerName = name.toLowerCase();
  const lowerCat = category?.toLowerCase() || '';

  if (lowerName.includes('ktp') || lowerName.includes('kk') || lowerName.includes('kependudukan')) return 'card-outline';
  if (lowerName.includes('sehat') || lowerName.includes('medis') || lowerCat.includes('kesehatan')) return 'medical-outline';
  if (lowerName.includes('pajak') || lowerCat.includes('pajak')) return 'calculator-outline';
  if (lowerName.includes('izin')) return 'business-outline';
  if (lowerName.includes('aduan') || lowerName.includes('megaphone')) return 'megaphone-outline';
  if (lowerName.includes('ambulans')) return 'ambulance-outline';
  if (lowerName.includes('map') || lowerName.includes('peta')) return 'map-outline';
  if (lowerName.includes('berita')) return 'newspaper-outline';
  if (lowerName.includes('bus') || lowerName.includes('trans')) return 'bus-outline';

  return 'grid-outline';
};

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((state) => state.user);
  const { profile, fetchUserProfile } = useUserStore();

  const {
    layanan: featuredServices,
    searchResults,
    loading: isLoadingFeatured,
    isSearching,
    fetchLayanan,
    searchLayanan
  } = useLayananStore();

  const [weather, setWeather] = useState({ temp: '--', icon: 'partly-sunny', city: 'Mencari...' });
  const [activeBanner, setActiveBanner] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [debouncedSearch] = useDebounce(searchQuery, 300); // Fery fast debounce

  useEffect(() => {
    if (!searchQuery.trim()) {
      useLayananStore.getState().searchLayanan(''); // Clear immediately
    }
  }, [searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchWeather(),
      fetchLayanan({ size: 8 })
    ]);
    setRefreshing(false);
  };

  useEffect(() => {
    searchLayanan(debouncedSearch);
  }, [debouncedSearch]);

  const fetchWeather = async () => {
    try {
      const location = await GetLocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
      });

      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current_weather=true`);
      const weatherData = await weatherRes.json();

      const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}`);
      const geoData = await geoRes.json();
      const city = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.county || 'Kuningan';

      const code = weatherData.current_weather.weathercode;
      let icon = 'partly-sunny';
      if (code === 0) icon = 'sunny';
      else if (code >= 1 && code <= 3) icon = 'partly-sunny';
      else if (code >= 45 && code <= 48) icon = 'cloudy';
      else if (code >= 51 && code <= 67) icon = 'rainy';
      else if (code >= 80 && code <= 82) icon = 'rainy';
      else if (code >= 95) icon = 'thunderstorm';

      setWeather({
        temp: `${Math.round(weatherData.current_weather.temperature)}°C`,
        icon,
        city: city
      });
    } catch (error) {
      console.log('Weather error:', error);
      setWeather(prev => ({
        ...prev,
        temp: prev.city === 'Mencari...' ? '--°C' : prev.temp,
        city: prev.city === 'Mencari...' ? 'Lokasi Belum Diketahui' : prev.city
      }));
    }
  };

  useEffect(() => {
    if (user?.id && !profile) {
      fetchUserProfile(user.id);
    }
  }, [user?.id, profile, fetchUserProfile]);

  useEffect(() => {
    fetchWeather();
    fetchLayanan({ size: 8 });
  }, []); // Run once on mount

  const banners = [
    {
      id: 1,
      title: 'KTP Digital Segera Hadir\ndi Kuningan',
      label: 'LAYANAN BARU',
      backgroundColor: '#2F3C46',
    },
    {
      id: 2,
      title: 'Pembayaran PBB\nLebih Mudah Online',
      label: 'INFO PAJAK',
      backgroundColor: '#1E293B',
    },
    {
      id: 3,
      title: 'Jadwal Samsat Keliling\nBulan Ini',
      label: 'PELAYANAN',
      backgroundColor: '#0F172A',
    }
  ];

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setActiveBanner(roundIndex);
  };

  const MenuItem = ({ icon, label, color, onPress }: { icon: string; label: string; color: string; onPress?: () => void }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIconContainer, { borderColor: '#E2E8F0', borderWidth: 1 }]}>
        <Icon name={icon} size={28} color={color} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#F0F4F8" barStyle="dark-content" />

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FFC107']} // Android
            tintColor="#FFC107" // iOS
          />
        }
      >

        {/* Big Header Section */}
        <View style={styles.bigHeaderContainer}>
          <Image
            source={require('../assets/banner.png')}
            style={styles.headerBackground}
            resizeMode="cover"
          />
          <View style={styles.headerOverlay}>
            <View style={styles.headerTopRow}>
              <View />
              <TouchableOpacity onPress={() => navigation.navigate('Notifikasi')} style={styles.notifButton}>
                <Icon name="notifications" size={24} color="#334155" />
                <View style={styles.notifBadge} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Search & Autocomplete Container */}
        <View style={{ zIndex: 100 }}>
          {/* Search Bar - Floating */}
          <View style={styles.searchContainerFloating}>
            <Icon name="search-outline" size={20} color="#FFC107" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Cari Layanan di Kuningan..."
              placeholderTextColor="#94A3B8"
              style={styles.floatingSearchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {isSearching && <ActivityIndicator size="small" color="#FFC107" style={{ marginRight: 8 }} />}
            {searchQuery.length > 0 && !isSearching && (
              <TouchableOpacity onPress={() => {
                setSearchQuery('');
                useLayananStore.getState().searchLayanan('');
              }}>
                <Icon name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Results Dropdown/List */}
          {searchQuery.length > 0 && (
            <View style={styles.searchResultsContainer}>
              {searchResults.length > 0 ? (
                searchResults.map((item: any) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.searchResultItem}
                    onPress={() => {
                      setSearchQuery('');
                      useLayananStore.getState().searchLayanan('');
                      navigation.navigate('ServiceDetail', { service: item });
                    }}
                  >
                    <View style={[styles.searchResultIcon, { justifyContent: 'center', alignItems: 'center' }]}>
                      <Icon name={getServiceIcon(item.nama_layanan || item.nama, item.kategori?.nama)} size={20} color="#FFC107" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.searchResultName} numberOfLines={1}>{item.nama_layanan || item.nama}</Text>
                      <Text style={styles.searchResultCategory}>{item.kategori?.nama || item.dinasNama || 'Layanan'}</Text>
                    </View>
                    <Icon name="chevron-forward" size={16} color="#CBD5E1" />
                  </TouchableOpacity>
                ))
              ) : (
                !isSearching && (
                  <View style={styles.noResultItem}>
                    <Icon name="search-outline" size={32} color="#E2E8F0" />
                    <Text style={styles.noResultText}>Ups! Layanan tidak ditemukan.</Text>
                    <Text style={styles.noResultSub}>Coba kata kunci lain atau periksa ejaan.</Text>
                  </View>
                )
              )}
            </View>
          )}
        </View>

        {/* Quick Start Menu Grid */}
        <View style={styles.quickStartContainer}>
          <View style={styles.menuRow}>
            <MenuItem
              icon="megaphone"
              label="Aduan Warga"
              color="#F59E0B"
              onPress={() => navigation.navigate('CreatePengaduan')}
            />
            <MenuItem
              icon="card"
              label="KTP & KK"
              color="#3B82F6"
              onPress={() => { }}
            />
            <MenuItem
              icon="medical"
              label="Ambulans"
              color="#EF4444"
              onPress={() => navigation.jumpTo('Darurat')}
            />
            <MenuItem
              icon="map"
              label="Peta"
              color="#8B5CF6"
            />
          </View>
          <View style={[styles.menuRow, { marginTop: 16 }]}>
            <MenuItem
              icon="newspaper"
              label="Berita"
              color="#10B981"
              onPress={() => navigation.navigate('Berita')}
            />
            <MenuItem
              icon="calculator"
              label="Pajak"
              color="#F59E0B"
            />
            <MenuItem
              icon="bus"
              label="Transportasi"
              color="#6366F1"
            />
            <MenuItem
              icon="grid"
              label="Semua"
              color="#64748B"
              onPress={() => navigation.jumpTo('Layanan')}
            />
          </View>
        </View>

        {/* Layanan Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionHeaderTitle, { marginHorizontal: 0, marginBottom: 0 }]}>
            Layanan Unggulan
          </Text>
          <TouchableOpacity onPress={() => navigation.jumpTo('Layanan')}>
            <Text style={styles.seeAllText}>Lihat Semua</Text>
          </TouchableOpacity>
        </View>

        {/* Featured Services - Horizontal Scroll */}
        <View style={styles.featuredGridContainer}>
          {isLoadingFeatured ? (
            <View style={{ height: 100, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator color="#FFC107" />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 16, paddingRight: 20 }}
            >
              {Array.isArray(featuredServices) && featuredServices.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.featuredServiceCard}
                  onPress={() => navigation.navigate("ServiceDetail", { service: item })}
                >
                  <View style={styles.featuredServiceIconContainer}>
                    <Icon name={getServiceIcon(item.nama_layanan || item.nama, item.kategori?.nama)} size={28} color="#FFC107" />
                  </View>
                  <Text style={styles.featuredServiceName} numberOfLines={2}>
                    {item.nama_layanan || item.nama}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Info/Widgets - Replicating 'Lencana/JakOne' style roughly */}
        <View style={styles.widgetsContainer}>
          <View style={styles.widgetBox}>
            <Text style={styles.widgetTitle}>Cuaca</Text>
            <View style={styles.weatherRow}>
              <Icon name={weather.icon} size={24} color="#F59E0B" />
              <Text style={styles.weatherText}>{weather.temp}</Text>
            </View>
            <Text style={styles.widgetSub}>{weather.city}</Text>
          </View>

          <View style={styles.widgetBox}>
            <Text style={styles.widgetTitle}>Antrian RS</Text>
            <TouchableOpacity style={styles.widgetButton}>
              <Text style={styles.widgetButtonText}>Daftar Online</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Banner Section - Moved to Bottom */}
        <View style={styles.bottomBannerSection}>
          <Text style={styles.sectionHeaderTitle}>Informasi Terkini</Text>
          <View style={styles.bannerContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              {banners.map((banner) => (
                <View key={banner.id} style={[styles.bannerCard, { backgroundColor: banner.backgroundColor, width: width - 32 }]}>
                  <View style={styles.bannerContent}>
                    <View style={styles.bannerLabelContainer}>
                      <Text style={styles.bannerLabel}>{banner.label}</Text>
                    </View>
                    <Text style={styles.bannerTitle}>{banner.title}</Text>
                    <TouchableOpacity style={styles.bannerButton}>
                      <Text style={styles.bannerButtonText}>Selengkapnya</Text>
                      <Icon name="arrow-forward" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.bannerImageOverlay} />
                </View>
              ))}
            </ScrollView>

            <View style={styles.paginationDots}>
              {banners.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    activeBanner === index ? styles.activeDot : null
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        {/* News Section / Berita Hari Ini */}
        <View style={styles.newsSection}>
          <Text style={styles.sectionHeaderTitle}>Berita Hari Ini</Text>

          {[
            {
              id: 1,
              title: "Pemkab Kuningan Raih Penghargaan SPBE Terbaik 2024",
              date: "20 Des 2024",
              category: "Pemerintahan",
              image: "https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&q=80&w=400"
            },
            {
              id: 2,
              title: "Festival Durian Perwata Siap Digelar Minggu Depan",
              date: "19 Des 2024",
              category: "Wisata",
              image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=400"
            },
            {
              id: 3,
              title: "Perbaikan Jalan Cipari-Cisantana Selesai 100%",
              date: "18 Des 2024",
              category: "Infrastruktur",
              image: "https://images.unsplash.com/photo-1596788069537-8e6d87e07664?auto=format&fit=crop&q=80&w=400"
            }
          ].map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.newsCard}
              onPress={() => navigation.navigate('Berita')}
            >
              <Image source={{ uri: item.image }} style={styles.newsImage} />
              <View style={styles.newsContent}>
                <View style={styles.newsMeta}>
                  <Text style={styles.newsCategory}>{item.category}</Text>
                  <Text style={styles.newsDate}>{item.date}</Text>
                </View>
                <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },

  // Big Header
  bigHeaderContainer: {
    height: 240,
    position: 'relative',
    backgroundColor: '#E0F2FE', // Fallback
  },
  headerBackground: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
    paddingBottom: 50, // Space for search bar overlap
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 10 : 0,
  },
  notifButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },

  // Floating Search
  searchContainerFloating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 25,
    marginTop: -25, // Negative margin to overlap
    elevation: 4,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    zIndex: 10,
  },
  floatingSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  searchResultsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    padding: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    zIndex: 100,
    position: 'absolute',
    top: 25,
    left: 0,
    right: 0,
    maxHeight: 400,
  },
  noResultItem: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
  },
  noResultSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  searchResultIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F8FAFC',
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  searchResultCategory: {
    fontSize: 12,
    color: '#64748B',
  },

  // Menu Grids
  quickStartContainer: {
    padding: 20,
    marginTop: 8,
  },
  featuredGridContainer: {
    paddingLeft: 20,
    marginTop: 8,
    marginBottom: 20,
  },
  featuredServiceCard: {
    width: 80,
    alignItems: 'center',
  },
  featuredServiceIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  featuredServiceIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  featuredServiceName: {
    fontSize: 11,
    textAlign: 'center',
    color: '#334155',
    fontWeight: '600',
    lineHeight: 14,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  menuItem: {
    alignItems: 'center',
    width: (width - 40) / 4,
  },
  menuIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26, // Circular
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#FFFFFF', // Light gray background
    borderWidth: 0, // No border for this style
  },
  menuLabel: {
    fontSize: 11,
    textAlign: 'center',
    color: '#334155',
    fontWeight: '500',
    lineHeight: 14,
    maxWidth: 64,
  },

  // Widgets
  widgetsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  widgetBox: {
    width: (width - 50) / 2,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  widgetTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  weatherText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginLeft: 8,
  },
  widgetSub: {
    fontSize: 10,
    color: '#94A3B8',
  },
  widgetButton: {
    backgroundColor: '#E0F2FE',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  widgetButtonText: {
    fontSize: 10,
    color: '#0284C7',
    fontWeight: '700',
  },

  // Bottom Banner
  bottomBannerSection: {
    paddingBottom: 24,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    marginTop: 16,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFC107',
  },
  bannerContainer: {
    paddingLeft: 20, // Align with margins
  },
  bannerCard: {
    height: 160,
    backgroundColor: '#2F3C46',
    borderRadius: 16,
    overflow: 'hidden',
    padding: 20,
    justifyContent: 'center',
    marginRight: 16,
  },
  bannerContent: {
    zIndex: 10,
    maxWidth: '75%',
  },
  bannerLabelContainer: {
    backgroundColor: '#FFC107',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 12,
  },
  bannerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    lineHeight: 22,
  },
  bannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  bannerImageOverlay: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 140,
    height: 140,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 70,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    marginRight: 20, // Compensate for paddingLeft
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#0F172A', // Changed to dark for bottom section
    width: 20,
  },

  // News Section Styles
  newsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  newsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    // Shadow
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  newsImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  newsContent: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  newsMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  newsCategory: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3B82F6',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  newsDate: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 20,
  },
});
