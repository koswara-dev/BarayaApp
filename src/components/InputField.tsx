import React from "react";
import { View, Text, TextInput, StyleSheet, KeyboardTypeOptions, TextInputProps } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

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
    maxLength?: number;
    multiline?: boolean;
    validationState?: 'valid' | 'invalid' | 'neutral'; // New prop
    validationMessage?: string; // New prop for clues/errors
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
    maxLength,
    multiline,
    validationState = 'neutral',
    validationMessage
}: InputFieldProps) {

    // Determine styles based on validation state
    let borderColor = "#E2E8F0";
    let iconColor = "#94A3B8";

    if (validationState === 'valid') {
        borderColor = "#10B981"; // Green
        iconColor = "#10B981";
    } else if (validationState === 'invalid') {
        borderColor = "#EF4444"; // Red
        iconColor = "#EF4444";
    }

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>

            <View style={[styles.inputWrapper, { borderColor }]}>
                <Icon name={icon} size={20} color={validationState === 'neutral' ? "#94A3B8" : iconColor} />

                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={secureTextEntry}
                    value={value}
                    onChangeText={onChangeText}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    maxLength={maxLength}
                    multiline={multiline}
                />

                {/* Right Icon Logic */}
                {rightIcon ? (
                    <Icon
                        name={rightIcon}
                        size={20}
                        color="#94A3B8"
                        onPress={onRightIconPress}
                        style={{ marginLeft: 8 }}
                    />
                ) : (
                    // If no custom right icon, show validation icon if state is set
                    <>
                        {validationState === 'valid' && <Icon name="check-circle" size={20} color="#10B981" />}
                        {validationState === 'invalid' && <Icon name="close-circle" size={20} color="#EF4444" />}
                    </>
                )}
            </View>

            {/* Validation Message / Clue */}
            {validationMessage && (
                <Text style={[
                    styles.validationText,
                    validationState === 'invalid' ? styles.errorText : styles.clueText
                ]}>
                    {validationMessage}
                </Text>
            )}
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
        borderWidth: 1.5, // Slightly thicker for visibility
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
    validationText: {
        fontSize: 12,
        marginTop: 4,
    },
    errorText: {
        color: "#EF4444",
    },
    clueText: {
        color: "#64748B",
    }
});
