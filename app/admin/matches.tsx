import React from 'react';
import { View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { matches } from '@/mock/matches';

export default function AdminMatches() {
  const colorScheme = useColorScheme() ?? 'light';
  return (
    <View style={{ flex: 1, padding: 16, gap: 12, backgroundColor: Colors[colorScheme].background }}>
      <Text variant="titleLarge">Matches & Events (Mock)</Text>
      {matches.map((m) => (
        <Card key={m.id} style={{ backgroundColor: Colors[colorScheme].card }}>
          <Card.Title title={`${m.homeTeam} vs ${m.awayTeam}`} subtitle={`${m.tournament} • ${m.status}`} />
          <Card.Actions>
            <Button>Edit</Button>
            <Button>Notify</Button>
          </Card.Actions>
        </Card>
      ))}
      <Button icon="plus" mode="contained" onPress={() => {}}>Add Event</Button>
    </View>
  );
}




