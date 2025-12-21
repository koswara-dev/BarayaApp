import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";

import useLayananStore from "../stores/layananStore";
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabParamList, RootStackParamList } from '../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<BottomTabParamList, 'Layanan'>,
  NativeStackScreenProps<RootStackParamList>
>;

// Mock data specific to the UI screenshot requirements
// In production, backend should provide these fields: image, dinasName, status, duration, type
const enhanceData = (items: any[]) => {
  return items.map((item, index) => {
    // defaults
    let dinasName = item.dinasNama ? item.dinasNama.toUpperCase() : "DINAS PEMERINTAHAN";
    let duration = item.estimasiWaktu ? `${item.estimasiWaktu} Hari` : "3 Hari Kerja";
    let image = "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=200";
    let isEmergency = false;

    const lowerName = (item.nama || "").toLowerCase();
    const lowerDinas = (dinasName || "").toLowerCase();

    // Image & Logic classification based on name or dinas
    if (lowerName.includes("ktp") || lowerName.includes("kependudukan") || lowerDinas.includes("kependudukan")) {
      image = "https://images.unsplash.com/photo-1616077168712-fc6c7eb8bab1?auto=format&fit=crop&q=80&w=200"; // Documents/Office
    } else if (lowerName.includes("izin") || lowerName.includes("bangunan") || lowerName.includes("usaha")) {
      image = "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=200"; // Construction
    } else if (lowerName.includes("ambulans") || lowerName.includes("bencana") || lowerName.includes("darurat") || lowerName.includes("sakit") || lowerDinas.includes("kesehatan")) {
      image = "https://images.unsplash.com/photo-1587745416684-47953f16f0ae?auto=format&fit=crop&q=80&w=200"; // Ambulance
      if (lowerName.includes("ambulans") || lowerName.includes("darurat")) {
        isEmergency = true;
        duration = "Respon Cepat";
      }
    } else if (lowerName.includes("pajak") || lowerName.includes("pbb") || lowerDinas.includes("bapenda")) {
      image = "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=200"; // Calculator/Finance
      duration = "Instant";
    } else if (lowerDinas.includes("pendidikan") || lowerName.includes("sekolah") || lowerName.includes("guru")) {
      image = "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=200"; // Education
    }

    return {
      ...item,
      dinasName,
      duration,
      image,
      isEmergency
    };
  });
};

const CATEGORIES = [
  { id: 'semua', label: 'Semua' },
  { id: 'kesehatan', label: 'Kesehatan' },
  { id: 'pendidikan', label: 'Pendidikan' },
  { id: 'perizinan', label: 'Perizinan' },
  { id: 'sosial', label: 'Sosial' },
];

export default function LayananScreen({ navigation }: Props) {
  const [activeCategory, setActiveCategory] = useState("semua");
  const [search, setSearch] = useState("");
  const { layanan, loading, error, fetchLayanan, page, hasMore } = useLayananStore();
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    // Reset page and fetch new category
    if (activeCategory === 'semua') {
      fetchLayanan({ page: 0 });
    } else {
      fetchLayanan({ name: activeCategory, page: 0 });
    }
  }, [activeCategory]);

  const enhancedLayanan = enhanceData(layanan);

  const filtered = enhancedLayanan.filter((item) =>
    item.nama.toLowerCase().includes(search.toLowerCase())
  );

  const handleScroll = ({ nativeEvent }: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;

    if (isCloseToBottom && hasMore && !loading && !loadingMore) {
      loadMoreData();
    }
  };

  const loadMoreData = async () => {
    setLoadingMore(true);
    const params: any = { page: page + 1, size: 10, isLoadMore: true };
    if (activeCategory !== 'semua') {
      params.name = activeCategory;
    }
    await fetchLayanan(params);
    setLoadingMore(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Layanan Publik</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        onScroll={handleScroll}
        scrollEventThrottle={400}
      >

        {/* Search */}
        <View style={styles.sectionPadding}>
          <View style={styles.searchBox}>
            <Icon name="search-outline" size={20} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Cari layanan, dinas, atau info..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
            />
            <Icon name="mic-outline" size={20} color="#94A3B8" />
          </View>
        </View>

        {/* Categories Tab */}
        <View style={styles.categoryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  activeCategory === cat.id ? styles.activeChip : styles.inactiveChip
                ]}
                onPress={() => setActiveCategory(cat.id)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    activeCategory === cat.id ? styles.activeCategoryText : styles.inactiveCategoryText
                  ]}
                >{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Filter Button */}
        <TouchableOpacity style={styles.filterButton}>
          <Icon name="filter" size={16} color="#3B82F6" style={{ marginRight: 8 }} />
          <Text style={styles.filterText}>Filter Dinas / OPD</Text>
          <View style={{ flex: 1 }} />
          <Icon name="chevron-down" size={16} color="#94A3B8" />
        </TouchableOpacity>

        {/* Service List */}
        <View style={styles.listContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#FFC107" style={{ marginTop: 32 }} />
          ) : (
            filtered.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                onPress={() => navigation.navigate("ServiceDetail", { service: item })}
              >
                <Image source={{ uri: item.image }} style={styles.cardImage} />

                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <View style={styles.dinasRow}>
                      <MaterialIcon name="location-city" size={12} color="#3B82F6" style={{ marginRight: 4 }} />
                      <Text style={styles.dinasName}>{item.dinasName}</Text>
                    </View>
                  </View>

                  <Text style={styles.serviceTitle} numberOfLines={2}>{item.nama}</Text>

                  <View style={styles.cardFooter}>
                    <View style={styles.durationRow}>
                      <Icon
                        name={item.isEmergency ? "flash" : "time-outline"}
                        size={14}
                        color={item.isEmergency ? "#EF4444" : "#64748B"}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.durationText, item.isEmergency && { color: '#EF4444', fontWeight: '700' }]}>
                        {item.duration}
                      </Text>
                    </View>

                    <View style={styles.actionBtn}>
                      <Icon
                        name={item.isEmergency ? "call" : "arrow-forward"}
                        size={16}
                        color="#0F172A"
                      />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}

          {/* Loading circle at bottom per design */}
          {/* Pagination Spinner */}
          {loadingMore && (
            <View style={styles.paginationSpinner}>
              <ActivityIndicator size="large" color="#FFC107" />
            </View>
          )}

        </View>

      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  notifBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  // Search
  sectionPadding: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },

  // Categories
  categoryContainer: {
    marginTop: 16,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  activeChip: {
    backgroundColor: '#FFC107',
    borderColor: '#FFC107',
  },
  inactiveChip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  activeCategoryText: {
    color: '#0F172A',
  },
  inactiveCategoryText: {
    color: '#64748B',
  },

  // Filter
  filterButton: {
    marginHorizontal: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  filterText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },

  // List
  listContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    overflow: 'hidden',
    height: 120, // Check design aspect ratio
  },
  cardImage: {
    width: 100,
    height: '100%',
    backgroundColor: '#F1F5F9',
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dinasRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dinasName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3B82F6',
    maxWidth: 120,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 20,
    marginTop: 2, // Reduced from 4
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  actionBtn: {
    width: 28,
    height: 28,
    backgroundColor: '#F8FAFC',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paginationSpinner: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
