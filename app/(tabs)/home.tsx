import { FlashList } from '@shopify/flash-list';
import { Link } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Button, Chip, Text } from 'react-native-paper';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { MatchCard } from '@/components/MatchCard';
import { matches as allMatches } from '@/mock/matches';
import { GradientBackground } from '@/components/GradientBackground';

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const [filter, setFilter] = useState<'all' | 'live' | 'upcoming'>('all');

  const matches = useMemo(() => {
    if (filter === 'live') return allMatches.filter(m => m.status === 'live');
    if (filter === 'upcoming') return allMatches.filter(m => m.status === 'upcoming');
    return allMatches;
  }, [filter]);

  return (
    <GradientBackground>
      <View style={{ flex: 1, padding: 16 }}>
      <Text variant="titleLarge" style={{ marginBottom: 8 }}>
        Matches
      </Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        <Chip selected={filter === 'all'} onPress={() => setFilter('all')}>
          All
        </Chip>
        <Chip selected={filter === 'live'} onPress={() => setFilter('live')}>
          Live
        </Chip>
        <Chip selected={filter === 'upcoming'} onPress={() => setFilter('upcoming')}>
          Upcoming
        </Chip>
        <View style={{ flex: 1 }} />
        <Link href="/leaderboards" asChild>
          <Button mode="outlined">Leaderboards</Button>
        </Link>
      </View>
      <FlashList
        data={matches}
        keyExtractor={(item) => String(item.id)}
        estimatedItemSize={120}
        renderItem={({ item }) => (
          <Link href={{ pathname: '/match/[id]', params: { id: String(item.id) } }} asChild>
            <View>
              <MatchCard match={item} />
            </View>
          </Link>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
      </View>
    </GradientBackground>
  );
}


