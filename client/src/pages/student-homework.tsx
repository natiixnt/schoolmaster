import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Calendar, Clock, Star, Trophy, CheckCircle, XCircle, FileText, Target, BookOpen } from "lucide-react";

interface HomeworkAssignment {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  dueDate: string;
  totalTasks: number;
  status: "assigned" | "submitted" | "graded";
  grade: number | null;
  feedback: string | null;
  submittedAt?: string;
  completedTasks: number;
  tutorName: string;
  subject: string;
  xpEarned?: number;
}

export default function StudentHomework() {
  const [selectedHomework, setSelectedHomework] = useState<HomeworkAssignment | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [location, setLocation] = useLocation();
  
  // Check if this is demo mode (accessed from admin dashboard)
  const isDemoMode = window.location.search.includes('demo=true') || window.history.state?.fromAdmin;

  // Fetch real homework data from API
  const { data: homeworkData, isLoading } = useQuery({
    queryKey: ['/api/student/homework'],
    enabled: !isDemoMode, // Only fetch when not in demo mode
  });

  // Mock homework data
  const mockHomework: HomeworkAssignment[] = [
    {
      id: "1",
      lessonId: "1",
      title: "Równania liniowe - ćwiczenia podstawowe",
      description: "Rozwiąż 10 równań liniowych o różnych poziomach trudności. Pokaż wszystkie kroki rozwiązania.",
      dueDate: "2025-01-20T23:59:59Z",
      totalTasks: 10,
      status: "graded",
      grade: 85,
      feedback: "Bardzo dobra praca! Wszystkie rozwiązania są poprawne. Zwróć uwagę na czytelność zapisów przy równaniach złożonych.",
      submittedAt: "2025-01-19T15:30:00Z",
      completedTasks: 8,
      tutorName: "Jan Kowalski",
      subject: "Algebra",
      xpEarned: 34,
    },
    {
      id: "2",
      lessonId: "2", 
      title: "Funkcje kwadratowe - analiza wykresów",
      description: "Przeanalizuj wykresy 5 funkcji kwadratowych i określ ich właściwości: wierzchołek, oś symetrii, miejsca zerowe.",
      dueDate: "2025-01-25T23:59:59Z",
      totalTasks: 5,
      status: "submitted",
      grade: null,
      feedback: null,
      submittedAt: "2025-01-24T18:45:00Z",
      completedTasks: 5,
      tutorName: "Jan Kowalski",
      subject: "Funkcje",
      xpEarned: undefined,
    },
    {
      id: "3",
      lessonId: "3",
      title: "Geometria - właściwości trójkątów", 
      description: "Zadania dotyczące obliczeń pól i obwodów różnych rodzajów trójkątów. Użyj wzorów i rysunków.",
      dueDate: "2025-02-05T23:59:59Z",
      totalTasks: 8,
      status: "assigned",
      grade: null,
      feedback: null,
      completedTasks: 3,
      tutorName: "Jan Kowalski",
      subject: "Geometria",
      xpEarned: undefined,
    },
    {
      id: "4",
      lessonId: "1",
      title: "Układy równań - zadania praktyczne",
      description: "Rozwiąż 6 układów równań metodami podstawiania i przeciwnych współczynników. Sprawdź rozwiązania.",
      dueDate: "2025-01-18T23:59:59Z",
      totalTasks: 6,
      status: "graded",
      grade: 92,
      feedback: "Doskonała praca! Wszystkie metody zostały zastosowane poprawnie. Świetne sprawdzenia rozwiązań.",
      submittedAt: "2025-01-17T20:15:00Z",
      completedTasks: 6,
      tutorName: "Jan Kowalski", 
      subject: "Algebra",
      xpEarned: 46,
    },
    {
      id: "5",
      lessonId: "4",
      title: "Statystyka - analiza danych",
      description: "Przeanalizuj zbiór danych i oblicz podstawowe miary: średnią, medianę, dominantę, rozstęp.",
      dueDate: "2025-01-30T23:59:59Z",
      totalTasks: 4,
      status: "graded",
      grade: 78,
      feedback: "Dobra praca z podstawowymi miarami. Więcej uwagi poświęć interpretacji wyników.",
      submittedAt: "2025-01-29T14:20:00Z", 
      completedTasks: 4,
      tutorName: "Jan Kowalski",
      subject: "Statystyka",
      xpEarned: 31,
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "assigned":
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="w-3 h-3" /> Do wykonania</Badge>;
      case "submitted":
        return <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Przesłane</Badge>;
      case "graded":
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1"><Star className="w-3 h-3" /> Ocenione</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 85) return "text-green-600";
    if (grade >= 70) return "text-yellow-600"; 
    if (grade >= 50) return "text-orange-600";
    return "text-red-600";
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

  const getSubjectIcon = (subject: string) => {
    switch (subject) {
      case "Algebra":
        return <BookOpen className="w-5 h-5 text-blue-600" />;
      case "Funkcje":
        return <Target className="w-5 h-5 text-green-600" />;
      case "Geometria":
        return <FileText className="w-5 h-5 text-purple-600" />;
      case "Statystyka":
        return <Trophy className="w-5 h-5 text-orange-600" />;
      default:
        return <BookOpen className="w-5 h-5 text-gray-600" />;
    }
  };

  const handleViewDetails = (homework: HomeworkAssignment) => {
    setSelectedHomework(homework);
    setIsDetailDialogOpen(true);
  };

  // Use real data when available, fallback to mock data in demo mode
  const allHomework = (!isDemoMode && homeworkData && Array.isArray(homeworkData)) ? homeworkData : mockHomework;

  const getFilteredHomework = (filter: string) => {
    switch (filter) {
      case "assigned":
        return allHomework.filter(h => h.status === "assigned");
      case "submitted":
        return allHomework.filter(h => h.status === "submitted");
      case "graded":
        return allHomework.filter(h => h.status === "graded");
      default:
        return allHomework;
    }
  };

  const totalXP = allHomework.filter(h => h.xpEarned).reduce((sum, h) => sum + (h.xpEarned || 0), 0);
  const completedCount = allHomework.filter(h => h.status === "graded").length;
  const pendingCount = allHomework.filter(h => h.status === "assigned").length;

  // Show loading state
  if (!isDemoMode && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-2"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="w-4 h-4" />
                Powrót
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-bold text-navy-900">Moje prace domowe</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-navy-900">{allHomework.length}</div>
                  <div className="text-sm text-gray-600">Wszystkich prac</div>
                </div>
                <FileText className="text-navy-900 text-2xl" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">{completedCount}</div>
                  <div className="text-sm text-gray-600">Ocenionych</div>
                </div>
                <CheckCircle className="text-green-600 text-2xl" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
                  <div className="text-sm text-gray-600">Do wykonania</div>
                </div>
                <Clock className="text-orange-600 text-2xl" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{totalXP}</div>
                  <div className="text-sm text-gray-600">Zdobytych XP</div>
                </div>
                <Trophy className="text-yellow-600 text-2xl" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Homework Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full lg:w-[500px] grid-cols-4">
            <TabsTrigger value="all">Wszystkie</TabsTrigger>
            <TabsTrigger value="assigned">Do wykonania</TabsTrigger>
            <TabsTrigger value="submitted">Przesłane</TabsTrigger>
            <TabsTrigger value="graded">Ocenione</TabsTrigger>
          </TabsList>

          {["all", "assigned", "submitted", "graded"].map((filter) => (
            <TabsContent key={filter} value={filter}>
              <div className="space-y-4">
                {getFilteredHomework(filter).map((homework: any) => (
                  <Card key={homework.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="p-3 bg-gray-100 rounded-lg">
                            {getSubjectIcon(homework.subject)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-navy-900 mb-2">
                              {homework.title}
                            </h3>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>Termin: {formatDate(homework.dueDate)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Target className="w-4 h-4" />
                                <span>{homework.completedTasks || 0}/{homework.totalTasks} zadań</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <BookOpen className="w-4 h-4" />
                                <span>{homework.tutorName || 'Korepetytor'}</span>
                              </div>
                            </div>
                            <p className="text-gray-600 text-sm mb-3">{homework.description}</p>
                            
                            {/* Progress bar */}
                            <div className="mb-3">
                              <div className="flex justify-between text-sm mb-1">
                                <span>Postęp</span>
                                <span>{Math.round((homework.completedTasks / homework.totalTasks) * 100)}%</span>
                              </div>
                              <Progress 
                                value={(homework.completedTasks / homework.totalTasks) * 100} 
                                className="h-2"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(homework.status)}
                          {homework.grade !== null && (
                            <div className={`font-bold ${getGradeColor(homework.grade)}`}>
                              {homework.grade}/100
                            </div>
                          )}
                          {homework.xpEarned && (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                              +{homework.xpEarned} XP
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button 
                          variant="outline"
                          onClick={() => handleViewDetails(homework)}
                          className="flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          Zobacz szczegóły
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Homework Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Szczegóły pracy domowej</DialogTitle>
          </DialogHeader>
          {selectedHomework && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-navy-900 mb-2">{selectedHomework.title}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Przedmiot:</span>
                    <span className="ml-2 font-medium">{selectedHomework.subject}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Korepetytor:</span>
                    <span className="ml-2 font-medium">{selectedHomework.tutorName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Termin:</span>
                    <span className="ml-2 font-medium">{formatDate(selectedHomework.dueDate)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className="ml-2">{getStatusBadge(selectedHomework.status)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-navy-900 mb-2">Opis zadania</h4>
                <p className="text-gray-700 bg-white p-4 rounded-lg border">
                  {selectedHomework.description}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-navy-900 mb-2">Postęp wykonania</h4>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Wykonane zadania</span>
                    <span>{selectedHomework.completedTasks}/{selectedHomework.totalTasks}</span>
                  </div>
                  <Progress 
                    value={(selectedHomework.completedTasks / selectedHomework.totalTasks) * 100} 
                    className="h-3"
                  />
                </div>
              </div>

              {selectedHomework.submittedAt && (
                <div>
                  <h4 className="font-medium text-navy-900 mb-2">Data przesłania</h4>
                  <p className="text-gray-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
                    {formatDate(selectedHomework.submittedAt)}
                  </p>
                </div>
              )}

              {selectedHomework.grade !== null && (
                <div>
                  <h4 className="font-medium text-navy-900 mb-2">Ocena</h4>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg">Wynik:</span>
                      <span className={`text-2xl font-bold ${getGradeColor(selectedHomework.grade)}`}>
                        {selectedHomework.grade}/100
                      </span>
                    </div>
                    {selectedHomework.xpEarned && (
                      <div className="flex items-center justify-between">
                        <span>Zdobyte XP:</span>
                        <Badge className="bg-yellow-100 text-yellow-800">
                          +{selectedHomework.xpEarned} XP
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedHomework.feedback && (
                <div>
                  <h4 className="font-medium text-navy-900 mb-2">Komentarz korepetytora</h4>
                  <p className="text-gray-700 bg-green-50 p-4 rounded-lg border border-green-200">
                    {selectedHomework.feedback}
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button onClick={() => setIsDetailDialogOpen(false)}>
                  Zamknij
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}