import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AnnouncementCard({ title, description }: any) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.desc}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 260,
    height: 120,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    padding: 16,
    marginRight: 12
  },
  title: {
    color: '#FFF',
    fontWeight: '600'
  },
  desc: {
    color: '#CBD5E1',
    fontSize: 12,
    marginTop: 6
  }
});
