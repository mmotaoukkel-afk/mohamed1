import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import userProfileService from '../services/userProfileService';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext();

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const { user } = useAuth(); // Get current user
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadedUserEmail, setLoadedUserEmail] = useState(null);

  // Load favorites when user changes
  useEffect(() => {
    const loadFavorites = async () => {
      if (!user?.uid) {
        setFavorites([]);
        setLoadedUserEmail(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setFavorites([]); // Clear immediately to avoid flash

      try {
        // 1. Try Cloud first
        const cloudFavs = await userProfileService.getUserFavorites(user.uid);

        if (cloudFavs.length > 0) {
          setFavorites(cloudFavs);
        } else {
          // 2. Fallback to Local
          const key = `@kataraa_favorites_${user.email.toLowerCase()}`;
          const saved = await AsyncStorage.getItem(key);
          if (saved) {
            const localFavs = JSON.parse(saved);
            setFavorites(localFavs);
            // Sync local to cloud if cloud was empty
            await userProfileService.saveUserFavorites(user.uid, localFavs);
          } else {
            setFavorites([]);
          }
        }
        setLoadedUserEmail(user.email);
      } catch (error) {
        console.error('Error loading favorites:', error);
      } finally {
        setLoading(false);
      }
    };
    loadFavorites();
  }, [user]);

  // Save favorites when changed
  useEffect(() => {
    if (!loading && user?.uid && user.email === loadedUserEmail) {
      const handler = setTimeout(async () => {
        // 1. Save to Local Storage
        const key = `@kataraa_favorites_${user.email.toLowerCase()}`;
        await AsyncStorage.setItem(key, JSON.stringify(favorites));

        // 2. Sync to Cloud
        await userProfileService.saveUserFavorites(user.uid, favorites);
      }, 800);
      return () => clearTimeout(handler);
    }
  }, [favorites, loading, user, loadedUserEmail]);

  const toggleFavorite = React.useCallback((product) => {
    setFavorites(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        return prev.filter(item => item.id !== product.id);
      }
      return [...prev, product];
    });
  }, []);

  const isFavorite = React.useCallback((productId) => {
    return favorites.some(item => item.id === productId);
  }, [favorites]);

  const clearFavorites = React.useCallback(() => {
    setFavorites([]);
  }, []);

  return (
    <FavoritesContext.Provider value={{
      favorites,
      toggleFavorite,
      isFavorite,
      clearFavorites,
      loading,
    }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export default FavoritesContext;
