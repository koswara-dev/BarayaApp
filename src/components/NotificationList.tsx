import React, { useMemo } from 'react';
import { SectionList, Text, View, StyleSheet } from 'react-native';
import { NotificationItem } from './NotificationItem';

export const NotificationList = ({ data, onItemPress }: any) => {

    const sections = useMemo(() => {
        if (!data) return [];

        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const isSameDay = (d1: Date, d2: Date) => {
            return d1.getDate() === d2.getDate() &&
                d1.getMonth() === d2.getMonth() &&
                d1.getFullYear() === d2.getFullYear();
        };

        const grouped = {
            today: [] as any[],
            yesterday: [] as any[],
            older: [] as any[]
        };

        data.forEach((item: any) => {
            const date = new Date(item.createdAt);
            if (isSameDay(date, today)) {
                grouped.today.push(item);
            } else if (isSameDay(date, yesterday)) {
                grouped.yesterday.push(item);
            } else {
                grouped.older.push(item);
            }
        });

        const result = [];
        if (grouped.today.length > 0) result.push({ title: 'HARI INI', data: grouped.today });
        if (grouped.yesterday.length > 0) result.push({ title: 'KEMARIN', data: grouped.yesterday });
        if (grouped.older.length > 0) result.push({ title: 'MINGGU LALU', data: grouped.older });

        return result;
    }, [data]);

    return (
        <SectionList
            sections={sections}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
                <NotificationItem item={item} onPress={onItemPress} />
            )}
            renderSectionHeader={({ section: { title } }) => (
                <View style={styles.headerWrapper}>
                    <Text style={styles.sectionHeader}>{title}</Text>
                    <View style={styles.line} />
                </View>
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
        />
    );
};

const styles = StyleSheet.create({
    headerWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 12,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94A3B8',
        letterSpacing: 1,
        marginRight: 12,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: '#E2E8F0',
    }
});
