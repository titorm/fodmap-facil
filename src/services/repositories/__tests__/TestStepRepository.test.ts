import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { TestStepRepository } from '../TestStepRepository';
import type { TestStep } from '../../../db/schema';

describe('TestStepRepository', () => {
  let db: ReturnType<typeof drizzle>;
  let repository: TestStepRepository;
  let sqlite: Database.Database;
  let testUserId: string;
  let testProtocolRunId: string;
  let testFoodItemId: string;

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

      CREATE INDEX idx_test_steps_protocol_run_id ON test_steps(protocol_run_id);
      CREATE INDEX idx_test_steps_status ON test_steps(status);
    `);

    // Insert test data
    testUserId = `user-${Date.now()}`;
    testProtocolRunId = `protocol-${Date.now()}`;
    testFoodItemId = `food-${Date.now()}`;

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

    repository = new TestStepRepository(db);
  });

  afterEach(() => {
    sqlite.close();
  });

  describe('create', () => {
    it('should create a new test step with valid data', async () => {
      const testStepData = {
        protocolRunId: testProtocolRunId,
        foodItemId: testFoodItemId,
        sequenceNumber: 1,
        status: 'pending' as const,
        scheduledDate: new Date(),
        notes: 'Test step',
      };

      const result = await repository.create(testStepData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.protocolRunId).toBe(testStepData.protocolRunId);
      expect(result.foodItemId).toBe(testStepData.foodItemId);
      expect(result.sequenceNumber).toBe(testStepData.sequenceNumber);
      expect(result.status).toBe(testStepData.status);
      expect(result.scheduledDate).toBeInstanceOf(Date);
      expect(result.notes).toBe(testStepData.notes);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should create test step without notes', async () => {
      const testStepData = {
        protocolRunId: testProtocolRunId,
        foodItemId: testFoodItemId,
        sequenceNumber: 1,
        status: 'pending' as const,
        scheduledDate: new Date(),
      };

      const result = await repository.create(testStepData);

      expect(result.notes).toBeNull();
    });

    it('should throw error when protocolRunId is missing', async () => {
      const testStepData = {
        protocolRunId: '',
        foodItemId: testFoodItemId,
        sequenceNumber: 1,
        status: 'pending' as const,
        scheduledDate: new Date(),
      };

      await expect(repository.create(testStepData)).rejects.toThrow('Protocol run ID is required');
    });

    it('should throw error when foodItemId is missing', async () => {
      const testStepData = {
        protocolRunId: testProtocolRunId,
        foodItemId: '',
        sequenceNumber: 1,
        status: 'pending' as const,
        scheduledDate: new Date(),
      };

      await expect(repository.create(testStepData)).rejects.toThrow('Food item ID is required');
    });

    it('should throw error when sequenceNumber is missing', async () => {
      const testStepData = {
        protocolRunId: testProtocolRunId,
        foodItemId: testFoodItemId,
        sequenceNumber: undefined as any,
        status: 'pending' as const,
        scheduledDate: new Date(),
      };

      await expect(repository.create(testStepData)).rejects.toThrow('Sequence number is required');
    });

    it('should throw error when sequenceNumber is negative', async () => {
      const testStepData = {
        protocolRunId: testProtocolRunId,
        foodItemId: testFoodItemId,
        sequenceNumber: -1,
        status: 'pending' as const,
        scheduledDate: new Date(),
      };

      await expect(repository.create(testStepData)).rejects.toThrow(
        'Sequence number must be non-negative'
      );
    });

    it('should throw error when status is missing', async () => {
      const testStepData = {
        protocolRunId: testProtocolRunId,
        foodItemId: testFoodItemId,
        sequenceNumber: 1,
        status: '' as any,
        scheduledDate: new Date(),
      };

      await expect(repository.create(testStepData)).rejects.toThrow('Status is required');
    });

    it('should throw error when scheduledDate is missing', async () => {
      const testStepData = {
        protocolRunId: testProtocolRunId,
        foodItemId: testFoodItemId,
        sequenceNumber: 1,
        status: 'pending' as const,
        scheduledDate: null as any,
      };

      await expect(repository.create(testStepData)).rejects.toThrow('Scheduled date is required');
    });

    it('should throw error when status is invalid', async () => {
      const testStepData = {
        protocolRunId: testProtocolRunId,
        foodItemId: testFoodItemId,
        sequenceNumber: 1,
        status: 'invalid' as any,
        scheduledDate: new Date(),
      };

      await expect(repository.create(testStepData)).rejects.toThrow('Invalid status');
    });

    it('should create test step with all valid statuses', async () => {
      const statuses = ['pending', 'in_progress', 'completed', 'skipped'] as const;

      for (let i = 0; i < statuses.length; i++) {
        const testStepData = {
          protocolRunId: testProtocolRunId,
          foodItemId: testFoodItemId,
          sequenceNumber: i,
          status: statuses[i],
          scheduledDate: new Date(),
        };

        const result = await repository.create(testStepData);
        expect(result.status).toBe(statuses[i]);
      }
    });
  });

  describe('findById', () => {
    it('should find test step by id', async () => {
      const testStepData = {
        protocolRunId: testProtocolRunId,
        foodItemId: testFoodItemId,
        sequenceNumber: 1,
        status: 'pending' as const,
        scheduledDate: new Date(),
      };

      const created = await repository.create(testStepData);
      const found = await repository.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.protocolRunId).toBe(testStepData.protocolRunId);
      expect(found?.status).toBe(testStepData.status);
    });

    it('should return null when test step not found', async () => {
      const found = await repository.findById('non-existent-id');

      expect(found).toBeNull();
    });
  });

  describe('findByProtocolRunId', () => {
    it('should find all test steps for a protocol run', async () => {
      await repository.create({
        protocolRunId: testProtocolRunId,
        foodItemId: testFoodItemId,
        sequenceNumber: 1,
        status: 'pending' as const,
        scheduledDate: new Date(),
      });

      await repository.create({
        protocolRunId: testProtocolRunId,
        foodItemId: testFoodItemId,
        sequenceNumber: 2,
        status: 'in_progress' as const,
        scheduledDate: new Date(),
      });

      const found = await repository.findByProtocolRunId(testProtocolRunId);

      expect(found).toHaveLength(2);
      expect(found[0].protocolRunId).toBe(testProtocolRunId);
      expect(found[1].protocolRunId).toBe(testProtocolRunId);
    });

    it('should return empty array when no test steps found', async () => {
      const found = await repository.findByProtocolRunId('non-existent-protocol');

      expect(found).toEqual([]);
    });

    it('should return test steps ordered by sequence number', async () => {
      await repository.create({
        protocolRunId: testProtocolRunId,
        foodItemId: testFoodItemId,
        sequenceNumber: 3,
        status: 'pending' as const,
        scheduledDate: new Date(),
      });

      await repository.create({
        protocolRunId: testProtocolRunId,
        foodItemId: testFoodItemId,
        sequenceNumber: 1,
        status: 'pending' as const,
        scheduledDate: new Date(),
      });

      await repository.create({
        protocolRunId: testProtocolRunId,
        foodItemId: testFoodItemId,
        sequenceNumber: 2,
        status: 'pending' as const,
        scheduledDate: new Date(),
      });

      const found = await repository.findByProtocolRunId(testProtocolRunId);

      expect(found[0].sequenceNumber).toBe(1);
      expect(found[1].sequenceNumber).toBe(2);
      expect(found[2].sequenceNumber).toBe(3);
    });
  });

  describe('findByStatus', () => {
    it('should find all test steps with a specific status', async () => {
      await repository.create({
        protocolRunId: testProtocolRunId,
        foodItemId: testFoodItemId,
        sequenceNumber: 1,
        status: 'pending' as const,
        scheduledDate: new Date('2024-01-01'),
      });

      await repository.create({
        protocolRunId: testProtocolRunId,
        foodItemId: testFoodItemId,
        sequenceNumber: 2,
        status: 'pending' as const,
        scheduledDate: new Date('2024-02-01'),
      });

      await repository.create({
        protocolRunId: testProtocolRunId,
        foodItemId: testFoodItemId,
        sequenceNumber: 3,
        status: 'completed' as const,
        scheduledDate: new Date('2024-03-01'),
      });

      const found = await repository.findByStatus('pending');

      expect(found).toHaveLength(2);
      expect(found[0].status).toBe('pending');
      expect(found[1].status).toBe('pending');
    });

    it('should return empty array when no test steps with status found', async () => {
      const found = await repository.findByStatus('completed');

      expect(found).toEqual([]);
    });

    it('should throw error when status is invalid', async () => {
      await expect(repository.findByStatus('invalid' as any)).rejects.toThrow('Invalid status');
    });
  });

  describe('update', () => {
    it('should update test step status', async () => {
      const testStepData = {
        protocolRunId: testProtocolRunId,
        foodItemId: testFoodItemId,
        sequenceNumber: 1,
        status: 'pending' as const,
        scheduledDate: new Date(),
      };

      const created = await repository.create(testStepData);
      const updated = await repository.update(created.id, { status: 'in_progress' });

      expect(updated.status).toBe('in_progress');
      expect(updated.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
    });

    it('should update test step completed date', async () => {
      const testStepData = {
        protocolRunId: testProtocolRunId,
        foodItemId: testFoodItemId,
        sequenceNumber: 1,
        status: 'in_progress' as const,
        scheduledDate: new Date(),
      };

      const created = await repository.create(testStepData);
      const completedDate = new Date();
      const updated = await repository.update(created.id, { completedDate });

      expect(updated.completedDate).toBeInstanceOf(Date);
      expect(updated.completedDate?.getTime()).toBe(completedDate.getTime());
    });

    it('should update test step notes', async () => {
      const testStepData = {
        protocolRunId: testProtocolRunId,
        foodItemId: testFoodItemId,
        sequenceNumber: 1,
        status: 'pending' as const,
        scheduledDate: new Date(),
      };

      const created = await repository.create(testStepData);
      const updated = await repository.update(created.id, { notes: 'Updated notes' });

      expect(updated.notes).toBe('Updated notes');
    });

    it('should update test step sequence number', async () => {
      const testStepData = {
        protocolRunId: testProtocolRunId,
        foodItemId: testFoodItemId,
        sequenceNumber: 1,
        status: 'pending' as const,
        scheduledDate: new Date(),
      };

      const created = await repository.create(testStepData);
      const updated = await repository.update(created.id, { sequenceNumber: 5 });

      expect(updated.sequenceNumber).toBe(5);
    });

    it('should throw error when updating non-existent test step', async () => {
      await expect(repository.update('non-existent-id', { status: 'completed' })).rejects.toThrow(
        'TestStep with id non-existent-id not found'
      );
    });

    it('should throw error when updating with invalid status', async () => {
      const testStepData = {
        protocolRunId: testProtocolRunId,
        foodItemId: testFoodItemId,
        sequenceNumber: 1,
        status: 'pending' as const,
        scheduledDate: new Date(),
      };

      const created = await repository.create(testStepData);

      await expect(repository.update(created.id, { status: 'invalid' as any })).rejects.toThrow(
        'Invalid status'
      );
    });

    it('should throw error when updating with negative sequence number', async () => {
      const testStepData = {
        protocolRunId: testProtocolRunId,
        foodItemId: testFoodItemId,
        sequenceNumber: 1,
        status: 'pending' as const,
        scheduledDate: new Date(),
      };

      const created = await repository.create(testStepData);

      await expect(repository.update(created.id, { sequenceNumber: -1 })).rejects.toThrow(
        'Sequence number must be non-negative'
      );
    });
  });

  describe('delete', () => {
    it('should delete test step by id', async () => {
      const testStepData = {
        protocolRunId: testProtocolRunId,
        foodItemId: testFoodItemId,
        sequenceNumber: 1,
        status: 'pending' as const,
        scheduledDate: new Date(),
      };

      const created = await repository.create(testStepData);
      await repository.delete(created.id);

      const found = await repository.findById(created.id);
      expect(found).toBeNull();
    });

    it('should throw error when deleting non-existent test step', async () => {
      await expect(repository.delete('non-existent-id')).rejects.toThrow(
        'TestStep with id non-existent-id not found'
      );
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully in create', async () => {
      // Close the database to simulate an error
      sqlite.close();

      const testStepData = {
        protocolRunId: testProtocolRunId,
        foodItemId: testFoodItemId,
        sequenceNumber: 1,
        status: 'pending' as const,
        scheduledDate: new Date(),
      };

      await expect(repository.create(testStepData)).rejects.toThrow('Database operation failed');
    });
  });
});
