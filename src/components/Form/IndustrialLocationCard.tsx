import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface IndustrialLocationCardProps {
    address: string;
    latitude: number;
    longitude: number;
    onPress: () => void;
    label?: string;
}

export default function IndustrialLocationCard({
    address,
    latitude,
    longitude,
    onPress,
    label = "LOKASI KEJADIAN (TAP UNTUK EDIT)"
}: IndustrialLocationCardProps) {
    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
            <View style={styles.flatBox}>
                <View style={styles.leftLine} />
                <View style={styles.info}>
                    <View style={styles.headerRow}>
                        <Icon name="location" size={16} color="#E11D48" />
                        <Text style={styles.label}>{label}</Text>
                    </View>
                    <Text style={styles.addressLine} numberOfLines={1}>
                        {address || "Menentukan lokasi..."}
                    </Text>
                    <View style={styles.accuracyRow}>
                        <Text style={styles.accuracyLine}>
                            {latitude.toFixed(5)}, {longitude.toFixed(5)}
                        </Text>
                        <View style={styles.dotSeparator} />
                        <Text style={styles.accuracyHint}>Geser pin untuk akurasi</Text>
                    </View>
                </View>
                <Icon name="chevron-forward" size={18} color="#94A3B8" />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    flatBox: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 0,
        position: 'relative',
    },
    leftLine: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        backgroundColor: '#EAB308',
    },
    info: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    label: {
        fontSize: 10,
        fontWeight: '900',
        color: '#64748B',
        letterSpacing: 0.5,
    },
    addressLine: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 4,
    },
    accuracyRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    accuracyLine: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94A3B8',
    },
    dotSeparator: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#CBD5E1',
        marginHorizontal: 8,
    },
    accuracyHint: {
        fontSize: 11,
        fontWeight: '600',
        color: '#3B82F6',
    },
});
