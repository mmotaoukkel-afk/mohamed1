/**
 * Favorites Context - Kataraa
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
    loadFavorites();
  }, [user]);

  // Save favorites when changed
  useEffect(() => {
    if (!loading && user?.email && user.email === loadedUserEmail) {
      const handler = setTimeout(() => {
        const key = `@kataraa_favorites_${user.email.toLowerCase()}`;
        AsyncStorage.setItem(key, JSON.stringify(favorites));
      }, 500);
      return () => clearTimeout(handler);
    }
  }, [favorites, loading, user, loadedUserEmail]);

  const loadFavorites = async () => {
    if (!user?.email) {
      setFavorites([]);
      setLoadedUserEmail(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setFavorites([]); // Clear immediately to avoid flash

    try {
      const key = `@kataraa_favorites_${user.email.toLowerCase()}`;
      const saved = await AsyncStorage.getItem(key);
      if (saved) {
        setFavorites(JSON.parse(saved));
      } else {
        setFavorites([]);
      }
      setLoadedUserEmail(user.email);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

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
