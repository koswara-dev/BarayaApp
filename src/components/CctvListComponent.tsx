import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, Platform, Dimensions, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import YoutubePlayer from 'react-native-youtube-iframe';

const { width } = Dimensions.get('window');

import { CCTVS } from '../data/cctvData';

const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const CctvListComponent = () => {
    const navigation = useNavigation<any>();
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [playing, setPlaying] = useState(false);
    const [youtubeId, setYoutubeId] = useState<string | null>(null);

    const onStateChange = useCallback((state: string) => {
        if (state === "ended") {
            setPlaying(false);
        }
    }, []);

    const handlePress = (item: any) => {
        if (item.status === 'Online' && item.url) {
            const ytId = getYoutubeId(item.url);
            if (ytId) {
                setYoutubeId(ytId);
                setSelectedItem({ ...item, type: 'youtube' });
                setModalVisible(true);
                setPlaying(true);
            } else {
                // If not YouTube, treat as standard WebView stream or navigate
                // Or render inside modal with WebView
                 setSelectedItem({ ...item, type: 'webview' });
                 setModalVisible(true);
            }
        }
    };

    const handleCloseModal = () => {
        setPlaying(false);
        setModalVisible(false);
        setSelectedItem(null);
        setYoutubeId(null);
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <View style={styles.titleContainer}>
                    <Icon name="videocam-outline" size={20} color="#EF4444" />
                    <Text style={styles.title}>Pantauan CCTV</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('CctvMonitor')}>
                    <Text style={styles.seeAll}>Lihat Semua</Text>
                </TouchableOpacity>
            </View>

            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {CCTVS.map((item) => (
                    <TouchableOpacity 
                        key={item.id} 
                        style={styles.card}
                        onPress={() => handlePress(item)}
                        disabled={item.status !== 'Online'}
                    >
                        <View style={styles.thumbnailContainer}>
                            <Image 
                                source={{ uri: item.thumbnail }} 
                                style={styles.thumbnail}
                                resizeMode="cover"
                            />
                            <View style={styles.overlay} />
                            
                            <View style={[
                                styles.statusBadge, 
                                { backgroundColor: item.status === 'Online' ? '#10B981' : '#64748B' }
                            ]}>
                                <View style={[styles.statusDot, { backgroundColor: '#FFF' }]} />
                                <Text style={styles.statusText}>{item.status}</Text>
                            </View>

                            <View style={styles.playIconContainer}>
                                <Icon name={item.status === 'Online' ? "play-circle" : "alert-circle"} size={32} color="#FFF" />
                            </View>
                        </View>
                        
                        <View style={styles.infoContainer}>
                            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                            <View style={styles.locationRow}>
                                <Icon name="location-sharp" size={10} color="#94A3B8" />
                                <Text style={styles.itemLocation} numberOfLines={1}>{item.location}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Video Player Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={handleCloseModal}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={styles.modalBackdrop} onPress={handleCloseModal} />
                    
                    <View style={styles.modalContent}>
                         <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{selectedItem?.name || 'CCTV'}</Text>
                            <TouchableOpacity onPress={handleCloseModal}>
                                <Icon name="close" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.videoContainer}>
                            {selectedItem?.type === 'youtube' && youtubeId ? (
                                <YoutubePlayer
                                    height={240}
                                    play={playing}
                                    videoId={youtubeId}
                                    onChangeState={onStateChange}
                                />
                            ) : selectedItem?.type === 'webview' ? (
                                <WebView
                                    source={{ uri: selectedItem.url }}
                                    style={{ flex: 1, backgroundColor: '#000' }}
                                    mediaPlaybackRequiresUserAction={false}
                                    allowsInlineMediaPlayback={true}
                                />
                            ) : (
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                    <ActivityIndicator size="large" color="#FFC107" />
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 8,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
    },
    seeAll: {
        fontSize: 12,
        color: '#3B82F6',
        fontWeight: '600',
    },
    scrollContent: {
        paddingHorizontal: 20,
        gap: 12,
    },
    card: {
        width: 160,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    thumbnailContainer: {
        height: 100,
        width: '100%',
        position: 'relative',
        backgroundColor: '#1E293B',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    statusBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        gap: 4,
        zIndex: 2,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '700',
    },
    playIconContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    infoContainer: {
        padding: 10,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0F172A',
        marginBottom: 4,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    itemLocation: {
        fontSize: 11,
        color: '#64748B',
        flex: 1,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContent: {
        width: width - 32,
        backgroundColor: '#000',
        borderRadius: 16,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#1E293B',
    },
    modalTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    videoContainer: {
        height: 240,
        backgroundColor: '#000',
        justifyContent: 'center'
    }
});

export default CctvListComponent;
