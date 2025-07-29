import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  Image,
  PanResponder,
  Animated,
  BackHandler,
} from 'react-native';
import { useThemedStyles } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface ProfileProps {
  user: User | null;
  onLogout: () => void;
  onNavigateBack: () => void;
  onNavigateToSettings: () => void;
}

const { height } = Dimensions.get('window');

const Profile: React.FC<ProfileProps> = ({ user, onLogout, onNavigateBack, onNavigateToSettings }) => {
  const styles = useThemedStyles(createStyles);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });

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

  const handleSave = () => {
    // In a real app, this would make an API call to update the user
    Alert.alert('Success', 'Profile updated successfully!');
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedUser({
      username: user?.username || '',
      email: user?.email || '',
    });
    setIsEditing(false);
  };

  const ProfileField = ({ label, value, editable = false, onChangeText }: {
    label: string;
    value: string;
    editable?: boolean;
    onChangeText?: (text: string) => void;
  }) => (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {isEditing && editable ? (
        <TextInput
          style={styles.fieldInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      ) : (
        <Text style={styles.fieldValue}>{value}</Text>
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
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <View style={styles.headerSpacer} />
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Image
                source={require('../assets/user.png')}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Name and Change Avatar */}
          <Text style={styles.displayName}>
            {user?.username || 'Niluxshan Sivakumaran'}
          </Text>
          <TouchableOpacity>
            <Text style={styles.changeAvatarText}>Change avatar</Text>
          </TouchableOpacity>

          {/* Profile Fields */}
          <View style={styles.fieldsContainer}>
            <ProfileField
              label="Name"
              value={isEditing ? editedUser.username : (user?.username || 'S. Niluxshan')}
              editable={true}
              onChangeText={(text) => setEditedUser({ ...editedUser, username: text })}
            />
            <ProfileField
              label="Username"
              value="01675334069"
              editable={false}
            />
            <ProfileField
              label="Phonenumber"
              value="+94 7712345678"
              editable={false}
            />
            <ProfileField
              label="ID number"
              value="999999990v"
              editable={false}
            />
            <ProfileField
              label="Day of Birth"
              value="07/02/1999"
              editable={false}
            />
            <ProfileField
              label="Email"
              value={isEditing ? editedUser.email : (user?.email || 'nilux@gmail.com')}
              editable={true}
              onChangeText={(text) => setEditedUser({ ...editedUser, email: text })}
            />
            <ProfileField
              label="Location"
              value="Jaffna, Sri Lanka"
              editable={false}
            />
          </View>

          {/* Action Buttons */}
          {isEditing ? (
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
                <View style={styles.logoutButtonContent}>
                  <Image
                    source={require('../assets/logout.png')}
                    style={styles.logoutButtonIcon}
                    resizeMode="cover"
                  />
                  <Text style={styles.logoutButtonText}>Sign Out</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>

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
          <TouchableOpacity style={styles.footerButton}>
            <Image
              source={require('../assets/user.png')}
              style={[styles.footerIcon, styles.activeFooterIcon]}
              resizeMode="cover"
            />
            <Text style={[styles.footerText, styles.activeFooterText]}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerButton} onPress={onNavigateToSettings}>
            <Image
              source={require('../assets/settings.png')}
              style={styles.footerIcon}
              resizeMode="cover"
            />
            <Text style={styles.footerText}>Settings</Text>
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
    paddingTop: 10,
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
    marginBottom: 10,
  },
  profileCard: {
    backgroundColor: colors.background.elevated,
    marginHorizontal: 12,
    marginTop: -30,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: isDark ? colors.system.gray6 : '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 8,
    elevation: 8,
    flex: 1,
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.border,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.system.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: {
    fontSize: 32,
    color: colors.background.primary,
    fontWeight: 'bold',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  displayName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  changeAvatarText: {
    fontSize: 16,
    color: colors.system.blue,
    marginBottom: 32,
  },
  fieldsContainer: {
    width: '100%',
    marginBottom: 32,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  fieldLabel: {
    fontSize: 16,
    color: colors.text.secondary,
    flex: 1,
  },
  fieldValue: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  fieldInput: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 8,
    backgroundColor: colors.background.elevated,
  },
  actionButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: colors.system.blue,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background.primary,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.system.gray4,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.system.green,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background.primary,
  },
  logoutButton: {
    flex: 1,
    backgroundColor: colors.system.red,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background.primary,
  },
  logoutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
    tintColor: colors.background.primary,
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

export default Profile;