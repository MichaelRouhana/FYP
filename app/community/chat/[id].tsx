import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientBackground } from '@/components/GradientBackground';
import { useChatMessages, useCommunityDetails, CURRENT_USER } from '@/hooks/useChat';
import { Message, MatchBidData } from '@/types/chat';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.65, 240);

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const { messages, sendMessage } = useChatMessages(id);
  const { community } = useCommunityDetails(id);
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const flatListRef = useRef<FlatList>(null);

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

  const isCurrentUser = (message: Message) => {
    return message.user.id === CURRENT_USER.id;
  };

  const renderMatchBidCard = (data: MatchBidData) => (
    <View style={styles.matchBidCard}>
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
      <TouchableOpacity style={styles.placeBidButton} activeOpacity={0.8}>
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
          <Text style={styles.systemText}>{item.text}</Text>
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
            <Text style={styles.sharedLabel}>You Shared this match</Text>
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
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarLetter}>
              {item.user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={styles.messageContent}>
          {/* Username for others */}
          {!isMe && (
            <Text style={styles.senderName}>{item.user.name}</Text>
          )}

          {/* Reply preview */}
          {item.replyTo && (
            <View style={styles.replyPreview}>
              <View style={styles.replyBar} />
              <View>
                <Text style={styles.replyName}>{item.replyTo.senderName}</Text>
                <Text style={styles.replyText} numberOfLines={1}>
                  {item.replyTo.originalText}
                </Text>
              </View>
            </View>
          )}

          {/* Message Bubble */}
          <View
            style={[
              styles.messageBubble,
              isMe ? styles.bubbleMe : styles.bubbleOther,
            ]}
          >
            <Text style={[styles.messageText, isMe && styles.messageTextMe]}>
              {item.text}
            </Text>
          </View>

          {/* Time */}
          <Text style={[styles.timeText, isMe && styles.timeTextMe]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        keyboardVerticalOffset={Platform.select({ ios: 0, android: 0 })}
      >
        <View style={[styles.container, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={28} color="#fff" />
            </TouchableOpacity>

            <View style={styles.headerAvatar}>
              <Image
                source={{ uri: community?.logo }}
                style={styles.headerLogo}
                defaultSource={require('@/assets/images/icon.png')}
              />
            </View>

            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>
                {community?.name ?? name ?? 'Community'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {community?.memberCount ?? '1.8M members'}
              </Text>
            </View>

            <TouchableOpacity onPress={handleInfo} style={styles.infoButton}>
              <Ionicons name="information-circle-outline" size={26} color="#fff" />
            </TouchableOpacity>
          </View>

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
          />

          {/* Reply Preview */}
          {replyingTo && (
            <View style={styles.replyingContainer}>
              <View style={styles.replyingContent}>
                <Text style={styles.replyingLabel}>
                  Replying to {replyingTo.user.name}
                </Text>
                <Text style={styles.replyingText} numberOfLines={1}>
                  {replyingTo.text}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <Ionicons name="close" size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          )}

          {/* Input Area */}
          <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 8 }]}>
            <TouchableOpacity style={styles.addButton}>
              <Ionicons name="add" size={24} color="#9ca3af" />
            </TouchableOpacity>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your message"
                placeholderTextColor="#6b7280"
                value={inputText}
                onChangeText={setInputText}
                multiline
              />
            </View>

            {inputText.trim() ? (
              <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={styles.emojiButton}>
                  <Ionicons name="happy-outline" size={24} color="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.cameraButton}>
                  <Ionicons name="camera-outline" size={24} color="#9ca3af" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
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
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bubbleMe: {
    backgroundColor: '#1e3a5f',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#1f2937',
    borderBottomLeftRadius: 4,
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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    width: CARD_WIDTH,
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
    color: '#22c55e',
    fontFamily: 'Inter_400Regular',
  },
  sharedLabel: {
    fontSize: 11,
    color: '#6b7280',
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
});
