import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserCheck, TrendingUp, BookOpen, Calendar, Users, Search, Eye, ArrowLeft, Star } from "lucide-react";
import RevenueDetailsModal from "./revenue-details-modal";

interface Tutor {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  tutorProfile?: {
    hourlyRate: string;
    rating: string;
    totalLessons: number;
    isVerified: boolean;
    specializations: string[] | null;
  };
}

interface TutorPreviewProps {
  selectedTutorId?: string;
  onTutorSelect?: (tutorId: string) => void;
}

export default function TutorPreview({ selectedTutorId, onTutorSelect }: TutorPreviewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);

  // Fetch tutors list and dashboard data
  const { data: tutorsData } = useQuery({
    queryKey: ["/api/admin/tutors-detailed"],
    retry: false,
  });

  const { data: dashboardData } = useQuery({
    queryKey: ["/api/admin/dashboard"],
    retry: false,
  });

  const tutors = (tutorsData as Tutor[]) || [];
  const stats = (dashboardData as any)?.stats || {};
  
  const tutorsList = tutors.filter(tutor => tutor.role === "tutor");
  
  // Filter tutors based on search term
  const filteredTutors = tutorsList.filter(tutor =>
    `${tutor.firstName} ${tutor.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tutor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTutorSelect = (tutorId: string) => {
    if (onTutorSelect) {
      onTutorSelect(tutorId);
    }
  };

  const selectedTutor = selectedTutorId ? tutorsList.find(t => t.id === selectedTutorId) : null;

  return (
    <div className="space-y-6">
      {/* Always visible statistics at the top */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <UserCheck className="w-8 h-8 text-navy-900" />
              <div className="text-right">
                <div className="text-2xl font-bold text-navy-900">{tutorsList.length}</div>
                <div className="text-sm text-gray-600">Łączna liczba korepetytorów</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">{stats.totalLessons || 0}</div>
                <div className="text-sm text-gray-600">Łączne lekcje</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{tutorsList.filter(t => t.isActive).length}</div>
                <div className="text-sm text-gray-600">Aktywni korepetytorzy</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsRevenueModalOpen(true)}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Calendar className="w-8 h-8 text-purple-600" />
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600">{stats.monthlyRevenue || '0.00'} zł</div>
                <div className="text-sm text-gray-600">Miesięczny przychód</div>
                <div className="text-xs text-gray-500 mt-1">Kliknij aby zobaczyć szczegóły</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected tutor view or tutor list */}
      {!selectedTutorId ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-navy-900 flex items-center gap-2">
              <UserCheck className="w-6 h-6" />
              Lista korepetytorów
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search input */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Szukaj korepetytora po imieniu, nazwisku lub emailu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Tutors list */}
            <div className="space-y-3">
              {filteredTutors.length > 0 ? (
                filteredTutors.map((tutor) => (
                  <div
                    key={tutor.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-navy-900" />
                      </div>
                      <div>
                        <div className="font-semibold text-navy-900 flex items-center gap-2">
                          {tutor.firstName} {tutor.lastName}
                          {!tutor.isActive && (
                            <Badge variant="secondary" className="text-xs">
                              Nieaktywny
                            </Badge>
                          )}
                          {tutor.tutorProfile?.isVerified && (
                            <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                              Zweryfikowany
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center gap-4">
                          <span>{tutor.email}</span>
                          {tutor.tutorProfile?.hourlyRate && (
                            <span>{tutor.tutorProfile.hourlyRate} zł/h</span>
                          )}
                          {tutor.tutorProfile?.rating && (
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              {parseFloat(tutor.tutorProfile.rating).toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleTutorSelect(tutor.id)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Podgląd danych
                    </Button>
                  </div>
                ))
              ) : searchTerm ? (
                <div className="text-center py-8">
                  <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Brak wyników</h3>
                  <p className="text-gray-600">
                    Nie znaleziono korepetytorów pasujących do frazy "{searchTerm}"
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Brak korepetytorów</h3>
                  <p className="text-gray-600">
                    Nie ma jeszcze żadnych zarejestrowanych korepetytorów w systemie.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : selectedTutor ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-navy-900 flex items-center gap-2">
              <UserCheck className="w-6 h-6" />
              Podgląd korepetytora: {selectedTutor.firstName} {selectedTutor.lastName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-navy-900 mb-2">
                    Podgląd danych korepetytora: {selectedTutor.firstName} {selectedTutor.lastName}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-gray-600">Email:</p>
                      <p className="font-medium">{selectedTutor.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status:</p>
                      <p className={`font-medium ${selectedTutor.isActive ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedTutor.isActive ? 'Aktywny' : 'Nieaktywny'}
                      </p>
                    </div>
                    {selectedTutor.tutorProfile?.hourlyRate && (
                      <div>
                        <p className="text-sm text-gray-600">Stawka godzinowa:</p>
                        <p className="font-medium">{selectedTutor.tutorProfile.hourlyRate} zł</p>
                      </div>
                    )}
                    {selectedTutor.tutorProfile?.rating && (
                      <div>
                        <p className="text-sm text-gray-600">Ocena:</p>
                        <p className="font-medium flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          {parseFloat(selectedTutor.tutorProfile.rating).toFixed(1)}/5.0
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => onTutorSelect && onTutorSelect("")}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Powrót do listy
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-8">
          <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Wybierz opcję podglądu</h3>
          <p className="text-gray-600">
            Wybierz "Korepetytor" z menu podglądu aby zobaczyć listę korepetytorów.
          </p>
        </div>
      )}

      {/* Revenue Details Modal */}
      <RevenueDetailsModal 
        isOpen={isRevenueModalOpen}
        onClose={() => setIsRevenueModalOpen(false)}
      />
    </div>
  );
}