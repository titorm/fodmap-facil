import { analyzeSymptoms, shouldStopTest } from '../symptoms';
import { SymptomRecord } from '../types';

describe('Symptom Analysis', () => {
  describe('analyzeSymptoms', () => {
    it('should return "none" for empty symptom array', () => {
      const symptoms: SymptomRecord[] = [];
      const result = analyzeSymptoms(symptoms);
      expect(result).toBe('none');
    });

    it('should return "mild" for single mild symptom', () => {
      const symptoms: SymptomRecord[] = [
        {
          timestamp: '2024-01-01T12:00:00Z',
          severity: 'mild',
          type: 'bloating',
        },
      ];
      const result = analyzeSymptoms(symptoms);
      expect(result).toBe('mild');
    });

    it('should return highest severity when multiple symptoms present', () => {
      const symptoms: SymptomRecord[] = [
        {
          timestamp: '2024-01-01T12:00:00Z',
          severity: 'mild',
          type: 'bloating',
        },
        {
          timestamp: '2024-01-01T14:00:00Z',
          severity: 'moderate',
          type: 'pain',
        },
        {
          timestamp: '2024-01-01T16:00:00Z',
          severity: 'mild',
          type: 'gas',
        },
      ];
      const result = analyzeSymptoms(symptoms);
      expect(result).toBe('moderate');
    });

    it('should always return "severe" when severe symptom is present', () => {
      const symptoms: SymptomRecord[] = [
        {
          timestamp: '2024-01-01T12:00:00Z',
          severity: 'mild',
          type: 'bloating',
        },
        {
          timestamp: '2024-01-01T14:00:00Z',
          severity: 'severe',
          type: 'pain',
        },
        {
          timestamp: '2024-01-01T16:00:00Z',
          severity: 'moderate',
          type: 'cramping',
        },
      ];
      const result = analyzeSymptoms(symptoms);
      expect(result).toBe('severe');
    });

    it('should handle multiple severe symptoms', () => {
      const symptoms: SymptomRecord[] = [
        {
          timestamp: '2024-01-01T12:00:00Z',
          severity: 'severe',
          type: 'pain',
        },
        {
          timestamp: '2024-01-01T14:00:00Z',
          severity: 'severe',
          type: 'diarrhea',
        },
      ];
      const result = analyzeSymptoms(symptoms);
      expect(result).toBe('severe');
    });
  });

  describe('shouldStopTest', () => {
    it('should return true for severe symptoms on day 1', () => {
      const result = shouldStopTest('severe', 1);
      expect(result).toBe(true);
    });

    it('should return true for severe symptoms on day 2', () => {
      const result = shouldStopTest('severe', 2);
      expect(result).toBe(true);
    });

    it('should return true for severe symptoms on day 3', () => {
      const result = shouldStopTest('severe', 3);
      expect(result).toBe(true);
    });

    it('should return true for moderate symptoms on day 1', () => {
      const result = shouldStopTest('moderate', 1);
      expect(result).toBe(true);
    });

    it('should return false for moderate symptoms on day 2', () => {
      const result = shouldStopTest('moderate', 2);
      expect(result).toBe(false);
    });

    it('should return false for moderate symptoms on day 3', () => {
      const result = shouldStopTest('moderate', 3);
      expect(result).toBe(false);
    });

    it('should return false for mild symptoms on day 1', () => {
      const result = shouldStopTest('mild', 1);
      expect(result).toBe(false);
    });

    it('should return false for mild symptoms on day 2', () => {
      const result = shouldStopTest('mild', 2);
      expect(result).toBe(false);
    });

    it('should return false for mild symptoms on day 3', () => {
      const result = shouldStopTest('mild', 3);
      expect(result).toBe(false);
    });

    it('should return false for no symptoms on any day', () => {
      expect(shouldStopTest('none', 1)).toBe(false);
      expect(shouldStopTest('none', 2)).toBe(false);
      expect(shouldStopTest('none', 3)).toBe(false);
    });
  });
});
