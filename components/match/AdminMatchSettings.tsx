// components/match/AdminMatchSettings.tsx
// Admin-only component for managing match settings

import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
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
} from '@/services/matchApi';
import { MatchSettings, MatchPredictionSettings } from '@/types/fixture';

interface AdminMatchSettingsProps {
  fixtureId: number;
}

// All available bet types from MatchPredictionSettings interface
const SUPPORTED_BETS = [
  { key: 'whoWillWin', label: 'Match Winner' },
  { key: 'bothTeamsScore', label: 'Both Teams to Score' },
  { key: 'goalsOverUnder', label: 'Over/Under 2.5' },
  { key: 'doubleChance', label: 'Double Chance' },
  { key: 'firstTeamToScore', label: 'First Team to Score' },
  { key: 'scorePrediction', label: 'Correct Score' },
  { key: 'halfTimeFullTime', label: 'Half Time / Full Time' },
] as const;

export default function AdminMatchSettings({ fixtureId }: AdminMatchSettingsProps) {
  const { theme, isDark } = useTheme();
  const [settingsSubTab, setSettingsSubTab] = useState<'details' | 'predictions'>('details');
  const [matchSettings, setMatchSettings] = useState<MatchSettings | null>(null);
  const [predictionSettings, setPredictionSettings] = useState<MatchPredictionSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  // Track which settings are currently being updated to prevent double-clicks and rate limiting
  const [updatingKeys, setUpdatingKeys] = useState<Set<string>>(new Set());

  // Fetch settings data on mount
  useEffect(() => {
    fetchSettingsData();
  }, [fixtureId]);

  const fetchSettingsData = async () => {
    setSettingsLoading(true);
    try {
      const [settings, predSettings] = await Promise.all([
        getMatchSettings(fixtureId).catch(() => null),
        getPredictionSettings(fixtureId).catch(() => null),
      ]);
      setMatchSettings(settings);
      setPredictionSettings(predSettings);
    } catch (error) {
      console.error('[AdminMatchSettings] Error fetching data:', error);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleMatchSettingToggle = async (field: keyof MatchSettings, value: boolean) => {
    const key = `match_${field}`;
    
    // Prevent double-clicks and concurrent updates
    if (updatingKeys.has(key)) {
      console.log('[AdminMatchSettings] Update already in progress for:', key);
      return;
    }

    // Optimistic update
    setMatchSettings(prev => prev ? { ...prev, [field]: value } : null);
    
    // Mark as updating
    setUpdatingKeys(prev => new Set(prev).add(key));

    try {
      await updateMatchSettings(fixtureId, { [field]: value });
      console.log('[AdminMatchSettings] Successfully updated match setting:', field, '=', value);
    } catch (error: any) {
      console.error('[AdminMatchSettings] Error updating match settings:', error);
      
      // Revert on error
      setMatchSettings(prev => prev ? { ...prev, [field]: !value } : null);
      
      // Handle rate limiting specifically
      if (error.response?.status === 429) {
        Alert.alert(
          'Rate Limit Exceeded', 
          'Too many requests. Please wait a moment before trying again.'
        );
      } else {
        Alert.alert('Error', error.response?.data?.message || 'Failed to update setting. Please try again.');
      }
    } finally {
      // Remove from updating set
      setUpdatingKeys(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const handlePredictionSettingToggle = async (field: keyof MatchPredictionSettings, value: boolean) => {
    const key = `prediction_${field}`;
    
    // Prevent double-clicks and concurrent updates
    if (updatingKeys.has(key)) {
      console.log('[AdminMatchSettings] Update already in progress for:', key);
      return;
    }

    // Optimistic update
    setPredictionSettings(prev => prev ? { ...prev, [field]: value } : null);
    
    // Mark as updating
    setUpdatingKeys(prev => new Set(prev).add(key));

    try {
      await updatePredictionSettings(fixtureId, { [field]: value });
      console.log('[AdminMatchSettings] Successfully updated prediction setting:', field, '=', value);
    } catch (error: any) {
      console.error('[AdminMatchSettings] Error updating prediction settings:', error);
      
      // Revert on error
      setPredictionSettings(prev => prev ? { ...prev, [field]: !value } : null);
      
      // Handle rate limiting specifically
      if (error.response?.status === 429) {
        Alert.alert(
          'Rate Limit Exceeded', 
          'Too many requests. Please wait a moment before trying again.'
        );
      } else {
        Alert.alert('Error', error.response?.data?.message || 'Failed to update setting. Please try again.');
      }
    } finally {
      // Remove from updating set
      setUpdatingKeys(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
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
        {(['details', 'predictions'] as const).map((tab) => (
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
                disabled={updatingKeys.has('match_showMatch')}
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
                disabled={updatingKeys.has('match_allowBetting')}
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
                disabled={updatingKeys.has('match_allowBettingHT')}
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
            {SUPPORTED_BETS.map((bet, index) => {
              const isLast = index === SUPPORTED_BETS.length - 1;
              const settingKey = bet.key as keyof MatchPredictionSettings;
              const settingValue = predictionSettings?.[settingKey] ?? true;
              
              return (
                <View 
                  key={bet.key}
                  style={[
                    styles.row,
                    !isLast && styles.rowDivider,
                    !isLast && { borderBottomColor: isDark ? '#1f2937' : '#E5E7EB' }
                  ]}
                >
                  <View style={styles.rowContent}>
                    <Text style={[styles.rowTitle, { color: isDark ? '#F9FAFB' : '#18223A' }]}>
                      {bet.label}
                    </Text>
                    <Text style={[styles.rowDescription, { color: isDark ? '#9ca3af' : '#6B7280' }]}>
                      Enable {bet.label.toLowerCase()} predictions
                    </Text>
                  </View>
                  <Switch
                    value={settingValue}
                    onValueChange={(value) => handlePredictionSettingToggle(settingKey, value)}
                    disabled={updatingKeys.has(`prediction_${settingKey}`)}
                    trackColor={{ false: isDark ? '#374151' : '#D1D5DB', true: '#22c55e' }}
                    thumbColor="#ffffff"
                  />
                </View>
              );
            })}
          </View>
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
});

