
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Linking
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import useAuthStore from '../stores/authStore';
import { Role } from '../types/auth';

const { width } = Dimensions.get('window');

const AllFeaturesScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const user = useAuthStore((state) => state.user);

  const menuCategories = [
    {
      title: 'Pelayanan Publik',
      data: [
        { id: 'layanan', name: 'Layanan Dinas', icon: 'grid-outline', color: '#3B82F6', action: () => navigation.navigate('Main', { screen: 'Layanan' }) }, 
        { id: 'dinas', name: 'Dinas/SKPD', icon: 'business', color: '#F59E0B', action: () => navigation.navigate('DinasList', { isComplaint: true }) },
        { id: 'pajak', name: 'Info Pajak', icon: 'calculator-outline', color: '#ec4899', action: () => navigation.navigate('Pajak') },
        { id: 'samsat', name: 'Samsat Keliling', icon: 'card-outline', color: '#6366F1', action: () => navigation.navigate('SamsatKeliling') },
        { id: 'perizinan', name: 'Perizinan', icon: 'document-text-outline', color: '#10B981', action: () => navigation.navigate('Main', { screen: 'Layanan', params: { query: 'izin' } }) },
        { id: 'kependudukan', name: 'Kependudukan', icon: 'people-outline', color: '#8B5CF6', action: () => navigation.navigate('Main', { screen: 'Layanan', params: { query: 'kependudukan' } }) },
      ]
    },
    {
      title: 'Informasi Terkini',
      data: [
        { id: 'berita', name: 'Berita Daerah', icon: 'newspaper-outline', color: '#10B981', action: () => navigation.navigate('Webview', { url: 'https://kuningankab.go.id/home/', title: 'Portal Berita Kuningan' }) },
        { id: 'event', name: 'Event', icon: 'calendar-outline', color: '#F97316', action: () => navigation.navigate('EventList') },
        { id: 'transportasi', name: 'Transportasi', icon: 'bus-outline', color: '#3B82F6', action: () => navigation.navigate('Transportasi') },
        { id: 'peta', name: 'Peta Lokasi', icon: 'map-outline', color: '#EF4444', action: () => Linking.openURL('https://www.google.com/maps/search/?api=1&query=Kantor Bupati Kuningan') },
         { id: 'cctv', name: 'CCTV Kota', icon: 'videocam-outline', color: '#64748B', action: () => navigation.navigate('CctvMonitor') },
      ]
    },
    {
      title: 'Gawat Darurat & Kesehatan',
      data: [
        { id: 'emergency', name: 'SOS Darurat', icon: 'alert-circle-outline', color: '#EF4444', action: () => navigation.navigate('Main', { screen: 'Darurat' }) },
        { id: 'ambulans', name: 'Ambulans', icon: 'medical-outline', color: '#EF4444', action: () => navigation.navigate('Ambulans') },
        { id: 'rs', name: 'Rumah Sakit', icon: 'business-outline', color: '#10B981', action: () => Linking.openURL('https://www.google.com/maps/search/Rumah+Sakit+di+Kuningan') },
        { id: 'antrian', name: 'Antrian Online', icon: 'time-outline', color: '#3B82F6', action: () => navigation.navigate('Webview', { url: 'https://daftar.rsud45.com/', title: 'Antrian RSUD 45' }) },
      ]
    },
    {
      title: 'Lainnya',
      data: [
        { id: 'profil', name: 'Profil Saya', icon: 'person-circle-outline', color: '#64748B', action: () => navigation.navigate('Main', { screen: 'Profil' }) },
        ...(user?.role === Role.SUPERADMIN ? [{ id: 'pengaturan', name: 'Pengaturan', icon: 'settings-outline', color: '#64748B', action: () => navigation.navigate('Pengaturan') }] : []),
      ]
    }
  ];

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#F8FAFC" barStyle="dark-content" />
      
      {/* Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
             <Icon name="close" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Semua Menu</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.greetingText}>
            Halo, <Text style={styles.userName}>{user?.fullName || 'Warga Kuningan'}</Text>
        </Text>
        <Text style={styles.subtitleText}>Mau akses layanan apa hari ini?</Text>
        
        <View style={{ height: 20 }} />

        {menuCategories.map((category, index) => (
            <View key={index} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>{category.title}</Text>
                <View style={styles.gridContainer}>
                    {category.data.map((item) => (
                        <TouchableOpacity 
                            key={item.id} 
                            style={styles.menuItem}
                            onPress={item.action}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
                                <Icon name={item.icon} size={28} color={item.color} />
                            </View>
                            <Text style={styles.menuItemText} numberOfLines={2}>{item.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        ))}

      </ScrollView>
    </View>
  );
};

export default AllFeaturesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#F8FAFC',
    // borderBottomWidth: 1,
    // borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  greetingText: {
      fontSize: 22,
      color: '#0F172A',
  },
  userName: {
      fontWeight: 'bold',
  },
  subtitleText: {
      fontSize: 14,
      color: '#64748B',
      marginTop: 4,
  },
  categorySection: {
      marginBottom: 24,
  },
  categoryTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#334155',
      marginBottom: 16,
  },
  gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
  },
  menuItem: {
      width: (width - 40 - 16 * 3) / 4, // 4 columns roughly, adjusted
      minWidth: 70,
      alignItems: 'center',
      marginBottom: 8,
  },
  iconContainer: {
      width: 56,
      height: 56,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
  },
  menuItemText: {
      fontSize: 11,
      textAlign: 'center',
      color: '#475569',
      lineHeight: 14,
      fontWeight: '500',
  }
});
