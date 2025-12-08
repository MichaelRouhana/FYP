import React from 'react';
import { View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function Login() {
  const colorScheme = useColorScheme() ?? 'light';
  return (
    <View style={{ flex: 1, padding: 16, gap: 12, backgroundColor: Colors[colorScheme].background }}>
      <Text variant="titleLarge">Login (Mock)</Text>
      <TextInput label="Email" />
      <TextInput label="Password" secureTextEntry />
      <Button mode="contained">Login</Button>
    </View>
  );
}




