import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Package, Plus, Edit, Trash2, Save, X } from "lucide-react";
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

interface LessonPackage {
  id: string;
  name: string;
  description: string | null;
  lessonCount: number;
  discountPercent: string;
  basePrice: string;
  finalPrice: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface PackageFormData {
  name: string;
  description: string;
  lessonCount: number;
  discountPercent: number;
  isActive: boolean;
  sortOrder: number;
}

const STANDARD_LESSON_PRICE = 100; // 100 zł per lesson

export default function PackageManagement() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<LessonPackage | null>(null);
  const [deletingPackageId, setDeletingPackageId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<PackageFormData>({
    name: "",
    description: "",
    lessonCount: 10,
    discountPercent: 10,
    isActive: true,
    sortOrder: 0,
  });

  // Fetch packages
  const { data: packages = [], isLoading } = useQuery<LessonPackage[]>({
    queryKey: ["/api/packages"],
  });

  // Calculate prices based on lesson count and discount
  const calculatePrices = (lessonCount: number, discountPercent: number) => {
    const basePrice = lessonCount * STANDARD_LESSON_PRICE;
    const discountAmount = basePrice * (discountPercent / 100);
    const finalPrice = basePrice - discountAmount;
    return { basePrice, finalPrice };
  };

  const { basePrice, finalPrice } = calculatePrices(formData.lessonCount, formData.discountPercent);

  // Create package mutation
  const createPackageMutation = useMutation({
    mutationFn: async (data: PackageFormData) => {
      const { basePrice, finalPrice } = calculatePrices(data.lessonCount, data.discountPercent);
      return apiRequest("/api/packages", "POST", {
        ...data,
        basePrice: basePrice.toString(),
        finalPrice: finalPrice.toString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packages"] });
      toast({
        title: "Sukces",
        description: "Pakiet został utworzony",
      });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się utworzyć pakietu",
        variant: "destructive",
      });
    },
  });

  // Update package mutation
  const updatePackageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PackageFormData }) => {
      const { basePrice, finalPrice } = calculatePrices(data.lessonCount, data.discountPercent);
      return apiRequest(`/api/packages/${id}`, "PATCH", {
        ...data,
        basePrice: basePrice.toString(),
        finalPrice: finalPrice.toString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packages"] });
      toast({
        title: "Sukces",
        description: "Pakiet został zaktualizowany",
      });
      setEditingPackage(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się zaktualizować pakietu",
        variant: "destructive",
      });
    },
  });

  // Delete package mutation
  const deletePackageMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/packages/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packages"] });
      toast({
        title: "Sukces",
        description: "Pakiet został usunięty",
      });
      setDeletingPackageId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się usunąć pakietu",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      lessonCount: 10,
      discountPercent: 10,
      isActive: true,
      sortOrder: 0,
    });
  };

  const handleEdit = (pkg: LessonPackage) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description || "",
      lessonCount: pkg.lessonCount,
      discountPercent: parseFloat(pkg.discountPercent),
      isActive: pkg.isActive,
      sortOrder: pkg.sortOrder,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingPackage) {
      updatePackageMutation.mutate({ id: editingPackage.id, data: formData });
    } else {
      createPackageMutation.mutate(formData);
    }
  };

  const handleCancel = () => {
    setEditingPackage(null);
    setIsCreateDialogOpen(false);
    resetForm();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-navy-900">Pakiety lekcji</h3>
          <p className="text-gray-600">Zarządzaj pakietami lekcji i rabatami</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-navy-900 hover:bg-navy-800 text-white" data-testid="button-create-package">
              <Plus className="w-4 h-4 mr-2" />
              Nowy pakiet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Utwórz nowy pakiet lekcji</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nazwa pakietu</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="np. Pakiet 10 lekcji"
                  required
                  data-testid="input-package-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Opis</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Krótki opis pakietu..."
                  rows={3}
                  data-testid="input-package-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lessonCount">Liczba lekcji</Label>
                  <Input
                    id="lessonCount"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.lessonCount}
                    onChange={(e) => setFormData({ ...formData, lessonCount: parseInt(e.target.value) || 0 })}
                    required
                    data-testid="input-lesson-count"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountPercent">Rabat (%)</Label>
                  <Input
                    id="discountPercent"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.discountPercent}
                    onChange={(e) => setFormData({ ...formData, discountPercent: parseFloat(e.target.value) || 0 })}
                    required
                    data-testid="input-discount-percent"
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Cena bazowa:</span>
                  <span className="font-semibold text-navy-900">{basePrice.toFixed(2)} zł</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Rabat:</span>
                  <span className="font-semibold text-red-600">-{(basePrice - finalPrice).toFixed(2)} zł</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                  <span className="text-sm font-semibold text-gray-900">Cena końcowa:</span>
                  <span className="text-lg font-bold text-navy-900" data-testid="text-final-price">{finalPrice.toFixed(2)} zł</span>
                </div>
                <div className="text-xs text-gray-500 text-center pt-1">
                  Oszczędność: {formData.discountPercent.toFixed(1)}% ({(basePrice - finalPrice).toFixed(2)} zł)
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    data-testid="switch-is-active"
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">Aktywny</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Kolejność</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    min="0"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-24"
                    data-testid="input-sort-order"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCancel} data-testid="button-cancel">
                  <X className="w-4 h-4 mr-2" />
                  Anuluj
                </Button>
                <Button
                  type="submit"
                  className="bg-navy-900 hover:bg-navy-800 text-white"
                  disabled={createPackageMutation.isPending}
                  data-testid="button-submit-package"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {createPackageMutation.isPending ? "Tworzenie..." : "Utwórz pakiet"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Packages list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-semibold text-navy-900 mb-2">Brak pakietów</h4>
              <p className="text-gray-600 mb-4">Utwórz pierwszy pakiet lekcji</p>
            </CardContent>
          </Card>
        ) : (
          packages
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((pkg) => (
              <Card
                key={pkg.id}
                className={`${pkg.isActive ? "border-navy-200" : "border-gray-200 opacity-60"}`}
                data-testid={`card-package-${pkg.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-navy-900">{pkg.name}</CardTitle>
                      {pkg.description && (
                        <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                      )}
                    </div>
                    {!pkg.isActive && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                        Nieaktywny
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Liczba lekcji:</span>
                      <span className="font-semibold text-navy-900">{pkg.lessonCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Rabat:</span>
                      <span className="font-semibold text-red-600">{parseFloat(pkg.discountPercent).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400 line-through">Cena bazowa:</span>
                      <span className="text-sm text-gray-400 line-through">{parseFloat(pkg.basePrice).toFixed(2)} zł</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="font-semibold text-gray-900">Cena końcowa:</span>
                      <span className="text-xl font-bold text-navy-900">{parseFloat(pkg.finalPrice).toFixed(2)} zł</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Dialog
                      open={editingPackage?.id === pkg.id}
                      onOpenChange={(open) => {
                        if (!open) {
                          setEditingPackage(null);
                          resetForm();
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEdit(pkg)}
                          data-testid={`button-edit-${pkg.id}`}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edytuj
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Edytuj pakiet lekcji</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-name">Nazwa pakietu</Label>
                            <Input
                              id="edit-name"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              placeholder="np. Pakiet 10 lekcji"
                              required
                              data-testid="input-edit-package-name"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="edit-description">Opis</Label>
                            <Textarea
                              id="edit-description"
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              placeholder="Krótki opis pakietu..."
                              rows={3}
                              data-testid="input-edit-package-description"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-lessonCount">Liczba lekcji</Label>
                              <Input
                                id="edit-lessonCount"
                                type="number"
                                min="1"
                                max="100"
                                value={formData.lessonCount}
                                onChange={(e) => setFormData({ ...formData, lessonCount: parseInt(e.target.value) || 0 })}
                                required
                                data-testid="input-edit-lesson-count"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="edit-discountPercent">Rabat (%)</Label>
                              <Input
                                id="edit-discountPercent"
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={formData.discountPercent}
                                onChange={(e) => setFormData({ ...formData, discountPercent: parseFloat(e.target.value) || 0 })}
                                required
                                data-testid="input-edit-discount-percent"
                              />
                            </div>
                          </div>

                          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Cena bazowa:</span>
                              <span className="font-semibold text-navy-900">{basePrice.toFixed(2)} zł</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Rabat:</span>
                              <span className="font-semibold text-red-600">-{(basePrice - finalPrice).toFixed(2)} zł</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                              <span className="text-sm font-semibold text-gray-900">Cena końcowa:</span>
                              <span className="text-lg font-bold text-navy-900">{finalPrice.toFixed(2)} zł</span>
                            </div>
                            <div className="text-xs text-gray-500 text-center pt-1">
                              Oszczędność: {formData.discountPercent.toFixed(1)}% ({(basePrice - finalPrice).toFixed(2)} zł)
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="edit-isActive"
                                checked={formData.isActive}
                                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                                data-testid="switch-edit-is-active"
                              />
                              <Label htmlFor="edit-isActive" className="cursor-pointer">Aktywny</Label>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="edit-sortOrder">Kolejność</Label>
                              <Input
                                id="edit-sortOrder"
                                type="number"
                                min="0"
                                value={formData.sortOrder}
                                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                                className="w-24"
                                data-testid="input-edit-sort-order"
                              />
                            </div>
                          </div>

                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleCancel} data-testid="button-edit-cancel">
                              <X className="w-4 h-4 mr-2" />
                              Anuluj
                            </Button>
                            <Button
                              type="submit"
                              className="bg-navy-900 hover:bg-navy-800 text-white"
                              disabled={updatePackageMutation.isPending}
                              data-testid="button-submit-edit-package"
                            >
                              <Save className="w-4 h-4 mr-2" />
                              {updatePackageMutation.isPending ? "Zapisywanie..." : "Zapisz zmiany"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog
                      open={deletingPackageId === pkg.id}
                      onOpenChange={(open) => !open && setDeletingPackageId(null)}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-red-600 hover:bg-red-50"
                        onClick={() => setDeletingPackageId(pkg.id)}
                        data-testid={`button-delete-${pkg.id}`}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Usuń
                      </Button>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Czy na pewno usunąć pakiet?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Ta operacja jest nieodwracalna. Pakiet "{pkg.name}" zostanie trwale usunięty.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-testid="button-delete-cancel">Anuluj</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deletePackageMutation.mutate(pkg.id)}
                            className="bg-red-600 hover:bg-red-700"
                            data-testid="button-confirm-delete"
                          >
                            {deletePackageMutation.isPending ? "Usuwanie..." : "Usuń pakiet"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>
    </div>
  );
}
