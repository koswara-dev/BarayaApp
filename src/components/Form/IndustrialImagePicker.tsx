import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

interface IndustrialImagePickerProps {
    photo: any;
    onPhotoSelected: (photo: any) => void;
    onPhotoRemoved: () => void;
    placeholderText?: string;
    cameraOnly?: boolean;
}

export default function IndustrialImagePicker({ photo, onPhotoSelected, onPhotoRemoved, placeholderText, cameraOnly = false }: IndustrialImagePickerProps) {
    const handleCamera = async () => {
        if (Platform.OS === 'android') {
            try {
                const result = await request(PERMISSIONS.ANDROID.CAMERA);
                if (result !== RESULTS.GRANTED) {
                     Alert.alert('Izin Kamera', 'Aplikasi membutuhkan izin kamera untuk mengambil foto.');
                     return;
                }
            } catch (err) {
                console.warn(err);
                return;
            }
        }

        const result = await launchCamera({ mediaType: 'photo', quality: 0.5 });
        if (result.assets && result.assets.length > 0) {
            onPhotoSelected(result.assets[0]);
        }
    };

    const handleGallery = async () => {
        const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.5 });
        if (result.assets && result.assets.length > 0) {
            onPhotoSelected(result.assets[0]);
        }
    };

    return (
        <View style={styles.container}>
            {photo ? (
                <View style={styles.photoPreviewBox}>
                    <Image source={{ uri: photo.uri }} style={styles.previewImage} />
                    <TouchableOpacity style={styles.removePhotoBtn} onPress={onPhotoRemoved}>
                        <Icon name="close-circle" size={24} color="#EF4444" />
                    </TouchableOpacity>
                    <View style={styles.photoInfo}>
                        <Icon name="image-outline" size={14} color="#FFF" />
                        <Text style={styles.photoInfoText}>FOTO TERPILIH</Text>
                    </View>
                </View>
            ) : (
                <View style={styles.photoActionRow}>
                    <TouchableOpacity style={styles.photoActionBtn} onPress={handleCamera}>
                        <Icon name="camera" size={24} color="#0F172A" />
                        <Text style={styles.photoActionText}>{placeholderText || 'KAMERA'}</Text>
                    </TouchableOpacity>
                    {!cameraOnly && (
                        <TouchableOpacity style={[styles.photoActionBtn, styles.photoActionSecondary]} onPress={handleGallery}>
                            <Icon name="images" size={24} color="#0F172A" />
                            <Text style={styles.photoActionText}>GALERI</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
    },
    photoPreviewBox: {
        width: '100%',
        height: 200,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 0,
        position: 'relative',
        overflow: 'hidden',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    removePhotoBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
    },
    photoInfo: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        gap: 8,
    },
    photoInfoText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    photoActionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    photoActionBtn: {
        flex: 1,
        height: 80,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 0,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    photoActionSecondary: {
        backgroundColor: '#FFFFFF',
    },
    photoActionText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: 0.5,
    },
});
