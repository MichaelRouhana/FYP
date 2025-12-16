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
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { MD3DarkTheme, MD3LightTheme, Provider as PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';

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
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          <Stack.Screen name="leaderboards" options={{ title: 'Leaderboards' }} />
          <Stack.Screen name="rewards" options={{ title: 'Rewards' }} />
          <Stack.Screen name="match/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="search" options={{ headerShown: false }} />
          <Stack.Screen name="community/rooms" options={{ title: 'Community Rooms' }} />
          <Stack.Screen name="community/polls" options={{ title: 'Polls & Quizzes' }} />
          <Stack.Screen name="community/thread/[id]" options={{ title: 'Thread' }} />
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
