import React from 'react';
import { View } from 'react-native';
import { Card, ProgressBar, RadioButton, Text } from 'react-native-paper';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function Polls() {
  const colorScheme = useColorScheme() ?? 'light';
  return (
    <View style={{ flex: 1, padding: 16, gap: 12, backgroundColor: Colors[colorScheme].background }}>
      <Card style={{ backgroundColor: Colors[colorScheme].card }}>
        <Card.Title title="Who will win the Champions League?" />
        <Card.Content>
          <RadioButton.Group value={'A'} onValueChange={() => {}}>
            <RadioButton.Item label="Manchester City" value="A" />
            <RadioButton.Item label="Real Madrid" value="B" />
            <RadioButton.Item label="Bayern Munich" value="C" />
          </RadioButton.Group>
          <ProgressBar progress={0.4} style={{ marginTop: 8 }} />
          <Text style={{ marginTop: 4 }}>40% voted City (mock)</Text>
        </Card.Content>
      </Card>
      <Card style={{ backgroundColor: Colors[colorScheme].card }}>
        <Card.Title title="Quiz: Who won WC 2018?" />
        <Card.Content>
          <RadioButton.Group value={'France'} onValueChange={() => {}}>
            <RadioButton.Item label="Germany" value="Germany" />
            <RadioButton.Item label="France" value="France" />
            <RadioButton.Item label="Brazil" value="Brazil" />
          </RadioButton.Group>
        </Card.Content>
      </Card>
    </View>
  );
}




