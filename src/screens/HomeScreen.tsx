import React from 'react';
import { View, TextInput, FlatList, ScrollView, Text, StyleSheet } from 'react-native';
import Header from '../components/Header';
import ServiceCard from '../components/ServiceCard';
import AnnouncementCard from '../components/AnnouncementCard';
import { services, announcements } from '../data/mockData';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <Header />

      <TextInput
        placeholder="Cari layanan atau informasi..."
        style={styles.search}
      />

      <View style={styles.grid}>
        {services.map(item => (
          <ServiceCard key={item.id} {...item} />
        ))}
      </View>

      <Text style={styles.section}>Pengumuman Terkini</Text>
      <FlatList
        horizontal
        data={announcements}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => <AnnouncementCard {...item} />}
        showsHorizontalScrollIndicator={false}
      />

      <Text style={styles.section}>Bantuan & Dukungan</Text>
      <Text style={styles.help}>• Pertanyaan Umum (FAQ)</Text>
      <Text style={styles.help}>• Hubungi Kami</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#F1F5F9' },
  search: {
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 12,
    padding: 12
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16
  },
  section: {
    fontWeight: '700',
    fontSize: 16,
    margin: 16
  },
  help: {
    marginHorizontal: 16,
    marginBottom: 8,
    color: '#2563EB'
  }
});
