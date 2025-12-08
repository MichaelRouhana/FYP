import React from 'react';
import { View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const rewards = [
  { id: 1, title: 'Virtual Jersey', cost: 200 },
  { id: 2, title: 'Sticker Pack', cost: 100 },
  { id: 3, title: 'Coupon 5% Off (Mock)', cost: 500 },
];

export default function RewardsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  return (
    <View style={{ flex: 1, padding: 16, gap: 12, backgroundColor: Colors[colorScheme].background }}>
      {rewards.map((r) => (
        <Card key={r.id} style={{ backgroundColor: Colors[colorScheme].card }}>
          <Card.Title title={r.title} subtitle={`Cost: ${r.cost} pts`} />
          <Card.Actions>
            <Button mode="contained" onPress={() => {}}>Redeem</Button>
          </Card.Actions>
        </Card>
      ))}
    </View>
  );
}




