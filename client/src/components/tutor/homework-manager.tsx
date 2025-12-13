import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ClipboardList, Plus, Star, User, Calendar, CheckCircle, XCircle, Clock, Trophy, Target } from "lucide-react";

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
  studentId: string;
  studentName: string;
  submittedAt?: string;
  completedTasks: number;
}

export default function TutorHomeworkManager() {
  const [selectedHomework, setSelectedHomework] = useState<HomeworkAssignment | null>(null);
  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false);
  const [gradeFormData, setGradeFormData] = useState({
    grade: "",
    feedback: "",
    xpAwarded: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock homework data for demo
  const mockHomework: HomeworkAssignment[] = [
    {
      id: "1",
      lessonId: "1",
      title: "Równania liniowe - ćwiczenia",
      description: "Rozwiąż 10 równań liniowych z różnymi poziomami trudności",
      dueDate: "2025-01-20T23:59:59Z",
      totalTasks: 10,
      status: "submitted",
      grade: null,
      feedback: null,
      studentId: "student1",
      studentName: "Anna Nowak",
      submittedAt: "2025-01-19T15:30:00Z",
      completedTasks: 8,
    },
    {
      id: "2", 
      lessonId: "2",
      title: "Funkcje kwadratowe - analiza wykresów",
      description: "Przeanalizuj wykresy 5 funkcji kwadratowych i określ ich właściwości",
      dueDate: "2025-01-25T23:59:59Z",
      totalTasks: 5,
      status: "submitted",
      grade: null,
      feedback: null,
      studentId: "student2", 
      studentName: "Piotr Kowalski",
      submittedAt: "2025-01-24T18:45:00Z",
      completedTasks: 5,
    },
    {
      id: "3",
      lessonId: "3", 
      title: "Geometria - właściwości trójkątów",
      description: "Zadania dotyczące obliczeń pól i obwodów różnych rodzajów trójkątów",
      dueDate: "2025-02-05T23:59:59Z",
      totalTasks: 8,
      status: "assigned",
      grade: null,
      feedback: null,
      studentId: "student3",
      studentName: "Maria Wiśniewska", 
      completedTasks: 0,
    },
    {
      id: "4",
      lessonId: "1",
      title: "Układy równań - zadania praktyczne", 
      description: "Rozwiąż 6 układów równań metodami podstawiania i przeciwnych współczynników",
      dueDate: "2025-01-18T23:59:59Z",
      totalTasks: 6,
      status: "graded",
      grade: 85,
      feedback: "Bardzo dobra praca! Wszystkie rozwiązania są poprawne. Zwróć uwagę na czytelność zapisów.",
      studentId: "student1",
      studentName: "Anna Nowak",
      submittedAt: "2025-01-17T20:15:00Z", 
      completedTasks: 6,
    },
  ];

  const gradeHomeworkMutation = useMutation({
    mutationFn: async (data: { homeworkId: string; grade: number; feedback: string; xpAwarded: number }) => {
      return await apiRequest(`/api/tutor/homework/${data.homeworkId}/grade`, "PATCH", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tutor/homework"] });
      setIsGradeDialogOpen(false);
      toast({
        title: "Sukces",
        description: "Praca domowa została oceniona i XP zostało przyznane",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się ocenić pracy domowej",
        variant: "destructive",
      });
    },
  });

  const calculateXP = (grade: number, totalTasks: number, completedTasks: number): number => {
    // Base XP calculation: grade percentage * task completion ratio * base XP
    const baseXP = 50;
    const gradeMultiplier = grade / 100;
    const completionRatio = completedTasks / totalTasks;
    return Math.round(baseXP * gradeMultiplier * completionRatio);
  };

  const handleGradeHomework = (homework: HomeworkAssignment) => {
    setSelectedHomework(homework);
    const suggestedGrade = Math.round((homework.completedTasks / homework.totalTasks) * 85 + 15); // 15-100 scale
    const suggestedXP = calculateXP(suggestedGrade, homework.totalTasks, homework.completedTasks);
    
    setGradeFormData({
      grade: suggestedGrade.toString(),
      feedback: "",
      xpAwarded: suggestedXP.toString(),
    });
    setIsGradeDialogOpen(true);
  };

  const handleSaveGrade = () => {
    if (!selectedHomework) return;

    const grade = parseInt(gradeFormData.grade);
    const xpAwarded = parseInt(gradeFormData.xpAwarded);

    if (grade < 0 || grade > 100) {
      toast({
        title: "Błąd",
        description: "Ocena musi być w zakresie 0-100",
        variant: "destructive",
      });
      return;
    }

    gradeHomeworkMutation.mutate({
      homeworkId: selectedHomework.id,
      grade,
      feedback: gradeFormData.feedback,
      xpAwarded,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "assigned":
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="w-3 h-3" /> Przydzielone</Badge>;
      case "submitted":
        return <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Przesłane</Badge>;
      case "graded":
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1"><Star className="w-3 h-3" /> Ocenione</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
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

  const getGradeColor = (grade: number) => {
    if (grade >= 85) return "text-green-600";
    if (grade >= 70) return "text-yellow-600";
    if (grade >= 50) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Prace domowe uczniów
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockHomework.map((homework) => (
              <Card key={homework.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-navy-900 mb-2">
                        {homework.title}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{homework.studentName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Termin: {formatDate(homework.dueDate)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          <span>{homework.completedTasks}/{homework.totalTasks} zadań</span>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{homework.description}</p>
                      
                      {/* Progress bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Postęp wykonania</span>
                          <span>{Math.round((homework.completedTasks / homework.totalTasks) * 100)}%</span>
                        </div>
                        <Progress 
                          value={(homework.completedTasks / homework.totalTasks) * 100} 
                          className="h-2"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(homework.status)}
                      {homework.grade !== null && (
                        <div className={`font-bold ${getGradeColor(homework.grade)}`}>
                          {homework.grade}/100
                        </div>
                      )}
                    </div>
                  </div>

                  {homework.submittedAt && (
                    <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-sm text-navy-900 mb-1">
                        Przesłane: {formatDate(homework.submittedAt)}
                      </h4>
                    </div>
                  )}

                  {homework.feedback && (
                    <div className="mb-3 p-3 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-sm text-navy-900 mb-1">Moja ocena:</h4>
                      <p className="text-sm text-gray-700">{homework.feedback}</p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    {homework.status === "submitted" && (
                      <Button 
                        onClick={() => handleGradeHomework(homework)}
                        className="flex items-center gap-2"
                        size="sm"
                      >
                        <Star className="w-4 h-4" />
                        Oceń pracę
                      </Button>
                    )}
                    {homework.status === "graded" && (
                      <Button 
                        variant="outline"
                        onClick={() => handleGradeHomework(homework)}
                        className="flex items-center gap-2"
                        size="sm"
                      >
                        <Star className="w-4 h-4" />
                        Zmień ocenę
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Grade Homework Dialog */}
      <Dialog open={isGradeDialogOpen} onOpenChange={setIsGradeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Oceń pracę domową</DialogTitle>
          </DialogHeader>
          {selectedHomework && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-navy-900 mb-2">{selectedHomework.title}</h3>
                <p className="text-sm text-gray-600 mb-2">Uczeń: {selectedHomework.studentName}</p>
                <p className="text-sm text-gray-600">
                  Wykonano: {selectedHomework.completedTasks}/{selectedHomework.totalTasks} zadań 
                  ({Math.round((selectedHomework.completedTasks / selectedHomework.totalTasks) * 100)}%)
                </p>
              </div>

              <div>
                <Label htmlFor="grade">Ocena (0-100 punktów)</Label>
                <Input
                  id="grade"
                  type="number"
                  min="0"
                  max="100"
                  value={gradeFormData.grade}
                  onChange={(e) => {
                    const grade = e.target.value;
                    setGradeFormData({
                      ...gradeFormData, 
                      grade,
                      xpAwarded: grade ? calculateXP(parseInt(grade), selectedHomework.totalTasks, selectedHomework.completedTasks).toString() : "",
                    });
                  }}
                  placeholder="Wprowadź ocenę"
                />
              </div>

              <div>
                <Label htmlFor="xpAwarded">XP do przyznania</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="xpAwarded"
                    type="number"
                    min="0"
                    max="200"
                    value={gradeFormData.xpAwarded}
                    onChange={(e) => setGradeFormData({...gradeFormData, xpAwarded: e.target.value})}
                    placeholder="XP"
                  />
                  <Trophy className="w-5 h-5 text-yellow-500" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Sugerowane XP oparte na wynikach: {gradeFormData.grade ? calculateXP(parseInt(gradeFormData.grade), selectedHomework.totalTasks, selectedHomework.completedTasks) : 0}
                </p>
              </div>

              <div>
                <Label htmlFor="feedback">Komentarz dla ucznia</Label>
                <Textarea
                  id="feedback"
                  value={gradeFormData.feedback}
                  onChange={(e) => setGradeFormData({...gradeFormData, feedback: e.target.value})}
                  placeholder="Napisz komentarz dla ucznia dotyczący jego pracy..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsGradeDialogOpen(false)}>
                  Anuluj
                </Button>
                <Button onClick={handleSaveGrade} disabled={gradeHomeworkMutation.isPending}>
                  <Star className="w-4 h-4 mr-2" />
                  Oceń i przyznaj XP
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}