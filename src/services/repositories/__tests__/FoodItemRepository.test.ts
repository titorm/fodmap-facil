import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { FoodItemRepository } from '../FoodItemRepository';
import type { FoodItem } from '../../../db/schema';

describe('FoodItemRepository', () => {
  let db: ReturnType<typeof drizzle>;
  let repository: FoodItemRepository;
  let sqlite: Database.Database;

  beforeEach(() => {
    // Create in-memory SQLite database for testing
    sqlite = new Database(':memory:');
    db = drizzle(sqlite);

    // Create table
    sqlite.exec(`
      CREATE TABLE food_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        fodmap_group TEXT NOT NULL,
        fodmap_type TEXT NOT NULL,
        serving_size TEXT NOT NULL,
        description TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    repository = new FoodItemRepository(db);
  });

  afterEach(() => {
    sqlite.close();
  });

  describe('create', () => {
    it('should create a new food item with valid data', async () => {
      const foodData = {
        name: 'Wheat Bread',
        fodmapGroup: 'oligosaccharides' as const,
        fodmapType: 'fructans' as const,
        servingSize: '1 slice',
        description: 'Common wheat bread',
      };

      const result = await repository.create(foodData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(foodData.name);
      expect(result.fodmapGroup).toBe(foodData.fodmapGroup);
      expect(result.fodmapType).toBe(foodData.fodmapType);
      expect(result.servingSize).toBe(foodData.servingSize);
      expect(result.description).toBe(foodData.description);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should create food item without description', async () => {
      const foodData = {
        name: 'Wheat Bread',
        fodmapGroup: 'oligosaccharides' as const,
        fodmapType: 'fructans' as const,
        servingSize: '1 slice',
      };

      const result = await repository.create(foodData);

      expect(result.description).toBeNull();
    });

    it('should throw error when name is missing', async () => {
      const foodData = {
        name: '',
        fodmapGroup: 'oligosaccharides' as const,
        fodmapType: 'fructans' as const,
        servingSize: '1 slice',
      };

      await expect(repository.create(foodData)).rejects.toThrow('Name is required');
    });

    it('should throw error when fodmapGroup is missing', async () => {
      const foodData = {
        name: 'Wheat Bread',
        fodmapGroup: '' as any,
        fodmapType: 'fructans' as const,
        servingSize: '1 slice',
      };

      await expect(repository.create(foodData)).rejects.toThrow('FODMAP group is required');
    });

    it('should throw error when fodmapType is missing', async () => {
      const foodData = {
        name: 'Wheat Bread',
        fodmapGroup: 'oligosaccharides' as const,
        fodmapType: '' as any,
        servingSize: '1 slice',
      };

      await expect(repository.create(foodData)).rejects.toThrow('FODMAP type is required');
    });

    it('should throw error when servingSize is missing', async () => {
      const foodData = {
        name: 'Wheat Bread',
        fodmapGroup: 'oligosaccharides' as const,
        fodmapType: 'fructans' as const,
        servingSize: '',
      };

      await expect(repository.create(foodData)).rejects.toThrow('Serving size is required');
    });

    it('should throw error when fodmapGroup is invalid', async () => {
      const foodData = {
        name: 'Wheat Bread',
        fodmapGroup: 'invalid' as any,
        fodmapType: 'fructans' as const,
        servingSize: '1 slice',
      };

      await expect(repository.create(foodData)).rejects.toThrow('Invalid FODMAP group');
    });

    it('should throw error when fodmapType is invalid', async () => {
      const foodData = {
        name: 'Wheat Bread',
        fodmapGroup: 'oligosaccharides' as const,
        fodmapType: 'invalid' as any,
        servingSize: '1 slice',
      };

      await expect(repository.create(foodData)).rejects.toThrow('Invalid FODMAP type');
    });

    it('should throw error when fodmapType does not match fodmapGroup', async () => {
      const foodData = {
        name: 'Milk',
        fodmapGroup: 'oligosaccharides' as const,
        fodmapType: 'lactose' as any,
        servingSize: '1 cup',
      };

      await expect(repository.create(foodData)).rejects.toThrow(
        'Invalid FODMAP type for group oligosaccharides'
      );
    });

    it('should create food items with all valid FODMAP group and type combinations', async () => {
      const validCombinations = [
        { group: 'oligosaccharides' as const, type: 'fructans' as const },
        { group: 'oligosaccharides' as const, type: 'GOS' as const },
        { group: 'disaccharides' as const, type: 'lactose' as const },
        { group: 'monosaccharides' as const, type: 'fructose' as const },
        { group: 'polyols' as const, type: 'sorbitol' as const },
        { group: 'polyols' as const, type: 'mannitol' as const },
      ];

      for (const combo of validCombinations) {
        const foodData = {
          name: `Test Food ${combo.type}`,
          fodmapGroup: combo.group,
          fodmapType: combo.type,
          servingSize: '1 serving',
        };

        const result = await repository.create(foodData);
        expect(result.fodmapGroup).toBe(combo.group);
        expect(result.fodmapType).toBe(combo.type);
      }
    });
  });

  describe('findById', () => {
    it('should find food item by id', async () => {
      const foodData = {
        name: 'Wheat Bread',
        fodmapGroup: 'oligosaccharides' as const,
        fodmapType: 'fructans' as const,
        servingSize: '1 slice',
      };

      const created = await repository.create(foodData);
      const found = await repository.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe(foodData.name);
      expect(found?.fodmapGroup).toBe(foodData.fodmapGroup);
      expect(found?.fodmapType).toBe(foodData.fodmapType);
    });

    it('should return null when food item not found', async () => {
      const found = await repository.findById('non-existent-id');

      expect(found).toBeNull();
    });
  });

  describe('findByFodmapGroup', () => {
    it('should find all food items in a FODMAP group', async () => {
      await repository.create({
        name: 'Wheat Bread',
        fodmapGroup: 'oligosaccharides' as const,
        fodmapType: 'fructans' as const,
        servingSize: '1 slice',
      });

      await repository.create({
        name: 'Garlic',
        fodmapGroup: 'oligosaccharides' as const,
        fodmapType: 'fructans' as const,
        servingSize: '1 clove',
      });

      await repository.create({
        name: 'Milk',
        fodmapGroup: 'disaccharides' as const,
        fodmapType: 'lactose' as const,
        servingSize: '1 cup',
      });

      const found = await repository.findByFodmapGroup('oligosaccharides');

      expect(found).toHaveLength(2);
      expect(found[0].fodmapGroup).toBe('oligosaccharides');
      expect(found[1].fodmapGroup).toBe('oligosaccharides');
    });

    it('should return empty array when no food items in group', async () => {
      const found = await repository.findByFodmapGroup('polyols');

      expect(found).toEqual([]);
    });

    it('should return food items ordered by name', async () => {
      await repository.create({
        name: 'Wheat Bread',
        fodmapGroup: 'oligosaccharides' as const,
        fodmapType: 'fructans' as const,
        servingSize: '1 slice',
      });

      await repository.create({
        name: 'Garlic',
        fodmapGroup: 'oligosaccharides' as const,
        fodmapType: 'fructans' as const,
        servingSize: '1 clove',
      });

      await repository.create({
        name: 'Onion',
        fodmapGroup: 'oligosaccharides' as const,
        fodmapType: 'fructans' as const,
        servingSize: '1/4 onion',
      });

      const found = await repository.findByFodmapGroup('oligosaccharides');

      expect(found[0].name).toBe('Garlic');
      expect(found[1].name).toBe('Onion');
      expect(found[2].name).toBe('Wheat Bread');
    });
  });

  describe('findAll', () => {
    it('should find all food items', async () => {
      await repository.create({
        name: 'Wheat Bread',
        fodmapGroup: 'oligosaccharides' as const,
        fodmapType: 'fructans' as const,
        servingSize: '1 slice',
      });

      await repository.create({
        name: 'Milk',
        fodmapGroup: 'disaccharides' as const,
        fodmapType: 'lactose' as const,
        servingSize: '1 cup',
      });

      await repository.create({
        name: 'Honey',
        fodmapGroup: 'monosaccharides' as const,
        fodmapType: 'fructose' as const,
        servingSize: '1 tbsp',
      });

      const found = await repository.findAll();

      expect(found).toHaveLength(3);
    });

    it('should return empty array when no food items exist', async () => {
      const found = await repository.findAll();

      expect(found).toEqual([]);
    });

    it('should return food items ordered by name', async () => {
      await repository.create({
        name: 'Wheat Bread',
        fodmapGroup: 'oligosaccharides' as const,
        fodmapType: 'fructans' as const,
        servingSize: '1 slice',
      });

      await repository.create({
        name: 'Avocado',
        fodmapGroup: 'polyols' as const,
        fodmapType: 'sorbitol' as const,
        servingSize: '1/4 fruit',
      });

      await repository.create({
        name: 'Milk',
        fodmapGroup: 'disaccharides' as const,
        fodmapType: 'lactose' as const,
        servingSize: '1 cup',
      });

      const found = await repository.findAll();

      expect(found[0].name).toBe('Avocado');
      expect(found[1].name).toBe('Milk');
      expect(found[2].name).toBe('Wheat Bread');
    });
  });

  describe('update', () => {
    it('should update food item name', async () => {
      const foodData = {
        name: 'Wheat Bread',
        fodmapGroup: 'oligosaccharides' as const,
        fodmapType: 'fructans' as const,
        servingSize: '1 slice',
      };

      const created = await repository.create(foodData);
      const updated = await repository.update(created.id, { name: 'Whole Wheat Bread' });

      expect(updated.name).toBe('Whole Wheat Bread');
      expect(updated.fodmapGroup).toBe(foodData.fodmapGroup);
      expect(updated.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
    });

    it('should update food item serving size', async () => {
      const foodData = {
        name: 'Wheat Bread',
        fodmapGroup: 'oligosaccharides' as const,
        fodmapType: 'fructans' as const,
        servingSize: '1 slice',
      };

      const created = await repository.create(foodData);
      const updated = await repository.update(created.id, { servingSize: '2 slices' });

      expect(updated.servingSize).toBe('2 slices');
    });

    it('should update food item description', async () => {
      const foodData = {
        name: 'Wheat Bread',
        fodmapGroup: 'oligosaccharides' as const,
        fodmapType: 'fructans' as const,
        servingSize: '1 slice',
      };

      const created = await repository.create(foodData);
      const updated = await repository.update(created.id, {
        description: 'Updated description',
      });

      expect(updated.description).toBe('Updated description');
    });

    it('should update food item FODMAP group and type together', async () => {
      const foodData = {
        name: 'Test Food',
        fodmapGroup: 'oligosaccharides' as const,
        fodmapType: 'fructans' as const,
        servingSize: '1 serving',
      };

      const created = await repository.create(foodData);
      const updated = await repository.update(created.id, {
        fodmapGroup: 'disaccharides',
        fodmapType: 'lactose',
      });

      expect(updated.fodmapGroup).toBe('disaccharides');
      expect(updated.fodmapType).toBe('lactose');
    });

    it('should throw error when updating non-existent food item', async () => {
      await expect(repository.update('non-existent-id', { name: 'Updated Name' })).rejects.toThrow(
        'FoodItem with id non-existent-id not found'
      );
    });

    it('should throw error when updating with empty name', async () => {
      const foodData = {
        name: 'Wheat Bread',
        fodmapGroup: 'oligosaccharides' as const,
        fodmapType: 'fructans' as const,
        servingSize: '1 slice',
      };

      const created = await repository.create(foodData);

      await expect(repository.update(created.id, { name: '' })).rejects.toThrow(
        'Name cannot be empty'
      );
    });

    it('should throw error when updating with empty serving size', async () => {
      const foodData = {
        name: 'Wheat Bread',
        fodmapGroup: 'oligosaccharides' as const,
        fodmapType: 'fructans' as const,
        servingSize: '1 slice',
      };

      const created = await repository.create(foodData);

      await expect(repository.update(created.id, { servingSize: '' })).rejects.toThrow(
        'Serving size cannot be empty'
      );
    });

    it('should throw error when updating with invalid FODMAP group', async () => {
      const foodData = {
        name: 'Wheat Bread',
        fodmapGroup: 'oligosaccharides' as const,
        fodmapType: 'fructans' as const,
        servingSize: '1 slice',
      };

      const created = await repository.create(foodData);

      await expect(
        repository.update(created.id, { fodmapGroup: 'invalid' as any })
      ).rejects.toThrow('Invalid FODMAP group');
    });

    it('should throw error when updating with invalid FODMAP type', async () => {
      const foodData = {
        name: 'Wheat Bread',
        fodmapGroup: 'oligosaccharides' as const,
        fodmapType: 'fructans' as const,
        servingSize: '1 slice',
      };

      const created = await repository.create(foodData);

      await expect(repository.update(created.id, { fodmapType: 'invalid' as any })).rejects.toThrow(
        'Invalid FODMAP type'
      );
    });

    it('should throw error when updating FODMAP type that does not match existing group', async () => {
      const foodData = {
        name: 'Wheat Bread',
        fodmapGroup: 'oligosaccharides' as const,
        fodmapType: 'fructans' as const,
        servingSize: '1 slice',
      };

      const created = await repository.create(foodData);

      await expect(repository.update(created.id, { fodmapType: 'lactose' as any })).rejects.toThrow(
        'Invalid FODMAP type for group oligosaccharides'
      );
    });

    it('should throw error when updating FODMAP group that does not match existing type', async () => {
      const foodData = {
        name: 'Wheat Bread',
        fodmapGroup: 'oligosaccharides' as const,
        fodmapType: 'fructans' as const,
        servingSize: '1 slice',
      };

      const created = await repository.create(foodData);

      await expect(
        repository.update(created.id, { fodmapGroup: 'disaccharides' as any })
      ).rejects.toThrow('Invalid FODMAP type for group disaccharides');
    });
  });

  describe('delete', () => {
    it('should delete food item by id', async () => {
      const foodData = {
        name: 'Wheat Bread',
        fodmapGroup: 'oligosaccharides' as const,
        fodmapType: 'fructans' as const,
        servingSize: '1 slice',
      };

      const created = await repository.create(foodData);
      await repository.delete(created.id);

      const found = await repository.findById(created.id);
      expect(found).toBeNull();
    });

    it('should throw error when deleting non-existent food item', async () => {
      await expect(repository.delete('non-existent-id')).rejects.toThrow(
        'FoodItem with id non-existent-id not found'
      );
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully in create', async () => {
      // Close the database to simulate an error
      sqlite.close();

      const foodData = {
        name: 'Wheat Bread',
        fodmapGroup: 'oligosaccharides' as const,
        fodmapType: 'fructans' as const,
        servingSize: '1 slice',
      };

      await expect(repository.create(foodData)).rejects.toThrow('Database operation failed');
    });
  });
});
