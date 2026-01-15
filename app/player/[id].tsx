import { InfoCard, StatRow, StatSection } from '@/components/player';
import { useTheme } from '@/context/ThemeContext';
import { useFavorites } from '@/hooks/useFavorites';
import api from '@/services/api';
import { PlayerStats } from '@/types/player';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PlayerDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { isFavorite, toggleFavorite } = useFavorites();
  const playerId = typeof id === 'string' ? id : 'default';
  const [loading, setLoading] = useState(true);
  const [playerData, setPlayerData] = useState<PlayerStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayerData = async () => {
      if (!playerId || playerId === 'default') {
        setError('Invalid player ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Try season 2025 first, fallback to 2023
        let response;
        try {
          response = await api.get(`/football/players?id=${playerId}&season=2025`);
        } catch (e) {
          // Fallback to 2023 if 2025 fails
          response = await api.get(`/football/players?id=${playerId}&season=2023`);
        }

        const apiData = response.data;
        
        // API-Sports structure: response.data.response[0]
        if (!apiData?.response || !Array.isArray(apiData.response) || apiData.response.length === 0) {
          setError('Player data not found');
          setLoading(false);
          return;
        }

        const playerResponse = apiData.response[0];
        
        // Extract player info
        const playerInfo = playerResponse.player;
        if (!playerInfo) {
          setError('Player information not available');
          setLoading(false);
          return;
        }

        // Extract statistics (take first one or filter by league if needed)
        const statisticsArray = playerResponse.statistics || [];
        if (statisticsArray.length === 0) {
          setError('Player statistics not available');
          setLoading(false);
          return;
        }

        // Map API response to PlayerStats type
        const mappedData: PlayerStats = {
          player: {
            id: playerInfo.id ?? 0,
            name: playerInfo.name ?? 'Unknown',
            firstname: playerInfo.firstname ?? '',
            lastname: playerInfo.lastname ?? '',
            age: playerInfo.age ?? 0,
            birth: {
              date: playerInfo.birth?.date ?? 'N/A',
              place: playerInfo.birth?.place ?? 'N/A',
              country: playerInfo.birth?.country ?? 'N/A',
            },
            nationality: playerInfo.nationality ?? 'N/A',
            height: playerInfo.height ?? 'N/A',
            weight: playerInfo.weight ?? 'N/A',
            photo: playerInfo.photo ?? '',
            position: playerInfo.position ?? 'N/A',
          },
          statistics: statisticsArray.map((stat: any) => ({
            team: {
              id: stat.team?.id ?? 0,
              name: stat.team?.name ?? 'Unknown',
              logo: stat.team?.logo ?? '',
            },
            league: {
              name: stat.league?.name ?? 'Unknown',
              season: stat.league?.season ?? new Date().getFullYear(),
            },
            games: {
              appearences: stat.games?.appearences ?? 0,
              lineups: stat.games?.lineups ?? 0,
              minutes: stat.games?.minutes ?? 0,
              rating: stat.games?.rating ?? '0.0',
            },
            shots: {
              total: stat.shots?.total ?? 0,
              on: stat.shots?.on ?? 0,
            },
            goals: {
              total: stat.goals?.total ?? 0,
              assists: stat.goals?.assists ?? 0,
              saves: stat.goals?.saves ?? 0,
              conceded: stat.goals?.conceded ?? 0,
            },
            passes: {
              total: stat.passes?.total ?? 0,
              key: stat.passes?.key ?? 0,
              accuracy: stat.passes?.accuracy ?? 0,
            },
            tackles: {
              total: stat.tackles?.total ?? 0,
              blocks: stat.tackles?.blocks ?? 0,
              interceptions: stat.tackles?.interceptions ?? 0,
            },
            duels: {
              total: stat.duels?.total ?? 0,
              won: stat.duels?.won ?? 0,
            },
            dribbles: {
              attempts: stat.dribbles?.attempts ?? 0,
              success: stat.dribbles?.success ?? 0,
            },
            fouls: {
              drawn: stat.fouls?.drawn ?? 0,
              committed: stat.fouls?.committed ?? 0,
            },
            cards: {
              yellow: stat.cards?.yellow ?? 0,
              yellowred: stat.cards?.yellowred ?? 0,
              red: stat.cards?.red ?? 0,
            },
            penalty: {
              won: stat.penalty?.won ?? 0,
              commited: stat.penalty?.commited ?? 0,
              scored: stat.penalty?.scored ?? 0,
              missed: stat.penalty?.missed ?? 0,
              saved: stat.penalty?.saved ?? 0,
            },
            substitutes: {
              in: stat.substitutes?.in ?? 0,
              out: stat.substitutes?.out ?? 0,
              bench: stat.substitutes?.bench ?? 0,
            },
          })),
        };

        setPlayerData(mappedData);
      } catch (err: any) {
        console.error('Error fetching player data:', err);
        setError(err.response?.data?.error || err.message || 'Failed to load player data');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerData();
  }, [playerId]);

  // Show loading indicator
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={[styles.header, { backgroundColor: theme.colors.headerBackground }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Feather name="chevron-left" size={24} color={theme.colors.icon} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading player data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error || !playerData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={[styles.header, { backgroundColor: theme.colors.headerBackground }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Feather name="chevron-left" size={24} color={theme.colors.icon} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={theme.colors.textSecondary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary, marginTop: 16 }]}>
            {error || 'Player not found'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const { player, statistics } = playerData;
  const stats = statistics?.[0]; // Get first season stats
  
  // Check if player is favorited
  const playerIsFavorite = isFavorite('player', player.id);
  
  // Handle favorite toggle
  const handleToggleFavorite = async () => {
    const favoriteItem = {
      id: player.id,
      name: player.name,
      firstname: player.firstname,
      lastname: player.lastname,
      photo: player.photo,
      position: player.position,
      nationality: player.nationality,
      team: stats?.team ? {
        id: stats.team.id,
        name: stats.team.name,
        logo: stats.team.logo,
      } : undefined,
    };
    await toggleFavorite('player', favoriteItem);
  };

  // Safety check: if no stats available, show message
  if (!stats) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={[styles.header, { backgroundColor: theme.colors.headerBackground }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Feather name="chevron-left" size={24} color={theme.colors.icon} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons name="information-outline" size={48} color={theme.colors.textSecondary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary, marginTop: 16 }]}>
            Player statistics not available
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.headerBackground }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Feather name="chevron-left" size={24} color={theme.colors.icon} />
        </TouchableOpacity>
        <View style={styles.headerSpacer} />
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={handleToggleFavorite}
        >
          <MaterialCommunityIcons 
            name={playerIsFavorite ? "star" : "star-outline"} 
            size={24} 
            color={playerIsFavorite ? theme.colors.primary : theme.colors.icon} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Player Avatar & Name */}
        <View style={styles.playerHeader}>
          <Image
            source={{ uri: player.photo }}
            style={[styles.playerPhoto, { backgroundColor: isDark ? '#1A253D' : '#E5E7EB' }]}
            defaultSource={require('@/images/SerieA.jpg')}
          />
          <Text style={[styles.playerName, { color: theme.colors.text }]}>{player.name.toUpperCase()}</Text>
          <View style={styles.teamBadge}>
            <Image
              source={{ uri: stats.team.logo }}
              style={styles.teamLogo}
              defaultSource={require('@/images/SerieA.jpg')}
            />
            <Text style={[styles.teamName, { color: theme.colors.textSecondary }]}>{stats.team.name}</Text>
          </View>
        </View>

        {/* Personal Details Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>PERSONAL DETAILS</Text>
          <View style={[styles.infoGridContainer, { 
            borderColor: theme.colors.border,
            backgroundColor: isDark ? 'transparent' : 'transparent'
          }]}>
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <View style={styles.infoCardWrapper}>
                <InfoCard
                  icon="map-marker-outline"
                  label="Nationality"
                  value={player.nationality}
                  isDark={isDark}
                  theme={theme}
                />
              </View>
              <View style={styles.infoCardWrapper}>
                <InfoCard
                  icon="home-outline"
                  label="Birth Place"
                  value={player.birth.place}
                  isDark={isDark}
                  theme={theme}
                />
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoCardWrapper}>
                <InfoCard
                  icon="account-outline"
                  label="Age"
                  value={String(player.age)}
                  isDark={isDark}
                  theme={theme}
                />
              </View>
              <View style={styles.infoCardWrapper}>
                <InfoCard
                  icon="calendar-outline"
                  label="Date Of Birth"
                  value={player.birth.date}
                  isDark={isDark}
                  theme={theme}
                />
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoCardWrapper}>
                <InfoCard
                  icon="weight"
                  label="Weight"
                  value={player.weight}
                  isDark={isDark}
                  theme={theme}
                />
              </View>
              <View style={styles.infoCardWrapper}>
                <InfoCard
                  icon="human-male-height"
                  label="Height"
                  value={player.height}
                  isDark={isDark}
                  theme={theme}
                />
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoCardWrapper}>
                <InfoCard
                  icon="soccer"
                  label="Position"
                  value={player.position}
                  isDark={isDark}
                  theme={theme}
                />
              </View>
              <View style={styles.infoCardWrapper} />
            </View>
          </View>
          </View>
        </View>

        {/* Games Section */}
        <StatSection title="GAMES" isDark={isDark} theme={theme}>
          <StatRow label="Rating" value={stats.games.rating} isDark={isDark} theme={theme} />
          <StatRow label="Played" value={stats.games.appearences} isDark={isDark} theme={theme} />
          <StatRow label="Line Ups" value={stats.games.lineups} isDark={isDark} theme={theme} />
          <StatRow label="Total Minutes" value={stats.games.minutes} isLast isDark={isDark} theme={theme} />
        </StatSection>

        {/* Cards Section */}
        <StatSection title="CARDS" isDark={isDark} theme={theme}>
          <StatRow label="Red Cards" value={stats.cards.red} isDark={isDark} theme={theme} />
          <StatRow label="Yellow" value={stats.cards.yellow} isDark={isDark} theme={theme} />
          <StatRow label="Second Yellow" value={stats.cards.yellowred} isLast isDark={isDark} theme={theme} />
        </StatSection>

        {/* Duels Section */}
        <StatSection title="DUELS" isDark={isDark} theme={theme}>
          <StatRow label="Total Duels" value={stats.duels.total} isDark={isDark} theme={theme} />
          <StatRow label="Duels Won" value={stats.duels.won} isLast isDark={isDark} theme={theme} />
        </StatSection>

        {/* Fouls Section */}
        <StatSection title="FOULS" isDark={isDark} theme={theme}>
          <StatRow label="Fouls Commited" value={stats.fouls.committed} isDark={isDark} theme={theme} />
          <StatRow label="Fouls Drawn" value={stats.fouls.drawn} isDark={isDark} theme={theme} />
          <StatRow label="Line Ups" value={stats.games.lineups} isDark={isDark} theme={theme} />
          <StatRow label="Total Minutes" value={stats.games.minutes} isLast isDark={isDark} theme={theme} />
        </StatSection>

        {/* Goals Section */}
        <StatSection title="GOALS" isDark={isDark} theme={theme}>
          <StatRow label="Goals Scored" value={stats.goals.total} isDark={isDark} theme={theme} />
          <StatRow label="Assists" value={stats.goals.assists} isDark={isDark} theme={theme} />
          <StatRow label="Goals Canceled" value={stats.goals.conceded} isDark={isDark} theme={theme} />
          <StatRow label="Saves" value={stats.goals.saves} isLast isDark={isDark} theme={theme} />
        </StatSection>

        {/* Passes Section */}
        <StatSection title="PASSES" isDark={isDark} theme={theme}>
          <StatRow label="Total Passes" value={stats.passes.total} isLast isDark={isDark} theme={theme} />
        </StatSection>

        {/* Penalty Section */}
        <StatSection title="PENALTY" isDark={isDark} theme={theme}>
          <StatRow label="Penalties Missed" value={stats.penalty.missed} isDark={isDark} theme={theme} />
          <StatRow label="Penalties Saved" value={stats.penalty.saved} isDark={isDark} theme={theme} />
          <StatRow label="Penalties Scored" value={stats.penalty.scored} isLast isDark={isDark} theme={theme} />
        </StatSection>

        {/* Substitutes Section */}
        <StatSection title="SUBSTITUTES" isDark={isDark} theme={theme}>
          <StatRow label="On Bench" value={stats.substitutes.bench} isDark={isDark} theme={theme} />
          <StatRow label="Out" value={stats.substitutes.out} isDark={isDark} theme={theme} />
          <StatRow label="In" value={stats.substitutes.in} isLast isDark={isDark} theme={theme} />
        </StatSection>

        {/* Tackles Section */}
        <StatSection title="TACKLES" isDark={isDark} theme={theme}>
          <StatRow label="Total Tackles" value={stats.tackles.total} isLast isDark={isDark} theme={theme} />
        </StatSection>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    padding: 8,
  },
  headerSpacer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  playerHeader: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  playerPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1A253D',
    marginBottom: 16,
  },
  playerName: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 24,
    color: '#ffffff',
    marginBottom: 8,
  },
  teamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  teamName: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
    color: '#ffffff',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 15,
    color: '#ffffff',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  infoGridContainer: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#1A253D',
    borderRadius: 5,
    padding: 12,
  },
  infoGrid: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoCardWrapper: {
    flex: 1,
  },
  bottomSpacer: {
    height: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Montserrat_500Medium',
    marginTop: 16,
  },
});

