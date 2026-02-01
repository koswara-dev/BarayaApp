
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  StatusBar,
  Image,
  Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const AmbulansScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const ambulanceData = [
    {
      id: 1,
      name: 'PSC 119 Kab. Kuningan',
      description: 'Layanan Gawat Darurat Medis 24 Jam Dinas Kesehatan Kabupaten Kuningan.',
      phones: ['119', '08111111119'],
      icon: 'medical',
      color: '#EF4444',
      isPrimary: true
    },
    {
      id: 2,
      name: 'RSUD 45 Kuningan',
      description: 'Unit Ambulans RSUD 45 Kuningan siap siaga untuk rujukan dan gawat darurat.',
      phones: ['(0232) 871118'],
      icon: 'business',
      color: '#3B82F6',
      isPrimary: false
    },
    {
      id: 3,
      name: 'RSUD Linggajati',
      description: 'Layanan Ambulans RSUD Linggajati untuk wilayah Kuningan Utara dan sekitarnya.',
      phones: ['(0232) 613535'],
      icon: 'business',
      color: '#10B981',
      isPrimary: false
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
        <Text style={styles.headerTitle}>Layanan Ambulans</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        
        {/* Banner Warning */}
        <View style={styles.warningBanner}>
            <Icon name="warning" size={24} color="#B91C1C" />
            <Text style={styles.warningText}>
                Hanya gunakan layanan ini untuk keadaan darurat medis yang memerlukan penanganan segera.
            </Text>
        </View>

        <View style={styles.listContainer}>
            {ambulanceData.map((item) => (
                <View key={item.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.cardImageContainer, { backgroundColor: `${item.color}15`, borderColor: `${item.color}30` }]}>
                             <Icon name={item.icon} size={28} color={item.color} />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>{item.name}</Text>
                            <Text style={styles.cardDesc}>{item.description}</Text>
                        </View>
                    </View>

                    <View style={styles.actionContainer}>
                        {item.phones.map((phone, idx) => (
                             <TouchableOpacity 
                                key={idx}
                                style={[
                                    styles.callButton, 
                                    item.isPrimary ? styles.primaryButton : styles.secondaryButton
                                ]}
                                onPress={() => handleCall(phone)}
                            >
                                <Icon 
                                    name="call" 
                                    size={18} 
                                    color={item.isPrimary ? "#FFFFFF" : "#EF4444"} 
                                />
                                <Text style={[
                                    styles.callButtonText,
                                    item.isPrimary ? styles.primaryButtonText : styles.secondaryButtonText
                                ]}>
                                    Hubungi {phone}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            ))}
        </View>

        {/* Info Tambahan */}
        <View style={styles.infoSection}>
             <Text style={styles.infoTitle}>Prosedur Pemanggilan Ambulans</Text>
             <View style={styles.stepItem}>
                <View style={styles.stepNumber}><Text style={styles.stepText}>1</Text></View>
                <Text style={styles.stepDesc}>Tetap tenang dan hubungi nomor di atas.</Text>
             </View>
             <View style={styles.stepItem}>
                <View style={styles.stepNumber}><Text style={styles.stepText}>2</Text></View>
                <Text style={styles.stepDesc}>Sebutkan nama pelapor, lokasi kejadian, dan kondisi pasien.</Text>
             </View>
             <View style={styles.stepItem}>
                <View style={styles.stepNumber}><Text style={styles.stepText}>3</Text></View>
                <Text style={styles.stepDesc}>Jangan tutup telepon sampai petugas memberitahu.</Text>
             </View>
        </View>

      </ScrollView>

      {/* Floating Emergency Button */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity 
            style={styles.emergencyButton}
            onPress={() => navigation.navigate('Main', { screen: 'Darurat' })}
          >
              <View style={styles.emergencyIconBubble}>
                <Icon name="alert-circle" size={24} color="#FFF" />
              </View>
              <View style={{flex: 1}}>
                  <Text style={styles.emergencyButtonTitle}>Butuh Bantuan Lainnya?</Text>
                  <Text style={styles.emergencyButtonSubtitle}>Buat Laporan Darurat (SOS)</Text>
              </View>
              <Icon name="chevron-forward" size={24} color="#FFF" />
          </TouchableOpacity>
      </View>
    </View>
  );
};

export default AmbulansScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
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
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
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
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FAC7C7',
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#991B1B',
    lineHeight: 18,
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  cardImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  actionContainer: {
    gap: 8,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#EF4444',
  },
  secondaryButton: {
      backgroundColor: '#FEF2F2',
      borderWidth: 1,
      borderColor: '#FCA5A5',
  },
  callButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  primaryButtonText: {
      color: '#FFFFFF',
  },
  secondaryButtonText: {
      color: '#EF4444',
  },
  infoSection: {
      marginTop: 8,
      marginHorizontal: 20,
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: '#E2E8F0',
  },
  infoTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#1E293B',
      marginBottom: 16,
  },
  stepItem: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
  },
  stepNumber: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#E2E8F0',
      alignItems: 'center',
      justifyContent: 'center',
  },
  stepText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#64748B',
  },
  stepDesc: {
      flex: 1,
      fontSize: 14,
      color: '#475569',
      lineHeight: 22,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  emergencyButton: {
      backgroundColor: '#EF4444',
      borderRadius: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      elevation: 4,
      shadowColor: '#EF4444',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
  },
  emergencyIconBubble: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
  },
  emergencyButtonTitle: {
      color: '#FFFFFF',
      fontSize: 12,
      opacity: 0.9,
      marginBottom: 2,
  },
  emergencyButtonSubtitle: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
  }
});
