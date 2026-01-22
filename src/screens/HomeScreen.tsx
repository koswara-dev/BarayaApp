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
  Platform,
  ActivityIndicator,
  RefreshControl,
  Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import useAuthStore from '../stores/authStore';
import { Role } from '../types/auth';
import useUserStore from '../stores/userStore';
import useLayananStore from '../stores/layananStore';
import useEventStore from '../stores/eventStore';
import useNotificationStore from '../stores/notificationStore';
import usePengaturanStore from '../stores/pengaturanStore';
import useBeritaStore from '../stores/beritaStore';
import api, { getImageUrl } from '../config/api';
import { useDebounce } from 'use-debounce';

import GetLocation from 'react-native-get-location';
import { TourGuideProvider, TourGuideZone, useTourGuideController } from 'rn-tourguide';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

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

const HomeScreenContent = () => {
  const { start, canStart, stop, eventEmitter } = useTourGuideController();
  const navigation = useNavigation<any>();
  const user = useAuthStore((state) => state.user);
  const { profile, fetchUserProfile } = useUserStore();

  useEffect(() => {
    if (canStart) {
      const checkTour = async () => {
        try {
          const hasSeen = await AsyncStorage.getItem('hasSeenTour');
          if (!hasSeen) {
            start();
            await AsyncStorage.setItem('hasSeenTour', 'true');
          }
        } catch (e) {
          // ignore
          start();
        }
      };
      checkTour();
    }
  }, [canStart]);

  const {
    layanan: featuredServices,
    searchResults,
    loading: isLoadingFeatured,
    isSearching,
    fetchLayanan,
    searchLayanan
  } = useLayananStore();

  const { events, loading: isLoadingEvents, fetchEvents } = useEventStore();
  const { list: beritaList, loading: isLoadingBerita, fetchBerita } = useBeritaStore();
  const [weather, setWeather] = useState({ temp: '--', icon: 'partly-sunny', city: 'Mencari...' });
  const [activeBanner, setActiveBanner] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [debouncedSearch] = useDebounce(searchQuery, 300); // Very fast debounce


  // Hook moved here to preserve hook order during hot reload
  const { notifications, startPolling, stopPolling } = useNotificationStore();
  const { pengaturan, fetchPengaturan } = usePengaturanStore();
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!searchQuery.trim()) {
      useLayananStore.getState().searchLayanan(''); // Clear immediately
    }
  }, [searchQuery]);



  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchWeather(),
      fetchLayanan({ size: 8 }),
      fetchEvents({ size: 5 }),
      fetchBerita({ page: 0 }),
      fetchPengaturan()
    ]);
    setRefreshing(false);
  };

  useEffect(() => {
    searchLayanan(debouncedSearch);
  }, [debouncedSearch]);

  const fetchWeather = async () => {
    try {
      let permissionResult;
      
      if (Platform.OS === 'android') {
        permissionResult = await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
        if (permissionResult === RESULTS.DENIED) {
          permissionResult = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
        }
      } else {
        permissionResult = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        if (permissionResult === RESULTS.DENIED) {
          permissionResult = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        }
      }

      if (permissionResult !== RESULTS.GRANTED && permissionResult !== RESULTS.LIMITED) {
        setWeather({
            temp: '--°C',
            icon: 'partly-sunny',
            city: 'Izin Lokasi Ditolak'
        });
        return;
      }

      const location = await GetLocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
      });

      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current_weather=true`);
      const weatherData = await weatherRes.json();

      const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}`, {
        headers: {
            'User-Agent': 'BarayaApp/1.0.0'
        }
      });
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
    fetchEvents({ size: 5 });
    fetchBerita({ page: 0 });
    fetchPengaturan();
    
    startPolling();
    return () => stopPolling();
  }, []); // Run once on mount

  const banners = [
    // ... (existing banners)
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
            source={pengaturan?.urlBannerMobile ? { uri: getImageUrl(pengaturan.urlBannerMobile) } : require('../assets/banner.png')}
            style={styles.headerBackground}
            resizeMode="cover"
          />
          <View style={styles.headerOverlay}>
            <View style={styles.headerTopRow}>
              {(user?.role === Role.SUPERADMIN || user?.role === Role.EXECUTIVE || user?.role === Role.ADMIN) ? (
                <TouchableOpacity onPress={() => navigation.navigate('AdminMain')} style={styles.notifButton}>
                  <Icon name="swap-horizontal" size={24} color="#334155" />
                </TouchableOpacity>
              ) : (
                <View />
              )}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={() => start()} style={styles.notifButton}>
                    <Icon name="help-circle-outline" size={24} color="#334155" />
                </TouchableOpacity>
                <TourGuideZone
                    zone={1}
                    text="Cek notifikasi terbaru dan info darurat di sini"
                    borderRadius={20}
                >
                    <TouchableOpacity onPress={() => navigation.navigate('Notifikasi')} style={styles.notifButton}>
                        <Icon name="notifications" size={24} color="#334155" />
                        {unreadCount > 0 && (
                        <View style={styles.notifBadge}>
                            <Text style={styles.notifBadgeText}>
                            {unreadCount > 9 ? '9+' : unreadCount}
                            </Text>
                        </View>
                        )}
                    </TouchableOpacity>
                </TourGuideZone>
              </View>
            </View>
          </View>
        </View>

        {/* Search & Autocomplete Container */}
        <View style={{ zIndex: 100 }}>
          {/* Search Bar - Floating */}
          <View style={styles.searchContainerFloating}>
             <TourGuideZone
                zone={2}
                text="Cari layanan apapun dengan cepat di sini"
                borderRadius={25}
                style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}
             >
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
             </TourGuideZone>
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
        <TourGuideZone
            zone={3}
            text="Akses cepat ke layanan penting"
            borderRadius={12}
            style={styles.quickStartContainer}
        >
          <View style={styles.menuRow}>
            <MenuItem
              icon="megaphone"
              label="Aduan Warga"
              color="#F59E0B"
              onPress={() => navigation.navigate('CreatePengaduan')}
            />
            <MenuItem
              icon="card"
              label="Samsat Keliling"
              color="#3B82F6"
              onPress={() => navigation.navigate('SamsatKeliling')}
            />
            <MenuItem
              icon="medical"
              label="Ambulans"
              color="#EF4444"
              onPress={() => navigation.navigate('Layanan', { query: 'ambulans' })} // Use 'ambulans' standard term
            />
            <MenuItem
              icon="map"
              label="Peta"
              color="#8B5CF6"
              onPress={() => Linking.openURL('https://www.google.com/maps/search/?api=1&query=-6.9613261,108.4701179')}
            />
          </View>
          <View style={[styles.menuRow, { marginTop: 16 }]}>
            <MenuItem
              icon="newspaper"
              label="Berita"
              color="#10B981"
              onPress={() => navigation.navigate('Webview', { 
                url: 'https://kuningankab.go.id/home/',
                title: 'Portal Berita Kuningan'
              })}
            />
            <MenuItem
              icon="calculator"
              label="Pajak"
              color="#F59E0B"
              onPress={() => navigation.navigate('Webview', { 
                url: 'https://bapenda.jabarprov.go.id/samsat-mobile-jawa-barat-sambara',
                title: 'Info Pajak'
              })}
            />
            <MenuItem
              icon="bus"
              label="Transportasi"
              color="#6366F1"
              onPress={() => navigation.navigate('Layanan', { query: 'transportasi' })}
            />
            <MenuItem
              icon="grid"
              label="Semua"
              color="#64748B"
              onPress={() => navigation.jumpTo('Layanan')}
            />
          </View>
        </TourGuideZone>

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
        <TourGuideZone
            zone={4}
            text="Temukan layanan populer lainnya di sini"
            borderRadius={10}
            style={styles.featuredGridContainer}
        >
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
        </TourGuideZone>

        {/* Pimpinan Daerah / Bupati Section */}
        {pengaturan && (pengaturan.urlFotoBupati || pengaturan.urlFotoWakilBupati) && (
            <View style={styles.pimpinanSection}>
                <Text style={styles.sectionHeaderTitle}>Pimpinan Daerah</Text>
                <View style={styles.pimpinanContainer}>
                    {/* Bupati */}
                    <View style={styles.pimpinanCard}>
                        <View style={styles.pimpinanImageWrapper}>
                           <Image 
                                source={pengaturan.urlFotoBupati ? { uri: getImageUrl(pengaturan.urlFotoBupati) } : { uri: 'https://ui-avatars.com/api/?name=' + (pengaturan.namaBupati || 'Bupati') }} 
                                style={styles.pimpinanImage}
                                resizeMode="cover"
                            />
                        </View>
                        <View style={styles.pimpinanInfo}>
                            <Text style={styles.jabatanLabel}>BUPATI</Text>
                            <Text style={styles.pimpinanName} numberOfLines={2}>
                                {pengaturan.namaBupati || 'Nama Bupati'}
                            </Text>
                        </View>
                    </View>
                    
                    {/* Wakil Bupati */}
                    <View style={styles.pimpinanCard}>
                         <View style={styles.pimpinanImageWrapper}>
                           <Image 
                                source={pengaturan.urlFotoWakilBupati ? { uri: getImageUrl(pengaturan.urlFotoWakilBupati) } : { uri: 'https://ui-avatars.com/api/?name=' + (pengaturan.namaWakilBupati || 'Wakil') }} 
                                style={styles.pimpinanImage}
                                resizeMode="cover"
                            />
                        </View>
                        <View style={styles.pimpinanInfo}>
                            <Text style={styles.jabatanLabel}>WAKIL BUPATI</Text>
                           <Text style={styles.pimpinanName} numberOfLines={2}>
                                {pengaturan.namaWakilBupati || 'Nama Wakil'}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        )}

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
            <TouchableOpacity 
              style={styles.widgetButton}
              onPress={() => navigation.navigate('Webview', { 
                url: 'https://daftar.rsud45.com/',
                title: 'Antrian RSUD 45'
              })}
            >
              <Text style={styles.widgetButtonText}>Daftar Online</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Banner Section - Moved to Bottom */}
        <View style={styles.bottomBannerSection}>
          <Text style={styles.sectionHeaderTitle}>Berita Terkini</Text>
          <View style={styles.bannerContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              {beritaList.slice(0, 5).map((item: any) => (
                <View key={item.id} style={[styles.bannerCard, { width: width - 32, backgroundColor: '#1E293B', overflow: 'hidden' }]}>
                    {/* Background Image */}
                    <Image 
                        source={item.urlGambar ? { uri: getImageUrl(item.urlGambar) } : require('../assets/banner.png')}
                        style={StyleSheet.absoluteFillObject}
                        resizeMode="cover"
                    />
                    {/* Dark Overlay */}
                   <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />

                  <View style={styles.bannerContent}>
                    <View style={styles.bannerLabelContainer}>
                      <Text style={styles.bannerLabel}>{item.dinasKode || 'Informasi'}</Text>
                    </View>
                    <Text style={styles.bannerTitle} numberOfLines={2}>{item.judul}</Text>
                    <TouchableOpacity 
                        style={styles.bannerButton}
                        onPress={() => navigation.navigate('AdminBeritaDetail', { item })}
                    >
                      <Text style={styles.bannerButtonText}>Selengkapnya</Text>
                      <Icon name="arrow-forward" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              {beritaList.length === 0 && (
                   // Fallback to static if no news
                   banners.map((banner) => (
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
                  ))
              )}
            </ScrollView>

            <View style={styles.paginationDots}>
              {(beritaList.length > 0 ? beritaList.slice(0, 5) : banners).map((_, index) => (
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

        {/* Event Section / Event Terkini */}
        <View style={styles.newsSection}>
          <Text style={styles.sectionHeaderTitle}>Event Terkini</Text>

          {isLoadingEvents ? (
            <ActivityIndicator color="#FFC107" style={{ marginTop: 20 }} />
          ) : events.length === 0 ? (
            <Text style={{ textAlign: 'center', color: '#94A3B8', marginTop: 20 }}>Tidak ada event terbaru</Text>
          ) : (
            events.slice(0, 3).map((item) => {
              const dateObj = new Date(item.tanggalMulai);
              const day = dateObj.getDate();
              const month = dateObj.toLocaleDateString('id-ID', { month: 'short' });

              return (
              <TouchableOpacity
                key={item.id}
                style={styles.newsCard}
                onPress={() => navigation.navigate('EventDetail', { event: item })}
              >
                <View style={styles.newsImageWrapper}>
                    <Image 
                    source={{ uri: item.urlGambar ? getImageUrl(item.urlGambar) : 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=400' }} 
                    style={styles.newsImage} 
                    />
                    <View style={styles.dateBadge}>
                        <Text style={styles.dateDay}>{day}</Text>
                        <Text style={styles.dateMonth}>{month}</Text>
                    </View>
                </View>
                
                <View style={styles.newsContent}>
                  <View style={styles.newsHeaderRow}>
                      <View style={styles.newsCategoryContainer}>
                          <Text style={styles.newsCategoryText}>{item.dinasNama || 'Umum'}</Text>
                      </View>
                  </View>
                  <Text style={styles.newsTitle} numberOfLines={2}>{item.judul}</Text>
                  <View style={styles.newsLocationRow}>
                      <Icon name="location-outline" size={12} color="#64748B" style={{marginRight: 4}} />
                      <Text style={styles.newsLocationText} numberOfLines={1}>{item.lokasi}</Text>
                  </View>
                </View>
              </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}


export default HomeScreenContent;

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
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notifBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
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

  // Pimpinan Section
  pimpinanSection: {
    marginBottom: 20,
  },
  pimpinanContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
  },
  pimpinanCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pimpinanImageWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: '#F8FAFC',
  },
  pimpinanImage: {
    width: '100%',
    height: '100%',
  },
  pimpinanInfo: {
    alignItems: 'center',
  },
  jabatanLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  pimpinanName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'center',
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
  newsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  newsCategoryContainer: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newsCategoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3B82F6',
  },
  newsDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newsDateText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 20,
    marginBottom: 4,
  },
  newsLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newsLocationText: {
    fontSize: 11,
    color: '#64748B',
  },
  newsImageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  dateBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomRightRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDay: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 14,
  },
  dateMonth: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
});
