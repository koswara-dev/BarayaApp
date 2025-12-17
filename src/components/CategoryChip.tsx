import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function CategoryChip({ label, active, onPress }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        active ? styles.chipActive : styles.chipInactive,
      ]}
    >
      <Text
        style={[
          styles.text,
          active ? styles.textActive : styles.textInactive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 999,
  },
  chipActive: {
    backgroundColor: "#2563EB",
  },
  chipInactive: {
    backgroundColor: "#E5E7EB",
  },
  text: {
    fontSize: 14,
  },
  textActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  textInactive: {
    color: "#374151",
    fontWeight: "500",
  },
});

