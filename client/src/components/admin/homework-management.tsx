import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { FileText, Calendar, Target, User, Eye, Clock, CheckCircle, Filter, Plus, Sparkles, CalendarIcon } from "lucide-react";

interface HomeworkAssignment {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  dueDate: string;
  totalTasks: number;
  status: "assigned" | "submitted" | "graded";
  studentAnswer?: string | null;
  grade: string | null;
  feedback: string | null;
  studentName: string;
  subjectId?: string;
  subjectName?: string;
  createdAt: string;
  updatedAt: string;
}

interface Student {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface Lesson {
  id: string;
  title: string;
  scheduledAt: string;
  studentId: string;
  tutorId: string;
}

export default function HomeworkManagement() {
  const [selectedHomework, setSelectedHomework] = useState<HomeworkAssignment | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAIGradeDialogOpen, setIsAIGradeDialogOpen] = useState(false);
  const [currentHomeworkForAI, setCurrentHomeworkForAI] = useState<HomeworkAssignment | null>(null);
  const [studentAnswerInput, setStudentAnswerInput] = useState("");
  const [aiGradeResult, setAiGradeResult] = useState<{ grade: number; feedback: string } | null>(null);

  // Form state for adding homework
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date>();
  const [totalTasks, setTotalTasks] = useState<number>(1);

  const { toast } = useToast();

  const { data: homeworkData, isLoading } = useQuery({
    queryKey: ["/api/admin/homework"],
    retry: false,
  });

  const { data: subjects } = useQuery({
    queryKey: ["/api/subjects"],
    retry: false,
  });

  const { data: students } = useQuery<Student[]>({
    queryKey: ["/api/admin/students"],
    retry: false,
  });

  const { data: lessons } = useQuery<Lesson[]>({
    queryKey: ["/api/admin/lessons"],
    enabled: !!selectedStudentId,
    retry: false,
  });

  // Filter lessons for selected student
  const studentLessons = lessons?.filter(lesson => lesson.studentId === selectedStudentId) || [];

  // Create homework mutation
  const createHomeworkMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("/api/admin/homework", "POST", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/homework"] });
      toast({
        title: "Sukces",
        description: "Praca domowa została dodana pomyślnie",
      });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się dodać pracy domowej",
        variant: "destructive",
      });
    },
  });

  // AI grading mutation
  const aiGradeMutation = useMutation({
    mutationFn: async ({ id, studentAnswer }: { id: string; studentAnswer: string }) => {
      const res = await apiRequest(`/api/admin/homework/${id}/auto-grade`, "POST", { studentAnswer });
      return await res.json();
    },
    onSuccess: (data: any) => {
      setAiGradeResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/homework"] });
      toast({
        title: "Sprawdzono przez AI",
        description: `Ocena: ${data.grade}/100`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się sprawdzić pracy",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedStudentId("");
    setSelectedLessonId("");
    setTitle("");
    setDescription("");
    setDueDate(undefined);
    setTotalTasks(1);
  };

  const handleCreateHomework = () => {
    if (!selectedLessonId || !title || !dueDate || totalTasks < 1) {
      toast({
        title: "Błąd",
        description: "Wszystkie pola są wymagane",
        variant: "destructive",
      });
      return;
    }

    createHomeworkMutation.mutate({
      lessonId: selectedLessonId,
      title,
      description,
      dueDate: dueDate.toISOString(),
      totalTasks,
    });
  };

  const handleAIGrade = () => {
    if (!currentHomeworkForAI) return;
    
    const answerToGrade = currentHomeworkForAI.studentAnswer || studentAnswerInput;
    
    if (!answerToGrade || answerToGrade.trim().length === 0) {
      toast({
        title: "Błąd",
        description: "Odpowiedź ucznia jest wymagana",
        variant: "destructive",
      });
      return;
    }

    aiGradeMutation.mutate({
      id: currentHomeworkForAI.id,
      studentAnswer: answerToGrade,
    });
  };

  const openAIGradeDialog = (homework: HomeworkAssignment) => {
    setCurrentHomeworkForAI(homework);
    setStudentAnswerInput(homework.studentAnswer || "");
    setAiGradeResult(null);
    setIsAIGradeDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "assigned":
        return <Badge className="bg-yellow-100 text-yellow-800">Przypisane</Badge>;
      case "submitted":
        return <Badge className="bg-blue-100 text-blue-800">Przesłane</Badge>;
      case "graded":
        return <Badge className="bg-green-100 text-green-800">Ocenione</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "assigned":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "submitted":
        return <FileText className="w-4 h-4 text-blue-600" />;
      case "graded":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getFilteredHomework = (filter: string) => {
    if (!homeworkData || !Array.isArray(homeworkData)) return [];
    
    let filteredByStatus: HomeworkAssignment[] = [];
    switch (filter) {
      case "assigned":
        filteredByStatus = homeworkData.filter((h: HomeworkAssignment) => h.status === "assigned");
        break;
      case "submitted":
        filteredByStatus = homeworkData.filter((h: HomeworkAssignment) => h.status === "submitted");
        break;
      case "graded":
        filteredByStatus = homeworkData.filter((h: HomeworkAssignment) => h.status === "graded");
        break;
      default:
        filteredByStatus = homeworkData;
    }

    // Apply subject filter
    if (selectedSubjectId === "all") {
      return filteredByStatus;
    }
    return filteredByStatus.filter((h: HomeworkAssignment) => h.subjectId === selectedSubjectId);
  };

  const allHomework = (homeworkData && Array.isArray(homeworkData)) ? homeworkData : [];
  
  // Filter by subject first, then count by status
  const subjectFilteredHomework = selectedSubjectId === "all" 
    ? allHomework 
    : allHomework.filter((h: HomeworkAssignment) => h.subjectId === selectedSubjectId);
  
  const assignedCount = subjectFilteredHomework.filter((h: HomeworkAssignment) => h.status === "assigned").length;
  const submittedCount = subjectFilteredHomework.filter((h: HomeworkAssignment) => h.status === "submitted").length;
  const gradedCount = subjectFilteredHomework.filter((h: HomeworkAssignment) => h.status === "graded").length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-navy-900 flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Zarządzanie pracami domowymi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Ładowanie prac domowych...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-navy-900 flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Zarządzanie pracami domowymi
            </CardTitle>
            
            {/* Add Homework Button */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-navy-900 hover:bg-navy-800 text-white"
                  data-testid="button-add-homework"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Dodaj pracę domową
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-navy-900">
                    Dodaj nową pracę domową
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Student Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="student">Uczeń *</Label>
                    <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                      <SelectTrigger id="student" data-testid="select-student">
                        <SelectValue placeholder="Wybierz ucznia" />
                      </SelectTrigger>
                      <SelectContent>
                        {students?.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.firstName} {student.lastName} ({student.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Lesson Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="lesson">Lekcja *</Label>
                    <Select 
                      value={selectedLessonId} 
                      onValueChange={setSelectedLessonId}
                      disabled={!selectedStudentId}
                    >
                      <SelectTrigger id="lesson" data-testid="select-lesson">
                        <SelectValue placeholder={selectedStudentId ? "Wybierz lekcję" : "Najpierw wybierz ucznia"} />
                      </SelectTrigger>
                      <SelectContent>
                        {studentLessons.map((lesson) => (
                          <SelectItem key={lesson.id} value={lesson.id}>
                            {lesson.title} - {formatDate(lesson.scheduledAt)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Tytuł pracy *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="np. Zadania z algebry"
                      data-testid="input-title"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Opis / Treść zadania</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Opisz zadanie lub wklej treść..."
                      rows={4}
                      data-testid="textarea-description"
                    />
                  </div>

                  {/* Due Date */}
                  <div className="space-y-2">
                    <Label>Data oddania *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          data-testid="button-date-picker"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dueDate ? format(dueDate, "PPP", { locale: pl }) : "Wybierz datę"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarUI
                          mode="single"
                          selected={dueDate}
                          onSelect={setDueDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Total Tasks */}
                  <div className="space-y-2">
                    <Label htmlFor="totalTasks">Liczba zadań *</Label>
                    <Input
                      id="totalTasks"
                      type="number"
                      min="1"
                      value={totalTasks}
                      onChange={(e) => setTotalTasks(parseInt(e.target.value) || 1)}
                      data-testid="input-total-tasks"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                      data-testid="button-cancel-homework"
                    >
                      Anuluj
                    </Button>
                    <Button
                      onClick={handleCreateHomework}
                      disabled={createHomeworkMutation.isPending}
                      className="bg-navy-900 hover:bg-navy-800"
                      data-testid="button-submit-homework"
                    >
                      {createHomeworkMutation.isPending ? "Dodawanie..." : "Dodaj pracę domową"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Enhanced Subject Filter */}
          <div className="bg-navy-50 p-4 rounded-lg border border-navy-200 mt-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-navy-600" />
                <span className="text-sm font-semibold text-navy-700">Filtruj po przedmiocie:</span>
              </div>
              <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                <SelectTrigger className="w-72 bg-white border-navy-200" data-testid="select-subject-filter">
                  <SelectValue placeholder="Wybierz przedmiot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                      Wszystkie przedmioty
                    </div>
                  </SelectItem>
                  {(subjects as any[])?.map((subject: any) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        {subject.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Quick stats summary */}
            <div className="mt-3 flex items-center gap-6 text-sm text-navy-600">
              <span>
                <strong>Wybrano:</strong> {selectedSubjectId === "all" ? "Wszystkie przedmioty" : (subjects as any[])?.find((s: any) => s.id === selectedSubjectId)?.name}
              </span>
              <span>
                <strong>Łącznie prac:</strong> {subjectFilteredHomework.length}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Enhanced Statistics with subject info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Wszystkie</p>
                  <p className="text-3xl font-bold text-navy-900">{subjectFilteredHomework.length}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedSubjectId === "all" ? "Wszystkie przedmioty" : (subjects as any[])?.find((s: any) => s.id === selectedSubjectId)?.name}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-gray-600" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-700 font-medium">Przypisane</p>
                  <p className="text-3xl font-bold text-yellow-800">{assignedCount}</p>
                  <p className="text-xs text-yellow-600 mt-1">Oczekuje na wykonanie</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium">Przesłane</p>
                  <p className="text-3xl font-bold text-blue-800">{submittedCount}</p>
                  <p className="text-xs text-blue-600 mt-1">Gotowe do oceny</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium">Ocenione</p>
                  <p className="text-3xl font-bold text-green-800">{gradedCount}</p>
                  <p className="text-xs text-green-600 mt-1">Zakończone</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full">
            <TabsList className="flex w-full max-w-2xl mx-auto bg-white border border-gray-200 p-1 rounded-lg">
              <TabsTrigger 
                value="all" 
                className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-navy-700 data-[state=active]:bg-navy-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all rounded-md whitespace-nowrap"
                data-testid="tab-all"
              >
                Wszystkie ({subjectFilteredHomework.length})
              </TabsTrigger>
              <TabsTrigger 
                value="assigned"
                className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-navy-700 data-[state=active]:bg-navy-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all rounded-md whitespace-nowrap"
                data-testid="tab-assigned"
              >
                Przypisane ({assignedCount})
              </TabsTrigger>
              <TabsTrigger 
                value="submitted"
                className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-navy-700 data-[state=active]:bg-navy-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all rounded-md whitespace-nowrap"
                data-testid="tab-submitted"
              >
                Przesłane ({submittedCount})
              </TabsTrigger>
              <TabsTrigger 
                value="graded"
                className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-navy-700 data-[state=active]:bg-navy-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all rounded-md whitespace-nowrap"
                data-testid="tab-graded"
              >
                Ocenione ({gradedCount})
              </TabsTrigger>
            </TabsList>

            {["all", "assigned", "submitted", "graded"].map((filter) => (
              <TabsContent key={filter} value={filter} className="mt-6">
                <div className="space-y-4 max-w-6xl mx-auto">
                  {getFilteredHomework(filter).length > 0 ? (
                    getFilteredHomework(filter).map((homework: HomeworkAssignment) => (
                      <Card key={homework.id} className="hover:shadow-md transition-shadow" data-testid={`card-homework-${homework.id}`}>
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div className="flex items-start gap-4 flex-1">
                              <div className="p-3 bg-gray-100 rounded-lg">
                                {getStatusIcon(homework.status)}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg text-navy-900 mb-2">
                                  {homework.title}
                                </h3>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
                                  <div className="flex items-center gap-1">
                                    <User className="w-4 h-4" />
                                    <span>Uczeń: {homework.studentName}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>Termin: {formatDate(homework.dueDate)}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Target className="w-4 h-4" />
                                    <span>Zadań: {homework.totalTasks}</span>
                                  </div>
                                </div>
                                <p className="text-gray-700 text-sm line-clamp-2">
                                  {homework.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {getStatusBadge(homework.status)}
                              {homework.grade !== null && (
                                <div className="font-bold text-green-600">
                                  {homework.grade}/100
                                </div>
                              )}
                              <div className="flex gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => setSelectedHomework(homework)}
                                      data-testid={`button-details-${homework.id}`}
                                    >
                                      <Eye className="w-4 h-4 mr-2" />
                                      Szczegóły
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle className="flex items-center gap-2">
                                        <FileText className="w-5 h-5" />
                                        {homework.title}
                                      </DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <p className="font-medium text-sm text-gray-700">Uczeń</p>
                                          <p className="text-navy-900">{homework.studentName}</p>
                                        </div>
                                        <div>
                                          <p className="font-medium text-sm text-gray-700">Status</p>
                                          {getStatusBadge(homework.status)}
                                        </div>
                                        <div>
                                          <p className="font-medium text-sm text-gray-700">Termin</p>
                                          <p className="text-navy-900">{formatDate(homework.dueDate)}</p>
                                        </div>
                                        <div>
                                          <p className="font-medium text-sm text-gray-700">Liczba zadań</p>
                                          <p className="text-navy-900">{homework.totalTasks}</p>
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <p className="font-medium text-sm text-gray-700 mb-2">Opis</p>
                                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                                          {homework.description}
                                        </p>
                                      </div>

                                      {homework.studentAnswer && (
                                        <div>
                                          <p className="font-medium text-sm text-gray-700 mb-2">Odpowiedź ucznia</p>
                                          <p className="text-gray-900 bg-blue-50 p-3 rounded-lg">
                                            {homework.studentAnswer}
                                          </p>
                                        </div>
                                      )}

                                      {homework.grade !== null && (
                                        <div>
                                          <p className="font-medium text-sm text-gray-700 mb-2">Ocena</p>
                                          <div className="bg-green-50 p-3 rounded-lg">
                                            <p className="font-bold text-green-800 text-lg">
                                              {homework.grade}/100
                                            </p>
                                          </div>
                                        </div>
                                      )}

                                      {homework.feedback && (
                                        <div>
                                          <p className="font-medium text-sm text-gray-700 mb-2">Uwagi korepetytora</p>
                                          <p className="text-gray-900 bg-blue-50 p-3 rounded-lg">
                                            {homework.feedback}
                                          </p>
                                        </div>
                                      )}

                                      <div className="text-xs text-gray-500 border-t pt-2">
                                        <p>Utworzone: {formatDate(homework.createdAt)}</p>
                                        {homework.updatedAt !== homework.createdAt && (
                                          <p>Zaktualizowane: {formatDate(homework.updatedAt)}</p>
                                        )}
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>

                                {/* AI Grade Button for submitted homework */}
                                {homework.status === "submitted" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openAIGradeDialog(homework)}
                                    className="border-yellow-400 text-yellow-700 hover:bg-yellow-50"
                                    data-testid={`button-ai-grade-${homework.id}`}
                                  >
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Sprawdź AI
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card className="max-w-lg mx-auto">
                      <CardContent className="text-center py-12 px-6">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                          Brak prac domowych
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          {filter === "all" 
                            ? "Nie ma jeszcze żadnych prac domowych w systemie."
                            : `Nie ma prac domowych ze statusem "${filter === "assigned" ? "przypisane" : filter === "submitted" ? "przesłane" : "ocenione"}".`
                          }
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* AI Grading Dialog */}
      <Dialog open={isAIGradeDialogOpen} onOpenChange={setIsAIGradeDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="w-6 h-6 text-yellow-600" />
              Sprawdzanie automatyczne przez AI
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {currentHomeworkForAI && (
              <>
                <div className="bg-navy-50 p-4 rounded-lg border border-navy-200">
                  <h4 className="font-semibold text-navy-900 mb-2">{currentHomeworkForAI.title}</h4>
                  <p className="text-sm text-gray-700 mb-2">{currentHomeworkForAI.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span>Uczeń: {currentHomeworkForAI.studentName}</span>
                    <span>Zadań: {currentHomeworkForAI.totalTasks}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentAnswer">Odpowiedź ucznia</Label>
                  {currentHomeworkForAI.studentAnswer ? (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-gray-900 whitespace-pre-wrap">{currentHomeworkForAI.studentAnswer}</p>
                    </div>
                  ) : (
                    <Textarea
                      id="studentAnswer"
                      value={studentAnswerInput}
                      onChange={(e) => setStudentAnswerInput(e.target.value)}
                      placeholder="Wklej lub wpisz odpowiedź ucznia do sprawdzenia..."
                      rows={8}
                      data-testid="textarea-student-answer"
                    />
                  )}
                </div>

                {aiGradeResult && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-green-900">Wynik sprawdzenia AI</h4>
                      <div className="text-2xl font-bold text-green-700">
                        {aiGradeResult.grade}/100
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-800 mb-1">Feedback:</p>
                      <p className="text-gray-900 whitespace-pre-wrap">{aiGradeResult.feedback}</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsAIGradeDialogOpen(false)}
                    data-testid="button-close-ai-dialog"
                  >
                    Zamknij
                  </Button>
                  <Button
                    onClick={handleAIGrade}
                    disabled={aiGradeMutation.isPending || (!currentHomeworkForAI.studentAnswer && !studentAnswerInput)}
                    className="bg-yellow-600 hover:bg-yellow-700"
                    data-testid="button-run-ai-grade"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {aiGradeMutation.isPending ? "Sprawdzanie..." : "Sprawdź przez AI"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
