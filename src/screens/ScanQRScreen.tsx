import { Camera, CameraType } from 'react-native-camera-kit';
import { View, StyleSheet, Alert, TouchableOpacity, Text, StatusBar, Vibration, Platform, TextInput } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useState, useEffect } from 'react';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function ScanQRScreen() {
    const navigation = useNavigation<any>();
    const isFocused = useIsFocused();
    const [isScanning, setIsScanning] = useState(true);
    const [hasPermission, setHasPermission] = useState(false);
    const [manualUrl, setManualUrl] = useState('');
    const [showManualInput, setShowManualInput] = useState(false);

    useEffect(() => {
        const checkPermission = async () => {
             if (Platform.OS === 'android') {
                const result = await request(PERMISSIONS.ANDROID.CAMERA);
                setHasPermission(result === RESULTS.GRANTED);
            } else if (Platform.OS === 'ios') {
                const result = await request(PERMISSIONS.IOS.CAMERA);
                setHasPermission(result === RESULTS.GRANTED);
            }
        };
        
        checkPermission();
    }, []);

    useEffect(() => {
        if (isFocused) {
            setIsScanning(true);
        }
    }, [isFocused]);

    const handleUrlSubmit = (url: string) => {
        // Basic URL validation
        const urlRegex = /^(http|https):\/\/[^ "]+$/;
        
        if (urlRegex.test(url)) {
            Vibration.vibrate();
            navigation.navigate('Webview', { 
                url: url, 
                title: 'Mini Browser' 
            });
            setShowManualInput(false);
        } else {
             Alert.alert(
                "URL Invalid",
                "URL tidak valid: " + url
            );
        }
    }

    const onReadCode = (event: any) => {
        if (!isScanning) return;
        
        const qrCodeValue = event.nativeEvent.codeStringValue;
        if (!qrCodeValue) return;

        setIsScanning(false);
        handleUrlSubmit(qrCodeValue);
    };

    if (!hasPermission) {
        return (
            <View style={styles.container}>
                <Text style={{color: 'white'}}>Meminta akses kamera...</Text>
            </View>
        );
    }
    
    // Fallback if library not loaded properly
    if (!Camera) {
         return (
            <View style={[styles.container, {justifyContent:'center', alignItems:'center'}]}>
                <Text style={{color: 'white'}}>Camera Component not available</Text>
                <TouchableOpacity onPress={() => setShowManualInput(true)} style={styles.manualButton}>
                     <Text style={styles.manualButtonText}>Input URL Manual</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Only render camera when focused and not showing manual input
    if (!isFocused) {
        return <View style={styles.container} />;
    }

    return (
        <View style={styles.container}>
            <StatusBar hidden />
            
            {/* Camera View */}
            {/* Camera View */}
            {!showManualInput && (
                <>
                    <Camera
                        cameraType={CameraType.Back}
                        scanBarcode={true}
                        onReadCode={onReadCode}
                        showFrame={false} // Hide default frame
                        style={styles.camera}
                    />
                    {/* Custom "Modern" Frame */}
                    <View style={styles.scanArea}>
                         <View style={styles.maskRow}>
                            <View style={styles.mask} />
                         </View>
                         <View style={styles.centerRow}>
                            <View style={styles.mask} />
                            <View style={styles.scanBox}>
                                <View style={[styles.corner, styles.cornerTL]} />
                                <View style={[styles.corner, styles.cornerTR]} />
                                <View style={[styles.corner, styles.cornerBL]} />
                                <View style={[styles.corner, styles.cornerBR]} />
                            </View>
                            <View style={styles.mask} />
                         </View>
                         <View style={styles.maskRow}>
                            <View style={styles.mask} />
                         </View>
                    </View>
                </>
            )}
            
            <View style={styles.overlayHeader}>
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => navigation.navigate('Beranda')} 
                >
                    <Icon name="close" size={30} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.title}>Scan QR Code</Text>
                <View style={{width: 40}} /> 
            </View>

            {/* Manual Input Overlay */}
             {showManualInput ? (
                <View style={styles.manualInputContainer}>
                     <Text style={{color:'white', marginBottom:10}}>Masukkan URL:</Text>
                     <TextInput 
                        style={styles.input}
                        placeholder="https://example.com"
                        placeholderTextColor="#999"
                        value={manualUrl}
                        onChangeText={setManualUrl}
                        autoCapitalize="none"
                     />
                     <TouchableOpacity style={styles.submitButton} onPress={() => handleUrlSubmit(manualUrl)}>
                        <Text style={{color:'black', fontWeight:'bold'}}>Buka URL</Text>
                     </TouchableOpacity>
                     
                     <TouchableOpacity style={{marginTop:20}} onPress={() => setShowManualInput(false)}>
                        <Text style={{color:'#CCC'}}>Batal</Text>
                     </TouchableOpacity>
                </View>
            ) : (
                <>
                    <View style={styles.overlayTextContainer}>
                        <Text style={styles.overlayText}>Arahkan kamera ke QR Code untuk membuka URL</Text>
                        <TouchableOpacity onPress={() => setShowManualInput(true)} style={{marginTop: 20}}>
                             <Text style={{color: '#FFC107', textDecorationLine:'underline'}}>Atau input URL manual</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    camera: {
        flex: 1,
    },
    scanArea: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1,
    },
    maskRow: {
         flex: 1,
         flexDirection: 'row',
    },
    centerRow: {
        height: 260,
        flexDirection: 'row',
    },
    mask: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    scanBox: {
        width: 260,
        height: 260,
        backgroundColor: 'transparent',
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: '#00C853',
        borderWidth: 4,
    },
    cornerTL: {
        top: 0,
        left: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        borderTopLeftRadius: 16,
    },
    cornerTR: {
        top: 0,
        right: 0,
        borderLeftWidth: 0,
        borderBottomWidth: 0,
        borderTopRightRadius: 16,
    },
    cornerBL: {
        bottom: 0,
        left: 0,
        borderRightWidth: 0,
        borderTopWidth: 0,
        borderBottomLeftRadius: 16,
    },
    cornerBR: {
        bottom: 0,
        right: 0,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderBottomRightRadius: 16,
    },
    overlayHeader: {
        position: 'absolute',
        top: 40,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        zIndex: 10,
    },
    backButton: {
        width: 40, 
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    overlayTextContainer: {
        position: 'absolute',
        bottom: 120,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 10,
    },
    overlayText: {
        color: 'white',
        fontSize: 14,
        backgroundColor: 'transparent', // removed bg as mask covers it
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        textAlign: 'center',
    },
    manualInputContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
        zIndex: 20,
    },
    input: {
        width: '100%',
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        color: 'black'
    },
    submitButton: {
        backgroundColor: '#FFC107',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
    },
    manualButton: {
        marginTop: 20,
        backgroundColor: '#333',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    manualButtonText: {
        color: 'white',
    }
});
