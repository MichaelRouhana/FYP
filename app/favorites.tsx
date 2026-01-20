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
import { useFavorites } from '@/hooks/useFavorites';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useProfile } from '@/hooks/useProfile';

type TabType = 'matches' | 'players' | 'teams' | 'competitions';
type FavoriteType = 'match' | 'player' | 'team' | 'competition';

const TAB_LABELS: Record<TabType, string> = {
  matches: 'MATCHES',
  players: 'PLAYERS',
  teams: 'TEAMS',
  competitions: 'COMPETITIONS',
};

// Map tab type to favorite type
const TAB_TO_FAVORITE_TYPE: Record<TabType, FavoriteType> = {
  matches: 'match',
  players: 'player',
  teams: 'team',
  competitions: 'competition',
};

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('matches');
  const { loading, getFavorites, isFavorite, toggleFavorite } = useFavorites();
  const { user } = useProfile();
  const isAdmin = user?.roles?.includes('ADMIN') || user?.roles?.includes('admin') || false;

  const favoriteType = TAB_TO_FAVORITE_TYPE[activeTab];
  const currentFavorites = getFavorites(favoriteType);

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

  const renderMatchItem = (item: any) => {
    // Parse the stored match data
    const match = item;
    const isFav = isFavorite('match', match.id);
    const isHot = match.betsCount >= 100;
    const status = match.status || 'upcoming';
    const statusShort = match.statusShort || '';
    
    // Format time
    let timeDisplay = 'TBD';
    let scheduledTime = '';
    if (match.date) {
      const date = new Date(match.date);
      timeDisplay = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
      scheduledTime = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    return (
      <TouchableOpacity
        key={match.id}
        style={[styles.matchItem, { borderBottomColor: theme.colors.separator }]}
        onPress={() => router.push({ pathname: '/match/[id]', params: { id: String(match.id) } })}
        activeOpacity={0.7}
      >
        {/* Time / Live indicator */}
        <View style={styles.matchTimeContainer}>
          {status === 'live' ? (
            <View style={{ alignItems: 'center' }}>
              <View style={[styles.liveIndicator, { backgroundColor: isDark ? '#1f2937' : '#18223A' }]}>
                <Text style={[styles.liveText, { color: '#ffffff' }]}>LIVE</Text>
              </View>
            </View>
          ) : status === 'finished' ? (
            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.matchTime, { color: theme.colors.textSecondary, fontWeight: '600' }]}>FT</Text>
              {scheduledTime && (
                <Text style={[styles.scheduledTime, { color: theme.colors.textMuted, fontSize: 11, marginTop: 2 }]}>
                  {scheduledTime}
                </Text>
              )}
            </View>
          ) : (
            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.matchTime, { color: theme.colors.textSecondary }]}>{timeDisplay}</Text>
              {statusShort === 'PST' && (
                <Text style={{ color: '#ef4444', fontSize: 10, marginTop: 2 }}>Postponed</Text>
              )}
            </View>
          )}
        </View>

        {/* Teams */}
        <View style={styles.teamsContainer}>
          <View style={styles.teamRow}>
            {match.homeTeam?.logo ? (
              <Image source={{ uri: match.homeTeam.logo }} style={styles.teamLogo} />
            ) : (
              <View style={[styles.teamLogo, { backgroundColor: theme.colors.textMuted }]} />
            )}
            <Text style={[styles.teamName, { color: theme.colors.text }]} numberOfLines={1}>
              {match.homeTeam?.name || 'Home Team'}
            </Text>
            {(status === 'live' || status === 'finished') && match.goals?.home !== undefined && (
              <Text style={[styles.scoreText, { color: theme.colors.text }]}>{match.goals.home}</Text>
            )}
          </View>
          <View style={styles.teamRow}>
            {match.awayTeam?.logo ? (
              <Image source={{ uri: match.awayTeam.logo }} style={styles.teamLogo} />
            ) : (
              <View style={[styles.teamLogo, { backgroundColor: theme.colors.textMuted }]} />
            )}
            <Text style={[styles.teamName, { color: theme.colors.text }]} numberOfLines={1}>
              {match.awayTeam?.name || 'Away Team'}
            </Text>
            {(status === 'live' || status === 'finished') && match.goals?.away !== undefined && (
              <Text style={[styles.scoreText, { color: theme.colors.text }]}>{match.goals.away}</Text>
            )}
          </View>
        </View>

        {/* Bets */}
        {match.betsCount !== undefined && (
          <View style={[
            styles.betsContainer, 
            isHot && [
              styles.betsContainerHot, 
              { 
                backgroundColor: isDark ? '#111828' : '#FFF04E',
                borderColor: isDark ? '#FFF04E' : '#FFF04E'
              }
            ]
          ]}>
            {isHot && (
              <MaterialCommunityIcons name="fire" size={16} color={isDark ? '#FFF04E' : '#18223A'} />
            )}
            <Text style={[
              styles.betsText, 
              { color: theme.colors.textSecondary }, 
              isHot && [styles.betsTextHot, { color: isDark ? '#FFF04E' : '#18223A' }]
            ]}>
              {match.betsCount || 0} BETS
            </Text>
          </View>
        )}

        {/* Favorite */}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => toggleFavorite('match', match)}
        >
          <MaterialCommunityIcons
            name={isFav ? 'star' : 'star-outline'}
            size={24}
            color={isFav ? theme.colors.primary : theme.colors.iconMuted}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

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
                {typeof item.team === 'string' ? item.team : item.team.name || 'Unknown Team'}
              </Text>
            )}
          </View>
        </View>
        <Ionicons name="star" size={24} color="#16a34a" />
      </View>
    </TouchableOpacity>
  );

  const renderTeamItem = (item: any) => {
    const isFav = isFavorite('team', item.id);
    
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.resultCard, {
          backgroundColor: isDark ? '#111828' : '#FFFFFF',
          borderWidth: isDark ? 0 : 1,
          borderColor: theme.colors.border
        }]}
        onPress={() => router.push(`/team/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={[styles.resultImage, { backgroundColor: isDark ? '#1f2937' : '#E5E7EB' }, styles.resultImageCircular]}>
          {item.imageUrl || item.logo ? (
            <Image
              source={{ uri: item.imageUrl || item.logo }}
              style={[styles.resultImageInner, styles.resultImageCircular]}
              resizeMode="contain"
            />
          ) : (
            <Text style={{ color: theme.colors.text }}>?</Text>
          )}
        </View>

        <View style={styles.resultInfo}>
          <Text style={[styles.resultTitle, { color: theme.colors.text }]}>
            {item.name || 'Unknown Team'}
          </Text>
          <Text style={[styles.resultSubtitle, { color: theme.colors.textSecondary }]}>
            Team
          </Text>
        </View>

        <TouchableOpacity 
          onPress={(e) => {
            e.stopPropagation();
            toggleFavorite('team', item);
          }} 
          style={styles.favoriteButton}
        >
          <MaterialCommunityIcons
            name={isFav ? 'star' : 'star-outline'}
            size={24}
            color={isFav ? theme.colors.primary : theme.colors.iconMuted}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderCompetitionItem = (item: any) => {
    const isFav = isFavorite('competition', item.id);
    
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.itemCard, { backgroundColor: theme.colors.cardBackground }]}
        onPress={() => router.push(`/competition/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.itemContent}>
          <View style={styles.competitionInfo}>
            {(item.logo || item.imageUrl) && (
              <Image source={{ uri: item.logo || item.imageUrl }} style={styles.competitionLogo} />
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
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              toggleFavorite('competition', item);
            }}
            style={styles.favoriteButton}
          >
            <MaterialCommunityIcons
              name={isFav ? 'star' : 'star-outline'}
              size={24}
              color={isFav ? theme.colors.primary : theme.colors.iconMuted}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

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
          contentContainerStyle={activeTab === 'matches' ? styles.matchesContentContainer : styles.contentContainer}
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
    gap: 12,
  },
  matchesContentContainer: {
    // No padding for matches to match home page
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
  // Match Item Styles (matching home page)
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  matchTimeContainer: {
    width: 50,
    alignItems: 'center',
  },
  matchTime: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: '#ACB1BD',
    textAlign: 'center',
  },
  scheduledTime: {
    fontSize: 11,
    fontFamily: 'Montserrat_400Regular',
    color: '#ACB1BD',
    textAlign: 'center',
  },
  liveIndicator: {
    backgroundColor: '#1f2937',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  liveText: {
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  teamsContainer: {
    flex: 1,
    marginLeft: 16,
    gap: 4,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamLogo: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#374151',
  },
  teamName: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: '#ffffff',
  },
  scoreText: {
    fontSize: 13,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
    marginLeft: 8,
  },
  betsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 2,
    marginLeft: 12,
  },
  betsContainerHot: {
    backgroundColor: '#111828',
    borderWidth: 1,
    borderColor: '#FFF04E',
    borderRadius: 3,
  },
  betsText: {
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#9ca3af',
  },
  betsTextHot: {
    color: '#FFF04E',
    fontSize: 11,
    fontFamily: 'Montserrat_800ExtraBold',
  },
  favoriteButton: {
    padding: 8,
    marginLeft: 8,
  },
  // Legacy styles for other item types
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
  // Search-style result card (for teams)
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 5,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  resultImage: {
    width: 48,
    height: 48,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  resultImageCircular: {
    borderRadius: 24,
  },
  resultImageInner: {
    width: '100%',
    height: '100%',
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
  },
  resultSubtitle: {
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
    marginTop: 2,
  },
});

