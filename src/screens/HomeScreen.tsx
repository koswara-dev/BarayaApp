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
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import useAuthStore from '../stores/authStore';
import useUserStore from '../stores/userStore';
import { getImageUrl } from '../config/api';

import GetLocation from 'react-native-get-location';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((state) => state.user);
  const { profile, fetchUserProfile } = useUserStore();

  const [weather, setWeather] = useState({ temp: '--', icon: 'partly-sunny', city: 'Mencari...' });
  const [activeBanner, setActiveBanner] = useState(0);

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
        city: city + ', ' + (geoData.address.state || 'Jabar')
      });
    } catch (error) {
      console.log('Weather error:', error);
      setWeather({ temp: '28°C', icon: 'partly-sunny', city: 'Kuningan, Jabar' });
    }
  };

  useEffect(() => {
    if (user?.id && !profile) {
      fetchUserProfile(user.id);
    }
    fetchWeather();
  }, [user?.id, profile, fetchUserProfile]);

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

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Big Header Section */}
        <View style={styles.bigHeaderContainer}>
          <Image
            source={{ uri: 'https://img.freepik.com/free-vector/gradient-dynamic-blue-lines-background_23-2148995756.jpg' }}
            style={styles.headerBackground}
          />
          <View style={styles.headerOverlay}>
            <View style={styles.headerTopRow}>
              <View style={styles.logoBox}>
                <Text style={styles.logoText}>KAB</Text>
                <Text style={styles.logoText}>KNG</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Notifikasi')} style={styles.notifButton}>
                <Icon name="notifications" size={24} color="#334155" />
                <View style={styles.notifBadge} />
              </TouchableOpacity>
            </View>

            <View style={styles.headerGreeting}>
              <Text style={styles.greetingTitle}>Kuningan Melesat</Text>
              <Text style={styles.greetingSubtitle}>SMART SERVICE</Text>
              <Text style={styles.greetingDesc}>Akses layanan publik dengan mudah dan cepat dalam satu genggaman.</Text>
            </View>
          </View>
        </View>

        {/* Search Bar - Floating */}
        <View style={styles.searchContainerFloating}>
          <Icon name="search-outline" size={20} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Cari Layanan di Kuningan..."
            placeholderTextColor="#94A3B8"
            style={styles.floatingSearchInput}
          />
        </View>

        {/* Menu Grid - 4 Columns x 2 Rows */}
        <View style={styles.menuGridContainer}>
          <View style={styles.menuRow}>
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
            <MenuItem
              icon="cart"
              label="Pasar"
              color="#EC4899"
            />
          </View>
          <View style={[styles.menuRow, { marginTop: 16 }]}>
            <MenuItem
              icon="newspaper"
              label="Berita"
              color="#10B981"
              onPress={() => navigation.jumpTo('Berita')}
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
            />
          </View>
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
            <TouchableOpacity key={item.id} style={styles.newsCard}>
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
    opacity: 0.3,
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
  logoBox: {
    width: 40,
    height: 40,
    backgroundColor: '#FFC107',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000000',
    lineHeight: 12,
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
  headerGreeting: {
    marginBottom: 10,
  },
  greetingTitle: {
    fontSize: 28,
    color: '#0F172A',
    fontWeight: '800',
    marginBottom: 4,
  },
  greetingSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  greetingDesc: {
    fontSize: 12,
    color: '#334155',
    maxWidth: '80%',
    lineHeight: 18,
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

  // Menu Grid
  menuGridContainer: {
    padding: 20,
    marginTop: 8,
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
