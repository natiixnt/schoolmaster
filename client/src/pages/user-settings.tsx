import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Calculator, User, Mail, CreditCard, Shield, Save, AlertTriangle, BookOpen, Calendar, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { StudentProfile, TutorProfile, TutorAvailability } from "@shared/schema";
// Removed AvailabilityModal import - now using dedicated pages

export default function UserSettings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Early return if user is not loaded
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  // Form states
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [email, setEmail] = useState(user.email || "");
  const [role, setRole] = useState(user.role || "");
  const [parentEmail, setParentEmail] = useState(user.parentEmail || "");
  const [bankAccount, setBankAccount] = useState(user.bankAccount || "");
  const [levelDescription, setLevelDescription] = useState("");
  const [bio, setBio] = useState("");
  // Removed availability modal state - now using dedicated pages

  // Fetch student profile if user is a student
  const { data: studentProfile } = useQuery<StudentProfile>({
    queryKey: ["/api/student/profile", user.id],
    enabled: user.role === "student",
  });

  // Fetch tutor profile if user is a tutor
  const { data: tutorProfile } = useQuery<TutorProfile>({
    queryKey: ["/api/tutor/profile", user.id],
    enabled: user.role === "tutor",
  });

  // Fetch tutor availability if user is a tutor
  const { data: tutorAvailability } = useQuery<TutorAvailability[]>({
    queryKey: ["/api/tutor/availability", user.id],
    enabled: user.role === "tutor",
  });

  // Update level description when student profile loads
  useEffect(() => {
    if (studentProfile?.levelDescription) {
      setLevelDescription(studentProfile.levelDescription);
    }
  }, [studentProfile]);

  // Update bio when tutor profile loads
  useEffect(() => {
    if (tutorProfile?.bio) {
      setBio(tutorProfile.bio);
    }
  }, [tutorProfile]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/auth/profile", "PATCH", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tutor/profile"] });
      toast({
        title: "Profil zaktualizowany",
        description: "Twoje dane zostały pomyślnie zaktualizowane.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się zaktualizować profilu.",
        variant: "destructive",
      });
    },
  });

  // Change role mutation
  const changeRoleMutation = useMutation({
    mutationFn: async (data: { role: string; parentEmail?: string; bankAccount?: string }) => {
      return await apiRequest("/api/auth/change-role", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Rola została zmieniona",
        description: "Twoja rola została pomyślnie zmieniona. Przekierowujemy Cię do odpowiedniego panelu.",
      });
      
      // Redirect to appropriate dashboard
      if (role === "student") {
        setLocation("/student-dashboard");
      } else if (role === "tutor") {
        setLocation("/tutor-dashboard");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się zmienić roli.",
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = () => {
    const profileData = {
      firstName,
      lastName,
      email,
    };

    // Add student-specific data
    if (user.role === "student" && levelDescription !== "") {
      (profileData as any).levelDescription = levelDescription;
    }

    // Add tutor-specific data
    if (user.role === "tutor" && bio !== "") {
      (profileData as any).bio = bio;
    }

    // Add role-specific data if role is being changed
    if (role !== user.role) {
      if (role === "student" && parentEmail) {
        (profileData as any).parentEmail = parentEmail;
      }
      if (role === "tutor" && bankAccount) {
        (profileData as any).bankAccount = bankAccount;
      }
    }

    updateProfileMutation.mutate(profileData);
  };

  const handleChangeRole = () => {
    const roleData: { role: string; parentEmail?: string; bankAccount?: string } = { role };

    // Validate required fields
    if (role === "student") {
      if (!parentEmail || !parentEmail.includes("@")) {
        toast({
          title: "Błąd",
          description: "Email rodzica jest wymagany dla uczniów.",
          variant: "destructive",
        });
        return;
      }
      roleData.parentEmail = parentEmail;
    }

    if (role === "tutor") {
      if (!bankAccount || bankAccount.replace(/\s/g, '').length < 20) {
        toast({
          title: "Błąd",
          description: "Prawidłowy numer konta jest wymagany dla korepetytorów.",
          variant: "destructive",
        });
        return;
      }
      roleData.bankAccount = bankAccount;
    }

    changeRoleMutation.mutate(roleData);
  };

  const isRoleChanged = role !== user.role;
  const isProfileChanged = firstName !== user.firstName || lastName !== user.lastName || email !== user.email || 
    (user.role === "student" && levelDescription !== "" && levelDescription !== (studentProfile?.levelDescription || ""));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Ustawienia konta
          </h1>
          <p className="text-xl text-gray-600">
            Zarządzaj swoimi danymi osobowymi i ustawieniami konta
          </p>
        </div>

        <div className="grid gap-8">
          {/* Basic Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Dane osobowe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Imię</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Twoje imię"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nazwisko</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Twoje nazwisko"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="twoj@email.com"
                />
              </div>

              {isProfileChanged && (
                <Button
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateProfileMutation.isPending ? "Zapisywanie..." : "Zapisz zmiany"}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Student Academic Information */}
          {user.role === "student" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Opis poziomu akademickiego
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-blue-900">Opisz swój poziom wiedzy</h3>
                    </div>
                    <p className="text-sm text-blue-700">
                      Opisz swój obecny poziom wiedzy w przedmiotach, z którymi potrzebujesz pomocy. 
                      To pomoże korepetytorowi lepiej przygotować się do lekcji.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="levelDescription">Opis poziomu wiedzy</Label>
                    <Textarea
                      id="levelDescription"
                      placeholder="Np. Dobrze rozumiem podstawy algebry, ale mam problemy z równaniami kwadratowymi. W geometrii znam wzory na pola, ale przestrzenna geometria sprawia mi trudność..."
                      value={levelDescription}
                      onChange={(e) => setLevelDescription(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                    <p className="text-xs text-gray-500">
                      Ten opis będzie widoczny dla korepetytorów przy zapytaniach o lekcje.
                    </p>
                  </div>

                  {levelDescription && (
                    <Button
                      onClick={handleSaveProfile}
                      disabled={updateProfileMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {updateProfileMutation.isPending ? "Zapisywanie..." : "Zapisz opis poziomu"}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Student Availability Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Preferencje czasowe
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-green-900">Ustaw preferowane godziny lekcji</h3>
                    </div>
                    <p className="text-sm text-green-700">
                      Określ godziny, w których preferujesz mieć lekcje. Pomoże to korepetytorowi znaleźć odpowiedni termin.
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-blue-900">Zarządzaj dostępnością</h4>
                      <p className="text-sm text-blue-700">Przejdź do pełnego kalendarza dostępności</p>
                    </div>
                    <Button
                      onClick={() => setLocation("/student-availability")}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Otwórz kalendarz
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Tutor Professional Profile */}
          {user.role === "tutor" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Profil zawodowy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-blue-900">Opisz swoje doświadczenie</h3>
                    </div>
                    <p className="text-sm text-blue-700">
                      Opisz swoje doświadczenie w nauczaniu, specjalizacje i podejście do nauki. 
                      To pomoże uczniom wybrać najlepszego korepetytora.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio">Opis profilu zawodowego</Label>
                    <Textarea
                      id="bio"
                      placeholder="Np. Jestem doświadczonym matematykiem z 5-letnim doświadczeniem w korepetycjach. Specjalizuję się w przygotowaniu do egzaminów ósmoklasisty i maturalnych. Moje podejście do nauki opiera się na..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={6}
                      className="resize-none"
                    />
                    <p className="text-xs text-gray-500">
                      Ten opis będzie widoczny dla uczniów przy wyborze korepetytora.
                    </p>
                  </div>

                  {bio && (
                    <Button
                      onClick={handleSaveProfile}
                      disabled={updateProfileMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {updateProfileMutation.isPending ? "Zapisywanie..." : "Zapisz opis profilu"}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Tutor Availability Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Zarządzanie dostępnością
                  </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-green-900">Ustaw swoją dostępność</h3>
                  </div>
                  <p className="text-sm text-green-700">
                    Określ godziny, w których jesteś dostępny na lekcje. Uczniowie będą mogli umówiać się na lekcje tylko w wyznaczonych godzinach.
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-blue-900">Zarządzaj dostępnością</h4>
                    <p className="text-sm text-blue-700">Przejdź do pełnego kalendarza dostępności</p>
                  </div>
                  <Button
                    onClick={() => setLocation("/tutor-availability")}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Otwórz kalendarz
                  </Button>
                </div>

                {tutorAvailability && tutorAvailability.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Aktualna dostępność:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(() => {
                        // Group availability by day
                        const dayNames = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
                        const groupedAvailability = tutorAvailability.reduce((acc: any, slot: any) => {
                          const dayName = dayNames[slot.dayOfWeek];
                          if (!acc[dayName]) acc[dayName] = [];
                          acc[dayName].push(slot.hour);
                          return acc;
                        }, {});

                        return Object.entries(groupedAvailability).map(([day, hours]: [string, any]) => (
                          <div key={day} className="text-sm">
                            <span className="font-medium text-gray-900">{day}:</span>
                            <div className="text-gray-600 ml-2">
                              {Array.isArray(hours) && hours.length > 0 
                                ? hours.sort().join(", ") 
                                : "Niedostępny"
                              }
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}
                
                {tutorAvailability && tutorAvailability.length === 0 && (
                  <p className="text-gray-500 text-sm">Brak ustawionej dostępności</p>
                )}
              </CardContent>
            </Card>
            </>
          )}

          <Separator />

          {/* Role Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Zarządzanie rolą
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-800">Uwaga</h4>
                    <p className="text-sm text-yellow-700">
                      Zmiana roli spowoduje przekierowanie do odpowiedniego panelu i może wymagać dodatkowych danych.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Aktualna rola: <span className="font-semibold">{user.role === "student" ? "Uczeń" : user.role === "tutor" ? "Korepetytor" : "Administrator"}</span></Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz nową rolę" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Uczeń</SelectItem>
                    <SelectItem value="tutor">Korepetytor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Role-specific fields */}
              {isRoleChanged && (
                <div className="space-y-4 border-t pt-4">
                  {role === "student" && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="w-5 h-5 text-blue-600" />
                          <h3 className="font-semibold text-blue-900">Email rodzica/opiekuna</h3>
                        </div>
                        <p className="text-sm text-blue-700">
                          Wymagamy kontakt do rodzica/opiekuna dla konta ucznia.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="parentEmail">Email rodzica/opiekuna *</Label>
                        <Input
                          id="parentEmail"
                          type="email"
                          placeholder="rodzic@email.com"
                          value={parentEmail}
                          onChange={(e) => setParentEmail(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {role === "tutor" && (
                    <div className="space-y-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard className="w-5 h-5 text-green-600" />
                          <h3 className="font-semibold text-green-900">Numer konta bankowego</h3>
                        </div>
                        <p className="text-sm text-green-700">
                          Numer konta potrzebny do wypłat za przeprowadzone lekcje.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="bankAccount">Numer konta bankowego *</Label>
                        <Input
                          id="bankAccount"
                          type="text"
                          placeholder="00 0000 0000 0000 0000 0000 0000"
                          value={bankAccount}
                          onChange={(e) => setBankAccount(e.target.value.replace(/\D/g, '').replace(/(.{2})/g, '$1 ').trim())}
                          className="font-mono"
                          maxLength={32}
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleChangeRole}
                    disabled={changeRoleMutation.isPending}
                    className="bg-orange-600 hover:bg-orange-700 w-full"
                  >
                    {changeRoleMutation.isPending ? (
                      "Zmienianie roli..."
                    ) : (
                      `Zmień rolę na ${role === "student" ? "Uczeń" : "Korepetytor"}`
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Removed old availability modal - students now use dedicated page */}
    </div>
  );
}