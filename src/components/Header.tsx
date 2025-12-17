import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import useAuthStore from '../stores/authStore';

interface HeaderProps {
  onNotificationPress?: () => void;
  user?: any;
}

export default function Header({ onNotificationPress, user: propUser }: HeaderProps) {
  const storeUser = useAuthStore((state) => state.user);
  const user = propUser || storeUser;

  // Simple time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi,';
    if (hour < 15) return 'Selamat Siang,';
    if (hour < 18) return 'Selamat Sore,';
    return 'Selamat Malam,';
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Left: Avatar & Greeting */}
        <View style={styles.leftSection}>
          <Image
            source={{
              uri: user?.avatar
                ? user.avatar
                : `https://ui-avatars.com/api/?name=${user?.fullName || 'Tamu'}&background=random`
            }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.username} numberOfLines={1}>
              {user?.fullName || 'Tamu'}
            </Text>
          </View>
        </View>

        {/* Right: Notification Bell */}
        <TouchableOpacity
          style={styles.notificationBtn}
          onPress={onNotificationPress}
        >
          <Icon name="notifications" size={24} color="#334155" />
          <View style={styles.badge} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // Shadow
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#CBD5E1',
    marginRight: 12,
  },
  greeting: {
    fontSize: 12,
    color: '#64748B',
  },
  username: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginLeft: 12,
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
  }
});
