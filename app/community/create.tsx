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
  Image,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/context/ThemeContext';
import { createCommunity, CommunityRequestDTO } from '@/services/communityApi';

export default function CreateCommunityScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  
  const [name, setName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImageFromLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Photo library permission is required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        ...(ImagePicker.MediaType && { mediaTypes: ImagePicker.MediaType.Images }),
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error picking image from library:', err);
      Alert.alert('Error', 'Failed to pick image from library');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        ...(ImagePicker.MediaType && { mediaTypes: ImagePicker.MediaType.Images }),
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error taking photo:', err);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

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
      };

      await createCommunity(requestData, selectedImage);
      
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
      
      // Handle 413 Payload Too Large error specifically
      if (error.response?.status === 413) {
        Alert.alert(
          'File Too Large',
          'The image is too large. Please select an image under 10MB.',
          [{ text: 'OK' }]
        );
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to create community';
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
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

        {/* Logo Image Picker */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: isDark ? '#F9FAFB' : '#18223A' }]}>
            Community Logo
          </Text>
          <Text style={[styles.hint, { color: isDark ? '#9ca3af' : '#6B7280' }]}>
            Optional: Upload a square logo image
          </Text>
          
          {/* Image Preview */}
          <View style={styles.imageContainer}>
            {selectedImage ? (
              <View style={styles.imageWrapper}>
                <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setSelectedImage(null)}
                >
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.placeholderContainer, { backgroundColor: isDark ? '#111827' : '#FFFFFF', borderColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
                <Ionicons name="image-outline" size={48} color={isDark ? '#6b7280' : '#9CA3AF'} />
                <Text style={[styles.placeholderText, { color: isDark ? '#6b7280' : '#9CA3AF' }]}>
                  No image selected
                </Text>
              </View>
            )}
          </View>

          {/* Image Picker Buttons */}
          <View style={styles.imagePickerButtons}>
            <TouchableOpacity
              style={[styles.imagePickerButton, { backgroundColor: isDark ? '#111827' : '#FFFFFF', borderColor: isDark ? '#1f2937' : '#E5E7EB' }]}
              onPress={pickImageFromLibrary}
            >
              <Ionicons name="images-outline" size={20} color={isDark ? '#F9FAFB' : '#18223A'} />
              <Text style={[styles.imagePickerButtonText, { color: isDark ? '#F9FAFB' : '#18223A' }]}>
                Choose from Library
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.imagePickerButton, { backgroundColor: isDark ? '#111827' : '#FFFFFF', borderColor: isDark ? '#1f2937' : '#E5E7EB' }]}
              onPress={takePhoto}
            >
              <Ionicons name="camera-outline" size={20} color={isDark ? '#F9FAFB' : '#18223A'} />
              <Text style={[styles.imagePickerButtonText, { color: isDark ? '#F9FAFB' : '#18223A' }]}>
                Take Photo
              </Text>
            </TouchableOpacity>
          </View>
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
    </>
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
  imageContainer: {
    marginBottom: 12,
  },
  imageWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    alignSelf: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 2,
  },
  placeholderContainer: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
    marginTop: 8,
  },
  imagePickerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imagePickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  imagePickerButtonText: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
  },
});

