import React from 'react';
import { View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function Register() {
  const colorScheme = useColorScheme() ?? 'light';
  return (
    <View style={{ flex: 1, padding: 16, gap: 12, backgroundColor: Colors[colorScheme].background }}>
      <Text variant="titleLarge">Register (Mock)</Text>
      <TextInput label="Name" />
      <TextInput label="Email" />
      <TextInput label="Password" secureTextEntry />
      <Button mode="contained">Create Account</Button>
    </View>
  );
}




