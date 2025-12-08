import React, { useState } from 'react';
import { View } from 'react-native';
import { DataTable, SegmentedButtons, Text } from 'react-native-paper';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const mock = {
  weekly: [
    { name: 'Alex', points: 320 },
    { name: 'Priya', points: 290 },
    { name: 'Chen', points: 270 },
  ],
  monthly: [
    { name: 'Fatima', points: 1320 },
    { name: 'Diego', points: 1200 },
    { name: 'Noah', points: 1180 },
  ],
  global: [
    { name: 'Liam', points: 9320 },
    { name: 'Emma', points: 9120 },
    { name: 'Olivia', points: 9080 },
  ],
};

export default function Leaderboards() {
  const colorScheme = useColorScheme() ?? 'light';
  const [value, setValue] = useState<'weekly' | 'monthly' | 'global'>('weekly');
  const data = mock[value];
  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: Colors[colorScheme].background }}>
      <SegmentedButtons
        value={value}
        onValueChange={(v) => setValue(v as any)}
        buttons={[
          { value: 'weekly', label: 'Weekly' },
          { value: 'monthly', label: 'Monthly' },
          { value: 'global', label: 'Global' },
        ]}
      />
      <DataTable style={{ marginTop: 16 }}>
        <DataTable.Header>
          <DataTable.Title>Player</DataTable.Title>
          <DataTable.Title numeric>Points</DataTable.Title>
        </DataTable.Header>
        {data.map((row, idx) => (
          <DataTable.Row key={idx}>
            <DataTable.Cell>{row.name}</DataTable.Cell>
            <DataTable.Cell numeric>{row.points}</DataTable.Cell>
          </DataTable.Row>
        ))}
      </DataTable>
    </View>
  );
}




