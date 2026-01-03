// POLYFILLS FOR STOMP CLIENT (MUST BE AT THE VERY TOP)
import * as encoding from 'text-encoding';

// Polyfill TextEncoder/TextDecoder for STOMP to work in React Native
if (typeof global.TextEncoder === 'undefined') {
  (global as any).TextEncoder = encoding.TextEncoder;
  console.log('✅ TextEncoder polyfill applied');
} else {
  console.log('✅ TextEncoder already available');
}

if (typeof global.TextDecoder === 'undefined') {
  (global as any).TextDecoder = encoding.TextDecoder;
  console.log('✅ TextDecoder polyfill applied');
} else {
  console.log('✅ TextDecoder already available');
}

// Test that TextEncoder actually works
try {
  const testEncoder = new (global as any).TextEncoder();
  const testBytes = testEncoder.encode('test');
  console.log('✅ TextEncoder test passed, encoded length:', testBytes.length);
} catch (e) {
  console.error('❌ TextEncoder test failed:', e);
}

import {
  Inter_400Regular,
  Inter_500Medium,
} from '@expo-google-fonts/inter';
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
  Montserrat_900Black,
  Montserrat_900Black_Italic,
} from '@expo-google-fonts/montserrat';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme as NavDarkTheme, DefaultTheme as NavDefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
// Added useRouter and useSegments for navigation logic
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store'; // Added for Token check
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { MD3DarkTheme, MD3LightTheme, Provider as PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';

import { ThemeProvider as AppThemeProvider, useTheme } from '@/context/ThemeContext';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Start the app on the index which redirects to auth/login
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    Montserrat_900Black,
    Montserrat_900Black_Italic,
    Inter_400Regular,
    Inter_500Medium,
  });

  // Hooks for Auto-Login Logic
  const segments = useSegments();
  const router = useRouter();

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      checkAuth(); // Check for token when app loads
    }
  }, [loaded]);

  // --- Auto-Login Logic ---
  const checkAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync('jwt_token');
      const inAuthGroup = segments[0] === 'auth';

      if (token && inAuthGroup) {
        // If user has a token but is on Login/Signup page, send them to Home
        router.replace('/(tabs)/home');
      } 
      // Optional: Add logic here to force logout if token is invalid
    } catch (e) {
      console.log('Auth check failed:', e);
    }
  };

  if (!loaded) {
    return null;
  }

  return (
    <AppThemeProvider>
      <RootLayoutNav />
    </AppThemeProvider>
  );
}

function RootLayoutNav() {
  const { isDark } = useTheme();

  return (
    <PaperProvider theme={isDark ? { ...MD3DarkTheme, colors: { ...MD3DarkTheme.colors, primary: '#16a34a' } } : { ...MD3LightTheme, colors: { ...MD3LightTheme.colors, primary: '#16a34a' } }}>
      <ThemeProvider value={isDark ? NavDarkTheme : NavDefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          <Stack.Screen name="leaderboards" options={{ title: 'Leaderboards' }} />
          <Stack.Screen name="rewards" options={{ title: 'Rewards' }} />
          <Stack.Screen name="match/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="player/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="search" options={{ headerShown: false }} />
          <Stack.Screen name="community/rooms" options={{ title: 'Community Rooms' }} />
          <Stack.Screen name="community/polls" options={{ title: 'Polls & Quizzes' }} />
          <Stack.Screen name="community/thread/[id]" options={{ title: 'Thread' }} />
          <Stack.Screen name="community/chat/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="community/info/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="community/qr/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="community/scan" options={{ headerShown: false }} />
          <Stack.Screen name="admin/index" options={{ title: 'Admin Dashboard' }} />
          <Stack.Screen name="admin/users" options={{ title: 'Users' }} />
          <Stack.Screen name="admin/matches" options={{ title: 'Matches & Events' }} />
          <Stack.Screen name="admin/points" options={{ title: 'Points & Rewards' }} />
          <Stack.Screen name="admin/analytics" options={{ title: 'Analytics' }} />
          <Stack.Screen name="settings/language" options={{ title: 'Language' }} />
        </Stack>
      </ThemeProvider>
    </PaperProvider>
  );
}