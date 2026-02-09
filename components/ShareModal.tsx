import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Share,
  Alert,
  Platform,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useCommunities } from '@/hooks/useChat';
import { MatchBidData } from '@/types/chat';

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  shareUrl: string;
  matchData?: MatchBidData; // Optional match data for sharing to communities
}

export default function ShareModal({ visible, onClose, shareUrl, matchData }: ShareModalProps) {
  const { isDark } = useTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const { communities, loading: communitiesLoading } = useCommunities();
  const [showCommunities, setShowCommunities] = useState(false);

  const handleCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(shareUrl);
      Alert.alert('Success', 'Link copied to clipboard!');
      onClose();
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert('Error', 'Failed to copy link. Please try again.');
    }
  };

  const handleMoreOptions = async () => {
    try {
      const result = await Share.share({
        message: shareUrl,
        url: shareUrl, // iOS
        title: 'Share Match', // Android
      });

      if (result.action === Share.sharedAction) {
        // User shared successfully
        onClose();
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share. Please try again.');
    }
  };

  const handleShareToCommunity = () => {
    if (!matchData) {
      Alert.alert('Error', 'Match data not available for sharing.');
      return;
    }
    setShowCommunities(true);
  };

  const handleCommunitySelect = (communityId: string, communityName: string) => {
    // Store match data temporarily to send when chat opens
    // We'll use a global state or pass via route params
    // For now, navigate to chat and the chat screen will handle sending
    onClose();
    router.push({
      pathname: '/community/chat/[id]',
      params: { 
        id: communityId, 
        name: communityName,
        shareMatch: 'true',
        matchData: JSON.stringify(matchData),
      },
    });
  };

  const renderCommunityItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.communityItem, { 
        backgroundColor: isDark ? '#1f2937' : '#f3f4f6',
        borderColor: colors.muted 
      }]}
      onPress={() => handleCommunitySelect(item.id, item.name)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.logo }}
        style={styles.communityLogo}
        defaultSource={require('@/assets/images/icon.png')}
      />
      <View style={styles.communityInfo}>
        <Text style={[styles.communityName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.communityMembers, { color: colors.muted }]}>{item.memberCount || '0 members'}</Text>
      </View>
    </TouchableOpacity>
  );

  if (showCommunities) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowCommunities(false);
          onClose();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, maxHeight: '80%' }]}>
            {/* Header */}
            <View style={styles.communitiesHeader}>
              <TouchableOpacity
                onPress={() => setShowCommunities(false)}
                style={styles.backButton}
              >
                <Text style={[styles.backButtonText, { color: colors.tint }]}>← Back</Text>
              </TouchableOpacity>
              <Text style={[styles.title, { color: colors.text, marginBottom: 0 }]}>Share to Community</Text>
              <View style={{ width: 60 }} />
            </View>

            {/* Communities List */}
            {communitiesLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.tint} />
              </View>
            ) : communities.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.muted }]}>
                  You haven't joined any communities yet.
                </Text>
              </View>
            ) : (
              <FlatList
                data={communities}
                keyExtractor={(item) => item.id}
                renderItem={renderCommunityItem}
                style={styles.communitiesList}
                contentContainerStyle={styles.communitiesListContent}
              />
            )}
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>Share</Text>

          {/* Link Input */}
          <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1f2937' : '#f3f4f6' }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={shareUrl}
              editable={false}
              selectTextOnFocus
              placeholderTextColor={colors.muted}
            />
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.tint }]}
              onPress={handleCopyLink}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Copy link</Text>
            </TouchableOpacity>

            {matchData && (
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.tint }]}
                onPress={handleShareToCommunity}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Share to Community</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.muted }]}
              onPress={handleMoreOptions}
              activeOpacity={0.8}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.text }]}>More Options</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    fontFamily: 'Montserrat_700Bold',
  },
  inputContainer: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    minHeight: 48,
    justifyContent: 'center',
  },
  input: {
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Montserrat_600SemiBold',
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Montserrat_600SemiBold',
  },
  communitiesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
  },
  communitiesList: {
    maxHeight: 400,
  },
  communitiesListContent: {
    paddingBottom: 8,
  },
  communityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  communityLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  communityInfo: {
    flex: 1,
  },
  communityName: {
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
    marginBottom: 2,
  },
  communityMembers: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
});

