import { countries } from '@/constants/countries';
import api from '@/services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Register() {
  const insets = useSafeAreaInsets();
  
  // Added "Name" field as most backends require it
  const [username, setUsername] = useState(''); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [country, setCountry] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [errors, setErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSignup = async () => {
    const newErrors: typeof errors = {};

    if (!username.trim()) newErrors.username = 'Username is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!validateEmail(email)) newErrors.email = 'Invalid email format';
    
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Min 6 characters required';
    
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      // Backend Call
      await api.post('/users/signup', {
        username: username,
        email: email,
        password: password,
        country: country || 'Lebanon', // Default if empty
        // Add other fields if your DTO requires them (e.g., firstName, lastName)
      });

      Alert.alert(
        "Success", 
        "Account created! Please check your email to verify your account before logging in.",
        [{ text: "OK", onPress: () => router.replace('/auth/login') }]
      );

    } catch (error: any) {
      console.error("Signup Error:", error.response?.data);
      Alert.alert("Registration Failed", error.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const filteredCountries = countries.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const selectedCountry = countries.find((c) => c.code === country);

  return (
    <ImageBackground source={require('@/images/Loginimage.jpg')} style={styles.backgroundImage} resizeMode="cover">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            <Text style={styles.welcomeText}>WELCOME</Text>
            <Text style={styles.titleText}>SIGNUP</Text>
          </View>

          <View style={styles.form}>
            {/* Username Field (Added) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={[styles.input, errors.username && styles.inputError]}
                placeholder="Choose a username"
                placeholderTextColor="#9ca3af"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
              {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
            </View>

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="Enter your email"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
                  placeholder="Enter your password"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                  <MaterialCommunityIcons name={showPassword ? 'eye-off' : 'eye'} size={24} color="#9ca3af" />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            {/* Confirm Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput, errors.confirmPassword && styles.inputError]}
                  placeholder="Confirm your password"
                  placeholderTextColor="#9ca3af"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <MaterialCommunityIcons name={showConfirmPassword ? 'eye-off' : 'eye'} size={24} color="#9ca3af" />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>

            {/* Country Picker */}
            <TouchableOpacity style={styles.countryButton} onPress={() => setShowCountryPicker(true)} activeOpacity={0.8}>
              <MaterialCommunityIcons name="soccer" size={24} color="#9ca3af" />
              <Text style={[styles.countryButtonText, selectedCountry && styles.countrySelected]}>
                {selectedCountry ? selectedCountry.name : 'Country (optional)'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={24} color="#9ca3af" />
            </TouchableOpacity>

            {/* Signup Button */}
            <TouchableOpacity style={styles.signupButton} onPress={handleSignup} activeOpacity={0.8} disabled={loading}>
              {loading ? <ActivityIndicator color="#000"/> : <Text style={styles.signupButtonText}>SIGNUP</Text>}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/auth/login')}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Country Modal */}
      <Modal visible={showCountryPicker} animationType="slide" transparent={true} onRequestClose={() => setShowCountryPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <TextInput style={styles.searchInput} placeholder="Search countries..." placeholderTextColor="#9ca3af" value={searchQuery} onChangeText={setSearchQuery} />
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.countryItem, country === item.code && styles.countryItemSelected]}
                  onPress={() => { setCountry(item.code); setShowCountryPicker(false); setSearchQuery(''); }}
                >
                  <Text style={[styles.countryItemText, country === item.code && styles.countryItemTextSelected]}>{item.name}</Text>
                  {country === item.code && <MaterialCommunityIcons name="check" size={20} color="#23C55E" />}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24 },
  header: { alignItems: 'center', marginBottom: 24 },
  welcomeText: { fontSize: 32, fontFamily: 'Montserrat_900Black', color: '#ffffff', letterSpacing: 2, textTransform: 'uppercase' },
  titleText: { fontSize: 32, fontFamily: 'Montserrat_900Black', color: '#ffffff', letterSpacing: 2, textTransform: 'uppercase' },
  form: { flex: 1, gap: 12 },
  inputGroup: { gap: 6 },
  label: { fontSize: 15, fontFamily: 'Montserrat_400Regular', color: '#000000' },
  input: { backgroundColor: 'rgba(17, 24, 40, 0.73)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, fontSize: 15, fontFamily: 'Montserrat_400Regular', color: '#ffffff' },
  inputError: { borderWidth: 1, borderColor: '#ef4444' },
  passwordContainer: { position: 'relative' },
  passwordInput: { paddingRight: 50 },
  eyeButton: { position: 'absolute', right: 16, top: '50%', transform: [{ translateY: -12 }] },
  errorText: { color: '#ef4444', fontSize: 12, fontFamily: 'Montserrat_400Regular', marginTop: 2 },
  countryButton: { backgroundColor: 'rgba(17, 24, 40, 0.73)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  countryButtonText: { flex: 1, fontSize: 15, fontFamily: 'Montserrat_400Regular', color: '#9ca3af' },
  countrySelected: { color: '#ffffff' },
  signupButton: { backgroundColor: '#23C55E', borderRadius: 50, borderWidth: 1, borderColor: '#20272F', paddingVertical: 18, alignItems: 'center', marginTop: 12 },
  signupButtonText: { color: '#000000', fontSize: 15, fontFamily: 'Montserrat_900Black', letterSpacing: 1 },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  loginText: { color: '#ffffff', fontSize: 14, fontFamily: 'Montserrat_400Regular' },
  loginLink: { color: '#23C55E', fontSize: 14, fontFamily: 'Montserrat_600SemiBold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1f2937', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingHorizontal: 24, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontFamily: 'Montserrat_700Bold', color: '#ffffff' },
  searchInput: { backgroundColor: 'rgba(17, 24, 40, 0.73)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, fontFamily: 'Montserrat_400Regular', color: '#ffffff', marginBottom: 16 },
  countryItem: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  countryItemSelected: { backgroundColor: 'rgba(17, 24, 40, 0.73)' },
  countryItemText: { fontSize: 15, fontFamily: 'Montserrat_400Regular', color: '#ffffff' },
  countryItemTextSelected: { color: '#23C55E', fontFamily: 'Montserrat_600SemiBold' },
});