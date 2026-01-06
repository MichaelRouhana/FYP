import api from '@/services/api'; // Import your API client
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { setItem } from '@/utils/storage';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Login() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleLogin = async () => {
    // 1. Validation
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    // 2. API Call
    setLoading(true);
    try {
      // The backend expects "username" or "email". 
      // Based on LoginRequestDTO, check if it needs 'username' or 'email' key. 
      // Usually standard is { email, password } or { username, password }.
      // We will try sending 'email' as the username if backend requires that structure.
      const response = await api.post('/users/login', { 
        email: email, 
        password: password 
      });

      console.log("Login Success:", response.data);

      // 3. Save Token
      // Adjust 'accessToken' based on what your Swagger says (e.g. 'token', 'accessToken', 'jwt')
      const token = response.data.accessToken || response.data.token;
      
      if (token) {
        await setItem('jwt_token', token);
        // Optional: Save user info if needed
        // await setItem('user_info', JSON.stringify(response.data));
        
        router.replace('/(tabs)/home');
      } else {
        Alert.alert("Error", "Login failed: No token received");
      }

    } catch (error: any) {
      console.error("Login Error:", error.response?.data || error.message);
      Alert.alert(
        "Login Failed", 
        error.response?.data?.message || "Invalid credentials or server error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('@/images/Loginimage.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.welcomeText}>WELCOME BACK</Text>
            <Text style={styles.titleText}>LOGIN</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="Enter your email"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
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
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={24}
                    color="#9ca3af"
                  />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            {/* Login Button */}
            <TouchableOpacity 
              style={[styles.loginButton, loading && { opacity: 0.7 }]} 
              onPress={handleLogin} 
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.loginButtonText}>LOGIN</Text>
              )}
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/auth/register')}>
                <Text style={styles.signupLink}>SignUp</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity style={styles.qrButton} activeOpacity={0.8}>
              <MaterialCommunityIcons name="qrcode-scan" size={24} color="#23C55E" />
              <Text style={styles.qrButtonText}>Scan QR Code to Join</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

// ... Keep your existing styles (no changes needed below this line) ...
const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, justifyContent: 'space-between' },
  header: { alignItems: 'center', marginBottom: 40 },
  welcomeText: { fontSize: 32, fontFamily: 'Montserrat_900Black', color: '#ffffff', letterSpacing: 2, textTransform: 'uppercase' },
  titleText: { fontSize: 32, fontFamily: 'Montserrat_900Black', color: '#ffffff', letterSpacing: 2, textTransform: 'uppercase' },
  form: { flex: 1, justifyContent: 'center', gap: 16 },
  inputGroup: { gap: 8 },
  label: { fontSize: 15, fontFamily: 'Montserrat_400Regular', color: '#000000' },
  input: { backgroundColor: 'rgba(17, 24, 40, 0.73)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, fontSize: 15, fontFamily: 'Montserrat_400Regular', color: '#ffffff' },
  inputError: { borderWidth: 1, borderColor: '#ef4444' },
  passwordContainer: { position: 'relative' },
  passwordInput: { paddingRight: 50 },
  eyeButton: { position: 'absolute', right: 16, top: '50%', transform: [{ translateY: -12 }] },
  errorText: { color: '#ef4444', fontSize: 12, fontFamily: 'Montserrat_400Regular', marginTop: 4 },
  loginButton: { backgroundColor: '#23C55E', borderRadius: 50, borderWidth: 1, borderColor: '#20272F', paddingVertical: 18, alignItems: 'center', marginTop: 16 },
  loginButtonText: { color: '#000000', fontSize: 15, fontFamily: 'Montserrat_900Black', letterSpacing: 1 },
  signupContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  signupText: { color: '#ffffff', fontSize: 14, fontFamily: 'Montserrat_400Regular' },
  signupLink: { color: '#23C55E', fontSize: 14, fontFamily: 'Montserrat_600SemiBold' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  divider: { flex: 1, height: 1, backgroundColor: '#4b5563' },
  dividerText: { color: '#000000', paddingHorizontal: 16, fontSize: 14, fontFamily: 'Montserrat_400Regular' },
  qrButton: { backgroundColor: 'rgba(8, 12, 23, 0.66)', borderRadius: 50, borderWidth: 1, borderColor: '#23C55E', paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  qrButtonText: { color: '#23C55E', fontSize: 15, fontFamily: 'Montserrat_400Regular' },
});