import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { Card, DataTable, Text } from 'react-native-paper';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { matches } from '@/mock/matches';

export default function MatchDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const match = matches.find((m) => String(m.id) === String(id));

  if (!match) return <Text>Match not found</Text>;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors[colorScheme].background }} contentContainerStyle={{ padding: 16 }}>
      <Card style={{ backgroundColor: Colors[colorScheme].card }}>
        <Card.Title title={`${match.homeTeam} vs ${match.awayTeam}`} subtitle={match.tournament} />
        <Card.Content>
          <Text variant="headlineMedium" style={{ textAlign: 'center', marginVertical: 8 }}>
            {(match.homeScore ?? 0)} - {(match.awayScore ?? 0)}
          </Text>
          <View style={{ height: 8 }} />
          <Text variant="titleMedium">Statistics</Text>
          <DataTable>
            <DataTable.Row>
              <DataTable.Cell>Possession</DataTable.Cell>
              <DataTable.Cell numeric>54%</DataTable.Cell>
            </DataTable.Row>
            <DataTable.Row>
              <DataTable.Cell>Shots</DataTable.Cell>
              <DataTable.Cell numeric>12</DataTable.Cell>
            </DataTable.Row>
            <DataTable.Row>
              <DataTable.Cell>Yellow Cards</DataTable.Cell>
              <DataTable.Cell numeric>3</DataTable.Cell>
            </DataTable.Row>
            <DataTable.Row>
              <DataTable.Cell>Substitutions</DataTable.Cell>
              <DataTable.Cell numeric>5</DataTable.Cell>
            </DataTable.Row>
          </DataTable>
        </Card.Content>
      </Card>
      <View style={{ height: 12 }} />
      <Card style={{ backgroundColor: Colors[colorScheme].card }}>
        <Card.Title title="Standings (Mock)" />
        <Card.Content>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Team</DataTable.Title>
              <DataTable.Title numeric>Pts</DataTable.Title>
            </DataTable.Header>
            <DataTable.Row>
              <DataTable.Cell>{match.homeTeam}</DataTable.Cell>
              <DataTable.Cell numeric>52</DataTable.Cell>
            </DataTable.Row>
            <DataTable.Row>
              <DataTable.Cell>{match.awayTeam}</DataTable.Cell>
              <DataTable.Cell numeric>49</DataTable.Cell>
            </DataTable.Row>
          </DataTable>
        </Card.Content>
      </Card>
      <View style={{ height: 12 }} />
      <Card style={{ backgroundColor: Colors[colorScheme].card }}>
        <Card.Title title="Event Notifications (Mock)" />
        <Card.Content>
          <Text>⚽ Goal at 67' - {match.homeTeam}</Text>
          <Text>🟨 Yellow card at 72' - {match.awayTeam}</Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}




