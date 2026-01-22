import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
  Platform,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import useSamsatKelilingStore, { SamsatKeliling } from '../stores/samsatKelilingStore';
import useAuthStore from '../stores/authStore';
import { getImageUrl } from '../config/api';
import { Role } from '../types/auth';

export default function SamsatKelilingScreen() {
  const navigation = useNavigation<any>();
  const { list, loading, fetchSamsatKeliling } = useSamsatKelilingStore();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSamsatKeliling();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSamsatKeliling();
    setRefreshing(false);
  };

  const openMap = (lat?: string, lon?: string, label?: string) => {
    if (lat && lon) {
      const scheme = Platform.select({
        ios: 'maps:0,0?q=',
        android: 'geo:0,0?q=',
      });
      const latLng = `${lat},${lon}`;
      const url = Platform.select({
        ios: `${scheme}${label}@${latLng}`,
        android: `${scheme}${latLng}(${label})`,
      });
      if (url) Linking.openURL(url);
    } else {
        // Fallback or search query
        const query = label ? encodeURIComponent(label) : '';
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
    }
  };

  const renderItem = ({ item }: { item: SamsatKeliling }) => {
    const date = new Date(item.tanggal);
    const dayName = date.toLocaleDateString('id-ID', { weekday: 'long' });
    const dayDate = date.getDate();
    const month = date.toLocaleDateString('id-ID', { month: 'long' });

    const formatTime = (time: string) => {
        if (!time) return '';
        const parts = time.split(':');
        if (parts.length >= 2) {
            return `${parts[0]}:${parts[1]}`;
        }
        return time;
    };

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
                 {item.urlGambar ? (
                     <Image source={{ uri: getImageUrl(item.urlGambar) }} style={styles.locationImage} />
                 ) : (
                     <Icon name="car-sport" size={24} color="#F59E0B" />
                 )}
            </View>
            <View style={styles.dayBadge}>
                <Text style={styles.dayText}>{dayName.toUpperCase()}</Text>
            </View>
        </View>

        <Text style={styles.locationTitle}>{item.lokasi}</Text>
        
        <View style={styles.timeRow}>
            <Icon name="time-outline" size={16} color="#64748B" />
            <Text style={styles.timeText}>{formatTime(item.jamMulai)} - {formatTime(item.jamSelesai)} WIB</Text>
        </View>

        <TouchableOpacity 
            style={styles.mapButton}
            onPress={() => openMap(item.latitude, item.longitude, item.lokasi)}
        >
            <Icon name="map" size={16} color="#F59E0B" style={{ marginRight: 8 }} />
            <Text style={styles.mapButtonText}>Lihat Lokasi</Text>
        </TouchableOpacity>

        {(user?.role === Role.ADMIN || user?.role === Role.SUPERADMIN) && (
            <TouchableOpacity 
                style={styles.editButton}
                onPress={() => navigation.navigate('CreateSamsat', { item })}
            >
                <Icon name="create-outline" size={20} color="#64748B" />
            </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Jadwal Samsat Keliling</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <View style={styles.infoBox}>
        <Icon name="information-circle" size={20} color="#F59E0B" style={{marginTop: 2}} />
        <Text style={styles.infoText}>
            Layanan Samsat Keliling memudahkan Anda membayar PKB (Pajak Kendaraan Bermotor) tahunan tepat waktu.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>JADWAL MINGGU INI</Text>

      {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#F59E0B" />
          </View>
      ) : (
          <FlatList
            data={list}
            renderItem={renderItem}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F59E0B']} />}
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Belum ada jadwal tersedia.</Text>
                </View>
            }
          />
      )}

      {/* FAB for Admin to Add */}
      {(user?.role === Role.ADMIN || user?.role === Role.SUPERADMIN) && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CreateSamsat')}
        >
          <Icon name="add" size={30} color="#FFF" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  infoBox: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    flexDirection: 'row',
    borderColor: '#FEF3C7',
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
    letterSpacing: 1,
    marginLeft: 16,
    marginBottom: 8,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    position: 'relative',
  },
  cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
  },
  iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: '#FEF3C7',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
  },
  locationImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
  },
  dayBadge: {
      backgroundColor: '#DCFCE7',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
  },
  dayText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#166534',
  },
  locationTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#0F172A',
      marginBottom: 8,
  },
  timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
  },
  timeText: {
      fontSize: 14,
      color: '#64748B',
      marginLeft: 8,
  },
  mapButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F8FAFC',
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#F1F5F9',
  },
  mapButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#0F172A',
  },
  editButton: {
      position: 'absolute',
      top: 16,
      right: 16, // Near day badge but adjusted? Or maybe bottom right?
      // Actually putting it top right interferes with Badge. 
      // Let's put it on top of icon? No.
      // Let's make it distinct.
      // Or maybe next to map button?
      marginTop: 0, 
  },
  fab: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#F59E0B',
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
  }
});
