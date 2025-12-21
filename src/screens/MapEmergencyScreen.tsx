import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Alert, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import GetLocation from 'react-native-get-location';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

export default function MapEmergencyScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { onLocationSelect, viewMode, initialLocation } = (route.params as any) || {};

    const [currentLocation, setCurrentLocation] = useState(initialLocation || { lat: -6.9175, lng: 107.6191 }); // Default Bandung
    const [selectedLocation, setSelectedLocation] = useState(currentLocation);
    const [address, setAddress] = useState(viewMode ? `Koordinat: ${initialLocation?.lat}, ${initialLocation?.lng}` : 'Mendapatkan alamat...');
    const [loading, setLoading] = useState(!viewMode);
    const webViewRef = useRef<WebView>(null);

    // Initial permission check and get location
    useEffect(() => {
        if (!viewMode) {
            requestLocationPermission();
        } else if (initialLocation) {
            // Already handled by initial state, but ensure map centers
            setTimeout(() => {
                if (webViewRef.current) {
                    webViewRef.current.postMessage(JSON.stringify({
                        type: 'CENTER_MAP',
                        lat: initialLocation.lat,
                        lng: initialLocation.lng
                    }));
                }
            }, 1000);
        }
    }, [viewMode, initialLocation]);

    const requestLocationPermission = async () => {
        let permissionCheck = '';
        if (Platform.OS === 'ios') {
            permissionCheck = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
            if (permissionCheck === RESULTS.DENIED) {
                const result = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
                permissionCheck = result;
            }
        } else {
            permissionCheck = await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
            if (permissionCheck === RESULTS.DENIED) {
                const result = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
                permissionCheck = result;
            }
        }

        if (permissionCheck === RESULTS.GRANTED) {
            getCurrentLocation();
        } else {
            setLoading(false);
            Alert.alert('Izin Lokasi', 'Diperlukan izin lokasi untuk menentukan posisi Anda.');
        }
    };

    const getCurrentLocation = async () => {
        setLoading(true);
        try {
            const position = await GetLocation.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 15000,
            });

            const { latitude, longitude } = position;
            const newLoc = { lat: latitude, lng: longitude };
            setCurrentLocation(newLoc);
            setSelectedLocation(newLoc);

            // Initial coordinate display
            setAddress(`Lat: ${latitude.toFixed(5)}, Long: ${longitude.toFixed(5)}`);

            // Center map
            if (webViewRef.current) {
                webViewRef.current.postMessage(JSON.stringify({ type: 'CENTER_MAP', lat: latitude, lng: longitude }));
            }
        } catch (error: any) {
            if (error.code !== 'CANCELLED' && !error.message?.includes('cancelled')) {
                Alert.alert('Gagal', 'Tidak dapat mendapatkan lokasi saat ini: ' + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = () => {
        if (onLocationSelect) {
            onLocationSelect({
                lat: selectedLocation.lat,
                long: selectedLocation.lng,
                address: address
            });
            navigation.goBack();
        }
    };

    // HTML Content for Leaflet Map - Cooler Design
    const mapHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { height: 100vh; width: 100vw; background: #e5e7eb; }
          .center-marker {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -100%);
            z-index: 999;
            pointer-events: none;
          }
          .marker-svg {
            width: 40px;
            filter: drop-shadow(0 6px 12px rgba(225, 29, 72, 0.4));
            animation: bounce 0.5s infinite alternate;
          }
          @keyframes bounce {
            from { transform: translateY(0); }
            to { transform: translateY(-10px); }
          }
          .marker-shadow {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 16px;
            height: 6px;
            background: rgba(0,0,0,0.15);
            border-radius: 50%;
            transform: translate(-50%, 0);
            z-index: 998;
            animation: shadow 0.5s infinite alternate;
          }
          @keyframes shadow {
            from { width: 16px; opacity: 0.4; }
            to { width: 8px; opacity: 0.1; }
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div class="marker-shadow"></div>
        <div class="center-marker">
            <svg class="marker-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21C16 17.5 19 14.4087 19 10.5C19 6.63401 15.866 3.5 12 3.5C8.13401 3.5 5 6.63401 5 10.5C5 14.4087 8 17.5 12 21Z" fill="#E11D48" stroke="white" stroke-width="2"/>
                <circle cx="12" cy="10.5" r="2.5" fill="white"/>
            </svg>
        </div>
        
        <script>
          var map = L.map('map', {
            zoomControl: false,
            attributionControl: false
          }).setView([${currentLocation.lat}, ${currentLocation.lng}], 15);
          
          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: ''
          }).addTo(map);

          map.on('moveend', function() {
            var center = map.getCenter();
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'UPDATE_LOCATION',
              lat: center.lat,
              lng: center.lng
            }));
          });

          document.addEventListener('message', function(event) {
             handleMessage(event);
          });
          window.addEventListener('message', function(event) {
             handleMessage(event);
          });

          function handleMessage(event) {
            try {
                var data = JSON.parse(event.data);
                if (data.type === 'CENTER_MAP') {
                    map.setView([data.lat, data.lng], 18);
                }
            } catch(e) {}
          }
        </script>
      </body>
      </html>
    `;

    return (
        <View style={styles.container}>
            {/* Glass Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="chevron-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{viewMode ? 'LIHAT LOKASI DARURAT' : 'KONFIRMASI LOKASI DARURAT'}</Text>
            </View>

            <View style={styles.mapContainer}>
                <WebView
                    ref={webViewRef}
                    originWhitelist={['*']}
                    source={{ html: mapHtml }}
                    style={{ flex: 1 }}
                    onMessage={(event) => {
                        try {
                            const data = JSON.parse(event.nativeEvent.data);
                            if (data.type === 'UPDATE_LOCATION') {
                                setSelectedLocation({ lat: data.lat, lng: data.lng });
                                setAddress(`Lat: ${data.lat.toFixed(5)}, Long: ${data.lng.toFixed(5)}`);
                            }
                        } catch (e) { }
                    }}
                />

                {/* Floating Locate Button */}
                <TouchableOpacity style={styles.myLocBtn} onPress={getCurrentLocation}>
                    <Icon name="locate" size={28} color="#E11D48" />
                </TouchableOpacity>
            </View>

            {/* Premium Control Panel */}
            <View style={styles.footer}>
                <View style={styles.footerBadge}>
                    <View style={[styles.locStatusDot, viewMode && { backgroundColor: '#3B82F6' }]} />
                    <Text style={[styles.footerBadgeText, viewMode && { color: '#3B82F6' }]}>
                        {viewMode ? 'KOORDINAT KEJADIAN' : 'TITIK KEJADIAN TERPILIH'}
                    </Text>
                </View>

                <View style={styles.detailRow}>
                    <View style={styles.detailIconBox}>
                        <Icon name="navigate" size={20} color="#E11D48" />
                    </View>
                    <View style={styles.detailContent}>
                        <Text style={styles.label}>Koordinat Presisi</Text>
                        <Text style={styles.coordText}>
                            {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.confirmBtn, viewMode && { backgroundColor: '#0F172A', shadowColor: '#0F172A' }]}
                    onPress={viewMode ? () => navigation.goBack() : handleConfirm}
                >
                    <Text style={styles.confirmText}>{viewMode ? 'KEMBALI KE DETAIL' : 'KONFIRMASI LOKASI'}</Text>
                    <Icon name={viewMode ? "arrow-back" : "arrow-forward"} size={18} color="#FFF" />
                </TouchableOpacity>
            </View>

            {loading && (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color="#E11D48" />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 60,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        zIndex: 100,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 0,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#0F172A',
        marginLeft: 8,
        letterSpacing: 0.5,
    },
    mapContainer: {
        flex: 1,
        position: 'relative'
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderRadius: 0,
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        elevation: 25,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: -4 },
        shadowRadius: 10,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    footerBadge: {
        backgroundColor: '#FFF1F2',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 0,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    locStatusDot: {
        width: 6,
        height: 6,
        borderRadius: 0,
        backgroundColor: '#E11D48',
    },
    footerBadgeText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#E11D48',
        letterSpacing: 1,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 24,
    },
    detailIconBox: {
        width: 48,
        height: 48,
        borderRadius: 0,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailContent: {
        flex: 1,
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 4,
    },
    coordText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
        marginTop: 2,
        marginBottom: 4,
    },
    addressText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        marginTop: 2,
        lineHeight: 18,
        marginBottom: 16,
    },
    confirmBtn: {
        backgroundColor: '#E11D48',
        borderRadius: 0,
        paddingVertical: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        shadowColor: '#E11D48',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 16,
        elevation: 8,
    },
    confirmText: {
        color: '#FFFFFF',
        fontWeight: '900',
        fontSize: 15,
        letterSpacing: 1,
    },
    myLocBtn: {
        position: 'absolute',
        bottom: 250,
        right: 20,
        width: 48,
        height: 48,
        borderRadius: 0,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    loader: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200
    }
});
