import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/context/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCAN_AREA_SIZE = SCREEN_WIDTH * 0.7; // 70% of screen width

export default function QRScannerScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleOpenSettings = () => {
    Linking.openSettings();
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return; // Prevent multiple scans
    setScanned(true);

    try {
      const parsed = JSON.parse(data);
      
      // Validate the QR code structure
      if (parsed.type === 'community_invite' && parsed.communityId) {
        // Show alert
        Alert.alert(
          'Joining Community...',
          `Joining ${parsed.communityName || 'Community'}...`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to community chat
                router.push({
                  pathname: '/community/chat/[id]',
                  params: {
                    id: parsed.communityId,
                    name: parsed.communityName || 'Community',
                  },
                });
              },
            },
          ]
        );
      } else {
        Alert.alert('Invalid QR Code', 'This QR code is not a valid community invite.');
        setScanned(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to parse QR code. Please try again.');
      setScanned(false);
    }
  };

  // Permission denied or not granted
  if (!permission) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { backgroundColor: theme.colors.headerBackground }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={theme.colors.icon} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>QR SCANNER</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.permissionContainer}>
          <Text style={[styles.permissionText, { color: theme.colors.text }]}>
            Camera permission is required to scan QR codes.
          </Text>
          <TouchableOpacity
            style={[styles.settingsButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleOpenSettings}
          >
            <Text style={[styles.settingsButtonText, { color: theme.colors.primaryText }]}>
              Open Settings
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { backgroundColor: theme.colors.headerBackground }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={theme.colors.icon} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>QR SCANNER</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={[styles.permissionText, { color: theme.colors.text }]}>
            We need your permission to use the camera to scan QR codes.
          </Text>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: theme.colors.primary }]}
            onPress={requestPermission}
          >
            <Text style={[styles.permissionButtonText, { color: theme.colors.primaryText }]}>
              Grant Permission
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: theme.colors.headerBackground }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={theme.colors.icon} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>QR SCANNER</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Camera View */}
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Top overlay */}
          <View style={[styles.overlayTop, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)' }]} />
          
          {/* Middle section with scan area */}
          <View style={styles.overlayMiddle}>
            <View style={[styles.overlaySide, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)' }]} />
            <View style={styles.scanArea}>
              {/* Corner indicators */}
              <View style={[styles.corner, styles.cornerTopLeft, { borderColor: theme.colors.primary }]} />
              <View style={[styles.corner, styles.cornerTopRight, { borderColor: theme.colors.primary }]} />
              <View style={[styles.corner, styles.cornerBottomLeft, { borderColor: theme.colors.primary }]} />
              <View style={[styles.corner, styles.cornerBottomRight, { borderColor: theme.colors.primary }]} />
            </View>
            <View style={[styles.overlaySide, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)' }]} />
          </View>

          {/* Bottom overlay */}
          <View style={[styles.overlayBottom, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)' }]}>
            <Text style={[styles.instructionText, { color: '#ffffff' }]}>
              Position the QR code within the frame
            </Text>
            {scanned && (
              <TouchableOpacity
                style={[styles.scanAgainButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => setScanned(false)}
              >
                <Text style={[styles.scanAgainText, { color: theme.colors.primaryText }]}>
                  Scan Again
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 1,
  },
  headerRight: {
    width: 36,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayTop: {
    flex: 1,
  },
  overlayMiddle: {
    flexDirection: 'row',
    width: SCREEN_WIDTH,
    height: SCAN_AREA_SIZE,
  },
  overlaySide: {
    flex: 1,
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderWidth: 3,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  overlayBottom: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 30,
  },
  instructionText: {
    fontSize: 16,
    fontFamily: 'Montserrat_500Medium',
    textAlign: 'center',
    marginBottom: 20,
  },
  scanAgainButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  scanAgainText: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  permissionText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
  },
  settingsButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  settingsButtonText: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
  },
});

