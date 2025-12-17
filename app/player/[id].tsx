import { InfoCard, StatRow, StatSection } from '@/components/player';
import { useTheme } from '@/context/ThemeContext';
import { getPlayerData } from '@/mock/playerData';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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
  const playerId = typeof id === 'string' ? id : 'default';
  const [isFavorite, setIsFavorite] = useState(false);
  
  const playerData = getPlayerData(playerId);
  const { player, statistics } = playerData;
  const stats = statistics[0]; // Get first season stats

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
          onPress={() => setIsFavorite(!isFavorite)}
        >
          <MaterialCommunityIcons 
            name={isFavorite ? "star" : "star-outline"} 
            size={24} 
            color={isFavorite ? theme.colors.primary : theme.colors.icon} 
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
});

