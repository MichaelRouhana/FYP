import React from 'react';
import { View } from 'react-native';
import { List, Text } from 'react-native-paper';
import { Link } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const countries = ['Kenya', 'India', 'Brazil', 'Germany', 'Japan'];
const countryToCode: Record<string, string> = {
  Kenya: 'KE',
  India: 'IN',
  Brazil: 'BR',
  Germany: 'DE',
  Japan: 'JP',
};

function countryCodeToFlagEmoji(code: string) {
  // Converts ISO 3166-1 alpha-2 to flag emoji
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

export default function Rooms() {
  const colorScheme = useColorScheme() ?? 'light';
  return (
    <View style={{ flex: 1, backgroundColor: Colors[colorScheme].background }}>
      <Text variant="titleLarge" style={{ padding: 16 }}>Country Rooms</Text>
      {countries.map((c) => {
        const flag = countryCodeToFlagEmoji(countryToCode[c] ?? '');
        return (
          <Link key={c} href={{ pathname: '/community/thread/[id]', params: { id: c } }} asChild>
            <List.Item
              title={`${flag}  ${c}`}
              description="Fans chat room"
            />
          </Link>
        );
      })}
    </View>
  );
}


