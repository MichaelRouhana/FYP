import React from 'react';
import { ScrollView, View } from 'react-native';
import { Card, List, Text } from 'react-native-paper';
import { Link } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function AdminDashboard() {
  const colorScheme = useColorScheme() ?? 'light';
  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors[colorScheme].background }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text variant="titleLarge" style={{ marginBottom: 8 }}>Admin Dashboard (UI Only)</Text>
      <View style={{ gap: 12 }}>
        <Link href="/admin/matches" asChild>
          <Card style={{ backgroundColor: Colors[colorScheme].card }}><Card.Title title="Match/Event Management" right={(p) => <List.Icon {...p} icon="calendar" />} /></Card>
        </Link>
        <Link href="/admin/users" asChild>
          <Card style={{ backgroundColor: Colors[colorScheme].card }}><Card.Title title="Users" right={(p) => <List.Icon {...p} icon="account" />} /></Card>
        </Link>
        <Link href="/admin/points" asChild>
          <Card style={{ backgroundColor: Colors[colorScheme].card }}><Card.Title title="Points/Rewards" right={(p) => <List.Icon {...p} icon="trophy" />} /></Card>
        </Link>
        <Link href="/admin/analytics" asChild>
          <Card style={{ backgroundColor: Colors[colorScheme].card }}><Card.Title title="Analytics" right={(p) => <List.Icon {...p} icon="chart-bar" />} /></Card>
        </Link>
      </View>
    </ScrollView>
  );
}




