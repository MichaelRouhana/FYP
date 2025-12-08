import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme as NavDarkTheme, DefaultTheme as NavDefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { Provider as PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

import { useColorScheme } from '@/components/useColorScheme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <PaperProvider theme={colorScheme === 'dark' ? { ...MD3DarkTheme, colors: { ...MD3DarkTheme.colors, primary: '#16a34a' } } : { ...MD3LightTheme, colors: { ...MD3LightTheme.colors, primary: '#16a34a' } }}>
      <ThemeProvider value={colorScheme === 'dark' ? NavDarkTheme : NavDefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          <Stack.Screen name="leaderboards" options={{ title: 'Leaderboards' }} />
          <Stack.Screen name="rewards" options={{ title: 'Rewards' }} />
          <Stack.Screen name="match/[id]" options={{ title: 'Match Details' }} />
          <Stack.Screen name="community/rooms" options={{ title: 'Community Rooms' }} />
          <Stack.Screen name="community/polls" options={{ title: 'Polls & Quizzes' }} />
          <Stack.Screen name="community/thread/[id]" options={{ title: 'Thread' }} />
          <Stack.Screen name="admin/index" options={{ title: 'Admin Dashboard' }} />
          <Stack.Screen name="admin/users" options={{ title: 'Users' }} />
          <Stack.Screen name="admin/matches" options={{ title: 'Matches & Events' }} />
          <Stack.Screen name="admin/points" options={{ title: 'Points & Rewards' }} />
          <Stack.Screen name="admin/analytics" options={{ title: 'Analytics' }} />
          <Stack.Screen name="auth/login" options={{ title: 'Login' }} />
          <Stack.Screen name="auth/register" options={{ title: 'Register' }} />
          <Stack.Screen name="auth/qr" options={{ title: 'Join via QR' }} />
          <Stack.Screen name="settings/language" options={{ title: 'Language' }} />
        </Stack>
      </ThemeProvider>
    </PaperProvider>
  );
}
