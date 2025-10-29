import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { TestHistoryItem } from '../types';
import type { FodmapGroup, TestStepStatus, ToleranceLevel } from '../../../shared/types/entities';
import { lightColors, spacing, borderRadius, shadows } from '../../../shared/theme/tokens';

interface TestHistoryListProps {
  data: TestHistoryItem[];
  onTestPress?: (testId: string) => void;
}

// FODMAP group labels in Portuguese
const GROUP_LABELS: Record<FodmapGroup, string> = {
  oligosaccharides: 'Oligossacarídeos',
  disaccharides: 'Dissacarídeos',
  monosaccharides: 'Monossacarídeos',
  polyols: 'Polióis',
};

// Status labels in Portuguese
const STATUS_LABELS: Record<TestStepStatus, string> = {
  pending: 'Pendente',
  in_progress: 'Em Andamento',
  completed: 'Concluído',
  skipped: 'Ignorado',
};

// Tolerance labels in Portuguese
const TOLERANCE_LABELS: Record<ToleranceLevel, string> = {
  high: 'Tolerado',
  moderate: 'Moderado',
  low: 'Gatilho',
  none: 'Gatilho',
};

// Status colors
const STATUS_COLORS: Record<TestStepStatus, string> = {
  pending: '#9E9E9E',
  in_progress: '#2196F3',
  completed: '#4CAF50',
  skipped: '#FF9800',
};

// Tolerance colors
const TOLERANCE_COLORS: Record<ToleranceLevel, string> = {
  high: '#4CAF50',
  moderate: '#FF9800',
  low: '#F44336',
  none: '#F44336',
};

const TestHistoryListComponent: React.FC<TestHistoryListProps> = ({ data, onTestPress }) => {
  const renderTestCard = ({ item }: { item: TestHistoryItem }) => {
    const statusColor = STATUS_COLORS[item.status];
    const toleranceColor = item.toleranceOutcome
      ? TOLERANCE_COLORS[item.toleranceOutcome]
      : '#9E9E9E';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => onTestPress?.(item.id)}
        activeOpacity={0.7}
        accessible={true}
        accessibilityLabel={`Teste de ${item.foodName}, status ${STATUS_LABELS[item.status]}`}
        accessibilityHint="Toque para ver detalhes do teste"
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.foodName}>{item.foodName}</Text>
            <Text style={styles.groupLabel}>{GROUP_LABELS[item.fodmapGroup]}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{STATUS_LABELS[item.status]}</Text>
          </View>
        </View>

        {/* Date info */}
        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>Data do Teste:</Text>
          <Text style={styles.dateValue}>
            {format(item.testDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </Text>
        </View>

        {item.completionDate && (
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Concluído em:</Text>
            <Text style={styles.dateValue}>
              {format(item.completionDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </Text>
          </View>
        )}

        {/* Tolerance outcome */}
        {item.toleranceOutcome && (
          <View style={styles.toleranceRow}>
            <Text style={styles.toleranceLabel}>Resultado:</Text>
            <View style={[styles.toleranceBadge, { backgroundColor: toleranceColor }]}>
              <Text style={styles.toleranceText}>{TOLERANCE_LABELS[item.toleranceOutcome]}</Text>
            </View>
          </View>
        )}

        {/* Symptom info */}
        <View style={styles.symptomRow}>
          <View style={styles.symptomItem}>
            <Text style={styles.symptomLabel}>Sintomas:</Text>
            <Text style={styles.symptomValue}>{item.symptomCount}</Text>
          </View>
          <View style={styles.symptomItem}>
            <Text style={styles.symptomLabel}>Severidade Média:</Text>
            <Text style={styles.symptomValue}>
              {item.averageSeverity > 0 ? item.averageSeverity.toFixed(1) : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {item.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Notas:</Text>
            <Text style={styles.notesText} numberOfLines={2}>
              {item.notes}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View
      style={styles.emptyState}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel="Estado vazio: Nenhum teste encontrado"
      accessibilityHint="Comece seu protocolo de reintrodução para ver seu histórico de testes aqui"
    >
      <Text style={styles.emptyTitle}>Nenhum teste encontrado</Text>
      <Text style={styles.emptyText}>
        Comece seu protocolo de reintrodução para ver seu histórico de testes aqui.
      </Text>
    </View>
  );

  const renderSeparator = () => <View style={styles.separator} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        renderItem={renderTestCard}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={renderSeparator}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[styles.listContent, data.length === 0 && styles.emptyListContent]}
        showsVerticalScrollIndicator={true}
        accessible={true}
        accessibilityRole="list"
        accessibilityLabel={`Lista de histórico de testes com ${data.length} ${data.length === 1 ? 'teste' : 'testes'}`}
        accessibilityHint="Deslize para ver todos os testes. Toque em um teste para ver detalhes"
      />
    </View>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const TestHistoryList = React.memo(TestHistoryListComponent, (prevProps, nextProps) => {
  return (
    prevProps.data.length === nextProps.data.length &&
    prevProps.onTestPress === nextProps.onTestPress
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightColors.backgroundSecondary,
  },
  listContent: {
    padding: spacing.md,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: lightColors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.md,
  },
  separator: {
    height: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  foodName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: lightColors.text,
    marginBottom: 4,
  },
  groupLabel: {
    fontSize: 14,
    color: lightColors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  dateLabel: {
    fontSize: 14,
    color: lightColors.textSecondary,
    marginRight: spacing.xs,
  },
  dateValue: {
    fontSize: 14,
    color: lightColors.text,
    fontWeight: '500',
  },
  toleranceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  toleranceLabel: {
    fontSize: 14,
    color: lightColors.textSecondary,
    marginRight: spacing.sm,
  },
  toleranceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  toleranceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  symptomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: lightColors.border,
  },
  symptomItem: {
    flex: 1,
  },
  symptomLabel: {
    fontSize: 12,
    color: lightColors.textSecondary,
    marginBottom: 4,
  },
  symptomValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: lightColors.text,
  },
  notesContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: lightColors.border,
  },
  notesLabel: {
    fontSize: 12,
    color: lightColors.textSecondary,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: lightColors.text,
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: lightColors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: lightColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
