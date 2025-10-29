# Design Document

## Overview

The Reporting and PDF Export system provides users with comprehensive insights into their FODMAP reintroduction journey through real-time data visualization and professional PDF reports. The system aggregates data from protocol runs, test steps, symptom entries, and group results to generate tolerance profiles, test histories, and symptom timelines. Users can export these reports as professionally formatted PDF documents in Portuguese (pt-BR) for sharing with healthcare providers.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  ReportsScreen   │  │  PDF Preview     │                │
│  │  (Main UI)       │  │  Modal           │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                           │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  ReportService   │  │  PDFService      │                │
│  │  (Data Agg)      │  │  (Generation)    │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Protocol     │  │ TestStep     │  │ Symptom      │     │
│  │ Repository   │  │ Repository   │  │ Repository   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ GroupResult  │  │ FoodItem     │                        │
│  │ Repository   │  │ Repository   │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **Data Aggregation**: ReportService queries repositories to gather protocol, test, symptom, and tolerance data
2. **Data Transformation**: Raw data is transformed into report-friendly structures with calculated metrics
3. **Visualization**: React Native components render charts and summaries using transformed data
4. **PDF Generation**: PDFService converts report data into HTML markup for expo-print
5. **Export**: expo-print generates PDF, expo-sharing opens native share dialog

## Components and Interfaces

### 1. ReportsScreen Component

**Location**: `src/features/reports/screens/ReportsScreen.tsx`

**Responsibilities**:

- Display tolerance profile summary
- Render test history list
- Show symptom timeline visualization
- Provide PDF export trigger
- Handle high contrast mode toggle

**Props**: None (uses navigation and hooks)

**State**:

```typescript
interface ReportsScreenState {
  selectedTab: 'tolerance' | 'history' | 'timeline';
  highContrastMode: boolean;
  isExporting: boolean;
  dateRangeFilter: { start: Date; end: Date } | null;
}
```

### 2. ReportService

**Location**: `src/services/reporting/ReportService.ts`

**Responsibilities**:

- Aggregate data from multiple repositories
- Calculate tolerance metrics
- Generate report summaries
- Transform data for visualization

**Interface**:

```typescript
interface ReportService {
  // Get tolerance profile for active protocol
  getToleranceProfile(userId: string): Promise<ToleranceProfile>;

  // Get complete test history
  getTestHistory(userId: string, options?: HistoryOptions): Promise<TestHistoryItem[]>;

  // Get symptom timeline data
  getSymptomTimeline(userId: string, dateRange?: DateRange): Promise<SymptomTimelineData>;

  // Get comprehensive report data for PDF
  getFullReport(userId: string): Promise<FullReportData>;

  // Calculate summary metrics
  calculateMetrics(protocolRunId: string): Promise<ReportMetrics>;
}

interface ToleranceProfile {
  groups: Array<{
    fodmapGroup: FodmapGroup;
    toleranceLevel: ToleranceLevel;
    testedFoods: string[];
    status: 'tested' | 'untested';
  }>;
  summary: {
    totalGroups: number;
    testedGroups: number;
    toleratedCount: number;
    moderateCount: number;
    triggerCount: number;
  };
}

interface TestHistoryItem {
  id: string;
  foodName: string;
  fodmapGroup: FodmapGroup;
  testDate: Date;
  completionDate: Date | null;
  status: TestStepStatus;
  toleranceOutcome: ToleranceLevel | null;
  symptomCount: number;
  averageSeverity: number;
  notes: string | null;
}

interface SymptomTimelineData {
  entries: Array<{
    date: Date;
    symptoms: Array<{
      type: SymptomType;
      severity: number;
      testContext: string | null;
    }>;
  }>;
  testMarkers: Array<{
    date: Date;
    foodName: string;
    type: 'test_start' | 'test_end' | 'washout';
  }>;
}

interface ReportMetrics {
  totalTestsCompleted: number;
  totalTestsInProgress: number;
  groupsTestedPercentage: number;
  averageSymptomSeverity: number;
  protocolStartDate: Date;
  protocolDuration: number; // days
  toleratedFoodsCount: number;
  moderateFoodsCount: number;
  triggerFoodsCount: number;
}
```

### 3. PDFService

**Location**: `src/services/reporting/PDFService.ts`

**Responsibilities**:

- Generate HTML markup for PDF
- Format data in Portuguese
- Include disclaimers and legal notices
- Handle PDF generation via expo-print
- Trigger native share dialog

**Interface**:

```typescript
interface PDFService {
  // Generate and share PDF report
  generateAndSharePDF(reportData: FullReportData): Promise<void>;

  // Generate HTML markup for PDF
  generateHTMLMarkup(reportData: FullReportData): string;

  // Format date in pt-BR
  formatDate(date: Date): string;

  // Get disclaimer text
  getDisclaimers(): string[];
}

interface FullReportData {
  userInfo: {
    name: string;
    email: string;
  };
  reportDate: Date;
  toleranceProfile: ToleranceProfile;
  testHistory: TestHistoryItem[];
  symptomTimeline: SymptomTimelineData;
  metrics: ReportMetrics;
}
```

### 4. Chart Components

**Location**: `src/features/reports/components/`

**Components**:

- `ToleranceChart.tsx`: Bar chart showing tolerance levels by group
- `SymptomTimelineChart.tsx`: Line chart with symptom severity over time
- `TestHistoryList.tsx`: Scrollable list of completed tests
- `MetricsSummary.tsx`: Card-based summary of key metrics

**Common Props**:

```typescript
interface ChartProps {
  data: any; // Specific to each chart
  highContrastMode: boolean;
  height?: number;
  width?: number;
}
```

### 5. PDF Markup Component

**Location**: `src/services/reporting/pdf.tsx`

**Responsibilities**:

- Generate HTML structure for PDF
- Apply professional styling
- Include charts as SVG or base64 images
- Format text in Portuguese

**Structure**:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      /* Professional PDF styling */
    </style>
  </head>
  <body>
    <header>
      <h1>Relatório de Reintrodução FODMAP</h1>
      <p>Data: {reportDate}</p>
    </header>

    <section id="tolerance-profile">
      <h2>Perfil de Tolerância</h2>
      <!-- Tolerance data -->
    </section>

    <section id="test-history">
      <h2>Histórico de Testes</h2>
      <!-- Test history table -->
    </section>

    <section id="symptom-timeline">
      <h2>Linha do Tempo de Sintomas</h2>
      <!-- Timeline chart -->
    </section>

    <section id="metrics">
      <h2>Métricas Gerais</h2>
      <!-- Summary metrics -->
    </section>

    <footer>
      <h3>Avisos Importantes</h3>
      <!-- Disclaimers -->
      <p>Página {pageNumber}</p>
    </footer>
  </body>
</html>
```

## Data Models

### Report Data Structures

```typescript
// Tolerance Profile
type ToleranceCategory = 'tolerated' | 'moderate' | 'trigger' | 'untested';

interface GroupTolerance {
  fodmapGroup: FodmapGroup;
  category: ToleranceCategory;
  testedFoods: Array<{
    name: string;
    toleranceLevel: ToleranceLevel;
  }>;
  notes: string | null;
}

// Symptom Timeline Entry
interface TimelineEntry {
  timestamp: Date;
  symptomType: SymptomType;
  severity: number; // 1-10
  testStepId: string | null;
  foodContext: string | null;
  notes: string | null;
}

// Test Summary
interface TestSummary {
  testStepId: string;
  foodName: string;
  fodmapGroup: FodmapGroup;
  startDate: Date;
  endDate: Date | null;
  status: TestStepStatus;
  symptomEntries: TimelineEntry[];
  toleranceOutcome: ToleranceLevel | null;
  maxSeverity: number;
  averageSeverity: number;
}
```

### Chart Data Formats

```typescript
// Bar Chart Data (Tolerance Profile)
interface BarChartData {
  labels: string[]; // FODMAP group names
  datasets: Array<{
    label: string; // 'Tolerado', 'Moderado', 'Gatilho'
    data: number[]; // Count of foods in each category
    color: string;
  }>;
}

// Line Chart Data (Symptom Timeline)
interface LineChartData {
  labels: string[]; // Dates
  datasets: Array<{
    label: string; // Symptom type
    data: number[]; // Severity values
    color: string;
    markers?: Array<{
      x: number; // Index
      label: string; // Test name
    }>;
  }>;
}
```

## Error Handling

### Error Types

```typescript
enum ReportErrorType {
  DATA_FETCH_ERROR = 'DATA_FETCH_ERROR',
  PDF_GENERATION_ERROR = 'PDF_GENERATION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
}

interface ReportError {
  type: ReportErrorType;
  message: string;
  userMessage: string; // Portuguese message for user
  retryable: boolean;
}
```

### Error Handling Strategy

1. **Data Fetch Errors**: Show error message, provide retry button
2. **PDF Generation Errors**: Log error, show user-friendly message in Portuguese
3. **Storage Errors**: Check available space, inform user of requirements
4. **Network Errors**: Queue for retry when online (if sync required)
5. **Permission Errors**: Guide user to grant necessary permissions

### Error Messages (Portuguese)

```typescript
const ERROR_MESSAGES = {
  DATA_FETCH_ERROR: 'Não foi possível carregar os dados do relatório. Tente novamente.',
  PDF_GENERATION_ERROR: 'Erro ao gerar o PDF. Verifique o espaço disponível e tente novamente.',
  STORAGE_ERROR: 'Espaço insuficiente no dispositivo. Libere espaço e tente novamente.',
  NETWORK_ERROR: 'Sem conexão com a internet. Conecte-se e tente novamente.',
  PERMISSION_ERROR: 'Permissão necessária para salvar o arquivo. Verifique as configurações.',
};
```

## Testing Strategy

### Unit Tests

**ReportService Tests**:

- Test tolerance profile calculation with various data scenarios
- Test metric calculations (averages, percentages, counts)
- Test data transformation for charts
- Test edge cases (no data, incomplete tests, missing symptoms)

**PDFService Tests**:

- Test HTML markup generation
- Test date formatting in pt-BR
- Test disclaimer inclusion
- Test handling of large datasets

**Chart Component Tests**:

- Test rendering with valid data
- Test high contrast mode toggle
- Test empty state handling
- Test accessibility features

### Integration Tests

**Report Generation Flow**:

1. Create test protocol with completed tests
2. Add symptom entries
3. Generate report data
4. Verify all sections populated correctly
5. Verify metrics calculated accurately

**PDF Export Flow**:

1. Generate full report data
2. Trigger PDF export
3. Verify PDF generation succeeds
4. Verify share dialog opens
5. Test error scenarios (storage full, permissions denied)

### Performance Tests

**Metrics**:

- Report data aggregation: < 1 second for 100 tests
- Chart rendering: < 500ms for 100 data points
- PDF generation: < 3 seconds for full report
- Memory usage: < 50MB for report generation

**Test Scenarios**:

- Large dataset (100+ tests, 1000+ symptom entries)
- Rapid tab switching in ReportsScreen
- Multiple PDF exports in succession
- Low-end device performance

## Accessibility Considerations

### High Contrast Mode

**Implementation**:

- Use WCAG AAA contrast ratios (7:1 minimum)
- Provide patterns/textures in addition to colors
- Ensure text remains readable
- Test with color blindness simulators

**Color Palettes**:

Standard Mode:

- Tolerated: #4CAF50 (green)
- Moderate: #FF9800 (orange)
- Trigger: #F44336 (red)
- Untested: #9E9E9E (gray)

High Contrast Mode:

- Tolerated: #000000 on #FFFFFF (black on white)
- Moderate: #000000 on #FFFF00 (black on yellow)
- Trigger: #FFFFFF on #000000 (white on black)
- Untested: #000000 on #CCCCCC (black on light gray)

### Screen Reader Support

- Provide meaningful labels for all interactive elements
- Use semantic HTML in PDF markup
- Include alt text for charts (describe data trends)
- Announce state changes (exporting, export complete)

## PDF Layout Design

### Page Structure

**Header** (every page):

- Report title: "Relatório de Reintrodução FODMAP"
- Generation date
- User name (optional)

**Section 1: Perfil de Tolerância**:

- Summary metrics (cards)
- Tolerance by group (table or chart)
- Legend explaining categories

**Section 2: Histórico de Testes**:

- Chronological table of tests
- Columns: Data, Alimento, Grupo FODMAP, Status, Resultado
- Notes column (if present)

**Section 3: Linha do Tempo de Sintomas**:

- Timeline chart (SVG or image)
- Test markers overlaid
- Severity scale legend

**Section 4: Métricas Gerais**:

- Total tests completed
- Groups tested percentage
- Average symptom severity
- Protocol duration
- Tolerance distribution

**Footer** (every page):

- Disclaimers (first page or last page)
- Page numbers
- Generation timestamp

### Styling Guidelines

**Typography**:

- Headings: 18pt bold, sans-serif
- Body text: 11pt regular, sans-serif
- Tables: 10pt regular
- Footer: 9pt regular

**Spacing**:

- Section margins: 20pt top/bottom
- Paragraph spacing: 10pt
- Table cell padding: 8pt

**Colors**:

- Headers: #333333
- Body text: #000000
- Table borders: #CCCCCC
- Background: #FFFFFF

## Dependencies

### Required Packages

```json
{
  "expo-print": "^13.0.0",
  "expo-sharing": "^12.0.0",
  "react-native-svg": "^14.0.0",
  "date-fns": "^3.0.0"
}
```

### Optional Packages (for advanced charts)

```json
{
  "react-native-skia": "^1.0.0",
  "victory-native": "^37.0.0"
}
```

**Recommendation**: Start with react-native-svg for simple charts. Consider Skia if performance issues arise with large datasets.

## Implementation Phases

### Phase 1: Data Layer

- Implement ReportService
- Add repository query methods
- Create data transformation utilities
- Write unit tests

### Phase 2: UI Components

- Build ReportsScreen layout
- Create chart components (SVG-based)
- Implement high contrast mode
- Add loading and error states

### Phase 3: PDF Generation

- Implement PDFService
- Create HTML markup templates
- Add Portuguese translations
- Include disclaimers

### Phase 4: Integration & Testing

- Connect UI to services
- Test PDF export flow
- Performance optimization
- Accessibility audit

## Security Considerations

- **Data Privacy**: Ensure user data is not logged during PDF generation
- **File Permissions**: Request only necessary permissions for file sharing
- **Data Sanitization**: Sanitize user input (notes) before including in PDF
- **Secure Storage**: Do not persist generated PDFs unnecessarily

## Localization

### Portuguese (pt-BR) Translations

**UI Labels**:

```typescript
const PT_BR = {
  reports: {
    title: 'Relatórios',
    tabs: {
      tolerance: 'Tolerância',
      history: 'Histórico',
      timeline: 'Linha do Tempo',
    },
    export: 'Exportar PDF',
    highContrast: 'Alto Contraste',
    metrics: {
      totalTests: 'Testes Realizados',
      groupsTested: 'Grupos Testados',
      avgSeverity: 'Severidade Média',
      duration: 'Duração do Protocolo',
    },
    tolerance: {
      tolerated: 'Tolerado',
      moderate: 'Moderado',
      trigger: 'Gatilho',
      untested: 'Não Testado',
    },
    disclaimers: {
      informational: 'Este relatório é apenas para fins informativos.',
      medical: 'Consulte um profissional de saúde antes de fazer mudanças na dieta.',
      notSubstitute: 'Este aplicativo não substitui aconselhamento médico profissional.',
    },
  },
};
```

## Performance Optimizations

### Data Caching

- Cache report data for 5 minutes
- Invalidate cache on new symptom entry or test completion
- Use React Query for automatic cache management

### Chart Rendering

- Implement virtualization for long timelines
- Use memoization for chart components
- Lazy load chart data on tab switch

### PDF Generation

- Generate PDF in background thread (if possible)
- Show progress indicator during generation
- Compress images before embedding in PDF

## Future Enhancements

1. **Multiple Export Formats**: CSV, JSON for data portability
2. **Custom Date Ranges**: Allow users to filter reports by date
3. **Comparison Reports**: Compare multiple protocol runs
4. **Interactive Charts**: Zoom, pan, and drill-down capabilities
5. **Email Integration**: Send PDF directly via email
6. **Cloud Backup**: Sync reports to cloud storage
7. **Printable Format**: Optimize PDF layout for printing
