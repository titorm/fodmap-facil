import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Svg, { Line, Circle, Path, Text as SvgText, G, Rect } from 'react-native-svg';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { SymptomTimelineData } from '../types';
import type { SymptomType } from '../../../shared/types/entities';
import { lightColors } from '../../../shared/theme/tokens';

interface SymptomTimelineChartProps {
  data: SymptomTimelineData;
  highContrastMode: boolean;
  width?: number;
  height?: number;
}

// Color schemes for symptom types
const STANDARD_SYMPTOM_COLORS: Record<SymptomType, string> = {
  bloating: '#2196F3',
  pain: '#F44336',
  gas: '#4CAF50',
  diarrhea: '#FF9800',
  constipation: '#9C27B0',
};

const HIGH_CONTRAST_SYMPTOM_COLORS: Record<SymptomType, string> = {
  bloating: '#000000',
  pain: '#000000',
  gas: '#000000',
  diarrhea: '#000000',
  constipation: '#000000',
};

// Symptom type labels in Portuguese
const SYMPTOM_LABELS: Record<SymptomType, string> = {
  bloating: 'Inchaço',
  pain: 'Dor',
  gas: 'Gases',
  diarrhea: 'Diarreia',
  constipation: 'Constipação',
};

// Test marker colors
const MARKER_COLORS = {
  test_start: '#4CAF50',
  test_end: '#2196F3',
  washout: '#FF9800',
};

const SymptomTimelineChartComponent: React.FC<SymptomTimelineChartProps> = ({
  data,
  highContrastMode,
  width = 700,
  height = 400,
}) => {
  const padding = { top: 40, right: 20, bottom: 80, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Check if virtualization is needed (> 100 data points)
  const needsVirtualization = data.entries.length > 100;
  const displayData = needsVirtualization ? data.entries.slice(-100) : data.entries;

  // Process data for chart
  const chartData = useMemo(() => {
    if (displayData.length === 0) {
      return {
        dates: [],
        symptomLines: [],
        xScale: () => 0,
        yScale: () => 0,
      };
    }

    // Sort entries by date
    const sortedEntries = [...displayData].sort((a, b) => a.date.getTime() - b.date.getTime());

    // Get all unique symptom types
    const symptomTypes = new Set<SymptomType>();
    sortedEntries.forEach((entry) => {
      entry.symptoms.forEach((s) => symptomTypes.add(s.type));
    });

    // Create data series for each symptom type
    const symptomLines = Array.from(symptomTypes).map((type) => {
      const points = sortedEntries.map((entry) => {
        const symptom = entry.symptoms.find((s) => s.type === type);
        return {
          date: entry.date,
          severity: symptom?.severity || null,
        };
      });

      return {
        type,
        label: SYMPTOM_LABELS[type],
        color: highContrastMode
          ? HIGH_CONTRAST_SYMPTOM_COLORS[type]
          : STANDARD_SYMPTOM_COLORS[type],
        points,
      };
    });

    // X-axis scale (dates)
    const minDate = sortedEntries[0].date.getTime();
    const maxDate = sortedEntries[sortedEntries.length - 1].date.getTime();
    const dateRange = maxDate - minDate || 1; // Avoid division by zero

    const xScale = (date: Date) => {
      return padding.left + ((date.getTime() - minDate) / dateRange) * chartWidth;
    };

    // Y-axis scale (severity 0-10)
    const yScale = (severity: number) => {
      return padding.top + chartHeight - (severity / 10) * chartHeight;
    };

    return {
      dates: sortedEntries.map((e) => e.date),
      symptomLines,
      xScale,
      yScale,
    };
  }, [displayData, chartWidth, chartHeight, padding, highContrastMode]);

  // Generate path for line chart
  const generatePath = (points: Array<{ date: Date; severity: number | null }>) => {
    if (points.length === 0) return '';

    let path = '';
    let firstPoint = true;

    points.forEach((point, index) => {
      if (point.severity === null) {
        firstPoint = true;
        return;
      }

      const x = chartData.xScale(point.date);
      const y = chartData.yScale(point.severity);

      if (firstPoint) {
        path += `M ${x} ${y}`;
        firstPoint = false;
      } else {
        path += ` L ${x} ${y}`;
      }
    });

    return path;
  };

  // Filter markers to display range
  const displayMarkers = useMemo(() => {
    if (chartData.dates.length === 0) return [];

    const minDate = chartData.dates[0].getTime();
    const maxDate = chartData.dates[chartData.dates.length - 1].getTime();

    return data.testMarkers.filter((marker) => {
      const markerTime = marker.date.getTime();
      return markerTime >= minDate && markerTime <= maxDate;
    });
  }, [data.testMarkers, chartData.dates]);

  // Generate accessibility description for the chart
  const getAccessibilityDescription = (): string => {
    if (chartData.dates.length === 0) {
      return 'Nenhum sintoma registrado ainda.';
    }

    const descriptions: string[] = [];
    const dateRange = `${format(chartData.dates[0], 'dd/MM/yyyy', { locale: ptBR })} até ${format(chartData.dates[chartData.dates.length - 1], 'dd/MM/yyyy', { locale: ptBR })}`;

    descriptions.push(`Gráfico de linha do tempo mostrando sintomas de ${dateRange}.`);

    // Summarize symptom types
    chartData.symptomLines.forEach((line) => {
      const validPoints = line.points.filter((p) => p.severity !== null);
      if (validPoints.length > 0) {
        const avgSeverity =
          validPoints.reduce((sum, p) => sum + (p.severity || 0), 0) / validPoints.length;
        const maxSeverity = Math.max(...validPoints.map((p) => p.severity || 0));
        descriptions.push(
          `${line.label}: ${validPoints.length} registros, severidade média ${avgSeverity.toFixed(1)}, máxima ${maxSeverity}.`
        );
      }
    });

    // Mention test markers
    if (displayMarkers.length > 0) {
      descriptions.push(`${displayMarkers.length} marcadores de teste no período.`);
    }

    return descriptions.join(' ');
  };

  if (chartData.dates.length === 0) {
    return (
      <View
        style={styles.container}
        accessible={true}
        accessibilityLabel="Gráfico de linha do tempo de sintomas vazio"
        accessibilityHint="Nenhum sintoma registrado ainda"
      >
        <Text style={styles.title}>Linha do Tempo de Sintomas</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Nenhum sintoma registrado</Text>
        </View>
      </View>
    );
  }

  const ChartContent = (
    <Svg width={width} height={height}>
      {/* Y-axis */}
      <Line
        x1={padding.left}
        y1={padding.top}
        x2={padding.left}
        y2={padding.top + chartHeight}
        stroke={lightColors.border}
        strokeWidth="2"
      />

      {/* X-axis */}
      <Line
        x1={padding.left}
        y1={padding.top + chartHeight}
        x2={padding.left + chartWidth}
        y2={padding.top + chartHeight}
        stroke={lightColors.border}
        strokeWidth="2"
      />

      {/* Y-axis grid lines and labels (severity 0-10) */}
      {[0, 2, 4, 6, 8, 10].map((severity) => {
        const y = chartData.yScale(severity);

        return (
          <G key={`y-grid-${severity}`}>
            <Line
              x1={padding.left}
              y1={y}
              x2={padding.left + chartWidth}
              y2={y}
              stroke={lightColors.border}
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity={0.3}
            />
            <SvgText
              x={padding.left - 10}
              y={y + 4}
              fontSize="10"
              fill={lightColors.text}
              textAnchor="end"
            >
              {severity}
            </SvgText>
          </G>
        );
      })}

      {/* Y-axis label */}
      <SvgText
        x={20}
        y={padding.top + chartHeight / 2}
        fontSize="12"
        fill={lightColors.text}
        textAnchor="middle"
        transform={`rotate(-90, 20, ${padding.top + chartHeight / 2})`}
      >
        Severidade (0-10)
      </SvgText>

      {/* X-axis date labels */}
      {chartData.dates
        .filter((_, index) => index % Math.ceil(chartData.dates.length / 5) === 0)
        .map((date, index) => {
          const x = chartData.xScale(date);
          const dateStr = format(date, 'dd/MM', { locale: ptBR });

          return (
            <SvgText
              key={`x-label-${index}`}
              x={x}
              y={padding.top + chartHeight + 20}
              fontSize="10"
              fill={lightColors.text}
              textAnchor="middle"
            >
              {dateStr}
            </SvgText>
          );
        })}

      {/* Test markers */}
      {displayMarkers.map((marker, index) => {
        const x = chartData.xScale(marker.date);
        const markerColor = MARKER_COLORS[marker.type];

        return (
          <G key={`marker-${index}`}>
            <Line
              x1={x}
              y1={padding.top}
              x2={x}
              y2={padding.top + chartHeight}
              stroke={markerColor}
              strokeWidth="2"
              strokeDasharray="4 4"
              opacity={0.5}
            />
            <Circle cx={x} cy={padding.top - 10} r="4" fill={markerColor} />
          </G>
        );
      })}

      {/* Symptom lines */}
      {chartData.symptomLines.map((line) => {
        const path = generatePath(line.points);
        if (!path) return null;

        return (
          <G key={line.type}>
            <Path
              d={path}
              stroke={line.color}
              strokeWidth={highContrastMode ? '3' : '2'}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Data points */}
            {line.points.map((point, pointIndex) => {
              if (point.severity === null) return null;

              const x = chartData.xScale(point.date);
              const y = chartData.yScale(point.severity);

              return (
                <Circle
                  key={`${line.type}-point-${pointIndex}`}
                  cx={x}
                  cy={y}
                  r={highContrastMode ? '5' : '3'}
                  fill={line.color}
                  stroke={highContrastMode ? '#000000' : '#FFFFFF'}
                  strokeWidth={highContrastMode ? '2' : '1'}
                />
              );
            })}
          </G>
        );
      })}
    </Svg>
  );

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel="Gráfico de linha do tempo de sintomas"
      accessibilityHint={getAccessibilityDescription()}
    >
      <Text style={styles.title}>Linha do Tempo de Sintomas</Text>

      {needsVirtualization && (
        <Text
          style={styles.virtualizationNote}
          accessible={true}
          accessibilityRole="text"
          accessibilityLiveRegion="polite"
        >
          Exibindo os últimos 100 pontos de dados
        </Text>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        accessible={true}
        accessibilityLabel="Área de rolagem do gráfico de linha do tempo"
        accessibilityHint="Deslize horizontalmente para ver mais dados"
      >
        {ChartContent}
      </ScrollView>

      {/* Legend */}
      <View
        style={styles.legend}
        accessible={true}
        accessibilityRole="list"
        accessibilityLabel="Legenda de tipos de sintomas"
      >
        <Text style={styles.legendTitle}>Sintomas:</Text>
        {chartData.symptomLines.map((line) => (
          <View
            key={line.type}
            style={styles.legendItem}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel={`${line.label}: tipo de sintoma`}
          >
            <View
              style={[
                styles.legendLine,
                {
                  backgroundColor: line.color,
                  borderWidth: highContrastMode ? 2 : 0,
                  borderColor: '#000000',
                },
              ]}
              accessible={false}
            />
            <Text style={styles.legendText}>{line.label}</Text>
          </View>
        ))}
      </View>

      {/* Marker legend */}
      {displayMarkers.length > 0 && (
        <View
          style={styles.legend}
          accessible={true}
          accessibilityRole="list"
          accessibilityLabel="Legenda de marcadores de teste"
        >
          <Text style={styles.legendTitle}>Marcadores:</Text>
          <View
            style={styles.legendItem}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel="Início de Teste: marcador verde"
          >
            <View
              style={[styles.legendLine, { backgroundColor: MARKER_COLORS.test_start }]}
              accessible={false}
            />
            <Text style={styles.legendText}>Início de Teste</Text>
          </View>
          <View
            style={styles.legendItem}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel="Fim de Teste: marcador azul"
          >
            <View
              style={[styles.legendLine, { backgroundColor: MARKER_COLORS.test_end }]}
              accessible={false}
            />
            <Text style={styles.legendText}>Fim de Teste</Text>
          </View>
          <View
            style={styles.legendItem}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel="Washout: marcador laranja"
          >
            <View
              style={[styles.legendLine, { backgroundColor: MARKER_COLORS.washout }]}
              accessible={false}
            />
            <Text style={styles.legendText}>Washout</Text>
          </View>
        </View>
      )}
    </View>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const SymptomTimelineChart = React.memo(
  SymptomTimelineChartComponent,
  (prevProps, nextProps) => {
    // Custom comparison function for better performance
    return (
      prevProps.highContrastMode === nextProps.highContrastMode &&
      prevProps.width === nextProps.width &&
      prevProps.height === nextProps.height &&
      prevProps.data.entries.length === nextProps.data.entries.length &&
      prevProps.data.testMarkers.length === nextProps.data.testMarkers.length
    );
  }
);

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: lightColors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  virtualizationNote: {
    fontSize: 12,
    color: lightColors.textSecondary,
    marginBottom: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: lightColors.textSecondary,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: lightColors.text,
    marginRight: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  legendLine: {
    width: 20,
    height: 3,
    borderRadius: 2,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: lightColors.text,
  },
});
