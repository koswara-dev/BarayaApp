import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Accordion from '../components/Accordion';
import ContactCard from '../components/ContactCard';
import { serviceDetail } from '../data/serviceDetailMock';

export default function ServiceDetailScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detail Layanan</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Title */}
        <Text style={styles.title}>{serviceDetail.title}</Text>
        <Text style={styles.description}>{serviceDetail.description}</Text>

        {/* Accordion Sections */}
        <Accordion title="Persyaratan" items={serviceDetail.requirements} />
        <Accordion title="Prosedur" items={serviceDetail.procedure} />
        <Accordion title="Waktu & Biaya" items={serviceDetail.timeCost} />

        {/* Contact */}
        <Text style={styles.section}>Informasi Kontak</Text>
        <ContactCard
          icon="phone"
          label="Call Center"
          value={serviceDetail.contact.phone}
        />
        <ContactCard
          icon="mail"
          label="Email Dukungan"
          value={serviceDetail.contact.email}
        />
      </ScrollView>

      {/* Bottom Button */}
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Ajukan Permohonan</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  content: { padding: 16, paddingBottom: 100 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600'
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12
  },
  description: {
    color: '#475569',
    marginBottom: 24,
    fontSize: 15,
    lineHeight: 22
  },

  section: {
    fontSize: 18,
    fontWeight: '700',
    marginVertical: 16
  },

  button: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#1677D9',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center'
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700'
  }
});
