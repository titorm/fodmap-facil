/**
 * NotificationService Unit Tests
 *
 * Tests for washout reminder scheduling and frequency calculation.
 */

import { NotificationService } from '../NotificationService';
import { NotificationScheduleRepository } from '../../../../services/repositories/NotificationScheduleRepository';
import type { WashoutPeriod, NotificationSchedule } from '../../../../db/schema';

// Mock NotificationScheduleRepository
class MockNotificationScheduleRepository extends NotificationScheduleRepository {
  private notifications: NotificationSchedule[] = [];

  constructor() {
    // Pass null as db since we're mocking
    super(null as any);
  }

  async create(data: any): Promise<NotificationSchedule> {
    const notification: NotificationSchedule = {
      id: `notif-${Date.now()}-${Math.random()}`,
      testStepId: data.testStepId,
      notificationType: data.notificationType,
      scheduledTime: data.scheduledTime,
      sentStatus: data.sentStatus || false,
      message: data.message,
      createdAt: new Date(),
    };
    this.notifications.push(notification);
    return notification;
  }

  async findPending(): Promise<NotificationSchedule[]> {
    return this.notifications.filter((n) => !n.sentStatus);
  }

  async delete(id: string): Promise<void> {
    this.notifications = this.notifications.filter((n) => n.id !== id);
  }

  getNotifications(): NotificationSchedule[] {
    return this.notifications;
  }

  clear(): void {
    this.notifications = [];
  }
}

// Helper to create test washout period
function createTestWashoutPeriod(
  startDate: Date,
  endDate: Date,
  overrides: Partial<WashoutPeriod> = {}
): WashoutPeriod {
  return {
    id: 'washout-test-1',
    protocolRunId: 'protocol-1',
    startDate,
    endDate,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('NotificationService', () => {
  let service: NotificationService;
  let mockRepo: MockNotificationScheduleRepository;

  beforeEach(() => {
    mockRepo = new MockNotificationScheduleRepository();
    service = new NotificationService(mockRepo);
  });

  describe('scheduleWashoutReminders', () => {
    it('should schedule reminders at regular intervals', async () => {
      const startDate = new Date('2025-01-01T00:00:00Z');
      const endDate = new Date('2025-01-03T00:00:00Z'); // 2 days = 48 hours
      const washoutPeriod = createTestWashoutPeriod(startDate, endDate);

      await service.scheduleWashoutReminders(washoutPeriod, 12, 'low');

      const notifications = mockRepo.getNotifications();
      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications.every((n) => n.testStepId === washoutPeriod.id)).toBe(true);
    });

    it('should increase frequency by 50% for high anxiety', async () => {
      const startDate = new Date('2025-01-01T00:00:00Z');
      const endDate = new Date('2025-01-02T00:00:00Z'); // 1 day = 24 hours
      const washoutPeriod = createTestWashoutPeriod(startDate, endDate);

      // With 6-hour base frequency and high anxiety (×0.67 = 4 hours)
      await service.scheduleWashoutReminders(washoutPeriod, 6, 'high');

      const notifications = mockRepo.getNotifications();
      // Should have more reminders with high anxiety
      expect(notifications.length).toBeGreaterThanOrEqual(4);
    });

    it('should throw error for invalid frequency', async () => {
      const startDate = new Date('2025-01-01T00:00:00Z');
      const endDate = new Date('2025-01-02T00:00:00Z');
      const washoutPeriod = createTestWashoutPeriod(startDate, endDate);

      await expect(service.scheduleWashoutReminders(washoutPeriod, 0, 'low')).rejects.toThrow(
        'Reminder frequency must be between 1 and 24 hours'
      );

      await expect(service.scheduleWashoutReminders(washoutPeriod, 25, 'low')).rejects.toThrow(
        'Reminder frequency must be between 1 and 24 hours'
      );
    });

    it('should not schedule reminders beyond end date', async () => {
      const startDate = new Date('2025-01-01T00:00:00Z');
      const endDate = new Date('2025-01-01T06:00:00Z'); // Only 6 hours
      const washoutPeriod = createTestWashoutPeriod(startDate, endDate);

      await service.scheduleWashoutReminders(washoutPeriod, 12, 'low');

      const notifications = mockRepo.getNotifications();
      // Should have 0 reminders since first reminder would be at 12 hours (beyond end)
      expect(notifications.length).toBe(0);
    });
  });

  describe('cancelWashoutReminders', () => {
    it('should cancel all reminders for a washout period', async () => {
      const startDate = new Date('2025-01-01T00:00:00Z');
      const endDate = new Date('2025-01-03T00:00:00Z');
      const washoutPeriod = createTestWashoutPeriod(startDate, endDate);

      await service.scheduleWashoutReminders(washoutPeriod, 12, 'low');
      expect(mockRepo.getNotifications().length).toBeGreaterThan(0);

      await service.cancelWashoutReminders(washoutPeriod.id);
      expect(mockRepo.getNotifications().length).toBe(0);
    });
  });

  describe('updateReminderFrequency', () => {
    it('should cancel existing reminders', async () => {
      const startDate = new Date('2025-01-01T00:00:00Z');
      const endDate = new Date('2025-01-03T00:00:00Z');
      const washoutPeriod = createTestWashoutPeriod(startDate, endDate);

      await service.scheduleWashoutReminders(washoutPeriod, 12, 'low');
      expect(mockRepo.getNotifications().length).toBeGreaterThan(0);

      await service.updateReminderFrequency(washoutPeriod.id, 6);
      expect(mockRepo.getNotifications().length).toBe(0);
    });

    it('should throw error for invalid frequency', async () => {
      await expect(service.updateReminderFrequency('washout-1', 0)).rejects.toThrow(
        'Reminder frequency must be between 1 and 24 hours'
      );

      await expect(service.updateReminderFrequency('washout-1', 30)).rejects.toThrow(
        'Reminder frequency must be between 1 and 24 hours'
      );
    });
  });
});
