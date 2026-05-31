import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Wallet, Lock, CheckCircle, TrendingUp } from 'lucide-react-native';
import API from '../../lib/api';
import { Theme } from '../../theme';
import { AppHeader } from '../../components/AppHeader';

interface TherapistEarningsScreenProps {
  navigation: any;
}

export const TherapistEarningsScreen: React.FC<TherapistEarningsScreenProps> = ({ navigation }) => {

  // Fetch profiles and subscription
  const { data: userProfile, refetch: refetchProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => API.auth.me(),
    retry: false,
  });

  const { data: subData, refetch: refetchSub } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => API.subscription.get().catch(() => null),
    retry: false,
  });

  const isSubscribed = 
    !!(userProfile?.orgId) || 
    !!(userProfile?.tier && userProfile.tier !== 'free') || 
    (subData && subData.subscription?.status === 'active');

  const { data: therapistStats, refetch: refetchStats } = useQuery({
    queryKey: ['therapistStats'],
    queryFn: () => API.therapist.stats(),
    retry: false,
    enabled: isSubscribed,
  });

  const monthEarned = isSubscribed ? (therapistStats?.earningsTotal || therapistStats?.monthEarned || 0) : 0;
  const netPayout = Math.round(monthEarned * 0.85);
  const totalSessionsCount = isSubscribed ? ((therapistStats?.hoursCompleted || therapistStats?.totalSessions) ?? 0) : 0;
  const therapistName = userProfile?.fullName || 'Therapist';

  return (
    <View style={styles.container}>
      <AppHeader
        userFirstName={therapistName.split(' ')[0]}
        role="therapist"
        navigation={navigation}
        onUpgradePress={userProfile?.orgId ? undefined : () => navigation.navigate('Plans')}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarRingOuter}>
            <View style={styles.avatarRingInner}>
              <Text style={styles.avatarLetter}>T</Text>
            </View>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{therapistName}</Text>
            <Text style={styles.headerRole}>Therapist</Text>
            <Text style={styles.headerSubtext}>– · {totalSessionsCount} sessions</Text>
          </View>
        </View>

        {/* 2 Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>₹{monthEarned}</Text>
            <Text style={styles.statLabel}>Month earned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>₹{netPayout}</Text>
            <Text style={styles.statLabel}>Payout (85%)</Text>
          </View>
        </View>

        {isSubscribed ? (
          <View style={styles.actionContainer}>
            {/* Financial ledger statement */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Wallet size={18} color={Theme.colors.primary} />
                <Text style={styles.cardTitle}>Payout Summary Statement</Text>
              </View>
              <Text style={styles.cardDesc}>Below is the breakdown of your consultation earnings:</Text>

              <View style={styles.ledgerCard}>
                <View style={styles.ledgerLine}>
                  <Text style={styles.ledgerLabel}>Total Gross Earned</Text>
                  <Text style={styles.ledgerVal}>₹{monthEarned}</Text>
                </View>
                <View style={styles.ledgerLine}>
                  <Text style={styles.ledgerLabel}>Platform Service Share (15%)</Text>
                  <Text style={styles.ledgerVal}>- ₹{Math.round(monthEarned * 0.15)}</Text>
                </View>
                <View style={[styles.ledgerLine, styles.ledgerTotalLine]}>
                  <Text style={styles.ledgerTotalLabel}>Net Payout Transferred</Text>
                  <Text style={styles.ledgerTotalVal}>₹{netPayout}</Text>
                </View>
              </View>

              <View style={styles.helpBox}>
                <Text style={styles.helpText}>
                  * Payouts are safely processed and automatically dispatched to your registered bank account on the 1st of every month.
                </Text>
              </View>
            </View>

            {/* Performance tracker */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <TrendingUp size={18} color={Theme.colors.primary} />
                <Text style={styles.cardTitle}>Performance History</Text>
              </View>
              <Text style={styles.emptyText}>Financial performance trends will appear here next month.</Text>
            </View>
          </View>
        ) : (
          /* Subscription Required Barrier Overlay */
          <View style={styles.barrierContainer}>
            <View style={styles.lockBadge}>
              <Lock size={22} color={Theme.colors.primary} />
            </View>
            <Text style={styles.barrierTitle}>Subscription Required</Text>
            <Text style={styles.barrierDesc}>
              As an independent therapist, you need an active subscription to access your schedule, bookings, and profile.
            </Text>

            <View style={styles.barrierActions}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Plans')}
                style={styles.viewPlansBtn}
              >
                <Text style={styles.viewPlansText}>View Subscription Plans</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollContent: {
    padding: Theme.spacing.margin,
    paddingBottom: 80,
    gap: Theme.spacing.md,
  },
  profileHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceHigh,
    shadowColor: '#2E6E65',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 3,
    gap: Theme.spacing.md,
  },
  avatarRingOuter: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    borderColor: Theme.colors.primary + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarRingInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Theme.colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontFamily: Theme.fonts.display,
    fontSize: 26,
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 18,
    color: Theme.colors.onSurface,
  },
  headerRole: {
    fontFamily: Theme.fonts.bodyMedium,
    fontSize: 13,
    color: Theme.colors.primary,
    marginTop: 2,
  },
  headerSubtext: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: 3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2E6E65',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    height: 90,
  },
  statVal: {
    fontFamily: Theme.fonts.display,
    fontSize: 26,
    color: Theme.colors.onSurface,
    fontWeight: '700',
  },
  statLabel: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: Theme.spacing.xs - 4,
    textAlign: 'center',
  },
  actionContainer: {
    gap: Theme.spacing.md,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceHigh,
    gap: Theme.spacing.xs,
    shadowColor: '#2E6E65',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 15,
    color: Theme.colors.onSurface,
  },
  cardDesc: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginBottom: 6,
  },
  ledgerCard: {
    backgroundColor: Theme.colors.background + '50',
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceHigh,
    gap: 8,
  },
  ledgerLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ledgerLabel: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: Theme.colors.textMuted,
  },
  ledgerVal: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 12.5,
    color: Theme.colors.onSurface,
  },
  ledgerTotalLine: {
    borderTopWidth: 1,
    borderTopColor: Theme.colors.surfaceLow,
    paddingTop: 8,
    marginTop: 2,
  },
  ledgerTotalLabel: {
    fontFamily: Theme.fonts.headline,
    fontSize: 13.5,
    color: Theme.colors.primary,
  },
  ledgerTotalVal: {
    fontFamily: Theme.fonts.headline,
    fontSize: 15,
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  helpBox: {
    marginTop: 4,
  },
  helpText: {
    fontFamily: Theme.fonts.body,
    fontSize: 11,
    color: Theme.colors.textMuted,
    lineHeight: 15,
  },
  emptyText: {
    fontFamily: Theme.fonts.body,
    fontSize: 12.5,
    color: Theme.colors.textMuted,
    paddingVertical: 8,
  },
  barrierContainer: {
    backgroundColor: Theme.colors.primary + '06',
    borderWidth: 1.5,
    borderColor: Theme.colors.primary + '25',
    borderStyle: 'dashed',
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.lg,
    alignItems: 'center',
    textAlign: 'center',
    shadowColor: '#2E6E65',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 4,
  },
  lockBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  barrierTitle: {
    fontFamily: Theme.fonts.display,
    fontSize: 18,
    color: Theme.colors.primary,
    textAlign: 'center',
    fontWeight: '700',
  },
  barrierDesc: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: Theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    paddingHorizontal: 8,
  },
  barrierActions: {
    width: '100%',
    gap: 8,
    marginTop: Theme.spacing.md,
  },
  viewPlansBtn: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 12,
    borderRadius: Theme.radius.full,
    alignItems: 'center',
    width: '100%',
  },
  viewPlansText: {
    fontFamily: Theme.fonts.headline,
    fontSize: 13,
    color: '#FFF',
  },
  demoActivateBtn: {
    borderWidth: 1,
    borderColor: Theme.colors.primary + '40',
    backgroundColor: '#FFF',
    paddingVertical: 10,
    borderRadius: Theme.radius.full,
    alignItems: 'center',
    width: '100%',
  },
  demoActivateText: {
    fontFamily: Theme.fonts.headline,
    fontSize: 12.5,
    color: Theme.colors.primary,
  },
});

export default TherapistEarningsScreen;
