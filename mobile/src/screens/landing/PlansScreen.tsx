import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import { CheckCircle } from 'lucide-react-native';
import API from '../../lib/api';
import { Theme } from '../../theme';
import { PlanCard, PlanData } from '../../components/PlanCard';

interface PlansScreenProps {
  navigation: any;
}

export const PlansScreen: React.FC<PlansScreenProps> = ({ navigation }) => {
  const { isSignedIn } = useAuth();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [plans, setPlans] = useState<PlanData[]>([
    {
      id: 'free',
      name: 'Free Tier',
      price: 0,
      interval: 'month',
      features: ['7 daily Manas AI chats', 'CBT mood checker', 'Basic statistics history'],
      audience: 'user',
      highlighted: false,
    },
    {
      id: 'mann_shanti',
      name: 'Mann Shanti',
      price: 199,
      interval: 'month',
      features: ['100 daily Manas AI chats', 'Unlimited CBT journaling', 'Comprehensive wellness history', 'Direct Therapist booking'],
      audience: 'user',
      highlighted: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise / Corporate',
      price: 499,
      interval: 'month',
      features: ['Full org seat allocation', 'Burnout predictive alerts', 'Anonymous team aggregate mood grids', 'Dedicated wellness support'],
      audience: 'organization',
      highlighted: false,
    }
  ]);

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => API.auth.me().catch(() => null),
    retry: false,
  });

  const { data: remotePlans, isLoading } = useQuery({
    queryKey: ['plansList'],
    queryFn: () => API.plan.getAll(),
    retry: false,
  });

  const { data: subscriptionData, isLoading: isSubscriptionLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => API.subscription.get().catch(() => null),
    retry: false,
    enabled: !!isSignedIn,
  });

  useEffect(() => {
    if (remotePlans) {
      const planList = Array.isArray(remotePlans) 
        ? remotePlans 
        : (remotePlans.plans && Array.isArray(remotePlans.plans) ? remotePlans.plans : []);
      if (planList.length > 0) {
        setPlans(planList);
      }
    }
  }, [remotePlans]);

  const role = userProfile?.role || 'user';
  const orgId = userProfile?.orgId;

  // Filter plans list based on audience role
  const filteredPlans = plans.filter(plan => {
    if (role === 'org_admin') {
      return plan.audience === 'organization';
    } else if (role === 'therapist') {
      return plan.audience === 'therapist';
    } else {
      return plan.audience === 'user';
    }
  });

  const currentTier = subscriptionData?.tier ?? 'free';
  const hasPendingSub = subscriptionData?.subscription?.status === 'pending';
  const pendingPlanName = hasPendingSub ? subscriptionData?.subscription?.plan : null;

  const handleSelectPlan = async (plan: PlanData) => {
    if (plan.price === 0) {
      Alert.alert('Free Activated', 'You are currently on the Free Tier!');
      return;
    }

    if (hasPendingSub) {
      Alert.alert(
        'Payment Pending',
        'You already have a subscription payment pending. Please complete the checkout in your browser or wait for verification.'
      );
      return;
    }

    const isPlanActive = currentTier === plan.id || currentTier === plan._id || currentTier === plan.name;
    if (isPlanActive) {
      Alert.alert('Plan Active', 'You are already subscribed to this plan!');
      return;
    }
    
    if (!isSignedIn) {
      // Redirect to login to upgrade
      Alert.alert(
        `Upgrade to ${plan.name}`,
        `Would you like to subscribe to ${plan.name} for ₹${plan.price}/${plan.interval}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Proceed to Login', 
            onPress: () => navigation.navigate('Login', { role: 'user', upgradePlan: plan.id || plan._id }) 
          }
        ]
      );
      return;
    }

    // Process logged-in upgrade checkout
    Alert.alert(
      `Confirm Upgrade`,
      `Would you like to subscribe to ${plan.name} for ₹${plan.price}/${plan.interval} via Razorpay?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe Now',
          onPress: async () => {
            setCheckoutLoading(true);
            try {
              // 1. Create Razorpay Subscription
              const res = await API.subscription.upgrade({ tier: (plan.id || plan._id || '') as string });
              const shortUrl = res?.shortUrl;

              if (!shortUrl) {
                throw new Error("Could not retrieve secure payment URL.");
              }

              // 2. Open Razorpay Gateway in browser
              Alert.alert(
                'Razorpay Gateway',
                'Launching secure payment checkout. Please complete the subscription payment in the opened browser window.',
                [
                  {
                    text: 'Open Checkout',
                    onPress: async () => {
                      await WebBrowser.openBrowserAsync(shortUrl);
                      Alert.alert(
                        'Payment Processing',
                        'Your payment is being verified securely by Razorpay. Once done, your account will be activated instantly!',
                        [
                          { text: 'OK', onPress: () => navigation.goBack() }
                        ]
                      );
                    }
                  }
                ]
              );

            } catch (err: any) {
              console.warn("Upgrade checkout failed:", err);
              Alert.alert(
                'Checkout Error',
                err?.message || 'We could not initiate the checkout gateway at this moment. Please check your network connection.'
              );
            } finally {
              setCheckoutLoading(false);
            }
          }
        }
      ]
    );
  };

  // Corporate affiliate therapists are fully sponsored by their organizations
  if (role === 'therapist' && orgId) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <View style={styles.sponsoredCard}>
          <CheckCircle size={48} color={Theme.colors.primary} style={styles.sponsoredIcon} />
          <Text style={styles.sponsoredTitle}>Corporate Sponsored Workspace</Text>
          <Text style={styles.sponsoredDesc}>
            Your therapist profile is affiliated with an active organization. Subscription fees and premium seats are fully funded directly by your organization.
          </Text>
          <Text style={styles.sponsoredSub}>
            No individual subscription payment is required!
          </Text>
          
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Text style={styles.backBtnText}>Return to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Simple, Transparent Pricing</Text>
        <Text style={styles.subtitle}>Choose a tier aligned with your professional mental well-being goals.</Text>
      </View>

      {(isLoading || (isSignedIn && isSubscriptionLoading)) && (
        <ActivityIndicator size="large" color={Theme.colors.primary} style={styles.loader} />
      )}

      {checkoutLoading && (
        <ActivityIndicator size="large" color={Theme.colors.secondary} style={styles.loader} />
      )}

      <View style={styles.cardsWrapper}>
        {filteredPlans.length > 0 ? (
          filteredPlans.map((plan, idx) => {
            const isPlanActive = currentTier === plan.id || currentTier === plan._id || currentTier === plan.name;
            const isPending = hasPendingSub && 
              (pendingPlanName === plan.id || 
               pendingPlanName === plan._id || 
               pendingPlanName === plan.name);
            return (
              <PlanCard
                key={plan.id || plan._id || idx.toString()}
                plan={plan}
                isActive={isPlanActive}
                btnLabel={isPending ? 'Payment Pending' : undefined}
                onPress={() => handleSelectPlan(plan)}
              />
            );
          })
        ) : (
          <View style={styles.emptyPlansCard}>
            <Text style={styles.emptyPlansText}>No plans available for your role at this time.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.margin,
  },
  content: {
    padding: Theme.spacing.margin,
    paddingBottom: Theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
    textAlign: 'center',
  },
  title: {
    paddingTop: Theme.spacing.lg,
    fontFamily: Theme.fonts.display,
    fontSize: 26,
    color: Theme.colors.primary,
  },
  subtitle: {
    fontFamily: Theme.fonts.bodyMedium,
    fontSize: 14,
    color: Theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: Theme.spacing.xs - 2,
    lineHeight: 20,
  },
  loader: {
    marginVertical: Theme.spacing.md,
  },
  cardsWrapper: {
    marginTop: Theme.spacing.xs,
  },
  sponsoredCard: {
    backgroundColor: '#FFF',
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.lg,
    alignItems: 'center',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.surfaceHigh,
    shadowColor: '#2E6E65',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
    width: '100%',
    maxWidth: 340,
  },
  sponsoredIcon: {
    marginBottom: Theme.spacing.md,
  },
  sponsoredTitle: {
    fontFamily: Theme.fonts.display,
    fontSize: 20,
    color: Theme.colors.primary,
    textAlign: 'center',
    marginBottom: Theme.spacing.sm,
  },
  sponsoredDesc: {
    fontFamily: Theme.fonts.body,
    fontSize: 13.5,
    color: Theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Theme.spacing.md,
  },
  sponsoredSub: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 12.5,
    color: Theme.colors.primary,
    textAlign: 'center',
    marginBottom: Theme.spacing.lg,
  },
  backBtn: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: Theme.spacing.lg,
    borderRadius: Theme.radius.full,
    width: '100%',
    alignItems: 'center',
  },
  backBtnText: {
    fontFamily: Theme.fonts.headline,
    fontSize: 13.5,
    color: '#FFF',
  },
  emptyPlansCard: {
    backgroundColor: '#FFF',
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.surfaceHigh,
  },
  emptyPlansText: {
    fontFamily: Theme.fonts.bodyMedium,
    fontSize: 13.5,
    color: Theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
});

export default PlansScreen;
