import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { OnboardingStackParamList } from '../types/navigation';
import { AssessmentQuestion } from '../components/AssessmentQuestion';
import { Button } from '../../../shared/components/atoms/Button';
import { useTheme } from '../../../shared/theme';
import { useOnboarding } from '../hooks/useOnboarding';
import {
  ASSESSMENT_QUESTIONS,
  calculateAssessmentScore,
  validateAssessmentAnswers,
  AssessmentAnswer,
  AssessmentResult,
} from '../config/assessmentQuestions';

type ReadinessAssessmentScreenProps = NativeStackScreenProps<
  OnboardingStackParamList,
  'ReadinessAssessment'
>;

export function ReadinessAssessmentScreen({}: ReadinessAssessmentScreenProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius } = theme;
  const { completeAssessment, completeOnboarding } = useOnboarding();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = ASSESSMENT_QUESTIONS[currentQuestionIndex];
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === ASSESSMENT_QUESTIONS.length - 1;

  // Get current answer for the question
  const getCurrentAnswer = useCallback(() => {
    const answer = answers.find((a) => a.questionId === currentQuestion.id);
    return answer?.value;
  }, [answers, currentQuestion.id]);

  // Update answer for current question
  const handleAnswerChange = useCallback(
    (value: string | boolean | string[]) => {
      const newAnswers = answers.filter((a) => a.questionId !== currentQuestion.id);
      newAnswers.push({
        questionId: currentQuestion.id,
        value,
      });
      setAnswers(newAnswers);

      // Clear error for this question
      if (errors[currentQuestion.id]) {
        const newErrors = { ...errors };
        delete newErrors[currentQuestion.id];
        setErrors(newErrors);
      }
    },
    [answers, currentQuestion.id, errors]
  );

  // Validate current question before proceeding
  const validateCurrentQuestion = useCallback((): boolean => {
    if (!currentQuestion.required) return true;

    const answer = getCurrentAnswer();
    if (answer === undefined || answer === null || answer === '') {
      setErrors({
        ...errors,
        [currentQuestion.id]: t('assessment.validation.required'),
      });
      return false;
    }

    return true;
  }, [currentQuestion, getCurrentAnswer, errors, t]);

  // Navigate to next question
  const handleNext = useCallback(() => {
    if (!validateCurrentQuestion()) return;

    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  }, [validateCurrentQuestion, isLastQuestion, currentQuestionIndex]);

  // Navigate to previous question
  const handlePrevious = useCallback(() => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  }, [isFirstQuestion, currentQuestionIndex]);

  // Submit assessment and calculate results
  const handleSubmit = useCallback(async () => {
    // Validate all answers
    const validation = validateAssessmentAnswers(answers);
    if (!validation.isValid) {
      Alert.alert(t('common.error'), 'Please answer all required questions before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate score
      const assessmentResult = calculateAssessmentScore(answers);
      setResult(assessmentResult);

      // Save assessment completion
      await completeAssessment(assessmentResult.score);
    } catch (error) {
      console.error('Error submitting assessment:', error);
      Alert.alert(t('common.error'), 'Failed to submit assessment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, completeAssessment, t]);

  // Handle starting journey after assessment
  const handleStartJourney = useCallback(async () => {
    try {
      await completeOnboarding();
      // Navigate to main app (this will be handled by navigation logic)
      // For now, we'll just show an alert
      Alert.alert('Success', 'Onboarding completed! Welcome to your FODMAP journey.');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert(t('common.error'), 'Failed to complete onboarding. Please try again.');
    }
  }, [completeOnboarding, t]);

  // Render results screen
  if (result) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: spacing.lg, paddingVertical: spacing.xl },
          ]}
        >
          {/* Result header */}
          <View style={[styles.resultHeader, { marginBottom: spacing.xl }]}>
            <Text
              style={[
                styles.resultTitle,
                {
                  fontSize: typography.fontSize.xxxl,
                  fontWeight: typography.fontWeight.bold,
                  color: result.isReady ? colors.success : colors.warning,
                  marginBottom: spacing.md,
                  textAlign: 'center',
                },
              ]}
              accessibilityRole="header"
            >
              {t(
                result.isReady
                  ? 'assessment.results.readyTitle'
                  : 'assessment.results.notReadyTitle'
              )}
            </Text>

            <Text
              style={[
                styles.resultScore,
                {
                  fontSize: typography.fontSize.lg,
                  color: colors.textSecondary,
                  marginBottom: spacing.lg,
                  textAlign: 'center',
                },
              ]}
            >
              {t('assessment.results.yourScore', {
                score: result.score,
                maxScore: result.maxScore,
                percentage: result.percentage,
              })}
            </Text>

            <Text
              style={[
                styles.resultFeedback,
                {
                  fontSize: typography.fontSize.md,
                  lineHeight: typography.fontSize.md * typography.lineHeight.relaxed,
                  color: colors.text,
                  textAlign: 'center',
                },
              ]}
            >
              {t(result.feedback)}
            </Text>
          </View>

          {/* Recommendations (if not ready) */}
          {!result.isReady && result.recommendations && result.recommendations.length > 0 && (
            <View
              style={[
                styles.recommendationsContainer,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: borderRadius.lg,
                  padding: spacing.lg,
                  marginBottom: spacing.xl,
                },
              ]}
            >
              <Text
                style={[
                  styles.recommendationsTitle,
                  {
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.text,
                    marginBottom: spacing.md,
                  },
                ]}
                accessibilityRole="header"
              >
                {t('assessment.recommendations.title')}
              </Text>

              {result.recommendations.map((rec, index) => (
                <View key={index} style={[styles.recommendationItem, { marginBottom: spacing.sm }]}>
                  <Text
                    style={[
                      styles.recommendationBullet,
                      {
                        fontSize: typography.fontSize.md,
                        color: colors.textSecondary,
                        marginRight: spacing.sm,
                      },
                    ]}
                  >
                    •
                  </Text>
                  <Text
                    style={[
                      styles.recommendationText,
                      {
                        fontSize: typography.fontSize.md,
                        lineHeight: typography.fontSize.md * typography.lineHeight.normal,
                        color: colors.textSecondary,
                        flex: 1,
                      },
                    ]}
                  >
                    {t(rec)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Action button */}
          <Button
            title={
              result.isReady
                ? t('assessment.results.startJourney')
                : t('assessment.results.reviewRecommendations')
            }
            onPress={result.isReady ? handleStartJourney : () => setResult(null)}
            variant="primary"
            size="large"
            fullWidth
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Render assessment questions
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with progress */}
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.title,
            {
              fontSize: typography.fontSize.xxl,
              fontWeight: typography.fontWeight.bold,
              color: colors.text,
              marginBottom: spacing.xs,
            },
          ]}
          accessibilityRole="header"
        >
          {t('assessment.title')}
        </Text>

        <Text
          style={[
            styles.progress,
            {
              fontSize: typography.fontSize.sm,
              color: colors.textSecondary,
            },
          ]}
          accessibilityLiveRegion="polite"
        >
          {t('assessment.progress', {
            current: currentQuestionIndex + 1,
            total: ASSESSMENT_QUESTIONS.length,
          })}
        </Text>

        {/* Progress bar */}
        <View
          style={[
            styles.progressBarContainer,
            {
              height: 4,
              backgroundColor: colors.backgroundSecondary,
              borderRadius: borderRadius.full,
              marginTop: spacing.sm,
            },
          ]}
        >
          <View
            style={[
              styles.progressBar,
              {
                width: `${((currentQuestionIndex + 1) / ASSESSMENT_QUESTIONS.length) * 100}%`,
                height: '100%',
                backgroundColor: colors.primary500,
                borderRadius: borderRadius.full,
              },
            ]}
          />
        </View>
      </View>

      {/* Question content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: spacing.lg, paddingVertical: spacing.xl },
        ]}
      >
        <AssessmentQuestion
          question={t(currentQuestion.text)}
          type={currentQuestion.type}
          options={currentQuestion.options?.map((opt) => t(opt))}
          value={getCurrentAnswer()}
          onChange={handleAnswerChange}
          error={errors[currentQuestion.id]}
        />
      </ScrollView>

      {/* Navigation buttons */}
      <View
        style={[
          styles.footer,
          {
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.lg,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <View style={styles.buttonRow}>
          {!isFirstQuestion && (
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <Button
                title={t('assessment.previous')}
                onPress={handlePrevious}
                variant="secondary"
                size="large"
                fullWidth
              />
            </View>
          )}

          <View style={{ flex: 1 }}>
            <Button
              title={isLastQuestion ? t('assessment.submit') : t('assessment.next')}
              onPress={handleNext}
              variant="primary"
              size="large"
              loading={isSubmitting}
              fullWidth
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {},
  title: {
    fontWeight: '700',
  },
  progress: {
    fontWeight: '400',
  },
  progressBarContainer: {
    overflow: 'hidden',
  },
  progressBar: {},
  scrollView: {
    flex: 1,
  },
  scrollContent: {},
  footer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonRow: {
    flexDirection: 'row',
  },
  resultHeader: {},
  resultTitle: {
    fontWeight: '700',
  },
  resultScore: {
    fontWeight: '400',
  },
  resultFeedback: {
    fontWeight: '400',
  },
  recommendationsContainer: {},
  recommendationsTitle: {
    fontWeight: '600',
  },
  recommendationItem: {
    flexDirection: 'row',
  },
  recommendationBullet: {
    fontWeight: '400',
  },
  recommendationText: {
    fontWeight: '400',
  },
});
