import React, { useEffect } from 'react';
import {
  View,
  TextInput,
  FlatList,
  ScrollView,
  Text,
  StyleSheet,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import Header from '../components/Header';
import ServiceCard from '../components/ServiceCard';
import AnnouncementCard from '../components/AnnouncementCard';
// import NotificationPopup from '../components/NotificationPopup';
import { services, announcements } from '../data/mockData';
import Icon from "react-native-vector-icons/Ionicons";
import useAuthStore from '../stores/authStore';
import { getImageUrl } from '../config/api';
import useUserStore from '../stores/userStore';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  // const [showNotifications, setShowNotifications] = useState(false);
  const user = useAuthStore((state) => state.user);

  // Use shared userStore instead of local state
  const { profile, fetchUserProfile } = useUserStore();

  useEffect(() => {
    if (user?.id && !profile) {
      fetchUserProfile(user.id);
    }
  }, [user?.id, profile, fetchUserProfile]);

  const displayUser = profile ? {
    fullName: profile.fullName || user?.fullName || "User",
    email: profile.email || user?.email,
    role: profile.role || user?.role,
    avatar: getImageUrl(profile?.urlFoto) || getImageUrl((user as any)?.urlFoto) || (user as any)?.avatar
  } : null;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Header
          onNotificationPress={() => navigation.navigate('Notifikasi')}
          user={displayUser}
        />

        {/* Search */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchContainer}>
            <Icon
              name="search-outline"
              size={20}
              color="#64748B"
              style={styles.searchIcon}
            />
            <TextInput
              placeholder="Cari layanan atau informasi..."
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
            />
          </View>
        </View>

        {/* Services */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Layanan</Text>
        </View>

        <View style={styles.grid}>
          {services.map(item => (
            <ServiceCard key={item.id} {...item} />
          ))}
        </View>

        {/* Announcements */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pengumuman Terkini</Text>
        </View>

        <FlatList
          horizontal
          data={announcements}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => <AnnouncementCard {...item} />}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.announcementList}
        />

        {/* Help */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Bantuan & Dukungan</Text>
        </View>

        <View style={styles.helpBox}>
          <Text style={styles.helpItem}>Pertanyaan Umum (FAQ)</Text>
          <Text style={styles.helpItem}>Hubungi Kami</Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* <NotificationPopup
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    flex: 1
  },

  searchWrapper: {
    paddingHorizontal: 16,
    marginTop: 12
  },
  search: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
    elevation: 2
  },

  sectionHeader: {
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A'
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    rowGap: 12
  },

  announcementList: {
    paddingLeft: 16,
    paddingRight: 8
  },

  helpBox: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    elevation: 2
  },
  helpItem: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
    marginBottom: 12
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 4,
    elevation: 2
  },

  searchIcon: {
    marginRight: 8
  },

  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A'
  },

});
