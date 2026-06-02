import React, { useState } from 'react';
import {
  View, StyleSheet, Text, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Dimensions, RefreshControl,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Wallet, TrendingUp, Users, Building2, UserCheck, DollarSign, CheckCircle, Clock, BarChart2 } from 'lucide-react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import API from '../../lib/api';
import { Theme } from '../../theme';
import { AppHeader } from '../../components/AppHeader';

interface SuperAdminEarningsScreenProps { navigation?: any; }

export const SuperAdminEarningsScreen: React.FC<SuperAdminEarningsScreenProps> = ({ navigation }) => {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

  const { data: adminStats, isLoading: statsLoading } = useQuery({
    queryKey: ['adminEarningsStats'],
    queryFn: () => API.admin.stats(),
    retry: false,
  });

  const { data: countsData } = useQuery({
    queryKey: ['adminPlatformCounts'],
    queryFn: () => API.admin.platformCounts(),
    retry: false,
  });

  const { data: subsData, isLoading: subsLoading } = useQuery({
    queryKey: ['adminAllSubs'],
    queryFn: () => API.subscription.admin.all(),
    retry: false,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['adminEarningsStats'] });
    await queryClient.invalidateQueries({ queryKey: ['adminPlatformCounts'] });
    await queryClient.invalidateQueries({ queryKey: ['adminAllSubs'] });
    setRefreshing(false);
  };

  // Derive summary numbers from stats
  const totalGross = adminStats?.totalRevenue || adminStats?.mrr || 0;
  const platformFee = Math.round(totalGross * 0.30);
  const netDistributed = Math.round(totalGross * 0.70);
  const mrr = adminStats?.mrr || 0;

  // Subscriptions list for payout ledger
  const allSubs: any[] = subsData?.subscriptions || [];
  const activeSubs = allSubs.filter((s: any) => s.status === 'active');

  // Platform counts
  const userCount = countsData?.counts?.users || adminStats?.totalUsers || 0;
  const therapistCount = countsData?.counts?.therapists || 0;
  const orgCount = countsData?.counts?.organisations || 0;

  // Top earner chart data — from active subscriptions
  const topEarners = activeSubs
    .filter((s: any) => s.userId?.therapistProfile)
    .slice(0, 8)
    .map((s: any) => ({
      id: s._id,
      name: s.userId?.therapistProfile?.name || 'Therapist',
      fee: s.planId?.price || 0,
      paid: s.payoutStatus === 'paid',
    }));

  const maxFee = Math.max(...topEarners.map(t => t.fee), 1);
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 48;
  const barHeight = 28;

  const handleMarkPaid = (therapistId: string, name: string, amount: number) => {
    Alert.alert(
      'Mark as Paid',
      `Confirm payout of ₹${Math.round(amount * 0.70).toLocaleString('en-IN')} (70%) to ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Payment',
          onPress: async () => {
            setPayingId(therapistId);
            try {
              await API.admin.markTherapistPaid(therapistId, { amount: Math.round(amount * 0.70) });
              Alert.alert('✅ Paid', `Payout recorded for ${name}.`);
              queryClient.invalidateQueries({ queryKey: ['adminAllSubs'] });
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Could not mark as paid.');
            } finally {
              setPayingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader userFirstName="Admin" role="super_admin" navigation={navigation} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primary} />}
      >
        <Text style={styles.pageTitle}>Earnings Dashboard</Text>
        <Text style={styles.pageDesc}>Platform-wide financial overview and therapist payouts</Text>

        {/* Platform Counts */}
        <View style={styles.countsRow}>
          <View style={[styles.countCard, { borderColor: Theme.colors.primary + '30' }]}>
            <Users size={18} color={Theme.colors.primary} />
            <Text style={styles.countVal}>{userCount.toLocaleString('en-IN')}</Text>
            <Text style={styles.countLabel}>Users</Text>
          </View>
          <View style={[styles.countCard, { borderColor: '#6366f130' }]}>
            <UserCheck size={18} color="#6366f1" />
            <Text style={[styles.countVal, { color: '#6366f1' }]}>{therapistCount.toLocaleString('en-IN')}</Text>
            <Text style={styles.countLabel}>Therapists</Text>
          </View>
          <View style={[styles.countCard, { borderColor: '#f59e0b30' }]}>
            <Building2 size={18} color="#f59e0b" />
            <Text style={[styles.countVal, { color: '#f59e0b' }]}>{orgCount.toLocaleString('en-IN')}</Text>
            <Text style={styles.countLabel}>Orgs</Text>
          </View>
        </View>

        {/* Financial Summary Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <TrendingUp size={18} color={Theme.colors.primary} />
            <Text style={styles.statVal}>₹{mrr.toLocaleString('en-IN')}</Text>
            <Text style={styles.statLabel}>MRR</Text>
          </View>
          <View style={styles.statCard}>
            <DollarSign size={18} color="#10b981" />
            <Text style={[styles.statVal, { color: '#10b981' }]}>₹{totalGross.toLocaleString('en-IN')}</Text>
            <Text style={styles.statLabel}>Total Gross</Text>
          </View>
          <View style={styles.statCard}>
            <Wallet size={18} color="#ef4444" />
            <Text style={[styles.statVal, { color: '#ef4444' }]}>₹{platformFee.toLocaleString('en-IN')}</Text>
            <Text style={styles.statLabel}>Platform (30%)</Text>
          </View>
          <View style={styles.statCard}>
            <BarChart2 size={18} color="#6366f1" />
            <Text style={[styles.statVal, { color: '#6366f1' }]}>₹{netDistributed.toLocaleString('en-IN')}</Text>
            <Text style={styles.statLabel}>Net to Therapists</Text>
          </View>
        </View>

        {/* Active Subscriptions Payout Ledger */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Wallet size={18} color={Theme.colors.primary} />
            <Text style={styles.cardTitle}>Therapist Payout Ledger</Text>
          </View>
          <Text style={styles.cardDesc}>All active subscriptions — mark payouts as processed</Text>

          {subsLoading ? (
            <ActivityIndicator color={Theme.colors.primary} style={{ paddingVertical: 20 }} />
          ) : activeSubs.length === 0 ? (
            <Text style={styles.emptyText}>No active subscriptions to show.</Text>
          ) : (
            activeSubs.slice(0, 30).map((sub: any) => {
              const therapistName = sub.userId?.therapistProfile?.name || sub.userId?.fullName || 'Therapist';
              const planPrice = sub.planId?.price || 0;
              const net = Math.round(planPrice * 0.70);
              const commission = Math.round(planPrice * 0.30);
              const isPaying = payingId === sub.userId?._id;

              return (
                <View key={sub._id} style={styles.ledgerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ledgerName}>{therapistName}</Text>
                    <Text style={styles.ledgerPlan}>{sub.plan || 'Active Plan'}</Text>
                    <View style={styles.ledgerAmounts}>
                      <Text style={styles.ledgerGross}>₹{planPrice.toLocaleString('en-IN')} gross</Text>
                      <Text style={styles.ledgerComm}>· -₹{commission.toLocaleString('en-IN')} (30%)</Text>
                      <Text style={styles.ledgerNet}> = ₹{net.toLocaleString('en-IN')}</Text>
                    </View>
                  </View>
                  <View style={styles.ledgerRight}>
                    {sub.payoutStatus === 'paid' ? (
                      <View style={styles.paidBadge}>
                        <CheckCircle size={12} color={Theme.colors.primary} />
                        <Text style={styles.paidBadgeText}>Paid</Text>
                      </View>
                    ) : (
                      <View style={styles.pendingBadge}>
                        <Clock size={12} color="#f59e0b" />
                        <Text style={styles.pendingBadgeText}>Pending</Text>
                      </View>
                    )}
                    {sub.payoutStatus !== 'paid' && sub.userId?._id && (
                      <TouchableOpacity
                        onPress={() => handleMarkPaid(sub.userId._id, therapistName, planPrice)}
                        disabled={isPaying}
                        style={styles.markPaidBtn}
                      >
                        {isPaying ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          <Text style={styles.markPaidText}>Mark Paid</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* All Subscriptions Log */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <BarChart2 size={18} color={Theme.colors.primary} />
            <Text style={styles.cardTitle}>All Subscription Transactions</Text>
          </View>
          <Text style={styles.cardDesc}>Full subscription history across all users</Text>

          {allSubs.slice(0, 50).map((sub: any) => (
            <View key={sub._id} style={styles.txRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.txName}>
                  {sub.userId?.therapistProfile?.name || sub.userId?.fullName || sub.orgId?.name || 'User'}
                </Text>
                <Text style={styles.txPlan}>{sub.plan} · {new Date(sub.startDate || sub.createdAt).toLocaleDateString('en-IN')}</Text>
              </View>
              <View style={[styles.txBadge, {
                backgroundColor: sub.status === 'active' ? '#ecfdf5' : sub.status === 'pending' ? '#fffbeb' : '#fef2f2',
              }]}>
                <Text style={[styles.txStatus, {
                  color: sub.status === 'active' ? '#059669' : sub.status === 'pending' ? '#d97706' : '#dc2626',
                }]}>
                  {sub.status.toUpperCase()}
                </Text>
              </View>
            </View>
          ))}

          {allSubs.length === 0 && !subsLoading && (
            <Text style={styles.emptyText}>No subscription records found.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  scrollContent: { padding: Theme.spacing.margin, paddingBottom: 80, gap: Theme.spacing.md },
  pageTitle: { fontFamily: Theme.fonts.display, fontSize: 22, fontWeight: '800', color: Theme.colors.onSurface },
  pageDesc: { fontFamily: Theme.fonts.body, fontSize: 13, color: Theme.colors.textMuted, marginTop: 2 },
  countsRow: { flexDirection: 'row', gap: Theme.spacing.sm },
  countCard: {
    flex: 1, backgroundColor: '#FFF', borderRadius: Theme.radius.xl, padding: 14,
    borderWidth: 1, alignItems: 'center', gap: 4,
    shadowColor: '#2E6E65', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2,
  },
  countVal: { fontFamily: Theme.fonts.display, fontSize: 20, fontWeight: '800', color: Theme.colors.onSurface },
  countLabel: { fontFamily: Theme.fonts.body, fontSize: 11, color: Theme.colors.textMuted, textAlign: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Theme.spacing.sm },
  statCard: {
    width: '47%', backgroundColor: '#FFF', borderRadius: Theme.radius.xl, padding: 14,
    borderWidth: 1, borderColor: Theme.colors.surfaceHigh, alignItems: 'center', gap: 6,
    shadowColor: '#2E6E65', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2,
  },
  statVal: { fontFamily: Theme.fonts.display, fontSize: 18, fontWeight: '800', color: Theme.colors.onSurface },
  statLabel: { fontFamily: Theme.fonts.body, fontSize: 11, color: Theme.colors.textMuted, textAlign: 'center' },
  card: {
    backgroundColor: '#FFF', borderRadius: Theme.radius.xl, padding: Theme.spacing.md,
    borderWidth: 1, borderColor: Theme.colors.surfaceHigh, gap: Theme.spacing.xs,
    shadowColor: '#2E6E65', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTitle: { fontFamily: Theme.fonts.headline, fontSize: 15, color: Theme.colors.onSurface },
  cardDesc: { fontFamily: Theme.fonts.body, fontSize: 12, color: Theme.colors.textMuted, marginBottom: 8 },
  ledgerRow: {
    flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Theme.colors.surfaceLow, gap: 10,
  },
  ledgerName: { fontFamily: Theme.fonts.headline, fontSize: 13.5, color: Theme.colors.onSurface },
  ledgerPlan: { fontFamily: Theme.fonts.body, fontSize: 11, color: Theme.colors.textMuted, marginTop: 2 },
  ledgerAmounts: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, alignItems: 'center' },
  ledgerGross: { fontFamily: Theme.fonts.body, fontSize: 11, color: Theme.colors.onSurfaceVariant },
  ledgerComm: { fontFamily: Theme.fonts.body, fontSize: 11, color: '#ef4444' },
  ledgerNet: { fontFamily: Theme.fonts.bodyBold, fontSize: 11, color: Theme.colors.primary },
  ledgerRight: { alignItems: 'flex-end', gap: 6 },
  paidBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#ecfdf5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: Theme.radius.full,
  },
  paidBadgeText: { fontFamily: Theme.fonts.bodyBold, fontSize: 10.5, color: Theme.colors.primary },
  pendingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fffbeb', paddingHorizontal: 8, paddingVertical: 4, borderRadius: Theme.radius.full,
  },
  pendingBadgeText: { fontFamily: Theme.fonts.bodyBold, fontSize: 10.5, color: '#d97706' },
  markPaidBtn: {
    backgroundColor: Theme.colors.primary, paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: Theme.radius.full, minWidth: 80, alignItems: 'center',
  },
  markPaidText: { fontFamily: Theme.fonts.bodyBold, fontSize: 11, color: '#FFF' },
  txRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Theme.colors.surfaceLow,
  },
  txName: { fontFamily: Theme.fonts.bodyBold, fontSize: 13, color: Theme.colors.onSurface },
  txPlan: { fontFamily: Theme.fonts.body, fontSize: 11, color: Theme.colors.textMuted, marginTop: 2 },
  txBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Theme.radius.full },
  txStatus: { fontFamily: Theme.fonts.bodyBold, fontSize: 9.5 },
  emptyText: { fontFamily: Theme.fonts.body, fontSize: 13, color: Theme.colors.textMuted, textAlign: 'center', paddingVertical: 12 },
});

export default SuperAdminEarningsScreen;
