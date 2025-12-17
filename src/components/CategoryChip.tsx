import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function CategoryChip({ label, active, onPress }: any) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.active]}
      onPress={onPress}
    >
      <Text style={[styles.text, active && styles.textActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    marginRight: 8
  },
  active: {
    backgroundColor: '#1677D9'
  },
  text: {
    fontWeight: '600',
    color: '#0F172A'
  },
  textActive: {
    color: '#FFF'
  }
});
