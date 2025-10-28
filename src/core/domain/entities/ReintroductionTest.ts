/**
 * Entidade de Domínio: Teste de Reintrodução FODMAP
 */

export enum FODMAPGroup {
  FRUCTOSE = 'fructose',
  LACTOSE = 'lactose',
  FRUCTANS = 'fructans',
  GALACTANS = 'galactans',
  POLYOLS = 'polyols',
}

export enum TestPhase {
  ELIMINATION = 'elimination',
  REINTRODUCTION = 'reintroduction',
  PERSONALIZATION = 'personalization',
}

export enum SymptomSeverity {
  NONE = 0,
  MILD = 1,
  MODERATE = 2,
  SEVERE = 3,
}

export interface Symptom {
  id: string;
  type: string;
  severity: SymptomSeverity;
  notes?: string;
  timestamp: Date;
}

export interface ReintroductionTest {
  id: string;
  userId: string;
  fodmapGroup: FODMAPGroup;
  phase: TestPhase;
  dayNumber: number;
  foodItem: string;
  portionSize: string;
  symptoms: Symptom[];
  notes?: string;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReintroductionProtocol {
  fodmapGroup: FODMAPGroup;
  testDuration: number; // dias
  washoutPeriod: number; // dias
  recommendedFoods: string[];
  portionProgression: string[];
}
