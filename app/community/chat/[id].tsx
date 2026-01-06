import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { jwtDecode } from 'jwt-decode';
import { getItem } from '@/utils/storage';

import { useTheme } from '@/context/ThemeContext';
import { useChatMessages, useCommunityDetails } from '@/hooks/useChat';
import { MatchBidData, Message } from '@/types/chat';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.65, 240);

interface JwtPayload {
  sub?: string; // username/email
  username?: string;
  email?: string;
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const { messages, sendMessage, loading, error, connected } = useChatMessages(id);
  const { community } = useCommunityDetails(id);
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Get current user's email and name from JWT token for identity verification
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const token = await getItem('jwt_token');
        if (token) {
          const decoded = jwtDecode<JwtPayload>(token);
          // Extract email and username from JWT payload
          const email = decoded.email || decoded.sub || null;
          const name = decoded.username || null;
          setUser({ email, name });
          console.log('✅ Current user from JWT - email:', email, 'name:', name);
        }
      } catch (err) {
        console.error('Error decoding JWT token:', err);
      }
    };
    getCurrentUser();
  }, []);

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;
    sendMessage(text, replyingTo ?? undefined);
    setInputText('');
    setReplyingTo(null);
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [inputText, replyingTo, sendMessage]);

  const handleBack = () => {
    router.back();
  };

  const handleInfo = () => {
    router.push({
      pathname: '/community/info/[id]',
      params: { id },
    });
  };

  const formatTime = (date: Date | number) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Now';
    if (diffMins < 60) return `${diffMins}m ago`;

    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Check if message is from current user by comparing email or username
  const isCurrentUser = (message: Message) => {
    if (!user) return false;
    // Use email comparison (primary) with fallback to username comparison
    return message.senderEmail === user?.email || message.user.name === user?.name;
  };

  const renderMatchBidCard = (data: MatchBidData) => (
    <View style={[styles.matchBidCard, { 
      backgroundColor: '#FFFFFF',
      borderColor: '#18223A'
    }]}>
      {/* League Header */}
      <View style={styles.leagueHeader}>
        <Image
          source={{ uri: data.leagueLogo }}
          style={styles.leagueLogo}
          defaultSource={require('@/assets/images/icon.png')}
        />
        <View>
          <Text style={styles.leagueName}>{data.league}</Text>
          <Text style={styles.leagueCountry}>{data.country}</Text>
        </View>
      </View>

      {/* Teams */}
      <View style={styles.teamsContainer}>
        <View style={styles.teamInfo}>
          <Image
            source={{ uri: data.homeLogo }}
            style={styles.teamLogo}
            defaultSource={require('@/assets/images/icon.png')}
          />
          <Text style={styles.teamName}>{data.homeTeam}</Text>
        </View>

        <Text style={styles.vsText}>VS</Text>

        <View style={styles.teamInfo}>
          <Image
            source={{ uri: data.awayLogo }}
            style={styles.teamLogo}
            defaultSource={require('@/assets/images/icon.png')}
          />
          <Text style={styles.teamName}>{data.awayTeam}</Text>
        </View>
      </View>

      {/* Match Time */}
      <Text style={styles.matchTime}>{data.matchTime}</Text>

      {/* Place Bid Button */}
      <TouchableOpacity style={[styles.placeBidButton, { backgroundColor: '#18223A' }]} activeOpacity={0.8}>
        <Text style={styles.placeBidText}>PLACE YOUR BID</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = isCurrentUser(item);

    // Handle system messages
    if (item.messageType === 'system') {
      return (
        <View style={styles.systemMessage}>
          <Text style={[styles.systemText, { 
            color: isDark ? '#6b7280' : '#6B7280',
            backgroundColor: isDark ? '#1f2937' : '#E5E7EB'
          }]}>{item.text}</Text>
        </View>
      );
    }

    // Handle match_bid type - render the custom card
    if (item.messageType === 'match_bid' && item.customData) {
      return (
        <View style={styles.matchBidWrapper}>
          {renderMatchBidCard(item.customData)}
          <View style={styles.sharedInfo}>
            <Text style={styles.sharedTime}>{formatTime(item.createdAt)}</Text>
            <Text style={[styles.sharedLabel, { color: theme.colors.textSecondary }]}>You Shared this match</Text>
          </View>
        </View>
      );
    }

    // Regular text message
    return (
      <View
        style={[
          styles.messageWrapper,
          { justifyContent: isMe ? 'flex-end' : 'flex-start' },
        ]}
      >
        {/* Avatar for others */}
        {!isMe && (
          <View style={[styles.avatarSmall, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]}>
            <Text style={[styles.avatarLetter, { color: isDark ? '#fff' : '#18223A' }]}>
              {item.user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={[styles.messageContent, isMe && styles.messageContentMe]}>
          {/* Username for others only - never show for own messages */}
          {!isMe && (
            <Text style={[styles.senderName, { color: theme.colors.textSecondary }]}>{item.user.name}</Text>
          )}

          {/* Reply preview */}
          {item.replyTo && (
            <View style={[styles.replyPreview, { backgroundColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
              <View style={[styles.replyBar, { backgroundColor: theme.colors.primary }]} />
              <View>
                <Text style={[styles.replyName, { color: theme.colors.primary }]}>{item.replyTo.senderName}</Text>
                <Text style={[styles.replyText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                  {item.replyTo.originalText}
                </Text>
              </View>
            </View>
          )}

          {/* Message Bubble with Tail (using border radius) */}
          <View
            style={[
              styles.messageBubble,
              isMe ? styles.bubbleMe : styles.bubbleOther,
            ]}
          >
            <Text style={[styles.messageText, { 
              color: isMe 
                ? '#fff' 
                : '#000000' // Black text for other users' messages (white background)
            }]}>
              {item.text}
            </Text>
          </View>

          {/* Time */}
          <Text style={[styles.timeText, { color: theme.colors.textMuted }, isMe && styles.timeTextMe]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.background, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        keyboardVerticalOffset={Platform.select({ ios: 0, android: 0 })}
      >
        <View style={[styles.container, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.separator, backgroundColor: theme.colors.headerBackground }]}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={28} color={theme.colors.icon} />
            </TouchableOpacity>

            <View style={[styles.headerAvatar, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]}>
              <Image
                source={{ uri: community?.logo }}
                style={styles.headerLogo}
                defaultSource={require('@/assets/images/icon.png')}
              />
            </View>

            <View style={styles.headerInfo}>
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                {community?.name ?? name ?? 'Community'}
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
                {community?.memberCount ?? '1.8M members'}
              </Text>
            </View>

            <TouchableOpacity onPress={handleInfo} style={styles.infoButton}>
              <Ionicons name="information-circle-outline" size={26} color={theme.colors.icon} />
            </TouchableOpacity>
          </View>

          {/* Loading Indicator */}
          {loading && messages.length === 0 && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                Loading messages...
              </Text>
            </View>
          )}

          {/* Connection Error */}
          {error && !loading && (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: theme.colors.error || '#ef4444' }]}>
                {error}
              </Text>
            </View>
          )}

          {/* Connection Status Indicator */}
          {!connected && !loading && !error && (
            <View style={styles.connectionStatus}>
              <Text style={[styles.connectionText, { color: theme.colors.textMuted }]}>
                Connecting...
              </Text>
            </View>
          )}

          {/* Messages List */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item._id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
            ListEmptyComponent={
              !loading && !error ? (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                    No messages yet. Start the conversation!
                  </Text>
                </View>
              ) : null
            }
          />

          {/* Reply Preview */}
          {replyingTo && (
            <View style={[styles.replyingContainer, { 
              backgroundColor: isDark ? '#1f2937' : '#F3F4F6',
              borderTopColor: theme.colors.separator
            }]}>
              <View style={styles.replyingContent}>
                <Text style={styles.replyingLabel}>
                  Replying to {replyingTo.user.name}
                </Text>
                <Text style={[styles.replyingText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                  {replyingTo.text}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <Ionicons name="close" size={20} color={theme.colors.iconMuted} />
              </TouchableOpacity>
            </View>
          )}

          {/* Input Area */}
          <View style={[styles.inputContainer, { 
            paddingBottom: insets.bottom + 8,
            borderTopColor: theme.colors.separator,
            backgroundColor: theme.colors.headerBackground
          }]}>
            <TouchableOpacity style={styles.addButton}>
              <Ionicons name="add" size={24} color={theme.colors.iconMuted} />
            </TouchableOpacity>

            <View style={[styles.inputWrapper, { 
              borderColor: theme.colors.border,
              backgroundColor: isDark ? 'transparent' : '#FFFFFF'
            }]}>
              <TextInput
                style={[styles.textInput, { color: theme.colors.text }]}
                placeholder="Enter your message"
                placeholderTextColor={theme.colors.textMuted}
                value={inputText}
                onChangeText={setInputText}
                multiline
              />
            </View>

            {inputText.trim() ? (
              <TouchableOpacity style={[styles.sendButton, { backgroundColor: theme.colors.primary }]} onPress={handleSend}>
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={styles.emojiButton}>
                  <Ionicons name="happy-outline" size={24} color={theme.colors.iconMuted} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.cameraButton}>
                  <Ionicons name="camera-outline" size={24} color={theme.colors.iconMuted} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    overflow: 'hidden',
  },
  headerLogo: {
    width: 34,
    height: 34,
    resizeMode: 'contain',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Montserrat_700Bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  infoButton: {
    padding: 6,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  matchBidWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarLetter: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
  },
  messageContent: {
    maxWidth: '75%',
  },
  messageContentMe: {
    alignItems: 'flex-end',
  },
  senderName: {
    fontSize: 13,
    color: '#9ca3af',
    fontFamily: 'Montserrat_500Medium',
    marginBottom: 4,
    marginLeft: 2,
  },
  replyPreview: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 8,
    marginBottom: 4,
  },
  replyBar: {
    width: 3,
    backgroundColor: '#22c55e',
    borderRadius: 2,
    marginRight: 8,
  },
  replyName: {
    fontSize: 12,
    color: '#22c55e',
    fontFamily: 'Montserrat_600SemiBold',
  },
  replyText: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: 'Inter_400Regular',
  },
  messageBubble: {
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    maxWidth: '75%',
  },
  bubbleMe: {
    backgroundColor: '#0a7ea4', // Blue for me
    alignSelf: 'flex-end',
    marginLeft: 50,
    borderBottomRightRadius: 0, // Sharp corner bottom-right (tail pointing right)
    borderBottomLeftRadius: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  bubbleOther: {
    backgroundColor: '#f0f0f0', // Gray for others
    alignSelf: 'flex-start',
    marginRight: 50,
    borderBottomLeftRadius: 0, // Sharp corner bottom-left (tail pointing left)
    borderBottomRightRadius: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  messageText: {
    fontSize: 15,
    color: '#e5e7eb',
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
  },
  messageTextMe: {
    color: '#fff',
  },
  timeText: {
    fontSize: 11,
    color: '#6b7280',
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
    marginLeft: 2,
  },
  timeTextMe: {
    textAlign: 'right',
    marginRight: 2,
  },
  systemMessage: {
    alignItems: 'center',
    marginVertical: 12,
  },
  systemText: {
    fontSize: 13,
    color: '#6b7280',
    fontFamily: 'Inter_400Regular',
    backgroundColor: '#1f2937',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  // Match Bid Card Styles - Smaller and more compact
  matchBidCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    width: CARD_WIDTH,
    borderWidth: 1,
    borderColor: '#18223A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  leagueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  leagueLogo: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
    marginRight: 8,
  },
  leagueName: {
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f172a',
  },
  leagueCountry: {
    fontSize: 10,
    color: '#6b7280',
    fontFamily: 'Inter_400Regular',
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  teamInfo: {
    alignItems: 'center',
    flex: 1,
  },
  teamLogo: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
    marginBottom: 4,
  },
  teamName: {
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#0f172a',
  },
  vsText: {
    fontSize: 14,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#f59e0b',
    marginHorizontal: 8,
  },
  matchTime: {
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 10,
  },
  placeBidButton: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  placeBidText: {
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  sharedInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: CARD_WIDTH,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  sharedTime: {
    fontSize: 11,
    color: '#32A95D',
    fontFamily: 'Inter_400Regular',
  },
  sharedLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
  },
  replyingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  replyingContent: {
    flex: 1,
    marginRight: 12,
  },
  replyingLabel: {
    fontSize: 12,
    color: '#22c55e',
    fontFamily: 'Montserrat_600SemiBold',
  },
  replyingText: {
    fontSize: 13,
    color: '#9ca3af',
    fontFamily: 'Inter_400Regular',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  addButton: {
    padding: 8,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
  },
  textInput: {
    fontSize: 15,
    color: '#fff',
    fontFamily: 'Inter_400Regular',
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiButton: {
    padding: 8,
  },
  cameraButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  connectionStatus: {
    padding: 8,
    alignItems: 'center',
  },
  connectionText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
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
