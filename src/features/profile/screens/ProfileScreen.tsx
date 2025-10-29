import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../shared/theme';
import { Card } from '../../../shared/components/atoms/Card';
import { useNotificationPreferencesStore } from '../../../shared/stores/notificationPreferencesStore';

export function ProfileScreen() {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius } = theme;
  const navigation = useNavigation();

  // Get permission status for indicator
  const permissionStatus = useNotificationPreferencesStore((state) => state.permissionStatus);

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.background,
  };

  const scrollContentStyle: ViewStyle = {
    padding: spacing.md,
  };

  const headerStyle: ViewStyle = {
    marginBottom: spacing.xl,
    paddingTop: spacing.lg,
  };

  const titleStyle: TextStyle = {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  };

  const subtitleStyle: TextStyle = {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  };

  const sectionTitleStyle: TextStyle = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  };

  const menuItemStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  };

  const menuItemContentStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  };

  const menuItemIconContainerStyle: ViewStyle = {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  };

  const menuItemTextContainerStyle: ViewStyle = {
    flex: 1,
  };

  const menuItemTitleStyle: TextStyle = {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  };

  const menuItemDescriptionStyle: TextStyle = {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  };

  const statusBadgeStyle: ViewStyle = {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  };

  const getPermissionStatusColor = (): string => {
    switch (permissionStatus) {
      case 'granted':
        return colors.success;
      case 'denied':
        return colors.error;
      case 'undetermined':
        return colors.warning;
      default:
        return colors.textSecondary;
    }
  };

  const handleNavigateToNotificationSettings = () => {
    // @ts-ignore - Navigation types will be updated
    navigation.navigate('NotificationSettings');
  };

  const handleNavigateToNotificationHistory = () => {
    // @ts-ignore - Navigation types will be updated
    navigation.navigate('NotificationHistory');
  };

  return (
    <View style={containerStyle}>
      <ScrollView contentContainerStyle={scrollContentStyle}>
        {/* Header */}
        <View style={headerStyle}>
          <Text style={titleStyle}>Perfil</Text>
          <Text style={subtitleStyle}>Gerencie suas configurações e preferências</Text>
        </View>

        {/* Notifications Section */}
        <Text style={sectionTitleStyle}>Notificações</Text>
        <Card>
          <TouchableOpacity
            style={menuItemStyle}
            onPress={handleNavigateToNotificationSettings}
            accessibilityRole="button"
            accessibilityLabel="Notification settings - Configure your notification preferences"
          >
            <View style={menuItemContentStyle}>
              <View style={menuItemIconContainerStyle}>
                <Ionicons name="notifications-outline" size={24} color={colors.primary500} />
              </View>
              <View style={menuItemTextContainerStyle}>
                <Text style={menuItemTitleStyle}>Configurações de Notificações</Text>
                <Text style={menuItemDescriptionStyle}>Gerencie lembretes e preferências</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={[statusBadgeStyle, { backgroundColor: getPermissionStatusColor() }]}
                accessibilityLabel={`Permission status: ${permissionStatus}`}
              />
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[menuItemStyle, { borderBottomWidth: 0 }]}
            onPress={handleNavigateToNotificationHistory}
            accessibilityRole="button"
            accessibilityLabel="Notification history - View your past notifications"
          >
            <View style={menuItemContentStyle}>
              <View style={menuItemIconContainerStyle}>
                <Ionicons name="time-outline" size={24} color={colors.primary500} />
              </View>
              <View style={menuItemTextContainerStyle}>
                <Text style={menuItemTitleStyle}>Histórico de Notificações</Text>
                <Text style={menuItemDescriptionStyle}>Veja suas notificações recentes</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </Card>

        {/* Account Section - Placeholder for future features */}
        <Text style={sectionTitleStyle}>Conta</Text>
        <Card>
          <View style={menuItemStyle}>
            <View style={menuItemContentStyle}>
              <View style={menuItemIconContainerStyle}>
                <Ionicons name="person-outline" size={24} color={colors.primary500} />
              </View>
              <View style={menuItemTextContainerStyle}>
                <Text style={menuItemTitleStyle}>Informações da Conta</Text>
                <Text style={menuItemDescriptionStyle}>Gerencie seus dados pessoais</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </View>

          <View style={[menuItemStyle, { borderBottomWidth: 0 }]}>
            <View style={menuItemContentStyle}>
              <View style={menuItemIconContainerStyle}>
                <Ionicons name="shield-outline" size={24} color={colors.primary500} />
              </View>
              <View style={menuItemTextContainerStyle}>
                <Text style={menuItemTitleStyle}>Privacidade e Segurança</Text>
                <Text style={menuItemDescriptionStyle}>Controle seus dados e privacidade</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </View>
        </Card>

        {/* App Section - Placeholder for future features */}
        <Text style={sectionTitleStyle}>Aplicativo</Text>
        <Card>
          <View style={menuItemStyle}>
            <View style={menuItemContentStyle}>
              <View style={menuItemIconContainerStyle}>
                <Ionicons name="language-outline" size={24} color={colors.primary500} />
              </View>
              <View style={menuItemTextContainerStyle}>
                <Text style={menuItemTitleStyle}>Idioma</Text>
                <Text style={menuItemDescriptionStyle}>Português (Brasil)</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </View>

          <View style={[menuItemStyle, { borderBottomWidth: 0 }]}>
            <View style={menuItemContentStyle}>
              <View style={menuItemIconContainerStyle}>
                <Ionicons name="information-circle-outline" size={24} color={colors.primary500} />
              </View>
              <View style={menuItemTextContainerStyle}>
                <Text style={menuItemTitleStyle}>Sobre</Text>
                <Text style={menuItemDescriptionStyle}>Versão, termos e licenças</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}
