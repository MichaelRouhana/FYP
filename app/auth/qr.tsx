import React from 'react';
import { View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function QRJoin() {
  const colorScheme = useColorScheme() ?? 'light';
  return (
    <View style={{ flex: 1, padding: 16, gap: 12, backgroundColor: Colors[colorScheme].background }}>
      <Card style={{ backgroundColor: Colors[colorScheme].card }}>
        <Card.Title title="Join via QR (Mock)" subtitle="Scan to join a group or event" />
        <Card.Content>
          <View style={{ height: 160, backgroundColor: '#e5e7eb', borderRadius: 8 }} />
          <Text style={{ marginTop: 8 }}>QR placeholder area</Text>
        </Card.Content>
        <Card.Actions>
          <Button>Open Camera</Button>
        </Card.Actions>
      </Card>
    </View>
  );
}




