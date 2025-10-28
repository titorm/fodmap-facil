import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { ProtocolRunRepository } from '../ProtocolRunRepository';
import { protocolRuns, userProfiles } from '../../../db/schema';
import type { ProtocolRun } from '../../../db/schema';

describe('ProtocolRunRepository', () => {
  let db: ReturnType<typeof drizzle>;
  let repository: ProtocolRunRepository;
  let sqlite: Database.Database;
  let testUserId: string;

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

      CREATE INDEX idx_protocol_runs_user_id ON protocol_runs(user_id);
      CREATE INDEX idx_protocol_runs_status ON protocol_runs(status);
    `);

    // Insert a test user
    testUserId = `user-${Date.now()}`;
    sqlite
      .prepare(
        `INSERT INTO user_profiles (id, email, name, language_preference, theme_preference, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(testUserId, 'test@example.com', 'Test User', 'en', 'system', Date.now(), Date.now());

    repository = new ProtocolRunRepository(db);
  });

  afterEach(() => {
    sqlite.close();
  });

  describe('create', () => {
    it('should create a new protocol run with valid data', async () => {
      const protocolData = {
        userId: testUserId,
        status: 'planned' as const,
        startDate: new Date(),
        notes: 'Test protocol run',
      };

      const result = await repository.create(protocolData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.userId).toBe(protocolData.userId);
      expect(result.status).toBe(protocolData.status);
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.notes).toBe(protocolData.notes);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should create protocol run without notes', async () => {
      const protocolData = {
        userId: testUserId,
        status: 'active' as const,
        startDate: new Date(),
      };

      const result = await repository.create(protocolData);

      expect(result.notes).toBeNull();
    });

    it('should throw error when userId is missing', async () => {
      const protocolData = {
        userId: '',
        status: 'planned' as const,
        startDate: new Date(),
      };

      await expect(repository.create(protocolData)).rejects.toThrow('User ID is required');
    });

    it('should throw error when status is missing', async () => {
      const protocolData = {
        userId: testUserId,
        status: '' as any,
        startDate: new Date(),
      };

      await expect(repository.create(protocolData)).rejects.toThrow('Status is required');
    });

    it('should throw error when startDate is missing', async () => {
      const protocolData = {
        userId: testUserId,
        status: 'planned' as const,
        startDate: null as any,
      };

      await expect(repository.create(protocolData)).rejects.toThrow('Start date is required');
    });

    it('should throw error when status is invalid', async () => {
      const protocolData = {
        userId: testUserId,
        status: 'invalid' as any,
        startDate: new Date(),
      };

      await expect(repository.create(protocolData)).rejects.toThrow('Invalid status');
    });

    it('should create protocol run with all valid statuses', async () => {
      const statuses = ['planned', 'active', 'paused', 'completed'] as const;

      for (const status of statuses) {
        const protocolData = {
          userId: testUserId,
          status,
          startDate: new Date(),
        };

        const result = await repository.create(protocolData);
        expect(result.status).toBe(status);
      }
    });
  });

  describe('findById', () => {
    it('should find protocol run by id', async () => {
      const protocolData = {
        userId: testUserId,
        status: 'planned' as const,
        startDate: new Date(),
      };

      const created = await repository.create(protocolData);
      const found = await repository.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.userId).toBe(protocolData.userId);
      expect(found?.status).toBe(protocolData.status);
    });

    it('should return null when protocol run not found', async () => {
      const found = await repository.findById('non-existent-id');

      expect(found).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find all protocol runs for a user', async () => {
      const protocolData1 = {
        userId: testUserId,
        status: 'planned' as const,
        startDate: new Date('2024-01-01'),
      };

      const protocolData2 = {
        userId: testUserId,
        status: 'active' as const,
        startDate: new Date('2024-02-01'),
      };

      await repository.create(protocolData1);
      await repository.create(protocolData2);

      const found = await repository.findByUserId(testUserId);

      expect(found).toHaveLength(2);
      expect(found[0].userId).toBe(testUserId);
      expect(found[1].userId).toBe(testUserId);
    });

    it('should return empty array when no protocol runs found', async () => {
      const found = await repository.findByUserId('non-existent-user');

      expect(found).toEqual([]);
    });

    it('should return protocol runs ordered by start date', async () => {
      const protocolData1 = {
        userId: testUserId,
        status: 'planned' as const,
        startDate: new Date('2024-03-01'),
      };

      const protocolData2 = {
        userId: testUserId,
        status: 'active' as const,
        startDate: new Date('2024-01-01'),
      };

      await repository.create(protocolData1);
      await repository.create(protocolData2);

      const found = await repository.findByUserId(testUserId);

      expect(found[0].startDate.getTime()).toBeLessThan(found[1].startDate.getTime());
    });
  });

  describe('findActive', () => {
    it('should find active protocol run for a user', async () => {
      const protocolData = {
        userId: testUserId,
        status: 'active' as const,
        startDate: new Date(),
      };

      await repository.create(protocolData);
      const found = await repository.findActive(testUserId);

      expect(found).toBeDefined();
      expect(found?.userId).toBe(testUserId);
      expect(found?.status).toBe('active');
    });

    it('should return null when no active protocol run found', async () => {
      const protocolData = {
        userId: testUserId,
        status: 'completed' as const,
        startDate: new Date(),
      };

      await repository.create(protocolData);
      const found = await repository.findActive(testUserId);

      expect(found).toBeNull();
    });

    it('should return only active protocol run when multiple exist', async () => {
      await repository.create({
        userId: testUserId,
        status: 'completed' as const,
        startDate: new Date('2024-01-01'),
      });

      await repository.create({
        userId: testUserId,
        status: 'active' as const,
        startDate: new Date('2024-02-01'),
      });

      await repository.create({
        userId: testUserId,
        status: 'planned' as const,
        startDate: new Date('2024-03-01'),
      });

      const found = await repository.findActive(testUserId);

      expect(found).toBeDefined();
      expect(found?.status).toBe('active');
    });
  });

  describe('update', () => {
    it('should update protocol run status', async () => {
      const protocolData = {
        userId: testUserId,
        status: 'planned' as const,
        startDate: new Date(),
      };

      const created = await repository.create(protocolData);
      const updated = await repository.update(created.id, { status: 'active' });

      expect(updated.status).toBe('active');
      expect(updated.userId).toBe(testUserId);
      expect(updated.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
    });

    it('should update protocol run end date', async () => {
      const protocolData = {
        userId: testUserId,
        status: 'active' as const,
        startDate: new Date(),
      };

      const created = await repository.create(protocolData);
      const endDate = new Date();
      const updated = await repository.update(created.id, { endDate });

      expect(updated.endDate).toBeInstanceOf(Date);
      expect(updated.endDate?.getTime()).toBe(endDate.getTime());
    });

    it('should update protocol run notes', async () => {
      const protocolData = {
        userId: testUserId,
        status: 'active' as const,
        startDate: new Date(),
      };

      const created = await repository.create(protocolData);
      const updated = await repository.update(created.id, { notes: 'Updated notes' });

      expect(updated.notes).toBe('Updated notes');
    });

    it('should throw error when updating non-existent protocol run', async () => {
      await expect(repository.update('non-existent-id', { status: 'active' })).rejects.toThrow(
        'ProtocolRun with id non-existent-id not found'
      );
    });

    it('should throw error when updating with invalid status', async () => {
      const protocolData = {
        userId: testUserId,
        status: 'planned' as const,
        startDate: new Date(),
      };

      const created = await repository.create(protocolData);

      await expect(repository.update(created.id, { status: 'invalid' as any })).rejects.toThrow(
        'Invalid status'
      );
    });
  });

  describe('delete', () => {
    it('should delete protocol run by id', async () => {
      const protocolData = {
        userId: testUserId,
        status: 'planned' as const,
        startDate: new Date(),
      };

      const created = await repository.create(protocolData);
      await repository.delete(created.id);

      const found = await repository.findById(created.id);
      expect(found).toBeNull();
    });

    it('should throw error when deleting non-existent protocol run', async () => {
      await expect(repository.delete('non-existent-id')).rejects.toThrow(
        'ProtocolRun with id non-existent-id not found'
      );
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully in create', async () => {
      // Close the database to simulate an error
      sqlite.close();

      const protocolData = {
        userId: testUserId,
        status: 'planned' as const,
        startDate: new Date(),
      };

      await expect(repository.create(protocolData)).rejects.toThrow('Database operation failed');
    });
  });
});
