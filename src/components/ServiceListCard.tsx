import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

export default function ServiceCard({ title, desc, onPress }: any) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={styles.card}
            activeOpacity={0.8}
        >
            <View style={styles.iconWrapper}>
                <Icon name="grid" size={24} color="#2563EB" />
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.desc}>{desc}</Text>
            </View>

            <Icon name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 16, // rounded-2xl
        padding: 16,
        marginBottom: 12,

        // shadow iOS
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },

        // elevation Android
        elevation: 2,
    },
    iconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: "#DBEAFE", // blue-100
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827", // gray-900
    },
    desc: {
        marginTop: 4,
        fontSize: 14,
        color: "#6B7280", // gray-500
    },
});
