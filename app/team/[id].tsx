import { Stack, useLocalSearchParams } from 'expo-router';
import { View, Text } from 'react-native';
import { ThemedText } from '@/components/Themed';
import { ThemedView } from '@/components/Themed';

export default function TeamDetails() {
  const { id } = useLocalSearchParams();

  return (
    <ThemedView style={{ flex: 1, padding: 20 }}>
      <Stack.Screen options={{ title: 'Team Details', headerBackTitle: 'Search' }} />
      <ThemedText type="title">Team ID: {id}</ThemedText>
      <ThemedText>Team details coming soon...</ThemedText>
    </ThemedView>
  );
}

