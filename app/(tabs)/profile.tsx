import { Ionicons, Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/context/ThemeContext';
import { useProfile } from '@/hooks/useProfile';
import { FavoriteTeam, UserCommunity } from '@/types/profile';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, favoriteTeams, communities, predictions } = useProfile();
  const { theme, isDark, toggleTheme } = useTheme();

  const handleAddTeam = () => {
    router.push('/community/qr/browse');
  };

  const handleViewCommunity = (communityId: string) => {
    // Non-functional for now
  };

  const handleBrowseCommunities = () => {
    // Non-functional for now
  };

  const handleEmailPress = () => {
    // Non-functional for now
  };

  const handlePasswordPress = () => {
    // Non-functional for now
  };

  const renderTeamChip = (team: FavoriteTeam) => (
    <View key={team.id} style={styles.teamChip}>
      <Text style={styles.teamChipText}>{team.name}</Text>
    </View>
  );

  const renderCommunityCard = (community: UserCommunity) => (
    <View key={community.id} style={styles.communityCard}>
      <View style={styles.communityInfo}>
        <Text style={styles.communityName}>{community.name}</Text>
        <Text style={styles.communityMembers}>{community.memberCount}</Text>
      </View>

      <View style={styles.communityStats}>
        <Text style={styles.communityRank}>#{community.rank}</Text>
        <Text style={styles.communityRankLabel}>Rank</Text>
      </View>

      <View style={styles.communityStats}>
        <Text style={styles.communityPoints}>{community.points.toLocaleString()}</Text>
        <Text style={styles.communityPointsLabel}>Points</Text>
      </View>

      <TouchableOpacity
        style={styles.viewButton}
        onPress={() => handleViewCommunity(community.id)}
      >
        <Text style={styles.viewButtonText}>VIEW</Text>
        <Ionicons name="chevron-forward" size={16} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PROFILE</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Section */}
        <View style={styles.userSection}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: user.avatar }}
              style={styles.avatar}
              defaultSource={require('@/assets/images/icon.png')}
            />
          </View>

          {/* Name */}
          <Text style={styles.userName}>{user.name}</Text>

          {/* Username, Points, Location */}
          <View style={styles.userMeta}>
            <Text style={styles.username}>{user.username}</Text>
            <Text style={styles.userPoints}>{user.points.toLocaleString()} points</Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={14} color="#4ade80" />
              <Text style={styles.locationText}>{user.location}</Text>
            </View>
          </View>

          {/* Bio */}
          <Text style={styles.bio}>{user.bio}</Text>
        </View>

        {/* Favorite Teams */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FAVORITE TEAMS</Text>
          <View style={styles.teamsRow}>
            {favoriteTeams.map(renderTeamChip)}
            <TouchableOpacity style={styles.addTeamButton} onPress={handleAddTeam}>
              <Text style={styles.addTeamText}>+ Add Team</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* My Communities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MY COMMUNITIES</Text>
          {communities.map(renderCommunityCard)}

          {/* Browse Communities */}
          <TouchableOpacity
            style={styles.browseButton}
            onPress={handleBrowseCommunities}
          >
            <Text style={styles.browseButtonText}>BROWSE COMMUNITIES</Text>
          </TouchableOpacity>
        </View>

        {/* Predictions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PREDICTIONS</Text>
          <View style={styles.predictionsCard}>
            <View style={styles.predictionStat}>
              <Text style={styles.predictionValue}>{predictions.total}</Text>
              <Text style={styles.predictionLabel}>Total Predictions</Text>
            </View>
            <View style={styles.predictionStat}>
              <Text style={[styles.predictionValue, styles.correctValue]}>
                {predictions.correct}
              </Text>
              <Text style={styles.predictionLabel}>Correct</Text>
            </View>
            <View style={styles.predictionStat}>
              <Text style={[styles.predictionValue, styles.incorrectValue]}>
                {predictions.incorrect}
              </Text>
              <Text style={styles.predictionLabel}>Incorrect</Text>
            </View>
          </View>
        </View>

        {/* Account Settings */}
        <View style={[styles.settingsSection, { borderTopColor: theme.colors.separator }]}>
          {/* Theme Toggle */}
          <TouchableOpacity style={[styles.settingsRow, { borderBottomColor: theme.colors.separator }]} onPress={toggleTheme}>
            <View style={styles.themeToggleLeft}>
              <Feather 
                name={isDark ? "moon" : "sun"} 
                size={20} 
                color={isDark ? "#6366f1" : "#f59e0b"} 
              />
              <Text style={[styles.settingsLabel, { color: theme.colors.textSecondary, marginLeft: 12 }]}>
                {isDark ? 'Dark Mode' : 'Light Mode'}
              </Text>
            </View>
            <View style={[styles.themeToggleSwitch, { backgroundColor: isDark ? '#6366f1' : '#f59e0b' }]}>
              <Feather 
                name={isDark ? "moon" : "sun"} 
                size={14} 
                color="#ffffff" 
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingsRow, { borderBottomColor: theme.colors.separator }]} onPress={handleEmailPress}>
            <Text style={[styles.settingsLabel, { color: theme.colors.textSecondary }]}>Email</Text>
            <View style={styles.settingsValue}>
              <Text style={styles.settingsValueText}>{user.email}</Text>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingsRow, { borderBottomColor: theme.colors.separator }]} onPress={handlePasswordPress}>
            <Text style={[styles.settingsLabel, { color: theme.colors.textSecondary }]}>Password</Text>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080C17',
  },
  header: {
    backgroundColor: '#111828',
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#182443',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
    color: '#fff',
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },

  // User Section
  userSection: {
    paddingTop: 24,
    paddingBottom: 16,
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 16,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Montserrat_700Bold',
    color: '#fff',
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  username: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#6b7280',
  },
  userPoints: {
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
    color: '#fbbf24',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#4ade80',
  },
  bio: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#e5e7eb',
    lineHeight: 24,
  },

  // Section
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: '#fff',
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  // Teams
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  teamChip: {
    backgroundColor: '#22c55e',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  teamChipText: {
    fontSize: 13,
    fontFamily: 'Montserrat_700Bold',
    color: '#fff',
  },
  addTeamButton: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6b7280',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addTeamText: {
    fontSize: 13,
    fontFamily: 'Montserrat_500Medium',
    color: '#fff',
  },

  // Community Card
  communityCard: {
    backgroundColor: '#101828',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  communityInfo: {
    flex: 1,
  },
  communityName: {
    fontSize: 15,
    fontFamily: 'Montserrat_700Bold',
    color: '#fff',
    marginBottom: 2,
  },
  communityMembers: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#6b7280',
  },
  communityStats: {
    alignItems: 'center',
    marginHorizontal: 16,
  },
  communityRank: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    color: '#22c55e',
  },
  communityRankLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: '#6b7280',
    marginTop: 2,
  },
  communityPoints: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    color: '#fff',
  },
  communityPointsLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: '#6b7280',
    marginTop: 2,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  viewButtonText: {
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
    color: '#fff',
  },

  // Browse Button
  browseButton: {
    backgroundColor: '#080C17',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#101828',
    paddingVertical: 16,
    alignItems: 'center',
  },
  browseButtonText: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: '#fff',
    letterSpacing: 0.5,
  },

  // Predictions
  predictionsCard: {
    backgroundColor: '#101828',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  predictionStat: {
    alignItems: 'center',
  },
  predictionValue: {
    fontSize: 22,
    fontFamily: 'Montserrat_700Bold',
    color: '#fff',
    marginBottom: 4,
  },
  correctValue: {
    color: '#22c55e',
  },
  incorrectValue: {
    color: '#ef4444',
  },
  predictionLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#6b7280',
  },

  // Settings
  settingsSection: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  themeToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeToggleSwitch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsLabel: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#9ca3af',
  },
  settingsValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsValueText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#38bdf8',
  },
});
