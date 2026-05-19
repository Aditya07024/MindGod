import React from 'react';
import { View, StyleSheet, Text, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { Star, ShieldCheck, Heart, Award, ArrowLeft, PlayCircle } from 'lucide-react-native';
import { Theme } from '../../theme';
import { TherapistData } from '../../components/TherapistCard';

interface TherapistDetailScreenProps {
  navigation: any;
  route: any;
}

export const TherapistDetailScreen: React.FC<TherapistDetailScreenProps> = ({ navigation, route }) => {
  const therapist: TherapistData = route.params?.therapist;

  if (!therapist) {
    return (
      <View style={styles.errorView}>
        <Text style={styles.errorText}>No practitioner selected.</Text>
      </View>
    );
  }

  const specs = therapist.specialties && therapist.specialties.length > 0
    ? therapist.specialties.join(', ')
    : 'Clinical Psychology';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header back button */}
      <View style={styles.backRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color={Theme.colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Overview</Text>
      </View>

      {/* Hero Video Placeholder */}
      <View style={styles.videoPlaceholder}>
        {therapist.avatarUrl ? (
          <Image source={{ uri: therapist.avatarUrl }} style={styles.videoBg} />
        ) : (
          <View style={styles.avatarFallback} />
        )}
        <View style={styles.videoOverlay}>
          <TouchableOpacity 
            onPress={() => Alert.alert('Video Introduction', 'Playing welcome video introductory message from the practitioner…')}
            style={styles.playBtn}
          >
            <PlayCircle size={48} color="#FFF" />
            <Text style={styles.playText}>Watch Intro Video</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Practitioner details card */}
      <View style={styles.detailCard}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{therapist.name}</Text>
              {therapist.verified && <ShieldCheck size={20} color={Theme.colors.primary} />}
            </View>
            <Text style={styles.specialties}>{specs}</Text>
          </View>
          <View style={styles.ratingBadge}>
            <Star size={14} color={Theme.colors.gold} fill={Theme.colors.gold} />
            <Text style={styles.ratingText}>{therapist.rating?.toFixed(1) || '5.0'}</Text>
          </View>
        </View>

        {/* Experience & stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Award size={18} color={Theme.colors.primary} />
            <Text style={styles.statLabel}>EXPERIENCE</Text>
            <Text style={styles.statVal}>{therapist.experience || 3}+ Years</Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.statBox}>
            <Heart size={18} color={Theme.colors.secondary} />
            <Text style={styles.statLabel}>HOURLY RATE</Text>
            <Text style={styles.statVal}>₹{therapist.hourlyRate || 999}</Text>
          </View>
        </View>

        {/* Bio */}
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>About Me</Text>
          <Text style={styles.bioText}>
            {therapist.bio || 'I believe that mental health support is deeply collaborative. By creating a warm, non-judgmental container, we will explore CBT thought patterns, address core anxious pathways, and collaboratively develop resilient daily mindfulness tools designed for your life.'}
          </Text>
        </View>
      </View>

      {/* Booking button */}
      <TouchableOpacity 
        onPress={() => navigation.navigate('Booking', { therapist })} 
        style={styles.bookBtn}
      >
        <Text style={styles.bookBtnText}>Book Secure Session (₹{therapist.hourlyRate || 999})</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    padding: Theme.spacing.margin,
    paddingBottom: Theme.spacing.xl,
    gap: Theme.spacing.md,
  },
  errorView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
  },
  errorText: {
    fontFamily: Theme.fonts.body,
    fontSize: 14,
    color: Theme.colors.textMuted,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
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
  videoPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: Theme.radius.xl,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Theme.colors.primaryContainer,
  },
  videoBg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: Theme.colors.primaryContainer + '80',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtn: {
    alignItems: 'center',
    gap: 8,
  },
  playText: {
    color: '#FFF',
    fontFamily: Theme.fonts.headline,
    fontSize: 14,
  },
  detailCard: {
    backgroundColor: '#FFF',
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceHigh,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Theme.spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontFamily: Theme.fonts.display,
    fontSize: 22,
    color: Theme.colors.onSurface,
  },
  specialties: {
    fontFamily: Theme.fonts.bodyMedium,
    fontSize: 14,
    color: Theme.colors.primaryContainer,
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Theme.colors.surfaceLow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.radius.default,
  },
  ratingText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 12,
    color: Theme.colors.onSurface,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: Theme.spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Theme.colors.surfaceLow,
    paddingVertical: Theme.spacing.sm,
  },
  statBox: {
    alignItems: 'center',
    gap: 2,
  },
  statLabel: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 9,
    color: Theme.colors.textMuted,
    letterSpacing: 0.5,
  },
  statVal: {
    fontFamily: Theme.fonts.display,
    fontSize: 16,
    color: Theme.colors.onSurface,
    marginTop: 2,
  },
  verticalDivider: {
    width: 1,
    height: 36,
    backgroundColor: Theme.colors.surfaceHigh,
  },
  bioSection: {
    marginTop: Theme.spacing.xs,
  },
  sectionTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 16,
    color: Theme.colors.onSurface,
    marginBottom: 6,
  },
  bioText: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: Theme.colors.onSurfaceVariant,
    lineHeight: 18,
  },
  bookBtn: {
    backgroundColor: Theme.colors.primary,
    height: 52,
    borderRadius: Theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Theme.spacing.xs,
  },
  bookBtnText: {
    color: '#FFF',
    fontFamily: Theme.fonts.headline,
    fontSize: 14,
  },
});
export default TherapistDetailScreen;
