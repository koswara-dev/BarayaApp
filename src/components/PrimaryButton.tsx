import React from "react";
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";

export default function PrimaryButton({
    title,
    onPress,
    loading,
}: any) {
    return (
        <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={onPress}
            disabled={loading}
            activeOpacity={0.8}
        >
            {/* Text */}
            <Text style={styles.text}>
                {loading ? "Memproses" : title}
            </Text>

            {/* Icon / Spinner */}
            {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
            ) : (
                <Icon name="arrow-right" size={18} color="#FFF" />
            )}
        </TouchableOpacity>
    );
}


const styles = StyleSheet.create({
    button: {
        flexDirection: "row",
        height: 56,
        backgroundColor: "#2563EB",
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginTop: 12,
    },
    buttonDisabled: {
        opacity: 0.8,
    },
    text: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "600",
    },
});
