import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, Eye } from "lucide-react";

interface Tutor {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export default function TutorPreview() {
  const [selectedTutorId, setSelectedTutorId] = useState<string>("");

  // Use admin dashboard data that already contains tutors
  const { data: dashboardData } = useQuery({
    queryKey: ["/api/admin/dashboard"],
    retry: false,
  });

  const tutors = (dashboardData as any)?.tutors || [];

  const handleTutorSelect = (tutorId: string) => {
    setSelectedTutorId(tutorId);
    // Redirect to actual tutor dashboard with selected tutor
    if (tutorId && tutorId !== "overview") {
      window.open(`/tutor-dashboard?demo=true&tutorId=${tutorId}`, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-navy-900 flex items-center gap-2">
            <UserCheck className="w-6 h-6" />
            Podgląd panelu korepetytora
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wybierz korepetytora do podglądu:
            </label>
            <Select value={selectedTutorId} onValueChange={handleTutorSelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Wybierz korepetytora..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Podsumowanie wszystkich korepetytorów
                  </div>
                </SelectItem>
                {tutors.map((tutor: Tutor) => (
                  <SelectItem key={tutor.id} value={tutor.id}>
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4" />
                      {tutor.firstName} {tutor.lastName}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTutorId === "overview" && (
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-navy-900 mb-4">Podsumowanie wszystkich korepetytorów</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-2xl font-bold text-navy-900">{tutors.length}</div>
                  <div className="text-sm text-gray-600">Łączna liczba korepetytorów</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-2xl font-bold text-green-600">Aktywni</div>
                  <div className="text-sm text-gray-600">Status korepetytorów</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-2xl font-bold text-blue-600">Dashboard</div>
                  <div className="text-sm text-gray-600">Widok ogólny</div>
                </div>
              </div>
            </div>
          )}

          {selectedTutorId && selectedTutorId !== "overview" && (
            <div className="bg-green-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-navy-900 mb-2">
                    Panel korepetytora otwarty w nowej karcie
                  </h3>
                  <p className="text-gray-600">
                    Dashboard wybranego korepetytora został otwarty w nowej karcie przeglądarki.
                  </p>
                </div>
                <Button
                  onClick={() => handleTutorSelect(selectedTutorId)}
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Otwórz ponownie
                </Button>
              </div>
            </div>
          )}

          {!selectedTutorId && (
            <div className="text-center py-12">
              <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Wybierz korepetytora</h3>
              <p className="text-gray-600">
                Wybierz korepetytora z listy powyżej, aby zobaczyć podgląd jego panelu lub wybierz "Podsumowanie" dla widoku ogólnego.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}