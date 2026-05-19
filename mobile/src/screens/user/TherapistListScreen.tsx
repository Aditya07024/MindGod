import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, FlatList, TextInput, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, Star } from 'lucide-react-native';
import API from '../../lib/api';
import { Theme } from '../../theme';
import { TherapistCard, TherapistData } from '../../components/TherapistCard';

interface TherapistListScreenProps {
  navigation: any;
}

export const TherapistListScreen: React.FC<TherapistListScreenProps> = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  
  const specialtyFilters = ['All', 'CBT', 'Anxiety', 'Depression', 'Relationships', 'ADHD', 'Career'];

  // Query backend therapists
  const { data: remoteTherapists, isLoading } = useQuery({
    queryKey: ['therapistsList', selectedSpecialty],
    queryFn: () => API.therapist.list(selectedSpecialty !== 'All' ? { specialty: selectedSpecialty } : undefined),
    retry: false,
  });

  const [therapists, setTherapists] = useState<TherapistData[]>([]);

  useEffect(() => {
    if (remoteTherapists && Array.isArray(remoteTherapists)) {
      setTherapists(remoteTherapists);
    }
  }, [remoteTherapists]);

  // Filter local state based on search query
  const filteredTherapists = therapists.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.specialties?.some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <View style={styles.container}>
      {/* Marketplace Search Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Find Your Therapist</Text>
        <Text style={styles.subtitle}>Book private sessions with vetted human professionals</Text>

        {/* Input Bar */}
        <View style={styles.searchBar}>
          <Search size={18} color={Theme.colors.outline} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search specialties, names, languages…"
            placeholderTextColor={Theme.colors.outline}
            style={styles.searchInput}
          />
          <TouchableOpacity style={styles.filterBtn}>
            <SlidersHorizontal size={18} color={Theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Specialty Filter Chips Row */}
      <View style={styles.filterWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {specialtyFilters.map(filter => {
            const active = selectedSpecialty === filter;
            return (
              <TouchableOpacity
                key={filter}
                onPress={() => setSelectedSpecialty(filter)}
                style={[
                  styles.chip,
                  active && styles.chipActive
                ]}
              >
                <Text style={[
                  styles.chipText,
                  active && styles.chipTextActive
                ]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Therapist List */}
      {isLoading ? (
        <ActivityIndicator size="large" color={Theme.colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={filteredTherapists}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TherapistCard
              therapist={item}
              onPress={() => navigation.navigate('TherapistDetail', { therapist: item })}
              onBookPress={() => navigation.navigate('Booking', { therapist: item })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyView}>
              <Text style={styles.emptyText}>No practitioners matching your search query.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    backgroundColor: '#FFF',
    paddingHorizontal: Theme.spacing.margin,
    paddingTop: 50,
    paddingBottom: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.surfaceHigh,
  },
  title: {
    fontFamily: Theme.fonts.display,
    fontSize: 24,
    color: Theme.colors.primary,
  },
  subtitle: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.surfaceHigh,
    borderRadius: Theme.radius.full,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: Theme.colors.surfaceLow,
    marginTop: Theme.spacing.sm,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.onSurface,
  },
  filterBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterWrapper: {
    paddingVertical: Theme.spacing.xs,
    backgroundColor: Theme.colors.background,
  },
  filterContent: {
    paddingHorizontal: Theme.spacing.margin,
    gap: 8,
  },
  chip: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Theme.radius.full,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceHigh,
  },
  chipActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  chipText: {
    fontFamily: Theme.fonts.bodyMedium,
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
  },
  chipTextActive: {
    color: '#FFF',
  },
  listContent: {
    padding: Theme.spacing.margin,
    paddingBottom: 60,
  },
  loader: {
    marginTop: Theme.spacing.xl,
  },
  emptyView: {
    alignItems: 'center',
    paddingTop: Theme.spacing.xl,
  },
  emptyText: {
    fontFamily: Theme.fonts.body,
    fontSize: 14,
    color: Theme.colors.textMuted,
  },
});
export default TherapistListScreen;
