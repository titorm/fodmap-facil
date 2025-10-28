import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { SymptomEntryRepository } from '../SymptomEntryRepository';
import type { SymptomEntry } from '../../../db/schema';

describe('SymptomEntryRepository', () => {
  let db: ReturnType<typeof drizzle>;
  let repository: SymptomEntryRepository;
  let sqlite: Database.Database;
  let testUserId: string;
  let testProtocolRunId: string;
  let testFoodItemId: string;
  let testTestStepId: string;

  beforeEach(() => {
    // Create in-memory SQLite database for testing
    sqlite = new Database(':memory:');
    db = drizzle(sqlite);

    // Create tables
    sqlite.exec(`
      CREATE TABLE user_profiles (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        language_preference TEXT NOT NULL DEFAULT 'pt',
        theme_preference TEXT NOT NULL DEFAULT 'system',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE protocol_runs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES user_profiles(id),
        status TEXT NOT NULL,
        start_date INTEGER NOT NULL,
        end_date INTEGER,
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE food_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        fodmap_group TEXT NOT NULL,
        fodmap_type TEXT NOT NULL,
        serving_size TEXT NOT NULL,
        description TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE test_steps (
        id TEXT PRIMARY KEY,
        protocol_run_id TEXT NOT NULL REFERENCES protocol_runs(id),
        food_item_id TEXT NOT NULL REFERENCES food_items(id),
        sequence_number INTEGER NOT NULL,
        status TEXT NOT NULL,
        scheduled_date INTEGER NOT NULL,
        completed_date INTEGER,
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE symptom_entries (
        id TEXT PRIMARY KEY,
        test_step_id TEXT NOT NULL REFERENCES test_steps(id),
        symptom_type TEXT NOT NULL,
        severity INTEGER NOT NULL,
        timestamp INTEGER NOT NULL,
        notes TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX idx_symptom_entries_test_step_id ON symptom_entries(test_step_id);
      CREATE INDEX idx_symptom_entries_timestamp ON symptom_entries(timestamp);
      CREATE INDEX idx_symptom_entries_test_step_timestamp ON symptom_entries(test_step_id, timestamp);
    `);

    // Insert test data
    testUserId = `user-${Date.now()}`;
    testProtocolRunId = `protocol-${Date.now()}`;
    testFoodItemId = `food-${Date.now()}`;
    testTestStepId = `step-${Date.now()}`;

    sqlite
      .prepare(
        `INSERT INTO user_profiles (id, email, name, language_preference, theme_preference, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(testUserId, 'test@example.com', 'Test User', 'en', 'system', Date.now(), Date.now());

    sqlite
      .prepare(
        `INSERT INTO protocol_runs (id, user_id, status, start_date, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        testProtocolRunId,
        testUserId,
        'active',
        Date.now(),
        'Test protocol',
        Date.now(),
        Date.now()
      );

    sqlite
      .prepare(
        `INSERT INTO food_items (id, name, fodmap_group, fodmap_type, serving_size, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        testFoodItemId,
        'Test Food',
        'oligosaccharides',
        'fructans',
        '1 cup',
        Date.now(),
        Date.now()
      );

    sqlite
      .prepare(
        `INSERT INTO test_steps (id, protocol_run_id, food_item_id, sequence_number, status, scheduled_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        testTestStepId,
        testProtocolRunId,
        testFoodItemId,
        1,
        'in_progress',
        Date.now(),
        Date.now(),
        Date.now()
      );

    repository = new SymptomEntryRepository(db);
  });

  afterEach(() => {
    sqlite.close();
  });

  describe('create', () => {
    it('should create a new symptom entry with valid data', async () => {
      const symptomData = {
        testStepId: testTestStepId,
        symptomType: 'bloating' as const,
        severity: 5,
        timestamp: new Date(),
        notes: 'Mild bloating after meal',
      };

      const result = await repository.create(symptomData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.testStepId).toBe(symptomData.testStepId);
      expect(result.symptomType).toBe(symptomData.symptomType);
      expect(result.severity).toBe(symptomData.severity);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.notes).toBe(symptomData.notes);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should create symptom entry without notes', async () => {
      const symptomData = {
        testStepId: testTestStepId,
        symptomType: 'pain' as const,
        severity: 3,
        timestamp: new Date(),
      };

      const result = await repository.create(symptomData);

      expect(result.notes).toBeNull();
    });

    it('should throw error when testStepId is missing', async () => {
      const symptomData = {
        testStepId: '',
        symptomType: 'bloating' as const,
        severity: 5,
        timestamp: new Date(),
      };

      await expect(repository.create(symptomData)).rejects.toThrow('Test step ID is required');
    });

    it('should throw error when symptomType is missing', async () => {
      const symptomData = {
        testStepId: testTestStepId,
        symptomType: '' as any,
        severity: 5,
        timestamp: new Date(),
      };

      await expect(repository.create(symptomData)).rejects.toThrow('Symptom type is required');
    });

    it('should throw error when severity is missing', async () => {
      const symptomData = {
        testStepId: testTestStepId,
        symptomType: 'bloating' as const,
        severity: undefined as any,
        timestamp: new Date(),
      };

      await expect(repository.create(symptomData)).rejects.toThrow('Severity is required');
    });

    it('should throw error when timestamp is missing', async () => {
      const symptomData = {
        testStepId: testTestStepId,
        symptomType: 'bloating' as const,
        severity: 5,
        timestamp: null as any,
      };

      await expect(repository.create(symptomData)).rejects.toThrow('Timestamp is required');
    });

    it('should throw error when symptomType is invalid', async () => {
      const symptomData = {
        testStepId: testTestStepId,
        symptomType: 'invalid' as any,
        severity: 5,
        timestamp: new Date(),
      };

      await expect(repository.create(symptomData)).rejects.toThrow('Invalid symptom type');
    });

    it('should throw error when severity is less than 1', async () => {
      const symptomData = {
        testStepId: testTestStepId,
        symptomType: 'bloating' as const,
        severity: 0,
        timestamp: new Date(),
      };

      await expect(repository.create(symptomData)).rejects.toThrow(
        'Severity must be between 1 and 10'
      );
    });

    it('should throw error when severity is greater than 10', async () => {
      const symptomData = {
        testStepId: testTestStepId,
        symptomType: 'bloating' as const,
        severity: 11,
        timestamp: new Date(),
      };

      await expect(repository.create(symptomData)).rejects.toThrow(
        'Severity must be between 1 and 10'
      );
    });

    it('should create symptom entry with all valid symptom types', async () => {
      const symptomTypes = ['bloating', 'pain', 'gas', 'diarrhea', 'constipation'] as const;

      for (const symptomType of symptomTypes) {
        const symptomData = {
          testStepId: testTestStepId,
          symptomType,
          severity: 5,
          timestamp: new Date(),
        };

        const result = await repository.create(symptomData);
        expect(result.symptomType).toBe(symptomType);
      }
    });

    it('should create symptom entry with all valid severity levels', async () => {
      for (let severity = 1; severity <= 10; severity++) {
        const symptomData = {
          testStepId: testTestStepId,
          symptomType: 'bloating' as const,
          severity,
          timestamp: new Date(),
        };

        const result = await repository.create(symptomData);
        expect(result.severity).toBe(severity);
      }
    });
  });

  describe('findById', () => {
    it('should find symptom entry by id', async () => {
      const symptomData = {
        testStepId: testTestStepId,
        symptomType: 'bloating' as const,
        severity: 5,
        timestamp: new Date(),
      };

      const created = await repository.create(symptomData);
      const found = await repository.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.testStepId).toBe(symptomData.testStepId);
      expect(found?.symptomType).toBe(symptomData.symptomType);
      expect(found?.severity).toBe(symptomData.severity);
    });

    it('should return null when symptom entry not found', async () => {
      const found = await repository.findById('non-existent-id');

      expect(found).toBeNull();
    });
  });

  describe('findByTestStepId', () => {
    it('should find all symptom entries for a test step', async () => {
      await repository.create({
        testStepId: testTestStepId,
        symptomType: 'bloating' as const,
        severity: 5,
        timestamp: new Date('2024-01-01T10:00:00'),
      });

      await repository.create({
        testStepId: testTestStepId,
        symptomType: 'pain' as const,
        severity: 3,
        timestamp: new Date('2024-01-01T14:00:00'),
      });

      const found = await repository.findByTestStepId(testTestStepId);

      expect(found).toHaveLength(2);
      expect(found[0].testStepId).toBe(testTestStepId);
      expect(found[1].testStepId).toBe(testTestStepId);
    });

    it('should return empty array when no symptom entries found', async () => {
      const found = await repository.findByTestStepId('non-existent-step');

      expect(found).toEqual([]);
    });

    it('should return symptom entries ordered by timestamp', async () => {
      await repository.create({
        testStepId: testTestStepId,
        symptomType: 'bloating' as const,
        severity: 5,
        timestamp: new Date('2024-01-01T14:00:00'),
      });

      await repository.create({
        testStepId: testTestStepId,
        symptomType: 'pain' as const,
        severity: 3,
        timestamp: new Date('2024-01-01T10:00:00'),
      });

      await repository.create({
        testStepId: testTestStepId,
        symptomType: 'gas' as const,
        severity: 4,
        timestamp: new Date('2024-01-01T12:00:00'),
      });

      const found = await repository.findByTestStepId(testTestStepId);

      expect(found[0].timestamp.getTime()).toBeLessThan(found[1].timestamp.getTime());
      expect(found[1].timestamp.getTime()).toBeLessThan(found[2].timestamp.getTime());
    });
  });

  describe('findByDateRange', () => {
    it('should find symptom entries within date range', async () => {
      await repository.create({
        testStepId: testTestStepId,
        symptomType: 'bloating' as const,
        severity: 5,
        timestamp: new Date('2024-01-05T10:00:00'),
      });

      await repository.create({
        testStepId: testTestStepId,
        symptomType: 'pain' as const,
        severity: 3,
        timestamp: new Date('2024-01-10T10:00:00'),
      });

      await repository.create({
        testStepId: testTestStepId,
        symptomType: 'gas' as const,
        severity: 4,
        timestamp: new Date('2024-01-15T10:00:00'),
      });

      const found = await repository.findByDateRange(
        testTestStepId,
        new Date('2024-01-08T00:00:00'),
        new Date('2024-01-12T23:59:59')
      );

      expect(found).toHaveLength(1);
      expect(found[0].symptomType).toBe('pain');
    });

    it('should return empty array when no entries in date range', async () => {
      await repository.create({
        testStepId: testTestStepId,
        symptomType: 'bloating' as const,
        severity: 5,
        timestamp: new Date('2024-01-01T10:00:00'),
      });

      const found = await repository.findByDateRange(
        testTestStepId,
        new Date('2024-02-01T00:00:00'),
        new Date('2024-02-28T23:59:59')
      );

      expect(found).toEqual([]);
    });

    it('should include entries at start and end boundaries', async () => {
      const startDate = new Date('2024-01-01T00:00:00');
      const endDate = new Date('2024-01-31T23:59:59');

      await repository.create({
        testStepId: testTestStepId,
        symptomType: 'bloating' as const,
        severity: 5,
        timestamp: startDate,
      });

      await repository.create({
        testStepId: testTestStepId,
        symptomType: 'pain' as const,
        severity: 3,
        timestamp: endDate,
      });

      const found = await repository.findByDateRange(testTestStepId, startDate, endDate);

      expect(found).toHaveLength(2);
    });

    it('should throw error when start date is after end date', async () => {
      await expect(
        repository.findByDateRange(testTestStepId, new Date('2024-02-01'), new Date('2024-01-01'))
      ).rejects.toThrow('Start date must be before or equal to end date');
    });

    it('should return entries ordered by timestamp', async () => {
      await repository.create({
        testStepId: testTestStepId,
        symptomType: 'bloating' as const,
        severity: 5,
        timestamp: new Date('2024-01-15T10:00:00'),
      });

      await repository.create({
        testStepId: testTestStepId,
        symptomType: 'pain' as const,
        severity: 3,
        timestamp: new Date('2024-01-05T10:00:00'),
      });

      await repository.create({
        testStepId: testTestStepId,
        symptomType: 'gas' as const,
        severity: 4,
        timestamp: new Date('2024-01-10T10:00:00'),
      });

      const found = await repository.findByDateRange(
        testTestStepId,
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(found[0].timestamp.getTime()).toBeLessThan(found[1].timestamp.getTime());
      expect(found[1].timestamp.getTime()).toBeLessThan(found[2].timestamp.getTime());
    });
  });

  describe('delete', () => {
    it('should delete symptom entry by id', async () => {
      const symptomData = {
        testStepId: testTestStepId,
        symptomType: 'bloating' as const,
        severity: 5,
        timestamp: new Date(),
      };

      const created = await repository.create(symptomData);
      await repository.delete(created.id);

      const found = await repository.findById(created.id);
      expect(found).toBeNull();
    });

    it('should throw error when deleting non-existent symptom entry', async () => {
      await expect(repository.delete('non-existent-id')).rejects.toThrow(
        'SymptomEntry with id non-existent-id not found'
      );
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully in create', async () => {
      // Close the database to simulate an error
      sqlite.close();

      const symptomData = {
        testStepId: testTestStepId,
        symptomType: 'bloating' as const,
        severity: 5,
        timestamp: new Date(),
      };

      await expect(repository.create(symptomData)).rejects.toThrow('Database operation failed');
    });
  });
});
