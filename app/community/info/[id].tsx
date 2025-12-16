import { Ionicons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  FlatList,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCommunityInfo } from '@/hooks/useChat';
import { Moderator, Member, LeaderboardEntry } from '@/types/chat';

const Tab = createMaterialTopTabNavigator();

// ============ ABOUT TAB ============
function AboutTab({ communityId }: { communityId: string }) {
  const { communityInfo } = useCommunityInfo(communityId);

  if (!communityInfo) {
    return (
      <View style={styles.tabContainer}>
        <Text style={styles.errorText}>Community not found</Text>
      </View>
    );
  }

  const renderModerator = (mod: Moderator) => (
    <View key={mod.id} style={styles.moderatorRow}>
      <Image source={{ uri: mod.avatar }} style={styles.moderatorAvatar} />
      <View style={styles.moderatorInfo}>
        <Text style={styles.moderatorName}>{mod.name.toUpperCase()}</Text>
        <Text
          style={[
            styles.moderatorRole,
            mod.role === 'Admin' ? styles.adminRole : styles.modRole,
          ]}
        >
          {mod.role}
        </Text>
      </View>
    </View>
  );

  const renderRule = (rule: string, index: number) => {
    const isLast = index === communityInfo.rules.length - 1;
    return (
      <View key={index} style={[styles.ruleRow, isLast && styles.ruleRowLast]}>
        <View style={styles.ruleIcon}>
          <Ionicons name="shield-checkmark" size={22} color="#22c55e" />
        </View>
        <Text style={styles.ruleText}>{rule}</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.tabContainer} showsVerticalScrollIndicator={false}>
      {/* Community Card */}
      <View style={styles.communityCard}>
        <View style={styles.communityLogoContainer}>
          <Image source={{ uri: communityInfo.logo }} style={styles.communityLogo} />
        </View>
        <Text style={styles.communityName}>{communityInfo.name}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={16} color="#4ade80" />
          <Text style={styles.locationText}>{communityInfo.location}</Text>
          <Text style={styles.memberCountText}>{communityInfo.memberCount}</Text>
        </View>

        {/* About Section */}
        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>ABOUT</Text>
          <Text style={styles.descriptionText}>{communityInfo.description}</Text>
        </View>
      </View>

      {/* Moderators */}
      <Text style={styles.sectionHeader}>MODERATORS</Text>
      <View style={styles.moderatorsCard}>
        {communityInfo.moderators.map(renderModerator)}
      </View>

      {/* Rules */}
      <Text style={styles.sectionHeader}>RULES</Text>
      <View style={styles.rulesCard}>
        {communityInfo.rules.map(renderRule)}
      </View>

      {/* Browse Communities Button */}
      <TouchableOpacity style={styles.browseButton}>
        <Text style={styles.browseButtonText}>BROWSE COMMUNITIES</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ============ MEMBERS TAB ============
function MembersTab({ communityId }: { communityId: string }) {
  const { communityInfo } = useCommunityInfo(communityId);

  if (!communityInfo) {
    return (
      <View style={styles.tabContainer}>
        <Text style={styles.errorText}>Community not found</Text>
      </View>
    );
  }

  const renderMember = ({ item }: { item: Member }) => (
    <View style={styles.memberRow}>
      <Image source={{ uri: item.avatar }} style={styles.memberAvatar} />
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.name.toUpperCase()}</Text>
        <Text style={styles.memberPoints}>{item.points.toLocaleString()} POINTS</Text>
      </View>
    </View>
  );

  return (
    <FlatList
      style={styles.tabContainer}
      data={communityInfo.members}
      keyExtractor={(item) => item.id}
      renderItem={renderMember}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
}

// ============ LEADERBOARD TAB ============
function LeaderboardTab({ communityId }: { communityId: string }) {
  const { communityInfo } = useCommunityInfo(communityId);

  if (!communityInfo) {
    return (
      <View style={styles.tabContainer}>
        <Text style={styles.errorText}>Community not found</Text>
      </View>
    );
  }

  const renderLeaderboardEntry = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const isLast = index === communityInfo.leaderboard.length - 1;
    
    return (
      <View style={[styles.leaderboardRow, isLast && styles.lastRow]}>
        <Text style={styles.rankText}>#{item.rank}</Text>
        <Image source={{ uri: item.avatar }} style={styles.leaderboardAvatar} />
        <Text style={styles.leaderboardName}>{item.name}</Text>
        <Text style={styles.leaderboardPoints}>{item.points.toLocaleString()}</Text>
      </View>
    );
  };

  return (
    <View style={styles.tabContainer}>
      <View style={styles.leaderboardCard}>
        {/* Header */}
        <View style={styles.leaderboardHeader}>
          <Text style={styles.headerRank}>Rank</Text>
          <Text style={styles.headerName}>Name</Text>
          <Text style={styles.headerPoints}>Points</Text>
        </View>

        {/* Leaderboard List */}
        <FlatList
          data={communityInfo.leaderboard}
          keyExtractor={(item) => item.id}
          renderItem={renderLeaderboardEntry}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          }
        />
      </View>
    </View>
  );
}

// ============ MAIN SCREEN ============
export default function CommunityInfoScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const handleBack = () => {
    router.back();
  };

  const handleQRCode = () => {
    router.push({
      pathname: '/community/qr/[id]',
      params: { id },
    });
  };

  return (
    <View style={[styles.screenBackground, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>COMMUNITY</Text>

        <TouchableOpacity onPress={handleQRCode} style={styles.qrButton}>
          <Ionicons name="qr-code" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tabs - Order: ABOUT, MEMBERS, LEADERBOARD */}
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: styles.tabBar,
          tabBarIndicatorStyle: styles.tabIndicator,
          tabBarLabelStyle: styles.tabLabel,
          tabBarActiveTintColor: '#fff',
          tabBarInactiveTintColor: '#6b7280',
          tabBarPressColor: 'transparent',
        }}
      >
        <Tab.Screen name="ABOUT">
          {() => <AboutTab communityId={id} />}
        </Tab.Screen>
        <Tab.Screen name="MEMBERS">
          {() => <MembersTab communityId={id} />}
        </Tab.Screen>
        <Tab.Screen name="LEADERBOARD">
          {() => <LeaderboardTab communityId={id} />}
        </Tab.Screen>
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  screenBackground: {
    flex: 1,
    backgroundColor: '#080C17',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#111828',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
    color: '#fff',
    letterSpacing: 1,
  },
  qrButton: {
    padding: 4,
  },
  tabBar: {
    backgroundColor: '#111828',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0,
  },
  tabIndicator: {
    backgroundColor: '#22c55e',
    height: 3,
    borderRadius: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tabContainer: {
    flex: 1,
    backgroundColor: '#080C17',
  },
  listContent: {
    padding: 16,
  },
  errorText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },

  // About Tab Styles
  communityCard: {
    backgroundColor: '#080C17',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#182443',
    padding: 20,
    margin: 16,
    alignItems: 'center',
  },
  communityLogoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  communityLogo: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  communityName: {
    fontSize: 22,
    fontFamily: 'Montserrat_700Bold',
    color: '#fff',
    letterSpacing: 1,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#4ade80',
    fontFamily: 'Inter_400Regular',
  },
  memberCountText: {
    fontSize: 14,
    color: '#38bdf8',
    fontFamily: 'Inter_400Regular',
  },
  aboutSection: {
    marginTop: 20,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Montserrat_500Medium',
    color: '#445E99',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#9ca3af',
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
  },
  sectionHeader: {
    fontSize: 15,
    fontFamily: 'Montserrat_500Medium',
    color: '#445E99',
    letterSpacing: 0.5,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  moderatorsCard: {
    backgroundColor: '#111828',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#263556',
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  moderatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#263556',
  },
  moderatorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  moderatorInfo: {
    marginLeft: 14,
  },
  moderatorName: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  moderatorRole: {
    fontSize: 12,
    fontFamily: 'Montserrat_500Medium',
    marginTop: 2,
  },
  adminRole: {
    color: '#f87171',
  },
  modRole: {
    color: '#FF942A',
  },
  rulesCard: {
    backgroundColor: '#111828',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#263556',
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#263556',
  },
  ruleRowLast: {
    borderBottomWidth: 0,
  },
  ruleIcon: {
    marginRight: 12,
  },
  ruleText: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    fontFamily: 'Inter_400Regular',
  },
  browseButton: {
    backgroundColor: '#111828',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#263556',
  },
  browseButtonText: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: '#fff',
    letterSpacing: 1,
  },

  // Members Tab Styles
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  memberInfo: {
    marginLeft: 14,
  },
  memberName: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  memberPoints: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },

  // Leaderboard Tab Styles
  leaderboardCard: {
    flex: 1,
    backgroundColor: '#080C17',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#182443',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  leaderboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#182443',
  },
  headerRank: {
    width: 50,
    fontSize: 13,
    color: '#202D4B',
    fontFamily: 'Montserrat_400Regular',
  },
  headerName: {
    flex: 1,
    fontSize: 13,
    color: '#202D4B',
    fontFamily: 'Montserrat_400Regular',
    marginLeft: 44,
  },
  headerPoints: {
    fontSize: 13,
    color: '#202D4B',
    fontFamily: 'Montserrat_400Regular',
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#182443',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  rankText: {
    width: 50,
    fontSize: 13,
    color: '#fff',
    fontFamily: 'Montserrat_700Bold',
  },
  leaderboardAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  leaderboardName: {
    flex: 1,
    fontSize: 13,
    color: '#fff',
    fontFamily: 'Montserrat_500Medium',
    marginLeft: 12,
  },
  leaderboardPoints: {
    fontSize: 15,
    color: '#fff',
    fontFamily: 'Montserrat_700Bold',
  },
  viewAllButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#182443',
  },
  viewAllText: {
    fontSize: 14,
    color: '#9ca3af',
    fontFamily: 'Inter_400Regular',
  },
});
