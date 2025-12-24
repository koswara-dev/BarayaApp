import React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';

interface IndustrialInputProps extends TextInputProps {
    maxLength?: number;
    value: string;
    showCounter?: boolean;
}

export default function IndustrialInput({
    maxLength,
    value,
    showCounter,
    multiline,
    style,
    ...props
}: IndustrialInputProps) {
    return (
        <View style={styles.container}>
            <View style={[styles.inputBox, multiline && styles.inputBoxMulti]}>
                <TextInput
                    style={[styles.textInput, multiline && styles.textInputMulti, style]}
                    multiline={multiline}
                    maxLength={maxLength}
                    value={value}
                    placeholderTextColor="#94A3B8"
                    textAlignVertical={multiline ? 'top' : 'center'}
                    {...props}
                />
                {showCounter && maxLength && (
                    <Text style={styles.charCounter}>{value.length}/{maxLength}</Text>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
    },
    inputBox: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 0,
        paddingHorizontal: 16,
        height: 52,
        justifyContent: 'center',
    },
    inputBoxMulti: {
        height: 120,
        paddingVertical: 12,
    },
    textInput: {
        fontSize: 15,
        color: '#0F172A',
        fontWeight: '500',
        padding: 0,
    },
    textInputMulti: {
        flex: 1,
    },
    charCounter: {
        position: 'absolute',
        bottom: 8,
        right: 12,
        fontSize: 10,
        fontWeight: '700',
        color: '#94A3B8',
    },
});
