import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Text } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientBackground } from '@/components/GradientBackground';
import { useTheme } from '@/context/ThemeContext';
import { useCommunityDetails } from '@/hooks/useChat';

export default function QRCodeScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const { community } = useCommunityDetails(id);

  const handleBack = () => {
    router.back();
  };

  const handleScanPress = () => {
    router.push('/community/scan');
  };

  // Generate QR value for the community
  const qrValue = JSON.stringify({
    type: 'community_invite',
    communityId: id,
    communityName: community?.name ?? name,
    timestamp: Date.now(),
  });

  return (
    <GradientBackground isDark={isDark}>
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.headerBackground }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={theme.colors.icon} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>QR CODE</Text>

          <TouchableOpacity style={styles.qrButton}>
            <Ionicons name="qr-code" size={24} color={theme.colors.icon} />
          </TouchableOpacity>
        </View>

        {/* QR Card */}
        <View style={[styles.qrCard, { 
          backgroundColor: theme.colors.cardBackground,
          borderColor: theme.colors.border 
        }]}>
          {/* Community Info */}
          <View style={styles.communityInfo}>
            <View style={[styles.communityAvatar, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]}>
              <Image
                source={{ uri: community?.logo }}
                style={styles.communityLogo}
                defaultSource={require('@/assets/images/icon.png')}
              />
            </View>
            <View style={styles.communityDetails}>
              <Text style={[styles.communityName, { color: theme.colors.text }]}>
                {community?.name ?? name ?? 'COMMUNITY'}
              </Text>
              <Text style={[styles.memberCount, { color: theme.colors.textSecondary }]}>
                {community?.memberCount ?? '1.8M members'}
              </Text>
            </View>
          </View>

          {/* QR Code */}
          <View style={styles.qrContainer}>
            <QRCode
              value={qrValue}
              size={260}
              backgroundColor="#fff"
              color="#000"
              logo={community?.logo ? { uri: community.logo } : undefined}
              logoSize={40}
              logoBackgroundColor="#fff"
              logoBorderRadius={20}
            />
          </View>

          {/* Scan Me Button */}
          <TouchableOpacity
            style={[styles.scanButton, {
              backgroundColor: isDark ? '#1a2234' : '#FFFFFF',
              borderColor: theme.colors.border
            }]}
            onPress={handleScanPress}
            activeOpacity={0.8}
          >
            <View style={styles.scanIconWrapper}>
              <View style={[styles.scanCorner, { borderColor: theme.colors.primary }]} />
              <View style={[styles.scanCorner, styles.scanCornerTR, { borderColor: theme.colors.primary }]} />
              <View style={[styles.scanCorner, styles.scanCornerBL, { borderColor: theme.colors.primary }]} />
              <View style={[styles.scanCorner, styles.scanCornerBR, { borderColor: theme.colors.primary }]} />
            </View>
            <Text style={[styles.scanText, { color: theme.colors.text }]}>SCAN ME</Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={[styles.instructionText, { color: theme.colors.textSecondary }]}>
            Share this QR code with friends to invite them to join the community
          </Text>
        </View>
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
  qrCard: {
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
  },
  communityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  communityAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  communityLogo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  communityDetails: {
    marginLeft: 14,
  },
  communityName: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.5,
  },
  memberCount: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  qrContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 20,
    borderWidth: 1,
  },
  scanIconWrapper: {
    width: 20,
    height: 20,
    position: 'relative',
    marginRight: 10,
  },
  scanCorner: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    top: 0,
    left: 0,
  },
  scanCornerTR: {
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderLeftWidth: 0,
    top: 0,
    right: 0,
    left: 'auto',
  },
  scanCornerBL: {
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderTopWidth: 0,
    bottom: 0,
    top: 'auto',
    left: 0,
  },
  scanCornerBR: {
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    bottom: 0,
    top: 'auto',
    right: 0,
    left: 'auto',
  },
  scanText: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 1,
  },
  instructions: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  instructionText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
});

