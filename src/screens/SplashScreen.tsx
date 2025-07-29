import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationComplete }) => {
  // Animation values
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(50)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(30)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start the animation sequence
    startAnimationSequence();
  }, []);

  const startAnimationSequence = () => {
    // Background fade in
    Animated.timing(backgroundOpacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Logo animation sequence
    Animated.sequence([
      // Logo scale and fade in
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      // Small delay
      Animated.delay(300),
      // Title slide up and fade in
      Animated.parallel([
        Animated.spring(titleTranslateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      // Subtitle slide up and fade in
      Animated.parallel([
        Animated.spring(subtitleTranslateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Hold for a moment
      Animated.delay(1000),
    ]).start(() => {
      // Start pulse animation
      startPulseAnimation();
      // Complete after total duration
      setTimeout(() => {
        onAnimationComplete();
      }, 1500);
    });
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  return (
    <View style={styles.container}>
      {/* Animated Background */}
      <Animated.View 
        style={[
          styles.backgroundGradient,
          {
            opacity: backgroundOpacity,
          }
        ]}
      />

      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* Logo Container with Pulse Animation */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [
                { scale: Animated.multiply(logoScale, pulseAnimation) },
              ],
              opacity: logoOpacity,
            },
          ]}
        >
          {/* Logo Background Circle */}
          <View style={styles.logoBackground}>
            <Image
              source={require('../assets/bug-tracking.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* App Title */}
        <Animated.Text
          style={[
            styles.appTitle,
            {
              transform: [{ translateY: titleTranslateY }],
              opacity: titleOpacity,
            },
          ]}
        >
          ZeroBug
        </Animated.Text>

        {/* App Subtitle */}
        <Animated.Text
          style={[
            styles.appSubtitle,
            {
              transform: [{ translateY: subtitleTranslateY }],
              opacity: subtitleOpacity,
            },
          ]}
        >
          DefectTracker
        </Animated.Text>

        {/* Tagline */}
        <Animated.Text
          style={[
            styles.tagline,
            {
              opacity: subtitleOpacity,
            },
          ]}
        >
          Track • Manage • Resolve
        </Animated.Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0F2FE',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#E0F2FE',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  logoImage: {
    width: 80,
    height: 80,
  },

  appTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 3,
    fontFamily: 'System',
    textShadowColor: 'rgba(59, 130, 246, 0.3)',
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 4,
    textTransform: 'uppercase',
  },
  appSubtitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3B82F6',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 2,
    fontFamily: 'System',
    textShadowColor: 'rgba(59, 130, 246, 0.2)',
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 2,
  },
  tagline: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    letterSpacing: 3,
    fontFamily: 'System',
    textTransform: 'uppercase',
    opacity: 0.8,
  },
});

export default SplashScreen;
