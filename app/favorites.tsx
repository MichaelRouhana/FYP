import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { useFavorites, FavoriteType } from '@/hooks/useFavorites';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';

type TabType = 'matches' | 'players' | 'teams' | 'competitions';

const TAB_LABELS: Record<TabType, string> = {
  matches: 'MATCHES',
  players: 'PLAYERS',
  teams: 'TEAMS',
  competitions: 'COMPETITIONS',
};

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('matches');
  const { favorites, loading, getFavorites } = useFavorites();

  const currentFavorites = getFavorites(activeTab);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="star-outline"
        size={64}
        color={theme.colors.textSecondary}
      />
      <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
        No favorite {TAB_LABELS[activeTab]} yet.
      </Text>
    </View>
  );

  const renderMatchItem = (item: any) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.itemCard, { backgroundColor: theme.colors.cardBackground }]}
      onPress={() => router.push(`/match/${item.id}`)}
    >
      <View style={styles.itemContent}>
        <View style={styles.matchInfo}>
          <Text style={[styles.matchTime, { color: theme.colors.textSecondary }]}>
            {item.date ? new Date(item.date).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            }) : 'TBD'}
          </Text>
          <View style={styles.teamsContainer}>
            <View style={styles.teamRow}>
              {item.homeTeam?.logo && (
                <Image
                  source={{ uri: item.homeTeam.logo }}
                  style={styles.teamLogo}
                />
              )}
              <Text style={[styles.teamName, { color: theme.colors.text }]} numberOfLines={1}>
                {item.homeTeam?.name || 'Home Team'}
              </Text>
              {item.goals?.home !== undefined && (
                <Text style={[styles.score, { color: theme.colors.text }]}>
                  {item.goals.home}
                </Text>
              )}
            </View>
            <View style={styles.teamRow}>
              {item.awayTeam?.logo && (
                <Image
                  source={{ uri: item.awayTeam.logo }}
                  style={styles.teamLogo}
                />
              )}
              <Text style={[styles.teamName, { color: theme.colors.text }]} numberOfLines={1}>
                {item.awayTeam?.name || 'Away Team'}
              </Text>
              {item.goals?.away !== undefined && (
                <Text style={[styles.score, { color: theme.colors.text }]}>
                  {item.goals.away}
                </Text>
              )}
            </View>
          </View>
          {item.league && (
            <Text style={[styles.leagueName, { color: theme.colors.textSecondary }]}>
              {item.league.name}
            </Text>
          )}
        </View>
        <Ionicons name="star" size={24} color="#16a34a" />
      </View>
    </TouchableOpacity>
  );

  const renderPlayerItem = (item: any) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.itemCard, { backgroundColor: theme.colors.cardBackground }]}
      onPress={() => router.push(`/player/${item.id}`)}
    >
      <View style={styles.itemContent}>
        <View style={styles.playerInfo}>
          {item.photo ? (
            <Image source={{ uri: item.photo }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.avatarText}>
                {item.name?.charAt(0)?.toUpperCase() || 'P'}
              </Text>
            </View>
          )}
          <View style={styles.playerDetails}>
            <Text style={[styles.playerName, { color: theme.colors.text }]}>
              {item.name || 'Unknown Player'}
            </Text>
            <Text style={[styles.playerPosition, { color: theme.colors.textSecondary }]}>
              {item.position || 'Player'}
            </Text>
            {item.team && (
              <Text style={[styles.playerTeam, { color: theme.colors.textSecondary }]}>
                {item.team}
              </Text>
            )}
          </View>
        </View>
        <Ionicons name="star" size={24} color="#16a34a" />
      </View>
    </TouchableOpacity>
  );

  const renderTeamItem = (item: any) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.itemCard, { backgroundColor: theme.colors.cardBackground }]}
    >
      <View style={styles.itemContent}>
        <View style={styles.teamInfo}>
          {item.logo && (
            <Image source={{ uri: item.logo }} style={styles.teamLogoLarge} />
          )}
          <View style={styles.teamDetails}>
            <Text style={[styles.teamNameLarge, { color: theme.colors.text }]}>
              {item.name || 'Unknown Team'}
            </Text>
            {item.country && (
              <Text style={[styles.teamCountry, { color: theme.colors.textSecondary }]}>
                {item.country}
              </Text>
            )}
          </View>
        </View>
        <Ionicons name="star" size={24} color="#16a34a" />
      </View>
    </TouchableOpacity>
  );

  const renderCompetitionItem = (item: any) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.itemCard, { backgroundColor: theme.colors.cardBackground }]}
    >
      <View style={styles.itemContent}>
        <View style={styles.competitionInfo}>
          {item.logo && (
            <Image source={{ uri: item.logo }} style={styles.competitionLogo} />
          )}
          <View style={styles.competitionDetails}>
            <Text style={[styles.competitionName, { color: theme.colors.text }]}>
              {item.name || 'Unknown Competition'}
            </Text>
            {item.country && (
              <Text style={[styles.competitionCountry, { color: theme.colors.textSecondary }]}>
                {item.country}
            </Text>
            )}
          </View>
        </View>
        <Ionicons name="star" size={24} color="#16a34a" />
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    if (currentFavorites.length === 0) {
      return renderEmptyState();
    }

    switch (activeTab) {
      case 'matches':
        return currentFavorites.map(renderMatchItem);
      case 'players':
        return currentFavorites.map(renderPlayerItem);
      case 'teams':
        return currentFavorites.map(renderTeamItem);
      case 'competitions':
        return currentFavorites.map(renderCompetitionItem);
      default:
        return renderEmptyState();
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.headerBackground }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.icon} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            FAVORITES
          </Text>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => router.push('/search')}
          >
            <Ionicons name="search" size={24} color={theme.colors.icon} />
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={[styles.tabContainer, { backgroundColor: theme.colors.headerBackground }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}
          >
            {(Object.keys(TAB_LABELS) as TabType[]).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tab,
                    isActive && [styles.tabActive, { borderBottomColor: theme.colors.primary }],
                  ]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: theme.colors.textSecondary },
                      isActive && [styles.tabTextActive, { color: theme.colors.text }],
                    ]}
                  >
                    {TAB_LABELS[tab]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {renderContent()}
        </ScrollView>
      </View>
    </>
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 1,
  },
  searchButton: {
    padding: 8,
  },
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabsContent: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    letterSpacing: 0.5,
  },
  tabTextActive: {
    fontFamily: 'Montserrat_700Bold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Montserrat_500Medium',
    marginTop: 16,
    textAlign: 'center',
  },
  itemCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  matchInfo: {
    flex: 1,
  },
  matchTime: {
    fontSize: 12,
    fontFamily: 'Montserrat_500Medium',
    marginBottom: 8,
  },
  teamsContainer: {
    marginBottom: 8,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  teamLogo: {
    width: 24,
    height: 24,
    marginRight: 8,
    borderRadius: 12,
  },
  teamName: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    marginRight: 8,
  },
  score: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    minWidth: 24,
    textAlign: 'right',
  },
  leagueName: {
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
    marginTop: 4,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Montserrat_700Bold',
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
    marginBottom: 4,
  },
  playerPosition: {
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
    marginBottom: 2,
  },
  playerTeam: {
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  teamLogoLarge: {
    width: 50,
    height: 50,
    marginRight: 12,
  },
  teamDetails: {
    flex: 1,
  },
  teamNameLarge: {
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
    marginBottom: 4,
  },
  teamCountry: {
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
  },
  competitionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  competitionLogo: {
    width: 50,
    height: 50,
    marginRight: 12,
  },
  competitionDetails: {
    flex: 1,
  },
  competitionName: {
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
    marginBottom: 4,
  },
  competitionCountry: {
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
  },
});

