import React, { useState } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';
import { UserProfile } from '../data/profileData';

interface ProfileHeaderProps {
    user: UserProfile;
    onPress: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
    user,
    onPress,
}) => {
    const [imageError, setImageError] = useState(false);

    // Ambil inisial nama
    const getInitials = (name?: string) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Valid avatar
    const hasValidAvatar =
        !!user?.avatar &&
        typeof user.avatar === 'string' &&
        user.avatar.trim() !== '' &&
        !imageError;

    // Warna background avatar dari nama
    const getBackgroundColor = (name?: string) => {
        if (!name) return '#CBD5E1';
        const colors = [
            '#CBD5E1',
            '#C7D2FE',
            '#DDD6FE',
            '#CCFBF1',
            '#DBEAFE',
            '#E0F2FE',
            '#EDE9FE',
        ];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    return (
        <TouchableOpacity
            style={styles.container}
            activeOpacity={0.7}
            onPress={onPress}
        >
            {/* Avatar */}
            <View style={styles.avatarWrapper} key={`avatar-${hasValidAvatar ? 'image' : 'initials'}`}>
                <View
                    style={[
                        styles.avatarPlaceholder,
                        { backgroundColor: getBackgroundColor(user?.name) },
                    ]}
                >
                    {hasValidAvatar ? (
                        <Image
                            source={{ uri: user.avatar as string }}
                            style={styles.avatar}
                            resizeMode="cover"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <Text style={styles.initials}>
                            {getInitials(user?.name)}
                        </Text>
                    )}
                </View>
            </View>

            {/* Text */}
            <View style={styles.textContainer}>
                <Text style={styles.name}>
                    {user?.name || 'User'}
                </Text>
                {!!user?.email && (
                    <Text style={styles.email}>
                        {user.email}
                    </Text>
                )}
            </View>

            {/* Arrow */}
            <Icon name="right" size={18} color="#94A3B8" />
        </TouchableOpacity>
    );
};

export default ProfileHeader;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
    },

    avatarWrapper: {
        marginRight: 14,
    },

    avatarPlaceholder: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },

    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 32,
    },

    initials: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    textContainer: {
        flex: 1,
    },

    name: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
    },

    email: {
        fontSize: 14,
        color: '#64748B',
    },
});