import { calculateWashout, checkWashoutStatus } from '../washout';
import { WashoutPeriod } from '../types';

describe('Washout Calculations', () => {
  describe('calculateWashout', () => {
    it('should return 3-day period for "none" severity', () => {
      const startDate = new Date('2024-01-01T08:00:00Z');
      const result = calculateWashout('none', startDate);

      expect(result.durationDays).toBe(3);
      expect(result.startDate).toBe('2024-01-01T08:00:00.000Z');
      expect(result.endDate).toBe('2024-01-04T08:00:00.000Z');
      expect(result.reason).toBe('none symptoms require 3-day washout');
    });

    it('should return 3-day period for "mild" severity', () => {
      const startDate = new Date('2024-01-01T08:00:00Z');
      const result = calculateWashout('mild', startDate);

      expect(result.durationDays).toBe(3);
      expect(result.startDate).toBe('2024-01-01T08:00:00.000Z');
      expect(result.endDate).toBe('2024-01-04T08:00:00.000Z');
      expect(result.reason).toBe('mild symptoms require 3-day washout');
    });

    it('should return 7-day period for "moderate" severity', () => {
      const startDate = new Date('2024-01-01T08:00:00Z');
      const result = calculateWashout('moderate', startDate);

      expect(result.durationDays).toBe(7);
      expect(result.startDate).toBe('2024-01-01T08:00:00.000Z');
      expect(result.endDate).toBe('2024-01-08T08:00:00.000Z');
      expect(result.reason).toBe('moderate symptoms require 7-day washout');
    });

    it('should return 7-day period for "severe" severity', () => {
      const startDate = new Date('2024-01-01T08:00:00Z');
      const result = calculateWashout('severe', startDate);

      expect(result.durationDays).toBe(7);
      expect(result.startDate).toBe('2024-01-01T08:00:00.000Z');
      expect(result.endDate).toBe('2024-01-08T08:00:00.000Z');
      expect(result.reason).toBe('severe symptoms require 7-day washout');
    });

    it('should calculate date arithmetic correctly for 3-day washout', () => {
      const startDate = new Date('2024-01-15T10:30:00Z');
      const result = calculateWashout('mild', startDate);

      const expectedEndDate = new Date('2024-01-18T10:30:00Z');
      expect(result.endDate).toBe(expectedEndDate.toISOString());
    });

    it('should calculate date arithmetic correctly for 7-day washout', () => {
      const startDate = new Date('2024-01-15T10:30:00Z');
      const result = calculateWashout('severe', startDate);

      const expectedEndDate = new Date('2024-01-22T10:30:00Z');
      expect(result.endDate).toBe(expectedEndDate.toISOString());
    });

    it('should handle month boundary correctly', () => {
      const startDate = new Date('2024-01-29T08:00:00Z');
      const result = calculateWashout('moderate', startDate);

      expect(result.endDate).toBe('2024-02-05T08:00:00.000Z');
    });

    it('should handle year boundary correctly', () => {
      const startDate = new Date('2023-12-29T08:00:00Z');
      const result = calculateWashout('moderate', startDate);

      expect(result.endDate).toBe('2024-01-05T08:00:00.000Z');
    });
  });

  describe('checkWashoutStatus', () => {
    it('should return complete=false when days remaining', () => {
      const washout: WashoutPeriod = {
        startDate: '2024-01-01T08:00:00Z',
        endDate: '2024-01-04T08:00:00Z',
        durationDays: 3,
        reason: 'mild symptoms require 3-day washout',
      };
      const now = new Date('2024-01-02T08:00:00Z');

      const result = checkWashoutStatus(washout, now);

      expect(result.complete).toBe(false);
      expect(result.daysRemaining).toBe(2);
    });

    it('should return complete=true when end date passed', () => {
      const washout: WashoutPeriod = {
        startDate: '2024-01-01T08:00:00Z',
        endDate: '2024-01-04T08:00:00Z',
        durationDays: 3,
        reason: 'mild symptoms require 3-day washout',
      };
      const now = new Date('2024-01-05T08:00:00Z');

      const result = checkWashoutStatus(washout, now);

      expect(result.complete).toBe(true);
      expect(result.daysRemaining).toBe(0);
    });

    it('should return complete=true when exactly at end date', () => {
      const washout: WashoutPeriod = {
        startDate: '2024-01-01T08:00:00Z',
        endDate: '2024-01-04T08:00:00Z',
        durationDays: 3,
        reason: 'mild symptoms require 3-day washout',
      };
      const now = new Date('2024-01-04T08:00:00Z');

      const result = checkWashoutStatus(washout, now);

      expect(result.complete).toBe(true);
      expect(result.daysRemaining).toBe(0);
    });

    it('should calculate daysRemaining correctly for 7-day washout', () => {
      const washout: WashoutPeriod = {
        startDate: '2024-01-01T08:00:00Z',
        endDate: '2024-01-08T08:00:00Z',
        durationDays: 7,
        reason: 'severe symptoms require 7-day washout',
      };
      const now = new Date('2024-01-03T08:00:00Z');

      const result = checkWashoutStatus(washout, now);

      expect(result.complete).toBe(false);
      expect(result.daysRemaining).toBe(5);
    });

    it('should calculate daysRemaining correctly with partial days', () => {
      const washout: WashoutPeriod = {
        startDate: '2024-01-01T08:00:00Z',
        endDate: '2024-01-04T08:00:00Z',
        durationDays: 3,
        reason: 'mild symptoms require 3-day washout',
      };
      const now = new Date('2024-01-02T20:00:00Z');

      const result = checkWashoutStatus(washout, now);

      expect(result.complete).toBe(false);
      expect(result.daysRemaining).toBe(2); // Math.ceil rounds up partial days
    });

    it('should handle washout on first day', () => {
      const washout: WashoutPeriod = {
        startDate: '2024-01-01T08:00:00Z',
        endDate: '2024-01-04T08:00:00Z',
        durationDays: 3,
        reason: 'mild symptoms require 3-day washout',
      };
      const now = new Date('2024-01-01T08:00:00Z');

      const result = checkWashoutStatus(washout, now);

      expect(result.complete).toBe(false);
      expect(result.daysRemaining).toBe(3);
    });

    it('should never return negative daysRemaining', () => {
      const washout: WashoutPeriod = {
        startDate: '2024-01-01T08:00:00Z',
        endDate: '2024-01-04T08:00:00Z',
        durationDays: 3,
        reason: 'mild symptoms require 3-day washout',
      };
      const now = new Date('2024-01-10T08:00:00Z');

      const result = checkWashoutStatus(washout, now);

      expect(result.complete).toBe(true);
      expect(result.daysRemaining).toBe(0);
    });
  });
});
