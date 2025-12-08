import { Link } from 'expo-router';
import React from 'react';
import { Image, ScrollView, View } from 'react-native';
import { Button, List, Text } from 'react-native-paper';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { GradientBackground } from '@/components/GradientBackground';
import { AnimatedPressable } from '@/components/AnimatedPressable';

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  return (
    <GradientBackground>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <View style={{ alignItems: 'center', marginTop: 16 }}>
        <Image source={{ uri: 'https://i.pravatar.cc/120' }} style={{ width: 96, height: 96, borderRadius: 48 }} />
        <Text variant="titleLarge" style={{ marginTop: 8 }}>Alex Doe</Text>
        <Text variant="bodyMedium" style={{ color: Colors[colorScheme].muted }}>Kenya • 1,250 pts</Text>
      </View>
      <View style={{ marginTop: 24 }}>
        <List.Section>
          <List.Subheader>Account</List.Subheader>
          <Link href="/auth/login" asChild>
            <List.Item title="Login" left={(p) => <List.Icon {...p} icon="login" />} />
          </Link>
          <Link href="/auth/register" asChild>
            <List.Item title="Register" left={(p) => <List.Icon {...p} icon="account-plus" />} />
          </Link>
          <Link href="/auth/qr" asChild>
            <List.Item title="Join via QR" left={(p) => <List.Icon {...p} icon="qrcode" />} />
          </Link>
        </List.Section>
        <List.Section>
          <List.Subheader>Engagement</List.Subheader>
          <Link href="/leaderboards" asChild>
            <List.Item title="Leaderboards" left={(p) => <List.Icon {...p} icon="trophy" />} />
          </Link>
          <Link href="/rewards" asChild>
            <List.Item title="Rewards" left={(p) => <List.Icon {...p} icon="gift" />} />
          </Link>
        </List.Section>
        <List.Section>
          <List.Subheader>Settings</List.Subheader>
          <Link href="/settings/language" asChild>
            <List.Item title="Language" left={(p) => <List.Icon {...p} icon="translate" />} />
          </Link>
        </List.Section>
      </View>
      <AnimatedPressable>
        <Button mode="outlined" style={{ marginTop: 16 }} onPress={() => {}}>
          View Admin Dashboard
        </Button>
      </AnimatedPressable>
      </ScrollView>
    </GradientBackground>
  );
}


