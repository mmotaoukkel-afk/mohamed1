
import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
    async getItem(key) {
        try {
            const value = await AsyncStorage.getItem(key);
            return value ? JSON.parse(value) : null;
        } catch (e) {
            console.error('Storage getItem error:', e);
            return null;
        }
    },

    async setItem(key, value) {
        try {
            await AsyncStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Storage setItem error:', e);
        }
    },

    async removeItem(key) {
        try {
            await AsyncStorage.removeItem(key);
        } catch (e) {
            console.error('Storage removeItem error:', e);
        }
    },

    async clear() {
        try {
            await AsyncStorage.clear();
        } catch (e) {
            console.error('Storage clear error:', e);
        }
    }
};

export default function StorageRoute() { return null; }
