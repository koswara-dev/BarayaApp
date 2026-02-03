import React, { useState, useCallback } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    Image, 
    Modal, 
    Dimensions, 
    ActivityIndicator, 
    StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import YoutubePlayer from 'react-native-youtube-iframe';
import useCctvStore from '../stores/cctvStore';

const { width } = Dimensions.get('window');

const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const CctvScreen = () => {
    const navigation = useNavigation<any>();
    const { cctvs, fetchCctv, loading } = useCctvStore();
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [playing, setPlaying] = useState(false);
    const [youtubeId, setYoutubeId] = useState<string | null>(null);

    React.useEffect(() => {
        fetchCctv();
    }, []);

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

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity 
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
                    <Icon name={item.status === 'Online' ? "play-circle" : "alert-circle"} size={40} color="#FFF" />
                </View>
            </View>
            
            <View style={styles.infoContainer}>
                <Text style={styles.itemName} numberOfLines={2}>{item.nama}</Text>
                <View style={styles.locationRow}>
                    <Icon name="location-sharp" size={12} color="#94A3B8" />
                    <Text style={styles.itemLocation} numberOfLines={1}>{item.lokasi}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>CCTV Kota</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#EF4444" />
                </View>
            ) : (
                <FlatList
                    data={cctvs}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    numColumns={2}
                    columnWrapperStyle={styles.columnWrapper}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 50 }}>
                            <Text style={{ color: '#64748B' }}>Tidak ada data CCTV</Text>
                        </View>
                    }
                />
            )}

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
                            <Text style={styles.modalTitle}>{selectedItem?.nama || 'CCTV'}</Text>
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
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    listContent: {
        padding: 16,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    card: {
        width: (width - 48) / 2, // 2 columns with spacing
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
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
        height: 120,
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
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        gap: 6,
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
        padding: 12,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 6,
        height: 40,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    itemLocation: {
        fontSize: 11,
        color: '#64748B',
        flex: 1,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
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

export default CctvScreen;
