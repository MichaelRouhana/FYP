import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Text as ThemedText, View as ThemedView } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export default function TeamDetails() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Team Details', headerBackTitle: 'Search' }} />
      <ThemedText style={[styles.title, { color: colors.text }]}>Team ID: {id}</ThemedText>
      <ThemedText style={[styles.subtitle, { color: colors.text }]}>Team details coming soon...</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
  },
});

