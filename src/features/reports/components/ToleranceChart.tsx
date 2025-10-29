import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Text as SvgText, Line, G } from 'react-native-svg';
import type { ToleranceProfile } from '../types';
import type { FodmapGroup, ToleranceLevel } from '../../../shared/types/entities';
import { lightColors } from '../../../shared/theme/tokens';

interface ToleranceChartProps {
  data: ToleranceProfile;
  highContrastMode: boolean;
  width?: number;
  height?: number;
}

// Color schemes
const STANDARD_COLORS = {
  tolerated: '#4CAF50',
  moderate: '#FF9800',
  trigger: '#F44336',
  untested: '#9E9E9E',
};

const HIGH_CONTRAST_COLORS = {
  tolerated: '#000000', // Black on white
  moderate: '#000000', // Black on yellow
  trigger: '#FFFFFF', // White on black
  untested: '#000000', // Black on light gray
};

const HIGH_CONTRAST_BACKGROUNDS = {
  tolerated: '#FFFFFF',
  moderate: '#FFFF00',
  trigger: '#000000',
  untested: '#CCCCCC',
};

// FODMAP group labels in Portuguese
const GROUP_LABELS: Record<FodmapGroup, string> = {
  oligosaccharides: 'Oligossacarídeos',
  disaccharides: 'Dissacarídeos',
  monosaccharides: 'Monossacarídeos',
  polyols: 'Polióis',
};

// Tolerance category labels in Portuguese
const TOLERANCE_LABELS = {
  tolerated: 'Tolerado',
  moderate: 'Moderado',
  trigger: 'Gatilho',
  untested: 'Não Testado',
};

const ToleranceChartComponent: React.FC<ToleranceChartProps> = ({
  data,
  highContrastMode,
  width = 350,
  height = 300,
}) => {
  const padding = { top: 40, right: 20, bottom: 80, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate max value for y-axis
  const maxFoods = Math.max(
    ...data.groups.map((g) => g.testedFoods.length),
    1 // Minimum 1 to avoid division by zero
  );
  const yMax = Math.ceil(maxFoods / 5) * 5; // Round up to nearest 5

  // Bar width and spacing
  const barWidth = chartWidth / (data.groups.length * 4); // 4 categories per group
  const groupSpacing = barWidth * 0.5;

  // Get colors based on mode
  const getBarColor = (category: 'tolerated' | 'moderate' | 'trigger' | 'untested') => {
    return highContrastMode ? HIGH_CONTRAST_BACKGROUNDS[category] : STANDARD_COLORS[category];
  };

  const getTextColor = (category: 'tolerated' | 'moderate' | 'trigger' | 'untested') => {
    return highContrastMode ? HIGH_CONTRAST_COLORS[category] : '#FFFFFF';
  };

  // Calculate bar data for each group
  const barData = data.groups.map((group, groupIndex) => {
    const toleratedCount = group.testedFoods.filter((f) => f.toleranceLevel === 'high').length;
    const moderateCount = group.testedFoods.filter((f) => f.toleranceLevel === 'moderate').length;
    const triggerCount = group.testedFoods.filter(
      (f) => f.toleranceLevel === 'low' || f.toleranceLevel === 'none'
    ).length;
    const untestedCount = group.status === 'untested' ? 1 : 0;

    const groupX = padding.left + groupIndex * (chartWidth / data.groups.length);

    return {
      group: group.fodmapGroup,
      label: GROUP_LABELS[group.fodmapGroup],
      x: groupX,
      bars: [
        {
          category: 'tolerated' as const,
          count: toleratedCount,
          x: groupX,
        },
        {
          category: 'moderate' as const,
          count: moderateCount,
          x: groupX + barWidth + groupSpacing,
        },
        {
          category: 'trigger' as const,
          count: triggerCount,
          x: groupX + (barWidth + groupSpacing) * 2,
        },
        {
          category: 'untested' as const,
          count: untestedCount,
          x: groupX + (barWidth + groupSpacing) * 3,
        },
      ],
    };
  });

  // Y-axis scale
  const getYPosition = (value: number) => {
    return padding.top + chartHeight - (value / yMax) * chartHeight;
  };

  // Generate accessibility description for the chart
  const getAccessibilityDescription = (): string => {
    const summary = data.summary;
    const descriptions: string[] = [];

    descriptions.push(
      `Gráfico de tolerância mostrando ${summary.testedGroups} de ${summary.totalGroups} grupos FODMAP testados.`
    );

    if (summary.toleratedCount > 0) {
      descriptions.push(`${summary.toleratedCount} alimentos tolerados.`);
    }
    if (summary.moderateCount > 0) {
      descriptions.push(`${summary.moderateCount} alimentos com tolerância moderada.`);
    }
    if (summary.triggerCount > 0) {
      descriptions.push(`${summary.triggerCount} alimentos identificados como gatilhos.`);
    }

    // Add details for each group
    data.groups.forEach((group) => {
      if (group.status === 'tested' && group.testedFoods.length > 0) {
        const groupLabel = GROUP_LABELS[group.fodmapGroup];
        descriptions.push(`${groupLabel}: ${group.testedFoods.length} alimentos testados.`);
      }
    });

    return descriptions.join(' ');
  };

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel="Gráfico de perfil de tolerância por grupo FODMAP"
      accessibilityHint={getAccessibilityDescription()}
    >
      <Text style={styles.title}>Perfil de Tolerância por Grupo FODMAP</Text>

      <Svg
        width={width}
        height={height}
        accessible={true}
        accessibilityLabel="Gráfico de barras mostrando tolerância alimentar"
      >
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

        {/* Y-axis labels */}
        {[0, 1, 2, 3, 4, 5].map((tick) => {
          const value = (tick / 5) * yMax;
          const y = getYPosition(value);

          return (
            <G key={`y-tick-${tick}`}>
              <Line
                x1={padding.left - 5}
                y1={y}
                x2={padding.left}
                y2={y}
                stroke={lightColors.border}
                strokeWidth="1"
              />
              <SvgText
                x={padding.left - 10}
                y={y + 4}
                fontSize="10"
                fill={lightColors.text}
                textAnchor="end"
              >
                {Math.round(value)}
              </SvgText>
            </G>
          );
        })}

        {/* Y-axis label */}
        <SvgText
          x={15}
          y={padding.top + chartHeight / 2}
          fontSize="12"
          fill={lightColors.text}
          textAnchor="middle"
          transform={`rotate(-90, 15, ${padding.top + chartHeight / 2})`}
        >
          Número de Alimentos
        </SvgText>

        {/* Bars */}
        {barData.map((groupData) =>
          groupData.bars.map((bar, barIndex) => {
            if (bar.count === 0) return null;

            const barHeight = (bar.count / yMax) * chartHeight;
            const y = getYPosition(bar.count);

            return (
              <G key={`${groupData.group}-${bar.category}`}>
                <Rect
                  x={bar.x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={getBarColor(bar.category)}
                  stroke={highContrastMode ? '#000000' : 'none'}
                  strokeWidth={highContrastMode ? '2' : '0'}
                />
                {/* Value label on top of bar */}
                <SvgText
                  x={bar.x + barWidth / 2}
                  y={y - 5}
                  fontSize="10"
                  fill={lightColors.text}
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {bar.count}
                </SvgText>
              </G>
            );
          })
        )}

        {/* X-axis group labels */}
        {barData.map((groupData, index) => {
          const centerX = groupData.x + (barWidth * 4 + groupSpacing * 3) / 2;
          const words = groupData.label.split(' ');

          return (
            <G key={`x-label-${groupData.group}`}>
              {words.map((word, wordIndex) => (
                <SvgText
                  key={`${groupData.group}-word-${wordIndex}`}
                  x={centerX}
                  y={padding.top + chartHeight + 20 + wordIndex * 12}
                  fontSize="10"
                  fill={lightColors.text}
                  textAnchor="middle"
                >
                  {word}
                </SvgText>
              ))}
            </G>
          );
        })}
      </Svg>

      {/* Legend */}
      <View
        style={styles.legend}
        accessible={true}
        accessibilityRole="list"
        accessibilityLabel="Legenda do gráfico de tolerância"
      >
        {(['tolerated', 'moderate', 'trigger', 'untested'] as const).map((category) => (
          <View
            key={category}
            style={styles.legendItem}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel={`${TOLERANCE_LABELS[category]}: categoria de tolerância`}
          >
            <View
              style={[
                styles.legendColor,
                {
                  backgroundColor: getBarColor(category),
                  borderWidth: highContrastMode ? 2 : 0,
                  borderColor: '#000000',
                },
              ]}
              accessible={false}
            />
            <Text style={styles.legendText}>{TOLERANCE_LABELS[category]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const ToleranceChart = React.memo(ToleranceChartComponent, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.highContrastMode === nextProps.highContrastMode &&
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height &&
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data)
  );
});

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
    marginBottom: 16,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: lightColors.text,
  },
});
