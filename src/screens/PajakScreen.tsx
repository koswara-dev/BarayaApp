
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  StatusBar,
  Linking
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const PajakScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  // Mock Data for Pajak Kabupaten
  const pajakKabupaten = [
    { id: 1, title: 'PBB-P2', desc: 'Pajak Bumi dan Bangunan Perdesaan dan Perkotaan', icon: 'home-outline', color: '#3B82F6' },
    { id: 2, title: 'BPHTB', desc: 'Bea Perolehan Hak atas Tanah dan Bangunan', icon: 'business-outline', color: '#10B981' },
    { id: 3, title: 'Pajak Restoran', desc: 'Pajak atas pelayanan restoran', icon: 'restaurant-outline', color: '#F59E0B' },
    { id: 4, title: 'Pajak Hotel', desc: 'Pajak atas pelayanan hotel/penginapan', icon: 'bed-outline', color: '#6366F1' },
    { id: 5, title: 'Pajak Reklame', desc: 'Pajak penyelenggaraan reklame', icon: 'easel-outline', color: '#EF4444' },
    { id: 6, title: 'Pajak Air Tanah', desc: 'Pajak atas pengambilan air tanah', icon: 'water-outline', color: '#0EA5E9' },
    { id: 7, title: 'Pajak Hiburan', desc: 'Pajak atas penyelenggaraan hiburan', icon: 'musical-notes-outline', color: '#8B5CF6' },
    { id: 8, title: 'Pajak Parkir', desc: 'Pajak atas penyelenggaraan tempat parkir', icon: 'car-outline', color: '#64748B' },
  ];

  // Mock Data for Pajak Kendaraan
  const vehicleTaxInfo = {
    title: 'Info Pajak Kendaraan',
    desc: 'Cek pajak kendaraan bermotor provinsi Jawa Barat via SAMBARA',
    features: [
      'Cek Pajak Tahunan',
      'Info Jadwal Samsat Keliling',
      'Pembayaran Online',
      'Proteksi Kepemilikan'
    ]
  };

  return (
    <View style={styles.container}>
        <StatusBar backgroundColor="#F1F5F9" barStyle="dark-content" />
        
        {/* Header */}
        <View style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                 <Icon name="arrow-back" size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Info Pajak</Text>
            <View style={{ width: 40 }} /> 
        </View>

        <ScrollView 
            contentContainerStyle={{ paddingBottom: 40 }} 
            showsVerticalScrollIndicator={false}
        >
            
            {/* Banner Section */}
            <View style={styles.bannerSection}>
                <View style={styles.bannerCard}>
                    <View style={styles.bannerContent}>
                        <Text style={styles.bannerTitle}>Bayar Pajak Tepat Waktu</Text>
                        <Text style={styles.bannerDesc}>
                            Pajak Anda membangun Kuningan lebih maju. Akses layanan pajak daerah dengan mudah.
                        </Text>
                    </View>
                    <Icon name="calculator" size={80} color="rgba(255,255,255,0.2)" style={styles.bannerIcon} />
                </View>
            </View>

            {/* Section 1: Pajak Kendaraan (Highlight) */}
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <Icon name="car-sport" size={24} color="#EF4444" />
                    <Text style={styles.sectionTitle}>Pajak Kendaraan Bermotor</Text>
                </View>
                
                <View style={styles.vehicleTaxCard}>
                     <View style={styles.vehicleTaxHeader}>
                        <View>
                            <Text style={styles.vehicleTaxTitle}>SAMBARA / SIGNAL</Text>
                            <Text style={styles.vehicleTaxSubtitle}>E-Samsat Jawa Barat</Text>
                        </View>
                        <Image 
                            source={{ uri: 'https://bapenda.jabarprov.go.id/wp-content/uploads/2019/04/Logo-Bapenda-Jabar-Transparan.png' }} 
                            style={{ width: 40, height: 40, resizeMode: 'contain' }}
                        />
                     </View>
                     
                     <View style={styles.divider} />
                     
                     <Text style={styles.vehicleTaxDesc}>
                        Layanan pembayaran pajak kendaraan bermotor tahunan secara online, pengesahan STNK, dan info PKB.
                     </Text>

                     <View style={styles.featureList}>
                        {vehicleTaxInfo.features.map((feature, idx) => (
                            <View key={idx} style={styles.featureItem}>
                                <Icon name="checkmark-circle" size={16} color="#10B981" />
                                <Text style={styles.featureText}>{feature}</Text>
                            </View>
                        ))}
                     </View>

                     <TouchableOpacity 
                        style={styles.sambaraButton}
                        onPress={() => Linking.openURL('https://play.google.com/store/apps/details?id=com.sapawarga.jds&hl=id')}
                     >
                        <Text style={styles.sambaraButtonText}>Buka Aplikasi Sapawarga</Text>
                        <Icon name="logo-google-playstore" size={18} color="#FFFFFF" />
                     </TouchableOpacity>

                     <TouchableOpacity 
                        style={[styles.outlineButton, { marginTop: 12 }]}
                        onPress={() => navigation.navigate('SamsatKeliling')}
                     >
                        <Text style={styles.outlineButtonText}>Lihat Jadwal Samsat Keliling</Text>
                     </TouchableOpacity>
                </View>
            </View>

            {/* Section 2: Pajak Daerah (Grid) */}
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <Icon name="business" size={24} color="#3B82F6" />
                    <Text style={styles.sectionTitle}>Pajak Daerah Kab. Kuningan</Text>
                </View>
                <Text style={styles.sectionDesc}>
                    Jenis-jenis pajak daerah yang dikelola oleh Bappenda Kabupaten Kuningan.
                </Text>

                <View style={styles.gridContainer}>
                    {pajakKabupaten.map((item) => (
                        <TouchableOpacity key={item.id} style={styles.gridItem}>
                            <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
                                <Icon name={item.icon} size={24} color={item.color} />
                            </View>
                            <Text style={styles.gridTitle}>{item.title}</Text>
                            <Text style={styles.gridDesc} numberOfLines={2}>{item.desc}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                
                 <TouchableOpacity 
                    style={styles.bappendaButton}
                    onPress={() => Linking.openURL('https://bappenda.kuningankab.go.id/')}
                 >
                    <Text style={styles.bappendaButtonText}>Website Resmi Bappenda</Text>
                    <Icon name="globe-outline" size={18} color="#3B82F6" />
                 </TouchableOpacity>
            </View>

        </ScrollView>
    </View>
  );
};

export default PajakScreen;

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
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    elevation: 4,
    shadowColor: '#3B82F6',
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
    color: '#E0F2FE',
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
    marginBottom: 8,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  sectionDesc: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 20,
  },
  vehicleTaxCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vehicleTaxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  vehicleTaxTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  vehicleTaxSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 16,
  },
  vehicleTaxDesc: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 16,
    lineHeight: 22,
  },
  featureList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  featureText: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '600',
  },
  sambaraButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  sambaraButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  outlineButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineButtonText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 14,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridItem: {
    width: (width - 52) / 2, // 20 padding * 2 = 40, + gap 12 = 52
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  gridDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  bappendaButton: {
      marginTop: 20,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      padding: 16,
      backgroundColor: '#EFF6FF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#DBEAFE',
  },
  bappendaButtonText: {
      color: '#3B82F6',
      fontWeight: '600',
      fontSize: 14
  }
});
