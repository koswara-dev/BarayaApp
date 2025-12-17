import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import useToastStore from '../stores/toastStore';

export default function Toast() {
    const { visible, message, type, hideToast } = useToastStore();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    friction: 5,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: -100,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible, fadeAnim, slideAnim]);

    // Don't render anything if not visible
    if (!visible) {
        return null;
    }

    const getBackgroundColor = () => {
        switch (type) {
            case 'success':
                return '#10B981';
            case 'error':
                return '#EF4444';
            default:
                return '#3B82F6';
        }
    };

    const getIconName = () => {
        switch (type) {
            case 'success':
                return 'checkmark-circle';
            case 'error':
                return 'alert-circle';
            default:
                return 'information-circle';
        }
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                    backgroundColor: getBackgroundColor(),
                },
            ]}
            pointerEvents="box-none"
        >
            <TouchableOpacity onPress={hideToast} style={styles.content} activeOpacity={0.9}>
                <Icon name={getIconName()} size={24} color="#FFF" />
                <Text style={styles.text}>{message}</Text>
                <Icon name="close" size={20} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 30,
        left: 20,
        right: 20,
        zIndex: 9999,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    text: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 14,
        flex: 1,
        marginLeft: 12,
        marginRight: 8,
    },
});