// app/community/create.tsx
// Modal screen for creating a new community (Admin only)

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { createCommunity, CommunityRequestDTO } from '@/services/communityApi';

export default function CreateCommunityScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  
  const [name, setName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Community name is required');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Validation Error', 'Community description is required');
      return;
    }

    setLoading(true);
    try {
      const requestData: CommunityRequestDTO = {
        name: name.trim(),
        description: description.trim(),
        shortDescription: shortDescription.trim() || undefined,
        isPrivate,
        logoUrl: logoUrl.trim() || undefined,
      };

      await createCommunity(requestData);
      
      Alert.alert('Success', 'Community created successfully!', [
        {
          text: 'OK',
          onPress: () => {
            router.back();
            // The useCommunities hook should automatically refresh
          },
        },
      ]);
    } catch (error: any) {
      console.error('[CreateCommunity] Error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create community';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: isDark ? '#030712' : '#F3F4F6' }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={28} color={isDark ? '#F9FAFB' : '#18223A'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#F9FAFB' : '#18223A' }]}>
          Create Community
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Name Field */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: isDark ? '#F9FAFB' : '#18223A' }]}>
            Community Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? '#111827' : '#FFFFFF',
                color: isDark ? '#F9FAFB' : '#18223A',
                borderColor: isDark ? '#1f2937' : '#E5E7EB',
              },
            ]}
            placeholder="Enter community name"
            placeholderTextColor={isDark ? '#6b7280' : '#9CA3AF'}
            value={name}
            onChangeText={setName}
            maxLength={100}
          />
        </View>

        {/* Short Description Field */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: isDark ? '#F9FAFB' : '#18223A' }]}>
            Short Description
          </Text>
          <Text style={[styles.hint, { color: isDark ? '#9ca3af' : '#6B7280' }]}>
            A brief 1-2 line description
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? '#111827' : '#FFFFFF',
                color: isDark ? '#F9FAFB' : '#18223A',
                borderColor: isDark ? '#1f2937' : '#E5E7EB',
              },
            ]}
            placeholder="Brief description (optional)"
            placeholderTextColor={isDark ? '#6b7280' : '#9CA3AF'}
            value={shortDescription}
            onChangeText={setShortDescription}
            maxLength={200}
          />
        </View>

        {/* Full Description Field */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: isDark ? '#F9FAFB' : '#18223A' }]}>
            Full Description <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: isDark ? '#111827' : '#FFFFFF',
                color: isDark ? '#F9FAFB' : '#18223A',
                borderColor: isDark ? '#1f2937' : '#E5E7EB',
              },
            ]}
            placeholder="Detailed description of the community"
            placeholderTextColor={isDark ? '#6b7280' : '#9CA3AF'}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={1000}
          />
        </View>

        {/* Logo URL Field */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: isDark ? '#F9FAFB' : '#18223A' }]}>
            Logo URL
          </Text>
          <Text style={[styles.hint, { color: isDark ? '#9ca3af' : '#6B7280' }]}>
            Optional: URL to community logo image
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? '#111827' : '#FFFFFF',
                color: isDark ? '#F9FAFB' : '#18223A',
                borderColor: isDark ? '#1f2937' : '#E5E7EB',
              },
            ]}
            placeholder="https://example.com/logo.png"
            placeholderTextColor={isDark ? '#6b7280' : '#9CA3AF'}
            value={logoUrl}
            onChangeText={setLogoUrl}
            keyboardType="url"
            autoCapitalize="none"
          />
        </View>

        {/* Private Community Toggle */}
        <View style={[styles.section, styles.toggleSection]}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleContent}>
              <Text style={[styles.label, { color: isDark ? '#F9FAFB' : '#18223A' }]}>
                Private Community
              </Text>
              <Text style={[styles.hint, { color: isDark ? '#9ca3af' : '#6B7280' }]}>
                Only members can view and join
              </Text>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              trackColor={{ false: isDark ? '#374151' : '#D1D5DB', true: '#22c55e' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[
            styles.createButton,
            {
              backgroundColor: loading ? (isDark ? '#374151' : '#D1D5DB') : '#22c55e',
            },
          ]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.createButtonText}>CREATE COMMUNITY</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
  },
  headerRight: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontFamily: 'Montserrat_600SemiBold',
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Montserrat_400Regular',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Montserrat_400Regular',
    minHeight: 120,
  },
  toggleSection: {
    marginBottom: 32,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleContent: {
    flex: 1,
    marginRight: 16,
  },
  createButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.5,
  },
});

