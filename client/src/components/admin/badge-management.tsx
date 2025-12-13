import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge as BadgeUI } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
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
import { Award, Plus, Edit2, Trash2, Filter, UserPlus, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement: string;
  createdAt: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const CATEGORIES = [
  { value: "progress", label: "Postępy" },
  { value: "level", label: "Poziom" },
  { value: "xp", label: "Punkty XP" },
  { value: "streak", label: "Seria" },
  { value: "achievement", label: "Osiągnięcie" },
];

const CATEGORY_COLORS: Record<string, string> = {
  progress: "bg-blue-100 text-blue-800",
  level: "bg-purple-100 text-purple-800",
  xp: "bg-yellow-100 text-yellow-800",
  streak: "bg-orange-100 text-orange-800",
  achievement: "bg-green-100 text-green-800",
};

export default function BadgeManagement() {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAwardDialogOpen, setIsAwardDialogOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
  const [badgeToDelete, setBadgeToDelete] = useState<string | null>(null);
  
  const [newBadgeForm, setNewBadgeForm] = useState({
    name: "",
    description: "",
    icon: "",
    category: "progress",
    requirement: "",
  });

  const [awardForm, setAwardForm] = useState({
    studentId: "",
    badgeId: "",
  });

  const { data: badges = [], isLoading: badgesLoading } = useQuery<Badge[]>({
    queryKey: ["/api/admin/badges"],
  });

  const { data: students = [], isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ["/api/admin/students"],
  });

  const createBadgeMutation = useMutation({
    mutationFn: async (badgeData: typeof newBadgeForm) => {
      const response = await apiRequest("/api/admin/badges", "POST", badgeData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/badges"] });
      setIsAddDialogOpen(false);
      setNewBadgeForm({
        name: "",
        description: "",
        icon: "",
        category: "progress",
        requirement: "",
      });
      toast({
        title: "Sukces",
        description: "Odznaka została dodana pomyślnie",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się dodać odznaki",
        variant: "destructive",
      });
    },
  });

  const updateBadgeMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Badge> & { id: string }) => {
      const response = await apiRequest(`/api/admin/badges/${id}`, "PUT", updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/badges"] });
      setIsEditDialogOpen(false);
      setEditingBadge(null);
      toast({
        title: "Sukces",
        description: "Odznaka została zaktualizowana pomyślnie",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się zaktualizować odznaki",
        variant: "destructive",
      });
    },
  });

  const deleteBadgeMutation = useMutation({
    mutationFn: async (badgeId: string) => {
      const response = await apiRequest(`/api/admin/badges/${badgeId}`, "DELETE");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/badges"] });
      setBadgeToDelete(null);
      toast({
        title: "Sukces",
        description: "Odznaka została usunięta pomyślnie",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się usunąć odznaki",
        variant: "destructive",
      });
    },
  });

  const awardBadgeMutation = useMutation({
    mutationFn: async ({ studentId, badgeId }: { studentId: string; badgeId: string }) => {
      const response = await apiRequest(`/api/admin/students/${studentId}/badges`, "POST", { badgeId });
      return response.json();
    },
    onSuccess: () => {
      setIsAwardDialogOpen(false);
      setAwardForm({ studentId: "", badgeId: "" });
      toast({
        title: "Sukces",
        description: "Odznaka została przyznana uczniowi pomyślnie",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się przyznać odznaki",
        variant: "destructive",
      });
    },
  });

  const filteredBadges = selectedCategory === "all"
    ? badges
    : badges.filter((badge: Badge) => badge.category === selectedCategory);

  const handleCreateBadge = () => {
    if (!newBadgeForm.name || !newBadgeForm.icon || !newBadgeForm.category) {
      toast({
        title: "Błąd",
        description: "Nazwa, ikona i kategoria są wymagane",
        variant: "destructive",
      });
      return;
    }
    createBadgeMutation.mutate(newBadgeForm);
  };

  const handleUpdateBadge = () => {
    if (!editingBadge) return;
    updateBadgeMutation.mutate({
      id: editingBadge.id,
      name: editingBadge.name,
      description: editingBadge.description,
      icon: editingBadge.icon,
      category: editingBadge.category,
      requirement: editingBadge.requirement,
    });
  };

  const handleDeleteBadge = (badgeId: string) => {
    deleteBadgeMutation.mutate(badgeId);
  };

  const handleAwardBadge = () => {
    if (!awardForm.studentId || !awardForm.badgeId) {
      toast({
        title: "Błąd",
        description: "Wybierz ucznia i odznakę",
        variant: "destructive",
      });
      return;
    }
    awardBadgeMutation.mutate(awardForm);
  };

  const openEditDialog = (badge: Badge) => {
    setEditingBadge({ ...badge });
    setIsEditDialogOpen(true);
  };

  if (badgesLoading || studentsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-navy-900 flex items-center gap-2">
            <Award className="w-6 h-6" />
            Zarządzanie odznakami
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Ładowanie odznak...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold text-navy-900 flex items-center gap-2">
                <Award className="w-6 h-6" />
                Zarządzanie odznakami
              </CardTitle>
              <p className="text-gray-600 mt-1">
                Twórz, edytuj i przyznawaj odznaki uczniom
              </p>
            </div>
            <div className="flex gap-2">
              <Dialog open={isAwardDialogOpen} onOpenChange={setIsAwardDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-accent hover:bg-yellow-500 text-navy-900" data-testid="button-open-award-badge">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Przyznaj odznakę
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Przyznaj odznakę uczniowi</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="award-student">Uczeń</Label>
                      <Select
                        value={awardForm.studentId}
                        onValueChange={(value) => setAwardForm({ ...awardForm, studentId: value })}
                      >
                        <SelectTrigger id="award-student" data-testid="select-award-student">
                          <SelectValue placeholder="Wybierz ucznia" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map((student: Student) => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.firstName} {student.lastName} ({student.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="award-badge">Odznaka</Label>
                      <Select
                        value={awardForm.badgeId}
                        onValueChange={(value) => setAwardForm({ ...awardForm, badgeId: value })}
                      >
                        <SelectTrigger id="award-badge" data-testid="select-award-badge">
                          <SelectValue placeholder="Wybierz odznakę" />
                        </SelectTrigger>
                        <SelectContent>
                          {badges.map((badge: Badge) => (
                            <SelectItem key={badge.id} value={badge.id}>
                              {badge.icon} {badge.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAwardDialogOpen(false)} data-testid="button-cancel-award">
                      Anuluj
                    </Button>
                    <Button
                      onClick={handleAwardBadge}
                      disabled={awardBadgeMutation.isPending}
                      className="bg-navy-900 hover:bg-navy-800"
                      data-testid="button-confirm-award"
                    >
                      {awardBadgeMutation.isPending ? "Przyznawanie..." : "Przyznaj"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-navy-900 hover:bg-navy-800" data-testid="button-add-badge">
                    <Plus className="w-4 h-4 mr-2" />
                    Dodaj odznakę
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Dodaj nową odznakę</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nazwa odznaki</Label>
                      <Input
                        id="name"
                        value={newBadgeForm.name}
                        onChange={(e) => setNewBadgeForm({ ...newBadgeForm, name: e.target.value })}
                        placeholder="np. Mistrz Algebry"
                        data-testid="input-badge-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Opis</Label>
                      <Textarea
                        id="description"
                        value={newBadgeForm.description}
                        onChange={(e) => setNewBadgeForm({ ...newBadgeForm, description: e.target.value })}
                        placeholder="Opis odznaki..."
                        rows={3}
                        data-testid="input-badge-description"
                      />
                    </div>
                    <div>
                      <Label htmlFor="icon">Ikona (emoji lub tekst)</Label>
                      <Input
                        id="icon"
                        value={newBadgeForm.icon}
                        onChange={(e) => setNewBadgeForm({ ...newBadgeForm, icon: e.target.value })}
                        placeholder="🏆 lub Trophy"
                        data-testid="input-badge-icon"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Kategoria</Label>
                      <Select
                        value={newBadgeForm.category}
                        onValueChange={(value) => setNewBadgeForm({ ...newBadgeForm, category: value })}
                      >
                        <SelectTrigger id="category" data-testid="select-badge-category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="requirement">Wymagania</Label>
                      <Textarea
                        id="requirement"
                        value={newBadgeForm.requirement}
                        onChange={(e) => setNewBadgeForm({ ...newBadgeForm, requirement: e.target.value })}
                        placeholder="Opis wymagań do zdobycia odznaki..."
                        rows={3}
                        data-testid="input-badge-requirement"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} data-testid="button-cancel-add">
                      Anuluj
                    </Button>
                    <Button
                      onClick={handleCreateBadge}
                      disabled={createBadgeMutation.isPending}
                      data-testid="button-confirm-add"
                    >
                      {createBadgeMutation.isPending ? "Dodawanie..." : "Dodaj odznakę"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-6 bg-navy-50 p-4 rounded-lg border border-navy-200">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-navy-600" />
                <span className="text-sm font-semibold text-navy-700">Filtruj po kategorii:</span>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-64 bg-white border-navy-200" data-testid="select-filter-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie kategorie</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="mt-3 flex items-center gap-6 text-sm text-navy-600">
              <span>
                <strong>Wybrano:</strong>{" "}
                {selectedCategory === "all" ? "Wszystkie" : CATEGORIES.find((c) => c.value === selectedCategory)?.label}
              </span>
              <span>
                <strong>Wyświetlane odznaki:</strong> {filteredBadges.length}
              </span>
            </div>
          </div>

          {filteredBadges.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Award className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Brak odznak</h3>
              <p>
                {selectedCategory === "all"
                  ? "Nie ma jeszcze żadnych odznak. Kliknij 'Dodaj odznakę' aby utworzyć pierwszą."
                  : "Brak odznak w tej kategorii."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBadges.map((badge: Badge) => (
                <Card key={badge.id} className="hover:shadow-md transition-shadow" data-testid={`card-badge-${badge.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{badge.icon}</div>
                        <div>
                          <h3 className="font-semibold text-navy-900">{badge.name}</h3>
                          <BadgeUI className={`${CATEGORY_COLORS[badge.category] || "bg-gray-100 text-gray-800"} mt-1`}>
                            {CATEGORIES.find((c) => c.value === badge.category)?.label || badge.category}
                          </BadgeUI>
                        </div>
                      </div>
                    </div>
                    {badge.description && (
                      <p className="text-sm text-gray-600 mb-3">{badge.description}</p>
                    )}
                    {badge.requirement && (
                      <div className="bg-gray-50 p-2 rounded text-xs text-gray-700 mb-3">
                        <strong>Wymagania:</strong> {badge.requirement}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(badge)}
                        className="flex-1"
                        data-testid={`button-edit-${badge.id}`}
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Edytuj
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBadgeToDelete(badge.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        data-testid={`button-delete-${badge.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edytuj odznakę</DialogTitle>
          </DialogHeader>
          {editingBadge && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nazwa odznaki</Label>
                <Input
                  id="edit-name"
                  value={editingBadge.name}
                  onChange={(e) => setEditingBadge({ ...editingBadge, name: e.target.value })}
                  data-testid="input-edit-badge-name"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Opis</Label>
                <Textarea
                  id="edit-description"
                  value={editingBadge.description}
                  onChange={(e) => setEditingBadge({ ...editingBadge, description: e.target.value })}
                  rows={3}
                  data-testid="input-edit-badge-description"
                />
              </div>
              <div>
                <Label htmlFor="edit-icon">Ikona (emoji lub tekst)</Label>
                <Input
                  id="edit-icon"
                  value={editingBadge.icon}
                  onChange={(e) => setEditingBadge({ ...editingBadge, icon: e.target.value })}
                  data-testid="input-edit-badge-icon"
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Kategoria</Label>
                <Select
                  value={editingBadge.category}
                  onValueChange={(value) => setEditingBadge({ ...editingBadge, category: value })}
                >
                  <SelectTrigger id="edit-category" data-testid="select-edit-badge-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-requirement">Wymagania</Label>
                <Textarea
                  id="edit-requirement"
                  value={editingBadge.requirement}
                  onChange={(e) => setEditingBadge({ ...editingBadge, requirement: e.target.value })}
                  rows={3}
                  data-testid="input-edit-badge-requirement"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} data-testid="button-cancel-edit">
              Anuluj
            </Button>
            <Button
              onClick={handleUpdateBadge}
              disabled={updateBadgeMutation.isPending}
              data-testid="button-confirm-edit"
            >
              {updateBadgeMutation.isPending ? "Zapisywanie..." : "Zapisz zmiany"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!badgeToDelete} onOpenChange={(open) => !open && setBadgeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć tę odznakę?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta operacja jest nieodwracalna. Odznaka zostanie usunięta ze wszystkich kont uczniów, którzy ją posiadają.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => badgeToDelete && handleDeleteBadge(badgeToDelete)}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              {deleteBadgeMutation.isPending ? "Usuwanie..." : "Usuń"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
