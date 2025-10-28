import { z } from 'zod';

// FODMAP Groups
export const FODMAPGroupSchema = z.enum([
  'fructose',
  'lactose',
  'fructans',
  'galactans',
  'polyols',
]);
export type FODMAPGroup = z.infer<typeof FODMAPGroupSchema>;

// Symptom Severity
export const SymptomSeveritySchema = z.enum(['none', 'mild', 'moderate', 'severe']);
export type SymptomSeverity = z.infer<typeof SymptomSeveritySchema>;

// Tolerance Status
export const ToleranceStatusSchema = z.enum(['tolerated', 'sensitive', 'trigger', 'untested']);
export type ToleranceStatus = z.infer<typeof ToleranceStatusSchema>;

// Protocol Phase
export const ProtocolPhaseSchema = z.enum(['testing', 'washout', 'completed']);
export type ProtocolPhase = z.infer<typeof ProtocolPhaseSchema>;

// Symptom Record
export const SymptomRecordSchema = z.object({
  timestamp: z.string().datetime(),
  severity: SymptomSeveritySchema,
  type: z.string(),
  notes: z.string().optional(),
});
export type SymptomRecord = z.infer<typeof SymptomRecordSchema>;

// Dose Record
export const DoseRecordSchema = z.object({
  date: z.string().datetime(),
  dayNumber: z.number().int().min(1).max(3),
  foodItem: z.string(),
  portionSize: z.string(),
  portionAmount: z.number().positive(),
  symptoms: z.array(SymptomRecordSchema),
  notes: z.string().optional(),
});
export type DoseRecord = z.infer<typeof DoseRecordSchema>;

// Food Test Result
export const FoodTestResultSchema = z.object({
  foodItem: z.string(),
  fodmapGroup: FODMAPGroupSchema,
  doses: z.array(DoseRecordSchema).min(1).max(3),
  toleranceStatus: ToleranceStatusSchema,
  maxToleratedPortion: z.string().optional(),
  triggerPortion: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
});
export type FoodTestResult = z.infer<typeof FoodTestResultSchema>;

// Washout Period
export const WashoutPeriodSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  durationDays: z.number().int().min(3).max(7),
  reason: z.string(),
});
export type WashoutPeriod = z.infer<typeof WashoutPeriodSchema>;

// Protocol State (Input)
export const ProtocolStateSchema = z.object({
  userId: z.string(),
  startDate: z.string().datetime(),
  groupSequence: z.array(FODMAPGroupSchema).optional(),
  completedTests: z.array(FoodTestResultSchema),
  currentTest: FoodTestResultSchema.optional(),
  currentWashout: WashoutPeriodSchema.optional(),
  phase: ProtocolPhaseSchema,
});
export type ProtocolState = z.infer<typeof ProtocolStateSchema>;

// Next Action (Output)
export const NextActionSchema = z.object({
  action: z.enum([
    'start_dose',
    'continue_washout',
    'start_next_food',
    'start_next_group',
    'protocol_complete',
    'error',
  ]),
  phase: ProtocolPhaseSchema,
  currentGroup: FODMAPGroupSchema.optional(),
  currentFood: z.string().optional(),
  currentDayNumber: z.number().int().min(1).max(3).optional(),
  recommendedPortion: z.string().optional(),
  message: z.string(),
  instructions: z.array(z.string()),
  nextMilestone: z
    .object({
      date: z.string().datetime(),
      description: z.string(),
    })
    .optional(),
  washoutDaysRemaining: z.number().int().min(0).optional(),
  summary: z
    .object({
      totalTestsCompleted: z.number().int().min(0),
      groupsCompleted: z.array(FODMAPGroupSchema),
      toleratedFoods: z.array(z.string()),
      sensitiveFoods: z.array(z.string()),
      triggerFoods: z.array(z.string()),
    })
    .optional(),
  errors: z.array(z.string()).optional(),
});
export type NextAction = z.infer<typeof NextActionSchema>;
