import Sound from 'react-native-sound';

// Enable playback in silence mode (iOS)
Sound.setCategory('Playback');

let successSound: Sound | null = null;

/**
 * Play success notification sound (like Gojek order sound)
 */
export const playSuccessSound = () => {
    // Release previous sound if exists
    if (successSound) {
        successSound.release();
    }

    // Load and play the bundled sound
    successSound = new Sound('success_notification.mp3', Sound.MAIN_BUNDLE, (error) => {
        if (error) {
            console.log('Failed to load sound', error);
            return;
        }

        // Play the sound with volume
        successSound?.setVolume(1.0);
        successSound?.play((success) => {
            if (success) {
                console.log('Sound played successfully');
            } else {
                console.log('Sound playback failed');
            }
        });
    });
};

/**
 * Play emergency alert sound
 */
export const playEmergencySound = () => {
    if (successSound) {
        successSound.release();
    }

    successSound = new Sound('emergency_alert.mp3', Sound.MAIN_BUNDLE, (error) => {
        if (error) {
            console.log('Failed to load emergency sound', error);
            return;
        }

        successSound?.setVolume(1.0);
        successSound?.play();
    });
};

/**
 * Stop and release any playing sound
 */
export const stopSound = () => {
    if (successSound) {
        successSound.stop();
        successSound.release();
        successSound = null;
    }
};
