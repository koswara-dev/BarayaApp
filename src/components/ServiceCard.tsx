import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';
import { useNavigation } from '@react-navigation/native';
import useToastStore from '../stores/toastStore';

export default function ServiceCard({ title, subtitle, icon, comingSoon }: any) {
  const navigation = useNavigation<any>();
  const showToast = useToastStore((state) => state.showToast);

  const handlePress = () => {
    if (comingSoon) {
      showToast('Fitur belum tersedia', 'info');
    } else {
      navigation.navigate('ServiceDetail');
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.75}
      onPress={handlePress}
    >
      <View style={styles.iconWrapper}>
        <Icon name={icon} size={22} color="#2563EB" />
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      <Text style={styles.subtitle} numberOfLines={2}>
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,

    // tinggi sama biar grid rapi
    minHeight: 140,

    // shadow iOS
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },

    // shadow Android
    elevation: 3,
  },

  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  cardDisabled: {
    backgroundColor: '#F1F5F9',
    elevation: 0,
    shadowOpacity: 0,
  },
  textDisabled: {
    color: '#94A3B8',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
});
