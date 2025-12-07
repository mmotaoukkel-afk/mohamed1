import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { hashPassword, verifyPassword, isHashed } from '../utils/passwordHash';

const AuthContext = createContext();
const USER_KEY = 'app_user';
const USERS_DB_KEY = 'app_users_db'; // Stores list of all registered users

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(USER_KEY);
        if (raw) {
          setUserState(JSON.parse(raw));
        }
      } catch (e) {
        console.warn('Failed to load user from SecureStore', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getUsersDB = async () => {
    try {
      const raw = await SecureStore.getItemAsync(USERS_DB_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  };

  const saveUsersDB = async (users) => {
    try {
      await SecureStore.setItemAsync(USERS_DB_KEY, JSON.stringify(users));
    } catch (e) {
      console.warn('Failed to save users DB', e);
    }
  };

  const login = async (email, password) => {
    const users = await getUsersDB();
    const foundUser = users.find(u => u.email === email);

    if (foundUser) {
      console.log('Found user:', foundUser.email);

      let passwordMatches = false;

      // Check if password is in new hash format
      if (isHashed(foundUser.password)) {
        console.log('Password is hashed (new format), verifying...');
        passwordMatches = await verifyPassword(password, foundUser.password);
      } else {
        // Old format or plain text - try direct comparison first
        console.log('Trying direct password comparison...');
        passwordMatches = foundUser.password === password;

        // If direct match, update to new hash format
        if (passwordMatches) {
          const hashedPwd = await hashPassword(password);
          foundUser.password = hashedPwd;
          const allUsers = await getUsersDB();
          const userIndex = allUsers.findIndex(u => u.email === email);
          if (userIndex !== -1) {
            allUsers[userIndex] = foundUser;
            await saveUsersDB(allUsers);
            console.log('Updated password to new hash format');
          }
        }
      }

      if (passwordMatches) {
        const { password: _, ...userSession } = foundUser;
        setUserState(userSession);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userSession));
        setLoading(false);
        return true;
      } else {
        console.log('Password does not match');
      }
    } else {
      console.log('User not found');
    }
    return false;
  };

  // Function to clear all users (for fixing old data issues)
  const clearAllUsers = async () => {
    try {
      await SecureStore.deleteItemAsync(USERS_DB_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      setUserState(null);
      console.log('All users cleared');
      return true;
    } catch (e) {
      console.warn('Failed to clear users', e);
      return false;
    }
  };

  const register = async (name, email, password) => {
    const users = await getUsersDB();
    if (users.find(u => u.email === email)) {
      return false; // User already exists
    }

    // Hash the password before storing
    const hashedPassword = await hashPassword(password);
    const newUser = { name, email, password: hashedPassword };
    users.push(newUser);
    await saveUsersDB(users);

    // Auto login after successful registration
    const { password: _, ...userSession } = newUser;
    setUserState(userSession);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userSession));

    return true;
  };

  const logout = async () => {
    setUserState(null);
    try {
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch (e) {
      console.warn('Failed to delete user from SecureStore', e);
    }
  };

  const updateUser = async (updates) => {
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    setUserState(updatedUser);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUser));

    // Also update in DB
    const users = await getUsersDB();
    const index = users.findIndex(u => u.email === user.email);
    if (index !== -1) {
      // Keep password
      users[index] = { ...users[index], ...updates };
      await saveUsersDB(users);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, clearAllUsers, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
