import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Dimensions,
  Image,
  PanResponder,
  Animated,
  BackHandler,
} from 'react-native';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface SettingsProps {
  user: User | null;
  onNavigateBack: () => void;
  onLogout: () => void;
  onNavigateToProfile: () => void;
}

const { height } = Dimensions.get('window');

const Settings: React.FC<SettingsProps> = ({ user, onNavigateBack, onLogout, onNavigateToProfile }) => {
  const { isDark, toggleTheme, colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  // Settings state
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  // Animation values for fast 3D swipe with background visibility
  const translateX = useRef(new Animated.Value(0)).current;
  const rotateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  // Handle phone back button
  useEffect(() => {
    const backAction = () => {
      onNavigateBack(); // Navigate back to home screen
      return true; // Prevent default back behavior
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [onNavigateBack]);

  // Create PanResponder for swipe gesture with animation
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Only respond to horizontal swipes that are significant
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 20;
    },
    onPanResponderMove: (evt, gestureState) => {
      // Fast 3D swipe animation with background visibility (only for right swipes)
      if (gestureState.dx > 0) {
        const progress = Math.min(gestureState.dx / 150, 1); // Very fast progress (150px vs 200px)
        
        // Fast horizontal translation
        translateX.setValue(gestureState.dx * 1.2); // Increased for faster movement
        
        // 3D rotation for depth effect
        rotateY.setValue(progress * -25); // Subtle rotation for 3D effect
        
        // Slight scale for perspective
        scale.setValue(1 - (progress * 0.05)); // Minimal scale change
        
        // Reduced opacity to show background (not complete fade)
        opacity.setValue(1 - (progress * 0.4)); // Only 40% fade to keep background visible
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      // Check if it's a left-to-right swipe (positive dx) and significant distance
      if (gestureState.dx > 100 && Math.abs(gestureState.dy) < 100) {
        // Very fast 3D swipe completion with background visibility
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: 400, // Increased distance for dramatic effect
            duration: 100, // Very fast - reduced to 100ms
            useNativeDriver: true,
          }),
          Animated.timing(rotateY, {
            toValue: -35, // Complete the 3D rotation
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.9, // Final scale for depth
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.2, // Keep some visibility for background effect
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onNavigateBack();
        });
      } else {
        // Very fast spring back to original position
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            tension: 200, // Very high tension for instant snap
            friction: 5,  // Low friction for quick return
            useNativeDriver: true,
          }),
          Animated.spring(rotateY, {
            toValue: 0,
            tension: 200,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            tension: 200,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.spring(opacity, {
            toValue: 1,
            tension: 200,
            friction: 5,
            useNativeDriver: true,
          }),
        ]).start();
      }
    },
  });



  const SettingItem = ({
    title,
    subtitle,
    value,
    onValueChange,
    type = 'switch'
  }: {
    title: string;
    subtitle?: string;
    value?: boolean;
    onValueChange?: (value: boolean) => void;
    type?: 'switch' | 'button';
  }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {type === 'switch' && (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{
            false: isDark ? colors.system.gray5 : colors.system.gray4,
            true: colors.system.blue
          }}
          thumbColor={value ? colors.background.primary : colors.system.gray2}
        />
      )}
    </View>
  );

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [
            { perspective: 1000 }, // 3D perspective
            { translateX },
            { rotateY: rotateY.interpolate({
                inputRange: [-35, 0],
                outputRange: ['-35deg', '0deg'],
              })
            },
            { scale },
          ],
          opacity,
        }
      ]} 
      {...panResponder.panHandlers}
    >
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
        {/* Header */}
        {/* Settings Title - Moved to Top */}
        <View style={styles.titleContainer}>
          <Text style={styles.screenTitle}>Settings</Text>
          <Text style={styles.screenSubtitle}>Customize your DefectTracker experience</Text>
        </View>

        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <View style={styles.headerSpacer} />
        </View>

        {/* Settings Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Common Settings Panel */}
          <View style={styles.commonSettingsPanel}>
            {/* Account Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account</Text>
              <View style={styles.sectionCard}>
                <View style={styles.accountInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{user?.username?.charAt(0).toUpperCase() || 'U'}</Text>
                  </View>
                  <View style={styles.accountDetails}>
                    <Text style={styles.accountName}>{user?.username || 'User'}</Text>
                    <Text style={styles.accountEmail}>{user?.email || 'user@example.com'}</Text>
                    <Text style={styles.accountRole}>{user?.role || 'Developer'}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Notifications Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notifications</Text>
              <View style={styles.sectionCard}>
                <SettingItem
                  title="Enable Notifications"
                  subtitle="Receive notifications about defect updates"
                  value={notifications}
                  onValueChange={setNotifications}
                />
                <SettingItem
                  title="Email Alerts"
                  subtitle="Get email notifications for critical defects"
                  value={emailAlerts}
                  onValueChange={setEmailAlerts}
                />
                <SettingItem
                  title="Push Notifications"
                  subtitle="Receive push notifications on your device"
                  value={pushNotifications}
                  onValueChange={setPushNotifications}
                />
              </View>
            </View>

            {/* Appearance Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Appearance</Text>
              <View style={styles.sectionCard}>
                <SettingItem
                  title="Dark Mode"
                  subtitle="Use dark theme for better viewing in low light"
                  value={isDark}
                  onValueChange={toggleTheme}
                />
              </View>
            </View>
          </View>

          {/* Logout Section */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
              <Text style={styles.logoutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          {/* App Info */}
          <View style={styles.appInfo}>
            <Text style={styles.appInfoText}>ZeroBug DefectTracker</Text>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </ScrollView>

        {/* Footer Navigation */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.footerButton} onPress={onNavigateBack}>
            <Image
              source={require('../assets/home.png')}
              style={styles.footerIcon}
              resizeMode="cover"
            />
            <Text style={styles.footerText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerButton} onPress={onNavigateToProfile}>
            <Image
              source={require('../assets/user.png')}
              style={styles.footerIcon}
              resizeMode="cover"
            />
            <Text style={styles.footerText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerButton}>
            <Image
              source={require('../assets/settings.png')}
              style={[styles.footerIcon, styles.activeFooterIcon]}
              resizeMode="cover"
            />
            <Text style={[styles.footerText, styles.activeFooterText]}>Settings</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Animated.View>
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
    height: height * 0.4,
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
    paddingTop: 20,
  },
  headerSpacer: {
    width: 50,
    height: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
    paddingHorizontal: 12,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  screenSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
  },
  commonSettingsPanel: {
    backgroundColor: colors.background.elevated,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: isDark ? colors.system.gray6 : '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.border,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: isDark ? colors.background.secondary : colors.background.primary,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: isDark ? colors.border : colors.separator,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.system.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.background.primary,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  accountEmail: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  accountRole: {
    fontSize: 12,
    color: colors.system.blue,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  logoutButton: {
    backgroundColor: colors.system.red,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background.primary,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  appInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  versionText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  // Footer Styles
  footer: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: colors.system.blue,
    shadowOffset: {
      width: 0,
      height: -6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 12,
    borderTopWidth: 4,
    borderTopColor: colors.system.blue,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderLeftColor: colors.system.blue,
    borderRightColor: colors.system.blue,
  },
  footerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  footerIcon: {
    width: 20,
    height: 20,
    marginBottom: 2,
    tintColor: colors.text.tertiary,
  },
  footerText: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  activeFooterIcon: {
    tintColor: colors.system.blue,
  },
  activeFooterText: {
    color: colors.system.blue,
    fontWeight: '600',
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

export default Settings;
