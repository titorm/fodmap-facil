import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { Card } from '../../../shared/components/atoms';
import { useTheme } from '../../../shared/theme';
import type { SymptomEntry, SymptomType } from '../../../db/schema';

export interface SymptomEntryCardProps {
  entry: SymptomEntry;
  onEdit?: () => void;
  onDelete?: () => void;
}

interface SymptomTypeInfo {
  label: string;
  icon: string;
}

const symptomTypeInfo: Record<SymptomType | 'nausea' | 'other', SymptomTypeInfo> = {
  bloating: { label: 'Bloating', icon: '🎈' },
  pain: { label: 'Pain', icon: '⚡' },
  gas: { label: 'Gas', icon: '💨' },
  diarrhea: { label: 'Diarrhea', icon: '💧' },
  constipation: { label: 'Constipation', icon: '🔒' },
  nausea: { label: 'Nausea', icon: '🤢' },
  other: { label: 'Other', icon: '📝' },
};

/**
 * SymptomEntryCard Component
 *
 * Displays a symptom entry with type, severity, timestamp, and optional notes.
 * Provides edit and delete actions.
 *
 * Features:
 * - Display symptom type with icon
 * - Show severity with color-coded badge
 * - Display timestamp
 * - Show notes if present
 * - Edit and delete actions
 * - Memoized for performance
 *
 * @param entry - The symptom entry to display
 * @param onEdit - Optional callback when edit is pressed
 * @param onDelete - Optional callback when delete is pressed
 *
 * @example
 * ```tsx
 * <SymptomEntryCard
 *   entry={symptomEntry}
 *   onEdit={() => handleEdit(symptomEntry.id)}
 *   onDelete={() => handleDelete(symptomEntry.id)}
 * />
 * ```
 */
export const SymptomEntryCard = React.memo<SymptomEntryCardProps>(
  function SymptomEntryCard({ entry, onEdit, onDelete }) {
    const { theme } = useTheme();
    const { colors, spacing, typography, borderRadius } = theme;

    // Map database severity (1-10) to display severity (0-3)
    const getSeverityLevel = (
      severity: number
    ): { value: number; label: string; color: string } => {
      if (severity <= 2) return { value: 0, label: 'None', color: colors.success };
      if (severity <= 4) return { value: 1, label: 'Mild', color: '#FFC107' };
      if (severity <= 7) return { value: 2, label: 'Moderate', color: '#FF9800' };
      return { value: 3, label: 'Severe', color: colors.error };
    };

    const severityLevel = getSeverityLevel(entry.severity);
    const typeInfo = symptomTypeInfo[entry.symptomType] || symptomTypeInfo.other;

    const headerStyle: ViewStyle = {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    };

    const typeContainerStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    };

    const iconStyle: TextStyle = {
      fontSize: typography.fontSize.xl,
      marginRight: spacing.sm,
    };

    const typeTextStyle: TextStyle = {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semibold,
      color: colors.text,
    };

    const badgeStyle: ViewStyle = {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
      backgroundColor: severityLevel.color,
    };

    const badgeTextStyle: TextStyle = {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.medium,
      color: colors.textOnPrimary,
    };

    const notesStyle: TextStyle = {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
      lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
    };

    const footerStyle: ViewStyle = {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.sm,
    };

    const timestampStyle: TextStyle = {
      fontSize: typography.fontSize.xs,
      color: colors.textTertiary,
    };

    const actionsStyle: ViewStyle = {
      flexDirection: 'row',
      gap: spacing.md,
    };

    const actionButtonStyle: TextStyle = {
      fontSize: typography.fontSize.sm,
      color: colors.interactive,
    };

    const formatTimestamp = (date: Date): string => {
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;

      return date.toLocaleDateString();
    };

    return (
      <Card
        accessibilityLabel={`${typeInfo.label} symptom, severity ${severityLevel.label}, recorded ${formatTimestamp(entry.timestamp)}`}
      >
        {/* Header: Type and Severity */}
        <View style={headerStyle}>
          <View style={typeContainerStyle}>
            <Text style={iconStyle}>{typeInfo.icon}</Text>
            <Text style={typeTextStyle} allowFontScaling={true} maxFontSizeMultiplier={2}>
              {typeInfo.label}
            </Text>
          </View>
          <View style={badgeStyle}>
            <Text style={badgeTextStyle} allowFontScaling={true} maxFontSizeMultiplier={1.5}>
              {severityLevel.label}
            </Text>
          </View>
        </View>

        {/* Notes (if present) */}
        {entry.notes && (
          <Text style={notesStyle} allowFontScaling={true} maxFontSizeMultiplier={2}>
            {entry.notes}
          </Text>
        )}

        {/* Footer: Timestamp and Actions */}
        <View style={footerStyle}>
          <Text style={timestampStyle} allowFontScaling={true} maxFontSizeMultiplier={2}>
            {formatTimestamp(entry.timestamp)}
          </Text>

          {(onEdit || onDelete) && (
            <View style={actionsStyle}>
              {onEdit && (
                <TouchableOpacity
                  onPress={onEdit}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Edit symptom"
                  accessibilityHint="Edit this symptom entry"
                >
                  <Text style={actionButtonStyle} allowFontScaling={true} maxFontSizeMultiplier={2}>
                    Edit
                  </Text>
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity
                  onPress={onDelete}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Delete symptom"
                  accessibilityHint="Delete this symptom entry"
                >
                  <Text
                    style={[actionButtonStyle, { color: colors.error }]}
                    allowFontScaling={true}
                    maxFontSizeMultiplier={2}
                  >
                    Delete
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </Card>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for memoization
    return (
      prevProps.entry.id === nextProps.entry.id &&
      prevProps.entry.severity === nextProps.entry.severity &&
      prevProps.entry.notes === nextProps.entry.notes &&
      prevProps.onEdit === nextProps.onEdit &&
      prevProps.onDelete === nextProps.onDelete
    );
  }
);
