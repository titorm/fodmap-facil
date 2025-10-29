import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../shared/theme';
import { useAuth } from '../../../shared/hooks/useAuth';
import { lightColors, spacing, borderRadius, shadows } from '../../../shared/theme/tokens';
import { useReportData, useReportCacheInvalidation } from '../hooks';
import {
  MetricsSummary,
  ToleranceChart,
  TestHistoryList,
  SymptomTimelineChart,
  ChartSkeleton,
  MetricsSkeleton,
  TestHistorySkeleton,
} from '../components';
import { Toast } from '../../../shared/components/Toast';
import { PDFGenerationModal } from '../../../shared/components/PDFGenerationModal';
import { pdfService, type ReportError, ReportErrorType } from '../../../services/reporting';
import type { TestStepStatus } from '../../../shared/types/entities';
import type { DateRange } from '../types';

const HIGH_CONTRAST_STORAGE_KEY = '@reports_high_contrast_mode';

type TabType = 'tolerance' | 'history' | 'timeline';

interface TabConfig {
  key: TabType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const TABS: TabConfig[] = [
  { key: 'tolerance', label: 'Tolerância', icon: 'pie-chart-outline' },
  { key: 'history', label: 'Histórico', icon: 'list-outline' },
  { key: 'timeline', label: 'Linha do Tempo', icon: 'analytics-outline' },
];

export function ReportsScreen() {
  const { theme } = useTheme();
  const { colors } = theme;
  const { user } = useAuth();

  // State
  const [selectedTab, setSelectedTab] = useState<TabType>('tolerance');
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<TestStepStatus | 'all'>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isExporting, setIsExporting] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  // Fetch report data
  const {
    tolerance,
    history,
    timeline,
    fullReport,
    isLoading,
    isError,
    error: dataError,
    refetchAll,
  } = useReportData(user?.id);

  // Set up automatic cache invalidation
  useReportCacheInvalidation({
    userId: user?.id,
    enabled: true,
  });

  // Load high contrast preference on mount
  useEffect(() => {
    loadHighContrastPreference();
  }, []);

  const loadHighContrastPreference = async () => {
    try {
      const stored = await AsyncStorage.getItem(HIGH_CONTRAST_STORAGE_KEY);
      if (stored !== null) {
        setHighContrastMode(stored === 'true');
      }
    } catch (error) {
      console.error('Error loading high contrast preference:', error);
    }
  };

  const toggleHighContrastMode = async () => {
    try {
      const newValue = !highContrastMode;
      setHighContrastMode(newValue);
      await AsyncStorage.setItem(HIGH_CONTRAST_STORAGE_KEY, String(newValue));
    } catch (error) {
      console.error('Error saving high contrast preference:', error);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // Memoize filtered history data to avoid recalculation
  const filteredHistoryData = useMemo(() => {
    if (!history.data) return [];
    return historyFilter === 'all'
      ? history.data
      : history.data.filter((item) => item.status === historyFilter);
  }, [history.data, historyFilter]);

  // Memoize metrics data to avoid recalculation
  const metricsData = useMemo(() => {
    if (!tolerance.data) return null;
    return {
      totalTestsCompleted: tolerance.data.summary.testedGroups,
      totalTestsInProgress: 0,
      groupsTestedPercentage:
        (tolerance.data.summary.testedGroups / tolerance.data.summary.totalGroups) * 100,
      averageSymptomSeverity: 0,
      protocolStartDate: new Date(),
      protocolDuration: 0,
      toleratedFoodsCount: tolerance.data.summary.toleratedCount,
      moderateFoodsCount: tolerance.data.summary.moderateCount,
      triggerFoodsCount: tolerance.data.summary.triggerCount,
    };
  }, [tolerance.data]);

  const handleExportPDF = async () => {
    if (!user?.id) {
      showToast('Usuário não autenticado', 'error');
      return;
    }

    if (isExporting) {
      return;
    }

    setIsExporting(true);

    try {
      // Fetch full report data
      const reportData = await fullReport.refetch();

      if (!reportData.data) {
        showToast('Não foi possível carregar os dados do relatório', 'error');
        return;
      }

      // Generate and share PDF
      await pdfService.generateAndSharePDF(reportData.data);
      showToast('Relatório exportado com sucesso!', 'success');
    } catch (error) {
      console.error('Error exporting PDF:', error);

      // Handle ReportError with specific messages
      if (error && typeof error === 'object' && 'userMessage' in error) {
        const reportError = error as ReportError;
        showToast(reportError.userMessage, 'error');

        // Show retry option for retryable errors
        if (reportError.retryable) {
          Alert.alert('Erro ao Exportar', reportError.userMessage, [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Tentar Novamente', onPress: handleExportPDF },
          ]);
        }
      } else {
        // Generic error
        showToast('Erro ao exportar o relatório. Tente novamente.', 'error');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleRetry = async () => {
    await refetchAll();
  };

  const handleRefresh = async () => {
    await refetchAll();
  };

  // Render header with controls
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Relatórios</Text>
        <TouchableOpacity
          style={[
            styles.exportButton,
            { backgroundColor: isExporting ? colors.textTertiary : colors.primary500 },
          ]}
          onPress={handleExportPDF}
          disabled={isExporting}
          accessible={true}
          accessibilityLabel="Exportar relatório em PDF"
          accessibilityHint="Toque para gerar e compartilhar um PDF do seu relatório"
        >
          {isExporting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="download-outline" size={20} color="#FFFFFF" />
          )}
          <Text style={styles.exportButtonText}>
            {isExporting ? 'Exportando...' : 'Exportar PDF'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.headerControls}>
        <View style={styles.highContrastToggle}>
          <Ionicons
            name="contrast-outline"
            size={20}
            color={colors.text}
            style={styles.toggleIcon}
          />
          <Text style={[styles.toggleLabel, { color: colors.text }]}>Alto Contraste</Text>
          <Switch
            value={highContrastMode}
            onValueChange={toggleHighContrastMode}
            trackColor={{ false: colors.border, true: colors.primary300 }}
            thumbColor={highContrastMode ? colors.primary500 : colors.textTertiary}
            accessible={true}
            accessibilityLabel="Alternar modo de alto contraste"
            accessibilityHint={`Alto contraste está ${highContrastMode ? 'ativado' : 'desativado'}`}
          />
        </View>
      </View>
    </View>
  );

  // Render tab navigation
  const renderTabs = () => (
    <View
      style={[
        styles.tabContainer,
        { backgroundColor: colors.surface, borderBottomColor: colors.border },
      ]}
    >
      {TABS.map((tab) => {
        const isActive = selectedTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              isActive && styles.tabActive,
              isActive && { borderBottomColor: colors.primary500 },
            ]}
            onPress={() => setSelectedTab(tab.key)}
            accessible={true}
            accessibilityLabel={`Aba ${tab.label}`}
            accessibilityHint={`Toque para ver ${tab.label}`}
            accessibilityState={{ selected: isActive }}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={isActive ? colors.primary500 : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: isActive ? colors.primary500 : colors.textSecondary },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // Render loading state
  const renderLoading = () => (
    <View
      style={styles.centerContainer}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando relatórios"
      accessibilityLiveRegion="polite"
    >
      <ActivityIndicator size="large" color={colors.primary500} />
      <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
        Carregando relatórios...
      </Text>
    </View>
  );

  // Render error state
  const renderError = () => {
    let errorMessage = 'Não foi possível carregar os dados do relatório. Tente novamente.';
    let errorIcon: keyof typeof Ionicons.glyphMap = 'alert-circle-outline';
    let showRetry = true;

    // Handle ReportError with specific messages
    if (dataError && typeof dataError === 'object' && 'userMessage' in dataError) {
      const reportError = dataError as ReportError;
      errorMessage = reportError.userMessage;
      showRetry = reportError.retryable;

      // Choose icon based on error type
      switch (reportError.type) {
        case ReportErrorType.NETWORK_ERROR:
          errorIcon = 'cloud-offline-outline';
          break;
        case ReportErrorType.STORAGE_ERROR:
          errorIcon = 'save-outline';
          break;
        case ReportErrorType.PERMISSION_ERROR:
          errorIcon = 'lock-closed-outline';
          break;
        case ReportErrorType.NO_DATA_ERROR:
          errorIcon = 'document-outline';
          break;
        default:
          errorIcon = 'alert-circle-outline';
      }
    } else if (dataError instanceof Error) {
      errorMessage = dataError.message;
    }

    return (
      <View
        style={styles.centerContainer}
        accessible={true}
        accessibilityRole="alert"
        accessibilityLabel={`Erro ao carregar relatórios: ${errorMessage}`}
        accessibilityLiveRegion="assertive"
      >
        <Ionicons name={errorIcon} size={64} color={colors.error} accessible={false} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>Erro ao Carregar</Text>
        <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>{errorMessage}</Text>
        {showRetry && (
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary500 }]}
            onPress={handleRetry}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Tentar novamente"
            accessibilityHint="Toque para tentar carregar os dados novamente"
          >
            <Ionicons name="refresh-outline" size={20} color="#FFFFFF" accessible={false} />
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = (message: string) => (
    <View
      style={styles.emptyState}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`Nenhum dado disponível: ${message}`}
    >
      <Ionicons name="document-outline" size={64} color={colors.textTertiary} accessible={false} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhum Dado Disponível</Text>
      <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>{message}</Text>
    </View>
  );

  // Render Tolerance tab
  const renderToleranceTab = () => {
    if (tolerance.isLoading) {
      return (
        <View style={styles.tabContent}>
          <MetricsSkeleton />
          <View style={styles.chartContainer}>
            <ChartSkeleton title="Perfil de Tolerância por Grupo FODMAP" />
          </View>
        </View>
      );
    }

    if (!tolerance.data || tolerance.data.summary.testedGroups === 0) {
      return renderEmptyState(
        'Você ainda não completou nenhum teste. Comece sua jornada FODMAP para ver seu perfil de tolerância.'
      );
    }

    return (
      <View style={styles.tabContent}>
        {metricsData && <MetricsSummary data={metricsData} />}
        <View style={styles.chartContainer}>
          <ToleranceChart data={tolerance.data} highContrastMode={highContrastMode} />
        </View>
      </View>
    );
  };

  // Render History tab
  const renderHistoryTab = () => {
    if (history.isLoading) {
      return (
        <View style={styles.tabContent}>
          <TestHistorySkeleton />
        </View>
      );
    }

    if (!history.data || history.data.length === 0) {
      return renderEmptyState(
        'Você ainda não tem histórico de testes. Complete alguns testes para ver seu histórico aqui.'
      );
    }

    return (
      <View style={styles.tabContent}>
        {/* Filter buttons */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              historyFilter === 'all' && styles.filterButtonActive,
              historyFilter === 'all' && { backgroundColor: colors.primary500 },
              { borderColor: colors.border },
            ]}
            onPress={() => setHistoryFilter('all')}
            accessible={true}
            accessibilityLabel="Filtrar todos os testes"
            accessibilityState={{ selected: historyFilter === 'all' }}
          >
            <Text
              style={[
                styles.filterButtonText,
                historyFilter === 'all' && styles.filterButtonTextActive,
                { color: historyFilter === 'all' ? '#FFFFFF' : colors.text },
              ]}
            >
              Todos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              historyFilter === 'completed' && styles.filterButtonActive,
              historyFilter === 'completed' && { backgroundColor: colors.primary500 },
              { borderColor: colors.border },
            ]}
            onPress={() => setHistoryFilter('completed')}
            accessible={true}
            accessibilityLabel="Filtrar testes concluídos"
            accessibilityState={{ selected: historyFilter === 'completed' }}
          >
            <Text
              style={[
                styles.filterButtonText,
                historyFilter === 'completed' && styles.filterButtonTextActive,
                { color: historyFilter === 'completed' ? '#FFFFFF' : colors.text },
              ]}
            >
              Concluídos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              historyFilter === 'in_progress' && styles.filterButtonActive,
              historyFilter === 'in_progress' && { backgroundColor: colors.primary500 },
              { borderColor: colors.border },
            ]}
            onPress={() => setHistoryFilter('in_progress')}
            accessible={true}
            accessibilityLabel="Filtrar testes em andamento"
            accessibilityState={{ selected: historyFilter === 'in_progress' }}
          >
            <Text
              style={[
                styles.filterButtonText,
                historyFilter === 'in_progress' && styles.filterButtonTextActive,
                { color: historyFilter === 'in_progress' ? '#FFFFFF' : colors.text },
              ]}
            >
              Em Andamento
            </Text>
          </TouchableOpacity>
        </View>

        {/* Test history list */}
        <TestHistoryList
          data={filteredHistoryData}
          onTestPress={(testId) => {
            console.log('Test pressed:', testId);
            // TODO: Navigate to test details
          }}
        />
      </View>
    );
  };

  // Render Timeline tab
  const renderTimelineTab = () => {
    if (timeline.isLoading) {
      return (
        <View style={styles.tabContent}>
          <ChartSkeleton title="Linha do Tempo de Sintomas" height={400} />
        </View>
      );
    }

    if (!timeline.data || timeline.data.entries.length === 0) {
      return renderEmptyState(
        'Você ainda não registrou sintomas. Comece a registrar seus sintomas para ver a linha do tempo.'
      );
    }

    return (
      <View style={styles.tabContent}>
        {/* Date range filter controls - placeholder for now */}
        <View style={styles.dateRangeContainer}>
          <Text style={[styles.dateRangeLabel, { color: colors.text }]}>
            Filtro de Data (em breve)
          </Text>
          <Text style={[styles.dateRangeHint, { color: colors.textSecondary }]}>
            Mostrando todos os sintomas registrados
          </Text>
        </View>

        {/* Timeline chart */}
        <SymptomTimelineChart data={timeline.data} highContrastMode={highContrastMode} />
      </View>
    );
  };

  // Render tab content
  const renderTabContent = () => {
    switch (selectedTab) {
      case 'tolerance':
        return renderToleranceTab();
      case 'history':
        return renderHistoryTab();
      case 'timeline':
        return renderTimelineTab();
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderHeader()}
      {renderTabs()}

      {isLoading ? (
        renderLoading()
      ) : isError ? (
        renderError()
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={handleRefresh}
              tintColor={colors.primary500}
              colors={[colors.primary500]}
              accessibilityLabel="Atualizar relatórios"
            />
          }
          accessible={true}
          accessibilityLabel="Conteúdo do relatório"
          accessibilityHint="Deslize para baixo para atualizar"
        >
          {renderTabContent()}
        </ScrollView>
      )}

      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onDismiss={() => setToastVisible(false)}
        duration={3000}
      />

      <PDFGenerationModal visible={isExporting} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  highContrastToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  toggleIcon: {
    marginRight: spacing.xs,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: spacing.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomWidth: 3,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  tabContent: {
    flex: 1,
    padding: spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: 16,
    marginTop: spacing.md,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  placeholderText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  chartContainer: {
    marginTop: spacing.md,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  filterButtonActive: {
    borderWidth: 0,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  dateRangeContainer: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: lightColors.backgroundSecondary,
    borderRadius: borderRadius.md,
  },
  dateRangeLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  dateRangeHint: {
    fontSize: 12,
  },
});
