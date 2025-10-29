/**
 * Adherence Analyzer
 *
 * Analyzes user behavior to optimize notification frequency and reduce spam
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { tablesDB, DATABASE_ID, TABLES, Query } from '../../infrastructure/api/appwrite';
import type { NotificationFrequency } from './types';
import type { SymptomEntry, TestStep } from '../../shared/types/entities';

const ADHERENCE_CACHE_KEY = '@notifications:adherence_cache';
const CACHE_DURATION_MS = 1000 * 60 * 60; // 1 hour

/**
 * Adherence Score Interface
 */
export interface AdherenceScore {
  dailyLogStreak: number;
  doseTimingAccuracy: number; // 0-100
  missedReminders: number;
  totalReminders: number;
  overallScore: number; // 0-100
  period: { start: Date; end: Date };
}

/**
 * Adherence Pattern Interface
 */
export interface AdherencePattern {
  type: 'consistent' | 'improving' | 'declining' | 'irregular';
  confidence: number; // 0-1
  description: string;
  recommendation: string;
}

/**
 * Cached Adherence Data
 */
interface CachedAdherence {
  score: AdherenceScore;
  timestamp: number;
  userId: string;
}

/**
 * AdherenceAnalyzer - Analyzes user behavior for adaptive notifications
 */
export class AdherenceAnalyzer {
  private static instance: AdherenceAnalyzer;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): AdherenceAnalyzer {
    if (!AdherenceAnalyzer.instance) {
      AdherenceAnalyzer.instance = new AdherenceAnalyzer();
    }
    return AdherenceAnalyzer.instance;
  }

  // ============================================================================
  // ADHERENCE CALCULATION (Subtask 7.1)
  // ============================================================================

  /**
   * Calculate adherence score using 14-day window
   * Requirements: 6.1, 6.2, 6.4
   */
  async calculateAdherenceScore(userId: string, days: number = 14): Promise<AdherenceScore> {
    try {
      // Check cache first
      const cached = await this.getCachedAdherence(userId);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
        return cached.score;
      }

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const period = { start: startDate, end: endDate };

      // Calculate daily log streak
      const dailyLogStreak = await this.calculateDailyLogStreak(userId, startDate, endDate);

      // Calculate dose timing accuracy
      const doseTimingAccuracy = await this.calculateDoseTimingAccuracy(userId, startDate, endDate);

      // Calculate missed vs total reminders
      const { missedReminders, totalReminders } = await this.calculateMissedReminders(
        userId,
        startDate,
        endDate
      );

      // Calculate overall score (weighted average)
      // Daily log streak: 40%, Dose timing: 40%, Reminder response: 20%
      const streakScore = Math.min((dailyLogStreak / days) * 100, 100);
      const reminderScore =
        totalReminders > 0 ? ((totalReminders - missedReminders) / totalReminders) * 100 : 100;

      const overallScore = streakScore * 0.4 + doseTimingAccuracy * 0.4 + reminderScore * 0.2;

      const score: AdherenceScore = {
        dailyLogStreak,
        doseTimingAccuracy,
        missedReminders,
        totalReminders,
        overallScore: Math.round(overallScore),
        period,
      };

      // Cache the result
      await this.cacheAdherence(userId, score);

      return score;
    } catch (error) {
      console.error('Error calculating adherence score:', error);

      // Return default score on error
      return {
        dailyLogStreak: 0,
        doseTimingAccuracy: 0,
        missedReminders: 0,
        totalReminders: 0,
        overallScore: 0,
        period: {
          start: new Date(),
          end: new Date(),
        },
      };
    }
  }

  /**
   * Calculate daily log streak from symptom entries
   * Requirements: 6.1
   */
  private async calculateDailyLogStreak(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    try {
      // Get all symptom entries for the user in the date range
      const { rows: symptomEntries } = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.SYMPTOM_ENTRIES,
        queries: [
          Query.greaterThanEqual('timestamp', startDate.toISOString()),
          Query.lessThanEqual('timestamp', endDate.toISOString()),
          Query.orderDesc('timestamp'),
        ],
      });

      if (symptomEntries.length === 0) {
        return 0;
      }

      // Group entries by date
      const entriesByDate = new Map<string, boolean>();
      for (const entry of symptomEntries) {
        const date = new Date(entry.timestamp).toISOString().split('T')[0];
        entriesByDate.set(date, true);
      }

      // Calculate streak from most recent day backwards
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < 14; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateKey = checkDate.toISOString().split('T')[0];

        if (entriesByDate.has(dateKey)) {
          streak++;
        } else {
          // Streak is broken
          break;
        }
      }

      return streak;
    } catch (error) {
      console.error('Error calculating daily log streak:', error);
      return 0;
    }
  }

  /**
   * Calculate dose timing accuracy from test steps
   * Requirements: 6.2
   */
  private async calculateDoseTimingAccuracy(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    try {
      // Get all completed test steps for the user in the date range
      const { rows: testSteps } = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.TEST_STEPS,
        queries: [
          Query.equal('status', ['completed']),
          Query.greaterThanEqual('scheduledDate', startDate.toISOString()),
          Query.lessThanEqual('scheduledDate', endDate.toISOString()),
        ],
      });

      if (testSteps.length === 0) {
        return 100; // No doses to track = perfect score
      }

      // Calculate timing accuracy for each dose
      let totalAccuracy = 0;
      let validDoses = 0;

      for (const step of testSteps) {
        if (!step.completedDate) continue;

        const scheduledTime = new Date(step.scheduledDate).getTime();
        const completedTime = new Date(step.completedDate).getTime();
        const differenceMinutes = Math.abs(completedTime - scheduledTime) / (1000 * 60);

        // Calculate accuracy score (100% if within 30 min, decreasing linearly to 0% at 2 hours)
        let accuracy = 100;
        if (differenceMinutes > 30) {
          accuracy = Math.max(0, 100 - ((differenceMinutes - 30) / 90) * 100);
        }

        totalAccuracy += accuracy;
        validDoses++;
      }

      return validDoses > 0 ? Math.round(totalAccuracy / validDoses) : 100;
    } catch (error) {
      console.error('Error calculating dose timing accuracy:', error);
      return 0;
    }
  }

  /**
   * Calculate missed vs total reminders ratio
   * Requirements: 6.4
   */
  private async calculateMissedReminders(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ missedReminders: number; totalReminders: number }> {
    try {
      // Get notification delivery and action records from AsyncStorage
      const deliveriesJson = await AsyncStorage.getItem('@notifications:deliveries');
      const actionsJson = await AsyncStorage.getItem('@notifications:actions');

      const deliveries = deliveriesJson ? JSON.parse(deliveriesJson) : [];
      const actions = actionsJson ? JSON.parse(actionsJson) : [];

      // Filter by date range
      const filteredDeliveries = deliveries.filter((d: any) => {
        const deliveredAt = new Date(d.deliveredAt);
        return deliveredAt >= startDate && deliveredAt <= endDate;
      });

      // Count reminders that were delivered but not acted upon
      const actionedNotificationIds = new Set(actions.map((a: any) => a.notificationId));
      const missedReminders = filteredDeliveries.filter(
        (d: any) => !actionedNotificationIds.has(d.notificationId)
      ).length;

      return {
        missedReminders,
        totalReminders: filteredDeliveries.length,
      };
    } catch (error) {
      console.error('Error calculating missed reminders:', error);
      return { missedReminders: 0, totalReminders: 0 };
    }
  }

  /**
   * Cache adherence score
   */
  private async cacheAdherence(userId: string, score: AdherenceScore): Promise<void> {
    try {
      const cached: CachedAdherence = {
        score,
        timestamp: Date.now(),
        userId,
      };
      await AsyncStorage.setItem(ADHERENCE_CACHE_KEY, JSON.stringify(cached));
    } catch (error) {
      console.error('Error caching adherence:', error);
    }
  }

  /**
   * Get cached adherence score
   */
  private async getCachedAdherence(userId: string): Promise<CachedAdherence | null> {
    try {
      const cachedJson = await AsyncStorage.getItem(ADHERENCE_CACHE_KEY);
      if (!cachedJson) return null;

      const cached: CachedAdherence = JSON.parse(cachedJson);

      // Verify it's for the same user
      if (cached.userId !== userId) return null;

      // Convert date strings back to Date objects
      cached.score.period.start = new Date(cached.score.period.start);
      cached.score.period.end = new Date(cached.score.period.end);

      return cached;
    } catch (error) {
      console.error('Error getting cached adherence:', error);
      return null;
    }
  }

  /**
   * Clear adherence cache
   */
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ADHERENCE_CACHE_KEY);
    } catch (error) {
      console.error('Error clearing adherence cache:', error);
    }
  }

  // ============================================================================
  // PATTERN DETECTION (Subtask 7.2)
  // ============================================================================

  /**
   * Detect adherence patterns to identify user behavior
   * Requirements: 6.1, 6.2, 6.3
   */
  async detectPatterns(userId: string): Promise<AdherencePattern[]> {
    try {
      const patterns: AdherencePattern[] = [];

      // Get adherence scores for the last 14 days and previous 14 days
      const currentScore = await this.calculateAdherenceScore(userId, 14);

      // Calculate previous period score (days 15-28)
      const previousEndDate = new Date();
      previousEndDate.setDate(previousEndDate.getDate() - 14);
      const previousStartDate = new Date(previousEndDate);
      previousStartDate.setDate(previousStartDate.getDate() - 14);

      const previousScore = await this.calculateAdherenceScoreForPeriod(
        userId,
        previousStartDate,
        previousEndDate
      );

      // Detect pattern based on score comparison
      const scoreDifference = currentScore.overallScore - previousScore.overallScore;

      // Consistent pattern: High score (>70) with minimal change (<10 points)
      if (currentScore.overallScore >= 70 && Math.abs(scoreDifference) < 10) {
        patterns.push({
          type: 'consistent',
          confidence: this.calculateConfidence(currentScore, previousScore),
          description: 'You are consistently engaged with your protocol.',
          recommendation: 'Great job! Consider reducing notification frequency to avoid spam.',
        });
      }

      // Improving pattern: Score increased by >15 points
      if (scoreDifference > 15) {
        patterns.push({
          type: 'improving',
          confidence: this.calculateConfidence(currentScore, previousScore),
          description: 'Your adherence is improving over time.',
          recommendation:
            'Keep up the good work! Notifications will adapt as you continue to improve.',
        });
      }

      // Declining pattern: Score decreased by >15 points
      if (scoreDifference < -15) {
        patterns.push({
          type: 'declining',
          confidence: this.calculateConfidence(currentScore, previousScore),
          description: 'Your adherence has declined recently.',
          recommendation: 'Consider increasing reminder frequency to help you stay on track.',
        });
      }

      // Irregular pattern: Low score (<50) with high variability
      if (currentScore.overallScore < 50 && Math.abs(scoreDifference) > 20) {
        patterns.push({
          type: 'irregular',
          confidence: this.calculateConfidence(currentScore, previousScore),
          description: 'Your engagement with the protocol is inconsistent.',
          recommendation: 'Try setting a regular routine and enabling more frequent reminders.',
        });
      }

      // If no specific pattern detected, return a default pattern
      if (patterns.length === 0) {
        if (currentScore.overallScore >= 50) {
          patterns.push({
            type: 'consistent',
            confidence: 0.5,
            description: 'You are maintaining moderate engagement with your protocol.',
            recommendation: 'Continue with your current notification settings.',
          });
        } else {
          patterns.push({
            type: 'irregular',
            confidence: 0.5,
            description: 'Your engagement could be improved.',
            recommendation: 'Consider enabling more reminders to help you stay on track.',
          });
        }
      }

      return patterns;
    } catch (error) {
      console.error('Error detecting patterns:', error);
      return [
        {
          type: 'irregular',
          confidence: 0,
          description: 'Unable to analyze adherence patterns.',
          recommendation: 'Continue with your current notification settings.',
        },
      ];
    }
  }

  /**
   * Calculate adherence score for a specific period
   */
  private async calculateAdherenceScoreForPeriod(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AdherenceScore> {
    try {
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const period = { start: startDate, end: endDate };

      // Calculate metrics for the specific period
      const dailyLogStreak = await this.calculateDailyLogStreak(userId, startDate, endDate);
      const doseTimingAccuracy = await this.calculateDoseTimingAccuracy(userId, startDate, endDate);
      const { missedReminders, totalReminders } = await this.calculateMissedReminders(
        userId,
        startDate,
        endDate
      );

      // Calculate overall score
      const streakScore = Math.min((dailyLogStreak / days) * 100, 100);
      const reminderScore =
        totalReminders > 0 ? ((totalReminders - missedReminders) / totalReminders) * 100 : 100;

      const overallScore = streakScore * 0.4 + doseTimingAccuracy * 0.4 + reminderScore * 0.2;

      return {
        dailyLogStreak,
        doseTimingAccuracy,
        missedReminders,
        totalReminders,
        overallScore: Math.round(overallScore),
        period,
      };
    } catch (error) {
      console.error('Error calculating adherence score for period:', error);
      return {
        dailyLogStreak: 0,
        doseTimingAccuracy: 0,
        missedReminders: 0,
        totalReminders: 0,
        overallScore: 0,
        period: { start: startDate, end: endDate },
      };
    }
  }

  /**
   * Calculate confidence score for pattern detection
   * Based on data completeness and consistency
   */
  private calculateConfidence(currentScore: AdherenceScore, previousScore: AdherenceScore): number {
    // Confidence is based on:
    // 1. Amount of data available (more reminders = higher confidence)
    // 2. Consistency of the pattern

    const totalData = currentScore.totalReminders + previousScore.totalReminders;

    // Base confidence on data availability
    let confidence = Math.min(totalData / 20, 1); // Max confidence at 20+ reminders

    // Adjust for consistency
    const scoreDifference = Math.abs(currentScore.overallScore - previousScore.overallScore);
    if (scoreDifference < 5) {
      confidence *= 1.2; // Boost confidence for very consistent patterns
    } else if (scoreDifference > 30) {
      confidence *= 0.8; // Reduce confidence for highly variable patterns
    }

    return Math.min(Math.max(confidence, 0), 1);
  }

  // ============================================================================
  // FREQUENCY ADJUSTMENT (Subtask 7.3)
  // ============================================================================

  /**
   * Recommend notification frequency based on adherence score
   * Requirements: 6.1, 6.2, 6.3
   */
  recommendNotificationFrequency(score: AdherenceScore): NotificationFrequency {
    // High adherence (>70): Reduce to minimal reminders
    if (score.overallScore >= 70 && score.dailyLogStreak >= 7) {
      return 'minimal';
    }

    // Good adherence (50-70): Reduce to moderate reminders
    if (score.overallScore >= 50) {
      return 'reduced';
    }

    // Low adherence (<50): Keep full reminders
    return 'full';
  }

  /**
   * Check if reminders should be reduced for engaged users
   * Requirements: 6.1, 6.2
   */
  async shouldReduceReminders(userId: string): Promise<boolean> {
    try {
      const score = await this.calculateAdherenceScore(userId, 14);

      // Reduce reminders if:
      // 1. Overall score is high (>70)
      // 2. Daily log streak is at least 7 days
      // 3. Dose timing accuracy is good (>80)
      return (
        score.overallScore >= 70 && score.dailyLogStreak >= 7 && score.doseTimingAccuracy >= 80
      );
    } catch (error) {
      console.error('Error checking if should reduce reminders:', error);
      return false;
    }
  }

  /**
   * Check if reminders should be increased for disengaged users
   * Requirements: 6.1, 6.2
   */
  async shouldIncreaseReminders(userId: string): Promise<boolean> {
    try {
      const score = await this.calculateAdherenceScore(userId, 14);

      // Increase reminders if:
      // 1. Overall score is low (<50)
      // 2. Daily log streak is broken (0-2 days)
      // 3. Multiple missed reminders
      const missedRatio =
        score.totalReminders > 0 ? score.missedReminders / score.totalReminders : 0;

      return score.overallScore < 50 || score.dailyLogStreak <= 2 || missedRatio > 0.5;
    } catch (error) {
      console.error('Error checking if should increase reminders:', error);
      return false;
    }
  }

  /**
   * Adjust notification frequency based on adherence
   * Requirements: 6.1, 6.2, 6.3, 6.5
   */
  async adjustNotificationFrequency(
    userId: string,
    currentFrequency: NotificationFrequency
  ): Promise<NotificationFrequency> {
    try {
      const score = await this.calculateAdherenceScore(userId, 14);
      const recommendedFrequency = this.recommendNotificationFrequency(score);

      // Don't change frequency too aggressively
      // Only move one step at a time (full -> reduced -> minimal or vice versa)
      if (currentFrequency === 'full' && recommendedFrequency === 'minimal') {
        return 'reduced'; // Step down gradually
      }

      if (currentFrequency === 'minimal' && recommendedFrequency === 'full') {
        return 'reduced'; // Step up gradually
      }

      return recommendedFrequency;
    } catch (error) {
      console.error('Error adjusting notification frequency:', error);
      return currentFrequency; // Keep current frequency on error
    }
  }

  /**
   * Get frequency adjustment recommendation with explanation
   * Requirements: 6.3
   */
  async getFrequencyRecommendation(
    userId: string,
    currentFrequency: NotificationFrequency
  ): Promise<{
    recommendedFrequency: NotificationFrequency;
    reason: string;
    shouldChange: boolean;
  }> {
    try {
      const score = await this.calculateAdherenceScore(userId, 14);
      const recommendedFrequency = this.recommendNotificationFrequency(score);
      const shouldChange = recommendedFrequency !== currentFrequency;

      let reason = '';

      if (recommendedFrequency === 'minimal') {
        reason =
          'Your excellent adherence suggests you can manage with fewer reminders. This will reduce notification spam.';
      } else if (recommendedFrequency === 'reduced') {
        reason =
          'Your good adherence allows for moderate reminders. This balances support with avoiding spam.';
      } else {
        reason =
          'Full reminders will help you stay on track with your protocol and improve adherence.';
      }

      return {
        recommendedFrequency,
        reason,
        shouldChange,
      };
    } catch (error) {
      console.error('Error getting frequency recommendation:', error);
      return {
        recommendedFrequency: currentFrequency,
        reason: 'Unable to analyze adherence. Keeping current settings.',
        shouldChange: false,
      };
    }
  }
}
