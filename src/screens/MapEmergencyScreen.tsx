import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Alert, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import Geolocation from 'react-native-geolocation-service';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

export default function MapEmergencyScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { onLocationSelect } = route.params as any;

    const [currentLocation, setCurrentLocation] = useState({ lat: -6.9175, lng: 107.6191 }); // Default Bandung
    const [selectedLocation, setSelectedLocation] = useState(currentLocation);
    const [loading, setLoading] = useState(true);
    const webViewRef = useRef<WebView>(null);

    // Initial permission check and get location
    useEffect(() => {
        requestLocationPermission();
    }, []);

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

    const getCurrentLocation = () => {
        setLoading(true);
        Geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const newLoc = { lat: latitude, lng: longitude };
                setCurrentLocation(newLoc);
                setSelectedLocation(newLoc);
                setLoading(false);

                // Center map
                if (webViewRef.current) {
                    webViewRef.current.postMessage(JSON.stringify({ type: 'CENTER_MAP', lat: latitude, lng: longitude }));
                }
            },
            (error) => {
                setLoading(false);
                Alert.alert('Gagal', 'Tidak dapat mendapatkan lokasi saat ini.');
                console.log(error.code, error.message);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
    };

    const handleConfirm = () => {
        if (onLocationSelect) {
            onLocationSelect({
                lat: selectedLocation.lat,
                long: selectedLocation.lng,
                address: `Lat: ${selectedLocation.lat.toFixed(5)}, Long: ${selectedLocation.lng.toFixed(5)}`
            });
            navigation.goBack();
        }
    };

    // HTML Content for Leaflet Map
    const mapHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { height: 100vh; width: 100vw; }
          .center-marker {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -100%); /* Adjust to pin tip */
            z-index: 999;
            pointer-events: none;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png" width="25" class="center-marker" />
        
        <script>
          var map = L.map('map').setView([${currentLocation.lat}, ${currentLocation.lng}], 15);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);

          // Update React Native on move
          map.on('moveend', function() {
            var center = map.getCenter();
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'UPDATE_LOCATION',
              lat: center.lat,
              lng: center.lng
            }));
          });

          // Handle messages from React Native
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
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pilih Lokasi Kejadian</Text>
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
                            }
                        } catch (e) { }
                    }}
                />

                {/* Locate Me Button */}
                <TouchableOpacity style={styles.myLocBtn} onPress={getCurrentLocation}>
                    <Icon name="locate" size={24} color="#2563EB" />
                </TouchableOpacity>
            </View>

            {/* Footer Sheet */}
            <View style={styles.footer}>
                <Text style={styles.label}>Koordinat Terpilih:</Text>
                <Text style={styles.coordText}>
                    {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </Text>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                    <Text style={styles.confirmText}>Gunakan Lokasi Ini</Text>
                </TouchableOpacity>
            </View>

            {loading && (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color="#2563EB" />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#FFF',
        elevation: 2,
        zIndex: 10
    },
    backBtn: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    mapContainer: {
        flex: 1,
        position: 'relative'
    },
    footer: {
        padding: 20,
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        elevation: 10,
    },
    label: {
        fontSize: 12,
        color: '#64748B',
    },
    coordText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 16,
        marginTop: 4,
    },
    confirmBtn: {
        backgroundColor: '#2563EB',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    confirmText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 16,
    },
    myLocBtn: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 }
    },
    loader: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20
    }
});
