import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MenuCard } from './MenuCard';
import { MenuItem } from '../data/profileData';

interface MenuSectionProps {
    items: MenuItem[];
    onItemPress: (id: string) => void;
}

export const MenuSection: React.FC<MenuSectionProps> = ({ items, onItemPress }) => {
    return (
        <View style={styles.container}>
            {items.map((item, index) => (
                <MenuCard
                    key={item.id}
                    item={item}
                    onPress={() => onItemPress(item.id)}
                    isLast={index === items.length - 1}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
    },
});
