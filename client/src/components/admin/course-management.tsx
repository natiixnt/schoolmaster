import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import { Clock, Star, Award, ChevronDown, ChevronRight, Plus, FileText, X, Edit2, Edit, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { MathTopic, TopicMaterial } from "@shared/schema";

interface Chapter {
  id: number;
  name: string;
  description: string;
  lessons: [number, number]; // [start, end]
}

interface CourseManagementProps {
  onSelectCourse?: (courseId: string) => void;
  selectedCourseId?: string;
}

export default function CourseManagement({ onSelectCourse, selectedCourseId }: CourseManagementProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("math-8th");
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [openChapters, setOpenChapters] = useState<number[]>([1]);
  
  // Add Material Dialog
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [materialForm, setMaterialForm] = useState({
    title: "",
    materialType: "theory",
    content: "",
    order: 1,
  });

  // Edit Material Dialog
  const [isEditMaterialOpen, setIsEditMaterialOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<TopicMaterial | null>(null);

  // Add Lesson Dialog
  const [isAddLessonOpen, setIsAddLessonOpen] = useState(false);
  const [lessonForm, setLessonForm] = useState({
    id: "",
    name: "",
    description: "",
    order: 1,
    difficultyLevel: "podstawowy",
    xpReward: 50,
    estimatedDuration: 60,
    isActive: true,
  });

  // Edit Lesson Dialog
  const [isEditLessonOpen, setIsEditLessonOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<MathTopic | null>(null);

  // Delete Lesson Dialog
  const [deletingLesson, setDeletingLesson] = useState<MathTopic | null>(null);

  const { toast } = useToast();

  const chapters: Chapter[] = [
    { id: 1, name: "Liczby i działania", description: "Podstawowe operacje, ułamki, procenty", lessons: [1, 7] },
    { id: 2, name: "Wyrażenia algebraiczne i równania", description: "Algebra, równania, nierówności", lessons: [8, 13] },
    { id: 3, name: "Geometria płaska", description: "Figury płaskie, pola, symetrie", lessons: [14, 18] },
    { id: 4, name: "Geometria przestrzenna", description: "Bryły, objętości, siatki", lessons: [19, 22] },
    { id: 5, name: "Funkcje i zależności", description: "Funkcja liniowa, wykresy, proporcje", lessons: [23, 26] },
    { id: 6, name: "Statystyka i prawdopodobieństwo", description: "Analiza danych, średnie, prawdopodobieństwo", lessons: [27, 29] },
    { id: 7, name: "Rozumowanie i zadania złożone", description: "Strategie, zadania wieloetapowe", lessons: [30, 32] },
  ];

  // Fetch subjects list
  const { data: subjects } = useQuery<any[]>({
    queryKey: ["/api/subjects"],
  });

  // Fetch math topics that students see (MAT-L01 to MAT-L32)
  const { data: mathTopics, isLoading: coursesLoading } = useQuery<MathTopic[]>({
    queryKey: ["/api/math-topics"],
  });

  // Fetch materials for selected topic
  const { data: topicMaterials = [] } = useQuery<TopicMaterial[]>({
    queryKey: ["/api/topic-materials", selectedTopicId],
    enabled: !!selectedTopicId,
  });

  const getDifficultyBadge = (level: string) => {
    const colors = {
      podstawowy: "bg-green-100 text-green-800",
      średni: "bg-yellow-100 text-yellow-800", 
      zaawansowany: "bg-red-100 text-red-800"
    };
    return (
      <Badge className={`${colors[level as keyof typeof colors] || colors.podstawowy}`}>
        {level}
      </Badge>
    );
  };

  // Add Material Mutation
  const addMaterialMutation = useMutation({
    mutationFn: async (materialData: any) => {
      const response = await apiRequest(`/api/topic-materials/${selectedTopicId}`, "POST", materialData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/topic-materials", selectedTopicId] });
      setIsAddMaterialOpen(false);
      setMaterialForm({ title: "", materialType: "theory", content: "", order: 1 });
      toast({
        title: "Sukces",
        description: "Materiał został dodany pomyślnie",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się dodać materiału",
        variant: "destructive",
      });
    },
  });

  // Edit Material Mutation
  const editMaterialMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await apiRequest(`/api/topic-materials/${id}`, "PUT", updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/topic-materials", selectedTopicId] });
      setIsEditMaterialOpen(false);
      setEditingMaterial(null);
      toast({
        title: "Sukces",
        description: "Materiał został zaktualizowany pomyślnie",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się zaktualizować materiału",
        variant: "destructive",
      });
    },
  });

  // Delete Material Mutation
  const deleteMaterialMutation = useMutation({
    mutationFn: async (materialId: string) => {
      const response = await apiRequest(`/api/topic-materials/${materialId}`, "DELETE");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/topic-materials", selectedTopicId] });
      toast({
        title: "Sukces",
        description: "Materiał został usunięty pomyślnie",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się usunąć materiału",
        variant: "destructive",
      });
    },
  });

  // Add Lesson Mutation
  const addLessonMutation = useMutation({
    mutationFn: async (lessonData: any) => {
      const response = await apiRequest("/api/math-topics", "POST", lessonData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/math-topics"] });
      setIsAddLessonOpen(false);
      setLessonForm({
        id: "",
        name: "",
        description: "",
        order: 1,
        difficultyLevel: "podstawowy",
        xpReward: 50,
        estimatedDuration: 60,
        isActive: true,
      });
      toast({
        title: "Sukces",
        description: "Lekcja została dodana pomyślnie",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się dodać lekcji",
        variant: "destructive",
      });
    },
  });

  // Edit Lesson Mutation
  const editLessonMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await apiRequest(`/api/math-topics/${id}`, "PUT", updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/math-topics"] });
      setIsEditLessonOpen(false);
      setEditingLesson(null);
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

  // Delete Lesson Mutation
  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const response = await apiRequest(`/api/math-topics/${lessonId}`, "DELETE");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/math-topics"] });
      setDeletingLesson(null);
      toast({
        title: "Sukces",
        description: "Lekcja została usunięta pomyślnie",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się usunąć lekcji. Lekcja może mieć przypisane materiały lub uczniów.",
        variant: "destructive",
      });
      setDeletingLesson(null);
    },
  });

  const toggleChapter = (chapterId: number) => {
    setOpenChapters(prev => 
      prev.includes(chapterId) 
        ? prev.filter(id => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  const getChapterProgress = (chapterLessons: [number, number]) => {
    const chapterTopics = (mathTopics || []).filter((topic: MathTopic) => 
      topic.order >= chapterLessons[0] && topic.order <= chapterLessons[1]
    );
    return { topics: chapterTopics, total: chapterTopics.length };
  };

  const handleAddMaterial = () => {
    if (!materialForm.title || !materialForm.content) {
      toast({
        title: "Błąd",
        description: "Tytuł i treść są wymagane",
        variant: "destructive",
      });
      return;
    }
    addMaterialMutation.mutate(materialForm);
  };

  const handleEditMaterial = () => {
    if (!editingMaterial) return;
    editMaterialMutation.mutate({
      id: editingMaterial.id,
      updates: {
        title: editingMaterial.title,
        materialType: editingMaterial.materialType,
        content: editingMaterial.content,
        order: editingMaterial.order,
      },
    });
  };

  const handleAddLesson = () => {
    if (!lessonForm.id || !lessonForm.name) {
      toast({
        title: "Błąd",
        description: "ID i nazwa lekcji są wymagane",
        variant: "destructive",
      });
      return;
    }
    addLessonMutation.mutate(lessonForm);
  };

  const handleEditLesson = () => {
    if (!editingLesson) return;
    editLessonMutation.mutate({
      id: editingLesson.id,
      updates: {
        name: editingLesson.name,
        description: editingLesson.description,
        order: editingLesson.order,
        difficultyLevel: editingLesson.difficultyLevel,
        xpReward: editingLesson.xpReward,
        estimatedDuration: editingLesson.estimatedDuration,
        isActive: editingLesson.isActive,
      },
    });
  };

  const handleDeleteLesson = () => {
    if (!deletingLesson) return;
    deleteLessonMutation.mutate(deletingLesson.id);
  };

  if (coursesLoading) {
    return (
      <div className="flex items-center justify-center p-8" data-testid="loading-courses">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <div>
              <h2 className="text-2xl font-bold text-navy-900">Zarządzanie materiałami</h2>
              <p className="text-gray-600 mt-1">
                Materiały i lekcje dostępne dla uczniów - pogrupowane według działów
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-navy-700">Przedmiot:</label>
              <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                <SelectTrigger className="w-48 bg-white" data-testid="select-subject">
                  <SelectValue placeholder="Wybierz przedmiot" />
                </SelectTrigger>
                <SelectContent>
                  {subjects && Array.isArray(subjects) && subjects.map((subject: any) => (
                    <SelectItem key={subject.id} value={subject.id} data-testid={`subject-option-${subject.id}`}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Add Lesson Button */}
            <Dialog open={isAddLessonOpen} onOpenChange={setIsAddLessonOpen}>
              <DialogTrigger asChild>
                <Button className="bg-navy-900 hover:bg-navy-800" data-testid="button-add-lesson">
                  <Plus className="w-4 h-4 mr-2" />
                  Dodaj lekcję
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl" data-testid="dialog-add-lesson">
                <DialogHeader>
                  <DialogTitle>Dodaj nową lekcję</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="lesson-id">ID lekcji (np. MAT-L33)</Label>
                    <Input
                      id="lesson-id"
                      data-testid="input-lesson-id"
                      value={lessonForm.id}
                      onChange={(e) => setLessonForm({ ...lessonForm, id: e.target.value })}
                      placeholder="MAT-L33"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lesson-name">Nazwa lekcji</Label>
                    <Input
                      id="lesson-name"
                      data-testid="input-lesson-name"
                      value={lessonForm.name}
                      onChange={(e) => setLessonForm({ ...lessonForm, name: e.target.value })}
                      placeholder="np. Równania kwadratowe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lesson-description">Opis</Label>
                    <Textarea
                      id="lesson-description"
                      data-testid="input-lesson-description"
                      value={lessonForm.description}
                      onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                      placeholder="Opis lekcji..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="lesson-order">Kolejność</Label>
                      <Input
                        id="lesson-order"
                        data-testid="input-lesson-order"
                        type="number"
                        value={lessonForm.order}
                        onChange={(e) => setLessonForm({ ...lessonForm, order: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lesson-difficulty">Poziom trudności</Label>
                      <Select
                        value={lessonForm.difficultyLevel}
                        onValueChange={(value) => setLessonForm({ ...lessonForm, difficultyLevel: value })}
                      >
                        <SelectTrigger data-testid="select-lesson-difficulty">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="podstawowy" data-testid="difficulty-podstawowy">Podstawowy</SelectItem>
                          <SelectItem value="średni" data-testid="difficulty-sredni">Średni</SelectItem>
                          <SelectItem value="zaawansowany" data-testid="difficulty-zaawansowany">Zaawansowany</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="lesson-xp">Nagroda XP</Label>
                      <Input
                        id="lesson-xp"
                        data-testid="input-lesson-xp"
                        type="number"
                        value={lessonForm.xpReward}
                        onChange={(e) => setLessonForm({ ...lessonForm, xpReward: parseInt(e.target.value) || 50 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lesson-duration">Czas trwania (minuty)</Label>
                      <Input
                        id="lesson-duration"
                        data-testid="input-lesson-duration"
                        type="number"
                        value={lessonForm.estimatedDuration}
                        onChange={(e) => setLessonForm({ ...lessonForm, estimatedDuration: parseInt(e.target.value) || 60 })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="lesson-active"
                      data-testid="checkbox-lesson-active"
                      checked={lessonForm.isActive}
                      onCheckedChange={(checked) => setLessonForm({ ...lessonForm, isActive: checked as boolean })}
                    />
                    <Label htmlFor="lesson-active" className="cursor-pointer">Aktywna</Label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddLessonOpen(false)} data-testid="button-cancel-add-lesson">
                      Anuluj
                    </Button>
                    <Button 
                      onClick={handleAddLesson} 
                      disabled={addLessonMutation.isPending}
                      data-testid="button-submit-add-lesson"
                    >
                      {addLessonMutation.isPending ? "Dodawanie..." : "Dodaj lekcję"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Chapters with Topics */}
      {selectedSubjectId === "math-8th" && mathTopics && (
        <div className="space-y-4">
          {chapters.map((chapter) => {
            const { topics, total } = getChapterProgress(chapter.lessons);
            const isOpen = openChapters.includes(chapter.id);
            
            return (
              <Card key={chapter.id} data-testid={`chapter-${chapter.id}`}>
                <Collapsible
                  open={isOpen}
                  onOpenChange={() => toggleChapter(chapter.id)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50" data-testid={`chapter-header-${chapter.id}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg text-navy-900 flex items-center gap-3">
                            {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                            Dział {chapter.id}: {chapter.name}
                          </CardTitle>
                          <p className="text-sm text-gray-600 mt-1">{chapter.description}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="mb-1">
                            {total} lekcji
                          </Badge>
                          <p className="text-xs text-gray-500">Lekcje {chapter.lessons[0]}-{chapter.lessons[1]}</p>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {topics.map((topic: MathTopic) => (
                          <Card 
                            key={topic.id}
                            className={`transition-colors border-l-4 ${
                              selectedTopicId === topic.id ? 'border-l-navy-500 bg-navy-50' : 'border-l-gray-200'
                            }`}
                            data-testid={`topic-card-${topic.id}`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline" className="text-xs" data-testid={`topic-badge-${topic.id}`}>
                                      {topic.id}
                                    </Badge>
                                    <span className="text-sm text-gray-600">
                                      Lekcja #{topic.order}
                                    </span>
                                    {getDifficultyBadge(topic.difficultyLevel || "podstawowy")}
                                  </div>
                                  <h4 className="font-semibold text-navy-900 mb-1" data-testid={`topic-name-${topic.id}`}>
                                    {topic.name}
                                  </h4>
                                  {topic.description && (
                                    <p className="text-sm text-gray-500 mb-2">
                                      {topic.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {topic.estimatedDuration} min
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Award className="w-3 h-3" />
                                      {topic.xpReward} XP
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Star className="w-3 h-3" />
                                      {topic.isActive ? "Aktywny" : "Nieaktywny"}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedTopicId(topic.id)}
                                    data-testid={`button-materials-${topic.id}`}
                                  >
                                    <FileText className="w-4 h-4 mr-1" />
                                    Materiały
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingLesson(topic);
                                      setIsEditLessonOpen(true);
                                    }}
                                    data-testid={`button-edit-lesson-${topic.id}`}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => setDeletingLesson(topic)}
                                        data-testid={`button-delete-lesson-${topic.id}`}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent data-testid="dialog-delete-lesson-confirm">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Czy na pewno chcesz usunąć tę lekcję?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Ta akcja jest nieodwracalna. Lekcja "{topic.name}" zostanie trwale usunięta z systemu.
                                          {topicMaterials.length > 0 && (
                                            <span className="block mt-2 text-red-600 font-medium">
                                              Uwaga: Ta lekcja ma przypisane materiały, które również zostaną usunięte.
                                            </span>
                                          )}
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel data-testid="button-cancel-delete-lesson">Anuluj</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={handleDeleteLesson}
                                          className="bg-red-600 hover:bg-red-700"
                                          disabled={deleteLessonMutation.isPending}
                                          data-testid="button-confirm-delete-lesson"
                                        >
                                          {deleteLessonMutation.isPending ? "Usuwanie..." : "Usuń lekcję"}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}

      {/* Materials Dialog */}
      <Dialog open={!!selectedTopicId} onOpenChange={(open) => !open && setSelectedTopicId(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" data-testid="dialog-materials">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl text-navy-900">
                Materiały: {mathTopics?.find((t: MathTopic) => t.id === selectedTopicId)?.name}
              </DialogTitle>
              <Dialog open={isAddMaterialOpen} onOpenChange={setIsAddMaterialOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-navy-900 hover:bg-navy-800" data-testid="button-add-material">
                    <Plus className="w-4 h-4 mr-2" />
                    Dodaj materiał
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl" data-testid="dialog-add-material">
                  <DialogHeader>
                    <DialogTitle>Dodaj nowy materiał</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Tytuł materiału</Label>
                      <Input
                        id="title"
                        data-testid="input-material-title"
                        value={materialForm.title}
                        onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                        placeholder="np. Teoria liczb naturalnych"
                      />
                    </div>

                    <div>
                      <Label htmlFor="materialType">Typ materiału</Label>
                      <Select
                        value={materialForm.materialType}
                        onValueChange={(value) => setMaterialForm({ ...materialForm, materialType: value })}
                      >
                        <SelectTrigger data-testid="select-material-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="theory" data-testid="material-type-theory">Teoria</SelectItem>
                          <SelectItem value="exercise" data-testid="material-type-exercise">Ćwiczenia</SelectItem>
                          <SelectItem value="video" data-testid="material-type-video">Video</SelectItem>
                          <SelectItem value="worksheet" data-testid="material-type-worksheet">Arkusz ćwiczeń</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="content">Treść materiału</Label>
                      <Textarea
                        id="content"
                        data-testid="input-material-content"
                        value={materialForm.content}
                        onChange={(e) => setMaterialForm({ ...materialForm, content: e.target.value })}
                        placeholder="Wprowadź treść materiału..."
                        rows={6}
                      />
                    </div>
                    <div>
                      <Label htmlFor="order">Kolejność</Label>
                      <Input
                        id="order"
                        data-testid="input-material-order"
                        type="number"
                        value={materialForm.order}
                        onChange={(e) => setMaterialForm({ ...materialForm, order: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsAddMaterialOpen(false)} data-testid="button-cancel-add-material">
                        Anuluj
                      </Button>
                      <Button 
                        onClick={handleAddMaterial} 
                        disabled={addMaterialMutation.isPending}
                        data-testid="button-submit-add-material"
                      >
                        {addMaterialMutation.isPending ? "Dodawanie..." : "Dodaj materiał"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </DialogHeader>
          
          <div className="mt-4">
            {topicMaterials.length === 0 ? (
              <div className="text-center py-12 text-gray-500" data-testid="no-materials-message">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">Brak materiałów</h3>
                <p>Nie ma jeszcze materiałów dla tej lekcji.</p>
                <p className="text-sm mt-2">Kliknij "Dodaj materiał" aby dodać pierwszy materiał.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topicMaterials.map((material: TopicMaterial) => (
                  <Card key={material.id} className="border-l-4 border-l-blue-500" data-testid={`material-card-${material.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" data-testid={`material-type-${material.id}`}>{material.materialType}</Badge>
                            <h4 className="font-semibold text-navy-900" data-testid={`material-title-${material.id}`}>{material.title}</h4>
                            <span className="text-xs text-gray-500">Kolejność: {material.order}</span>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg text-sm" data-testid={`material-content-${material.id}`}>
                            {material.content}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingMaterial(material);
                              setIsEditMaterialOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            data-testid={`button-edit-material-${material.id}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMaterialMutation.mutate(material.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={deleteMaterialMutation.isPending}
                            data-testid={`button-delete-material-${material.id}`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Material Dialog */}
      <Dialog open={isEditMaterialOpen} onOpenChange={setIsEditMaterialOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-edit-material">
          <DialogHeader>
            <DialogTitle>Edytuj materiał</DialogTitle>
          </DialogHeader>
          {editingMaterial && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Tytuł materiału</Label>
                <Input
                  id="edit-title"
                  data-testid="input-edit-material-title"
                  value={editingMaterial.title}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, title: e.target.value })}
                  placeholder="np. Teoria liczb naturalnych"
                />
              </div>

              <div>
                <Label htmlFor="edit-materialType">Typ materiału</Label>
                <Select
                  value={editingMaterial.materialType}
                  onValueChange={(value) => setEditingMaterial({ ...editingMaterial, materialType: value })}
                >
                  <SelectTrigger data-testid="select-edit-material-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="theory">Teoria</SelectItem>
                    <SelectItem value="exercise">Ćwiczenia</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="worksheet">Arkusz ćwiczeń</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-content">Treść materiału</Label>
                <Textarea
                  id="edit-content"
                  data-testid="input-edit-material-content"
                  value={editingMaterial.content || ""}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, content: e.target.value })}
                  placeholder="Wprowadź treść materiału..."
                  rows={6}
                />
              </div>
              <div>
                <Label htmlFor="edit-order">Kolejność</Label>
                <Input
                  id="edit-order"
                  data-testid="input-edit-material-order"
                  type="number"
                  value={editingMaterial.order}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, order: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditMaterialOpen(false)} data-testid="button-cancel-edit-material">
                  Anuluj
                </Button>
                <Button 
                  onClick={handleEditMaterial} 
                  disabled={editMaterialMutation.isPending}
                  data-testid="button-submit-edit-material"
                >
                  {editMaterialMutation.isPending ? "Zapisywanie..." : "Zapisz zmiany"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Lesson Dialog */}
      <Dialog open={isEditLessonOpen} onOpenChange={setIsEditLessonOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-edit-lesson">
          <DialogHeader>
            <DialogTitle>Edytuj lekcję</DialogTitle>
          </DialogHeader>
          {editingLesson && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-lesson-name">Nazwa lekcji</Label>
                <Input
                  id="edit-lesson-name"
                  data-testid="input-edit-lesson-name"
                  value={editingLesson.name}
                  onChange={(e) => setEditingLesson({ ...editingLesson, name: e.target.value })}
                  placeholder="np. Równania kwadratowe"
                />
              </div>
              <div>
                <Label htmlFor="edit-lesson-description">Opis</Label>
                <Textarea
                  id="edit-lesson-description"
                  data-testid="input-edit-lesson-description"
                  value={editingLesson.description || ""}
                  onChange={(e) => setEditingLesson({ ...editingLesson, description: e.target.value })}
                  placeholder="Opis lekcji..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-lesson-order">Kolejność</Label>
                  <Input
                    id="edit-lesson-order"
                    data-testid="input-edit-lesson-order"
                    type="number"
                    value={editingLesson.order}
                    onChange={(e) => setEditingLesson({ ...editingLesson, order: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-lesson-difficulty">Poziom trudności</Label>
                  <Select
                    value={editingLesson.difficultyLevel || "podstawowy"}
                    onValueChange={(value) => setEditingLesson({ ...editingLesson, difficultyLevel: value })}
                  >
                    <SelectTrigger data-testid="select-edit-lesson-difficulty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="podstawowy">Podstawowy</SelectItem>
                      <SelectItem value="średni">Średni</SelectItem>
                      <SelectItem value="zaawansowany">Zaawansowany</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-lesson-xp">Nagroda XP</Label>
                  <Input
                    id="edit-lesson-xp"
                    data-testid="input-edit-lesson-xp"
                    type="number"
                    value={editingLesson.xpReward}
                    onChange={(e) => setEditingLesson({ ...editingLesson, xpReward: parseInt(e.target.value) || 50 })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-lesson-duration">Czas trwania (minuty)</Label>
                  <Input
                    id="edit-lesson-duration"
                    data-testid="input-edit-lesson-duration"
                    type="number"
                    value={editingLesson.estimatedDuration}
                    onChange={(e) => setEditingLesson({ ...editingLesson, estimatedDuration: parseInt(e.target.value) || 60 })}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-lesson-active"
                  data-testid="checkbox-edit-lesson-active"
                  checked={editingLesson.isActive}
                  onCheckedChange={(checked) => setEditingLesson({ ...editingLesson, isActive: checked as boolean })}
                />
                <Label htmlFor="edit-lesson-active" className="cursor-pointer">Aktywna</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditLessonOpen(false)} data-testid="button-cancel-edit-lesson">
                  Anuluj
                </Button>
                <Button 
                  onClick={handleEditLesson} 
                  disabled={editLessonMutation.isPending}
                  data-testid="button-submit-edit-lesson"
                >
                  {editLessonMutation.isPending ? "Zapisywanie..." : "Zapisz zmiany"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
