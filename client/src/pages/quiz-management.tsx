import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Plus, Edit, Trash, FileQuestion, Trophy, ArrowLeft, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import SchoolMasterLogo from "@/assets/schoolmaster-logo.png";

// Form schemas
const questionFormSchema = z.object({
  questionType: z.enum(['multiple_choice', 'multiple_select', 'true_false', 'short_answer', 'math_problem']),
  questionText: z.string().min(1, "Treść pytania jest wymagana"),
  options: z.string().optional(),
  correctAnswer: z.string().min(1, "Poprawna odpowiedź jest wymagana"),
  points: z.number().min(1, "Minimalna liczba punktów to 1"),
  moduleCode: z.string().min(1, "Kod modułu jest wymagany"),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  explanation: z.string().optional(),
});

const quizFormSchema = z.object({
  title: z.string().min(1, "Tytuł jest wymagany"),
  moduleCode: z.string().min(1, "Kod modułu jest wymagany"),
  description: z.string().optional(),
  timeLimit: z.number().optional(),
  passingScore: z.number().min(0).max(100),
  xpReward: z.number().min(0),
  isRequired: z.boolean(),
  maxAttempts: z.number().optional(),
});

type QuestionFormData = z.infer<typeof questionFormSchema>;
type QuizFormData = z.infer<typeof quizFormSchema>;

const questionTypeLabels: Record<string, string> = {
  multiple_choice: "Wybór jednokrotny",
  multiple_select: "Wybór wielokrotny",
  true_false: "Prawda/Fałsz",
  short_answer: "Krótka odpowiedź",
  math_problem: "Problem matematyczny",
};

const difficultyLabels: Record<string, string> = {
  easy: "Łatwy",
  medium: "Średni",
  hard: "Trudny",
};

export default function QuizManagement() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, logout } = useAdminAuth();
  const [, setLocation] = useLocation();
  
  // State management
  const [activeTab, setActiveTab] = useState("questions");
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [isQuestionManagerOpen, setIsQuestionManagerOpen] = useState(false);
  const [addQuestionFilter, setAddQuestionFilter] = useState('all');
  const [addQuestionSearch, setAddQuestionSearch] = useState('');

  // Forms
  const questionForm = useForm<QuestionFormData>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      questionType: 'multiple_choice',
      questionText: '',
      options: '',
      correctAnswer: '',
      points: 1,
      moduleCode: '',
      difficulty: 'medium',
      explanation: '',
    },
  });

  const quizForm = useForm<QuizFormData>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: {
      title: '',
      moduleCode: '',
      description: '',
      timeLimit: undefined,
      passingScore: 80,
      xpReward: 50,
      isRequired: false,
      maxAttempts: undefined,
    },
  });

  const watchQuestionType = questionForm.watch('questionType');

  // Check authentication
  if (!isLoading && !isAuthenticated) {
    toast({
      title: "Unauthorized",
      description: "Redirecting to login...",
      variant: "destructive",
    });
    setTimeout(() => setLocation("/admin-login"), 500);
    return null;
  }

  // Queries
  const { data: questions = [], isLoading: isLoadingQuestions } = useQuery({
    queryKey: ['/api/admin/questions'],
    enabled: isAuthenticated,
  });

  const { data: quizzes = [], isLoading: isLoadingQuizzes } = useQuery({
    queryKey: ['/api/admin/quizzes'],
    enabled: isAuthenticated,
  });

  const { data: quizQuestions = [] } = useQuery({
    queryKey: ['/api/quizzes', selectedQuiz?.id, 'questions'],
    enabled: !!selectedQuiz?.id,
  });

  // Mutations for questions
  const addQuestionMutation = useMutation({
    mutationFn: async (data: any) => {
      // Convert options string to JSON array
      const formattedData = {
        ...data,
        options: data.options && data.options.trim() 
          ? data.options.split('\n').filter((line: string) => line.trim())
          : null,
        correctAnswer: data.correctAnswer,
      };
      return apiRequest('/api/admin/questions', 'POST', formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/questions'] });
      setIsQuestionDialogOpen(false);
      questionForm.reset();
      toast({
        title: "Sukces",
        description: "Pytanie zostało dodane",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się dodać pytania",
        variant: "destructive",
      });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async (data: any) => {
      const formattedData = {
        ...data,
        options: data.options && data.options.trim()
          ? data.options.split('\n').filter((line: string) => line.trim())
          : null,
      };
      return apiRequest(`/api/admin/questions/${selectedQuestion.id}`, 'PATCH', formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/questions'] });
      setIsQuestionDialogOpen(false);
      questionForm.reset();
      setSelectedQuestion(null);
      toast({
        title: "Sukces",
        description: "Pytanie zostało zaktualizowane",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się zaktualizować pytania",
        variant: "destructive",
      });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/admin/questions/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/questions'] });
      toast({
        title: "Sukces",
        description: "Pytanie zostało usunięte",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się usunąć pytania",
        variant: "destructive",
      });
    },
  });

  // Mutations for quizzes
  const addQuizMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/admin/quizzes', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/quizzes'] });
      setIsQuizDialogOpen(false);
      quizForm.reset();
      toast({
        title: "Sukces",
        description: "Quiz został dodany",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się dodać quizu",
        variant: "destructive",
      });
    },
  });

  const updateQuizMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/admin/quizzes/${selectedQuiz.id}`, 'PATCH', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/quizzes'] });
      setIsQuizDialogOpen(false);
      quizForm.reset();
      setSelectedQuiz(null);
      toast({
        title: "Sukces",
        description: "Quiz został zaktualizowany",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się zaktualizować quizu",
        variant: "destructive",
      });
    },
  });

  const deleteQuizMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/admin/quizzes/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/quizzes'] });
      toast({
        title: "Sukces",
        description: "Quiz został usunięty",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się usunąć quizu",
        variant: "destructive",
      });
    },
  });

  // Mutations for managing questions in quiz
  const addQuestionToQuizMutation = useMutation({
    mutationFn: async ({ quizId, questionId }: { quizId: string; questionId: string }) => {
      const maxOrder = quizQuestions.length > 0 
        ? Math.max(...(quizQuestions as any[]).map((qq: any) => qq.order))
        : 0;
      
      return apiRequest(`/api/quizzes/${quizId}/questions`, 'POST', {
        questionId,
        order: maxOrder + 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quizzes', selectedQuiz?.id, 'questions'] });
      toast({
        title: 'Sukces',
        description: 'Pytanie dodane do quizu',
      });
    },
    onError: () => {
      toast({
        title: 'Błąd',
        description: 'Nie udało się dodać pytania',
        variant: 'destructive',
      });
    },
  });

  const removeQuestionMutation = useMutation({
    mutationFn: async ({ quizId, questionId }: { quizId: string; questionId: string }) => {
      return apiRequest(`/api/quizzes/${quizId}/questions/${questionId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quizzes', selectedQuiz?.id, 'questions'] });
      toast({
        title: 'Sukces',
        description: 'Pytanie usunięte z quizu',
      });
    },
    onError: () => {
      toast({
        title: 'Błąd',
        description: 'Nie udało się usunąć pytania',
        variant: 'destructive',
      });
    },
  });

  // Handlers
  const openQuestionDialog = (mode: 'add' | 'edit', question?: any) => {
    setDialogMode(mode);
    if (mode === 'edit' && question) {
      setSelectedQuestion(question);
      questionForm.reset({
        questionType: question.questionType,
        questionText: question.questionText,
        options: Array.isArray(question.options) ? question.options.join('\n') : '',
        correctAnswer: typeof question.correctAnswer === 'object' 
          ? JSON.stringify(question.correctAnswer)
          : String(question.correctAnswer),
        points: question.points,
        moduleCode: question.moduleCode,
        difficulty: question.difficulty,
        explanation: question.explanation || '',
      });
    } else {
      setSelectedQuestion(null);
      questionForm.reset();
    }
    setIsQuestionDialogOpen(true);
  };

  const openQuizDialog = (mode: 'add' | 'edit', quiz?: any) => {
    setDialogMode(mode);
    if (mode === 'edit' && quiz) {
      setSelectedQuiz(quiz);
      quizForm.reset({
        title: quiz.title,
        moduleCode: quiz.moduleCode,
        description: quiz.description || '',
        timeLimit: quiz.timeLimit || undefined,
        passingScore: quiz.passingScore,
        xpReward: quiz.xpReward,
        isRequired: quiz.isRequired || false,
        maxAttempts: quiz.maxAttempts || undefined,
      });
    } else {
      setSelectedQuiz(null);
      quizForm.reset();
    }
    setIsQuizDialogOpen(true);
  };

  const onSubmitQuestion = (data: QuestionFormData) => {
    if (dialogMode === 'add') {
      addQuestionMutation.mutate(data);
    } else {
      updateQuestionMutation.mutate(data);
    }
  };

  const onSubmitQuiz = (data: QuizFormData) => {
    const formattedData = {
      ...data,
      isActive: true,
    };
    if (dialogMode === 'add') {
      addQuizMutation.mutate(formattedData);
    } else {
      updateQuizMutation.mutate(formattedData);
    }
  };

  const handleDeleteQuestion = (id: string) => {
    if (confirm("Czy na pewno chcesz usunąć to pytanie?")) {
      deleteQuestionMutation.mutate(id);
    }
  };

  const handleDeleteQuiz = (id: string) => {
    if (confirm("Czy na pewno chcesz usunąć ten quiz?")) {
      deleteQuizMutation.mutate(id);
    }
  };

  const openQuestionManagerDialog = (quizId: string) => {
    const quiz = (quizzes as any[]).find((q: any) => q.id === quizId);
    setSelectedQuiz(quiz);
    setIsQuestionManagerOpen(true);
    setAddQuestionFilter('all');
    setAddQuestionSearch('');
  };

  const handleAddQuestionToQuiz = (quizId: string, questionId: string) => {
    addQuestionToQuizMutation.mutate({ quizId, questionId });
  };

  const handleRemoveQuestionFromQuiz = (quizId: string, questionId: string) => {
    removeQuestionMutation.mutate({ quizId, questionId });
  };

  const handleLogout = async () => {
    try {
      await logout();
      setLocation("/admin-login");
    } catch (error) {
      toast({
        title: "Logout Error",
        description: "Failed to logout properly",
        variant: "destructive",
      });
    }
  };

  // Filter questions
  const filteredQuestions = useMemo(() => {
    if (!questions) return [];
    return questions.filter((q: any) => {
      const typeMatch = filterType === 'all' || q.questionType === filterType;
      const searchMatch = !searchQuery || 
        q.questionText.toLowerCase().includes(searchQuery.toLowerCase());
      return typeMatch && searchMatch;
    });
  }, [questions, filterType, searchQuery]);

  // Calculate available questions (not in quiz)
  const availableQuestions = useMemo(() => {
    if (!questions || !quizQuestions) return [];
    
    const quizQuestionIds = new Set(
      (quizQuestions as any[]).map((qq: any) => qq.questionId)
    );
    
    let filtered = (questions as any[]).filter(
      (q: any) => !quizQuestionIds.has(q.id)
    );
    
    if (addQuestionFilter !== 'all') {
      filtered = filtered.filter((q: any) => q.questionType === addQuestionFilter);
    }
    
    if (addQuestionSearch) {
      filtered = filtered.filter((q: any) => 
        q.questionText.toLowerCase().includes(addQuestionSearch.toLowerCase())
      );
    }
    
    return filtered;
  }, [questions, quizQuestions, addQuestionFilter, addQuestionSearch]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <img 
                src={SchoolMasterLogo} 
                alt="SchoolMaster" 
                className="h-6"
              />
              <span className="text-sm bg-navy-100 text-navy-800 px-2 py-1 rounded-full">
                Admin
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/admin-dashboard')}
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Powrót do panelu
              </Button>
              <Button onClick={handleLogout} variant="outline" data-testid="button-logout">
                Wyloguj się
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy-900" data-testid="text-title">
            Zarządzanie Quizami i Pytaniami
          </h1>
          <p className="text-gray-600">
            Dodawaj, edytuj i zarządzaj pytaniami i quizami
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="questions" className="flex items-center gap-2" data-testid="tab-questions">
              <FileQuestion className="w-4 h-4" />
              Bank Pytań
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="flex items-center gap-2" data-testid="tab-quizzes">
              <Trophy className="w-4 h-4" />
              Quizy
            </TabsTrigger>
          </TabsList>

          {/* Question Bank Tab */}
          <TabsContent value="questions" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-navy-900">Bank Pytań</h2>
              <Button onClick={() => openQuestionDialog('add')} data-testid="button-add-question">
                <Plus className="w-4 h-4 mr-2" />
                Dodaj pytanie
              </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[200px]" data-testid="select-filter-type">
                  <SelectValue placeholder="Typ pytania" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie typy</SelectItem>
                  <SelectItem value="multiple_choice">Wybór jednokrotny</SelectItem>
                  <SelectItem value="multiple_select">Wybór wielokrotny</SelectItem>
                  <SelectItem value="true_false">Prawda/Fałsz</SelectItem>
                  <SelectItem value="short_answer">Krótka odpowiedź</SelectItem>
                  <SelectItem value="math_problem">Problem matematyczny</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Szukaj w treści pytania..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
                data-testid="input-search-question"
              />
            </div>

            {/* Questions Table */}
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Typ</TableHead>
                    <TableHead>Treść pytania</TableHead>
                    <TableHead>Punkty</TableHead>
                    <TableHead>Poziom</TableHead>
                    <TableHead>Moduł</TableHead>
                    <TableHead>Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingQuestions ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Ładowanie pytań...
                      </TableCell>
                    </TableRow>
                  ) : filteredQuestions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Brak pytań do wyświetlenia
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredQuestions.map((question: any) => (
                      <TableRow key={question.id} data-testid={`row-question-${question.id}`}>
                        <TableCell>
                          <Badge>{questionTypeLabels[question.questionType]}</Badge>
                        </TableCell>
                        <TableCell className="max-w-md truncate" data-testid={`text-question-${question.id}`}>
                          {question.questionText}
                        </TableCell>
                        <TableCell>{question.points}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{difficultyLabels[question.difficulty]}</Badge>
                        </TableCell>
                        <TableCell>{question.moduleCode || '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => openQuestionDialog('edit', question)}
                              data-testid={`button-edit-question-${question.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => handleDeleteQuestion(question.id)}
                              data-testid={`button-delete-question-${question.id}`}
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Quiz Composer Tab */}
          <TabsContent value="quizzes" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-navy-900">Quizy</h2>
              <Button onClick={() => openQuizDialog('add')} data-testid="button-add-quiz">
                <Plus className="w-4 h-4 mr-2" />
                Utwórz quiz
              </Button>
            </div>

            {/* Quizzes List */}
            <div className="space-y-4">
              {isLoadingQuizzes ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    Ładowanie quizów...
                  </CardContent>
                </Card>
              ) : quizzes.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    Brak quizów do wyświetlenia
                  </CardContent>
                </Card>
              ) : (
                quizzes.map((quiz: any) => (
                  <Card key={quiz.id} data-testid={`card-quiz-${quiz.id}`}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle data-testid={`text-quiz-title-${quiz.id}`}>{quiz.title}</CardTitle>
                          <p className="text-sm text-gray-500">{quiz.moduleCode}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => openQuizDialog('edit', quiz)}
                            data-testid={`button-edit-quiz-${quiz.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleDeleteQuiz(quiz.id)}
                            data-testid={`button-delete-quiz-${quiz.id}`}
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-gray-500">Limit czasu:</span>{' '}
                          {quiz.timeLimit ? `${quiz.timeLimit} min` : 'Brak'}
                        </div>
                        <div>
                          <span className="text-gray-500">Próg zdania:</span> {quiz.passingScore}%
                        </div>
                        <div>
                          <span className="text-gray-500">Nagroda XP:</span> {quiz.xpReward}
                        </div>
                      </div>
                      <div className="pt-4 border-t">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => openQuestionManagerDialog(quiz.id)}
                          data-testid={`button-manage-questions-${quiz.id}`}
                        >
                          <FileQuestion className="w-4 h-4 mr-2" />
                          Zarządzaj pytaniami
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Question Dialog */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-question">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'add' ? 'Dodaj pytanie' : 'Edytuj pytanie'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'add' 
                ? 'Wypełnij pola poniżej, aby dodać nowe pytanie do banku pytań.'
                : 'Edytuj pola poniżej, aby zaktualizować pytanie.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...questionForm}>
            <form onSubmit={questionForm.handleSubmit(onSubmitQuestion)} className="space-y-4">
              {/* Question Type */}
              <FormField
                control={questionForm.control}
                name="questionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Typ pytania</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger data-testid="select-question-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple_choice">Wybór jednokrotny</SelectItem>
                        <SelectItem value="multiple_select">Wybór wielokrotny</SelectItem>
                        <SelectItem value="true_false">Prawda/Fałsz</SelectItem>
                        <SelectItem value="short_answer">Krótka odpowiedź</SelectItem>
                        <SelectItem value="math_problem">Problem matematyczny</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {/* Question Text */}
              <FormField
                control={questionForm.control}
                name="questionText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Treść pytania</FormLabel>
                    <Textarea {...field} rows={3} data-testid="input-question-text" />
                  </FormItem>
                )}
              />

              {/* Module Code */}
              <FormField
                control={questionForm.control}
                name="moduleCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kod modułu</FormLabel>
                    <Input {...field} placeholder="np. MAT-L01" data-testid="input-module-code" />
                    <FormDescription>Identyfikator tematu/modułu</FormDescription>
                  </FormItem>
                )}
              />

              {/* Options (for multiple choice/select) */}
              {(watchQuestionType === 'multiple_choice' || watchQuestionType === 'multiple_select') && (
                <FormField
                  control={questionForm.control}
                  name="options"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opcje odpowiedzi (jedna na linię)</FormLabel>
                      <Textarea 
                        {...field} 
                        rows={4} 
                        placeholder="A. Opcja 1&#10;B. Opcja 2&#10;C. Opcja 3&#10;D. Opcja 4"
                        data-testid="input-options"
                      />
                      <FormDescription>Wpisz każdą opcję w nowej linii</FormDescription>
                    </FormItem>
                  )}
                />
              )}

              {/* Correct Answer */}
              <FormField
                control={questionForm.control}
                name="correctAnswer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Poprawna odpowiedź</FormLabel>
                    {watchQuestionType === 'multiple_choice' ? (
                      <Input {...field} placeholder="np. A" data-testid="input-correct-answer" />
                    ) : watchQuestionType === 'multiple_select' ? (
                      <Input {...field} placeholder="np. A,C (oddzielone przecinkami)" data-testid="input-correct-answer" />
                    ) : watchQuestionType === 'true_false' ? (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger data-testid="select-correct-answer">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Prawda</SelectItem>
                          <SelectItem value="false">Fałsz</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input {...field} placeholder="Wpisz poprawną odpowiedź" data-testid="input-correct-answer" />
                    )}
                  </FormItem>
                )}
              />

              {/* Points */}
              <FormField
                control={questionForm.control}
                name="points"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Punkty</FormLabel>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      data-testid="input-points"
                    />
                  </FormItem>
                )}
              />

              {/* Difficulty */}
              <FormField
                control={questionForm.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Poziom trudności</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger data-testid="select-difficulty">
                        <SelectValue placeholder="Wybierz poziom" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Łatwy</SelectItem>
                        <SelectItem value="medium">Średni</SelectItem>
                        <SelectItem value="hard">Trudny</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {/* Explanation */}
              <FormField
                control={questionForm.control}
                name="explanation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wyjaśnienie (opcjonalnie)</FormLabel>
                    <Textarea {...field} rows={2} data-testid="input-explanation" />
                    <FormDescription>Wyjaśnienie dla uczniów po udzieleniu odpowiedzi</FormDescription>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsQuestionDialogOpen(false)}
                  data-testid="button-cancel-question"
                >
                  Anuluj
                </Button>
                <Button 
                  type="submit" 
                  disabled={addQuestionMutation.isPending || updateQuestionMutation.isPending}
                  data-testid="button-submit-question"
                >
                  {dialogMode === 'add' ? 'Dodaj' : 'Zapisz'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Quiz Dialog */}
      <Dialog open={isQuizDialogOpen} onOpenChange={setIsQuizDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-quiz">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'add' ? 'Utwórz quiz' : 'Edytuj quiz'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'add' 
                ? 'Wypełnij pola poniżej, aby utworzyć nowy quiz.'
                : 'Edytuj pola poniżej, aby zaktualizować quiz.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...quizForm}>
            <form onSubmit={quizForm.handleSubmit(onSubmitQuiz)} className="space-y-4">
              {/* Title */}
              <FormField
                control={quizForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tytuł</FormLabel>
                    <Input {...field} data-testid="input-quiz-title" />
                  </FormItem>
                )}
              />

              {/* Module Code */}
              <FormField
                control={quizForm.control}
                name="moduleCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kod modułu</FormLabel>
                    <Input {...field} placeholder="np. MAT-L01" data-testid="input-quiz-module-code" />
                    <FormDescription>Identyfikator tematu/modułu</FormDescription>
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={quizForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opis (opcjonalnie)</FormLabel>
                    <Textarea {...field} rows={2} data-testid="input-quiz-description" />
                  </FormItem>
                )}
              />

              {/* Time Limit */}
              <FormField
                control={quizForm.control}
                name="timeLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Limit czasu (minuty, opcjonalnie)</FormLabel>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      data-testid="input-time-limit"
                    />
                  </FormItem>
                )}
              />

              {/* Passing Score */}
              <FormField
                control={quizForm.control}
                name="passingScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Próg zdania (%)</FormLabel>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      data-testid="input-passing-score"
                    />
                  </FormItem>
                )}
              />

              {/* XP Reward */}
              <FormField
                control={quizForm.control}
                name="xpReward"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nagroda XP</FormLabel>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      data-testid="input-xp-reward"
                    />
                  </FormItem>
                )}
              />

              {/* Max Attempts */}
              <FormField
                control={quizForm.control}
                name="maxAttempts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maksymalna liczba prób (opcjonalnie)</FormLabel>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      data-testid="input-max-attempts"
                    />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsQuizDialogOpen(false)}
                  data-testid="button-cancel-quiz"
                >
                  Anuluj
                </Button>
                <Button 
                  type="submit" 
                  disabled={addQuizMutation.isPending || updateQuizMutation.isPending}
                  data-testid="button-submit-quiz"
                >
                  {dialogMode === 'add' ? 'Utwórz' : 'Zapisz'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Question Manager Dialog */}
      <Dialog open={isQuestionManagerOpen} onOpenChange={setIsQuestionManagerOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" data-testid="dialog-question-manager">
          <DialogHeader>
            <DialogTitle>Zarządzaj pytaniami - {selectedQuiz?.title}</DialogTitle>
            <DialogDescription>
              Dodaj lub usuń pytania z tego quizu
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current Questions in Quiz */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Pytania w quizie ({quizQuestions.length})</h3>
              {quizQuestions.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">
                  Brak pytań w tym quizie. Dodaj pytania poniżej.
                </p>
              ) : (
                <div className="space-y-2">
                  {quizQuestions.map((qq: any, index: number) => (
                    <Card key={qq.questionId} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Badge className="text-xs">{index + 1}</Badge>
                            <div>
                              <p className="font-medium">{qq.question.questionText}</p>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {questionTypeLabels[qq.question.questionType]}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {qq.question.points} pkt
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveQuestionFromQuiz(selectedQuiz!.id, qq.questionId)}
                          disabled={removeQuestionMutation.isPending}
                          data-testid={`button-remove-question-${qq.questionId}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Available Questions to Add */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Dostępne pytania</h3>
              
              {/* Filter */}
              <div className="flex gap-4 mb-4">
                <Select value={addQuestionFilter} onValueChange={setAddQuestionFilter}>
                  <SelectTrigger className="w-[200px]" data-testid="select-add-question-filter">
                    <SelectValue placeholder="Filtruj po typie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszystkie typy</SelectItem>
                    <SelectItem value="multiple_choice">Wybór jednokrotny</SelectItem>
                    <SelectItem value="multiple_select">Wybór wielokrotny</SelectItem>
                    <SelectItem value="true_false">Prawda/Fałsz</SelectItem>
                    <SelectItem value="short_answer">Krótka odpowiedź</SelectItem>
                    <SelectItem value="math_problem">Problem matematyczny</SelectItem>
                  </SelectContent>
                </Select>
                
                <Input
                  placeholder="Szukaj..."
                  value={addQuestionSearch}
                  onChange={(e) => setAddQuestionSearch(e.target.value)}
                  className="flex-1"
                  data-testid="input-add-question-search"
                />
              </div>

              {/* Available Questions List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {availableQuestions.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4 text-center">
                    Brak dostępnych pytań do dodania
                  </p>
                ) : (
                  availableQuestions.map((question: any) => (
                    <Card key={question.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{question.questionText}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {questionTypeLabels[question.questionType]}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {question.points} pkt
                            </span>
                            {question.moduleCode && (
                              <span className="text-xs text-gray-500">
                                {question.moduleCode}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAddQuestionToQuiz(selectedQuiz!.id, question.id)}
                          disabled={addQuestionToQuizMutation.isPending}
                          data-testid={`button-add-question-${question.id}`}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Dodaj
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsQuestionManagerOpen(false)}
              data-testid="button-close-question-manager"
            >
              Zamknij
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
