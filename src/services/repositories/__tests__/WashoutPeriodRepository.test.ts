import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { WashoutPeriodRepository } from '../WashoutPeriodRepository';

describe('WashoutPeriodRepository', () => {
  let db: ReturnType<typeof drizzle>;
  let repository: WashoutPeriodRepository;
  let sqlite: Database.Database;
  let testUserId: string;
  let testProtocolRunId: string;

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

      CREATE TABLE washout_periods (
        id TEXT PRIMARY KEY,
        protocol_run_id TEXT NOT NULL REFERENCES protocol_runs(id),
        start_date INTEGER NOT NULL,
        end_date INTEGER NOT NULL,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE INDEX idx_washout_periods_protocol_run_id ON washout_periods(protocol_run_id);
      CREATE INDEX idx_washout_periods_status ON washout_periods(status);
    `);

    // Insert a test user
    testUserId = `user-${Date.now()}`;
    sqlite
      .prepare(
        `INSERT INTO user_profiles (id, email, name, language_preference, theme_preference, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(testUserId, 'test@example.com', 'Test User', 'en', 'system', Date.now(), Date.now());

    // Insert a test protocol run
    testProtocolRunId = `protocol-${Date.now()}`;
    sqlite
      .prepare(
        `INSERT INTO protocol_runs (id, user_id, status, start_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(testProtocolRunId, testUserId, 'active', Date.now(), Date.now(), Date.now());

    repository = new WashoutPeriodRepository(db as any);
  });

  afterEach(() => {
    sqlite.close();
  });

  describe('findActive', () => {
    it('should find active washout period for a protocol run', async () => {
      const washoutData = {
        protocolRunId: testProtocolRunId,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'active' as const,
      };

      await repository.create(washoutData);
      const found = await repository.findActive(testProtocolRunId);

      expect(found).toBeDefined();
      expect(found?.protocolRunId).toBe(testProtocolRunId);
      expect(found?.status).toBe('active');
    });

    it('should return null when no active washout period found', async () => {
      const washoutData = {
        protocolRunId: testProtocolRunId,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'completed' as const,
      };

      await repository.create(washoutData);
      const found = await repository.findActive(testProtocolRunId);

      expect(found).toBeNull();
    });

    it('should return only active washout period when multiple exist', async () => {
      await repository.create({
        protocolRunId: testProtocolRunId,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-08'),
        status: 'completed' as const,
      });

      await repository.create({
        protocolRunId: testProtocolRunId,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-08'),
        status: 'active' as const,
      });

      await repository.create({
        protocolRunId: testProtocolRunId,
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-03-08'),
        status: 'pending' as const,
      });

      const found = await repository.findActive(testProtocolRunId);

      expect(found).toBeDefined();
      expect(found?.status).toBe('active');
    });

    it('should return most recent active washout period when multiple active exist', async () => {
      await repository.create({
        protocolRunId: testProtocolRunId,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-08'),
        status: 'active' as const,
      });

      await repository.create({
        protocolRunId: testProtocolRunId,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-08'),
        status: 'active' as const,
      });

      const found = await repository.findActive(testProtocolRunId);

      expect(found).toBeDefined();
      expect(found?.status).toBe('active');
      expect(found?.startDate.getTime()).toBe(new Date('2024-01-01').getTime());
    });
  });

  describe('findByProtocolRun', () => {
    it('should find all washout periods for a protocol run', async () => {
      await repository.create({
        protocolRunId: testProtocolRunId,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-08'),
        status: 'completed' as const,
      });

      await repository.create({
        protocolRunId: testProtocolRunId,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-08'),
        status: 'active' as const,
      });

      const found = await repository.findByProtocolRun(testProtocolRunId);

      expect(found).toHaveLength(2);
      expect(found[0].protocolRunId).toBe(testProtocolRunId);
      expect(found[1].protocolRunId).toBe(testProtocolRunId);
    });

    it('should return empty array when no washout periods found', async () => {
      const found = await repository.findByProtocolRun('non-existent-protocol');

      expect(found).toEqual([]);
    });

    it('should return washout periods ordered by start date', async () => {
      await repository.create({
        protocolRunId: testProtocolRunId,
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-03-08'),
        status: 'pending' as const,
      });

      await repository.create({
        protocolRunId: testProtocolRunId,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-08'),
        status: 'completed' as const,
      });

      const found = await repository.findByProtocolRun(testProtocolRunId);

      expect(found[0].startDate.getTime()).toBeLessThan(found[1].startDate.getTime());
    });
  });
});
