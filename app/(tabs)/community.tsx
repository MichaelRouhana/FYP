import { Link } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { Button, List, Text } from 'react-native-paper';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { GradientBackground } from '@/components/GradientBackground';
import { AnimatedPressable } from '@/components/AnimatedPressable';

export default function CommunityScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  return (
    <GradientBackground>
      <View style={{ flex: 1, padding: 16 }}>
      <Text variant="titleLarge" style={{ marginBottom: 12 }}>Community</Text>
      <Link href="/community/rooms" asChild>
        <List.Item title="Country Rooms" description="Join fans by country" left={(p) => <List.Icon {...p} icon="account-group" />} />
      </Link>
      <Link href="/community/polls" asChild>
        <List.Item title="Polls & Quizzes" description="Vote and test your knowledge" left={(p) => <List.Icon {...p} icon="poll" />} />
      </Link>
      <AnimatedPressable>
        <Button icon="share" mode="outlined" style={{ marginTop: 16 }} onPress={() => {}}>
          Share Prediction
        </Button>
      </AnimatedPressable>
      </View>
    </GradientBackground>
  );
}


