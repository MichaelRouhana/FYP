import React from 'react';
import { ScrollView, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { VictoryBar, VictoryChart, VictoryTheme } from 'victory-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const data = [
  { x: 'Users', y: 1200 },
  { x: 'Matches', y: 85 },
  { x: 'Bids', y: 560 },
];

export default function AdminAnalytics() {
  const colorScheme = useColorScheme() ?? 'light';
  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors[colorScheme].background }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card style={{ backgroundColor: Colors[colorScheme].card }}>
        <Card.Title title="Analytics (Mock)" />
        <Card.Content>
          <VictoryChart theme={VictoryTheme.material} domainPadding={16}>
            <VictoryBar data={data} style={{ data: { fill: Colors[colorScheme].tint } }} />
          </VictoryChart>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}




