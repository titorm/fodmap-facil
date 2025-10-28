import { eq } from 'drizzle-orm';
import { BaseRepository } from './BaseRepository';
import { foodItems } from '../../db/schema';
import type {
  FoodItem,
  CreateFoodItemInput,
  UpdateFoodItemInput,
  FodmapGroup,
  FodmapType,
} from '../../db/schema';

/**
 * FoodItemRepository
 *
 * Repository for managing FoodItem entities.
 * Provides CRUD operations and queries for food item data.
 *
 * Implements:
 * - create: Create a new food item
 * - findById: Find a food item by ID
 * - findByFodmapGroup: Find all food items in a specific FODMAP group
 * - findAll: Find all food items
 * - update: Update an existing food item
 * - delete: Delete a food item by ID
 */
export class FoodItemRepository extends BaseRepository<FoodItem> {
  /**
   * Create a new food item
   *
   * Generates ID and timestamps automatically.
   * Validates that required fields are present and FODMAP classifications are valid.
   *
   * @param data - The food item data to create
   * @returns Promise resolving to the created food item
   * @throws {Error} If validation fails or database operation fails
   */
  async create(
    data: Omit<CreateFoodItemInput, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<FoodItem> {
    try {
      // Validate required fields
      if (!data.name || !data.name.trim()) {
        throw new Error('Name is required');
      }

      if (!data.fodmapGroup) {
        throw new Error('FODMAP group is required');
      }

      if (!data.fodmapType) {
        throw new Error('FODMAP type is required');
      }

      if (!data.servingSize || !data.servingSize.trim()) {
        throw new Error('Serving size is required');
      }

      // Validate FODMAP group is a valid value
      const validGroups: FodmapGroup[] = [
        'oligosaccharides',
        'disaccharides',
        'monosaccharides',
        'polyols',
      ];
      if (!validGroups.includes(data.fodmapGroup as FodmapGroup)) {
        throw new Error(`Invalid FODMAP group. Must be one of: ${validGroups.join(', ')}`);
      }

      // Validate FODMAP type is a valid value
      const validTypes: FodmapType[] = [
        'fructans',
        'GOS',
        'lactose',
        'fructose',
        'sorbitol',
        'mannitol',
      ];
      if (!validTypes.includes(data.fodmapType as FodmapType)) {
        throw new Error(`Invalid FODMAP type. Must be one of: ${validTypes.join(', ')}`);
      }

      // Validate FODMAP type matches group
      const groupTypeMapping: Record<FodmapGroup, FodmapType[]> = {
        oligosaccharides: ['fructans', 'GOS'],
        disaccharides: ['lactose'],
        monosaccharides: ['fructose'],
        polyols: ['sorbitol', 'mannitol'],
      };

      const validTypesForGroup = groupTypeMapping[data.fodmapGroup as FodmapGroup];
      if (!validTypesForGroup.includes(data.fodmapType as FodmapType)) {
        throw new Error(
          `Invalid FODMAP type for group ${data.fodmapGroup}. Must be one of: ${validTypesForGroup.join(', ')}`
        );
      }

      // Create new food item with generated ID and timestamps
      const newFoodItem: CreateFoodItemInput = {
        ...data,
        id: this.generateId(),
        createdAt: this.now(),
        updatedAt: this.now(),
      };

      await this.db.insert(foodItems).values(newFoodItem);

      return newFoodItem as FoodItem;
    } catch (error) {
      this.handleError(error, 'create');
    }
  }

  /**
   * Find a food item by ID
   *
   * @param id - The food item ID to search for
   * @returns Promise resolving to the food item or null if not found
   * @throws {Error} If database operation fails
   */
  async findById(id: string): Promise<FoodItem | null> {
    try {
      const result = await this.db.select().from(foodItems).where(eq(foodItems.id, id)).limit(1);

      return result[0] || null;
    } catch (error) {
      this.handleError(error, 'findById');
    }
  }

  /**
   * Find all food items in a specific FODMAP group
   *
   * Returns food items ordered by name.
   *
   * @param group - The FODMAP group to filter by
   * @returns Promise resolving to an array of food items
   * @throws {Error} If database operation fails
   */
  async findByFodmapGroup(group: FodmapGroup): Promise<FoodItem[]> {
    try {
      const result = await this.db
        .select()
        .from(foodItems)
        .where(eq(foodItems.fodmapGroup, group))
        .orderBy(foodItems.name);

      return result;
    } catch (error) {
      this.handleError(error, 'findByFodmapGroup');
    }
  }

  /**
   * Find all food items
   *
   * Returns all food items ordered by name.
   *
   * @returns Promise resolving to an array of all food items
   * @throws {Error} If database operation fails
   */
  async findAll(): Promise<FoodItem[]> {
    try {
      const result = await this.db.select().from(foodItems).orderBy(foodItems.name);

      return result;
    } catch (error) {
      this.handleError(error, 'findAll');
    }
  }

  /**
   * Update an existing food item
   *
   * Updates the specified fields and automatically updates the updatedAt timestamp.
   * Only provided fields will be updated.
   *
   * @param id - The ID of the food item to update
   * @param data - The fields to update
   * @returns Promise resolving to the updated food item
   * @throws {Error} If food item not found or database operation fails
   */
  async update(id: string, data: UpdateFoodItemInput): Promise<FoodItem> {
    try {
      // Check if food item exists
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error(`FoodItem with id ${id} not found`);
      }

      // Validate name if being updated
      if (data.name !== undefined && (!data.name || !data.name.trim())) {
        throw new Error('Name cannot be empty');
      }

      // Validate serving size if being updated
      if (data.servingSize !== undefined && (!data.servingSize || !data.servingSize.trim())) {
        throw new Error('Serving size cannot be empty');
      }

      // Validate FODMAP group if being updated
      if (data.fodmapGroup) {
        const validGroups: FodmapGroup[] = [
          'oligosaccharides',
          'disaccharides',
          'monosaccharides',
          'polyols',
        ];
        if (!validGroups.includes(data.fodmapGroup as FodmapGroup)) {
          throw new Error(`Invalid FODMAP group. Must be one of: ${validGroups.join(', ')}`);
        }
      }

      // Validate FODMAP type if being updated
      if (data.fodmapType) {
        const validTypes: FodmapType[] = [
          'fructans',
          'GOS',
          'lactose',
          'fructose',
          'sorbitol',
          'mannitol',
        ];
        if (!validTypes.includes(data.fodmapType as FodmapType)) {
          throw new Error(`Invalid FODMAP type. Must be one of: ${validTypes.join(', ')}`);
        }
      }

      // Validate FODMAP type matches group if both are being updated or one is being updated
      const finalGroup = (data.fodmapGroup || existing.fodmapGroup) as FodmapGroup;
      const finalType = (data.fodmapType || existing.fodmapType) as FodmapType;

      const groupTypeMapping: Record<FodmapGroup, FodmapType[]> = {
        oligosaccharides: ['fructans', 'GOS'],
        disaccharides: ['lactose'],
        monosaccharides: ['fructose'],
        polyols: ['sorbitol', 'mannitol'],
      };

      const validTypesForGroup = groupTypeMapping[finalGroup];
      if (!validTypesForGroup.includes(finalType)) {
        throw new Error(
          `Invalid FODMAP type for group ${finalGroup}. Must be one of: ${validTypesForGroup.join(', ')}`
        );
      }

      // Update with new timestamp
      const updateData = {
        ...data,
        updatedAt: this.now(),
      };

      await this.db.update(foodItems).set(updateData).where(eq(foodItems.id, id));

      // Fetch and return updated food item
      const updated = await this.findById(id);
      if (!updated) {
        throw new Error('Failed to retrieve updated food item');
      }

      return updated;
    } catch (error) {
      this.handleError(error, 'update');
    }
  }

  /**
   * Delete a food item by ID
   *
   * Note: This will fail if there are related records (test steps) due to foreign key constraints.
   * Consider implementing soft delete or cascade delete based on business requirements.
   *
   * @param id - The ID of the food item to delete
   * @returns Promise that resolves when deletion is complete
   * @throws {Error} If food item not found or database operation fails
   */
  async delete(id: string): Promise<void> {
    try {
      // Check if food item exists
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error(`FoodItem with id ${id} not found`);
      }

      await this.db.delete(foodItems).where(eq(foodItems.id, id));
    } catch (error) {
      this.handleError(error, 'delete');
    }
  }
}
