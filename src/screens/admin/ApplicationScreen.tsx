import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    SafeAreaView,
    StatusBar,
    Image,
    Platform,
    LayoutAnimation,
    UIManager,
    Animated,
    Easing
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import useToastStore from '../../stores/toastStore';

import { PermissionGuard } from '../../components/PermissionGuard';
import { usePermissions } from '../../hooks/usePermissions';
import { Role } from '../../types/auth';

const { width } = Dimensions.get('window');

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface MenuItem {
    label: string;
    icon: string;
    type: string;
    route?: keyof RootStackParamList;
    permission?: string;
    allowedRoles?: Role[];
}

// Define the menu structure based on the image
const PUBLIC_SERVICES: MenuItem[] = [
    { label: 'List\nPengaduan', icon: 'message-alert-outline', type: 'mci', route: 'AdminPengaduanList', allowedRoles: [Role.SUPERADMIN, Role.ADMIN, Role.STAFF] },
    { label: 'List\nLayanan', icon: 'room-service-outline', type: 'mci' }, // service list
    { label: 'Rekap\nPengaduan', icon: 'chart-box-outline', type: 'mci', allowedRoles: [Role.SUPERADMIN, Role.ADMIN] },
    { label: 'Rekap\nLayanan', icon: 'chart-bar', type: 'mci', allowedRoles: [Role.SUPERADMIN, Role.ADMIN] },
    { label: 'List\nEvent', icon: 'calendar-month-outline', type: 'mci', route: 'EventList' },
    { label: 'Buat\nEvent', icon: 'calendar-plus', type: 'mci', route: 'CreateEvent', allowedRoles: [Role.SUPERADMIN, Role.ADMIN] },
];

const INTERNAL_MANAGEMENT: MenuItem[] = [
    { label: 'List\nDinas', icon: 'office-building-outline', type: 'mci', route: 'DinasList' },
    { label: 'Buat\nDinas', icon: 'office-building-plus-outline', type: 'mci', route: 'CreateDinas', allowedRoles: [Role.SUPERADMIN] },
    { label: 'Buat\nLayanan', icon: 'room-service-outline', type: 'mci', route: 'CreateLayanan', allowedRoles: [Role.SUPERADMIN, Role.ADMIN] },
    { label: 'Pengaturan', icon: 'cog-outline', type: 'mci', route: 'Pengaturan', allowedRoles: [Role.SUPERADMIN] },
];

export default function ApplicationScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const showToast = useToastStore((state) => state.showToast);
    const { hasRole, role } = usePermissions();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const switchAnim = useRef(new Animated.Value(0)).current;

    const toggleViewMode = () => {
        // 1. Content Layout Animation
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

        const newMode = viewMode === 'grid' ? 'list' : 'grid';
        setViewMode(newMode);

        // 2. Switch Knob Animation
        Animated.timing(switchAnim, {
            toValue: newMode === 'list' ? 1 : 0,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
        }).start();
    };

    const switchTranslate = switchAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 24] // Moving 24px to the right
    });

    const handleMenuPress = (item: MenuItem) => {
        if (item.route) {
            navigation.navigate(item.route as any);
        } else {
            showToast(`Fitur ${item.label.replace('\n', ' ')} segera hadir`, 'info');
        }
    };

    const filterMenu = (menuItems: MenuItem[]) => {
        return menuItems.filter(item => {
            if (item.allowedRoles) {
                return item.allowedRoles.includes(role as Role);
            }
            return true;
        });
    };

    const renderMenuItem = (item: MenuItem, index: number) => {
        // Icon color logic - Yellow theme
        const iconColor = '#F59E0B'; // Amber 500
        const bgColor = '#FFFBEB'; // Amber 50

        if (viewMode === 'list') {
            return (
                <TouchableOpacity key={index} style={styles.listItem} onPress={() => handleMenuPress(item)}>
                    <View style={styles.listLeftContent}>
                        <View style={[styles.listIconContainer, { backgroundColor: bgColor }]}>
                            {item.type === 'mci' ? (
                                <MaterialCommunityIcon name={item.icon} size={24} color={iconColor} />
                            ) : (
                                <Icon name={item.icon} size={24} color={iconColor} />
                            )}
                        </View>
                        <Text style={styles.listLabel}>{item.label.replace('\n', ' ')}</Text>
                    </View>
                    <Icon name="chevron-forward" size={20} color="#CBD5E1" />
                </TouchableOpacity>
            );
        }

        return (
            <TouchableOpacity key={index} style={styles.menuItem} onPress={() => handleMenuPress(item)}>
                <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
                    {item.type === 'mci' ? (
                        <MaterialCommunityIcon name={item.icon} size={28} color={iconColor} />
                    ) : (
                        <Icon name={item.icon} size={28} color={iconColor} />
                    )}
                </View>
                <Text style={styles.menuLabel} numberOfLines={2}>{item.label}</Text>
            </TouchableOpacity>
        );
    };

    const filteredPublicServices = filterMenu(PUBLIC_SERVICES);
    const filteredInternalManagement = filterMenu(INTERNAL_MANAGEMENT);

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            {/* Header - Consistent with AdminDashboard (White) */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Aplikasi</Text>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity onPress={toggleViewMode} activeOpacity={0.8}>
                        <View style={styles.switchContainer}>
                            <Animated.View style={[
                                styles.switchThumb,
                                { transform: [{ translateX: switchTranslate }] }
                            ]}>
                                <Icon name={viewMode === 'list' ? "list" : "grid"} size={14} color="#F59E0B" />
                            </Animated.View>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
                <View style={styles.contentPadding}>

                    {/* Public Services Section */}
                    {filteredPublicServices.length > 0 && (
                        <>
                            <Text style={styles.sectionTitle}>Layanan Publik</Text>
                            <View style={viewMode === 'grid' ? styles.gridContainer : styles.listContainer}>
                                {filteredPublicServices.map((item, index) => renderMenuItem(item, index))}
                            </View>
                        </>
                    )}

                    {/* Internal Management Section */}
                    {filteredInternalManagement.length > 0 && (
                        <>
                            <Text style={styles.sectionTitle}>Manajemen Internal</Text>
                            <View style={viewMode === 'grid' ? styles.gridContainer : styles.listContainer}>
                                {filteredInternalManagement.map((item, index) => renderMenuItem(item, index))}
                            </View>
                        </>
                    )}

                </View>
                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FCFDFF',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#1E293B',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
        marginTop: 2,
    },
    headerRight: {
        flexDirection: 'row',
    },
    // Custom Switch Styles
    switchContainer: {
        width: 54,
        height: 30,
        borderRadius: 15,
        padding: 3,
        justifyContent: 'center',
        // Constant Active Style (Yellow Theme) as requested
        backgroundColor: '#FFFBEB',
        borderColor: '#F59E0B',
        borderWidth: 1,
    },
    switchThumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        position: 'absolute',
        left: 2, // Start position
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    container: {
        flex: 1,
    },
    contentPadding: {
        paddingVertical: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 16,
        marginTop: 8,
        paddingHorizontal: 20,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 24,
        alignItems: 'flex-start',
        paddingHorizontal: 20,
    },
    listContainer: {
        marginBottom: 24,
    },
    menuItem: {
        width: '25%', // 4 columns
        alignItems: 'center',
        marginBottom: 24,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    menuLabel: {
        fontSize: 11,
        color: '#475569',
        textAlign: 'center',
        fontWeight: '600',
        lineHeight: 14,
    },
    // List Item Styles
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    listLeftContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    listIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    listLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
    },
});
