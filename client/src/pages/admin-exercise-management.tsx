import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Exercise, InsertExercise, MathTopic } from "@shared/schema";
import { insertExerciseSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash, Target } from "lucide-react";

// Extended schema for form validation with JSON string parsing
const exerciseFormSchema = insertExerciseSchema.extend({
  options: z.string().optional().transform((val, ctx) => {
    if (!val || val.trim() === "") return null;
    try {
      const parsed = JSON.parse(val);
      if (!Array.isArray(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Options muszą być tablicą JSON",
        });
        return z.NEVER;
      }
      return parsed;
    } catch (e) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nieprawidłowy format JSON dla options",
      });
      return z.NEVER;
    }
  }),
  correctAnswer: z.string().transform((val, ctx) => {
    try {
      return JSON.parse(val);
    } catch (e) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nieprawidłowy format JSON dla correctAnswer",
      });
      return z.NEVER;
    }
  }),
  solutionSteps: z.string().optional().transform((val, ctx) => {
    if (!val || val.trim() === "") return null;
    try {
      const parsed = JSON.parse(val);
      if (!Array.isArray(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Solution steps muszą być tablicą JSON",
        });
        return z.NEVER;
      }
      return parsed;
    } catch (e) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nieprawidłowy format JSON dla solutionSteps",
      });
      return z.NEVER;
    }
  }),
  hints: z.string().optional().transform((val, ctx) => {
    if (!val || val.trim() === "") return null;
    try {
      const parsed = JSON.parse(val);
      if (!Array.isArray(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Hints muszą być tablicą JSON",
        });
        return z.NEVER;
      }
      return parsed;
    } catch (e) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nieprawidłowy format JSON dla hints",
      });
      return z.NEVER;
    }
  }),
});

type ExerciseFormData = z.infer<typeof exerciseFormSchema>;

interface ExerciseFormProps {
  exercise?: Exercise;
  onSubmit: (data: InsertExercise) => void;
  onCancel: () => void;
  topics?: MathTopic[];
}

function ExerciseForm({ exercise, onSubmit, onCancel, topics }: ExerciseFormProps) {
  const form = useForm<ExerciseFormData>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: exercise ? {
      moduleCode: exercise.moduleCode,
      title: exercise.title,
      description: exercise.description || "",
      exerciseType: exercise.exerciseType,
      question: exercise.question,
      options: exercise.options ? JSON.stringify(exercise.options, null, 2) : "",
      correctAnswer: JSON.stringify(exercise.correctAnswer, null, 2),
      solutionSteps: exercise.solutionSteps ? JSON.stringify(exercise.solutionSteps, null, 2) : "",
      hints: exercise.hints ? JSON.stringify(exercise.hints, null, 2) : "",
      difficulty: exercise.difficulty,
      points: exercise.points,
      isActive: exercise.isActive,
    } : {
      moduleCode: "",
      title: "",
      description: "",
      exerciseType: "single_choice",
      question: "",
      options: "",
      correctAnswer: "",
      solutionSteps: "",
      hints: "",
      difficulty: "easy",
      points: 10,
      isActive: true,
    },
  });

  const exerciseType = form.watch("exerciseType");
  const showOptions = exerciseType === "single_choice" || exerciseType === "multiple_choice";

  const handleSubmit = (data: ExerciseFormData) => {
    onSubmit(data as unknown as InsertExercise);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Module Code */}
          <FormField
            control={form.control}
            name="moduleCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moduł *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-module">
                      <SelectValue placeholder="Wybierz moduł" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {topics?.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Exercise Type */}
          <FormField
            control={form.control}
            name="exerciseType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Typ ćwiczenia *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-exercise-type">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="single_choice">Jednokrotny wybór</SelectItem>
                    <SelectItem value="multiple_choice">Wielokrotny wybór</SelectItem>
                    <SelectItem value="numerical">Numeryczne</SelectItem>
                    <SelectItem value="algebraic">Algebraiczne</SelectItem>
                    <SelectItem value="word_problem">Zadanie słowne</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tytuł *</FormLabel>
              <FormControl>
                <Input placeholder="Np. Dodawanie ułamków zwykłych" {...field} data-testid="input-title" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Opis</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Krótki opis ćwiczenia..." 
                  {...field} 
                  rows={2}
                  data-testid="textarea-description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Question */}
        <FormField
          control={form.control}
          name="question"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Treść pytania *</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Wpisz treść pytania..." 
                  {...field} 
                  rows={3}
                  data-testid="textarea-question"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Options - only for choice types */}
        {showOptions && (
          <FormField
            control={form.control}
            name="options"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Opcje odpowiedzi * (JSON)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder={'["Opcja A", "Opcja B", "Opcja C", "Opcja D"]'} 
                    {...field} 
                    rows={4}
                    data-testid="textarea-options"
                  />
                </FormControl>
                <FormDescription>
                  Tablica JSON z opcjami odpowiedzi
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Correct Answer */}
        <FormField
          control={form.control}
          name="correctAnswer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Poprawna odpowiedź * (JSON)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder={showOptions ? '"Opcja A"' : '42'} 
                  {...field} 
                  rows={2}
                  data-testid="textarea-correct-answer"
                />
              </FormControl>
              <FormDescription>
                {showOptions 
                  ? "Dla single_choice: string, dla multiple_choice: tablica stringów" 
                  : "Wartość liczbowa lub string w formacie JSON"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Solution Steps */}
        <FormField
          control={form.control}
          name="solutionSteps"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kroki rozwiązania (JSON)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder={'[{"step": "Krok 1", "explanation": "Wyjaśnienie"}]'} 
                  {...field} 
                  rows={4}
                  data-testid="textarea-solution-steps"
                />
              </FormControl>
              <FormDescription>
                Tablica JSON z obiektami zawierającymi step i explanation
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Hints */}
        <FormField
          control={form.control}
          name="hints"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Podpowiedzi (JSON)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder={'["Podpowiedź 1", "Podpowiedź 2"]'} 
                  {...field} 
                  rows={3}
                  data-testid="textarea-hints"
                />
              </FormControl>
              <FormDescription>
                Tablica JSON z podpowiedziami
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Difficulty */}
          <FormField
            control={form.control}
            name="difficulty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Poziom trudności *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-difficulty">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="easy">Łatwy</SelectItem>
                    <SelectItem value="medium">Średni</SelectItem>
                    <SelectItem value="hard">Trudny</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Points */}
          <FormField
            control={form.control}
            name="points"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Punkty *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                    data-testid="input-points"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Is Active */}
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-8">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-is-active"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Aktywne</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            data-testid="button-cancel"
          >
            Anuluj
          </Button>
          <Button 
            type="submit" 
            className="bg-[#5F5AFC] hover:bg-[#4F4AEC]"
            data-testid="button-submit"
          >
            {exercise ? "Zapisz zmiany" : "Utwórz ćwiczenie"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function AdminExerciseManagement() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [deletingExercise, setDeletingExercise] = useState<Exercise | null>(null);
  const [moduleFilter, setModuleFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");

  // Fetch all exercises
  const { data: exercises, isLoading } = useQuery<Exercise[]>({
    queryKey: ["/api/admin/exercises"],
  });

  // Fetch math topics for module select
  const { data: topics } = useQuery<MathTopic[]>({
    queryKey: ["/api/math-topics"],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertExercise) => {
      return apiRequest("/api/admin/exercises", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/exercises"] });
      setShowCreateDialog(false);
      toast({ title: "✅ Ćwiczenie utworzone pomyślnie" });
    },
    onError: (error: any) => {
      toast({ 
        title: "❌ Błąd", 
        description: error.message || "Nie udało się utworzyć ćwiczenia",
        variant: "destructive" 
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertExercise }) => {
      return apiRequest(`/api/admin/exercises/${id}`, "PATCH", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/exercises"] });
      setEditingExercise(null);
      toast({ title: "✅ Ćwiczenie zaktualizowane pomyślnie" });
    },
    onError: (error: any) => {
      toast({ 
        title: "❌ Błąd", 
        description: error.message || "Nie udało się zaktualizować ćwiczenia",
        variant: "destructive" 
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/admin/exercises/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/exercises"] });
      setDeletingExercise(null);
      toast({ title: "✅ Ćwiczenie usunięte pomyślnie" });
    },
    onError: (error: any) => {
      toast({ 
        title: "❌ Błąd", 
        description: error.message || "Nie udało się usunąć ćwiczenia",
        variant: "destructive" 
      });
    },
  });

  // Filter exercises
  const filteredExercises = useMemo(() => {
    let filtered = exercises || [];

    if (moduleFilter !== "all") {
      filtered = filtered.filter((e) => e.moduleCode === moduleFilter);
    }

    if (difficultyFilter !== "all") {
      filtered = filtered.filter((e) => e.difficulty === difficultyFilter);
    }

    if (activeFilter === "active") {
      filtered = filtered.filter((e) => e.isActive);
    } else if (activeFilter === "inactive") {
      filtered = filtered.filter((e) => !e.isActive);
    }

    return filtered;
  }, [exercises, moduleFilter, difficultyFilter, activeFilter]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="heading-title">
              Zarządzanie Ćwiczeniami
            </h1>
            <p className="text-slate-600" data-testid="text-description">
              Twórz i edytuj ćwiczenia dla modułów Matemaster
            </p>
          </div>

          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-[#5F5AFC] hover:bg-[#4F4AEC]"
            data-testid="button-create-exercise"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nowe ćwiczenie
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-slate-600 mb-2 block">Moduł</label>
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger data-testid="select-module-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie moduły</SelectItem>
                  {topics?.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-slate-600 mb-2 block">Poziom</label>
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger data-testid="select-difficulty-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie poziomy</SelectItem>
                  <SelectItem value="easy">Łatwy</SelectItem>
                  <SelectItem value="medium">Średni</SelectItem>
                  <SelectItem value="hard">Trudny</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-slate-600 mb-2 block">Status</label>
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger data-testid="select-active-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie</SelectItem>
                  <SelectItem value="active">Aktywne</SelectItem>
                  <SelectItem value="inactive">Nieaktywne</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Exercises Table */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20" data-testid={`skeleton-${i}`} />
            ))}
          </div>
        ) : filteredExercises.length === 0 ? (
          <Card className="p-8 text-center text-slate-500">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p data-testid="text-no-exercises">
              Brak ćwiczeń spełniających kryteria filtrów
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredExercises.map((exercise) => (
              <Card
                key={exercise.id}
                className="p-6"
                data-testid={`card-exercise-${exercise.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold" data-testid={`text-title-${exercise.id}`}>
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
                          ? "Łatwy"
                          : exercise.difficulty === "medium"
                          ? "Średni"
                          : "Trudny"}
                      </Badge>
                      {!exercise.isActive && (
                        <Badge 
                          variant="outline" 
                          className="text-slate-500"
                          data-testid={`badge-inactive-${exercise.id}`}
                        >
                          Nieaktywne
                        </Badge>
                      )}
                    </div>

                    {exercise.description && (
                      <p className="text-slate-600 text-sm mb-3" data-testid={`text-description-${exercise.id}`}>
                        {exercise.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span data-testid={`text-module-${exercise.id}`}>
                        Moduł: {exercise.moduleCode}
                      </span>
                      <span>•</span>
                      <span data-testid={`text-type-${exercise.id}`}>
                        Typ: {exercise.exerciseType}
                      </span>
                      <span>•</span>
                      <span data-testid={`text-points-${exercise.id}`}>
                        {exercise.points} pkt
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingExercise(exercise)}
                      data-testid={`button-edit-${exercise.id}`}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edytuj
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeletingExercise(exercise)}
                      data-testid={`button-delete-${exercise.id}`}
                    >
                      <Trash className="w-4 h-4 mr-1" />
                      Usuń
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Utwórz nowe ćwiczenie</DialogTitle>
            </DialogHeader>
            <ExerciseForm
              onSubmit={(data) => createMutation.mutate(data)}
              onCancel={() => setShowCreateDialog(false)}
              topics={topics}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog
          open={!!editingExercise}
          onOpenChange={(open) => !open && setEditingExercise(null)}
        >
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edytuj ćwiczenie</DialogTitle>
            </DialogHeader>
            {editingExercise && (
              <ExerciseForm
                exercise={editingExercise}
                onSubmit={(data) =>
                  updateMutation.mutate({ id: editingExercise.id, data })
                }
                onCancel={() => setEditingExercise(null)}
                topics={topics}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!deletingExercise}
          onOpenChange={(open) => !open && setDeletingExercise(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Czy na pewno chcesz usunąć to ćwiczenie?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Ta akcja jest nieodwracalna. Wszystkie próby studentów związane z
                tym ćwiczeniem również zostaną usunięte.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">
                Anuluj
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  deletingExercise && deleteMutation.mutate(deletingExercise.id)
                }
                className="bg-red-600 hover:bg-red-700"
                data-testid="button-confirm-delete"
              >
                Usuń
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
