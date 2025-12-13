import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StudentEnrollmentForm } from "@/components/matching/student-enrollment-form";
import { MatchingStatus } from "@/components/matching/matching-status";
import { useAuth } from "@/hooks/useAuth";
import { UserPlus, Search, CheckCircle, Clock } from "lucide-react";

export default function StudentEnrollment() {
  const [showForm, setShowForm] = useState(false);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: matchingStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["/api/student/matching-status"],
    enabled: isAuthenticated,
  });

  if (authLoading || statusLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-navy-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-50 to-blue-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Wymagane logowanie</h2>
            <p className="text-gray-600 mb-4">
              Aby skorzystać z systemu dopasowywania korepetytorów, musisz się zalogować.
            </p>
            <Button
              onClick={() => window.location.href = "/api/login"}
              className="bg-navy-900 hover:bg-navy-800"
            >
              Zaloguj się
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasActiveEnrollment = matchingStatus && matchingStatus.isActive;

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-navy-900 mb-4">
            Automatyczne Dopasowanie Korepetytora
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Nasz inteligentny system znajdzie dla Ciebie idealnego korepetytora na podstawie 
            Twoich preferencji czasowych, budżetu i poziomu zaawansowania.
          </p>
        </div>

        {/* Process Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-6 h-6 text-navy-600" />
              </div>
              <h3 className="font-semibold mb-2">1. Wypełnij formularz</h3>
              <p className="text-sm text-gray-600">
                Podaj swoje preferencje czasowe i poziom zaawansowania
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="font-semibold mb-2">2. Automatyczne wyszukiwanie</h3>
              <p className="text-sm text-gray-600">
                System znajdzie korepetytorów pasujących do Twoich wymagań
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">3. Czekamy na odpowiedź</h3>
              <p className="text-sm text-gray-600">
                Korepetytor ma 24h na potwierdzenie chęci współpracy
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">4. Rozpocznij naukę</h3>
              <p className="text-sm text-gray-600">
                Umów pierwszą lekcję i zacznij przygotowania do egzaminu
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {hasActiveEnrollment ? (
            // Show matching status if enrollment exists
            <div className="space-y-6">
              <MatchingStatus studentId={user?.id} />
              
              {/* Option to create new enrollment */}
              <Card>
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-semibold mb-2">
                    Potrzebujesz korepetytora z innego przedmiotu?
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Możesz zgłosić się również na inne przedmioty lub zmienić swoje preferencje.
                  </p>
                  <Button
                    onClick={() => setShowForm(true)}
                    variant="outline"
                    className="border-navy-300 text-navy-700 hover:bg-navy-50"
                  >
                    Wypełnij nowy formularz
                  </Button>
                </CardContent>
              </Card>

              {showForm && (
                <StudentEnrollmentForm 
                  onEnrollmentComplete={() => setShowForm(false)}
                />
              )}
            </div>
          ) : (
            // Show enrollment form if no active enrollment
            <div className="space-y-6">
              <Card className="text-center bg-gradient-to-r from-navy-600 to-blue-600 text-white">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-4">
                    Znajdźmy Ci idealnego korepetytora!
                  </h2>
                  <p className="text-navy-100 mb-6">
                    Wypełnij formularz poniżej, a nasz algorytm automatycznie dobierze 
                    korepetytora idealnie pasującego do Twoich potrzeb i harmonogramu.
                  </p>
                  <Badge variant="secondary" className="bg-yellow-400 text-navy-900">
                    ⭐ Średnia ocena naszych korepetytorów: 4.9/5
                  </Badge>
                </CardContent>
              </Card>

              <StudentEnrollmentForm />
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8 text-navy-900">
            Dlaczego automatyczne dopasowanie?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-green-600 font-bold text-lg">⚡</span>
                </div>
                <h3 className="font-semibold mb-2">Szybkie dopasowanie</h3>
                <p className="text-sm text-gray-600">
                  Algorytm analizuje wszystkich dostępnych korepetytorów w ciągu kilku sekund
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-blue-600 font-bold text-lg">🎯</span>
                </div>
                <h3 className="font-semibold mb-2">Precyzyjne dopasowanie</h3>
                <p className="text-sm text-gray-600">
                  Bierzemy pod uwagę Twoje preferencje czasowe, budżet i styl nauki
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-purple-600 font-bold text-lg">📊</span>
                </div>
                <h3 className="font-semibold mb-2">Ranking jakości</h3>
                <p className="text-sm text-gray-600">
                  Prioritetyzujemy korepetytorów z najlepszymi ocenami i doświadczeniem
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}