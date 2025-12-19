import { Image } from 'react-native-compressor';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { Platform } from 'react-native';

const MAX_FILE_SIZE = 200 * 1024; // 200KB

export const compressImage = async (uri: string, type: string = 'image/jpeg'): Promise<string> => {
    let currentUri = uri;

    // Normalize URI for Android
    if (Platform.OS === 'android' && !currentUri.startsWith('file://') && !currentUri.startsWith('content://')) {
        currentUri = `file://${currentUri}`;
    }

    try {
        // 1. Get initial file size
        const stat = await ReactNativeBlobUtil.fs.stat(currentUri.replace('file://', ''));
        let currentSize = Number(stat.size);

        console.log(`Initial image size: ${(currentSize / 1024).toFixed(2)} KB`);

        if (currentSize <= MAX_FILE_SIZE) {
            return currentUri;
        }

        // 2. Compression Loop
        let quality = 0.8;
        let maxWidth = 1280;
        let compressCount = 0;

        while (currentSize > MAX_FILE_SIZE && compressCount < 5 && quality > 0.1) {
            console.log(`Compressing... Quality: ${quality}, MaxWidth: ${maxWidth}`);

            // Always compress from the currentUri (which becomes the result of the last compression)
            // or we could keep compressing the original with stricter settings. 
            // Compressing the previous output is more effective for size reduction even if quality drops.

            const result = await Image.compress(currentUri, {
                compressionMethod: 'manual',
                maxWidth: maxWidth,
                quality: quality,
                returnableOutputType: 'uri',
            });

            currentUri = result;

            const newStat = await ReactNativeBlobUtil.fs.stat(currentUri.replace('file://', ''));
            currentSize = Number(newStat.size);
            console.log(`New size: ${(currentSize / 1024).toFixed(2)} KB`);

            // Reduce quality/size for next iteration if needed
            quality -= 0.15;
            maxWidth = Math.floor(maxWidth * 0.8);
            compressCount++;
        }

        console.log(`Final image size: ${(currentSize / 1024).toFixed(2)} KB`);
        return currentUri;

    } catch (error) {
        console.error("Image compression error:", error);
        return uri;
    }
};
