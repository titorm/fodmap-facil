import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ViewStyle,
  TextStyle,
  SectionList,
} from 'react-native';
import { useTheme } from '../../../shared/theme';
import { useSymptomEntries, useDeleteSymptomEntry } from '../../../shared/hooks/useSymptomEntries';
import { QuickSymptomEntryModal } from '../components/QuickSymptomEntryModal';
import { SymptomEntryCard } from '../components/SymptomEntryCard';
import { DiaryEmptyState } from '../components/DiaryEmptyState';
import type { SymptomEntry, SymptomType } from '../../../shared/types/entities';

interface GroupedSymptomEntry {
  title: string;
  data: SymptomEntry[];
}

/**
 * DiaryScreen Component
 *
 * Main diary view showing symptom history with filtering and quick entry.
 *
 * Features:
 * - List of symptom entries grouped by date
 * - Floating action button for quick entry
 * - Filter by symptom type
 * - Empty state for new users
 * - Pull-to-refresh
 * - Virtualized list for performance
 *
 * @example
 * ```tsx
 * <DiaryScreen />
 * ```
 */
export function DiaryScreen() {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius, shadows } = theme;

  // TODO: Get current test step ID from context or navigation
  const testStepId = 'test-step-1'; // Placeholder

  const { data: symptomEntries = [], isLoading, refetch } = useSymptomEntries(testStepId);
  const deleteMutation = useDeleteSymptomEntry();

  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState<SymptomType | 'all'>('all');

  // Filter symptoms by type
  const filteredSymptoms = useMemo(() => {
    if (filterType === 'all') return symptomEntries;
    return symptomEntries.filter((entry) => entry.symptomType === filterType);
  }, [symptomEntries, filterType]);

  // Group symptoms by date
  const groupedSymptoms = useMemo(() => {
    const groups: Record<string, SymptomEntry[]> = {};

    filteredSymptoms.forEach((entry) => {
      const date = new Date(entry.timestamp);
      const dateKey = date.toLocaleDateString();

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(entry);
    });

    // Convert to array and sort by date (most recent first)
    return Object.entries(groups)
      .map(([title, data]) => ({
        title,
        data: data.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
      }))
      .sort((a, b) => {
        const dateA = new Date(a.data[0].timestamp);
        const dateB = new Date(b.data[0].timestamp);
        return dateB.getTime() - dateA.getTime();
      });
  }, [filteredSymptoms]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete symptom:', error);
        // TODO: Show error toast
      }
    },
    [deleteMutation]
  );

  const handleOpenModal = useCallback(() => {
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const handleFilterChange = useCallback((type: SymptomType | 'all') => {
    setFilterType(type);
  }, []);

  // Memoize section header renderer
  const renderSectionHeader = useCallback(
    ({ section: { title } }: any) => (
      <View style={sectionHeaderStyle}>
        <Text
          style={sectionHeaderTextStyle}
          accessibilityRole="header"
          allowFontScaling={true}
          maxFontSizeMultiplier={2}
        >
          {title}
        </Text>
      </View>
    ),
    [sectionHeaderStyle, sectionHeaderTextStyle]
  );

  // Memoize item renderer
  const renderItem = useCallback(
    ({ item }: { item: SymptomEntry }) => (
      <SymptomEntryCard entry={item} onDelete={() => handleDelete(item.id)} />
    ),
    [handleDelete]
  );

  // Memoize separator
  const ItemSeparator = useCallback(
    () => <View style={itemSeparatorStyle} />,
    [itemSeparatorStyle]
  );

  // Memoize key extractor
  const keyExtractor = useCallback((item: SymptomEntry) => item.id, []);

  // Styles
  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.background,
  };

  const headerStyle: ViewStyle = {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  };

  const titleStyle: TextStyle = {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  };

  const filterContainerStyle: ViewStyle = {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  };

  const filterButtonStyle = (isActive: boolean): ViewStyle => ({
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: isActive ? colors.primary500 : colors.surface,
    borderWidth: 1,
    borderColor: isActive ? colors.primary500 : colors.border,
  });

  const filterButtonTextStyle = (isActive: boolean): TextStyle => ({
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: isActive ? colors.textOnPrimary : colors.text,
  });

  const sectionHeaderStyle: ViewStyle = {
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
  };

  const sectionHeaderTextStyle: TextStyle = {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  };

  const listContentStyle: ViewStyle = {
    padding: spacing.lg,
    paddingBottom: spacing.xl + 60, // Extra padding for FAB
  };

  const itemSeparatorStyle: ViewStyle = {
    height: spacing.md,
  };

  const fabStyle: ViewStyle = {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary500,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  };

  const fabTextStyle: TextStyle = {
    fontSize: 24,
    color: colors.textOnPrimary,
  };

  const filterTypes: Array<{ type: SymptomType | 'all'; label: string }> = [
    { type: 'all', label: 'All' },
    { type: 'bloating', label: 'Bloating' },
    { type: 'pain', label: 'Pain' },
    { type: 'gas', label: 'Gas' },
    { type: 'diarrhea', label: 'Diarrhea' },
    { type: 'constipation', label: 'Constipation' },
  ];

  // Show empty state if no symptoms
  if (!isLoading && symptomEntries.length === 0) {
    return (
      <View style={containerStyle}>
        <View style={headerStyle}>
          <Text style={titleStyle}>Symptom Diary</Text>
        </View>
        <DiaryEmptyState onLogFirstSymptom={handleOpenModal} />
        <QuickSymptomEntryModal
          visible={showModal}
          onClose={handleCloseModal}
          testStepId={testStepId}
        />
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      {/* Header with Filters */}
      <View style={headerStyle}>
        <Text
          style={titleStyle}
          accessibilityRole="header"
          allowFontScaling={true}
          maxFontSizeMultiplier={2}
        >
          Symptom Diary
        </Text>
        <FlatList
          horizontal
          data={filterTypes}
          keyExtractor={(item) => item.type}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={filterButtonStyle(filterType === item.type)}
              onPress={() => handleFilterChange(item.type)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${item.label}`}
              accessibilityHint={`Show only ${item.label} symptoms`}
              accessibilityState={{ selected: filterType === item.type }}
            >
              <Text
                style={filterButtonTextStyle(filterType === item.type)}
                allowFontScaling={true}
                maxFontSizeMultiplier={2}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={filterContainerStyle}
        />
      </View>

      {/* Symptom List */}
      <SectionList
        sections={groupedSymptoms}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={listContentStyle}
        ItemSeparatorComponent={ItemSeparator}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.primary500}
          />
        }
        stickySectionHeadersEnabled={true}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={10}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={fabStyle}
        onPress={handleOpenModal}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Log symptom"
        accessibilityHint="Open quick symptom entry form"
      >
        <Text style={fabTextStyle}>+</Text>
      </TouchableOpacity>

      {/* Quick Entry Modal */}
      <QuickSymptomEntryModal
        visible={showModal}
        onClose={handleCloseModal}
        testStepId={testStepId}
      />
    </View>
  );
}
