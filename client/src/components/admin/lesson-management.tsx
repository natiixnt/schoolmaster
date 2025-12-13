import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, PlayCircle, Clock, FileText, ArrowLeft } from "lucide-react";
import type { Course, CourseLesson } from "@shared/schema";

interface LessonFormData {
  title: string;
  description: string;
  content: string;
  order: number;
  duration: number;
  videoUrl: string;
  exerciseCount: number;
}

interface LessonManagementProps {
  courseId: string;
  onBackToCourses?: () => void;
}

export default function LessonManagement({ courseId, onBackToCourses }: LessonManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<CourseLesson | null>(null);
  const [formData, setFormData] = useState<LessonFormData>({
    title: "",
    description: "",
    content: "",
    order: 1,
    duration: 30,
    videoUrl: "",
    exerciseCount: 0,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: lessons, isLoading: lessonsLoading } = useQuery({
    queryKey: [`/api/admin/courses/${courseId}/lessons`],
    enabled: !!courseId,
  });

  const { data: course } = useQuery({
    queryKey: [`/api/admin/courses/${courseId}`],
    enabled: !!courseId,
  });

  const createLessonMutation = useMutation({
    mutationFn: async (data: LessonFormData) => {
      const response = await apiRequest(`/api/admin/courses/${courseId}/lessons`, "POST", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${courseId}/lessons`] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Sukces",
        description: "Lekcja została utworzona pomyślnie",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się utworzyć lekcji",
        variant: "destructive",
      });
    },
  });

  const updateLessonMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LessonFormData> }) => {
      const response = await apiRequest(`/api/admin/lessons/${id}`, "PUT", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${courseId}/lessons`] });
      setEditingLesson(null);
      resetForm();
      toast({
        title: "Sukces",
        description: "Lekcja została zaktualizowana pomyślnie",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się zaktualizować lekcji",
        variant: "destructive",
      });
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/admin/lessons/${id}`, "DELETE");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${courseId}/lessons`] });
      toast({
        title: "Sukces",
        description: "Lekcja została usunięta pomyślnie",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się usunąć lekcji",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      content: "",
      order: 1,
      duration: 30,
      videoUrl: "",
      exerciseCount: 0,
    });
  };

  const handleEdit = (lesson: CourseLesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      description: lesson.description || "",
      content: lesson.content || "",
      order: lesson.order,
      duration: lesson.duration || 30,
      videoUrl: lesson.videoUrl || "",
      exerciseCount: lesson.exerciseCount || 0,
    });
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast({
        title: "Błąd",
        description: "Tytuł lekcji jest wymagany",
        variant: "destructive",
      });
      return;
    }

    if (editingLesson) {
      updateLessonMutation.mutate({ id: editingLesson.id, data: formData });
    } else {
      createLessonMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Czy na pewno chcesz usunąć tę lekcję? Ta akcja jest nieodwracalna.")) {
      deleteLessonMutation.mutate(id);
    }
  };

  if (lessonsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          {onBackToCourses && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToCourses}
              className="flex items-center gap-2 text-gray-600 hover:text-navy-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Powrót do kursów
            </Button>
          )}
          <div>
            <h3 className="text-xl font-bold text-navy-900">
              Lekcje kursu: {(course as Course)?.title}
            </h3>
            <p className="text-gray-600">
              Zarządzaj lekcjami w ramach tego kursu
            </p>
          </div>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-navy-900 hover:bg-navy-800">
              <Plus className="w-4 h-4 mr-2" />
              Dodaj lekcję
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                {editingLesson ? "Edytuj lekcję" : "Dodaj nową lekcję"}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <Label htmlFor="title">Tytuł lekcji</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="np. Wprowadzenie do równań liniowych"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Opis</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Krótki opis lekcji..."
                  rows={2}
                />
              </div>
              
              <div>
                <Label htmlFor="content">Treść lekcji</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Pełna treść lekcji, materiały, przykłady..."
                  rows={6}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="videoUrl">URL do wideo (opcjonalny)</Label>
                  <Input
                    id="videoUrl"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="exerciseCount">Liczba ćwiczeń</Label>
                  <Input
                    id="exerciseCount"
                    type="number"
                    value={formData.exerciseCount}
                    onChange={(e) => setFormData({ ...formData, exerciseCount: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Czas trwania (min)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 30 })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="order">Kolejność w kursie</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setEditingLesson(null);
                    resetForm();
                  }}
                >
                  Anuluj
                </Button>
                <Button onClick={handleSubmit} className="bg-navy-900 hover:bg-navy-800">
                  {editingLesson ? "Zapisz zmiany" : "Utwórz lekcję"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {(lessons as CourseLesson[])?.sort((a, b) => a.order - b.order)?.map((lesson) => (
          <Card key={lesson.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <PlayCircle className="w-5 h-5 text-navy-900" />
                    <span className="text-sm text-gray-500 mr-2">#{lesson.order}</span>
                    {lesson.title}
                  </CardTitle>
                  {lesson.description && (
                    <p className="text-gray-600 mt-1">{lesson.description}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleEdit(lesson);
                      setIsCreateDialogOpen(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(lesson.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {lesson.duration} min
                </div>
                {lesson.exerciseCount > 0 && (
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {lesson.exerciseCount} ćwiczeń
                  </div>
                )}
                {lesson.videoUrl && (
                  <div className="flex items-center gap-1">
                    <PlayCircle className="w-4 h-4" />
                    Video
                  </div>
                )}
              </div>
              
              {lesson.content && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {lesson.content}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {(!lessons || lessons.length === 0) && (
          <Card>
            <CardContent className="text-center py-8">
              <PlayCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Brak lekcji w tym kursie. Dodaj pierwszą lekcję, aby rozpocząć.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}