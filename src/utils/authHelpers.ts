import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from 'firebase/auth';

const AUTH_STORAGE_KEY = '@sanchari_auth_session';

// Save user session
export const saveUserSession = async (user: User) => {
  try {
    const sessionData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastLoginTime: new Date().toISOString(),
    };
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData));
    console.log('User session saved');
  } catch (error) {
    console.error('Error saving user session:', error);
  }
};

// Get user session
export const getUserSession = async () => {
  try {
    const sessionData = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      console.log('Retrieved user session:', parsed.email);
      return parsed;
    }
    return null;
  } catch (error) {
    console.error('Error retrieving user session:', error);
    return null;
  }
};

// Clear user session
export const clearUserSession = async () => {
  try {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    console.log('User session cleared');
  } catch (error) {
    console.error('Error clearing user session:', error);
  }
};

// Check if session is still valid (not older than 7 days)
export const isSessionValid = (sessionData: any): boolean => {
  if (!sessionData || !sessionData.lastLoginTime) return false;
  
  const lastLogin = new Date(sessionData.lastLoginTime);
  const now = new Date();
  const daysDiff = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);
  
  return daysDiff < 7; // Session valid for 7 days
};