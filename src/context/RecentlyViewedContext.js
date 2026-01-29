import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

const RecentlyViewedContext = createContext();

export const useRecentlyViewed = () => {
    const context = useContext(RecentlyViewedContext);
    if (!context) {
        throw new Error('useRecentlyViewed must be used within RecentlyViewedProvider');
    }
    return context;
};

export const RecentlyViewedProvider = ({ children }) => {
    const { user } = useAuth();
    const [recentlyViewed, setRecentlyViewed] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load recently viewed when user changes
    useEffect(() => {
        loadRecentlyViewed();
    }, [user]);

    const loadRecentlyViewed = async () => {
        setLoading(true);
        try {
            const key = user?.email
                ? `@kataraa_recent_${user.email.toLowerCase()}`
                : '@kataraa_recent_guest';
            const saved = await AsyncStorage.getItem(key);
            if (saved) {
                setRecentlyViewed(JSON.parse(saved));
            } else {
                setRecentlyViewed([]);
            }
        } catch (error) {
            console.error('Error loading recently viewed:', error);
        } finally {
            setLoading(false);
        }
    };

    const addProductToRecent = React.useCallback(async (product) => {
        setRecentlyViewed(prev => {
            // Remove if already exists to move to top
            const filtered = prev.filter(item => item.id !== product.id);
            const updated = [product, ...filtered].slice(0, 10); // Keep last 10

            // Save to storage
            const key = user?.email
                ? `@kataraa_recent_${user.email.toLowerCase()}`
                : '@kataraa_recent_guest';
            AsyncStorage.setItem(key, JSON.stringify(updated));

            return updated;
        });
    }, [user]);

    const clearRecent = React.useCallback(async () => {
        setRecentlyViewed([]);
        const key = user?.email
            ? `@kataraa_recent_${user.email.toLowerCase()}`
            : '@kataraa_recent_guest';
        await AsyncStorage.removeItem(key);
    }, [user]);

    return (
        <RecentlyViewedContext.Provider value={{
            recentlyViewed,
            addProductToRecent,
            clearRecent,
            loading
        }}>
            {children}
        </RecentlyViewedContext.Provider>
    );
};

export default RecentlyViewedContext;
