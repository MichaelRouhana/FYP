// components/match/AdminMatchSettings.tsx
// Admin-only component for managing match settings

import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import {
  getMatchSettings,
  updateMatchSettings,
  getPredictionSettings,
  updatePredictionSettings,
  getMatchUsers,
} from '@/services/matchApi';
import { MatchSettings, MatchPredictionSettings, MatchUserStats } from '@/types/fixture';

interface AdminMatchSettingsProps {
  fixtureId: number;
}

export default function AdminMatchSettings({ fixtureId }: AdminMatchSettingsProps) {
  const { theme, isDark } = useTheme();
  const [settingsSubTab, setSettingsSubTab] = useState<'details' | 'predictions' | 'users'>('details');
  const [matchSettings, setMatchSettings] = useState<MatchSettings | null>(null);
  const [predictionSettings, setPredictionSettings] = useState<MatchPredictionSettings | null>(null);
  const [matchUsers, setMatchUsers] = useState<MatchUserStats[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Fetch settings data on mount
  useEffect(() => {
    fetchSettingsData();
  }, [fixtureId]);

  const fetchSettingsData = async () => {
    setSettingsLoading(true);
    try {
      const [settings, predSettings, users] = await Promise.all([
        getMatchSettings(fixtureId).catch(() => null),
        getPredictionSettings(fixtureId).catch(() => null),
        getMatchUsers(fixtureId).catch(() => []),
      ]);
      setMatchSettings(settings);
      setPredictionSettings(predSettings);
      setMatchUsers(users || []);
    } catch (error) {
      console.error('[AdminMatchSettings] Error fetching data:', error);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleMatchSettingToggle = async (field: keyof MatchSettings, value: boolean) => {
    // Optimistic update
    setMatchSettings(prev => prev ? { ...prev, [field]: value } : null);

    try {
      await updateMatchSettings(fixtureId, { [field]: value });
    } catch (error) {
      console.error('[AdminMatchSettings] Error updating match settings:', error);
      // Revert on error
      setMatchSettings(prev => prev ? { ...prev, [field]: !value } : null);
      Alert.alert('Error', 'Failed to update setting. Please try again.');
    }
  };

  const handlePredictionSettingToggle = async (field: keyof MatchPredictionSettings, value: boolean) => {
    // Optimistic update
    setPredictionSettings(prev => prev ? { ...prev, [field]: value } : null);

    try {
      await updatePredictionSettings(fixtureId, { [field]: value });
    } catch (error) {
      console.error('[AdminMatchSettings] Error updating prediction settings:', error);
      // Revert on error
      setPredictionSettings(prev => prev ? { ...prev, [field]: !value } : null);
      Alert.alert('Error', 'Failed to update setting. Please try again.');
    }
  };

  if (settingsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={isDark ? '#22c55e' : '#32A95D'} />
        <Text style={[styles.loadingText, { color: isDark ? '#9ca3af' : '#6B7280' }]}>
          Loading settings...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Sub-tab Navigation */}
      <View style={styles.subNav}>
        {(['details', 'predictions', 'users'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.subNavItem,
              settingsSubTab === tab && styles.subNavItemActive,
              { backgroundColor: settingsSubTab === tab ? (isDark ? '#1f2937' : '#E5E7EB') : 'transparent' },
            ]}
            onPress={() => setSettingsSubTab(tab)}
          >
            <Text
              style={[
                styles.subNavText,
                { color: settingsSubTab === tab ? (isDark ? '#22c55e' : '#32A95D') : (isDark ? '#9ca3af' : '#6B7280') },
              ]}
            >
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sub-tab Content */}
      {settingsSubTab === 'details' && (
        <View style={styles.content}>
          <View style={[styles.card, { backgroundColor: isDark ? '#111827' : '#FFFFFF', borderColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
            {/* Show Match */}
            <View style={styles.row}>
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: isDark ? '#F9FAFB' : '#18223A' }]}>
                  Show Match
                </Text>
                <Text style={[styles.rowDescription, { color: isDark ? '#9ca3af' : '#6B7280' }]}>
                  Make this match visible to public users
                </Text>
              </View>
              <Switch
                value={matchSettings?.showMatch ?? false}
                onValueChange={(value) => handleMatchSettingToggle('showMatch', value)}
                trackColor={{ false: isDark ? '#374151' : '#D1D5DB', true: '#22c55e' }}
                thumbColor="#ffffff"
              />
            </View>

            {/* Allow Betting */}
            <View style={[styles.row, styles.rowDivider, { borderBottomColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: isDark ? '#F9FAFB' : '#18223A' }]}>
                  Allow Betting
                </Text>
                <Text style={[styles.rowDescription, { color: isDark ? '#9ca3af' : '#6B7280' }]}>
                  Enable pre-match betting for this fixture
                </Text>
              </View>
              <Switch
                value={matchSettings?.allowBetting ?? false}
                onValueChange={(value) => handleMatchSettingToggle('allowBetting', value)}
                trackColor={{ false: isDark ? '#374151' : '#D1D5DB', true: '#22c55e' }}
                thumbColor="#ffffff"
              />
            </View>

            {/* Allow Betting Halftime */}
            <View style={[styles.row, styles.rowDivider, { borderBottomColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: isDark ? '#F9FAFB' : '#18223A' }]}>
                  Allow Betting Halftime
                </Text>
                <Text style={[styles.rowDescription, { color: isDark ? '#9ca3af' : '#6B7280' }]}>
                  Enable live/halftime betting for this fixture
                </Text>
              </View>
              <Switch
                value={matchSettings?.allowBettingHT ?? false}
                onValueChange={(value) => handleMatchSettingToggle('allowBettingHT', value)}
                trackColor={{ false: isDark ? '#374151' : '#D1D5DB', true: '#22c55e' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>
      )}

      {settingsSubTab === 'predictions' && (
        <View style={styles.content}>
          <View style={[styles.card, { backgroundColor: isDark ? '#111827' : '#FFFFFF', borderColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
            {/* Match Winner */}
            <View style={styles.row}>
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: isDark ? '#F9FAFB' : '#18223A' }]}>
                  Match Winner
                </Text>
                <Text style={[styles.rowDescription, { color: isDark ? '#9ca3af' : '#6B7280' }]}>
                  Enable match winner predictions
                </Text>
              </View>
              <Switch
                value={predictionSettings?.whoWillWin ?? true}
                onValueChange={(value) => handlePredictionSettingToggle('whoWillWin', value)}
                trackColor={{ false: isDark ? '#374151' : '#D1D5DB', true: '#22c55e' }}
                thumbColor="#ffffff"
              />
            </View>

            {/* Over/Under 2.5 */}
            <View style={[styles.row, styles.rowDivider, { borderBottomColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: isDark ? '#F9FAFB' : '#18223A' }]}>
                  Over/Under 2.5
                </Text>
                <Text style={[styles.rowDescription, { color: isDark ? '#9ca3af' : '#6B7280' }]}>
                  Enable over/under goals predictions
                </Text>
              </View>
              <Switch
                value={predictionSettings?.goalsOverUnder ?? true}
                onValueChange={(value) => handlePredictionSettingToggle('goalsOverUnder', value)}
                trackColor={{ false: isDark ? '#374151' : '#D1D5DB', true: '#22c55e' }}
                thumbColor="#ffffff"
              />
            </View>

            {/* Both Teams to Score */}
            <View style={[styles.row, styles.rowDivider, { borderBottomColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: isDark ? '#F9FAFB' : '#18223A' }]}>
                  Both Teams to Score
                </Text>
                <Text style={[styles.rowDescription, { color: isDark ? '#9ca3af' : '#6B7280' }]}>
                  Enable both teams to score predictions
                </Text>
              </View>
              <Switch
                value={predictionSettings?.bothTeamsScore ?? true}
                onValueChange={(value) => handlePredictionSettingToggle('bothTeamsScore', value)}
                trackColor={{ false: isDark ? '#374151' : '#D1D5DB', true: '#22c55e' }}
                thumbColor="#ffffff"
              />
            </View>

            {/* Double Chance */}
            <View style={[styles.row, styles.rowDivider, { borderBottomColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: isDark ? '#F9FAFB' : '#18223A' }]}>
                  Double Chance
                </Text>
                <Text style={[styles.rowDescription, { color: isDark ? '#9ca3af' : '#6B7280' }]}>
                  Enable double chance predictions
                </Text>
              </View>
              <Switch
                value={predictionSettings?.doubleChance ?? true}
                onValueChange={(value) => handlePredictionSettingToggle('doubleChance', value)}
                trackColor={{ false: isDark ? '#374151' : '#D1D5DB', true: '#22c55e' }}
                thumbColor="#ffffff"
              />
            </View>

            {/* Correct Score */}
            <View style={[styles.row, styles.rowDivider, { borderBottomColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: isDark ? '#F9FAFB' : '#18223A' }]}>
                  Correct Score
                </Text>
                <Text style={[styles.rowDescription, { color: isDark ? '#9ca3af' : '#6B7280' }]}>
                  Enable correct score predictions
                </Text>
              </View>
              <Switch
                value={predictionSettings?.scorePrediction ?? true}
                onValueChange={(value) => handlePredictionSettingToggle('scorePrediction', value)}
                trackColor={{ false: isDark ? '#374151' : '#D1D5DB', true: '#22c55e' }}
                thumbColor="#ffffff"
              />
            </View>

            {/* Half Time / Full Time */}
            <View style={[styles.row, styles.rowDivider, { borderBottomColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: isDark ? '#F9FAFB' : '#18223A' }]}>
                  Half Time / Full Time
                </Text>
                <Text style={[styles.rowDescription, { color: isDark ? '#9ca3af' : '#6B7280' }]}>
                  Enable half time / full time predictions
                </Text>
              </View>
              <Switch
                value={predictionSettings?.halfTimeFullTime ?? true}
                onValueChange={(value) => handlePredictionSettingToggle('halfTimeFullTime', value)}
                trackColor={{ false: isDark ? '#374151' : '#D1D5DB', true: '#22c55e' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>
      )}

      {settingsSubTab === 'users' && (
        <View style={styles.content}>
          {matchUsers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: isDark ? '#9ca3af' : '#6B7280' }]}>
                No active bets on this match
              </Text>
            </View>
          ) : (
            <FlatList
              data={matchUsers}
              keyExtractor={(item) => item.userId.toString()}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={[styles.userRow, { backgroundColor: isDark ? '#111827' : '#FFFFFF', borderColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
                  <Image
                    source={{ uri: item.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.username)}&background=3b82f6&color=fff&size=200` }}
                    style={styles.userAvatar}
                  />
                  <Text style={[styles.userName, { color: isDark ? '#F9FAFB' : '#18223A' }]}>
                    {item.username}
                  </Text>
                  <Text style={[styles.userWagered, { color: isDark ? '#F9FAFB' : '#18223A' }]}>
                    {item.totalWagered.toLocaleString()} pts
                  </Text>
                </View>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: isDark ? '#1f2937' : '#E5E7EB' }} />}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
    marginTop: 12,
  },
  subNav: {
    flexDirection: 'row',
    backgroundColor: '#030712',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  subNavItem: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  subNavItemActive: {
    // Active state handled by backgroundColor in component
  },
  subNavText: {
    fontSize: 13,
    fontFamily: 'Montserrat_600SemiBold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rowDivider: {
    borderBottomWidth: 1,
  },
  rowContent: {
    flex: 1,
    marginRight: 16,
  },
  rowTitle: {
    fontSize: 15,
    fontFamily: 'Montserrat_700Bold',
    marginBottom: 4,
  },
  rowDescription: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#1f2937',
  },
  userName: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Montserrat_600SemiBold',
  },
  userWagered: {
    fontSize: 15,
    fontFamily: 'Montserrat_700Bold',
  },
});

