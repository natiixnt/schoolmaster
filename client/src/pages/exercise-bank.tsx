import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Trophy, Target, Star, ChevronRight, Check, ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import type { Exercise, ExerciseAttempt } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Difficulty filter component
interface DifficultyFilterProps {
  selected: string;
  onChange: (value: string) => void;
}

const DifficultyFilter = ({ selected, onChange }: DifficultyFilterProps) => {
  const difficulties = [
    { value: "all", label: "Wszystkie", color: "bg-slate-100 text-slate-700" },
    { value: "easy", label: "Łatwe", color: "bg-green-100 text-green-700" },
    { value: "medium", label: "Średnie", color: "bg-yellow-100 text-yellow-700" },
    { value: "hard", label: "Trudne", color: "bg-red-100 text-red-700" },
  ];

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Poziom trudności</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selected} onValueChange={onChange}>
          <div className="flex flex-wrap gap-3">
            {difficulties.map((diff) => (
              <div key={diff.value} className="flex items-center">
                <RadioGroupItem
                  value={diff.value}
                  id={diff.value}
                  className="sr-only"
                  data-testid={`radio-difficulty-${diff.value}`}
                />
                <Label
                  htmlFor={diff.value}
                  className={`cursor-pointer px-4 py-2 rounded-lg font-medium transition-all ${
                    selected === diff.value
                      ? diff.color + " ring-2 ring-offset-2 ring-slate-400"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                  data-testid={`label-difficulty-${diff.value}`}
                >
                  {diff.label}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
};

export default function ExerciseBank() {
  const params = useParams();
  const moduleCode = params.moduleCode;
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const { toast } = useToast();

  // Query exercises for module
  const { data: exercises, isLoading: exercisesLoading } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises", moduleCode],
    enabled: !!moduleCode,
  });

  // Mutation to generate exercises with GPT-4
  const generateExercisesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/exercises/generate/${moduleCode}`, "POST", { count: 5 });
    },
    onSuccess: (data: any) => {
      toast({
        title: "✨ Ćwiczenia wygenerowane!",
        description: `Pomyślnie utworzono ${data.exercises?.length || 5} ćwiczeń przez AI`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/exercises", moduleCode] });
      queryClient.invalidateQueries({ queryKey: ["/api/exercises/stats", moduleCode] });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się wygenerować ćwiczeń",
        variant: "destructive",
      });
    },
  });

  // Query my attempts to show completion status
  const { data: attempts } = useQuery<ExerciseAttempt[]>({
    queryKey: ["/api/exercise-attempts/my"],
  });

  // Query module stats
  const { data: stats } = useQuery<{
    completedExercises: number;
    totalExercises: number;
    correctAnswers: number;
    totalPoints: number;
    averageAccuracy: number;
  }>({
    queryKey: ["/api/exercises/stats", moduleCode],
    enabled: !!moduleCode,
  });

  // Filter exercises by difficulty
  const filteredExercises = exercises?.filter((ex) =>
    difficultyFilter === "all" || ex.difficulty === difficultyFilter
  );

  // Check if exercise is completed
  const isCompleted = (exerciseId: string) => {
    return attempts?.some((a) => a.exerciseId === exerciseId && a.isCorrect);
  };

  // Get best score for exercise
  const getBestScore = (exerciseId: string) => {
    const exerciseAttempts = attempts?.filter((a) => a.exerciseId === exerciseId);
    if (!exerciseAttempts?.length) return null;
    return Math.max(...exerciseAttempts.map((a) => a.pointsEarned));
  };

  const isLoading = exercisesLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/student-progress">
            <Button variant="outline" size="sm" className="mb-4" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Powrót do postępów
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2 text-navy-900" data-testid="heading-title">
            Bank Ćwiczeń
          </h1>
          <p className="text-slate-600" data-testid="text-module-code">
            Moduł: {moduleCode}
          </p>
        </div>

        {/* Stats Card */}
        {stats && (
          <Card className="p-6 mb-6 bg-white" data-testid="card-stats">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-slate-600">Ukończone</p>
                <p className="text-2xl font-bold text-[#5F5AFC]" data-testid="text-completed">
                  {stats.completedExercises}/{stats.totalExercises}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Poprawne</p>
                <p className="text-2xl font-bold text-green-600" data-testid="text-correct">
                  {stats.correctAnswers}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Punkty</p>
                <p className="text-2xl font-bold text-[#F1C40F]" data-testid="text-points">
                  {stats.totalPoints}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Dokładność</p>
                <p className="text-2xl font-bold text-[#4A69BD]" data-testid="text-accuracy">
                  {stats.averageAccuracy}%
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Difficulty Filter */}
        <DifficultyFilter selected={difficultyFilter} onChange={setDifficultyFilter} />

        {/* Exercise List */}
        {isLoading ? (
          <div className="space-y-4 mt-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" data-testid={`skeleton-${i}`} />
            ))}
          </div>
        ) : filteredExercises?.length === 0 ? (
          <Card className="p-8 text-center" data-testid="card-empty">
            <Target className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <p className="text-lg font-medium mb-2 text-slate-700">Brak ćwiczeń</p>
            <p className="text-sm text-slate-500 mb-6">
              {difficultyFilter === "all"
                ? "Brak ćwiczeń dla tego modułu"
                : "Brak ćwiczeń dla wybranego poziomu trudności"}
            </p>
            
            {difficultyFilter === "all" && exercises?.length === 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border-2 border-purple-200">
                <Sparkles className="w-8 h-8 mx-auto mb-3 text-purple-600" />
                <h3 className="font-semibold text-purple-900 mb-2">
                  Wygeneruj ćwiczenia przez AI
                </h3>
                <p className="text-sm text-purple-800 mb-4">
                  Użyj sztucznej inteligencji aby stworzyć spersonalizowane ćwiczenia w stylu egzaminu ósmoklasisty dla tego tematu. 
                  AI wygeneruje różnorodne zadania z pełnymi wyjaśnieniami!
                </p>
                <Button
                  onClick={() => generateExercisesMutation.mutate()}
                  disabled={generateExercisesMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  data-testid="button-generate-exercises"
                >
                  {generateExercisesMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generowanie...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Wygeneruj 5 ćwiczeń
                    </>
                  )}
                </Button>
              </div>
            )}
          </Card>
        ) : (
          <div className="space-y-4 mt-6">
            {filteredExercises?.map((exercise) => {
              const completed = isCompleted(exercise.id);
              const bestScore = getBestScore(exercise.id);

              return (
                <Card
                  key={exercise.id}
                  className="p-6 hover:shadow-lg transition-shadow bg-white"
                  data-testid={`card-exercise-${exercise.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        {completed && (
                          <div
                            className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0"
                            data-testid={`icon-completed-${exercise.id}`}
                          >
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <h3 className="text-lg font-semibold text-navy-900" data-testid={`text-title-${exercise.id}`}>
                          {exercise.title}
                        </h3>
                        <Badge
                          variant={
                            exercise.difficulty === "easy"
                              ? "secondary"
                              : exercise.difficulty === "medium"
                              ? "default"
                              : "destructive"
                          }
                          data-testid={`badge-difficulty-${exercise.id}`}
                        >
                          {exercise.difficulty === "easy"
                            ? "Łatwe"
                            : exercise.difficulty === "medium"
                            ? "Średnie"
                            : "Trudne"}
                        </Badge>
                      </div>

                      {exercise.description && (
                        <p className="text-slate-600 mb-3" data-testid={`text-description-${exercise.id}`}>
                          {exercise.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-[#F1C40F]" />
                          <span data-testid={`text-points-${exercise.id}`}>{exercise.points} pkt</span>
                        </div>
                        {bestScore !== null && (
                          <div className="flex items-center gap-1 text-green-600">
                            <Trophy className="w-4 h-4" />
                            <span data-testid={`text-best-score-${exercise.id}`}>
                              Najlepszy wynik: {bestScore} pkt
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Link href={`/exercise/${exercise.id}`}>
                      <Button
                        className="ml-4 flex-shrink-0 bg-[#5F5AFC] hover:bg-[#5F5AFC]/90"
                        data-testid={`button-solve-${exercise.id}`}
                      >
                        {completed ? "Spróbuj ponownie" : "Rozwiąż"}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
