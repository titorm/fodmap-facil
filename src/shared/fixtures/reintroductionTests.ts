import {
  FODMAPGroup,
  TestPhase,
  SymptomSeverity,
  ReintroductionTest,
} from '../../core/domain/entities/ReintroductionTest';

export const mockReintroductionTests: ReintroductionTest[] = [
  {
    id: 'test-1',
    userId: 'user-1',
    fodmapGroup: FODMAPGroup.FRUCTOSE,
    phase: TestPhase.REINTRODUCTION,
    dayNumber: 1,
    foodItem: 'Honey',
    portionSize: '1 tsp',
    symptoms: [],
    notes: 'Felt good, no issues',
    startDate: new Date('2025-10-20'),
    createdAt: new Date('2025-10-20'),
    updatedAt: new Date('2025-10-20'),
  },
  {
    id: 'test-2',
    userId: 'user-1',
    fodmapGroup: FODMAPGroup.FRUCTOSE,
    phase: TestPhase.REINTRODUCTION,
    dayNumber: 2,
    foodItem: 'Honey',
    portionSize: '2 tsp',
    symptoms: [
      {
        id: 'symptom-1',
        type: 'bloating',
        severity: SymptomSeverity.MILD,
        notes: 'Slight bloating after 2 hours',
        timestamp: new Date('2025-10-21T14:00:00'),
      },
    ],
    notes: 'Mild bloating but manageable',
    startDate: new Date('2025-10-21'),
    createdAt: new Date('2025-10-21'),
    updatedAt: new Date('2025-10-21'),
  },
  {
    id: 'test-3',
    userId: 'user-1',
    fodmapGroup: FODMAPGroup.LACTOSE,
    phase: TestPhase.REINTRODUCTION,
    dayNumber: 1,
    foodItem: 'Milk',
    portionSize: '1/4 cup',
    symptoms: [
      {
        id: 'symptom-2',
        type: 'cramping',
        severity: SymptomSeverity.MODERATE,
        notes: 'Significant cramping',
        timestamp: new Date('2025-10-25T10:30:00'),
      },
      {
        id: 'symptom-3',
        type: 'diarrhea',
        severity: SymptomSeverity.MODERATE,
        timestamp: new Date('2025-10-25T11:00:00'),
      },
    ],
    notes: 'Did not tolerate well',
    startDate: new Date('2025-10-25'),
    createdAt: new Date('2025-10-25'),
    updatedAt: new Date('2025-10-25'),
  },
];

export const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: new Date('2025-10-01'),
  updatedAt: new Date('2025-10-01'),
};
