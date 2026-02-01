
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const TransportasiScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  // Mock Data: Angkot Routes in Kuningan
  const angkotRoutes = [
    { id: '01', route: 'Kuningan - Pasar Baru - Kadugede', color: '#3B82F6' },
    { id: '02', route: 'Pramuka - Kadugede', color: '#10B981' },
    { id: '03', route: 'Pasar Baru - Padamenak', color: '#F59E0B' },
    { id: '04', route: 'Pramuka - Padamenak', color: '#EF4444' },
    { id: '05', route: 'Cirendang - Kertawangunan', color: '#8B5CF6' },
    { id: '06', route: 'Pasar Baru - Kertawangunan', color: '#3B82F6' },
    { id: '07', route: 'Pasar Baru - Lengkong', color: '#10B981' },
    { id: '08', route: 'Cirendang - Cigadung', color: '#F59E0B' },
    { id: '10', route: 'Windusengkahan - Pasar Baru', color: '#EF4444' },
  ];

  // Mock Data: Bus Terminals / Points of Interest
  const transportPoints = [
    {
      id: 1,
      name: 'Terminal Tipe A Kertawangunan',
      type: 'Terminal Bus',
      address: 'Jl. Raya Kertawangunan, Sindangagung',
      icon: 'bus-outline',
      description: 'Melayani rute Antar Kota Antar Provinsi (AKAP) dan Antar Kota Dalam Provinsi (AKDP).'
    },
    {
      id: 2,
      name: 'Terminal Cirendang',
      type: 'Sub Terminal',
      address: 'Jl. Raya Cirendang, Kuningan',
      icon: 'bus-outline',
      description: 'Pusat pemberhentian angkutan kota dan elf menuju wilayah utara.'
    },
    {
      id: 3,
      name: 'DAMRI Kertajati',
      type: 'Shuttle Bandara',
      address: 'Pool DAMRI Kuningan',
      icon: 'airplane-outline',
      description: 'Layanan pemadu moda menuju Bandara Internasional Kertajati (BIJB).'
    }
  ];

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#F1F5F9" barStyle="dark-content" />
      
      {/* Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
             <Icon name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Info Transportasi</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        
        {/* Banner */}
        <View style={styles.bannerSection}>
            <View style={styles.bannerCard}>
                <View style={styles.bannerContent}>
                    <Text style={styles.bannerTitle}>Keliling Kuningan Mudah</Text>
                    <Text style={styles.bannerDesc}>
                        Informasi trayek angkot, terminal bus, dan akses transportasi publik lainnya.
                    </Text>
                </View>
                <Icon name="map" size={80} color="rgba(255,255,255,0.2)" style={styles.bannerIcon} />
            </View>
        </View>

        {/* Section: Angkot Routes */}
        <View style={styles.sectionContainer}>
             <View style={styles.sectionHeader}>
                <Icon name="car-sport" size={20} color="#0F172A" />
                <Text style={styles.sectionTitle}>Trayek Angkutan Kota</Text>
             </View>
             
             <View style={styles.angkotGrid}>
                {angkotRoutes.map((item) => (
                    <TouchableOpacity key={item.id} style={styles.angkotCard}>
                        <View style={[styles.angkotBadge, { backgroundColor: item.color }]}>
                            <Text style={styles.angkotNumber}>{item.id}</Text>
                        </View>
                        <View style={styles.angkotInfo}>
                            <Text style={styles.angkotRoute} numberOfLines={2}>{item.route}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
             </View>
        </View>

        {/* Section: Terminal & Halte */}
        <View style={styles.sectionContainer}>
             <View style={styles.sectionHeader}>
                <Icon name="business" size={20} color="#0F172A" />
                <Text style={styles.sectionTitle}>Terminal & Titik Penting</Text>
             </View>

             <View style={styles.poiList}>
                {transportPoints.map((poi) => (
                    <View key={poi.id} style={styles.poiCard}>
                        <View style={styles.poiHeader}>
                            <View style={styles.poiIconBox}>
                                <Icon name={poi.icon} size={24} color="#3B82F6" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.poiName}>{poi.name}</Text>
                                <Text style={styles.poiType}>{poi.type}</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <Text style={styles.poiAddress}>{poi.address}</Text>
                        <Text style={styles.poiDesc}>{poi.description}</Text>
                        
                        <TouchableOpacity 
                            style={styles.mapButton}
                            onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(poi.name + ' Kuningan')}`)}
                        >
                            <Text style={styles.mapButtonText}>Lihat di Peta</Text>
                            <Icon name="arrow-forward" size={16} color="#3B82F6" />
                        </TouchableOpacity>
                    </View>
                ))}
             </View>
        </View>

      </ScrollView>
    </View>
  );
};

export default TransportasiScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9', // Slate-50
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
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
  bannerSection: {
    padding: 20,
  },
  bannerCard: {
    backgroundColor: '#6366F1', // Indigo
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    elevation: 4,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  bannerContent: {
    flex: 1,
    zIndex: 2,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  bannerDesc: {
    fontSize: 14,
    color: '#E0E7FF',
    lineHeight: 20,
  },
  bannerIcon: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    zIndex: 1,
  },
  sectionContainer: {
    marginTop: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  angkotGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
  },
  angkotCard: {
      width: (width - 52) / 2,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
  },
  angkotBadge: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
  },
  angkotNumber: {
      color: '#FFFFFF',
      fontWeight: 'bold',
      fontSize: 14,
  },
  angkotInfo: {
      flex: 1,
  },
  angkotRoute: {
      fontSize: 12,
      color: '#475569',
      fontWeight: '600',
      lineHeight: 16,
  },
  poiList: {
      gap: 16,
  },
  poiCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: '#E2E8F0',
  },
  poiHeader: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 12,
  },
  poiIconBox: {
      width: 48,
      height: 48,
      borderRadius: 10,
      backgroundColor: '#EFF6FF',
      justifyContent: 'center',
      alignItems: 'center',
  },
  poiName: {
      fontSize: 16,
      fontWeight: '700',
      color: '#1E293B',
  },
  poiType: {
      fontSize: 12,
      color: '#64748B',
      marginTop: 2,
  },
  divider: {
      height: 1,
      backgroundColor: '#F1F5F9',
      marginBottom: 12,
  },
  poiAddress: {
      fontSize: 13,
      color: '#334155',
      marginBottom: 4,
  },
  poiDesc: {
      fontSize: 13,
      color: '#64748B',
      lineHeight: 20,
      marginBottom: 12,
  },
  mapButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
      backgroundColor: '#F0F9FF',
  },
  mapButtonText: {
      color: '#3B82F6',
      fontWeight: '600',
      fontSize: 12
  }
});
