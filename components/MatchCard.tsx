import React, { useEffect, useMemo, useState } from 'react';
import { Image, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { SvgUri } from 'react-native-svg';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { GlowBadge } from '@/components/GlowBadge';

export type MatchEvent = {
  minute: number;
  type: 'goal' | 'yellow' | 'red' | 'var';
  team: 'home' | 'away';
  player?: string;
};

export type Match = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  startTime: string; // ISO
  status: 'live' | 'upcoming' | 'finished';
  tournament: string;
  durationMinutes?: number;
  homeLogoUrl?: string;
  awayLogoUrl?: string;
  leagueLogoUrl?: string;
  events?: MatchEvent[];
};

export function MatchCard({ match }: { match: Match }) {
  const colorScheme = useColorScheme() ?? 'light';
  const isLive = match.status === 'live';
  const isUpcoming = match.status === 'upcoming';
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isLive && !isUpcoming) return;
    const intervalId = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, [isLive, isUpcoming]);

  const durationMinutes = match.durationMinutes ?? 90;
  const startMs = useMemo(() => new Date(match.startTime).getTime(), [match.startTime]);
  const elapsedMinutes = useMemo(() => {
    if (!isLive) return 0;
    const mins = Math.max(0, Math.floor((now - startMs) / 60000));
    return Math.min(durationMinutes, mins);
  }, [isLive, now, startMs, durationMinutes]);
  const progressPercent = useMemo(() => {
    if (!isLive) return 0;
    return Math.max(0, Math.min(100, Math.round((elapsedMinutes / durationMinutes) * 100)));
  }, [elapsedMinutes, durationMinutes, isLive]);

  const timeUntilKickoffMs = Math.max(0, startMs - now);

  function formatCountdown(ms: number) {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m ${seconds}s`;
  }

  const trackColor = colorScheme === 'light' ? '#e5e7eb' : '#1f2937';

  return (
    <Card mode="contained" style={{
      backgroundColor: Colors[colorScheme].card,
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 6,
    }}>
      <Card.Content>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          {match.leagueLogoUrl ? (
            <LogoImage uri={match.leagueLogoUrl} size={16} rounded />
          ) : (
            <Ionicons name="trophy-outline" size={16} color={Colors[colorScheme].muted} style={{ marginRight: 6 }} />
          )}
          <Text variant="labelLarge" style={{ color: Colors[colorScheme].muted }}>
            {match.tournament}
          </Text>
          <View style={{ flex: 1 }} />
          {isLive && <GlowBadge color={Colors[colorScheme].success}>LIVE</GlowBadge>}
          {isUpcoming && <GlowBadge color={Colors[colorScheme].warning}>UPCOMING</GlowBadge>}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <TeamRow name={match.homeTeam} logoUrl={match.homeLogoUrl} />
            <TeamRow name={match.awayTeam} logoUrl={match.awayLogoUrl} />
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            {isUpcoming ? (
              <Text variant="titleMedium">{formatCountdown(timeUntilKickoffMs)}</Text>
            ) : (
              <Text variant="headlineSmall">{(match.homeScore ?? 0)} - {(match.awayScore ?? 0)}</Text>
            )}
          </View>
        </View>

        {isLive && (
          <View style={{ marginTop: 12 }}>
            <View style={{ height: 8, borderRadius: 999, backgroundColor: trackColor, overflow: 'hidden' }}>
              <View style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: Colors[colorScheme].tint }} />
            </View>
            <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center' }}>
              <Text variant="labelSmall" style={{ color: Colors[colorScheme].muted }}>
                {progressPercent}% • {elapsedMinutes}'
              </Text>
            </View>
          </View>
        )}

        {isLive && match.events && match.events.length > 0 && (
          <View style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {match.events.slice(-6).map((ev, idx) => (
              <View key={`${ev.type}-${idx}`} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <EventIcon type={ev.type} colorScheme={colorScheme} />
                <Text variant="labelSmall" style={{ marginLeft: 4, color: Colors[colorScheme].muted }}>{ev.minute}'</Text>
              </View>
            ))}
          </View>
        )}
      </Card.Content>
    </Card>
  );
}


function TeamRow({ name, logoUrl }: { name: string; logoUrl?: string }) {
  const colorScheme = useColorScheme() ?? 'light';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 2 }}>
      {logoUrl ? (
        <LogoImage uri={logoUrl} size={24} rounded style={{ marginRight: 8 }} />
      ) : (
        <View style={{ width: 24, height: 24, borderRadius: 12, marginRight: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colorScheme === 'light' ? '#e2e8f0' : '#334155' }}>
          <Ionicons name="shirt-outline" size={14} color={Colors[colorScheme].muted} />
        </View>
      )}
      <Text variant="titleMedium">{name}</Text>
    </View>
  );
}

function EventIcon({ type, colorScheme }: { type: 'goal' | 'yellow' | 'red' | 'var'; colorScheme: 'light' | 'dark' }) {
  if (type === 'goal') return <Ionicons name="football" size={14} color={Colors[colorScheme].success} />;
  if (type === 'yellow') return <Ionicons name="square" size={14} color={Colors[colorScheme].warning} />;
  if (type === 'red') return <Ionicons name="square" size={14} color={Colors[colorScheme].danger} />;
  return <Ionicons name="alert-circle" size={14} color={Colors[colorScheme].warning} />;
}

function LogoImage({ uri, size, rounded, style }: { uri: string; size: number; rounded?: boolean; style?: any }) {
  const isSvg = uri.toLowerCase().endsWith('.svg');
  const radius = rounded ? size / 2 : 0;
  if (isSvg) {
    return (
      <View style={[{ width: size, height: size, marginRight: 6, borderRadius: radius, overflow: rounded ? 'hidden' : 'visible' }, style]}>
        <SvgUri width={size} height={size} uri={uri} />
      </View>
    );
  }
  return <Image source={{ uri }} style={[{ width: size, height: size, borderRadius: radius, marginRight: 6 }, style]} />;
}


