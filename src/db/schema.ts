import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

/**
 * Enum Types
 */
export type ProtocolRunStatus = 'planned' | 'active' | 'paused' | 'completed';
export type TestStepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';
export type SymptomType = 'bloating' | 'pain' | 'gas' | 'diarrhea' | 'constipation';
export type FodmapGroup = 'oligosaccharides' | 'disaccharides' | 'monosaccharides' | 'polyols';
export type FodmapType = 'fructans' | 'GOS' | 'lactose' | 'fructose' | 'sorbitol' | 'mannitol';
export type ToleranceLevel = 'high' | 'moderate' | 'low' | 'none';
export type NotificationType = 'reminder' | 'symptom_check' | 'washout_start' | 'washout_end';
export type WashoutPeriodStatus = 'pending' | 'active' | 'completed';

/**
 * UserProfile Entity
 * Represents user profile information
 */
export const userProfiles = sqliteTable('user_profiles', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  languagePreference: text('language_preference').notNull().default('pt'),
  themePreference: text('theme_preference').notNull().default('system'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * ProtocolRun Entity
 * Represents a complete FODMAP reintroduction protocol execution
 */
export const protocolRuns = sqliteTable('protocol_runs', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => userProfiles.id),
  status: text('status').notNull().$type<ProtocolRunStatus>(),
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * TestStep Entity
 * Represents individual test steps within a protocol run
 */
export const testSteps = sqliteTable('test_steps', {
  id: text('id').primaryKey(),
  protocolRunId: text('protocol_run_id')
    .notNull()
    .references(() => protocolRuns.id),
  foodItemId: text('food_item_id')
    .notNull()
    .references(() => foodItems.id),
  sequenceNumber: integer('sequence_number').notNull(),
  status: text('status').notNull().$type<TestStepStatus>(),
  scheduledDate: integer('scheduled_date', { mode: 'timestamp' }).notNull(),
  completedDate: integer('completed_date', { mode: 'timestamp' }),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * SymptomEntry Entity
 * Represents symptom records logged by users
 */
export const symptomEntries = sqliteTable('symptom_entries', {
  id: text('id').primaryKey(),
  testStepId: text('test_step_id')
    .notNull()
    .references(() => testSteps.id),
  symptomType: text('symptom_type').notNull().$type<SymptomType>(),
  severity: integer('severity').notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

/**
 * WashoutPeriod Entity
 * Represents washout periods between food tests
 */
export const washoutPeriods = sqliteTable('washout_periods', {
  id: text('id').primaryKey(),
  protocolRunId: text('protocol_run_id')
    .notNull()
    .references(() => protocolRuns.id),
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }).notNull(),
  status: text('status').notNull().$type<WashoutPeriodStatus>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * FoodItem Entity
 * Represents FODMAP food items available for testing
 */
export const foodItems = sqliteTable('food_items', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  fodmapGroup: text('fodmap_group').notNull().$type<FodmapGroup>(),
  fodmapType: text('fodmap_type').notNull().$type<FodmapType>(),
  servingSize: text('serving_size').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * GroupResult Entity
 * Represents aggregated results for FODMAP groups
 */
export const groupResults = sqliteTable('group_results', {
  id: text('id').primaryKey(),
  protocolRunId: text('protocol_run_id')
    .notNull()
    .references(() => protocolRuns.id),
  fodmapGroup: text('fodmap_group').notNull().$type<FodmapGroup>(),
  toleranceLevel: text('tolerance_level').notNull().$type<ToleranceLevel>(),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * NotificationSchedule Entity
 * Represents scheduled notifications for protocol reminders
 */
export const notificationSchedules = sqliteTable('notification_schedules', {
  id: text('id').primaryKey(),
  testStepId: text('test_step_id')
    .notNull()
    .references(() => testSteps.id),
  notificationType: text('notification_type').notNull().$type<NotificationType>(),
  scheduledTime: integer('scheduled_time', { mode: 'timestamp' }).notNull(),
  sentStatus: integer('sent_status', { mode: 'boolean' }).notNull().default(false),
  message: text('message').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Relations
 */

// UserProfile Relations
export const userProfilesRelations = relations(userProfiles, ({ many }) => ({
  protocolRuns: many(protocolRuns),
}));

// ProtocolRun Relations
export const protocolRunsRelations = relations(protocolRuns, ({ one, many }) => ({
  user: one(userProfiles, {
    fields: [protocolRuns.userId],
    references: [userProfiles.id],
  }),
  testSteps: many(testSteps),
  washoutPeriods: many(washoutPeriods),
  groupResults: many(groupResults),
}));

// TestStep Relations
export const testStepsRelations = relations(testSteps, ({ one, many }) => ({
  protocolRun: one(protocolRuns, {
    fields: [testSteps.protocolRunId],
    references: [protocolRuns.id],
  }),
  foodItem: one(foodItems, {
    fields: [testSteps.foodItemId],
    references: [foodItems.id],
  }),
  symptomEntries: many(symptomEntries),
  notificationSchedules: many(notificationSchedules),
}));

// SymptomEntry Relations
export const symptomEntriesRelations = relations(symptomEntries, ({ one }) => ({
  testStep: one(testSteps, {
    fields: [symptomEntries.testStepId],
    references: [testSteps.id],
  }),
}));

// WashoutPeriod Relations
export const washoutPeriodsRelations = relations(washoutPeriods, ({ one }) => ({
  protocolRun: one(protocolRuns, {
    fields: [washoutPeriods.protocolRunId],
    references: [protocolRuns.id],
  }),
}));

// FoodItem Relations
export const foodItemsRelations = relations(foodItems, ({ many }) => ({
  testSteps: many(testSteps),
}));

// GroupResult Relations
export const groupResultsRelations = relations(groupResults, ({ one }) => ({
  protocolRun: one(protocolRuns, {
    fields: [groupResults.protocolRunId],
    references: [protocolRuns.id],
  }),
}));

// NotificationSchedule Relations
export const notificationSchedulesRelations = relations(notificationSchedules, ({ one }) => ({
  testStep: one(testSteps, {
    fields: [notificationSchedules.testStepId],
    references: [testSteps.id],
  }),
}));

/**
 * Inferred TypeScript Types
 */

// UserProfile Types
export type UserProfile = typeof userProfiles.$inferSelect;
export type CreateUserProfileInput = typeof userProfiles.$inferInsert;
export type UpdateUserProfileInput = Partial<Omit<CreateUserProfileInput, 'id' | 'createdAt'>>;

// ProtocolRun Types
export type ProtocolRun = typeof protocolRuns.$inferSelect;
export type CreateProtocolRunInput = typeof protocolRuns.$inferInsert;
export type UpdateProtocolRunInput = Partial<Omit<CreateProtocolRunInput, 'id' | 'createdAt'>>;

// TestStep Types
export type TestStep = typeof testSteps.$inferSelect;
export type CreateTestStepInput = typeof testSteps.$inferInsert;
export type UpdateTestStepInput = Partial<Omit<CreateTestStepInput, 'id' | 'createdAt'>>;

// SymptomEntry Types
export type SymptomEntry = typeof symptomEntries.$inferSelect;
export type CreateSymptomEntryInput = typeof symptomEntries.$inferInsert;

// WashoutPeriod Types
export type WashoutPeriod = typeof washoutPeriods.$inferSelect;
export type CreateWashoutPeriodInput = typeof washoutPeriods.$inferInsert;
export type UpdateWashoutPeriodInput = Partial<Omit<CreateWashoutPeriodInput, 'id' | 'createdAt'>>;

// FoodItem Types
export type FoodItem = typeof foodItems.$inferSelect;
export type CreateFoodItemInput = typeof foodItems.$inferInsert;
export type UpdateFoodItemInput = Partial<Omit<CreateFoodItemInput, 'id' | 'createdAt'>>;

// GroupResult Types
export type GroupResult = typeof groupResults.$inferSelect;
export type CreateGroupResultInput = typeof groupResults.$inferInsert;
export type UpdateGroupResultInput = Partial<Omit<CreateGroupResultInput, 'id' | 'createdAt'>>;

// NotificationSchedule Types
export type NotificationSchedule = typeof notificationSchedules.$inferSelect;
export type CreateNotificationScheduleInput = typeof notificationSchedules.$inferInsert;
