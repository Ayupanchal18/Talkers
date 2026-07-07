import { Platform } from 'react-native';

// In development, 'localhost' points to the device itself.
// - For Android Emulator: 10.0.2.2 is the loopback alias to the host machine's localhost.
// - For iOS Simulator / Web: localhost can be used.
// - For physical devices: Replace this with your host computer's local IP (e.g., http://192.168.1.100:5000)
export const API_URL = 'https://vidss-backend.onrender.com';

console.log('[API] Using base URL:', API_URL);
