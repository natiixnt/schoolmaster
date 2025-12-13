import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Edit, Save, Plus, Calendar, Clock, User, Star, BookOpen, Video, ExternalLink } from "lucide-react";
import type { Lesson } from "@shared/schema";

interface TutorLessonEditorProps {
  editingLessonId?: string | null;
  onLessonEdited?: () => void;
}

export default function TutorLessonEditor({ editingLessonId, onLessonEdited }: TutorLessonEditorProps = {}) {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<"scheduled-first" | "completed-first">("scheduled-first");
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    tutorNotes: "",
    rating: "",
    status: "",
    recordingUrl: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get tutor's lessons from API
  const { data: tutorData } = useQuery({
    queryKey: ["/api/tutor/dashboard"],
    retry: false,
  });

  const lessons = tutorData?.allLessons || [];



  const updateLessonMutation = useMutation({
    mutationFn: async (data: { lessonId: string; updates: any }) => {
      return await apiRequest(`/api/tutor/lessons/${data.lessonId}`, "PATCH", data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tutor/dashboard"] });
      setIsEditDialogOpen(false);
      toast({
        title: "Sukces",
        description: "Lekcja została zaktualizowana",
      });
      if (onLessonEdited) {
        onLessonEdited();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się zaktualizować lekcji",
        variant: "destructive",
      });
    },
  });

  const addRecordingMutation = useMutation({
    mutationFn: async (data: { lessonId: string; recordingUrl: string }) => {
      return await apiRequest(`/api/lessons/${data.lessonId}/recording`, "POST", { recordingUrl: data.recordingUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tutor/dashboard"] });
      toast({
        title: "Sukces",
        description: "Link do nagrania został dodany",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się dodać nagrania",
        variant: "destructive",
      });
    },
  });

  const handleEditLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setEditFormData({
      title: lesson.title,
      description: lesson.description || "",
      tutorNotes: lesson.tutorNotes || "",
      rating: lesson.rating?.toString() || "",
      status: lesson.status,
      recordingUrl: lesson.recordingUrl || "",
    });
    setIsEditDialogOpen(true);
  };

  // Auto-open edit dialog when editingLessonId is provided
  useEffect(() => {
    if (editingLessonId) {
      const lesson = lessons.find(l => l.id === editingLessonId);
      if (lesson) {
        handleEditLesson(lesson);
        if (onLessonEdited) {
          onLessonEdited();
        }
      }
    }
  }, [editingLessonId, onLessonEdited, lessons]);

  const handleSaveLesson = async () => {
    if (!selectedLesson) return;

    // If recording URL was added or changed, save it separately
    if (editFormData.status === "completed" && editFormData.recordingUrl !== (selectedLesson.recordingUrl || "")) {
      if (editFormData.recordingUrl) {
        addRecordingMutation.mutate({
          lessonId: selectedLesson.id,
          recordingUrl: editFormData.recordingUrl,
        });
      }
    }

    // Update other lesson fields
    updateLessonMutation.mutate({
      lessonId: selectedLesson.id,
      updates: {
        title: editFormData.title,
        description: editFormData.description,
        tutorNotes: editFormData.tutorNotes,
        status: editFormData.status,
        rating: editFormData.rating ? parseInt(editFormData.rating) : null,
      },
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Ukończona</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-800">Zaplanowana</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Anulowana</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRatingStars = (rating: number | null) => {
    if (!rating) return <span className="text-gray-400">Brak oceny</span>;
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-1 text-sm font-medium">{rating}/5</span>
      </div>
    );
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

  const getSortedLessons = () => {
    const sorted = [...lessons].sort((a, b) => {
      if (sortOrder === "scheduled-first") {
        // First by status (scheduled first, then completed)
        if (a.status === "scheduled" && b.status !== "scheduled") return -1;
        if (b.status === "scheduled" && a.status !== "scheduled") return 1;
        // Then by date (newest first)
        return new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime();
      } else {
        // completed-first
        // First by status (completed first, then scheduled)
        if (a.status === "completed" && b.status !== "completed") return -1;
        if (b.status === "completed" && a.status !== "completed") return 1;
        // Then by date (newest first)
        return new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime();
      }
    });
    return sorted;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Zarządzanie lekcjami
            </CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="sort-select" className="text-sm font-medium">
                Sortowanie:
              </Label>
              <Select value={sortOrder} onValueChange={(value: "scheduled-first" | "completed-first") => setSortOrder(value)}>
                <SelectTrigger id="sort-select" className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled-first">Najpierw zaplanowane</SelectItem>
                  <SelectItem value="completed-first">Najpierw ukończone</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getSortedLessons().map((lesson) => (
              <Card key={lesson.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-navy-900 mb-2">
                        {lesson.title}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(lesson.scheduledAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{lesson.duration} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>ID ucznia: {lesson.studentId}</span>
                        </div>
                      </div>
                      {lesson.description && (
                        <p className="text-gray-600 text-sm mb-2">{lesson.description}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(lesson.status)}
                      {lesson.rating && getRatingStars(lesson.rating)}
                    </div>
                  </div>

                  {lesson.tutorNotes && (
                    <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-sm text-navy-900 mb-1">Moje notatki:</h4>
                      <p className="text-sm text-gray-700">{lesson.tutorNotes}</p>
                    </div>
                  )}

                  {lesson.studentNotes && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-sm text-navy-900 mb-1">Notatki ucznia:</h4>
                      <p className="text-sm text-gray-700">{lesson.studentNotes}</p>
                    </div>
                  )}

                  {lesson.status === "completed" && lesson.recordingUrl && (
                    <div className="mb-3 p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4 text-purple-600 flex-shrink-0" />
                          <h4 className="font-medium text-sm text-navy-900">Nagranie lekcji</h4>
                        </div>
                        <a
                          href={lesson.recordingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
                          data-testid={`link-recording-${lesson.id}`}
                        >
                          Otwórz nagranie
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditLesson(lesson)}
                      className="flex items-center gap-2"
                      data-testid={`button-edit-lesson-${lesson.id}`}
                    >
                      <Edit className="w-4 h-4" />
                      Edytuj lekcję
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Lesson Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edytuj lekcję</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Tytuł lekcji</Label>
              <Input
                id="title"
                value={editFormData.title}
                onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                placeholder="Wprowadź tytuł lekcji"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Opis lekcji</Label>
              <Textarea
                id="description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                placeholder="Opisz czego dotyczyła lekcja"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="tutorNotes">Moje notatki</Label>
              <Textarea
                id="tutorNotes"
                value={editFormData.tutorNotes}
                onChange={(e) => setEditFormData({...editFormData, tutorNotes: e.target.value})}
                placeholder="Notatki dotyczące postępów ucznia, zaleceń na przyszłość itp."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status lekcji</Label>
                <Select value={editFormData.status} onValueChange={(value) => setEditFormData({...editFormData, status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Zaplanowana</SelectItem>
                    <SelectItem value="completed">Ukończona</SelectItem>
                    <SelectItem value="cancelled">Anulowana</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="rating">Ocena jakości lekcji (1-5)</Label>
                <Select value={editFormData.rating} onValueChange={(value) => setEditFormData({...editFormData, rating: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ocena" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Brak oceny</SelectItem>
                    <SelectItem value="1">1 - Słaba</SelectItem>
                    <SelectItem value="2">2 - Przeciętna</SelectItem>
                    <SelectItem value="3">3 - Dobra</SelectItem>
                    <SelectItem value="4">4 - Bardzo dobra</SelectItem>
                    <SelectItem value="5">5 - Doskonała</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {editFormData.status === "completed" && (
              <div>
                <Label htmlFor="recordingUrl" className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Link do nagrania lekcji (opcjonalnie)
                </Label>
                <Input
                  id="recordingUrl"
                  data-testid="input-recording-url"
                  value={editFormData.recordingUrl}
                  onChange={(e) => setEditFormData({...editFormData, recordingUrl: e.target.value})}
                  placeholder="https://meet.google.com/recording/... lub link YouTube/Vimeo"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Możesz dodać link do nagrania lekcji z Google Meet, YouTube, Vimeo lub innego serwisu
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Anuluj
              </Button>
              <Button onClick={handleSaveLesson} disabled={updateLessonMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                Zapisz zmiany
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}