# Reports Translations Usage Guide

This document provides examples of how to use the i18n translations for the Reports feature.

## Import i18n

```typescript
import { useTranslation } from 'react-i18next';
```

## Basic Usage in Components

### ReportsScreen

```typescript
const ReportsScreen = () => {
  const { t } = useTranslation();

  return (
    <View>
      <Text>{t('reports.title')}</Text>
      <Button title={t('reports.exportPDF')} />
      <Switch label={t('reports.highContrastMode')} />
    </View>
  );
};
```

### Tab Navigation

```typescript
const tabs = [
  { key: 'tolerance', label: t('reports.tabs.tolerance') },
  { key: 'history', label: t('reports.tabs.history') },
  { key: 'timeline', label: t('reports.tabs.timeline') },
];
```

## Tolerance Categories

```typescript
const toleranceLabel = (level: ToleranceLevel) => {
  const labels = {
    tolerated: t('reports.tolerance.tolerated'),
    moderate: t('reports.tolerance.moderate'),
    trigger: t('reports.tolerance.trigger'),
    untested: t('reports.tolerance.untested'),
  };
  return labels[level];
};
```

## Metrics Display

```typescript
const MetricsSummary = ({ metrics }: { metrics: ReportMetrics }) => {
  const { t } = useTranslation();

  return (
    <View>
      <MetricCard
        label={t('reports.metrics.totalTestsCompleted')}
        value={metrics.totalTestsCompleted}
      />
      <MetricCard
        label={t('reports.metrics.groupsTestedPercentage')}
        value={`${metrics.groupsTestedPercentage}%`}
      />
      <MetricCard
        label={t('reports.metrics.averageSymptomSeverity')}
        value={metrics.averageSymptomSeverity.toFixed(1)}
      />
      <MetricCard
        label={t('reports.metrics.protocolDuration')}
        value={t('reports.metrics.days', { count: metrics.protocolDuration })}
      />
    </View>
  );
};
```

## Error Handling

```typescript
const handleExportError = (error: ReportError) => {
  const { t } = useTranslation();

  const errorMessages = {
    DATA_FETCH_ERROR: t('reports.errors.dataFetchError'),
    PDF_GENERATION_ERROR: t('reports.errors.pdfGenerationError'),
    STORAGE_ERROR: t('reports.errors.storageError'),
    NETWORK_ERROR: t('reports.errors.networkError'),
    PERMISSION_ERROR: t('reports.errors.permissionError'),
  };

  Alert.alert(t('common.error'), errorMessages[error.type] || t('reports.errors.unknownError'), [
    { text: t('reports.errors.dismissAction'), style: 'cancel' },
    { text: t('reports.errors.retryAction'), onPress: retryExport },
  ]);
};
```

## Loading States

```typescript
const LoadingIndicator = ({ stage }: { stage: string }) => {
  const { t } = useTranslation();

  const loadingMessages = {
    fetching: t('reports.loading.fetchingData'),
    preparing: t('reports.loading.preparingReport'),
    charts: t('reports.loading.generatingCharts'),
    pdf: t('reports.loading.creatingPDF'),
    done: t('reports.loading.almostDone'),
  };

  return <Text>{loadingMessages[stage]}</Text>;
};
```

## PDF Generation

```typescript
const generatePDF = async (reportData: FullReportData) => {
  const { t } = useTranslation();

  const html = `
    <html>
      <head>
        <title>${t('reports.pdf.reportTitle')}</title>
      </head>
      <body>
        <h1>${t('reports.pdf.reportTitle')}</h1>
        <p>${t('reports.pdf.generatedOn')}: ${formatDate(new Date())}</p>
        
        <h2>${t('reports.pdf.sections.toleranceProfile')}</h2>
        <!-- Tolerance content -->
        
        <h2>${t('reports.pdf.sections.testHistory')}</h2>
        <!-- History content -->
        
        <h2>${t('reports.pdf.sections.symptomTimeline')}</h2>
        <!-- Timeline content -->
        
        <h2>${t('reports.pdf.sections.metrics')}</h2>
        <!-- Metrics content -->
        
        <footer>
          <h3>${t('reports.disclaimers.title')}</h3>
          <p>${t('reports.disclaimers.informationalFull')}</p>
          <p>${t('reports.disclaimers.medicalFull')}</p>
          <p>${t('reports.disclaimers.notSubstituteFull')}</p>
        </footer>
      </body>
    </html>
  `;

  return await Print.printToFileAsync({ html });
};
```

## Empty States

```typescript
const EmptyState = ({ type }: { type: 'tolerance' | 'history' | 'timeline' }) => {
  const { t } = useTranslation();

  const emptyStates = {
    tolerance: {
      title: t('reports.tolerance.noData'),
      description: t('reports.tolerance.noDataDescription'),
    },
    history: {
      title: t('reports.history.noTests'),
      description: t('reports.history.noTestsDescription'),
    },
    timeline: {
      title: t('reports.timeline.noSymptoms'),
      description: t('reports.timeline.noSymptomsDescription'),
    },
  };

  const state = emptyStates[type];

  return (
    <View>
      <Text>{state.title}</Text>
      <Text>{state.description}</Text>
    </View>
  );
};
```

## Accessibility Labels

```typescript
const ToleranceChart = ({ data, highContrastMode }: ChartProps) => {
  const { t } = useTranslation();

  return (
    <View accessible accessibilityLabel={t('reports.accessibility.toleranceChart')}>
      {/* Chart content */}
    </View>
  );
};

const ExportButton = ({ onPress }: { onPress: () => void }) => {
  const { t } = useTranslation();

  return (
    <Button
      title={t('reports.exportPDF')}
      onPress={onPress}
      accessibilityLabel={t('reports.accessibility.exportButton')}
    />
  );
};
```

## Test History Formatting

```typescript
const TestHistoryItem = ({ item }: { item: TestHistoryItem }) => {
  const { t } = useTranslation();

  return (
    <View>
      <Text>{item.foodName}</Text>
      <Text>{t('reports.history.testDate')}: {formatDate(item.testDate)}</Text>
      <Text>{t('reports.history.status')}: {t(`reports.history.${item.status}`)}</Text>
      <Text>{t('reports.history.symptoms', { count: item.symptomCount })}</Text>
      <Text>{t('reports.history.severity', { value: item.averageSeverity.toFixed(1) })}</Text>
    </View>
  );
};
```

## Available Translation Keys

### Main Sections

- `reports.title` - Main title
- `reports.tabs.*` - Tab labels (tolerance, history, timeline)
- `reports.export` / `reports.exportPDF` - Export buttons
- `reports.highContrast` / `reports.highContrastMode` - High contrast toggle

### Metrics

- `reports.metrics.totalTestsCompleted`
- `reports.metrics.groupsTestedPercentage`
- `reports.metrics.averageSymptomSeverity`
- `reports.metrics.protocolDuration`
- `reports.metrics.toleratedFoods`
- `reports.metrics.moderateFoods`
- `reports.metrics.triggerFoods`

### Tolerance

- `reports.tolerance.tolerated`
- `reports.tolerance.moderate`
- `reports.tolerance.trigger`
- `reports.tolerance.untested`

### Errors

- `reports.errors.dataFetchError`
- `reports.errors.pdfGenerationError`
- `reports.errors.storageError`
- `reports.errors.networkError`
- `reports.errors.permissionError`
- `reports.errors.noDataError`
- `reports.errors.unknownError`

### Disclaimers

- `reports.disclaimers.informational`
- `reports.disclaimers.medical`
- `reports.disclaimers.notSubstitute`
- `reports.disclaimers.informationalFull`
- `reports.disclaimers.medicalFull`
- `reports.disclaimers.notSubstituteFull`

### Loading States

- `reports.loading.fetchingData`
- `reports.loading.preparingReport`
- `reports.loading.generatingCharts`
- `reports.loading.creatingPDF`
- `reports.loading.almostDone`

### Empty States

- `reports.empty.noData`
- `reports.empty.startTesting`
- `reports.empty.noTestsYet`
- `reports.empty.noSymptomsYet`

### Accessibility

- `reports.accessibility.toleranceChart`
- `reports.accessibility.timelineChart`
- `reports.accessibility.exportButton`
- `reports.accessibility.highContrastToggle`
- `reports.accessibility.tabNavigation`

## Language Support

The translations are available in:

- **Portuguese (pt-BR)**: Primary language for the app
- **English (en)**: Fallback language

The i18n system automatically detects the device language and uses the appropriate translations.
