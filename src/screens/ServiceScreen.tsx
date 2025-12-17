import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import CategoryChip from '../components/CategoryChip';
import ServiceListItem from '../components/ServiceListItem';
import {
  categories,
  servicesByCategory
} from '../data/servicesByCategory';

export default function ServiceScreen({ navigation }: any) {
  const [activeCategory, setActiveCategory] = useState('popular');

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Layanan</Text>
        <Icon name="bell" size={22} />
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Icon name="search" size={18} color="#94A3B8" />
        <TextInput
          placeholder="Cari layanan..."
          style={styles.search}
        />
      </View>

      {/* Category */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {categories.map(item => (
          <CategoryChip
            key={item.id}
            label={item.label}
            active={item.id === activeCategory}
            onPress={() => setActiveCategory(item.id)}
          />
        ))}
      </ScrollView>

      {/* Sections */}
      {servicesByCategory.map(section => (
        <View key={section.title} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.link}>Lihat Semua</Text>
          </View>

          {section.services.map(service => (
            <ServiceListItem key={service.id} {...service} />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    padding: 16
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700'
  },
  searchBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16
  },
  search: {
    marginLeft: 8,
    flex: 1
  },
  section: {
    marginTop: 24
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800'
  },
  link: {
    color: '#1677D9',
    fontWeight: '600'
  }
});
