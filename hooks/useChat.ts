// hooks/useChat.ts
// Real-time messaging hook using WebSocket (STOMP)

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import * as SecureStore from 'expo-secure-store';
import api from '@/services/api';
import { Community, Message, User, CommunityInfo, Moderator, Member, LeaderboardEntry, MessageType, CommunityMessage, CommunityMessageDTO } from '@/types/chat';

// Current user (mock)
export const CURRENT_USER: User = {
  id: 'current-user',
  name: 'You',
  avatar: 'https://ui-avatars.com/api/?name=You&background=22c55e&color=fff',
};

// Mock users for the chat
const MOCK_USERS: Record<string, User> = {
  john: {
    id: 'user-john',
    name: 'John',
    avatar: 'https://ui-avatars.com/api/?name=John&background=3b82f6&color=fff',
  },
  sarah: {
    id: 'user-sarah',
    name: 'Sarah',
    avatar: 'https://ui-avatars.com/api/?name=Sarah&background=ec4899&color=fff',
  },
  mike: {
    id: 'user-mike',
    name: 'Mike',
    avatar: 'https://ui-avatars.com/api/?name=Mike&background=8b5cf6&color=fff',
  },
  jhon: {
    id: 'user-jhon',
    name: 'Jhon',
    avatar: 'https://ui-avatars.com/api/?name=Jhon&background=f59e0b&color=fff',
  },
};

// Mock communities list
const MOCK_COMMUNITIES: Community[] = [
  {
    id: 'psg-community',
    name: 'PSG COMMUNITY',
    lastMessage: 'You: Fun Match',
    lastMessageTime: '5:18 PM',
    logo: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg',
    memberCount: '1.8M members',
  },
  {
    id: 'arsenal-fans',
    name: 'ARSENAL FANS',
    lastMessage: 'Jhon: Alright Lads, predicitions for...',
    lastMessageTime: '5:18 PM',
    logo: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
    unreadCount: 3,
    memberCount: '2.1M members',
  },
  {
    id: 'real-madrid',
    name: 'REAL MADRID',
    lastMessage: 'Carlos: Hala Madrid!',
    lastMessageTime: '4:45 PM',
    logo: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
    unreadCount: 12,
    memberCount: '3.5M members',
  },
  {
    id: 'barcelona-fc',
    name: 'BARCELONA FC',
    lastMessage: 'Pedro: Visca el Barça!',
    lastMessageTime: '3:30 PM',
    logo: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
    memberCount: '3.2M members',
  },
  {
    id: 'liverpool-reds',
    name: 'LIVERPOOL REDS',
    lastMessage: 'Tom: YNWA forever!',
    lastMessageTime: '2:15 PM',
    logo: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
    unreadCount: 5,
    memberCount: '2.8M members',
  },
];

// Mock messages for PSG Community (matching the screenshot)
const MOCK_PSG_MESSAGES: Message[] = [
  {
    _id: 'msg-1',
    text: "Who's watching the match tonight?",
    createdAt: new Date('2024-12-16T10:30:00'),
    user: MOCK_USERS.john,
    messageType: 'text',
  },
  {
    _id: 'msg-2',
    text: "I am! Can't wait!",
    createdAt: new Date('2024-12-16T10:32:00'),
    user: MOCK_USERS.sarah,
    messageType: 'text',
    replyTo: {
      id: 'msg-1',
      originalText: "Who's watching the match tonight?",
      senderName: 'John',
    },
  },
  {
    _id: 'msg-3',
    text: 'Same here! Should be a great game',
    createdAt: new Date('2024-12-16T10:33:00'),
    user: CURRENT_USER,
    messageType: 'text',
  },
  {
    _id: 'msg-4',
    text: 'Great match tonight!',
    createdAt: new Date(),
    user: MOCK_USERS.mike,
    messageType: 'text',
  },
  {
    _id: 'msg-5',
    text: '',
    createdAt: new Date(),
    user: CURRENT_USER,
    messageType: 'match_bid',
    customData: {
      league: 'SERIE A',
      country: 'Italy',
      leagueLogo: 'https://upload.wikimedia.org/wikipedia/en/e/e1/Serie_A_logo_%282019%29.svg',
      homeTeam: 'PSG',
      awayTeam: 'Lorient',
      matchTime: '02:00 PM',
      homeLogo: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg',
      awayLogo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/6/6e/FC_Lorient_logo.svg/800px-FC_Lorient_logo.svg.png',
    },
  },
];

// Generic messages for other communities
const generateGenericMessages = (communityName: string): Message[] => [
  {
    _id: 'gen-msg-1',
    text: `Welcome to ${communityName}!`,
    createdAt: new Date('2024-12-16T09:00:00'),
    user: MOCK_USERS.john,
    messageType: 'system',
  },
  {
    _id: 'gen-msg-2',
    text: 'Great community here!',
    createdAt: new Date('2024-12-16T09:30:00'),
    user: MOCK_USERS.sarah,
    messageType: 'text',
  },
  {
    _id: 'gen-msg-3',
    text: "Let's discuss today's match!",
    createdAt: new Date('2024-12-16T10:00:00'),
    user: MOCK_USERS.mike,
    messageType: 'text',
  },
];

/**
 * Hook to fetch communities list
 */
export function useCommunities() {
  const [communities] = useState<Community[]>(MOCK_COMMUNITIES);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  const searchCommunities = useCallback((query: string) => {
    if (!query.trim()) return MOCK_COMMUNITIES;
    return MOCK_COMMUNITIES.filter((c) =>
      c.name.toLowerCase().includes(query.toLowerCase())
    );
  }, []);

  return {
    communities,
    loading,
    error,
    searchCommunities,
  };
}

/**
 * Hook to fetch messages for a specific community with real-time WebSocket support
 */
export function useChatMessages(communityId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<any>(null);

  // WebSocket configuration
  // Note: WebSocket endpoints are registered at root level, NOT under context-path
  // Even though REST API uses /api/v1, WebSocket is at /ws (root level)
  const IP_ADDRESS = '192.168.10.249'; // Same as API config
  const PORT = '8080';
  const WS_URL = `ws://${IP_ADDRESS}:${PORT}/ws`;

  // Fetch message history from REST API
  const fetchMessageHistory = useCallback(async () => {
    try {
      setLoading(true);
      // Try to fetch message history - adjust endpoint if needed
      try {
        const response = await api.get<CommunityMessage[]>(`/communities/${communityId}/messages`);
        if (response.data && Array.isArray(response.data)) {
          // Map backend CommunityMessage entities to frontend Message format
          const historyMessages: Message[] = response.data.map((msg: CommunityMessage, index: number) => ({
            _id: msg.id?.toString() || `hist-${index}`,
            text: msg.content || '',
            createdAt: msg.sentAt ? new Date(msg.sentAt) : new Date(),
            user: {
              id: msg.senderId?.toString() || 'unknown',
              name: msg.senderUsername || 'Unknown User',
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.senderUsername || 'User')}&background=3b82f6&color=fff`,
            },
            messageType: 'text' as MessageType,
          }));
          setMessages(historyMessages);
        }
      } catch (apiError: any) {
        // If endpoint doesn't exist, start with empty array
        console.log('Message history endpoint not available, starting fresh');
        setMessages([]);
      }
    } catch (err: any) {
      console.error('Error fetching message history:', err);
      setError(err.message || 'Failed to fetch message history');
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  // Initialize WebSocket connection
  useEffect(() => {
    let isMounted = true;

    const connectWebSocket = async () => {
      try {
        // Get JWT token from secure storage
        const token = await SecureStore.getItemAsync('jwt_token');
        if (!token) {
          console.error('No JWT token found for WebSocket connection');
          setError('Authentication required');
          return;
        }

        // Verify token is valid by testing with a REST API call
        try {
          const testResponse = await api.get('/users/session');
          console.log('✅ Token is valid, user:', testResponse.data?.username || testResponse.data?.email);
        } catch (tokenError: any) {
          console.error('❌ Token validation failed:', tokenError.response?.status, tokenError.response?.data);
          setError('Invalid or expired token. Please log in again.');
          return;
        }

        // Create STOMP client
        // Note: @stomp/stompjs automatically uses native WebSocket in React Native
        console.log('🔧 Creating STOMP client with token:', token ? 'Token present' : 'No token');
        const client = new Client({
          brokerURL: WS_URL,
          connectHeaders: {
            Authorization: `Bearer ${token}`, // Ensure space exists after "Bearer"
          },
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
          debug: (str) => {
            // Log STOMP debug messages for troubleshooting
            console.log('🔍 STOMP:', str);
          },
          // Force use of native WebSocket (not SockJS)
          webSocketFactory: () => {
            console.log('Creating WebSocket connection to:', WS_URL);
            const ws = new WebSocket(WS_URL);
            
            // Add event listeners for debugging
            ws.addEventListener('open', () => {
              console.log('✅ WebSocket opened successfully');
            });
            
            ws.addEventListener('error', (error) => {
              console.error('❌ WebSocket error event:', error);
            });
            
            ws.addEventListener('close', (event) => {
              console.log('🔌 WebSocket closed:', {
                code: event.code,
                reason: event.reason,
                wasClean: event.wasClean
              });
            });
            
            return ws;
          },
          onConnect: () => {
            if (!isMounted) return;
            console.log('✅ STOMP connected successfully');
            console.log('Client state:', {
              connected: client.connected,
              active: client.active
            });
            setConnected(true);
            setError(null);

            // Subscribe to community topic
            const subscription = client.subscribe(
              `/topic/community/${communityId}`,
              (message) => {
                try {
                  const data: CommunityMessageDTO = JSON.parse(message.body);
                  console.log('📨 Received message:', data);

                  // Map backend CommunityMessageDTO to frontend Message format
                  const newMessage: Message = {
                    _id: `msg-${Date.now()}-${Math.random()}`,
                    text: data.content || '',
                    createdAt: new Date(),
                    user: {
                      id: 'current', // Backend doesn't send sender ID in DTO
                      name: data.senderUsername || 'Unknown User',
                      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.senderUsername || 'User')}&background=3b82f6&color=fff`,
                    },
                    messageType: 'text' as MessageType,
                  };

                  setMessages((prev) => [...prev, newMessage]);
                } catch (err) {
                  console.error('Error parsing WebSocket message:', err);
                }
              }
            );

            subscriptionRef.current = subscription;
            console.log('✅ Subscribed to topic:', `/topic/community/${communityId}`);
          },
          onStompError: (frame) => {
            if (!isMounted) return;
            console.error('❌ STOMP error:', {
              command: frame.command,
              headers: frame.headers,
              body: frame.body,
              message: frame.headers['message'] || frame.body || 'STOMP connection failed'
            });
            const errorMsg = frame.headers['message'] || frame.body || 'STOMP connection failed. Check authentication.';
            setError(errorMsg);
            setConnected(false);
          },
          onWebSocketError: (event) => {
            if (!isMounted) return;
            console.error('WebSocket error:', event);
            // Extract more details from the error if available
            const errorMessage = event instanceof Error 
              ? event.message 
              : 'WebSocket connection failed. Please check your network connection and ensure the backend is running.';
            setError(errorMessage);
            setConnected(false);
          },
          onDisconnect: () => {
            if (!isMounted) return;
            console.log('WebSocket disconnected');
            setConnected(false);
          },
        });

        clientRef.current = client;
        console.log('🚀 Activating STOMP client...');
        client.activate();
        
        // Log connection state after a short delay to see if it connects
        setTimeout(() => {
          if (clientRef.current) {
            console.log('📊 Connection state after 2s:', {
              connected: clientRef.current.connected,
              active: clientRef.current.active
            });
          }
        }, 2000);
      } catch (err: any) {
        console.error('Error setting up WebSocket:', err);
        setError(err.message || 'Failed to connect to WebSocket');
        setConnected(false);
      }
    };

    // Fetch history first, then connect WebSocket
    fetchMessageHistory().then(() => {
      connectWebSocket();
    });

    // Cleanup on unmount
    return () => {
      isMounted = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
    };
  }, [communityId, WS_URL, fetchMessageHistory]);

  const sendMessage = useCallback(async (text: string, replyTo?: Message) => {
    // Check if client exists and is actually connected
    if (!clientRef.current) {
      console.error('❌ WebSocket client not initialized');
      setError('WebSocket client not initialized. Please wait for connection.');
      return;
    }

    // Check STOMP connection state (more reliable than our state)
    const isStompConnected = clientRef.current.connected;
    const isClientActive = clientRef.current.active;
    
    console.log('🔍 Send message check:', {
      isStompConnected,
      isClientActive,
      localConnectedState: connected,
      hasClient: !!clientRef.current
    });

    if (!isStompConnected) {
      console.error('❌ STOMP not connected. State:', {
        connected: isStompConnected,
        active: isClientActive,
        localState: connected
      });
      setError('Not connected to chat server. Please wait for connection to establish. The STOMP handshake may have failed - check authentication.');
      return;
    }

    try {
      // Get current user ID from token (you may need to decode JWT or get from storage)
      const token = await SecureStore.getItemAsync('jwt_token');
      // For now, we'll let the backend extract user from token
      // The payload structure matches CommunityMessageDTO
      // Note: senderUsername is set by backend from authenticated user, we only send content
      const payload: Pick<CommunityMessageDTO, 'content'> = {
        content: text,
      };

      console.log('Sending message to:', `/app/community/${communityId}/send`, payload);

      // Send message via WebSocket
      clientRef.current.publish({
        destination: `/app/community/${communityId}/send`,
        body: JSON.stringify(payload),
      });

      // Optimistically add message to UI (will be confirmed when received via subscription)
      const optimisticMessage: Message = {
        _id: `msg-${Date.now()}-optimistic`,
        text,
        createdAt: new Date(),
        user: CURRENT_USER,
        messageType: 'text',
        replyTo: replyTo
          ? {
              id: replyTo._id,
              originalText: replyTo.text,
              senderName: replyTo.user.name,
            }
          : undefined,
      };
      setMessages((prev) => [...prev, optimisticMessage]);
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message');
    }
  }, [communityId, connected]);

  const shareMatch = useCallback((matchData: Message['customData']) => {
    // For match sharing, we can send as a text message with JSON data
    // or create a custom message type if backend supports it
    const matchText = `Shared match: ${matchData?.homeTeam} vs ${matchData?.awayTeam}`;
    const newMessage: Message = {
      _id: `msg-${Date.now()}`,
      text: matchText,
      createdAt: new Date(),
      user: CURRENT_USER,
      messageType: 'match_bid',
      customData: matchData,
    };
    setMessages((prev) => [...prev, newMessage]);
    
    // Optionally send via WebSocket if backend supports custom message types
    // For now, just add to local state
    return newMessage;
  }, []);

  return {
    messages,
    loading,
    error,
    connected,
    sendMessage,
    shareMatch,
  };
}

/**
 * Hook to get community details by ID
 */
export function useCommunityDetails(communityId: string) {
  const community = MOCK_COMMUNITIES.find((c) => c.id === communityId);
  return {
    community: community ?? null,
    loading: false,
    error: community ? null : 'Community not found',
  };
}

// Mock moderators data
const MOCK_MODERATORS: Moderator[] = [
  {
    id: 'mod-1',
    name: 'Aisha Khan',
    avatar: 'https://ui-avatars.com/api/?name=Aisha+Khan&background=4ade80&color=fff',
    role: 'Admin',
  },
  {
    id: 'mod-2',
    name: 'Diego Silva',
    avatar: 'https://ui-avatars.com/api/?name=Diego+Silva&background=38bdf8&color=fff',
    role: 'Moderator',
  },
  {
    id: 'mod-3',
    name: 'Mina Okafor',
    avatar: 'https://ui-avatars.com/api/?name=Mina+Okafor&background=38bdf8&color=fff',
    role: 'Moderator',
  },
];

// Mock rules
const MOCK_RULES: string[] = [
  'Be respectful - zero tolerance for harassment',
  'No spam or self-promotion',
  'Keep discussions relevant to football',
  'No hate speech or discrimination',
  'Respect moderator decisions',
];

// Mock members data
const MOCK_MEMBERS: Member[] = [
  { id: 'mem-1', name: 'Michael Rouhana', avatar: 'https://ui-avatars.com/api/?name=Michael+Rouhana&background=38bdf8&color=fff', points: 1450 },
  { id: 'mem-2', name: 'Alex Carter', avatar: 'https://ui-avatars.com/api/?name=Alex+Carter&background=38bdf8&color=fff', points: 1240 },
  { id: 'mem-3', name: 'Ben Thompson', avatar: 'https://ui-avatars.com/api/?name=Ben+Thompson&background=38bdf8&color=fff', points: 1165 },
  { id: 'mem-4', name: 'Daniel Lee', avatar: 'https://ui-avatars.com/api/?name=Daniel+Lee&background=38bdf8&color=fff', points: 1012 },
  { id: 'mem-5', name: 'Sophia Martin', avatar: 'https://ui-avatars.com/api/?name=Sophia+Martin&background=38bdf8&color=fff', points: 960 },
  { id: 'mem-6', name: 'Liam Johnson', avatar: 'https://ui-avatars.com/api/?name=Liam+Johnson&background=38bdf8&color=fff', points: 912 },
  { id: 'mem-7', name: 'Emma Collins', avatar: 'https://ui-avatars.com/api/?name=Emma+Collins&background=38bdf8&color=fff', points: 874 },
  { id: 'mem-8', name: 'James Parker', avatar: 'https://ui-avatars.com/api/?name=James+Parker&background=38bdf8&color=fff', points: 823 },
];

// Mock leaderboard data
const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { id: 'lb-1', rank: 1, name: 'Alex Carter', avatar: 'https://ui-avatars.com/api/?name=Alex+Carter&background=38bdf8&color=fff', points: 1240 },
  { id: 'lb-2', rank: 2, name: 'Ben Thompson', avatar: 'https://ui-avatars.com/api/?name=Ben+Thompson&background=38bdf8&color=fff', points: 1165 },
  { id: 'lb-3', rank: 3, name: 'Daniel Lee', avatar: 'https://ui-avatars.com/api/?name=Daniel+Lee&background=38bdf8&color=fff', points: 1012 },
  { id: 'lb-4', rank: 4, name: 'Sophia Martin', avatar: 'https://ui-avatars.com/api/?name=Sophia+Martin&background=38bdf8&color=fff', points: 960 },
  { id: 'lb-5', rank: 5, name: 'Liam Johnson', avatar: 'https://ui-avatars.com/api/?name=Liam+Johnson&background=38bdf8&color=fff', points: 912 },
  { id: 'lb-6', rank: 6, name: 'Emma Collins', avatar: 'https://ui-avatars.com/api/?name=Emma+Collins&background=38bdf8&color=fff', points: 874 },
  { id: 'lb-7', rank: 7, name: 'James Parker', avatar: 'https://ui-avatars.com/api/?name=James+Parker&background=38bdf8&color=fff', points: 823 },
  { id: 'lb-8', rank: 8, name: 'Olivia Brown', avatar: 'https://ui-avatars.com/api/?name=Olivia+Brown&background=38bdf8&color=fff', points: 779 },
  { id: 'lb-9', rank: 9, name: 'Lucas Davis', avatar: 'https://ui-avatars.com/api/?name=Lucas+Davis&background=38bdf8&color=fff', points: 735 },
  { id: 'lb-10', rank: 10, name: 'Chloe Evans', avatar: 'https://ui-avatars.com/api/?name=Chloe+Evans&background=38bdf8&color=fff', points: 710 },
  { id: 'lb-11', rank: 11, name: 'Julien Laurent', avatar: 'https://ui-avatars.com/api/?name=Julien+Laurent&background=38bdf8&color=fff', points: 640 },
  { id: 'lb-12', rank: 12, name: 'Camille Dubois', avatar: 'https://ui-avatars.com/api/?name=Camille+Dubois&background=38bdf8&color=fff', points: 602 },
  { id: 'lb-13', rank: 13, name: 'Lucas Moreau', avatar: 'https://ui-avatars.com/api/?name=Lucas+Moreau&background=38bdf8&color=fff', points: 572 },
];

// Community info data map
const COMMUNITY_INFO_MAP: Record<string, CommunityInfo> = {
  'psg-community': {
    id: 'psg-community',
    name: 'PSG FANS',
    logo: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg',
    description: 'Official PSG fan chat - Discuss matches, share predictions, and connect with fellow fans!',
    location: 'United Kingdom',
    memberCount: '1.8M members',
    moderators: MOCK_MODERATORS,
    rules: MOCK_RULES,
    members: MOCK_MEMBERS,
    leaderboard: MOCK_LEADERBOARD,
  },
  'arsenal-fans': {
    id: 'arsenal-fans',
    name: 'ARSENAL FANS',
    logo: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
    description: 'The home for all Gunners! Discuss matches, transfers, and everything Arsenal.',
    location: 'London, UK',
    memberCount: '2.1M members',
    moderators: MOCK_MODERATORS,
    rules: MOCK_RULES,
    members: MOCK_MEMBERS,
    leaderboard: MOCK_LEADERBOARD,
  },
  'real-madrid': {
    id: 'real-madrid',
    name: 'REAL MADRID',
    logo: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
    description: 'Hala Madrid! Join fellow Madridistas to celebrate the greatest club in the world.',
    location: 'Madrid, Spain',
    memberCount: '3.5M members',
    moderators: MOCK_MODERATORS,
    rules: MOCK_RULES,
    members: MOCK_MEMBERS,
    leaderboard: MOCK_LEADERBOARD,
  },
};

/**
 * Hook to get full community info for the info screen
 */
export function useCommunityInfo(communityId: string) {
  const communityInfo = useMemo(() => {
    const info = COMMUNITY_INFO_MAP[communityId];
    if (info) return info;
    
    // Fallback for communities not in the map
    const community = MOCK_COMMUNITIES.find((c) => c.id === communityId);
    if (!community) return null;
    
    return {
      id: community.id,
      name: community.name,
      logo: community.logo,
      description: `Welcome to ${community.name}! Join fans from around the world.`,
      location: 'Worldwide',
      memberCount: community.memberCount ?? '1M members',
      moderators: MOCK_MODERATORS,
      rules: MOCK_RULES,
      members: MOCK_MEMBERS,
      leaderboard: MOCK_LEADERBOARD,
    } as CommunityInfo;
  }, [communityId]);

  return {
    communityInfo,
    loading: false,
    error: communityInfo ? null : 'Community not found',
  };
}

export { MOCK_COMMUNITIES, MOCK_PSG_MESSAGES, MOCK_MODERATORS, MOCK_MEMBERS, MOCK_LEADERBOARD };

