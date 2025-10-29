import { QuestionType } from '../components/AssessmentQuestion';

export interface AssessmentQuestion {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  required: boolean;
  scoringKey?: string;
  weight?: number;
}

export interface AssessmentAnswer {
  questionId: string;
  value: string | boolean | string[];
}

export interface AssessmentResult {
  score: number;
  maxScore: number;
  percentage: number;
  isReady: boolean;
  feedback: string;
  recommendations?: string[];
}

// Assessment questions configuration
export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'q1_elimination_phase',
    text: 'assessment.questions.q1',
    type: 'boolean',
    required: true,
    scoringKey: 'elimination_complete',
    weight: 3,
  },
  {
    id: 'q2_symptom_improvement',
    text: 'assessment.questions.q2',
    type: 'single-choice',
    options: [
      'assessment.options.q2.significant',
      'assessment.options.q2.moderate',
      'assessment.options.q2.slight',
      'assessment.options.q2.none',
    ],
    required: true,
    scoringKey: 'symptom_improvement',
    weight: 2,
  },
  {
    id: 'q3_healthcare_support',
    text: 'assessment.questions.q3',
    type: 'boolean',
    required: true,
    scoringKey: 'healthcare_support',
    weight: 2,
  },
  {
    id: 'q4_commitment',
    text: 'assessment.questions.q4',
    type: 'single-choice',
    options: [
      'assessment.options.q4.very_committed',
      'assessment.options.q4.committed',
      'assessment.options.q4.somewhat',
      'assessment.options.q4.unsure',
    ],
    required: true,
    scoringKey: 'commitment',
    weight: 2,
  },
  {
    id: 'q5_understanding',
    text: 'assessment.questions.q5',
    type: 'boolean',
    required: true,
    scoringKey: 'understanding',
    weight: 1,
  },
  {
    id: 'q6_time_availability',
    text: 'assessment.questions.q6',
    type: 'boolean',
    required: true,
    scoringKey: 'time_availability',
    weight: 1,
  },
];

// Scoring configuration
const SCORING_RULES = {
  elimination_complete: {
    true: 3,
    false: 0,
  },
  symptom_improvement: {
    'assessment.options.q2.significant': 2,
    'assessment.options.q2.moderate': 1.5,
    'assessment.options.q2.slight': 1,
    'assessment.options.q2.none': 0,
  },
  healthcare_support: {
    true: 2,
    false: 0,
  },
  commitment: {
    'assessment.options.q4.very_committed': 2,
    'assessment.options.q4.committed': 1.5,
    'assessment.options.q4.somewhat': 1,
    'assessment.options.q4.unsure': 0,
  },
  understanding: {
    true: 1,
    false: 0,
  },
  time_availability: {
    true: 1,
    false: 0,
  },
};

// Calculate maximum possible score
const MAX_SCORE = ASSESSMENT_QUESTIONS.reduce((sum, q) => sum + (q.weight || 0), 0);

// Readiness threshold (70% of max score)
const READINESS_THRESHOLD = MAX_SCORE * 0.7;

/**
 * Calculate assessment score based on answers
 */
export function calculateAssessmentScore(answers: AssessmentAnswer[]): AssessmentResult {
  let totalScore = 0;

  // Calculate score for each answer
  answers.forEach((answer) => {
    const question = ASSESSMENT_QUESTIONS.find((q) => q.id === answer.questionId);
    if (!question || !question.scoringKey) return;

    const scoringRule = SCORING_RULES[question.scoringKey as keyof typeof SCORING_RULES];
    if (!scoringRule) return;

    const answerValue = String(answer.value);
    const points = scoringRule[answerValue as keyof typeof scoringRule] || 0;
    totalScore += points;
  });

  const percentage = (totalScore / MAX_SCORE) * 100;
  const isReady = totalScore >= READINESS_THRESHOLD;

  return {
    score: totalScore,
    maxScore: MAX_SCORE,
    percentage: Math.round(percentage),
    isReady,
    feedback: isReady ? 'assessment.results.ready' : 'assessment.results.notReady',
    recommendations: isReady ? undefined : getRecommendations(answers),
  };
}

/**
 * Generate personalized recommendations based on answers
 */
function getRecommendations(answers: AssessmentAnswer[]): string[] {
  const recommendations: string[] = [];

  // Check elimination phase completion
  const eliminationAnswer = answers.find((a) => a.questionId === 'q1_elimination_phase');
  if (eliminationAnswer?.value === false) {
    recommendations.push('assessment.recommendations.completeElimination');
  }

  // Check symptom improvement
  const symptomAnswer = answers.find((a) => a.questionId === 'q2_symptom_improvement');
  if (
    symptomAnswer?.value === 'assessment.options.q2.none' ||
    symptomAnswer?.value === 'assessment.options.q2.slight'
  ) {
    recommendations.push('assessment.recommendations.improveSymptoms');
  }

  // Check healthcare support
  const healthcareAnswer = answers.find((a) => a.questionId === 'q3_healthcare_support');
  if (healthcareAnswer?.value === false) {
    recommendations.push('assessment.recommendations.seekHealthcare');
  }

  // Check commitment level
  const commitmentAnswer = answers.find((a) => a.questionId === 'q4_commitment');
  if (
    commitmentAnswer?.value === 'assessment.options.q4.unsure' ||
    commitmentAnswer?.value === 'assessment.options.q4.somewhat'
  ) {
    recommendations.push('assessment.recommendations.buildCommitment');
  }

  // Check understanding
  const understandingAnswer = answers.find((a) => a.questionId === 'q5_understanding');
  if (understandingAnswer?.value === false) {
    recommendations.push('assessment.recommendations.learnMore');
  }

  // Check time availability
  const timeAnswer = answers.find((a) => a.questionId === 'q6_time_availability');
  if (timeAnswer?.value === false) {
    recommendations.push('assessment.recommendations.planTime');
  }

  return recommendations;
}

/**
 * Validate that all required questions are answered
 */
export function validateAssessmentAnswers(answers: AssessmentAnswer[]): {
  isValid: boolean;
  missingQuestions: string[];
} {
  const answeredQuestionIds = new Set(answers.map((a) => a.questionId));
  const missingQuestions = ASSESSMENT_QUESTIONS.filter(
    (q) => q.required && !answeredQuestionIds.has(q.id)
  ).map((q) => q.id);

  return {
    isValid: missingQuestions.length === 0,
    missingQuestions,
  };
}
