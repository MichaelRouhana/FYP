import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  TextInput,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';

import { ActivityIndicator } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useProfile } from '@/hooks/useProfile';
import { FavoriteTeam, UserCommunity } from '@/types/profile';
import api from '@/services/api';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, favoriteTeams, communities, predictions, loading, error, fetchProfile } = useProfile();
  const { theme, isDark, toggleTheme } = useTheme();
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [aboutText, setAboutText] = useState(user.about || '');

  React.useEffect(() => {
    setAboutText(user.about || '');
  }, [user.about]);

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
    router.push('/settings/change-password');
  };

  const handleEditAbout = () => {
    setIsEditingAbout(true);
  };

  const handleSaveAbout = async () => {
    try {
      await api.patch('/users/profile', { about: aboutText });
      setIsEditingAbout(false);
      fetchProfile(); // Refresh profile data
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update about section');
    }
  };

  const handleCancelEditAbout = () => {
    setAboutText(user.about || '');
    setIsEditingAbout(false);
  };

  const handleAvatarPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            pickImage('camera');
          } else if (buttonIndex === 2) {
            pickImage('library');
          }
        }
      );
    } else {
      Alert.alert(
        'Select Photo',
        'Choose an option',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: () => pickImage('camera') },
          { text: 'Choose from Library', onPress: () => pickImage('library') },
        ]
      );
    }
  };

  const pickImage = async (source: 'camera' | 'library') => {
    try {
      let result;
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Camera permission is required');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Photo library permission is required');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadAvatar = async (imageUri: string) => {
    try {
      const formData = new FormData();
      const filename = imageUri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('file', {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      await api.post('/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Optimistic update - refresh profile
      fetchProfile();
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to upload avatar');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await SecureStore.deleteItemAsync('jwt_token');
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  const renderTeamChip = (team: FavoriteTeam) => (
    <View key={team.id} style={[styles.teamChip, { backgroundColor: theme.colors.primary }]}>
      <Text style={[styles.teamChipText, { color: theme.colors.primaryText }]}>{team.name}</Text>
    </View>
  );

  const renderCommunityCard = (community: UserCommunity) => (
    <View key={community.id} style={[styles.communityCard, { backgroundColor: theme.colors.cardBackground }]}>
      <View style={styles.communityInfo}>
        <Text style={[styles.communityName, { color: theme.colors.text }]}>{community.name}</Text>
        <Text style={[styles.communityMembers, { color: theme.colors.textSecondary }]}>{community.memberCount}</Text>
      </View>

      <View style={styles.communityStats}>
        <Text style={[styles.communityRank, { color: theme.colors.primary }]}>#{community.rank}</Text>
        <Text style={[styles.communityRankLabel, { color: theme.colors.textSecondary }]}>Rank</Text>
      </View>

      <View style={styles.communityStats}>
        <Text style={[styles.communityPoints, { color: theme.colors.text }]}>{community.points.toLocaleString()}</Text>
        <Text style={[styles.communityPointsLabel, { color: theme.colors.textSecondary }]}>Points</Text>
      </View>

      <TouchableOpacity
        // Fix: Use a light gray background ('#E5E7EB') in light mode instead of the dark border color
        style={[styles.viewButton, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]}
        onPress={() => handleViewCommunity(community.id)}
      >
        {/* Fix: Use dark text ('#111827') in light mode so it stands out against the light gray */}
        <Text style={[styles.viewButtonText, { color: isDark ? '#fff' : '#111827' }]}>VIEW</Text>
        <Ionicons name="chevron-forward" size={16} color={isDark ? '#fff' : '#111827'} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { 
        backgroundColor: theme.colors.headerBackground, 
        borderBottomColor: theme.colors.border 
      }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>PROFILE</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error || '#ef4444' }]}>
            {error}
          </Text>
        </View>
      ) : (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Section */}
        <View style={styles.userSection}>
          {/* Avatar with Edit Icon */}
          <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.8}>
            <View style={[styles.avatarContainer, { backgroundColor: theme.colors.cardBackground, borderWidth: 1, borderColor: theme.colors.border }]}>
              <Image
                source={{ uri: user.avatar || user.pfp || '' }}
                style={styles.avatar}
                defaultSource={require('@/assets/images/icon.png')}
              />
              <View style={[styles.editAvatarIcon, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name="pencil" size={14} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Name */}
          <Text style={[styles.userName, { color: theme.colors.text }]}>{user.name || user.username || 'User'}</Text>

          {/* Username, Points, Location */}
          <View style={styles.userMeta}>
            <Text style={[styles.username, { color: theme.colors.textSecondary }]}>{user.username || ''}</Text>
            <Text style={[styles.userPoints, { color: theme.colors.hot }]}>{user.points.toLocaleString()} points</Text>
            {user.country && (
              <View style={styles.locationContainer}>
                <Ionicons name="location-sharp" size={14} color={theme.colors.primary} />
                <Text style={[styles.locationText, { color: theme.colors.primary }]}>{user.country}</Text>
              </View>
            )}
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>ABOUT</Text>
            {!isEditingAbout && (
              <TouchableOpacity onPress={handleEditAbout} style={styles.editButton}>
                <Ionicons name="pencil" size={16} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
          </View>
          {isEditingAbout ? (
            <View>
              <TextInput
                style={[styles.aboutInput, { 
                  color: theme.colors.text, 
                  backgroundColor: theme.colors.cardBackground,
                  borderColor: theme.colors.border 
                }]}
                value={aboutText}
                onChangeText={setAboutText}
                multiline
                numberOfLines={4}
                placeholder="Tell us about yourself..."
                placeholderTextColor={theme.colors.textMuted}
              />
              <View style={styles.editActions}>
                <TouchableOpacity 
                  style={[styles.cancelButton, { borderColor: theme.colors.border }]}
                  onPress={handleCancelEditAbout}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleSaveAbout}
                >
                  <Text style={[styles.saveButtonText, { color: '#fff' }]}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={[styles.aboutText, { color: theme.colors.text }]}>
              {user.about || user.bio || 'No about section yet. Tap the edit icon to add one.'}
            </Text>
          )}
        </View>

        {/* Favorite Teams */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>FAVORITE TEAMS</Text>
          <View style={styles.teamsRow}>
            {favoriteTeams.map(renderTeamChip)}
            <TouchableOpacity 
              style={[styles.addTeamButton, { borderColor: theme.colors.textSecondary }]} 
              onPress={handleAddTeam}
            >
              <Text style={[styles.addTeamText, { color: theme.colors.text }]}>+ Add Team</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* My Communities */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>MY COMMUNITIES</Text>
          {communities.map(renderCommunityCard)}

          {/* Browse Communities */}
          <TouchableOpacity
            style={[styles.browseButton, { 
              backgroundColor: theme.colors.background, 
              borderColor: theme.colors.border 
            }]}
            onPress={handleBrowseCommunities}
          >
            <Text style={[styles.browseButtonText, { color: theme.colors.text }]}>BROWSE COMMUNITIES</Text>
          </TouchableOpacity>
        </View>

        {/* Predictions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>PREDICTIONS</Text>
          <View style={[styles.predictionsCard, { backgroundColor: theme.colors.cardBackground }]}>
            <View style={styles.predictionStat}>
              <Text style={[styles.predictionValue, { color: theme.colors.text }]}>{predictions.total}</Text>
              <Text style={[styles.predictionLabel, { color: theme.colors.textSecondary }]}>Total Predictions</Text>
            </View>
            <View style={styles.predictionStat}>
              <Text style={[styles.predictionValue, styles.correctValue]}>
                {predictions.correct}
              </Text>
              <Text style={[styles.predictionLabel, { color: theme.colors.textSecondary }]}>Correct</Text>
            </View>
            <View style={styles.predictionStat}>
              <Text style={[styles.predictionValue, styles.incorrectValue]}>
                {predictions.incorrect}
              </Text>
              <Text style={[styles.predictionLabel, { color: theme.colors.textSecondary }]}>Incorrect</Text>
            </View>
          </View>
        </View>

        {/* Account Settings */}
        <View style={[styles.settingsSection, { borderTopColor: theme.colors.separator }]}>
          {/* Theme Toggle */}
          <TouchableOpacity 
            style={[styles.settingsRow, { borderBottomColor: theme.colors.separator }]} 
            onPress={toggleTheme}
          >
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
              <Text style={[styles.settingsValueText, { color: theme.colors.text }]}>{user.email}</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.iconMuted} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingsRow, { borderBottomColor: theme.colors.separator }]} onPress={handlePasswordPress}>
            <Text style={[styles.settingsLabel, { color: theme.colors.textSecondary }]}>Password</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.iconMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingsRow, { borderBottomColor: theme.colors.separator }]}>
            <Text style={[styles.settingsLabel, { color: theme.colors.textSecondary }]}>Language</Text>
            <View style={styles.settingsValue}>
              <Text style={[styles.settingsValueText, { color: theme.colors.text }]}>English</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.iconMuted} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: isDark ? '#7f1d1d' : '#fee2e2' }]}
          onPress={handleLogout}
        >
          <Text style={[styles.logoutButtonText, { color: '#dc2626' }]}>LOG OUT</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
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
  },
  userPoints: {
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  bio: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
  },

  // Section
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
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
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  teamChipText: {
    fontSize: 13,
    fontFamily: 'Montserrat_700Bold',
  },
  addTeamButton: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addTeamText: {
    fontSize: 13,
    fontFamily: 'Montserrat_500Medium',
  },

  // Community Card
  communityCard: {
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
    marginBottom: 2,
  },
  communityMembers: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  communityStats: {
    alignItems: 'center',
    marginHorizontal: 16,
  },
  communityRank: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
  },
  communityRankLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  communityPoints: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
  },
  communityPointsLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  viewButtonText: {
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
  },

  // Browse Button
  browseButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  browseButtonText: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.5,
  },

  // Predictions
  predictionsCard: {
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
  },

  // Settings
  settingsSection: {
    marginTop: 24,
    borderTopWidth: 1,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
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
  },
  settingsValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsValueText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  editAvatarIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  editButton: {
    padding: 4,
  },
  aboutInput: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#fff',
  },
  logoutButton: {
    marginTop: 24,
    marginBottom: 40,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.5,
  },
});