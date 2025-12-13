import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, GraduationCap, Eye, Search, TrendingUp, BookOpen, Calendar, ArrowLeft } from "lucide-react";
import RevenueDetailsModal from "./revenue-details-modal";

interface Student { 
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface StudentPreviewProps {
  selectedStudentId?: string;
  onStudentSelect?: (studentId: string) => void;
}

export default function StudentPreview({ selectedStudentId, onStudentSelect }: StudentPreviewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);

  // Fetch students list and dashboard data
  const { data: studentsData } = useQuery({
    queryKey: ["/api/admin/students"],
    retry: false,
  });

  const { data: dashboardData } = useQuery({
    queryKey: ["/api/admin/dashboard"],
    retry: false,
  });

  const students = (studentsData as Student[]) || [];
  const stats = (dashboardData as any)?.stats || {};
  
  const studentsList = students.filter(student => student.role === "student");
  
  // Filter students based on search term
  const filteredStudents = studentsList.filter(student =>
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStudentSelect = (studentId: string) => {
    if (onStudentSelect) {
      onStudentSelect(studentId);
    }
  };

  const selectedStudent = selectedStudentId ? studentsList.find(s => s.id === selectedStudentId) : null;

  return (
    <div className="space-y-6">
      {/* Always visible statistics at the top */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Users className="w-8 h-8 text-navy-900" />
              <div className="text-right">
                <div className="text-2xl font-bold text-navy-900">{studentsList.length}</div>
                <div className="text-sm text-gray-600">Łączna liczba uczniów</div>
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
                <div className="text-2xl font-bold text-blue-600">{stats.totalCourses || 0}</div>
                <div className="text-sm text-gray-600">Aktywne kursy</div>
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
                <div className="text-2xl font-bold text-purple-600">{stats.monthlyRevenue || '5600'} zł</div>
                <div className="text-sm text-gray-600">Miesięczny przychód</div>
                <div className="text-xs text-gray-500 mt-1">Kliknij aby zobaczyć szczegóły</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected student view or student list - hide when specific student selected */}
      {!selectedStudentId ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-navy-900 flex items-center gap-2">
              <GraduationCap className="w-6 h-6" />
              Lista uczniów
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search input */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Szukaj ucznia po imieniu, nazwisku lub emailu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Students list */}
            <div className="space-y-3">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-navy-900" />
                      </div>
                      <div>
                        <div className="font-semibold text-navy-900">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="text-sm text-gray-600">{student.email}</div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleStudentSelect(student.id)}
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
                    Nie znaleziono uczniów pasujących do frazy "{searchTerm}"
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Brak uczniów</h3>
                  <p className="text-gray-600">
                    Nie ma jeszcze żadnych zarejestrowanych uczniów w systemie.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : selectedStudent ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-navy-900 flex items-center gap-2">
              <GraduationCap className="w-6 h-6" />
              Podgląd ucznia: {selectedStudent.firstName} {selectedStudent.lastName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-navy-900 mb-2">
                    Podgląd danych ucznia: {selectedStudent.firstName} {selectedStudent.lastName}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-gray-600">Email:</p>
                      <p className="font-medium">{selectedStudent.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status:</p>
                      <p className="font-medium text-green-600">Aktywny</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => onStudentSelect && onStudentSelect("")}
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
          <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Wybierz opcję podglądu</h3>
          <p className="text-gray-600">
            Wybierz "Uczeń" z menu podglądu aby zobaczyć listę uczniów.
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