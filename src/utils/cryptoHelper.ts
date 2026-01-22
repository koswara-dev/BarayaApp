import CryptoJS from 'crypto-js';

// Key harus 32 byte untuk AES-256
const SECRET_KEY = CryptoJS.enc.Utf8.parse('BarayaSecret1945BarayaSecret1945');
// 32 chars = 256 bit

export const encryptAES = (text: string): string => {
  if (!text) return '';
  try {
    const encrypted = CryptoJS.AES.encrypt(text, SECRET_KEY, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7 // sama dengan PKCS5Padding
    });

    return encrypted.toString(); // Base64 ciphertext
  } catch (err) {
    console.error('AES encrypt error:', err);
    return text;
  }
};

export const decryptAES = (ciphertext: string): string => {
  if (!ciphertext) return '';
  try {
    const decrypted = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (err) {
    console.error('AES decrypt error:', err);
    // Return original text if decryption fails (fallback for legacy/plain data)
    return ciphertext;
  }
};
