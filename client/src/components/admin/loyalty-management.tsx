import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Crown, TrendingUp, Users, Award, DollarSign } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";

export function LoyaltyManagement() {
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editLevel, setEditLevel] = useState<string>("");
  const [editBalanceChange, setEditBalanceChange] = useState<string>("");

  // Fetch loyalty statistics
  const { data: stats } = useQuery({
    queryKey: ["/api/admin/loyalty/stats"],
  });

  // Fetch all users with loyalty status
  const { data: loyaltyUsers = [] } = useQuery({
    queryKey: ["/api/admin/loyalty/users"],
  });

  // Mutation for adjusting user loyalty
  const adjustMutation = useMutation({
    mutationFn: async (data: { userId: string; level?: number; balanceChange?: number }) => {
      return await apiRequest("/api/admin/loyalty/adjust", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/loyalty/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/loyalty/stats"] });
      toast({
        title: "Sukces",
        description: "Poziom lojalnościowy zaktualizowany pomyślnie",
      });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      setEditLevel("");
      setEditBalanceChange("");
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się zaktualizować poziomu lojalnościowego",
        variant: "destructive",
      });
    },
  });

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setEditLevel(user.loyaltyLevel.toString());
    setEditBalanceChange("");
    setIsEditDialogOpen(true);
  };

  const handleSaveChanges = () => {
    if (!selectedUser) return;

    const level = editLevel ? parseInt(editLevel) : undefined;
    const balanceChange = editBalanceChange ? parseFloat(editBalanceChange) : undefined;

    adjustMutation.mutate({
      userId: selectedUser.id,
      level,
      balanceChange,
    });
  };

  const levelNames = ["Nowy", "Stały Klient", "Zaangażowany", "Premium", "VIP"];
  const levelColors = [
    "bg-gray-100 text-gray-700",
    "bg-blue-100 text-blue-700",
    "bg-purple-100 text-purple-700",
    "bg-yellow-100 text-yellow-700",
    "bg-orange-100 text-orange-700",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-navy-900 mb-2">Program Lojalnościowy</h2>
        <p className="text-gray-600">Zarządzanie poziomami lojalnościowymi użytkowników</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50" data-testid="card-loyalty-stats-total">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Wszyscy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy-900">{stats.totalUsers}</div>
              <p className="text-xs text-gray-600 mt-1">użytkowników</p>
            </CardContent>
          </Card>

          <Card data-testid="card-loyalty-level-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Award className="w-4 h-4 text-gray-600" />
                Nowy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-700">{stats.level1}</div>
              <p className="text-xs text-gray-600 mt-1">Level 1</p>
            </CardContent>
          </Card>

          <Card data-testid="card-loyalty-level-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-600" />
                Stały Klient
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">{stats.level2}</div>
              <p className="text-xs text-gray-600 mt-1">Level 2</p>
            </CardContent>
          </Card>

          <Card data-testid="card-loyalty-level-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-600" />
                Zaangażowany
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">{stats.level3}</div>
              <p className="text-xs text-gray-600 mt-1">Level 3</p>
            </CardContent>
          </Card>

          <Card data-testid="card-loyalty-level-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-600" />
                Premium
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-700">{stats.level4}</div>
              <p className="text-xs text-gray-600 mt-1">Level 4</p>
            </CardContent>
          </Card>

          <Card data-testid="card-loyalty-level-5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Crown className="w-4 h-4 text-orange-600" />
                VIP
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">{stats.level5}</div>
              <p className="text-xs text-gray-600 mt-1">Level 5</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Użytkownicy i ich poziomy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Użytkownik</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Email</th>
                  <th className="text-center p-3 text-sm font-semibold text-gray-700">Poziom</th>
                  <th className="text-center p-3 text-sm font-semibold text-gray-700">Ukończone lekcje</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Bonusy</th>
                  <th className="text-center p-3 text-sm font-semibold text-gray-700">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {loyaltyUsers.map((user: any) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50" data-testid={`row-user-${user.id}`}>
                    <td className="p-3 text-sm text-gray-900">{user.name}</td>
                    <td className="p-3 text-sm text-gray-600">{user.email}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${levelColors[user.loyaltyLevel - 1]}`}>
                        Level {user.loyaltyLevel} - {user.levelName}
                      </span>
                    </td>
                    <td className="p-3 text-center text-sm text-gray-900">{user.completedLessons}</td>
                    <td className="p-3 text-right text-sm text-gray-900 font-semibold">{parseFloat(user.loyaltyBalance).toFixed(2)} zł</td>
                    <td className="p-3 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        data-testid={`button-edit-user-${user.id}`}
                      >
                        Edytuj
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {loyaltyUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-navy-900 mb-2">Brak użytkowników</h3>
                <p className="text-gray-600">Nie znaleziono żadnych użytkowników w systemie.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edytuj poziom lojalnościowy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedUser && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Użytkownik</p>
                <p className="text-lg font-semibold text-navy-900">{selectedUser.name}</p>
                <p className="text-sm text-gray-600">{selectedUser.email}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-level">Poziom lojalnościowy</Label>
              <Select value={editLevel} onValueChange={setEditLevel}>
                <SelectTrigger id="edit-level" data-testid="select-loyalty-level">
                  <SelectValue placeholder="Wybierz poziom" />
                </SelectTrigger>
                <SelectContent>
                  {levelNames.map((name, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                      Level {index + 1} - {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-600">Aktualny poziom: Level {selectedUser?.loyaltyLevel} - {selectedUser?.levelName}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-balance">Zmiana bonusów (zł)</Label>
              <Input
                id="edit-balance"
                type="number"
                step="0.01"
                placeholder="np. 50 lub -20"
                value={editBalanceChange}
                onChange={(e) => setEditBalanceChange(e.target.value)}
                data-testid="input-balance-change"
              />
              <p className="text-xs text-gray-600">
                Aktualny bonus: {parseFloat(selectedUser?.loyaltyBalance || "0").toFixed(2)} zł<br />
                Wpisz wartość dodatnią aby dodać, ujemną aby odjąć
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Anuluj
            </Button>
            <Button
              onClick={handleSaveChanges}
              disabled={adjustMutation.isPending}
              data-testid="button-save-loyalty-changes"
            >
              {adjustMutation.isPending ? "Zapisywanie..." : "Zapisz zmiany"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
