/**
 * Tipos de entidades do domínio
 * Estes tipos são independentes do banco de dados e representam o modelo de domínio
 */

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
export type SyncStatus = 'pending' | 'synced' | 'error';

/**
 * UserProfile Entity
 */
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  languagePreference: string;
  themePreference: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserProfileInput {
  id: string;
  email: string;
  name: string;
  languagePreference?: string;
  themePreference?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateUserProfileInput {
  name?: string;
  languagePreference?: string;
  themePreference?: string;
  updatedAt: Date;
}

/**
 * ProtocolRun Entity
 */
export interface ProtocolRun {
  id: string;
  userId: string;
  status: ProtocolRunStatus;
  startDate: Date;
  endDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: SyncStatus;
  lastSyncAttempt?: Date;
}

export interface CreateProtocolRunInput {
  id: string;
  userId: string;
  status: ProtocolRunStatus;
  startDate: Date;
  endDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  syncStatus?: SyncStatus;
  lastSyncAttempt?: Date;
}

export interface UpdateProtocolRunInput {
  status?: ProtocolRunStatus;
  endDate?: Date;
  notes?: string;
  updatedAt: Date;
  syncStatus?: SyncStatus;
  lastSyncAttempt?: Date;
}

/**
 * TestStep Entity
 */
export interface TestStep {
  id: string;
  protocolRunId: string;
  foodItemId: string;
  sequenceNumber: number;
  status: TestStepStatus;
  scheduledDate: Date;
  completedDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: SyncStatus;
  lastSyncAttempt?: Date;
}

export interface CreateTestStepInput {
  id: string;
  protocolRunId: string;
  foodItemId: string;
  sequenceNumber: number;
  status: TestStepStatus;
  scheduledDate: Date;
  completedDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  syncStatus?: SyncStatus;
  lastSyncAttempt?: Date;
}

export interface UpdateTestStepInput {
  status?: TestStepStatus;
  completedDate?: Date;
  notes?: string;
  updatedAt: Date;
  syncStatus?: SyncStatus;
  lastSyncAttempt?: Date;
}

/**
 * SymptomEntry Entity
 */
export interface SymptomEntry {
  id: string;
  testStepId: string;
  symptomType: SymptomType;
  severity: number;
  timestamp: Date;
  notes?: string;
  createdAt: Date;
  syncStatus: SyncStatus;
  lastSyncAttempt?: Date;
}

export interface CreateSymptomEntryInput {
  id: string;
  testStepId: string;
  symptomType: SymptomType;
  severity: number;
  timestamp: Date;
  notes?: string;
  createdAt: Date;
  syncStatus?: SyncStatus;
  lastSyncAttempt?: Date;
}

/**
 * WashoutPeriod Entity
 */
export interface WashoutPeriod {
  id: string;
  protocolRunId: string;
  startDate: Date;
  endDate: Date;
  status: WashoutPeriodStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWashoutPeriodInput {
  id: string;
  protocolRunId: string;
  startDate: Date;
  endDate: Date;
  status: WashoutPeriodStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateWashoutPeriodInput {
  status?: WashoutPeriodStatus;
  updatedAt: Date;
}

/**
 * FoodItem Entity
 */
export interface FoodItem {
  id: string;
  name: string;
  fodmapGroup: FodmapGroup;
  fodmapType: FodmapType;
  servingSize: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFoodItemInput {
  id: string;
  name: string;
  fodmapGroup: FodmapGroup;
  fodmapType: FodmapType;
  servingSize: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateFoodItemInput {
  name?: string;
  servingSize?: string;
  description?: string;
  updatedAt: Date;
}

/**
 * GroupResult Entity
 */
export interface GroupResult {
  id: string;
  protocolRunId: string;
  fodmapGroup: FodmapGroup;
  toleranceLevel: ToleranceLevel;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGroupResultInput {
  id: string;
  protocolRunId: string;
  fodmapGroup: FodmapGroup;
  toleranceLevel: ToleranceLevel;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateGroupResultInput {
  toleranceLevel?: ToleranceLevel;
  notes?: string;
  updatedAt: Date;
}

/**
 * NotificationSchedule Entity
 */
export interface NotificationSchedule {
  id: string;
  testStepId: string;
  notificationType: NotificationType;
  scheduledTime: Date;
  sentStatus: boolean;
  message: string;
  createdAt: Date;
}

export interface CreateNotificationScheduleInput {
  id: string;
  testStepId: string;
  notificationType: NotificationType;
  scheduledTime: Date;
  sentStatus?: boolean;
  message: string;
  createdAt: Date;
}
