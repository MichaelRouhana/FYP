import React, { useState } from 'react';
import { View } from 'react-native';
import { List, RadioButton, Text } from 'react-native-paper';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const languages = ['English', 'Español', 'Français', 'العربية', 'हिन्दी'];

export default function Language() {
  const colorScheme = useColorScheme() ?? 'light';
  const [value, setValue] = useState('English');
  return (
    <View style={{ flex: 1, backgroundColor: Colors[colorScheme].background }}>
      <Text variant="titleLarge" style={{ padding: 16 }}>Language</Text>
      <RadioButton.Group value={value} onValueChange={setValue}>
        {languages.map((l) => (
          <List.Item key={l} title={l} right={() => <RadioButton value={l} />} />
        ))}
      </RadioButton.Group>
    </View>
  );
}




