import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';

export default function ServiceListItem({ id, title, description, icon }: any) {
  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate('ServiceDetail', { serviceId: id })
      }
    >
      <View style={styles.iconBox}>
        <Icon name={icon} size={20} color="#1677D9" />
      </View>

      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.desc}>{description}</Text>
      </View>

      <Icon name="chevron-right" size={20} color="#94A3B8" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E0ECFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  text: {
    flex: 1
  },
  title: {
    fontWeight: '700'
  },
  desc: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4
  }
});
