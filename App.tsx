import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/services/firebaseInit';
import { initializeNotifications, setupNotificationCategories, addNotificationResponseListener } from './src/services/notifications';
import { saveUserSession, getUserSession, clearUserSession, isSessionValid } from './src/utils/authHelpers';
import { LoginScreen } from './src/screens/LoginScreen';
import { ConsentScreen } from './src/screens/ConsentScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { TripDiaryScreen } from './src/screens/TripDiaryScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { View, ActivityIndicator, Text } from 'react-native';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2e7d32',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>🏠</Text>,
          tabBarLabel: 'Track',
        }}
      />
      <Tab.Screen 
        name="TripDiary" 
        component={TripDiaryScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>🗺️</Text>,
          tabBarLabel: 'Diary',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>👤</Text>,
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [hasConsented, setHasConsented] = useState(false);

  useEffect(() => {
    // Initialize notifications and check for saved session
    const initApp = async () => {
      try {
        // Check for saved session first
        const savedSession = await getUserSession();
        if (savedSession && isSessionValid(savedSession)) {
          console.log('Found valid saved session for:', savedSession.email);
          // Session exists but Firebase will verify actual auth state
        }

        await initializeNotifications();
        await setupNotificationCategories();
      } catch (error) {
        console.log('App initialization error:', error);
      }
    };
    initApp();

    // Setup notification listener
    const subscription = addNotificationResponseListener();

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed, user:', user ? user.email : 'null');
      setUser(user);
      
      if (user) {
        // Save the user session
        await saveUserSession(user);
        // For demo, assume all logged-in users have consented
        // In production, fetch this from Firestore
        setHasConsented(true);
      } else {
        // Clear saved session
        await clearUserSession();
        setHasConsented(false);
      }
      setIsLoading(false);
    }, (error) => {
      console.error('Auth state change error:', error);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
      subscription.remove();
    };
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f8ff' }}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={{ marginTop: 20, fontSize: 18, color: '#2e7d32' }}>Project Yatra</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <NavigationContainer>
        <Stack.Navigator 
          screenOptions={{
            headerStyle: {
              backgroundColor: '#2e7d32',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          {!user ? (
            <>
              <Stack.Screen 
                name="Login" 
                component={LoginScreen} 
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Consent" 
                component={ConsentScreen}
                options={{ headerShown: false }}
              />
            </>
          ) : (
            <Stack.Screen 
              name="Main" 
              component={MainTabs}
              options={{ headerShown: false }}
            />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}