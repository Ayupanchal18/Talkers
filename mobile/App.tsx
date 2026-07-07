import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from './src/features/auth/store/useAuthStore';
import LoginPage from './src/features/auth/pages/LoginPage';
import RegisterPage from './src/features/auth/pages/RegisterPage';
import HomePage from './src/features/meeting/pages/HomePage';
import LobbyPage from './src/features/meeting/pages/LobbyPage';
import RoomPage from './src/features/meeting/pages/RoomPage';
import { PageLoader } from './src/shared/components/Loading';

const Stack = createNativeStackNavigator();

export default function App() {
  const { accessToken, user, loadStoredSession, isLoading } = useAuthStore();

  useEffect(() => {
    // Attempt to load any stored session tokens from SecureStore on startup
    loadStoredSession();
  }, []);

  // Show standard loading screen during app boot token refresh checking
  if (isLoading && !accessToken && !user) {
    return <PageLoader />;
  }

  return (
    <NavigationContainer>
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
