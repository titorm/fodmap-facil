import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ReportMetrics } from '../types';
import { lightColors, spacing, borderRadius, shadows } from '../../../shared/theme/tokens';

interface MetricsSummaryProps {
  data: ReportMetrics;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  accessibilityLabel?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  color = lightColors.primary500,
  accessibilityLabel,
}) => {
  const fullAccessibilityLabel =
    accessibilityLabel || `${title}: ${value}${subtitle ? `, ${subtitle}` : ''}`;

  return (
    <View
      style={styles.metricCard}
      accessible={true}
      accessibilityRole="summary"
      accessibilityLabel={fullAccessibilityLabel}
    >
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
  );
};

const MetricsSummaryComponent: React.FC<MetricsSummaryProps> = ({ data }) => {
  // Format protocol duration
  const formatDuration = (days: number): string => {
    if (days === 0) return 'Iniciado hoje';
    if (days === 1) return '1 dia';
    if (days < 7) return `${days} dias`;
    if (days < 30) {
      const weeks = Math.floor(days / 7);
      return weeks === 1 ? '1 semana' : `${weeks} semanas`;
    }
    const months = Math.floor(days / 30);
    return months === 1 ? '1 mês' : `${months} meses`;
  };

  // Format percentage
  const formatPercentage = (value: number): string => {
    return `${Math.round(value)}%`;
  };

  // Format severity
  const formatSeverity = (value: number): string => {
    if (value === 0) return 'Nenhum';
    return value.toFixed(1);
  };

  // Get severity color
  const getSeverityColor = (value: number): string => {
    if (value === 0) return lightColors.success;
    if (value < 3) return lightColors.success;
    if (value < 6) return lightColors.warning;
    return lightColors.error;
  };

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="summary"
      accessibilityLabel="Resumo geral de métricas do protocolo FODMAP"
    >
      <Text style={styles.sectionTitle}>Resumo Geral</Text>

      {/* Main metrics grid */}
      <View
        style={styles.metricsGrid}
        accessible={true}
        accessibilityRole="list"
        accessibilityLabel="Métricas principais do protocolo"
      >
        <MetricCard
          title="Testes Concluídos"
          value={data.totalTestsCompleted}
          subtitle={
            data.totalTestsInProgress > 0 ? `${data.totalTestsInProgress} em andamento` : undefined
          }
          color={lightColors.primary500}
          accessibilityLabel={`Testes concluídos: ${data.totalTestsCompleted}${
            data.totalTestsInProgress > 0 ? `, ${data.totalTestsInProgress} em andamento` : ''
          }`}
        />

        <MetricCard
          title="Grupos Testados"
          value={formatPercentage(data.groupsTestedPercentage)}
          subtitle="de 4 grupos FODMAP"
          color={
            data.groupsTestedPercentage >= 75
              ? lightColors.success
              : data.groupsTestedPercentage >= 50
                ? lightColors.warning
                : lightColors.error
          }
          accessibilityLabel={`Grupos testados: ${formatPercentage(data.groupsTestedPercentage)} de 4 grupos FODMAP`}
        />

        <MetricCard
          title="Severidade Média"
          value={formatSeverity(data.averageSymptomSeverity)}
          subtitle="escala de 0 a 10"
          color={getSeverityColor(data.averageSymptomSeverity)}
          accessibilityLabel={`Severidade média dos sintomas: ${formatSeverity(data.averageSymptomSeverity)} em uma escala de 0 a 10`}
        />

        <MetricCard
          title="Duração do Protocolo"
          value={formatDuration(data.protocolDuration)}
          subtitle={format(data.protocolStartDate, "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
          color={lightColors.info}
          accessibilityLabel={`Duração do protocolo: ${formatDuration(data.protocolDuration)}, iniciado em ${format(data.protocolStartDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`}
        />
      </View>

      {/* Tolerance distribution */}
      <View
        style={styles.toleranceSection}
        accessible={true}
        accessibilityRole="summary"
        accessibilityLabel="Distribuição de tolerância alimentar"
      >
        <Text style={styles.subsectionTitle}>Distribuição de Tolerância</Text>

        <View
          style={styles.toleranceGrid}
          accessible={true}
          accessibilityRole="list"
          accessibilityLabel="Categorias de tolerância"
        >
          <View
            style={styles.toleranceCard}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel={`${data.toleratedFoodsCount} alimentos tolerados`}
          >
            <View
              style={[styles.toleranceIndicator, { backgroundColor: lightColors.success }]}
              accessible={false}
            />
            <View style={styles.toleranceContent}>
              <Text style={styles.toleranceValue}>{data.toleratedFoodsCount}</Text>
              <Text style={styles.toleranceLabel}>Tolerados</Text>
            </View>
          </View>

          <View
            style={styles.toleranceCard}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel={`${data.moderateFoodsCount} alimentos com tolerância moderada`}
          >
            <View
              style={[styles.toleranceIndicator, { backgroundColor: lightColors.warning }]}
              accessible={false}
            />
            <View style={styles.toleranceContent}>
              <Text style={styles.toleranceValue}>{data.moderateFoodsCount}</Text>
              <Text style={styles.toleranceLabel}>Moderados</Text>
            </View>
          </View>

          <View
            style={styles.toleranceCard}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel={`${data.triggerFoodsCount} alimentos identificados como gatilhos`}
          >
            <View
              style={[styles.toleranceIndicator, { backgroundColor: lightColors.error }]}
              accessible={false}
            />
            <View style={styles.toleranceContent}>
              <Text style={styles.toleranceValue}>{data.triggerFoodsCount}</Text>
              <Text style={styles.toleranceLabel}>Gatilhos</Text>
            </View>
          </View>
        </View>

        {/* Total foods tested */}
        <View
          style={styles.totalRow}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={`Total de alimentos testados: ${data.toleratedFoodsCount + data.moderateFoodsCount + data.triggerFoodsCount}`}
        >
          <Text style={styles.totalLabel}>Total de Alimentos Testados:</Text>
          <Text style={styles.totalValue}>
            {data.toleratedFoodsCount + data.moderateFoodsCount + data.triggerFoodsCount}
          </Text>
        </View>
      </View>
    </View>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const MetricsSummary = React.memo(MetricsSummaryComponent, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data);
});

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    backgroundColor: lightColors.backgroundSecondary,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: lightColors.text,
    marginBottom: spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  metricCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: lightColors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  metricTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: lightColors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  metricSubtitle: {
    fontSize: 12,
    color: lightColors.textTertiary,
  },
  toleranceSection: {
    backgroundColor: lightColors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: lightColors.text,
    marginBottom: spacing.md,
  },
  toleranceGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  toleranceCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: lightColors.backgroundSecondary,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
  },
  toleranceIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: spacing.sm,
  },
  toleranceContent: {
    flex: 1,
  },
  toleranceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: lightColors.text,
  },
  toleranceLabel: {
    fontSize: 12,
    color: lightColors.textSecondary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: lightColors.border,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: lightColors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: lightColors.primary500,
  },
});
