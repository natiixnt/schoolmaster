import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Users, GraduationCap, Search, UserCheck, UserX, Mail, Phone, Calendar, Star, XCircle, Eye, Trophy, Flame, BookOpen, DollarSign } from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
}

interface StudentProfile {
  userId: string;
  level: number;
  xp: number;
  streak: number;
  totalLessons: number;
}

interface TutorProfile {
  userId: string;
  hourlyRate: number;
  rating: number;
  totalLessons: number;
  isVerified: boolean;
  bio: string;
  specializations: string[];
}

interface UserManagementProps {
  initialTab?: string;
}

export default function UserManagement({ initialTab = "students" }: UserManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);

  // Update activeTab when initialTab changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const { data: students, isLoading: studentsLoading, error: studentsError } = useQuery({
    queryKey: ["/api/admin/students"],
    queryFn: () => fetch('/api/admin/students', { credentials: 'include' }).then(res => {
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    }),
    retry: false,
  });

  const { data: tutors, isLoading: tutorsLoading, error: tutorsError } = useQuery({
    queryKey: ["/api/admin/tutors-detailed"],
    queryFn: () => fetch('/api/admin/tutors-detailed', { credentials: 'include' }).then(res => {
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    }),
    retry: false,
  });

  const toggleUserStatus = useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: 'activate' | 'deactivate' }) => {
      const response = await fetch(`/api/admin/users/${userId}/${action}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({})
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`${response.status}: ${errorData.message || response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tutors-detailed"] });
      toast({
        title: "Sukces",
        description: "Status użytkownika został zaktualizowany",
      });
    },
    onError: () => {
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować statusu użytkownika",
        variant: "destructive",
      });
    },
  });

  const verifyTutor = useMutation({
    mutationFn: async (tutorId: string) => {
      const response = await fetch(`/api/admin/tutors/${tutorId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({})
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`${response.status}: ${errorData.message || response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tutors-detailed"] });
      toast({
        title: "Sukces",
        description: "Korepetytor został zweryfikowany",
      });
    },
    onError: () => {
      toast({
        title: "Błąd",
        description: "Nie udało się zweryfikować korepetytora",
        variant: "destructive",
      });
    },
  });

  const filteredStudents = Array.isArray(students) ? students.filter((student: any) =>
    `${student.firstName} ${student.lastName} ${student.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  ) : [];

  const filteredTutors = Array.isArray(tutors) ? tutors.filter((tutor: any) =>
    `${tutor.firstName} ${tutor.lastName} ${tutor.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  ) : [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  const handleViewUser = (user: any) => {
    setSelectedUser(user);
    setUserDetailsOpen(true);
  };

  // Check for authentication errors
  if (studentsError || tutorsError) {
    const error = studentsError || tutorsError;
    if (error?.message?.includes('401')) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Brak autoryzacji</h3>
          <p className="text-gray-600 mb-4">Musisz być zalogowany jako administrator.</p>
          <Button 
            onClick={() => window.location.href = '/admin-login'}
            className="bg-navy-900 hover:bg-navy-800"
          >
            Przejdź do logowania administratora
          </Button>
        </div>
      );
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-navy-900 flex items-center gap-2">
            <Users className="w-6 h-6" />
            Zarządzanie użytkownikami
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Szukaj użytkowników..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="students" className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Uczniowie ({filteredStudents.length})
              </TabsTrigger>
              <TabsTrigger value="tutors" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Korepetytorzy ({filteredTutors.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="students" className="mt-6">
              {studentsLoading ? (
                <div className="text-center py-8">Ładowanie uczniów...</div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? "Nie znaleziono uczniów" : "Brak zarejestrowanych uczniów"}
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredStudents.map((student: any) => (
                    <Card key={student.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-navy-900">
                                {student.firstName} {student.lastName}
                              </h3>
                              <Badge variant={student.isActive ? "default" : "secondary"}>
                                {student.isActive ? "Aktywny" : "Nieaktywny"}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                {student.email}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                Dołączył: {formatDate(student.createdAt)}
                              </div>
                              {student.profile && (
                                <>
                                  <div>
                                    Poziom: {student.profile.level} (XP: {student.profile.xp})
                                  </div>
                                  <div>
                                    Lekcje: {student.profile.totalLessons} | Seria: {student.profile.streak} dni
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewUser(student)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Podgląd
                            </Button>
                            <Button
                              variant={student.isActive ? "destructive" : "default"}
                              size="sm"
                              onClick={() => toggleUserStatus.mutate({
                                userId: student.id,
                                action: student.isActive ? 'deactivate' : 'activate'
                              })}
                              disabled={toggleUserStatus.isPending}
                            >
                              {student.isActive ? (
                                <>
                                  <UserX className="w-4 h-4 mr-1" />
                                  Dezaktywuj
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-4 h-4 mr-1" />
                                  Aktywuj
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="tutors" className="mt-6">
              {tutorsLoading ? (
                <div className="text-center py-8">Ładowanie korepetytorów...</div>
              ) : filteredTutors.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? "Nie znaleziono korepetytorów" : "Brak zarejestrowanych korepetytorów"}
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredTutors.map((tutor: any) => (
                    <Card key={tutor.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-navy-900">
                                {tutor.firstName} {tutor.lastName}
                              </h3>
                              <Badge variant={tutor.isActive ? "default" : "secondary"}>
                                {tutor.isActive ? "Aktywny" : "Nieaktywny"}
                              </Badge>
                              {tutor.profile?.isVerified && (
                                <Badge variant="outline" className="text-green-600 border-green-600">
                                  Zweryfikowany
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                              <div className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                {tutor.email}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                Dołączył: {formatDate(tutor.createdAt)}
                              </div>
                              {tutor.profile && (
                                <>
                                  <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4" />
                                    Ocena: {tutor.profile.rating}/5
                                  </div>
                                  <div>
                                    Stawka: {tutor.profile.hourlyRate} zł/h
                                  </div>
                                </>
                              )}
                            </div>
                            {tutor.profile?.bio && (
                              <p className="text-sm text-gray-600 mb-2">
                                {tutor.profile.bio.length > 100 
                                  ? `${tutor.profile.bio.substring(0, 100)}...` 
                                  : tutor.profile.bio}
                              </p>
                            )}
                            {tutor.profile?.specializations && tutor.profile.specializations.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {tutor.profile.specializations.map((spec: string, index: number) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {spec}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewUser(tutor)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Podgląd
                            </Button>
                            {!tutor.profile?.isVerified && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => verifyTutor.mutate(tutor.id)}
                                disabled={verifyTutor.isPending}
                              >
                                <UserCheck className="w-4 h-4 mr-1" />
                                Zweryfikuj
                              </Button>
                            )}
                            <Button
                              variant={tutor.isActive ? "destructive" : "default"}
                              size="sm"
                              onClick={() => toggleUserStatus.mutate({
                                userId: tutor.id,
                                action: tutor.isActive ? 'deactivate' : 'activate'
                              })}
                              disabled={toggleUserStatus.isPending}
                            >
                              {tutor.isActive ? (
                                <>
                                  <UserX className="w-4 h-4 mr-1" />
                                  Dezaktywuj
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-4 h-4 mr-1" />
                                  Aktywuj
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl text-navy-900">
              Szczegóły użytkownika: {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Podstawowe informacje
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium text-gray-700">Imię i nazwisko:</span>
                      <p className="text-navy-900">{selectedUser.firstName} {selectedUser.lastName}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Email:</span>
                      <p className="text-navy-900">{selectedUser.email}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Rola:</span>
                      <Badge variant="outline">{selectedUser.role === 'student' ? 'Uczeń' : 'Korepetytor'}</Badge>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Status:</span>
                      <Badge variant={selectedUser.isActive ? "default" : "secondary"}>
                        {selectedUser.isActive ? "Aktywny" : "Nieaktywny"}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Data rejestracji:</span>
                      <p className="text-navy-900">{formatDate(selectedUser.createdAt)}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">ID:</span>
                      <p className="text-gray-600 text-sm font-mono">{selectedUser.id}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Student Profile Details */}
              {selectedUser.role === 'student' && selectedUser.profile && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <GraduationCap className="w-5 h-5" />
                      Profil ucznia
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Trophy className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-blue-900">Poziom</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">{selectedUser.profile.level}</p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Star className="w-4 h-4 text-yellow-600" />
                          <span className="font-medium text-yellow-900">XP</span>
                        </div>
                        <p className="text-2xl font-bold text-yellow-600">{selectedUser.profile.xp}</p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Flame className="w-4 h-4 text-orange-600" />
                          <span className="font-medium text-orange-900">Seria</span>
                        </div>
                        <p className="text-2xl font-bold text-orange-600">{selectedUser.profile.streak} dni</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-gray-700">Ukończone lekcje:</span>
                        <p className="text-navy-900 text-lg">{selectedUser.profile.totalLessons}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Postęp w tematach:</span>
                        <p className="text-navy-900 text-sm">Dane dostępne w panelu postępu</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tutor Profile Details */}
              {selectedUser.role === 'tutor' && selectedUser.profile && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <UserCheck className="w-5 h-5" />
                      Profil korepetytora
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Star className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-green-900">Ocena</span>
                        </div>
                        <p className="text-2xl font-bold text-green-600">{selectedUser.profile.rating}/5</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <BookOpen className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-blue-900">Lekcje</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">{selectedUser.profile.totalLessons}</p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <DollarSign className="w-4 h-4 text-yellow-600" />
                          <span className="font-medium text-yellow-900">Stawka</span>
                        </div>
                        <p className="text-2xl font-bold text-yellow-600">{selectedUser.profile.hourlyRate} zł/h</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="font-medium text-gray-700">Status weryfikacji:</span>
                        <div className="mt-1">
                          <Badge variant={selectedUser.profile.isVerified ? "default" : "outline"}>
                            {selectedUser.profile.isVerified ? "Zweryfikowany" : "Niezweryfikowany"}
                          </Badge>
                        </div>
                      </div>
                      
                      {selectedUser.profile.bio && (
                        <div>
                          <span className="font-medium text-gray-700">Biografia:</span>
                          <p className="text-navy-900 mt-1 bg-gray-50 p-3 rounded-lg">{selectedUser.profile.bio}</p>
                        </div>
                      )}
                      
                      {selectedUser.profile.specializations && selectedUser.profile.specializations.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-700">Specjalizacje:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {selectedUser.profile.specializations.map((spec, index) => (
                              <Badge key={index} variant="outline">{spec}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* View As Section */}
              <Card className="border-2 border-navy-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Podgląd jako użytkownik
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-700 mb-1">
                        Zobacz jak wygląda aplikacja z perspektywy tego użytkownika
                      </p>
                      <p className="text-sm text-gray-500">
                        Otwiera się w nowej karcie w trybie podglądu
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        const role = selectedUser.role === 'student' ? 'student' : 'tutor';
                        const url = `/${role}-dashboard?demo=true&viewAs=${selectedUser.id}`;
                        window.open(url, '_blank');
                      }}
                      className="bg-navy-900 hover:bg-navy-800"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View as {selectedUser.role === 'student' ? 'uczeń' : 'korepetytor'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}