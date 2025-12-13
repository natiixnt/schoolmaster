import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ChevronLeft, ChevronRight, CheckCircle, Clock, ArrowLeft, Trophy, Star, XCircle, Lightbulb, BookOpen } from "lucide-react";
import type { Quiz, Question } from "@shared/schema";

interface QuestionWithOrder extends Question {
  order: number;
}

export default function QuizTaking() {
  const [, params] = useRoute("/quiz/:moduleCode");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, any>>(new Map());
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean; xpAwarded?: number } | null>(null);

  const moduleCode = params?.moduleCode;

  // Fetch quiz by module code
  const { data: quiz, isLoading: quizLoading } = useQuery<Quiz>({
    queryKey: ["/api/quizzes", moduleCode],
    queryFn: async () => {
      const response = await fetch(`/api/quizzes/${moduleCode}`);
      if (!response.ok) throw new Error("Failed to fetch quiz");
      return response.json();
    },
    enabled: !!moduleCode,
  });

  // Fetch questions for the quiz
  const { data: questions = [], isLoading: questionsLoading } = useQuery<QuestionWithOrder[]>({
    queryKey: ["/api/quizzes", quiz?.id, "questions"],
    queryFn: async () => {
      const response = await fetch(`/api/quizzes/${quiz?.id}/questions`);
      if (!response.ok) throw new Error("Failed to fetch questions");
      return response.json();
    },
    enabled: !!quiz?.id,
  });

  // Initialize timer when quiz loads
  useEffect(() => {
    if (quiz && quiz.timeLimit) {
      const storageKey = `quiz_timer_${quiz.id}`;
      const savedTime = localStorage.getItem(storageKey);
      
      if (savedTime) {
        setTimeRemaining(parseInt(savedTime, 10));
      } else {
        const initialTime = quiz.timeLimit * 60; // Convert minutes to seconds
        setTimeRemaining(initialTime);
        localStorage.setItem(storageKey, initialTime.toString());
      }
    }
  }, [quiz]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || isSubmitted) return;

    const storageKey = `quiz_timer_${quiz?.id}`;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          // Auto-submit when time runs out
          if (prev === 1) {
            handleAutoSubmit();
          }
          clearInterval(interval);
          localStorage.removeItem(storageKey);
          return 0;
        }
        const newTime = prev - 1;
        localStorage.setItem(storageKey, newTime.toString());
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, isSubmitted, quiz?.id]);

  // Submit quiz mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!quiz) throw new Error("Quiz not found");
      
      const answersArray = Array.from(answers.entries()).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));

      const timeTaken = quiz.timeLimit 
        ? (quiz.timeLimit * 60 - (timeRemaining || 0)) 
        : 0;

      const response = await apiRequest("/api/quiz-attempts", "POST", {
        quizId: quiz.id,
        answers: answersArray,
        timeTaken,
      });
      
      return await response.json();
    },
    onSuccess: (data) => {
      console.log("Quiz submission response:", data);
      console.log("Score from response:", data.score);
      setIsSubmitted(true);
      setResult(data);
      
      // Clear timer from localStorage
      if (quiz?.id) {
        localStorage.removeItem(`quiz_timer_${quiz.id}`);
      }

      toast({
        title: data.passed ? "🎉 Gratulacje!" : "Spróbuj ponownie",
        description: data.xpAwarded && data.xpAwarded > 0 
          ? `Wynik: ${data.score}%. Zdobyłeś ${data.xpAwarded} XP!`
          : `Wynik: ${data.score}%`,
        variant: data.passed ? "default" : "destructive",
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["/api/quiz-attempts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student/topic-progression"] });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się przesłać odpowiedzi",
        variant: "destructive",
      });
    },
  });

  const handleAutoSubmit = () => {
    if (!isSubmitted) {
      submitMutation.mutate();
    }
  };

  const handleSubmit = () => {
    if (answers.size < questions.length) {
      const unanswered = questions.length - answers.size;
      if (!confirm(`Pozostało ${unanswered} pytań bez odpowiedzi. Czy na pewno chcesz zakończyć test?`)) {
        return;
      }
    }
    submitMutation.mutate();
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers((prev) => {
      const newAnswers = new Map(prev);
      newAnswers.set(questionId, answer);
      return newAnswers;
    });
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (quizLoading || questionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie testu...</p>
        </div>
      </div>
    );
  }

  if (!quiz || !moduleCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-50 to-blue-50">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Test nie znaleziony</h2>
            <p className="text-gray-600 mb-4">Nie znaleziono testu dla tego modułu.</p>
            <Button onClick={() => setLocation("/student-progress")} data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Powrót do postępów
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-50 to-blue-50">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Brak pytań</h2>
            <p className="text-gray-600 mb-4">Ten test nie ma jeszcze pytań.</p>
            <Button onClick={() => setLocation("/student-progress")} data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Powrót do postępów
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  // Results screen
  if (isSubmitted && result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-50 to-blue-50 p-6">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <CardTitle className="text-center">
              {result.passed ? (
                <div className="flex flex-col items-center gap-4">
                  <Trophy className="w-16 h-16 text-yellow-500" />
                  <h1 className="text-3xl font-bold text-navy-900">Gratulacje!</h1>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <XCircle className="w-16 h-16 text-red-500" />
                  <h1 className="text-3xl font-bold text-navy-900">Spróbuj ponownie</h1>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gradient-to-r from-accent/10 to-yellow-50 rounded-lg p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-navy-900 mb-2" data-testid="text-score">
                    {result.score}%
                  </div>
                  <div className="text-sm text-gray-600">Twój wynik</div>
                </div>
                <div className="text-center">
                  <div className={`text-4xl font-bold mb-2 ${result.passed ? 'text-green-600' : 'text-red-600'}`} data-testid="text-passed">
                    {result.passed ? "✓ Zaliczony" : "✗ Niezaliczony"}
                  </div>
                  <div className="text-sm text-gray-600">
                    Wymagane: {quiz.passingScore}%
                  </div>
                </div>
              </div>
            </div>

            {result.xpAwarded && result.xpAwarded > 0 && (
              <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-lg">
                <div className="flex items-center justify-center gap-3">
                  <Trophy className="w-8 h-8 text-yellow-600" />
                  <div className="text-center">
                    <p className="text-lg font-bold text-yellow-900" data-testid="text-xp-awarded">
                      Zdobyłeś {result.xpAwarded} XP!
                    </p>
                    <p className="text-sm text-yellow-700">
                      Gratulacje pierwszego zdanego testu!
                    </p>
                  </div>
                  <Star className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
            )}

            {(result as any).suggestHelp && (
              <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg" data-testid="card-help-suggestion">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <Lightbulb className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-blue-900 mb-2">
                      Potrzebujesz pomocy z tym tematem?
                    </h3>
                    <p className="text-blue-800 mb-4">
                      Widzimy, że ten test jest dla Ciebie wyzwaniem. Oto jak możemy pomóc:
                    </p>
                    <div className="space-y-3">
                      <Button
                        onClick={() => setLocation(`/exercises/${moduleCode}`)}
                        variant="outline"
                        className="w-full justify-start bg-white hover:bg-blue-50 border-blue-300"
                        data-testid="button-practice-exercises"
                      >
                        <BookOpen className="w-5 h-5 mr-3 text-blue-600" />
                        <div className="text-left">
                          <div className="font-semibold text-blue-900">Poćwicz ćwiczenia</div>
                          <div className="text-sm text-blue-700">Rozwiąż zadania z wyjaśnieniami krok po kroku</div>
                        </div>
                        <ChevronRight className="w-5 h-5 ml-auto text-blue-400" />
                      </Button>
                      <Button
                        onClick={() => setLocation("/student/matching")}
                        variant="outline"
                        className="w-full justify-start bg-white hover:bg-blue-50 border-blue-300"
                        data-testid="button-book-lesson"
                      >
                        <Trophy className="w-5 h-5 mr-3 text-purple-600" />
                        <div className="text-left">
                          <div className="font-semibold text-blue-900">Zarezerwuj lekcję z korepetytorem</div>
                          <div className="text-sm text-blue-700">Otrzymaj indywidualne wsparcie i wyjaśnienia</div>
                        </div>
                        <ChevronRight className="w-5 h-5 ml-auto text-blue-400" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button 
                onClick={() => setLocation("/student-progress")} 
                variant="outline"
                className="flex-1"
                data-testid="button-back-to-progress"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Powrót do postępów
              </Button>
              {!result.passed && (
                <Button 
                  onClick={() => window.location.reload()} 
                  className="flex-1"
                  data-testid="button-retry"
                >
                  Spróbuj ponownie
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quiz taking screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-50 to-blue-50 p-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation("/student-progress")}
              data-testid="button-exit-quiz"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Wyjdź
            </Button>
            {timeRemaining !== null && (
              <div className={`text-2xl font-bold flex items-center gap-2 ${timeRemaining < 60 ? 'text-red-600' : 'text-navy-900'}`} data-testid="text-timer">
                <Clock className="w-6 h-6" />
                {formatTime(timeRemaining)}
              </div>
            )}
          </div>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold text-navy-900 mb-2" data-testid="text-quiz-title">
                {quiz.title}
              </CardTitle>
              {quiz.description && (
                <p className="text-gray-600 mb-2">{quiz.description}</p>
              )}
              <p className="text-sm text-gray-500" data-testid="text-question-counter">
                Pytanie {currentIndex + 1} / {questions.length}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Current Question */}
          <div className="min-h-[300px]">
            <h2 className="text-xl font-semibold text-navy-900 mb-6" data-testid="text-question">
              {currentQuestion.questionText}
            </h2>

            {/* Multiple Choice */}
            {currentQuestion.questionType === "multiple_choice" && (
              <RadioGroup
                value={answers.get(currentQuestion.id) || ""}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              >
                <div className="space-y-3">
                  {(currentQuestion.options as string[])?.map((option, index) => (
                    <div 
                      key={index} 
                      className="flex items-center space-x-3 p-5 border-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all hover:border-accent"
                      onClick={() => handleAnswerChange(currentQuestion.id, option)}
                    >
                      <RadioGroupItem value={option} id={`option-${index}`} data-testid={`radio-option-${index}`} className="pointer-events-none" />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}

            {/* Multiple Select */}
            {currentQuestion.questionType === "multiple_select" && (
              <div className="space-y-3">
                {(currentQuestion.options as string[])?.map((option, index) => {
                  const selectedOptions = answers.get(currentQuestion.id) || [];
                  const isChecked = Array.isArray(selectedOptions) && selectedOptions.includes(option);
                  
                  return (
                    <div 
                      key={index} 
                      className="flex items-center space-x-3 p-5 border-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all hover:border-accent"
                      onClick={() => {
                        const currentAnswers = answers.get(currentQuestion.id) || [];
                        const newAnswers = isChecked
                          ? currentAnswers.filter((a: string) => a !== option)
                          : [...currentAnswers, option];
                        handleAnswerChange(currentQuestion.id, newAnswers);
                      }}
                    >
                      <Checkbox
                        id={`checkbox-${index}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          const currentAnswers = answers.get(currentQuestion.id) || [];
                          const newAnswers = checked
                            ? [...currentAnswers, option]
                            : currentAnswers.filter((a: string) => a !== option);
                          handleAnswerChange(currentQuestion.id, newAnswers);
                        }}
                        data-testid={`checkbox-option-${index}`}
                        className="pointer-events-none"
                      />
                      <Label htmlFor={`checkbox-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  );
                })}
              </div>
            )}

            {/* True/False */}
            {currentQuestion.questionType === "true_false" && (
              <RadioGroup
                value={answers.get(currentQuestion.id)?.toString() || ""}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value === "true")}
              >
                <div className="space-y-3">
                  <div 
                    className="flex items-center space-x-3 p-5 border-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all hover:border-accent"
                    onClick={() => handleAnswerChange(currentQuestion.id, true)}
                  >
                    <RadioGroupItem value="true" id="true" data-testid="radio-true" className="pointer-events-none" />
                    <Label htmlFor="true" className="flex-1 cursor-pointer">
                      Prawda
                    </Label>
                  </div>
                  <div 
                    className="flex items-center space-x-3 p-5 border-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all hover:border-accent"
                    onClick={() => handleAnswerChange(currentQuestion.id, false)}
                  >
                    <RadioGroupItem value="false" id="false" data-testid="radio-false" className="pointer-events-none" />
                    <Label htmlFor="false" className="flex-1 cursor-pointer">
                      Fałsz
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            )}

            {/* Short Answer */}
            {currentQuestion.questionType === "short_answer" && (
              <Input
                value={answers.get(currentQuestion.id) || ""}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                placeholder="Wpisz swoją odpowiedź..."
                className="text-lg"
                data-testid="input-short-answer"
              />
            )}

            {/* Math Problem */}
            {currentQuestion.questionType === "math_problem" && (
              <Textarea
                value={answers.get(currentQuestion.id) || ""}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                placeholder="Wpisz swoje rozwiązanie (pokaż wszystkie kroki)..."
                className="min-h-[200px] text-lg font-mono"
                data-testid="textarea-math-problem"
              />
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between gap-4 pt-6 border-t">
            <Button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              variant="outline"
              data-testid="button-previous"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Poprzednie
            </Button>

            {currentIndex < questions.length - 1 ? (
              <Button
                onClick={handleNext}
                data-testid="button-next"
              >
                Następne
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-submit-quiz"
              >
                {submitMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Wysyłanie...
                  </>
                ) : (
                  <>
                    Zakończ test
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Progress indicator */}
          <div className="flex gap-2 flex-wrap justify-center pt-4">
            {questions.map((_, index) => (
              <div
                key={index}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold cursor-pointer ${
                  index === currentIndex
                    ? "bg-navy-900 text-white"
                    : answers.has(questions[index].id)
                    ? "bg-green-100 text-green-700 border-2 border-green-500"
                    : "bg-gray-200 text-gray-600"
                }`}
                onClick={() => setCurrentIndex(index)}
                data-testid={`indicator-question-${index}`}
              >
                {index + 1}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
