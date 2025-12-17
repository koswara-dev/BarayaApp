import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';
import { MenuItem } from '../data/profileData';

interface MenuCardProps {
    item: MenuItem;
    onPress: () => void;
    isLast?: boolean;
}

export const MenuCard: React.FC<MenuCardProps> = ({ item, onPress, isLast }) => {
    return (
        <TouchableOpacity
            style={[styles.container, isLast && styles.noBorder]}
            activeOpacity={0.7}
            onPress={onPress}
        >
            <View style={[styles.iconWrapper, { backgroundColor: item.iconBg }]}>
                <Icon name={item.icon} size={22} color={item.iconColor} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Icon name="right" size={18} color="#CBD5E1" />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 9,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    noBorder: {
        borderBottomWidth: 0,
    },
    iconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    title: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
    },
});