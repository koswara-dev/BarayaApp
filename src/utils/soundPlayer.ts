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

    // Use 'alarm.mp3' directly since it is in android/app/src/main/res/raw
    // This avoids "filename.startsWith is not a function" error when passing a require() number ID
    successSound = new Sound('alarm.mp3', Sound.MAIN_BUNDLE, (error) => {
        if (error) {
            console.log('Failed to load emergency sound', error);
            return;
        }

        successSound?.setVolume(1.0);
        successSound?.play((success) => {
            if (success) {
                console.log('Emergency sound played successfully');
            } else {
                console.log('Emergency sound playback failed');
            }
        });
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
