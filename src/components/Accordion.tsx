import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

export default function Accordion({ title, items }: any) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setOpen(!open)}
      >
        <Text style={styles.title}>{title}</Text>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={20} />
      </TouchableOpacity>

      {open && (
        <View style={styles.content}>
          {items.map((item: string, index: number) => (
            <Text key={index} style={styles.item}>
              {index + 1}. {item}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden'
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  title: {
    fontWeight: '600',
    fontSize: 15
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16
  },
  item: {
    marginTop: 6,
    color: '#475569'
  }
});
