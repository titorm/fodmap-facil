/**
 * Washout Feature Module
 *
 * Main export file for the washout period feature.
 * Provides guided educational content delivery during FODMAP washout periods.
 *
 * @module features/washout
 */

// Components
export {
  EducationalContentCard,
  ReminderBanner,
  WashoutCountdown,
  type EducationalContentCardProps,
  type ReminderBannerProps,
  type WashoutCountdownProps,
} from './components';

// Screens
export { WashoutScreen, type WashoutScreenProps } from './screens';

// Hooks
export { useWashout, type UseWashoutReturn, type Countdown, type ReminderMessage } from './hooks';

// Services
export {
  ContentSurfacingEngine,
  TelemetryService,
  NotificationService,
  type ITelemetryService,
  type TelemetryEvent,
  type TelemetryEventType,
  type TelemetryServiceConfig,
  type AnxietyLevel,
} from './services';

// Repositories
export {
  ContentRepository,
  LocalJsonContentRepository,
  SupabaseContentRepository,
} from './repositories';

// Stores
export { TelemetryEventStore } from './stores';

// Utilities
export {
  deriveUserState,
  deriveExperienceLevel,
  deriveProtocolPhase,
  getPreviouslyViewedContentIds,
  type UserState,
  type ExperienceLevel,
  type ProtocolPhase,
} from './utils';
