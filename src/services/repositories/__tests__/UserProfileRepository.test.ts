import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { UserProfileRepository } from '../UserProfileRepository';
import { userProfiles } from '../../../db/schema';
import type { UserProfile } from '../../../db/schema';

describe('UserProfileRepository', () => {
  let db: ReturnType<typeof drizzle>;
  let repository: UserProfileRepository;
  let sqlite: Database.Database;

  beforeEach(() => {
    // Create in-memory SQLite database for testing
    sqlite = new Database(':memory:');
    db = drizzle(sqlite);

    // Create the user_profiles table
    sqlite.exec(`
      CREATE TABLE user_profiles (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        language_preference TEXT NOT NULL DEFAULT 'pt',
        theme_preference TEXT NOT NULL DEFAULT 'system',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    repository = new UserProfileRepository(db);
  });

  afterEach(() => {
    sqlite.close();
  });

  describe('create', () => {
    it('should create a new user profile with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        languagePreference: 'en',
        themePreference: 'dark',
      };

      const result = await repository.create(userData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.email).toBe(userData.email);
      expect(result.name).toBe(userData.name);
      expect(result.languagePreference).toBe(userData.languagePreference);
      expect(result.themePreference).toBe(userData.themePreference);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should create user profile with default language and theme preferences', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const result = await repository.create(userData);

      expect(result.languagePreference).toBe('pt');
      expect(result.themePreference).toBe('system');
    });

    it('should throw error when email is missing', async () => {
      const userData = {
        email: '',
        name: 'Test User',
      };

      await expect(repository.create(userData)).rejects.toThrow('Email is required');
    });

    it('should throw error when name is missing', async () => {
      const userData = {
        email: 'test@example.com',
        name: '',
      };

      await expect(repository.create(userData)).rejects.toThrow('Name is required');
    });

    it('should throw error when email format is invalid', async () => {
      const userData = {
        email: 'invalid-email',
        name: 'Test User',
      };

      await expect(repository.create(userData)).rejects.toThrow('Invalid email format');
    });

    it('should throw error when email already exists', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      await repository.create(userData);

      await expect(repository.create(userData)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should find user profile by id', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const created = await repository.create(userData);
      const found = await repository.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.email).toBe(userData.email);
      expect(found?.name).toBe(userData.name);
    });

    it('should return null when user profile not found', async () => {
      const found = await repository.findById('non-existent-id');

      expect(found).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user profile by email', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      await repository.create(userData);
      const found = await repository.findByEmail(userData.email);

      expect(found).toBeDefined();
      expect(found?.email).toBe(userData.email);
      expect(found?.name).toBe(userData.name);
    });

    it('should return null when email not found', async () => {
      const found = await repository.findByEmail('nonexistent@example.com');

      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user profile name', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const created = await repository.create(userData);
      const updated = await repository.update(created.id, { name: 'Updated Name' });

      expect(updated.name).toBe('Updated Name');
      expect(updated.email).toBe(userData.email);
      expect(updated.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
    });

    it('should update user profile email', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const created = await repository.create(userData);
      const updated = await repository.update(created.id, { email: 'newemail@example.com' });

      expect(updated.email).toBe('newemail@example.com');
      expect(updated.name).toBe(userData.name);
    });

    it('should update language preference', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const created = await repository.create(userData);
      const updated = await repository.update(created.id, { languagePreference: 'es' });

      expect(updated.languagePreference).toBe('es');
    });

    it('should update theme preference', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const created = await repository.create(userData);
      const updated = await repository.update(created.id, { themePreference: 'light' });

      expect(updated.themePreference).toBe('light');
    });

    it('should throw error when updating non-existent user profile', async () => {
      await expect(repository.update('non-existent-id', { name: 'Updated Name' })).rejects.toThrow(
        'UserProfile with id non-existent-id not found'
      );
    });

    it('should throw error when updating with invalid email format', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const created = await repository.create(userData);

      await expect(repository.update(created.id, { email: 'invalid-email' })).rejects.toThrow(
        'Invalid email format'
      );
    });

    it('should throw error when updating with empty name', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const created = await repository.create(userData);

      await expect(repository.update(created.id, { name: '' })).rejects.toThrow(
        'Name cannot be empty'
      );
    });
  });

  describe('delete', () => {
    it('should delete user profile by id', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const created = await repository.create(userData);
      await repository.delete(created.id);

      const found = await repository.findById(created.id);
      expect(found).toBeNull();
    });

    it('should throw error when deleting non-existent user profile', async () => {
      await expect(repository.delete('non-existent-id')).rejects.toThrow(
        'UserProfile with id non-existent-id not found'
      );
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully in create', async () => {
      // Close the database to simulate an error
      sqlite.close();

      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      await expect(repository.create(userData)).rejects.toThrow('Database operation failed');
    });
  });
});
