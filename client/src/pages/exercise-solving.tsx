import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Lightbulb, 
  Clock, 
  Trophy, 
  XCircle, 
  CheckCircle, 
  ArrowLeft, 
  BookOpen 
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Exercise, ExerciseAttempt } from "@shared/schema";

export default function ExerciseSolving() {
  const params = useParams();
  const exerciseId = params.exerciseId;
  const [answer, setAnswer] = useState<any>(null);
  const [multipleChoiceAnswers, setMultipleChoiceAnswers] = useState<string[]>([]);
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  // Fetch exercise
  const { data: exercise, isLoading } = useQuery<Exercise>({
    queryKey: ["/api/exercises/detail", exerciseId],
    enabled: !!exerciseId,
  });
  
  // Timer effect
  useEffect(() => {
    if (!submitted) {
      const interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [submitted]);
  
  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/exercise-attempts", "POST", {
        exerciseId,
        answer: exercise?.exerciseType === "multiple_choice" ? multipleChoiceAnswers : answer,
        timeTaken: elapsedTime,
        hintsUsed: hintsRevealed,
      });
      return response;
    },
    onSuccess: (data) => {
      setResult(data);
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/exercise-attempts/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/exercises/stats", exercise?.moduleCode] });
    },
  });
  
  const handleSubmit = () => {
    if (!answer && exercise?.exerciseType !== "multiple_choice") {
      return;
    }
    if (exercise?.exerciseType === "multiple_choice" && multipleChoiceAnswers.length === 0) {
      return;
    }
    submitMutation.mutate();
  };
  
  const revealHint = () => {
    if (exercise?.hints && hintsRevealed < (exercise.hints as string[]).length) {
      setHintsRevealed(prev => prev + 1);
    }
  };
  
  // Format time mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Skeleton className="w-full max-w-2xl h-96" />
      </div>
    );
  }
  
  if (!exercise) {
    return (
      <div className="text-center p-8">Ćwiczenie nie znalezione</div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link href={`/exercises/${exercise.moduleCode}`}>
            <Button variant="ghost" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Powrót do listy
            </Button>
          </Link>
          
          <div className="flex items-center gap-4">
            {/* Timer */}
            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="w-5 h-5" />
              <span className="font-mono text-lg" data-testid="text-timer">
                {formatTime(elapsedTime)}
              </span>
            </div>
            
            {/* Points */}
            <Badge className="bg-[#F1C40F] text-black" data-testid="badge-points">
              {exercise.points} pkt
            </Badge>
            
            {/* Difficulty */}
            <Badge variant={
              exercise.difficulty === "easy" ? "secondary" : 
              exercise.difficulty === "medium" ? "default" : 
              "destructive"
            }>
              {exercise.difficulty === "easy" ? "Łatwe" : 
               exercise.difficulty === "medium" ? "Średnie" : "Trudne"}
            </Badge>
          </div>
        </div>
        
        {/* Exercise Card */}
        <Card className="p-8 mb-6">
          <h1 className="text-2xl font-bold mb-4" data-testid="text-exercise-title">
            {exercise.title}
          </h1>
          
          {exercise.description && (
            <p className="text-slate-600 mb-6">{exercise.description}</p>
          )}
          
          <div className="bg-blue-50 p-6 rounded-lg mb-6">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#5F5AFC]" />
              Pytanie
            </h2>
            <p className="text-lg whitespace-pre-wrap" data-testid="text-question">
              {exercise.question}
            </p>
          </div>
          
          {/* Answer Input */}
          {!submitted && (
            <div className="mb-6">
              {exercise.exerciseType === "single_choice" && exercise.options && (
                <div className="space-y-3">
                  {(exercise.options as string[]).map((option, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center space-x-3 p-5 border-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all hover:border-accent"
                      onClick={() => setAnswer(option)}
                    >
                      <input 
                        type="radio" 
                        id={`option-${idx}`}
                        value={option}
                        checked={answer === option}
                        onChange={(e) => setAnswer(e.target.value)}
                        className="w-4 h-4 pointer-events-none"
                        data-testid={`radio-option-${idx}`}
                      />
                      <label htmlFor={`option-${idx}`} className="text-lg cursor-pointer flex-1">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              )}
              
              {exercise.exerciseType === "multiple_choice" && exercise.options && (
                <div className="space-y-3">
                  {(exercise.options as string[]).map((option, idx) => {
                    const isChecked = multipleChoiceAnswers.includes(option);
                    
                    return (
                      <div 
                        key={idx} 
                        className="flex items-center space-x-3 p-5 border-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all hover:border-accent"
                        onClick={() => {
                          if (isChecked) {
                            setMultipleChoiceAnswers(multipleChoiceAnswers.filter(a => a !== option));
                          } else {
                            setMultipleChoiceAnswers([...multipleChoiceAnswers, option]);
                          }
                        }}
                      >
                        <Checkbox 
                          id={`option-${idx}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setMultipleChoiceAnswers([...multipleChoiceAnswers, option]);
                            } else {
                              setMultipleChoiceAnswers(multipleChoiceAnswers.filter(a => a !== option));
                            }
                          }}
                          data-testid={`checkbox-option-${idx}`}
                          className="pointer-events-none"
                        />
                        <label htmlFor={`option-${idx}`} className="text-lg cursor-pointer flex-1">
                          {option}
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {exercise.exerciseType === "numerical" && (
                <Input 
                  type="number"
                  step="0.01"
                  placeholder="Wpisz odpowiedź numeryczną"
                  value={answer || ""}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="text-lg"
                  data-testid="input-numerical"
                />
              )}
              
              {exercise.exerciseType === "algebraic" && (
                <Input 
                  type="text"
                  placeholder="Wpisz wyrażenie algebraiczne (np. 2x + 5)"
                  value={answer || ""}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="text-lg font-mono"
                  data-testid="input-algebraic"
                />
              )}
              
              {exercise.exerciseType === "word_problem" && (
                <Textarea 
                  placeholder="Wpisz rozwiązanie zadania tekstowego..."
                  value={answer || ""}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={4}
                  className="text-lg"
                  data-testid="textarea-word-problem"
                />
              )}
            </div>
          )}
          
          {/* Hints Section */}
          {!submitted && exercise.hints && (exercise.hints as string[]).length > 0 && (
            <div className="mb-6">
              <Button 
                variant="outline"
                onClick={revealHint}
                disabled={hintsRevealed >= (exercise.hints as string[]).length}
                className="mb-4"
                data-testid="button-reveal-hint"
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                Pokaż wskazówkę ({hintsRevealed}/{(exercise.hints as string[]).length})
              </Button>
              
              {hintsRevealed > 0 && (
                <div className="space-y-3">
                  {(exercise.hints as string[]).slice(0, hintsRevealed).map((hint, idx) => (
                    <Alert key={idx} className="bg-yellow-50 border-[#F1C40F]">
                      <Lightbulb className="w-4 h-4 text-[#F1C40F]" />
                      <div className="ml-2">
                        <p className="font-semibold">Wskazówka {idx + 1}</p>
                        <p className="text-slate-700">{hint}</p>
                      </div>
                    </Alert>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Submit Button */}
          {!submitted && (
            <Button 
              onClick={handleSubmit}
              disabled={submitMutation.isPending || (!answer && multipleChoiceAnswers.length === 0)}
              className="w-full bg-[#5F5AFC] hover:bg-[#4A4AE0] text-white text-lg py-6"
              data-testid="button-submit"
            >
              {submitMutation.isPending ? "Sprawdzanie..." : "Sprawdź odpowiedź"}
            </Button>
          )}
          
          {/* Result */}
          {submitted && result && (
            <div className="space-y-6">
              <Alert className={result.isCorrect ? "bg-green-50 border-green-500" : "bg-red-50 border-red-500"}>
                {result.isCorrect ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
                <div className="ml-2">
                  <p className={`text-lg font-bold ${result.isCorrect ? "text-green-700" : "text-red-700"}`}>
                    {result.isCorrect ? "Poprawna odpowiedź!" : "Niepoprawna odpowiedź"}
                  </p>
                  <p className="text-slate-700">{result.feedback}</p>
                  {result.isCorrect && (
                    <div className="flex items-center gap-2 mt-2 text-[#F1C40F] font-bold">
                      <Trophy className="w-5 h-5" />
                      <span>+{result.pointsEarned} punktów!</span>
                    </div>
                  )}
                </div>
              </Alert>
              
              {/* Solution Steps */}
              {exercise.solutionSteps && (exercise.solutionSteps as any[]).length > 0 && (
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-[#5F5AFC]">
                    <BookOpen className="w-5 h-5" />
                    Rozwiązanie krok po kroku
                  </h3>
                  <div className="space-y-4">
                    {(exercise.solutionSteps as any[]).map((step, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-md">
                        <p className="font-semibold text-[#5F5AFC] mb-2">Krok {idx + 1}: {step.step}</p>
                        <p className="text-slate-700">{step.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex gap-3">
                <Link href={`/exercises/${exercise.moduleCode}`} className="flex-1">
                  <Button variant="outline" className="w-full" data-testid="button-back-to-bank">
                    Powrót do listy
                  </Button>
                </Link>
                <Button 
                  onClick={() => {
                    setSubmitted(false);
                    setResult(null);
                    setAnswer(null);
                    setMultipleChoiceAnswers([]);
                    setHintsRevealed(0);
                    setElapsedTime(0);
                  }}
                  className="flex-1 bg-[#5F5AFC]"
                  data-testid="button-try-again"
                >
                  Spróbuj ponownie
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
