import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SchoolMasterLogo from "@/assets/schoolmaster-logo.png";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, GraduationCap, Users, BookOpen, Clock, Star, ArrowRight, CheckCircle, Mail, CreditCard } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function RoleSelection() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<"student" | "tutor" | null>(null);
  const [parentEmail, setParentEmail] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [step, setStep] = useState<"selection" | "details">("selection");
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const roleSelectionMutation = useMutation({
    mutationFn: async (data: { role: "student" | "tutor"; parentEmail?: string; bankAccount?: string }) => {
      return await apiRequest("/api/auth/setup-role", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Rola została ustawiona",
        description: `Twoja rola jako ${selectedRole === "student" ? "uczeń" : "korepetytor"} została pomyślnie ustawiona.`,
      });
      
      // Redirect to appropriate dashboard
      if (selectedRole === "student") {
        setLocation("/student-dashboard");
      } else {
        setLocation("/tutor-dashboard");
      }
    },
    onError: (error) => {
      toast({
        title: "Błąd",
        description: "Nie udało się ustawić roli. Spróbuj ponownie.",
        variant: "destructive",
      });
    },
  });

  const handleRoleSelection = (role: "student" | "tutor") => {
    setSelectedRole(role);
    setStep("details");
  };

  const handleBack = () => {
    setStep("selection");
    setSelectedRole(null);
    setParentEmail("");
    setBankAccount("");
  };

  const handleConfirmRole = () => {
    if (selectedRole) {
      const data: { role: "student" | "tutor"; parentEmail?: string; bankAccount?: string } = {
        role: selectedRole
      };
      
      if (selectedRole === "student" && parentEmail) {
        data.parentEmail = parentEmail;
      }
      
      if (selectedRole === "tutor" && bankAccount) {
        data.bankAccount = bankAccount;
      }
      
      roleSelectionMutation.mutate(data);
    }
  };

  const isFormValid = () => {
    if (selectedRole === "student") {
      return parentEmail.includes("@") && parentEmail.length > 5;
    }
    if (selectedRole === "tutor") {
      return bankAccount.length >= 20; // Polish bank account numbers are typically 26 digits
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">

              <img 
                src={SchoolMasterLogo} 
                alt="SchoolMaster" 
                className="h-6"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Witaj w SchoolMaster!
          </h1>
          {step === "selection" ? (
            <>
              <p className="text-xl text-gray-600 mb-2">
                Wybierz swoją rolę na platformie
              </p>
              <p className="text-gray-500">
                Ten wybór określi funkcje dostępne w Twoim panelu użytkownika
              </p>
            </>
          ) : (
            <>
              <p className="text-xl text-gray-600 mb-2">
                {selectedRole === "student" ? "Dodatkowe informacje - Uczeń" : "Dodatkowe informacje - Korepetytor"}
              </p>
              <p className="text-gray-500">
                {selectedRole === "student" 
                  ? "Potrzebujemy kontakt do rodzica/opiekuna" 
                  : "Podaj numer konta do wypłat za lekcje"
                }
              </p>
            </>
          )}
        </div>

        {step === "selection" ? (
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Student Role Card */}
            <Card 
              className="cursor-pointer transition-all hover:shadow-lg hover:shadow-md"
              onClick={() => handleRoleSelection("student")}
            >
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <GraduationCap className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Uczeń
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-center mb-6">
                  Przygotowuj się do egzaminów ósmoklasisty z pomocą doświadczonych korepetytorów
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-700">Dostęp do lekcji i materiałów</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-700">Automatyczne dopasowanie korepetytora</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-700">Elastyczny harmonogram nauki</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-700">System nagród i osiągnięć</span>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg mt-6">
                  <h4 className="font-semibold text-blue-900 mb-2">Co otrzymasz:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Spersonalizowany plan nauki</li>
                    <li>• Dostęp do zadań i testów</li>
                    <li>• Śledzenie postępów w nauce</li>
                    <li>• System motywacyjny z XP i poziomami</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Tutor Role Card */}
            <Card 
              className="cursor-pointer transition-all hover:shadow-lg hover:shadow-md"
              onClick={() => handleRoleSelection("tutor")}
            >
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Korepetytor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-center mb-6">
                  Zarabiaj pomagając uczniom w przygotowaniach do egzaminów
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Otrzymuj uczniów automatycznie</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Ustaw własną dostępność</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Dostęp do materiałów dydaktycznych</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">System ocen i rekomendacji</span>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg mt-6">
                  <h4 className="font-semibold text-green-900 mb-2">Co otrzymasz:</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Panel zarządzania uczniami</li>
                    <li>• System zaproszeń do lekcji</li>
                    <li>• Narzędzia do śledzenia postępów</li>
                    <li>• Automatyczne rozliczenia płatności</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-lg">
              <CardHeader className="text-center pb-6">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                  selectedRole === "student" ? "bg-blue-100" : "bg-green-100"
                }`}>
                  {selectedRole === "student" ? (
                    <GraduationCap className={`w-8 h-8 ${selectedRole === "student" ? "text-blue-600" : "text-green-600"}`} />
                  ) : (
                    <Users className={`w-8 h-8 ${selectedRole === "student" ? "text-blue-600" : "text-green-600"}`} />
                  )}
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {selectedRole === "student" ? "Uczeń" : "Korepetytor"}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {selectedRole === "student" ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-blue-900">Email rodzica/opiekuna</h3>
                      </div>
                      <p className="text-sm text-blue-700 mb-4">
                        Wymagamy kontakt do rodzica/opiekuna w celu potwierdzenia udziału w zajęciach i raportowania postępów.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="parentEmail" className="text-gray-700 font-medium">
                        Email rodzica/opiekuna *
                      </Label>
                      <Input
                        id="parentEmail"
                        type="email"
                        placeholder="rodzic@email.com"
                        value={parentEmail}
                        onChange={(e) => setParentEmail(e.target.value)}
                        className="h-12"
                      />
                      <p className="text-sm text-gray-500">
                        Na ten adres będziemy wysyłać raporty postępów i informacje o lekcjach
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="w-5 h-5 text-green-600" />
                        <h3 className="font-semibold text-green-900">Numer konta bankowego</h3>
                      </div>
                      <p className="text-sm text-green-700 mb-4">
                        Potrzebujemy numeru konta do wypłat za przeprowadzone lekcje. Wypłaty realizujemy co tydzień.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bankAccount" className="text-gray-700 font-medium">
                        Numer konta bankowego *
                      </Label>
                      <Input
                        id="bankAccount"
                        type="text"
                        placeholder="00 0000 0000 0000 0000 0000 0000"
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value.replace(/\D/g, '').replace(/(.{2})/g, '$1 ').trim())}
                        className="h-12 font-mono"
                        maxLength={32}
                      />
                      <p className="text-sm text-gray-500">
                        Podaj 26-cyfrowy numer konta w formacie polskim (włącznie ze spacjami)
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-6">
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    className="flex-1 h-12"
                  >
                    Wróć do wyboru roli
                  </Button>
                  
                  <Button
                    onClick={handleConfirmRole}
                    disabled={!isFormValid() || roleSelectionMutation.isPending}
                    className={`flex-1 h-12 ${
                      selectedRole === "student" 
                        ? "bg-blue-600 hover:bg-blue-700" 
                        : "bg-green-600 hover:bg-green-700"
                    } text-white`}
                  >
                    {roleSelectionMutation.isPending ? (
                      "Tworzenie konta..."
                    ) : (
                      <>
                        Utwórz konto {selectedRole === "student" ? "Ucznia" : "Korepetytora"}
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}