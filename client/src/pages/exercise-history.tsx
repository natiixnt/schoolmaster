import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trophy,
  Clock,
  Lightbulb,
  CheckCircle,
  XCircle,
  TrendingUp,
  Target,
  RotateCcw,
} from "lucide-react";
import type { ExerciseAttempt } from "@shared/schema";

export default function ExerciseHistory() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Fetch all my attempts
  const { data: attempts, isLoading } = useQuery<ExerciseAttempt[]>({
    queryKey: ["/api/exercise-attempts/my"],
  });

  // Calculate stats
  const stats = useMemo(() => {
    if (!attempts?.length) {
      return {
        totalAttempts: 0,
        correctAttempts: 0,
        totalPoints: 0,
        averageAccuracy: 0,
        averageTime: 0,
      };
    }

    const correctCount = attempts.filter((a) => a.isCorrect).length;
    const totalPoints = attempts.reduce((sum, a) => sum + a.pointsEarned, 0);
    const avgAccuracy = (correctCount / attempts.length) * 100;
    const avgTime = attempts.reduce((sum, a) => sum + a.timeTaken, 0) / attempts.length;

    return {
      totalAttempts: attempts.length,
      correctAttempts: correctCount,
      totalPoints,
      averageAccuracy: Math.round(avgAccuracy * 10) / 10,
      averageTime: Math.round(avgTime),
    };
  }, [attempts]);

  // Filter and sort attempts
  const filteredAttempts = useMemo(() => {
    let filtered = attempts || [];

    // Filter by status
    if (statusFilter === "correct") {
      filtered = filtered.filter((a) => a.isCorrect);
    } else if (statusFilter === "incorrect") {
      filtered = filtered.filter((a) => !a.isCorrect);
    }

    // Sort
    if (sortBy === "newest") {
      filtered = [...filtered].sort(
        (a, b) =>
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      );
    } else if (sortBy === "oldest") {
      filtered = [...filtered].sort(
        (a, b) =>
          new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
      );
    } else if (sortBy === "points") {
      filtered = [...filtered].sort((a, b) => b.pointsEarned - a.pointsEarned);
    }

    return filtered;
  }, [attempts, statusFilter, sortBy]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Historia Ćwiczeń</h1>
          <p className="text-slate-600">
            Wszystkie twoje próby rozwiązywania zadań
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="p-4 bg-white">
            <div className="flex items-center gap-2 mb-2 text-slate-600">
              <Target className="w-4 h-4" />
              <p className="text-sm">Próby</p>
            </div>
            <p className="text-2xl font-bold text-[#5F5AFC]" data-testid="stat-total-attempts">
              {stats.totalAttempts}
            </p>
          </Card>

          <Card className="p-4 bg-white">
            <div className="flex items-center gap-2 mb-2 text-slate-600">
              <CheckCircle className="w-4 h-4" />
              <p className="text-sm">Poprawne</p>
            </div>
            <p className="text-2xl font-bold text-green-600" data-testid="stat-correct-attempts">
              {stats.correctAttempts}
            </p>
          </Card>

          <Card className="p-4 bg-white">
            <div className="flex items-center gap-2 mb-2 text-slate-600">
              <Trophy className="w-4 h-4" />
              <p className="text-sm">Punkty</p>
            </div>
            <p className="text-2xl font-bold text-[#F1C40F]" data-testid="stat-total-points">
              {stats.totalPoints}
            </p>
          </Card>

          <Card className="p-4 bg-white">
            <div className="flex items-center gap-2 mb-2 text-slate-600">
              <TrendingUp className="w-4 h-4" />
              <p className="text-sm">Dokładność</p>
            </div>
            <p className="text-2xl font-bold text-[#4A69BD]" data-testid="stat-accuracy">
              {stats.averageAccuracy}%
            </p>
          </Card>

          <Card className="p-4 bg-white">
            <div className="flex items-center gap-2 mb-2 text-slate-600">
              <Clock className="w-4 h-4" />
              <p className="text-sm">Śr. czas</p>
            </div>
            <p className="text-2xl font-bold text-slate-700" data-testid="stat-average-time">
              {formatTime(stats.averageTime)}
            </p>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6 bg-white">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm text-slate-600 mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie</SelectItem>
                  <SelectItem value="correct">Poprawne</SelectItem>
                  <SelectItem value="incorrect">Niepoprawne</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm text-slate-600 mb-2 block">Sortuj</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger data-testid="select-sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Najnowsze</SelectItem>
                  <SelectItem value="oldest">Najstarsze</SelectItem>
                  <SelectItem value="points">Najlepsze punkty</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Attempts List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" data-testid={`skeleton-${i}`} />
            ))}
          </div>
        ) : filteredAttempts.length === 0 ? (
          <Card className="p-8 text-center text-slate-500">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p data-testid="text-empty-state">Brak prób spełniających kryteria filtrów</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAttempts.map((attempt) => (
              <Card
                key={attempt.id}
                className="p-6 hover:shadow-lg transition-shadow"
                data-testid={`card-attempt-${attempt.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {attempt.isCorrect ? (
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                          <XCircle className="w-5 h-5 text-white" />
                        </div>
                      )}

                      <div>
                        <p className="font-semibold text-lg" data-testid={`text-exercise-id-${attempt.id}`}>
                          Ćwiczenie ID: {attempt.exerciseId.substring(0, 8)}...
                        </p>
                        <p className="text-sm text-slate-500" data-testid={`text-completed-at-${attempt.id}`}>
                          {new Date(attempt.completedAt).toLocaleString("pl-PL")}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Trophy className="w-4 h-4 text-[#F1C40F]" />
                        <span data-testid={`text-points-${attempt.id}`}>{attempt.pointsEarned} pkt</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span data-testid={`text-time-${attempt.id}`}>{formatTime(attempt.timeTaken)}</span>
                      </div>

                      {attempt.hintsUsed > 0 && (
                        <div className="flex items-center gap-1">
                          <Lightbulb className="w-4 h-4 text-[#F1C40F]" />
                          <span data-testid={`text-hints-${attempt.id}`}>{attempt.hintsUsed} wskazówek</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Link href={`/exercise/${attempt.exerciseId}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      data-testid={`button-retry-${attempt.id}`}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Spróbuj ponownie
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
