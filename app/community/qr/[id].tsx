import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Text } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/context/ThemeContext';

export default function QRCodeScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { id, name, inviteCode } = useLocalSearchParams<{ 
    id: string; 
    name: string; 
    inviteCode?: string;
  }>();

  const handleBack = () => {
    router.back();
  };

  // If inviteCode is missing, null, undefined, or string 'null'/'undefined', show error message
  if (!inviteCode || inviteCode === 'null' || inviteCode === 'undefined') {
    return (
      <View style={[styles.container, { 
        paddingTop: insets.top, 
        backgroundColor: '#030712',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
      }]}>
        <View style={[styles.header, { backgroundColor: 'transparent' }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={isDark ? '#F9FAFB' : '#18223A'} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
        </View>
        
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          <Text style={[styles.errorTitle, { color: '#F9FAFB' }]}>
            No Invite Code Available
          </Text>
          <Text style={[styles.errorText, { color: '#9ca3af' }]}>
            No Invite Code available for this community.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: '#030712' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: 'transparent' }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#F9FAFB" />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Community Name - H1 Style */}
        <Text style={styles.communityNameTitle}>
          {name || 'COMMUNITY'}
        </Text>

        {/* QR Code Container */}
        <View style={styles.qrWrapper}>
          <View style={styles.qrContainer}>
            {inviteCode && inviteCode !== 'null' && inviteCode !== 'undefined' ? (
              <QRCode
                value={inviteCode}
                size={200}
                backgroundColor="#FFFFFF"
                color="#000000"
              />
            ) : (
              <View style={styles.unavailableContainer}>
                <Text style={styles.unavailableText}>Code Unavailable</Text>
              </View>
            )}
          </View>

          {/* Instruction Text */}
          {inviteCode && inviteCode !== 'null' && inviteCode !== 'undefined' ? (
            <Text style={styles.instructionText}>
              Scan this code to join
            </Text>
          ) : (
            <Text style={styles.instructionText}>
              Invite code is not available for this community
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  communityNameTitle: {
    fontSize: 32,
    fontFamily: 'Montserrat_700Bold',
    color: '#F9FAFB',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 48,
    marginTop: 20,
  },
  qrWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  qrContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  instructionText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontFamily: 'Montserrat_700Bold',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  unavailableContainer: {
    height: 200,
    width: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unavailableText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#9ca3af',
    textAlign: 'center',
  },
});

