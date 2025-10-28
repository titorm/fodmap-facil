import React from "react";
import { View, Text, StyleSheet, ScrollView, FlatList } from "react-native";
import { useTranslation } from "react-i18next";
import { Button, Card } from "../../../shared/components/atoms";
import { colors, spacing, typography } from "../../../shared/theme";
import { FODMAPGroup } from "../../../core/domain/entities/ReintroductionTest";

export const ReintroductionHomeScreen: React.FC = () => {
  const { t } = useTranslation();

  const fodmapGroups = [
    { id: FODMAPGroup.FRUCTOSE, name: t("reintroduction.foodGroups.fructose") },
    { id: FODMAPGroup.LACTOSE, name: t("reintroduction.foodGroups.lactose") },
    { id: FODMAPGroup.FRUCTANS, name: t("reintroduction.foodGroups.fructans") },
    {
      id: FODMAPGroup.GALACTANS,
      name: t("reintroduction.foodGroups.galactans"),
    },
    { id: FODMAPGroup.POLYOLS, name: t("reintroduction.foodGroups.polyols") },
  ];

  const renderFodmapCard = ({ item }: { item: (typeof fodmapGroups)[0] }) => (
    <Card
      style={styles.card}
      onPress={() => console.log("Navigate to", item.id)}
      accessibilityLabel={`Test ${item.name}`}
      accessibilityHint="Tap to start reintroduction test"
    >
      <Text style={styles.cardTitle}>{item.name}</Text>
      <Text style={styles.cardSubtitle}>Not started</Text>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          {t("reintroduction.title")}
        </Text>
        <Text style={styles.subtitle}>{t("reintroduction.currentPhase")}</Text>
      </View>

      <FlatList
        data={fodmapGroups}
        renderItem={renderFodmapCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral50,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.neutral0,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral900,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.neutral600,
  },
  list: {
    padding: spacing.lg,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.neutral900,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral600,
  },
});
