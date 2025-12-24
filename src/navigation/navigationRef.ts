import { createNavigationContainerRef } from '@react-navigation/native';

import { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate<RouteName extends keyof RootStackParamList>(
    name: RouteName,
    params?: RootStackParamList[RouteName]
) {
    if (navigationRef.isReady()) {
        navigationRef.navigate(name as any, params as any);
    }
}

export function reset(name: keyof RootStackParamList) {
    if (navigationRef.isReady()) {
        try {
            navigationRef.reset({
                index: 0,
                routes: [{ name: name as any }],
            });
        } catch (error) {
            console.error('Navigation reset error:', error);
            // Fallback: try to navigate directly
            navigationRef.navigate(name as any);
        }
    }
}
