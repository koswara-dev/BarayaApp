import React from "react";
import { View, Text, TextInput, StyleSheet, KeyboardTypeOptions, TextInputProps } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

interface InputFieldProps {
    label: string;
    icon: string;
    secureTextEntry?: boolean;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    rightIcon?: string;
    onRightIconPress?: () => void;
    keyboardType?: KeyboardTypeOptions;
    autoCapitalize?: TextInputProps['autoCapitalize'];
}

export default function InputField({
    label,
    icon,
    secureTextEntry,
    value,
    onChangeText,
    placeholder,
    rightIcon,
    onRightIconPress,
    keyboardType,
    autoCapitalize,
}: InputFieldProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>

            <View style={styles.inputWrapper}>
                <Icon name={icon} size={20} color="#94A3B8" />
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={secureTextEntry}
                    value={value}
                    onChangeText={onChangeText}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                />
                {rightIcon && (
                    <Icon
                        name={rightIcon}
                        size={20}
                        color="#94A3B8"
                        onPress={onRightIconPress}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginBottom: 16 },
    label: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 6,
        color: "#0F172A",
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 52,
        backgroundColor: "#FFF",
    },
    input: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: "#0F172A",
    },
});
