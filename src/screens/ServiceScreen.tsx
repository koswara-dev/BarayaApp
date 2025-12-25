import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Platform,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

import useLayananStore from "../stores/layananStore";
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabParamList, RootStackParamList } from '../navigation/types';
import SkeletonShimmer from '../components/SkeletonShimmer';

type Props = CompositeScreenProps<
  BottomTabScreenProps<BottomTabParamList, 'Layanan'>,
  NativeStackScreenProps<RootStackParamList>
>;

// Skeleton Card for Service
const ServiceCardSkeleton = () => (
  <View style={styles.card}>
    <SkeletonShimmer style={styles.cardImage} />
    <View style={styles.cardContent}>
      <SkeletonShimmer style={{ width: 120, height: 10, marginBottom: 8 }} />
      <SkeletonShimmer style={{ width: '100%', height: 18, marginBottom: 4 }} />
      <SkeletonShimmer style={{ width: '75%', height: 18, marginBottom: 12 }} />
      <View style={styles.cardFooter}>
        <SkeletonShimmer style={{ width: 80, height: 12 }} />
        <SkeletonShimmer style={{ width: 32, height: 32 }} />
      </View>
    </View>
  </View>
);

// Stock images for service categories
const SERVICE_IMAGES: Record<string, string> = {
  default: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400",
  kependudukan: "https://images.unsplash.com/photo-1616077168712-fc6c7eb8bab1?auto=format&fit=crop&q=80&w=400",
  perizinan: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=400",
  kesehatan: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=400",
  pendidikan: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=400",
  pajak: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=400",
  sosial: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&q=80&w=400",
};

// Enhance data with duration and image
const enhanceData = (items: any[]) => {
  return items.map((item) => {
    let dinasName = item.dinasNama ? item.dinasNama : "Dinas Pemerintahan";
    let duration = item.estimasiWaktu ? `${item.estimasiWaktu} Hari Kerja` : "3 Hari Kerja";
    let isEmergency = false;
    let image = SERVICE_IMAGES.default;

    const lowerName = (item.nama || "").toLowerCase();
    const lowerDinas = (dinasName || "").toLowerCase();

    // Image classification based on name or dinas
    if (lowerName.includes("ktp") || lowerName.includes("kependudukan") || lowerDinas.includes("kependudukan")) {
      image = SERVICE_IMAGES.kependudukan;
    } else if (lowerName.includes("izin") || lowerName.includes("bangunan") || lowerName.includes("usaha") || lowerName.includes("perizinan")) {
      image = SERVICE_IMAGES.perizinan;
    } else if (lowerName.includes("ambulans") || lowerName.includes("bencana") || lowerName.includes("darurat") || lowerName.includes("sakit") || lowerDinas.includes("kesehatan")) {
      image = SERVICE_IMAGES.kesehatan;
      if (lowerName.includes("ambulans") || lowerName.includes("darurat")) {
        isEmergency = true;
        duration = "Respon Cepat";
      }
    } else if (lowerName.includes("pajak") || lowerName.includes("pbb") || lowerDinas.includes("bapenda")) {
      image = SERVICE_IMAGES.pajak;
      duration = "Instant";
    } else if (lowerDinas.includes("pendidikan") || lowerName.includes("sekolah") || lowerName.includes("guru")) {
      image = SERVICE_IMAGES.pendidikan;
    } else if (lowerDinas.includes("sosial") || lowerName.includes("bantuan") || lowerName.includes("sosial")) {
      image = SERVICE_IMAGES.sosial;
    }

    return {
      ...item,
      dinasName,
      duration,
      isEmergency,
      image,
    };
  });
};

const CATEGORIES = [
  { id: 'semua', label: 'Semua', apiValue: '' },
  { id: 'kesehatan', label: 'Kesehatan', apiValue: 'kesehatan' },
  { id: 'pendidikan', label: 'Pendidikan', apiValue: 'pendidikan' },
  { id: 'perizinan', label: 'Perizinan', apiValue: 'perizinan' },
  { id: 'sosial', label: 'Sosial', apiValue: 'sosial' },
];

export default function LayananScreen({ navigation }: Props) {
  const [activeCategory, setActiveCategory] = useState("semua");
  const [search, setSearch] = useState("");
  const { layanan, loading, fetchLayanan, page, hasMore } = useLayananStore();
  const [loadingMore, setLoadingMore] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const category = CATEGORIES.find(c => c.id === activeCategory);
      const apiValue = category?.apiValue || '';

      if (apiValue) {
        await fetchLayanan({ name: apiValue, page: 0 });
      } else {
        await fetchLayanan({ page: 0 });
      }
      setIsInitialLoad(false);
    };
    loadData();
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
    const category = CATEGORIES.find(c => c.id === activeCategory);
    const apiValue = category?.apiValue || '';

    const params: any = { page: page + 1, size: 10, isLoadMore: true };
    if (apiValue) {
      params.name = apiValue;
    }
    await fetchLayanan(params);
    setLoadingMore(false);
  };

  const showSkeleton = isInitialLoad && loading;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Layanan Publik</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        onScroll={handleScroll}
        scrollEventThrottle={400}
      >

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Icon name="search-outline" size={20} color="#94A3B8" />
            <TextInput
              placeholder="Cari layanan atau dinas..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Icon name="close-circle" size={20} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Categories Tab */}
        <View style={styles.categoryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  activeCategory === cat.id && styles.activeChip
                ]}
                onPress={() => {
                  if (activeCategory !== cat.id) {
                    setIsInitialLoad(true);
                    setActiveCategory(cat.id);
                  }
                }}
              >
                <Text
                  style={[
                    styles.categoryText,
                    activeCategory === cat.id && styles.activeCategoryText
                  ]}
                >{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Results Count */}
        {!showSkeleton && (
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsText}>
              {filtered.length} layanan ditemukan
            </Text>
          </View>
        )}

        {/* Service List */}
        <View style={styles.listContainer}>
          {showSkeleton ? (
            <>
              {[1, 2, 3, 4].map((_, index) => (
                <ServiceCardSkeleton key={index} />
              ))}
            </>
          ) : filtered.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="search-outline" size={56} color="#E2E8F0" />
              <Text style={styles.emptyTitle}>Layanan Tidak Ditemukan</Text>
              <Text style={styles.emptyText}>Coba kata kunci lain atau pilih kategori berbeda</Text>
            </View>
          ) : (
            filtered.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => navigation.navigate("ServiceDetail", { service: item })}
              >
                <Image
                  source={{ uri: item.image }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />

                <View style={styles.cardContent}>
                  <Text style={styles.dinasName} numberOfLines={1}>{item.dinasName}</Text>

                  <Text style={styles.serviceTitle} numberOfLines={2}>{item.nama}</Text>

                  <View style={styles.cardFooter}>
                    <View style={styles.durationRow}>
                      <Icon
                        name={item.isEmergency ? "flash" : "time-outline"}
                        size={14}
                        color={item.isEmergency ? "#EF4444" : "#64748B"}
                      />
                      <Text style={[styles.durationText, item.isEmergency && styles.emergencyText]}>
                        {item.duration}
                      </Text>
                    </View>

                    <View style={[styles.actionBtn, item.isEmergency && styles.emergencyBtn]}>
                      <Icon
                        name={item.isEmergency ? "call" : "arrow-forward"}
                        size={16}
                        color={item.isEmergency ? "#EF4444" : "#0F172A"}
                      />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}

          {/* Pagination Spinner */}
          {loadingMore && (
            <View style={styles.paginationSpinner}>
              <ActivityIndicator size="small" color="#FFB800" />
              <Text style={styles.loadingMoreText}>Memuat lebih banyak...</Text>
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
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },

  // Search
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
  },

  // Categories
  categoryContainer: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeChip: {
    backgroundColor: '#FFB800',
    borderColor: '#FFB800',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  activeCategoryText: {
    color: '#0F172A',
  },

  // Results Header
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  resultsText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },

  // List
  listContainer: {
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    marginBottom: 1,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardImage: {
    width: 110,
    height: 130,
    backgroundColor: '#F1F5F9',
  },
  cardContent: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  dinasName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 4,
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 21,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  emergencyText: {
    color: '#EF4444',
    fontWeight: '700',
  },
  actionBtn: {
    width: 32,
    height: 32,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyBtn: {
    backgroundColor: '#FEE2E2',
  },
  paginationSpinner: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
    textAlign: 'center',
  },
});
