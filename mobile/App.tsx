import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Linking } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from './src/features/auth/store/useAuthStore';
import LoginPage from './src/features/auth/pages/LoginPage';
import RegisterPage from './src/features/auth/pages/RegisterPage';
import HomePage from './src/features/meeting/pages/HomePage';
import LobbyPage from './src/features/meeting/pages/LobbyPage';
import RoomPage from './src/features/meeting/pages/RoomPage';
import { PageLoader } from './src/shared/components/Loading';
import * as SplashScreen from 'expo-splash-screen';

// Prevent the native splash screen from hiding automatically on startup
SplashScreen.preventAutoHideAsync().catch(() => {});

const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

export default function App() {
  const { accessToken, user, loadStoredSession, isLoading } = useAuthStore();
  const [pendingRoomCode, setPendingRoomCode] = useState<string | null>(null);

  useEffect(() => {
    // Attempt to load any stored session tokens from SecureStore on startup
    loadStoredSession();

    const parseDeepLink = (url: string | null) => {
      if (!url) return;
      console.log('[DeepLink] Received URL:', url);
      // Matches lobby/room codes: e.g. lobby/abc-defg-hij or room/abc-defg-hij
      const match = url.match(/(?:lobby|room)\/([a-z0-9-]+)/i);
      if (match && match[1]) {
        console.log('[DeepLink] Extracted room code:', match[1]);
        setPendingRoomCode(match[1]);
      }
    };

    // Check if the app was opened by a deep link initially
    Linking.getInitialURL().then((url) => parseDeepLink(url));

    // Listen for incoming links while the app is active
    const handleOpenURL = (event: { url: string }) => parseDeepLink(event.url);
    const subscription = Linking.addEventListener('url', handleOpenURL);

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    // If user is authenticated, we have a pending room code, and navigation container is ready: redirect!
    if (accessToken && pendingRoomCode && navigationRef.isReady()) {
      console.log('[DeepLink] Performing navigation to Lobby with code:', pendingRoomCode);
      (navigationRef as any).navigate('Lobby', { code: pendingRoomCode });
      setPendingRoomCode(null); // Clear the pending state
    }
  }, [accessToken, pendingRoomCode]);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading]);

  // Show standard loading screen during app boot token refresh checking
  if (isLoading && !accessToken && !user) {
    return <PageLoader />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="light" />
      
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade_from_bottom',
        }}
      >
        {accessToken === null ? (
          // Auth Screen Stack
          <>
            <Stack.Screen name="Login">
              {(props) => (
                <LoginPage 
                  onNavigateToRegister={() => props.navigation.navigate('Register')} 
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Register">
              {(props) => (
                <RegisterPage 
                  onNavigateToLogin={() => props.navigation.navigate('Login')} 
                />
              )}
            </Stack.Screen>
          </>
        ) : (
          // App / Call Screen Stack
          <>
            <Stack.Screen name="Home" component={HomePage} />
            <Stack.Screen name="Lobby" component={LobbyPage} />
            <Stack.Screen name="Room" component={RoomPage} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
