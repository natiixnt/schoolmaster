import type { Exercise } from "@shared/schema";

interface GradingResult {
  isCorrect: boolean;
  pointsEarned: number;
  feedback: string;
}

/**
 * Grade exercise answer - SERVER-SIDE ONLY
 * Prevents client tampering
 */
export function gradeExercise(
  exercise: Exercise,
  studentAnswer: any
): GradingResult {
  // Defensive: handle missing or invalid answer
  if (studentAnswer === undefined || studentAnswer === null || studentAnswer === "") {
    return {
      isCorrect: false,
      pointsEarned: 0,
      feedback: "Brak odpowiedzi",
    };
  }

  const correctAnswer = exercise.correctAnswer;
  let isCorrect = false;

  try {
    switch (exercise.exerciseType) {
      case "single_choice":
        // Single choice: compare selected option
        isCorrect = String(studentAnswer).trim().toLowerCase() === 
                   String(correctAnswer).trim().toLowerCase();
        break;

      case "multiple_choice":
        // Multiple choice: compare arrays (order doesn't matter)
        if (Array.isArray(studentAnswer) && Array.isArray(correctAnswer)) {
          const studentSet = new Set(studentAnswer.map((a: any) => String(a).trim().toLowerCase()));
          const correctSet = new Set(correctAnswer.map((a: any) => String(a).trim().toLowerCase()));
          
          isCorrect = studentSet.size === correctSet.size &&
                     [...studentSet].every(ans => correctSet.has(ans));
        }
        break;

      case "numerical":
        // Numerical: compare numbers with tolerance
        const studentNum = parseFloat(String(studentAnswer).replace(",", "."));
        const correctNum = parseFloat(String(correctAnswer).replace(",", "."));
        
        if (!isNaN(studentNum) && !isNaN(correctNum)) {
          // Allow 0.01 tolerance for floating point
          const tolerance = 0.01;
          isCorrect = Math.abs(studentNum - correctNum) <= tolerance;
        }
        break;

      case "algebraic":
        // Algebraic: normalize and compare expressions
        // Remove spaces, normalize operators
        const normalizeAlgebraic = (expr: string) => {
          return String(expr)
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "")
            .replace(/\*/g, "·") // normalize multiplication
            .replace(/\^/g, "**"); // normalize exponents
        };
        
        const studentNorm = normalizeAlgebraic(studentAnswer);
        const correctNorm = normalizeAlgebraic(String(correctAnswer));
        
        isCorrect = studentNorm === correctNorm;
        break;

      case "word_problem":
        // Word problem: extract number from text answer
        const extractNumber = (text: string) => {
          const match = String(text).match(/[-+]?[0-9]*\.?[0-9]+/);
          return match ? parseFloat(match[0]) : NaN;
        };
        
        const studentValue = extractNumber(studentAnswer);
        const correctValue = extractNumber(String(correctAnswer));
        
        if (!isNaN(studentValue) && !isNaN(correctValue)) {
          const tolerance = 0.01;
          isCorrect = Math.abs(studentValue - correctValue) <= tolerance;
        }
        break;

      default:
        // Unknown type - default to string comparison
        isCorrect = String(studentAnswer).trim().toLowerCase() === 
                   String(correctAnswer).trim().toLowerCase();
    }
  } catch (error) {
    // If grading fails, mark as incorrect
    console.error("Exercise grading error:", error);
    isCorrect = false;
  }

  // Calculate points earned
  const pointsEarned = isCorrect ? exercise.points : 0;

  // Generate feedback
  const feedback = isCorrect
    ? "Poprawna odpowiedź! Świetna robota! 🎉"
    : "Niepoprawna odpowiedź. Spróbuj ponownie lub użyj wskazówek.";

  return {
    isCorrect,
    pointsEarned,
    feedback,
  };
}
