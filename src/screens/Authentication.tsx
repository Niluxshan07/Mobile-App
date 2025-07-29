import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useThemedStyles } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';

interface AuthenticationProps {
  onLogin: (username: string, password: string, rememberMe: boolean) => Promise<boolean>;
}

const Authentication: React.FC<AuthenticationProps> = ({ onLogin }) => {
  const styles = useThemedStyles(createStyles);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    setLoading(true);
    try {
      const success = await onLogin(username, password, rememberMe);
      if (!success) {
        Alert.alert('Error', 'Invalid username or password');
      }
    } catch (err) {
      Alert.alert('Error', 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Gradient Background */}
      <View style={styles.gradientBackground}>
        <View style={styles.gradientLayer1} />
        <View style={styles.gradientLayer2} />
        <View style={styles.gradientLayer3} />
      </View>

      {/* Decorative Curved Elements */}
      <View style={styles.decorativeCurve1} />
      <View style={styles.decorativeCurve2} />

      {/* Content */}
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Login Card */}
            <View style={styles.loginCard}>
              {/* Logo and Title */}
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <Image
                    source={require('../assets/bug-tracking.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.title}>ZEROBUG</Text>
                <Text style={styles.subtitle}>DefectTracker</Text>
                <Text style={styles.tagline}>Sign in to your account</Text>
              </View>

              {/* Form */}
              <View style={styles.form}>
                {/* Username Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Username</Text>
                  <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Enter your username"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter your password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Text style={styles.eyeIcon}>
                        {showPassword ? 'Hide' : 'Show'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Remember Me and Forgot Password */}
                <View style={styles.optionsContainer}>
                  <TouchableOpacity
                    style={styles.rememberMeContainer}
                    onPress={() => setRememberMe(!rememberMe)}
                  >
                    <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                      {rememberMe && <Text style={styles.checkmark}>X</Text>}
                    </View>
                    <Text style={styles.rememberMeText}>Remember Me</Text>
                  </TouchableOpacity>

                  <TouchableOpacity>
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>

                {/* Login Button */}
                <TouchableOpacity
                  style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.loginButtonText}>Sign In</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Demo Credentials */}
              <View style={styles.demoContainer}>
                <Text style={styles.demoTitle}>Demo Credentials:</Text>
                <Text style={styles.demoText}>Username: admin</Text>
                <Text style={styles.demoText}>Password: admin</Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const createStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.grouped,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '65%',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    overflow: 'hidden',
  },
  gradientLayer1: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: colors.gradient.primary[0],
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  gradientLayer2: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '70%',
    backgroundColor: colors.gradient.primary[1],
    opacity: 0.8,
    borderBottomLeftRadius: 45,
    borderBottomRightRadius: 45,
  },
  gradientLayer3: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: colors.gradient.primary[2],
    opacity: 0.6,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  loginCard: {
    backgroundColor: colors.background.elevated,
    borderRadius: 25,
    padding: 32,
    marginTop: 60,
    shadowColor: isDark ? colors.system.gray6 : '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: isDark ? 0.4 : 0.2,
    shadowRadius: 25,
    elevation: 20,
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.border,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.text.primary,
    marginBottom: 8,
    letterSpacing: 2,
    fontFamily: 'System',
    textShadowColor: 'rgba(59, 130, 246, 0.3)',
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 3,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.system.blue,
    marginBottom: 12,
    letterSpacing: 1.5,
    fontFamily: 'System',
    textShadowColor: 'rgba(59, 130, 246, 0.2)',
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 2,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
    textAlign: 'center',
    letterSpacing: 0.5,
    fontFamily: 'System',
    opacity: 0.8,
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F8FAFC',
    color: '#1F2937',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  eyeButton: {
    padding: 16,
  },
  eyeIcon: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rememberMeText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  demoContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  demoTitle: {
    fontSize: 14,
    color: '#0369A1',
    marginBottom: 8,
    fontWeight: '600',
  },
  demoText: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '500',
  },
  // Decorative Curved Elements
  decorativeCurve1: {
    position: 'absolute',
    top: '45%',
    right: -50,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.6,
  },
  decorativeCurve2: {
    position: 'absolute',
    top: '55%',
    left: -40,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    opacity: 0.5,
  },
});

export default Authentication;