import React from 'react';
import { View } from 'react-native';
import { DataTable, Text } from 'react-native-paper';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const users = [
  { name: 'Alex', country: 'Kenya', points: 1250 },
  { name: 'Priya', country: 'India', points: 980 },
  { name: 'Diego', country: 'Brazil', points: 1100 },
];

export default function AdminUsers() {
  const colorScheme = useColorScheme() ?? 'light';
  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: Colors[colorScheme].background }}>
      <Text variant="titleLarge">Users (Mock)</Text>
      <DataTable style={{ marginTop: 12 }}>
        <DataTable.Header>
          <DataTable.Title>Name</DataTable.Title>
          <DataTable.Title>Country</DataTable.Title>
          <DataTable.Title numeric>Points</DataTable.Title>
        </DataTable.Header>
        {users.map((u) => (
          <DataTable.Row key={u.name}>
            <DataTable.Cell>{u.name}</DataTable.Cell>
            <DataTable.Cell>{u.country}</DataTable.Cell>
            <DataTable.Cell numeric>{u.points}</DataTable.Cell>
          </DataTable.Row>
        ))}
      </DataTable>
    </View>
  );
}




