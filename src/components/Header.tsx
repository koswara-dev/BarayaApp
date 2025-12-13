import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

export default function Header() {
  return (
    <View style={styles.container}>
      <Icon name="home" size={24} color="#2563EB" />
      <Text style={styles.title}>Layanan Publik</Text>
      <Icon name="user" size={24} color="#2563EB" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16
  },
  title: {
    fontSize: 18,
    fontWeight: '600'
  }
});
