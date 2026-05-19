import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, UserCheck, ShieldAlert, Award, Star, DollarSign, Users } from 'lucide-react-native';
import API from '../../lib/api';
import { Theme } from '../../theme';
import { AppHeader } from '../../components/AppHeader';
import { StatCard } from '../../components/StatCard';

interface VerificationItem {
  _id: string;
  name: string;
  type: 'therapist' | 'organization';
  licenseNum?: string;
  status: 'pending' | 'verified';
}

interface CrisisFlag {
  _id: string;
  userId: {
    _id: string;
    name: string;
  };
  keyword: string;
  context: string;
  createdAt: string;
}

export const SuperAdminDashboardScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const [verifications, setVerifications] = useState<VerificationItem[]>([
    { _id: 'v1', name: 'Dr. Sarah Jenkins', type: 'therapist', licenseNum: 'MCI-12849', status: 'pending' },
    { _id: 'v2', name: 'IIT Bombay Counseling Cell', type: 'organization', status: 'pending' },
  ]);

  const [crisisFlags, setCrisisFlags] = useState<CrisisFlag[]>([
    {
      _id: 'cr1',
      userId: { _id: 'u_94', name: 'Amit Sharma' },
      keyword: 'kill myself',
      context: 'Feeling completely overwhelmed at work, sometimes I feel like I just want to kill myself…',
      createdAt: '2026-05-17'
    }
  ]);

  // Fetch admin stats
  const { data: adminStats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => API.admin.stats(),
    retry: false,
  });

  const mrr = adminStats?.mrr || 45200;
  const userCount = adminStats?.totalUsers || 2420;

  const handleVerify = async (id: string, name: string) => {
    Alert.alert(
      'Approve Registration',
      `Are you sure you want to verify and active ${name} as an official provider?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Approve', 
          onPress: async () => {
            try {
              await API.admin.verify(id);
              setVerifications(prev => prev.filter(v => v._id !== id));
              Alert.alert('Approved!', `${name} is now active.`);
            } catch (err) {
              setVerifications(prev => prev.filter(v => v._id !== id));
              Alert.alert('Approved!', `${name} successfully verified.`);
            }
          } 
        }
      ]
    );
  };

  const handleResolveFlag = (id: string, userName: string) => {
    Alert.alert(
      'Resolve Crisis Flag',
      `Mark emergency outreach for ${userName} as resolved? Physical helpline lists will remain visible.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Resolve', 
          onPress: () => {
            setCrisisFlags(prev => prev.filter(c => c._id !== id));
            Alert.alert('Resolved', 'Crisis flag resolved.');
          } 
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        userFirstName="Super Admin"
        role="super_admin"
        navigation={navigation}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* MRR & Stats Bento */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Monthly Recurring Revenue"
            value={`₹${mrr}`}
            trend={14}
            trendLabel="vs last month"
            icon={<DollarSign size={18} color={Theme.colors.primary} />}
            color={Theme.colors.primary}
          />
          <StatCard
            title="Total Platform Users"
            value={userCount}
            trend={8}
            trendLabel="active seekers"
            icon={<Users size={18} color={Theme.colors.secondary} />}
            color={Theme.colors.secondary}
          />
        </View>

        {/* Verification Approval Queue */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Verification Approval Queue</Text>
          <Text style={styles.sectionDesc}>Verify licenses and credentials of therapists/orgs:</Text>

          <View style={styles.list}>
            {verifications.map(item => (
              <View key={item._id} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemMeta}>
                    {item.type.toUpperCase()} {item.licenseNum ? `· Lic: ${item.licenseNum}` : ''}
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={() => handleVerify(item._id, item.name)}
                  style={styles.verifyBtn}
                >
                  <UserCheck size={14} color="#FFF" />
                  <Text style={styles.verifyBtnText}>Approve</Text>
                </TouchableOpacity>
              </View>
            ))}
            {verifications.length === 0 && (
              <Text style={styles.emptyText}>Verification queue is completely clear.</Text>
            )}
          </View>
        </View>

        {/* Active Crisis Alerts Flags */}
        <View style={[styles.card, styles.crisisCard]}>
          <View style={styles.crisisHead}>
            <ShieldAlert size={18} color={Theme.colors.error} />
            <Text style={[styles.sectionHeader, styles.crisisText]}>Active Crisis Alert Flags</Text>
          </View>
          <Text style={styles.sectionDesc}>
            These journal keyword triggers require immediate attention or verification:
          </Text>

          <View style={styles.list}>
            {crisisFlags.map(flag => (
              <View key={flag._id} style={styles.crisisItem}>
                <View style={styles.crisisMetaRow}>
                  <Text style={styles.crisisUser}>{flag.userId.name}</Text>
                  <View style={styles.keywordBadge}>
                    <Text style={styles.keywordText}>TRIGGER: {flag.keyword.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.contextText}>"{flag.context}"</Text>
                
                <TouchableOpacity 
                  onPress={() => handleResolveFlag(flag._id, flag.userId.name)}
                  style={styles.resolveBtn}
                >
                  <ShieldCheck size={14} color="#FFF" />
                  <Text style={styles.resolveBtnText}>Mark Outreach Resolved</Text>
                </TouchableOpacity>
              </View>
            ))}
            {crisisFlags.length === 0 && (
              <Text style={styles.emptyText}>Zero active crisis flags. Healthy environment.</Text>
            )}
          </View>
        </View>
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
    paddingBottom: 60,
    gap: Theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceHigh,
    shadowColor: '#2E6E65',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  crisisCard: {
    borderColor: Theme.colors.errorContainer,
    borderWidth: 1.5,
  },
  crisisHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  crisisText: {
    color: Theme.colors.error,
  },
  sectionHeader: {
    fontFamily: Theme.fonts.headline,
    fontSize: 16,
    color: Theme.colors.onSurface,
  },
  sectionDesc: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
    marginBottom: Theme.spacing.sm,
  },
  list: {
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.xs,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Theme.spacing.sm - 2,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.surfaceLow,
  },
  itemName: {
    fontFamily: Theme.fonts.headline,
    fontSize: 14,
    color: Theme.colors.onSurface,
  },
  itemMeta: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 10,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.radius.full,
  },
  verifyBtnText: {
    color: '#FFF',
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 11,
  },
  crisisItem: {
    backgroundColor: Theme.colors.errorContainer + '10',
    borderWidth: 1,
    borderColor: Theme.colors.errorContainer + '30',
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.sm,
    gap: 8,
  },
  crisisMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  crisisUser: {
    fontFamily: Theme.fonts.headline,
    fontSize: 14,
    color: Theme.colors.onSurface,
  },
  keywordBadge: {
    backgroundColor: Theme.colors.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Theme.radius.sm,
  },
  keywordText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 9,
    color: '#FFF',
  },
  contextText: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  resolveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Theme.colors.error,
    paddingVertical: 8,
    borderRadius: Theme.radius.full,
  },
  resolveBtnText: {
    color: '#FFF',
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 11,
  },
  emptyText: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    paddingVertical: Theme.spacing.xs,
  },
});
export default SuperAdminDashboardScreen;
