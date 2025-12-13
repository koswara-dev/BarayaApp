import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';
import { useNavigation } from '@react-navigation/native';

export default function ServiceCard({ title, subtitle, icon }: any) {
  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('ServiceDetail')}
      activeOpacity={0.7}
    >
      <Icon name={icon} size={28} color="#2563EB" />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '47%',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12
  },
  title: {
    fontWeight: '600',
    marginTop: 8
  },
  subtitle: {
    color: '#64748B',
    fontSize: 12
  }
});
