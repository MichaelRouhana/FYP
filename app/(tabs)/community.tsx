import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientBackground } from '@/components/GradientBackground';
import { useCommunities } from '@/hooks/useChat';
import { Community } from '@/types/chat';

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const { communities, searchCommunities } = useCommunities();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCommunities = useMemo(() => {
    return searchCommunities(searchQuery);
  }, [searchQuery, searchCommunities]);

  const handleCommunityPress = (community: Community) => {
    router.push({
      pathname: '/community/chat/[id]',
      params: { id: community.id, name: community.name },
    });
  };

  const handleQRPress = () => {
    // Navigate to QR for browsing communities
    router.push({
      pathname: '/community/qr/[id]',
      params: { id: 'browse', name: 'Browse Communities' },
    });
  };

  const renderCommunityItem = ({ item }: { item: Community }) => (
    <TouchableOpacity
      style={styles.communityRow}
      activeOpacity={0.7}
      onPress={() => handleCommunityPress(item)}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: item.logo }}
          style={styles.avatar}
          defaultSource={require('@/assets/images/icon.png')}
        />
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <View style={styles.topRow}>
          <Text style={styles.communityName}>{item.name}</Text>
          <Text style={styles.timeText}>{item.lastMessageTime}</Text>
        </View>
        <View style={styles.bottomRow}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
          {item.unreadCount && item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <GradientBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="menu" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>COMMUNITIES</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#6b7280"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#6b7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Community List */}
        <FlatList
          data={filteredCommunities}
          keyExtractor={(item) => item.id}
          renderItem={renderCommunityItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Browse Communities Button */}
        <TouchableOpacity
          style={styles.browseButton}
          activeOpacity={0.8}
          onPress={handleQRPress}
        >
          <Text style={styles.browseButtonText}>BROWSE COMMUNITIES</Text>
        </TouchableOpacity>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  menuButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat_700Bold',
    color: '#fff',
    letterSpacing: 1,
  },
  headerRight: {
    width: 36,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a2234',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Inter_400Regular',
  },
  listContent: {
    paddingBottom: 20,
  },
  communityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141c2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  contentContainer: {
    flex: 1,
    marginLeft: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  communityName: {
    fontSize: 15,
    fontFamily: 'Montserrat_700Bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  timeText: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: 'Inter_400Regular',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 13,
    color: '#9ca3af',
    fontFamily: 'Inter_400Regular',
    marginRight: 10,
  },
  unreadBadge: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
  },
  browseButton: {
    backgroundColor: '#1a2234',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  browseButtonText: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: '#fff',
    letterSpacing: 1,
  },
});
