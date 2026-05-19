import React from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ShieldCheck, ArrowLeft, Sparkles, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react-native';
import { Theme } from '../../theme';

interface TherapistBriefScreenProps {
  navigation: any;
  route: any;
}

export const TherapistBriefScreen: React.FC<TherapistBriefScreenProps> = ({ navigation, route }) => {
  const clientName = route.params?.clientName || 'Aarav Patel';

  const handleAgree = () => {
    Alert.alert('Confidentiality Verified', 'Access logs have been signed under your practitioner license ID.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Back Header */}
      <View style={styles.backRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color={Theme.colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Client Brief</Text>
      </View>

      {/* Privacy Guarantee Gate banner */}
      <View style={styles.privacyGate}>
        <View style={styles.privacyHead}>
          <ShieldCheck size={18} color={Theme.colors.primary} />
          <Text style={styles.privacyTitle}>Strict HIPAA & Ethics Shield</Text>
        </View>
        <Text style={styles.privacyDesc}>
          This brief synthesizes aggregated, anonymous sentiment indicators and automated thought types logged with Manas. Journal text scripts are fully locked.
        </Text>
      </View>

      {/* Patient overview header */}
      <View style={styles.patientCard}>
        <Text style={styles.patientPre}>SYNTHESIZED OVERVIEW</Text>
        <Text style={styles.patientName}>{clientName}</Text>
        <Text style={styles.patientSub}>Active seeker since March 2026</Text>
      </View>

      {/* Sentiment Trend summary */}
      <View style={styles.card}>
        <View style={styles.secHeader}>
          <TrendingUp size={16} color={Theme.colors.primary} />
          <Text style={styles.secTitle}>Sentiment Trend Summary</Text>
        </View>
        <Text style={styles.bodyText}>
          Aarav's mood history shows stable baseline scores (average 4.2/7) with isolated emotional spikes corresponding to professional/occupational stressors. Peak anxiety spikes typically occur on Sunday evenings.
        </Text>
      </View>

      {/* Distortions Identified */}
      <View style={styles.card}>
        <View style={styles.secHeader}>
          <AlertCircle size={16} color={Theme.colors.secondary} />
          <Text style={styles.secTitle}>Cognitive Traps & Distortions</Text>
        </View>
        <Text style={styles.bodyText}>
          Synthesized from daily journaling categories:
        </Text>
        
        <View style={styles.bulletList}>
          <View style={styles.bulletItem}>
            <View style={styles.dot} />
            <Text style={styles.bulletText}>
              <Text style={styles.boldText}>Catastrophizing (High):</Text> Anticipating catastrophic vocational failure based on minor presentation feedback.
            </Text>
          </View>
          <View style={styles.bulletItem}>
            <View style={styles.dot} />
            <Text style={styles.bulletText}>
              <Text style={styles.boldText}>All-or-Nothing (Medium):</Text> Framing work outputs as either flawless or complete failures.
            </Text>
          </View>
        </View>
      </View>

      {/* Suggested clinical exercises */}
      <View style={styles.card}>
        <View style={styles.secHeader}>
          <Sparkles size={16} color={Theme.colors.tertiary} />
          <Text style={styles.secTitle}>Recommended CBT Protocols</Text>
        </View>
        <Text style={styles.bodyText}>
          Manas AI has highlighted these practices for your upcoming WebRTC consultation:
        </Text>

        <View style={styles.checkList}>
          <View style={styles.checkItem}>
            <CheckCircle size={16} color={Theme.colors.primary} />
            <Text style={styles.checkText}>Challenging work-competence assumptions (Objective Reframer)</Text>
          </View>
          <View style={styles.checkItem}>
            <CheckCircle size={16} color={Theme.colors.primary} />
            <Text style={styles.checkText}>Relaxation guide timing sheets (4-4-4 Box breathing)</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity onPress={handleAgree} style={styles.actionBtn}>
        <Text style={styles.actionBtnText}>Acknowledge & Confirm Access</Text>
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
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
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
  privacyGate: {
    backgroundColor: Theme.colors.primary + '10',
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.primary + '20',
  },
  privacyHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  privacyTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 14,
    color: Theme.colors.primaryContainer,
  },
  privacyDesc: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
    lineHeight: 18,
  },
  patientCard: {
    backgroundColor: '#FFF',
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceHigh,
    alignItems: 'center',
  },
  patientPre: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 10,
    color: Theme.colors.secondary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  patientName: {
    fontFamily: Theme.fonts.display,
    fontSize: 22,
    color: Theme.colors.onSurface,
  },
  patientSub: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: 2,
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
    gap: 8,
  },
  secHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  secTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 15,
    color: Theme.colors.onSurface,
  },
  bodyText: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: Theme.colors.onSurfaceVariant,
    lineHeight: 18,
  },
  bulletList: {
    gap: 8,
    marginTop: 2,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.outline,
    marginTop: 6,
  },
  bulletText: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
    flex: 1,
    lineHeight: 16,
  },
  boldText: {
    fontFamily: Theme.fonts.bodyBold,
    color: Theme.colors.onSurface,
  },
  checkList: {
    gap: 8,
    marginTop: 2,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkText: {
    fontFamily: Theme.fonts.bodyMedium,
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
    flex: 1,
  },
  actionBtn: {
    backgroundColor: Theme.colors.primary,
    height: 52,
    borderRadius: Theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Theme.spacing.xs,
  },
  actionBtnText: {
    color: '#FFF',
    fontFamily: Theme.fonts.headline,
    fontSize: 14,
  },
});
export default TherapistBriefScreen;
