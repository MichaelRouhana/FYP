import { Ionicons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  FlatList,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Pressable,
  Modal,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/context/ThemeContext';
import { useCommunityInfo } from '@/hooks/useChat';
import { useProfile } from '@/hooks/useProfile';
import { 
  getCommunityById, 
  CommunityResponseDTO,
  getMembersWithRoles,
  promoteToModerator,
  demoteToMember,
  kickUser,
  CommunityMemberDTO
} from '@/services/communityApi';
import { Moderator, Member, LeaderboardEntry } from '@/types/chat';
import { Alert } from 'react-native';

const Tab = createMaterialTopTabNavigator();

// ============ ABOUT TAB ============
function AboutTab({ 
  communityId, 
  onLeaveCommunity,
  refreshKey
}: { 
  communityId: string; 
  onLeaveCommunity: () => void;
  refreshKey?: number;
}) {
  const { theme, isDark } = useTheme();
  const { communityInfo, refresh } = useCommunityInfo(communityId);
  
  // Refresh when refreshKey changes (triggered from MembersTab after promote/demote)
  useEffect(() => {
    if (refreshKey !== undefined && refreshKey > 0) {
      refresh();
    }
  }, [refreshKey, refresh]);

  if (!communityInfo) {
    return (
      <View style={styles.tabContainer}>
        <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>Community not found</Text>
      </View>
    );
  }

  const renderModerator = (mod: Moderator) => (
    <View key={mod.id} style={[styles.moderatorRow, { borderBottomColor: theme.colors.separator }]}>
      <Image source={{ uri: mod.avatar }} style={styles.moderatorAvatar} />
      <View style={styles.moderatorInfo}>
        <Text style={[styles.moderatorName, { color: theme.colors.text }]}>{mod.name.toUpperCase()}</Text>
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
      <View key={index} style={[styles.ruleRow, { borderBottomColor: theme.colors.separator }, isLast && styles.ruleRowLast]}>
        <View style={styles.ruleIcon}>
          <Ionicons name="shield-checkmark" size={22} color={theme.colors.primary} />
        </View>
        <Text style={[styles.ruleText, { color: theme.colors.text }]}>{rule}</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.tabContainer} showsVerticalScrollIndicator={false}>
      {/* Community Card */}
      <View style={[styles.communityCard, { 
        backgroundColor: isDark ? '#080C17' : '#FFFFFF',
        borderColor: theme.colors.border
      }]}>
        <View style={[styles.communityLogoContainer, { backgroundColor: isDark ? '#fff' : '#E5E7EB' }]}>
          <Image source={{ uri: communityInfo.logo }} style={styles.communityLogo} />
        </View>
        <Text style={[styles.communityName, { color: theme.colors.text }]}>{communityInfo.name}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={16} color={theme.colors.primary} />
          <Text style={[styles.locationText, { color: theme.colors.primary }]}>{communityInfo.location}</Text>
          <Text style={[styles.memberCountText, { color: isDark ? '#38bdf8' : '#6B7280' }]}>{communityInfo.memberCount}</Text>
        </View>

        {/* About Section */}
        <View style={styles.aboutSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>ABOUT</Text>
          <Text style={[styles.descriptionText, { color: theme.colors.textSecondary }]}>{communityInfo.description}</Text>
        </View>
      </View>

      {/* Moderators */}
      <Text style={[styles.sectionHeader, { color: theme.colors.textMuted }]}>MODERATORS</Text>
      <View style={[styles.moderatorsCard, { 
        backgroundColor: isDark ? '#111828' : '#FFFFFF',
        borderColor: theme.colors.border
      }]}>
        {communityInfo.moderators && communityInfo.moderators.length > 0 ? (
          communityInfo.moderators.map(renderModerator)
        ) : (
          <View style={styles.emptyModeratorsContainer}>
            <Text style={[styles.emptyModeratorsText, { color: theme.colors.textSecondary }]}>
              No moderators appointed.
            </Text>
          </View>
        )}
      </View>

      {/* Rules */}
      <Text style={[styles.sectionHeader, { color: theme.colors.textMuted }]}>RULES</Text>
      <View style={[styles.rulesCard, { 
        backgroundColor: isDark ? '#111828' : '#FFFFFF',
        borderColor: theme.colors.border
      }]}>
        {communityInfo.rules.map(renderRule)}
      </View>

      {/* Browse Communities Button */}
      <TouchableOpacity style={[styles.browseButton, { 
        backgroundColor: isDark ? '#111828' : '#FFFFFF',
        borderColor: theme.colors.border
      }]}>
        <Text style={[styles.browseButtonText, { color: theme.colors.text }]}>BROWSE COMMUNITIES</Text>
      </TouchableOpacity>

      {/* Leave Community Button */}
      <TouchableOpacity 
        style={[styles.leaveButton, { 
          backgroundColor: '#ef4444',
          marginHorizontal: 16,
        }]}
        onPress={onLeaveCommunity}
      >
        <Text style={styles.leaveButtonText}>LEAVE COMMUNITY</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ============ MEMBERS TAB ============
function MembersTab({ 
  communityId, 
  isOwner, 
  currentUserEmail,
  refreshCommunityInfo
}: { 
  communityId: string; 
  isOwner: boolean;
  currentUserEmail?: string;
  refreshCommunityInfo?: () => void;
}) {
  const { theme, isDark } = useTheme();
  const { communityInfo } = useCommunityInfo(communityId);
  const [membersWithRoles, setMembersWithRoles] = useState<CommunityMemberDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMenuVisible, setActionMenuVisible] = useState<string | null>(null);

  // Fetch members with roles function
  const fetchMembersWithRoles = async () => {
    try {
      setLoading(true);
      const members = await getMembersWithRoles(communityId);
      setMembersWithRoles(members);
    } catch (error: any) {
      console.error('[MembersTab] Error fetching members with roles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch members with roles on mount and when communityId changes
  useEffect(() => {
    if (communityId) {
      fetchMembersWithRoles();
    }
  }, [communityId]);

  const handlePromote = async (userId: number) => {
    console.log(`[UI] Attempting to promote user: ${userId}...`);
    
    // Close action menu immediately
    setActionMenuVisible(null);
    
    try {
      // Await the API call to promote user
      console.log(`[UI] Calling promoteToModerator API for community ${communityId}, user ${userId}...`);
      await promoteToModerator(communityId, userId);
      
      console.log('[UI] Success response received from promoteToModerator API');
      
      // Show success alert with refresh callback - refresh only after user confirms
      Alert.alert(
        'Success',
        'User has been promoted!',
        [
          {
            text: 'OK',
            onPress: async () => {
              console.log('[UI] User confirmed success alert, refreshing data...');
              
              // CRITICAL: Refresh both members list AND community info to update moderators in About tab
              try {
                // Refresh members list first (this updates the Members tab) - await to ensure it completes
                console.log('[UI] Refreshing members list...');
                await fetchMembersWithRoles();
                console.log('[UI] ✅ Members list refreshed successfully');
                
                // Refresh community info to update moderators list in About tab
                // This increments refreshKey which triggers AboutTab to re-fetch via useCommunityInfo
                if (refreshCommunityInfo) {
                  console.log('[UI] Triggering community info refresh...');
                  refreshCommunityInfo();
                  console.log('[UI] ✅ Community info refresh triggered');
                } else {
                  console.warn('[UI] ⚠️ refreshCommunityInfo callback not available');
                }
              } catch (refreshError: any) {
                console.error('[UI] ❌ Error refreshing data after promotion:', refreshError);
              }
            }
          }
        ]
      );
      
      console.log('[UI] ✅ Promotion successful, success alert shown');
    } catch (error: any) {
      console.error('[UI] Error caught during promotion:', error);
      console.error('[UI] Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      
      // Show error alert with exact error message
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to promote user.';
      Alert.alert('Error', errorMessage);
      
      // Make sure action menu is closed even on error
      setActionMenuVisible(null);
    }
  };

  const handleDemote = async (userId: number) => {
    try {
      // Close action menu first
      setActionMenuVisible(null);
      
      // Await the API call to demote user
      await demoteToMember(communityId, userId);
      
      // Show success alert
      Alert.alert('Success', 'Moderator has been demoted to member.');
      
      // CRITICAL: Refresh both members list AND community info
      // Refresh members list first - await to ensure it completes
      await fetchMembersWithRoles();
      
      // Refresh community info to update moderators list in About tab
      if (refreshCommunityInfo) {
        refreshCommunityInfo();
      }
    } catch (error: any) {
      console.error('[MembersTab] Error demoting user:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to demote user.';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleKick = async (userEmail: string, username: string) => {
    try {
      // Close action menu first
      setActionMenuVisible(null);
      
      // Await the API call to kick user
      await kickUser(communityId, userEmail);
      
      // Show success alert
      Alert.alert('Success', `${username} has been removed from the community`);
      
      // Refresh members list - await to ensure it completes
      await fetchMembersWithRoles();
      
      // Refresh community info as well (in case kicked user was a moderator)
      if (refreshCommunityInfo) {
        refreshCommunityInfo();
      }
    } catch (error: any) {
      console.error('[MembersTab] Error kicking user:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to kick user.';
      Alert.alert('Error', errorMessage);
    }
  };

  const getRoleBadge = (roles: string[] = []) => {
    if (roles.includes('OWNER')) {
      return { text: '👑 Admin', color: '#fbbf24', icon: '👑' }; // Gold
    }
    if (roles.includes('MODERATOR')) {
      return { text: '🛡️ Mod', color: '#3b82f6', icon: '🛡️' }; // Blue
    }
    return null;
  };

  const renderMember = ({ item }: { item: CommunityMemberDTO }) => {
    const roleBadge = getRoleBadge(item.roles || []);
    const isCurrentUser = currentUserEmail && item.email === currentUserEmail;
    const isOwnerRole = item.roles?.includes('OWNER') || false;
    const isModeratorRole = item.roles?.includes('MODERATOR') || false;
    const isModerator = isModeratorRole || isOwnerRole;
    const canShowActions = isOwner && !isCurrentUser; // Don't show actions for self

    const isMenuOpen = actionMenuVisible === item.id.toString();
    
    return (
      <View style={[styles.memberRow, { 
        backgroundColor: isDark ? '#111827' : '#FFFFFF', 
        borderWidth: isDark ? 0 : 1, 
        borderColor: theme.colors.border,
        position: 'relative',
        zIndex: isMenuOpen ? 1000 : 1, // Higher zIndex when menu is open
        elevation: isMenuOpen ? 10 : 0, // Higher elevation for Android when menu is open
        overflow: 'visible', // Allow menu to render outside row bounds
      }]}>
        <Image 
          source={{ uri: item.pfp || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.username)}&background=3b82f6&color=fff` }} 
          style={styles.memberAvatar} 
        />
        <View style={styles.memberInfo}>
          <View style={styles.memberNameRow}>
            <Text style={[styles.memberName, { color: theme.colors.text }]}>
              {item.username.toUpperCase()}
            </Text>
            {roleBadge && (
              <View style={[styles.roleBadge, { 
                backgroundColor: roleBadge.color + '25',
                borderColor: roleBadge.color + '60',
              }]}>
                <Text style={[styles.roleBadgeIcon]}>{roleBadge.icon}</Text>
                <Text style={[styles.roleBadgeText, { color: roleBadge.color }]}>
                  {roleBadge.text.replace(/[👑🛡️]/g, '').trim()}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.memberPoints, { color: theme.colors.textSecondary }]}>
            {item.points?.toLocaleString() || 0} POINTS
          </Text>
        </View>
        {canShowActions && (
          <TouchableOpacity
            onPress={() => {
              setActionMenuVisible(actionMenuVisible === item.id.toString() ? null : item.id.toString());
            }}
            style={styles.actionButton}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
        {actionMenuVisible === item.id.toString() && (
          <View
            style={[styles.actionMenu, { 
              backgroundColor: isDark ? '#1f2937' : '#f9fafb', 
              borderColor: theme.colors.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 15, // Higher elevation for Android
              zIndex: 1010,
            }]}
            pointerEvents="auto" // Ensure menu captures touches
          >
            {/* Close button */}
            <TouchableOpacity
              onPress={() => setActionMenuVisible(null)}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            {isModerator ? (
              <>
                <TouchableOpacity
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  onPress={() => {
                    Alert.alert(
                      'Demote Moderator',
                      `Are you sure you want to demote ${item.username} to a regular member?`,
                      [
                        { 
                          text: 'Cancel', 
                          style: 'cancel',
                          onPress: () => setActionMenuVisible(null) // Close menu on cancel
                        },
                        { 
                          text: 'Demote', 
                          style: 'destructive', 
                          onPress: () => {
                            setActionMenuVisible(null); // Close menu before action
                            handleDemote(item.id);
                          }
                        },
                      ]
                    );
                  }}
                  style={styles.actionMenuItem}
                >
                  <Ionicons name="arrow-down" size={18} color={theme.colors.text} />
                  <Text style={[styles.actionMenuText, { color: theme.colors.text }]}>Demote to Member</Text>
                </TouchableOpacity>
                <View style={[styles.actionMenuDivider, { backgroundColor: theme.colors.separator }]} />
                <TouchableOpacity
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  onPress={() => {
                    Alert.alert(
                      'Kick User',
                      `Are you sure you want to remove ${item.username} from this community?`,
                      [
                        { 
                          text: 'Cancel', 
                          style: 'cancel',
                          onPress: () => setActionMenuVisible(null) // Close menu on cancel
                        },
                        { 
                          text: 'Kick', 
                          style: 'destructive', 
                          onPress: () => {
                            setActionMenuVisible(null); // Close menu before action
                            if (item.email) {
                              handleKick(item.email, item.username);
                            } else {
                              Alert.alert('Error', 'Cannot kick user: email not available');
                            }
                          }
                        },
                      ]
                    );
                  }}
                  style={styles.actionMenuItem}
                >
                  <Ionicons name="person-remove" size={18} color="#ef4444" />
                  <Text style={[styles.actionMenuText, { color: '#ef4444' }]}>Kick User</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  onPress={() => {
                    console.log(`[UI] ⚡ Promote button TOUCHED for user: ${item.username} (ID: ${item.id})`);
                    console.log(`[UI] Item details:`, { id: item.id, username: item.username, email: item.email });
                    
                    Alert.alert(
                      'Promote to Moderator',
                      `Are you sure you want to promote ${item.username} to moderator?`,
                      [
                        { 
                          text: 'Cancel', 
                          style: 'cancel',
                          onPress: () => {
                            console.log('[UI] Promotion cancelled by user');
                            setActionMenuVisible(null); // Close menu on cancel
                          }
                        },
                        { 
                          text: 'Promote', 
                          onPress: () => {
                            console.log(`[UI] ✅ User confirmed promotion for ID: ${item.id}`);
                            setActionMenuVisible(null); // Close menu before action
                            if (!item.id) {
                              console.error('[UI] ❌ ERROR: item.id is undefined or null!');
                              Alert.alert('Error', 'Cannot promote: User ID is missing.');
                              return;
                            }
                            console.log(`[UI] 🚀 Calling handlePromote(${item.id})...`);
                            handlePromote(item.id);
                          }
                        },
                      ]
                    );
                  }}
                  style={styles.actionMenuItem}
                >
                  <Ionicons name="arrow-up" size={18} color={theme.colors.text} />
                  <Text style={[styles.actionMenuText, { color: theme.colors.text }]}>Promote to Moderator</Text>
                </TouchableOpacity>
                <View style={[styles.actionMenuDivider, { backgroundColor: theme.colors.separator }]} />
                <TouchableOpacity
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  onPress={() => {
                    Alert.alert(
                      'Kick User',
                      `Are you sure you want to remove ${item.username} from this community?`,
                      [
                        { 
                          text: 'Cancel', 
                          style: 'cancel',
                          onPress: () => setActionMenuVisible(null) // Close menu on cancel
                        },
                        { 
                          text: 'Kick', 
                          style: 'destructive', 
                          onPress: () => {
                            setActionMenuVisible(null); // Close menu before action
                            if (item.email) {
                              handleKick(item.email, item.username);
                            } else {
                              Alert.alert('Error', 'Cannot kick user: email not available');
                            }
                          }
                        },
                      ]
                    );
                  }}
                  style={styles.actionMenuItem}
                >
                  <Ionicons name="person-remove" size={18} color="#ef4444" />
                  <Text style={[styles.actionMenuText, { color: '#ef4444' }]}>Kick User</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  if (!communityInfo) {
    return (
      <View style={styles.tabContainer}>
        <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>Community not found</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.tabContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <FlatList
        style={styles.tabContainer}
        data={membersWithRoles}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMember}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => {
          // Close menu when user starts scrolling
          if (actionMenuVisible) {
            setActionMenuVisible(null);
          }
        }}
      />
    </View>
  );
}

// ============ LEADERBOARD TAB ============
function LeaderboardTab({ communityId }: { communityId: string }) {
  const { theme, isDark } = useTheme();
  const { communityInfo } = useCommunityInfo(communityId);

  if (!communityInfo) {
    return (
      <View style={styles.tabContainer}>
        <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>Community not found</Text>
      </View>
    );
  }

  const renderLeaderboardEntry = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const isLast = index === communityInfo.leaderboard.length - 1;
    
    return (
      <View style={[styles.leaderboardRow, { borderBottomColor: theme.colors.separator }, isLast && styles.lastRow]}>
        <Text style={[styles.rankText, { color: theme.colors.text }]}>#{item.rank}</Text>
        <Image source={{ uri: item.avatar }} style={styles.leaderboardAvatar} />
        <Text style={[styles.leaderboardName, { color: theme.colors.text }]}>{item.name}</Text>
        <Text style={[styles.leaderboardPoints, { color: theme.colors.text }]}>{item.points.toLocaleString()}</Text>
      </View>
    );
  };

  return (
    <View style={styles.tabContainer}>
      <View style={[styles.leaderboardCard, { 
        backgroundColor: isDark ? '#080C17' : '#FFFFFF',
        borderColor: theme.colors.border
      }]}>
        {/* Header */}
        <View style={[styles.leaderboardHeader, { borderBottomColor: theme.colors.separator }]}>
          <Text style={[styles.headerRank, { color: theme.colors.textMuted }]}>Rank</Text>
          <Text style={[styles.headerName, { color: theme.colors.textMuted }]}>Name</Text>
          <Text style={[styles.headerPoints, { color: theme.colors.textMuted }]}>Points</Text>
        </View>

        {/* Leaderboard List */}
        <FlatList
          data={communityInfo.leaderboard}
          keyExtractor={(item) => item.id}
          renderItem={renderLeaderboardEntry}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            // Only show "View all" if there are more than 5 entries (enough to fill the screen)
            communityInfo.leaderboard.length > 5 ? (
              <TouchableOpacity style={[styles.viewAllButton, { borderTopColor: theme.colors.separator }]}>
                <Text style={[styles.viewAllText, { color: theme.colors.textSecondary }]}>View all</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      </View>
    </View>
  );
}

// ============ MAIN SCREEN ============
export default function CommunityInfoScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useProfile();
  
  const [community, setCommunity] = useState<CommunityResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | undefined>(user?.email);
  const [refreshKey, setRefreshKey] = useState(0); // Key to force refresh of community info

  // Check if user is app admin (for QR code access)
  const isAdmin = user?.roles?.some(
    (role) => role.toUpperCase() === 'ADMIN' || role.toUpperCase() === 'ROLE_ADMIN'
  ) || false;

  // Check if user is OWNER of this community
  useEffect(() => {
    const checkOwnerStatus = async () => {
      if (!id || !user?.email) return;
      
      try {
        const members = await getMembersWithRoles(id);
        const currentUserMember = members.find(m => m.email === user.email);
        const hasOwnerRole = currentUserMember?.roles?.includes('OWNER') || false;
        setIsOwner(hasOwnerRole);
        setCurrentUserEmail(user.email);
      } catch (error) {
        console.error('[CommunityInfo] Error checking owner status:', error);
        setIsOwner(false);
      }
    };

    if (user?.email) {
      checkOwnerStatus();
    }
  }, [id, user?.email]);

  // Fetch community data
  useEffect(() => {
    const fetchCommunity = async () => {
      if (!id) {
        setError('Community ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await getCommunityById(id);
        setCommunity(data);
      } catch (err: any) {
        console.error('[CommunityInfo] Error fetching community:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load community');
      } finally {
        setLoading(false);
      }
    };

    fetchCommunity();
  }, [id]);

  const handleBack = () => {
    router.back();
  };

  const handleQRCode = () => {
    if (!community) {
      console.warn('[CommunityInfo] Cannot navigate to QR: community missing');
      return;
    }

    // Ensure inviteCode is never null/undefined when passing to navigation
    const safeInviteCode = community.inviteCode || '';

    router.push({
      pathname: '/community/qr/[id]',
      params: {
        id: community.id.toString(),
        name: community.name,
        inviteCode: safeInviteCode,
      },
    });
  };

  const handleLeaveCommunity = () => {
    console.log('Leave community:', id);
  };

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.screenBackground, { paddingTop: insets.top, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.errorText, { color: theme.colors.textSecondary, marginTop: 16 }]}>Loading community...</Text>
      </View>
    );
  }

  // Show error state
  if (error || !community) {
    return (
      <View style={[styles.screenBackground, { paddingTop: insets.top, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
          {error || 'Community not found'}
        </Text>
        <TouchableOpacity onPress={handleBack} style={[styles.backButton, { marginTop: 16 }]}>
          <Text style={{ color: theme.colors.primary }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'COMMUNITY',
          headerStyle: {
            backgroundColor: theme.colors.headerBackground,
          },
          headerTintColor: theme.colors.text,
          headerTitleStyle: {
            fontFamily: 'Montserrat_700Bold',
            fontSize: 18,
            letterSpacing: 1,
          },
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={{ marginLeft: 8 }}>
              <Ionicons name="chevron-back" size={28} color={theme.colors.icon} />
            </TouchableOpacity>
          ),
          headerRight: () => {
            // Only show QR button if user is admin and inviteCode exists
            if (isAdmin && community.inviteCode) {
              return (
                <TouchableOpacity
                  onPress={handleQRCode}
                  style={{ marginRight: 16 }}
                >
                  <Ionicons 
                    name="qr-code-outline" 
                    size={24} 
                    color={isDark ? '#F9FAFB' : '#18223A'} 
                  />
                </TouchableOpacity>
              );
            }
            return <View style={{ width: 40 }} />; // Spacer to maintain layout
          },
        }}
      />
      <View style={[styles.screenBackground, { paddingTop: 0, backgroundColor: theme.colors.background }]}>

      {/* Tabs - Order: ABOUT, MEMBERS, LEADERBOARD */}
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: [styles.tabBar, { backgroundColor: theme.colors.headerBackground }],
          tabBarIndicatorStyle: [styles.tabIndicator, { backgroundColor: theme.colors.primary }],
          tabBarLabelStyle: styles.tabLabel,
          tabBarActiveTintColor: theme.colors.text,
          tabBarInactiveTintColor: theme.colors.textMuted,
          tabBarPressColor: 'transparent',
        }}
      >
        <Tab.Screen name="ABOUT" key={`about-${refreshKey}`}>
          {() => <AboutTab 
            communityId={id} 
            onLeaveCommunity={handleLeaveCommunity}
            refreshKey={refreshKey}
          />}
        </Tab.Screen>
        <Tab.Screen name="MEMBERS" key={`members-${refreshKey}`}>
          {() => <MembersTab 
            communityId={id} 
            isOwner={isOwner}
            currentUserEmail={currentUserEmail}
            refreshCommunityInfo={() => setRefreshKey(prev => prev + 1)}
          />}
        </Tab.Screen>
        <Tab.Screen name="LEADERBOARD">
          {() => <LeaderboardTab communityId={id} />}
        </Tab.Screen>
      </Tab.Navigator>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screenBackground: {
    flex: 1,
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
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 1,
  },
  qrButton: {
    padding: 4,
  },
  tabBar: {
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0,
  },
  tabIndicator: {
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
    backgroundColor: 'transparent',
  },
  listContent: {
    padding: 16,
    overflow: 'visible', // Allow menus to render outside list bounds
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
  emptyModeratorsContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyModeratorsText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
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
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  roleBadgeIcon: {
    fontSize: 12,
  },
  roleBadgeText: {
    fontSize: 10,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.5,
  },
  actionButton: {
    padding: 8,
    marginLeft: 'auto',
  },
  actionMenu: {
    position: 'absolute',
    right: 8,
    top: 50,
    borderRadius: 8,
    borderWidth: 1,
    padding: 4,
    paddingTop: 32, // Extra padding at top for close button
    minWidth: 180,
    zIndex: 1001,
    elevation: 10, // Higher elevation for Android
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  closeButton: {
    position: 'absolute',
    top: 4,
    left: 4,
    padding: 4,
    zIndex: 1002,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    zIndex: 1002, // Even higher zIndex for touchable items
  },
  actionMenuText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginLeft: 4,
  },
  actionMenuDivider: {
    height: 1,
    marginVertical: 4,
    marginHorizontal: 8,
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
    fontFamily: 'Inter_400Regular',
  },
  leaveButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 24,
  },
  leaveButtonText: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: '#fff',
    letterSpacing: 1,
  },
});
