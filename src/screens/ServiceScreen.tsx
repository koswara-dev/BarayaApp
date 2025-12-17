import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  ScrollView,
  StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

import CategoryChip from "../components/CategoryChip";
import useLayananStore from "../stores/layananStore";
import { CATEGORIES } from "../data/serviceLayanan";
import ServiceListCard from "../components/ServiceListCard";
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabParamList, RootStackParamList } from '../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<BottomTabParamList, 'Layanan'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function LayananScreen({ navigation }: Props) {
  const [activeCategory, setActiveCategory] = useState("popular");
  const [search, setSearch] = useState("");

  const { layanan, loading, error, fetchLayanan } = useLayananStore();

  useEffect(() => {
    fetchLayanan();
  }, []);

  const filtered = layanan.filter((item) =>
    item.nama.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Layanan</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.sectionPadding}>
          <View style={styles.searchBox}>
            <Icon name="search" size={20} color="#94A3B8" />
            <TextInput
              placeholder="Cari layanan..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
            />
          </View>
        </View>

        {/* Category */}
        <View style={styles.sectionPadding}>
          <FlatList
            horizontal
            data={CATEGORIES}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <CategoryChip
                label={item.label}
                active={activeCategory === item.id}
                onPress={() => setActiveCategory(item.id)}
              />
            )}
          />
        </View>

        {/* Content */}
        <View style={[styles.sectionPadding, styles.contentTop]}>
          <Text style={styles.sectionTitle}>Semua Layanan</Text>

          {loading && (
            <Text style={styles.loading}>Loading...</Text>
          )}

          {error && (
            <Text style={styles.error}>{error}</Text>
          )}

          {!loading &&
            filtered.map((item) => (
              <ServiceListCard
                key={item.id}
                title={item.nama}
                desc={item.deskripsi}
                onPress={() => navigation.navigate("ServiceDetail", { service: item })}
              />
            ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6", // gray-100
  },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    flex: 1,
  },

  /* Shared padding */
  sectionPadding: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  contentTop: {
    marginTop: 24,
  },

  /* Search */
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A'
  },

  /* Content */
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#111827", // gray-900
  },
  loading: {
    textAlign: "center",
    color: "#6B7280", // gray-500
    marginTop: 16,
  },
  error: {
    textAlign: "center",
    color: "#EF4444", // red-500
    marginTop: 16,
  },
});
