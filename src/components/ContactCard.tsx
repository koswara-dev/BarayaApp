import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

export default function ContactCard({ icon, label, value }: any) {
  return (
    <View style={styles.card}>
      <View style={styles.icon}>
        <Icon name={icon} size={18} color="#2563EB" />
      </View>
      <View>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0ECFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  label: {
    color: '#64748B',
    fontSize: 12
  },
  value: {
    fontWeight: '600',
    marginTop: 2
  }
});
