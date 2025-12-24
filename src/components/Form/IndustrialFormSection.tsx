import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface IndustrialFormSectionProps {
    title: string;
    stripeColor?: string;
}

export default function IndustrialFormSection({ title, stripeColor = '#FFB800' }: IndustrialFormSectionProps) {
    return (
        <View style={styles.sectionHeader}>
            <View style={[styles.sectionStripe, { backgroundColor: stripeColor }]} />
            <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        marginTop: 24,
        marginBottom: 16,
    },
    sectionStripe: {
        width: 3,
        height: 16,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: 1,
    },
});
