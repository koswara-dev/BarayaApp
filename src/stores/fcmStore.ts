import { create } from 'zustand';
import { notificationHelper } from '../utils/notificationHelper';
import api from '../config/api';

interface FCMState {
    fcmToken: string | null;
    isRegistered: boolean;
    registerFCMToken: (jwt: string) => Promise<void>;
    setFCMToken: (token: string | null) => void;
}

const useFCMStore = create<FCMState>((set, get) => ({
    fcmToken: null,
    isRegistered: false,
    
    setFCMToken: (token) => set({ fcmToken: token }),

    registerFCMToken: async (jwt: string) => {
        // Prevent unnecessary re-registration if already registered with same token
        // Note: Ideally we should track which token was registered, but for now simple flag
        // if (get().isRegistered && get().fcmToken) {
        //     console.log("FCM Token already registered in this session.");
        //     return;
        // }

        try {
            await notificationHelper.requestUserPermission();
            const token = await notificationHelper.getFCMToken();
            
            if (!token) {
                console.log('FCM Token negotiation failed, skipping registration');
                return;
            }

            set({ fcmToken: token });

            // Use the provided JWT or let the interceptor handle it
            const config: any = {};
            if (jwt) {
                config.headers = { Authorization: `Bearer ${jwt}` };
            }

            console.log('Registering FCM token to backend via Store...');
            await api.post('/fcm/register', { fcmToken: token }, config);
            console.log('FCM token registered successfully');
            
            set({ isRegistered: true });
            
        } catch (error) {
            console.error('Failed to register FCM token:', error);
            // Optionally set error state here
        }
    }
}));

export default useFCMStore;
