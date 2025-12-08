import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Text, TextInput } from 'react-native-paper';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function AdminPoints() {
  const colorScheme = useColorScheme() ?? 'light';
  const [points, setPoints] = useState('100');
  return (
    <View style={{ flex: 1, padding: 16, gap: 12, backgroundColor: Colors[colorScheme].background }}>
      <Card style={{ backgroundColor: Colors[colorScheme].card }}>
        <Card.Title title="Points & Rewards (Mock)" />
        <Card.Content>
          <TextInput label="Award points to user" value={points} onChangeText={setPoints} keyboardType="numeric" />
          <Button style={{ marginTop: 12 }} mode="contained">Award</Button>
        </Card.Content>
      </Card>
    </View>
  );
}




