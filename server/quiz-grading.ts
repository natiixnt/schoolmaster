import { Question, Quiz } from "@shared/schema";

export interface QuizAnswer {
  questionId: string;
  answer: any;
}

export interface GradingResult {
  score: number;
  passed: boolean;
  totalPoints: number;
  earnedPoints: number;
  questionResults: {
    questionId: string;
    correct: boolean;
    earnedPoints: number;
    maxPoints: number;
  }[];
}

export function gradeQuizAttempt(
  questions: (Question & { order: number })[],
  answers: QuizAnswer[],
  passingScore: number
): GradingResult {
  const answerMap = new Map(answers.map(a => [a.questionId, a.answer]));
  const questionResults = [];
  let totalPoints = 0;
  let earnedPoints = 0;

  for (const question of questions) {
    const studentAnswer = answerMap.get(question.id);
    const maxPoints = question.points || 1;
    totalPoints += maxPoints;

    let correct = false;
    
    // Grade based on question type
    switch (question.questionType) {
      case 'multiple_choice':
      case 'true_false':
      case 'short_answer':
        // Defensive: Handle undefined/null answers
        if (studentAnswer === undefined || studentAnswer === null || studentAnswer === '') {
          correct = false;
          break;
        }
        
        // Safe string comparison
        const correctAnswer = typeof question.correctAnswer === 'string' 
          ? question.correctAnswer 
          : JSON.stringify(question.correctAnswer);
        const studentAnswerStr = typeof studentAnswer === 'string'
          ? studentAnswer
          : JSON.stringify(studentAnswer);
        
        correct = correctAnswer.toLowerCase().trim() === studentAnswerStr.toLowerCase().trim();
        break;

      case 'multiple_select':
        // Defensive: Handle undefined/null/malformed answers
        if (!studentAnswer) {
          correct = false;
          break;
        }
        
        try {
          const correctAnswers = Array.isArray(question.correctAnswer) 
            ? question.correctAnswer 
            : JSON.parse(question.correctAnswer as string);
          
          const studentAnswers = Array.isArray(studentAnswer) 
            ? studentAnswer 
            : (typeof studentAnswer === 'string' ? JSON.parse(studentAnswer) : []);
          
          if (!Array.isArray(studentAnswers)) {
            correct = false;
            break;
          }
          
          correct = correctAnswers.length === studentAnswers.length &&
            correctAnswers.every((ans: string) => studentAnswers.includes(ans));
        } catch (error) {
          // Malformed JSON - mark as incorrect
          console.error('Error parsing multiple_select answer:', error);
          correct = false;
        }
        break;

      case 'math_problem':
        // Defensive: Handle undefined/null answers
        if (studentAnswer === undefined || studentAnswer === null || studentAnswer === '') {
          correct = false;
          break;
        }
        
        const mathCorrect = String(question.correctAnswer || '').trim();
        const mathStudent = String(studentAnswer).trim();
        correct = mathCorrect === mathStudent;
        break;
        
      default:
        // Unknown question type - mark as incorrect
        console.warn(`Unknown question type: ${question.questionType}`);
        correct = false;
    }

    const earned = correct ? maxPoints : 0;
    earnedPoints += earned;

    questionResults.push({
      questionId: question.id,
      correct,
      earnedPoints: earned,
      maxPoints,
    });
  }

  const scorePercentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const passed = scorePercentage >= passingScore;

  return {
    score: scorePercentage,
    passed,
    totalPoints,
    earnedPoints,
    questionResults,
  };
}
