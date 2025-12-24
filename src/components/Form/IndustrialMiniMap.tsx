import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/Ionicons';

interface IndustrialMiniMapProps {
    latitude: number;
    longitude: number;
    onLocationChange: (lat: number, lng: number) => void;
    onPress?: () => void;
    loading?: boolean;
    label?: string;
}

export default function IndustrialMiniMap({
    latitude,
    longitude,
    onLocationChange,
    onPress,
    loading = false,
    label = "TITIK KEJADIAN (GESER PETA)"
}: IndustrialMiniMapProps) {
    const webViewRef = useRef<WebView>(null);

    // Sync map center if coordinates change from outside
    useEffect(() => {
        if (webViewRef.current) {
            webViewRef.current.postMessage(JSON.stringify({
                type: 'CENTER_MAP',
                lat: latitude,
                lng: longitude
            }));
        }
    }, [latitude, longitude]);

    const mapHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { height: 100vh; width: 100vw; background: #f1f5f9; }
          .center-marker {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -100%);
            z-index: 999;
            pointer-events: none;
          }
          .marker-svg {
            width: 32px;
            filter: drop-shadow(0 4px 8px rgba(225, 29, 72, 0.4));
          }
          .marker-shadow {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 12px;
            height: 4px;
            background: rgba(15, 23, 42, 0.2);
            border-radius: 50%;
            transform: translate(-50%, 0);
            z-index: 998;
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
          }).setView([${latitude}, ${longitude}], 16);
          
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
                    map.setView([data.lat, data.lng], map.getZoom());
                }
            } catch(e) {}
          }
        </script>
      </body>
      </html>
    `;

    return (
        <View style={styles.outerContainer}>
            <View style={styles.labelRow}>
                <View style={styles.stripe} />
                <Text style={styles.labelText}>{label}</Text>
                <Icon name="hand-right-outline" size={12} color="#94A3B8" />
            </View>
            <View style={styles.mapFrame}>
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={onPress}
                    style={[StyleSheet.absoluteFill, { zIndex: 10 }]}
                >
                    <WebView
                        ref={webViewRef}
                        originWhitelist={['*']}
                        source={{ html: mapHtml }}
                        style={styles.webview}
                        scrollEnabled={false}
                        pointerEvents="none"
                        onMessage={(event) => {
                            try {
                                const data = JSON.parse(event.nativeEvent.data);
                                if (data.type === 'UPDATE_LOCATION') {
                                    onLocationChange(data.lat, data.lng);
                                }
                            } catch (e) { }
                        }}
                    />
                </TouchableOpacity>

                {/* Visual Grid Overlays - for Industrial Aesthetic */}
                <View style={styles.gridOverlay} pointerEvents="none">
                    <View style={styles.crosshairH} />
                    <View style={styles.crosshairV} />
                </View>

                {/* Info Overlay */}
                <View style={styles.infoBadge} pointerEvents="none">
                    <Text style={styles.coordText}>
                        {latitude.toFixed(6)}, {longitude.toFixed(6)}
                    </Text>
                </View>

                {/* Loading Overlay */}
                {loading && (
                    <View style={styles.loaderOverlay}>
                        <ActivityIndicator size="small" color="#E11D48" />
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    stripe: {
        width: 4,
        height: 14,
        backgroundColor: '#EAB308',
    },
    labelText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#64748B',
        letterSpacing: 1,
    },
    mapFrame: {
        height: 200,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        position: 'relative',
        overflow: 'hidden',
    },
    webview: {
        flex: 1,
    },
    gridOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    crosshairH: {
        position: 'absolute',
        width: 40,
        height: 1,
        backgroundColor: 'rgba(225, 29, 72, 0.2)',
    },
    crosshairV: {
        position: 'absolute',
        width: 1,
        height: 40,
        backgroundColor: 'rgba(225, 29, 72, 0.2)',
    },
    infoBadge: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 2,
    },
    coordText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    loaderOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
    },
});
