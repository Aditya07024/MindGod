import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import { ArrowLeft, Play, Pause, RefreshCw } from 'lucide-react-native';
import { Theme } from '../../theme';

interface BreatheScreenProps {
  navigation: any;
}

type BreathState = 'idle' | 'inhale' | 'hold' | 'exhale';

export const BreatheScreen: React.FC<BreatheScreenProps> = ({ navigation }) => {
  const [breathState, setBreathState] = useState<BreathState>('idle');
  const [timer, setTimer] = useState(4);
  const [cycleCount, setCycleCount] = useState(0);

  // Animated scale for the expanding circle
  const circleScale = useRef(new Animated.Value(1)).current;
  const stateRef = useRef<BreathState>('idle');

  useEffect(() => {
    stateRef.current = breathState;
  }, [breathState]);

  // Main breathing pacing loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (breathState !== 'idle') {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            // Transition state
            triggerStateTransition();
            return 4; // Reset timer to 4s
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [breathState]);

  const triggerStateTransition = () => {
    const current = stateRef.current;
    if (current === 'inhale') {
      setBreathState('hold');
      animateCircle(2.0, 4000); // Keep size expanded
    } else if (current === 'hold') {
      setBreathState('exhale');
      animateCircle(1.0, 4000); // Scale back down
    } else if (current === 'exhale') {
      setBreathState('inhale');
      setCycleCount(c => c + 1);
      animateCircle(2.0, 4000); // Scale up
    }
  };

  const animateCircle = (toValue: number, duration: number) => {
    Animated.timing(circleScale, {
      toValue,
      duration,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const handleStart = () => {
    setBreathState('inhale');
    setTimer(4);
    animateCircle(2.0, 4000);
  };

  const handlePause = () => {
    setBreathState('idle');
    circleScale.setValue(1);
  };

  const getInstruction = () => {
    switch (breathState) {
      case 'inhale': return 'Inhale slowly…';
      case 'hold': return 'Hold your breath…';
      case 'exhale': return 'Exhale completely…';
      default: return 'Ready to relax?';
    }
  };

  const getInstructionSub = () => {
    switch (breathState) {
      case 'inhale': return 'Feel the clean energy filling your chest';
      case 'hold': return 'Let the quiet settle inside you';
      case 'exhale': return 'Release all lingering tensions';
      default: return 'Press start to begin 4-4-4 Box Breathing';
    }
  };

  return (
    <View style={styles.container}>
      {/* Back row */}
      <View style={styles.backRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color={Theme.colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Breathing Guide</Text>
      </View>

      <View style={styles.mainArea}>
        {/* Cycle count indicator */}
        <Text style={styles.cycleText}>Cycle: {cycleCount}</Text>

        {/* Breathing Circle Ring Container */}
        <View style={styles.circleContainer}>
          <Animated.View style={[
            styles.breathingOuterRing,
            { transform: [{ scale: circleScale }] },
            breathState === 'inhale' && styles.ringInhale,
            breathState === 'hold' && styles.ringHold,
            breathState === 'exhale' && styles.ringExhale,
          ]} />
          
          <View style={styles.breathingCenterBubble}>
            <Text style={styles.timerText}>{timer}s</Text>
            <Text style={styles.stateLabelText}>{breathState.toUpperCase()}</Text>
          </View>
        </View>

        {/* Text Instruction panel */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>{getInstruction()}</Text>
          <Text style={styles.instructionDesc}>{getInstructionSub()}</Text>
        </View>

        {/* Controls */}
        <View style={styles.controlRow}>
          {breathState === 'idle' ? (
            <TouchableOpacity onPress={handleStart} style={styles.startBtn}>
              <Play size={22} color="#FFF" fill="#FFF" />
              <Text style={styles.startBtnText}>Start Practice</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handlePause} style={styles.pauseBtn}>
              <Pause size={22} color={Theme.colors.primary} />
              <Text style={styles.pauseBtnText}>Pause</Text>
            </TouchableOpacity>
          )}

          {cycleCount > 0 && (
            <TouchableOpacity 
              onPress={() => {
                handlePause();
                setCycleCount(0);
              }} 
              style={styles.resetBtn}
            >
              <RefreshCw size={18} color={Theme.colors.outline} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: Theme.spacing.margin,
    gap: Theme.spacing.sm,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.surfaceHigh,
  },
  headerTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 18,
    color: Theme.colors.onSurface,
  },
  mainArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.margin,
    gap: Theme.spacing.lg,
  },
  cycleText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 13,
    color: Theme.colors.primary,
    backgroundColor: Theme.colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Theme.radius.full,
  },
  circleContainer: {
    width: 240,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  breathingOuterRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Theme.colors.primary + '20',
  },
  ringInhale: {
    backgroundColor: Theme.colors.primary + '30',
  },
  ringHold: {
    backgroundColor: Theme.colors.gold + '25',
  },
  ringExhale: {
    backgroundColor: Theme.colors.secondaryContainer + '30',
  },
  breathingCenterBubble: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: Theme.colors.surfaceHigh,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2E6E65',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  timerText: {
    fontFamily: Theme.fonts.display,
    fontSize: 28,
    color: Theme.colors.onSurface,
  },
  stateLabelText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 9,
    color: Theme.colors.textMuted,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  instructionCard: {
    alignItems: 'center',
    textAlign: 'center',
    paddingHorizontal: Theme.spacing.sm,
  },
  instructionTitle: {
    fontFamily: Theme.fonts.display,
    fontSize: 22,
    color: Theme.colors.primary,
    textAlign: 'center',
  },
  instructionDesc: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: Theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  startBtn: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: Theme.radius.full,
    alignItems: 'center',
    gap: 8,
  },
  startBtnText: {
    color: '#FFF',
    fontFamily: Theme.fonts.headline,
    fontSize: 14,
  },
  pauseBtn: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: Theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: Theme.radius.full,
    alignItems: 'center',
    gap: 8,
  },
  pauseBtnText: {
    color: Theme.colors.primary,
    fontFamily: Theme.fonts.headline,
    fontSize: 14,
  },
  resetBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceHigh,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
});
export default BreatheScreen;
