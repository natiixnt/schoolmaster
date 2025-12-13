import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentMatchingForm } from "@/components/matching/student-matching-form";
import { MatchResults } from "@/components/matching/match-results";
import { useToast } from "@/hooks/use-toast";
import { Search, Users, CheckCircle, Clock } from "lucide-react";

export default function StudentMatching() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("preferences");
  const [hasMatches, setHasMatches] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Nieautoryzowany dostęp",
        description: "Logujesz się ponownie...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const handleMatchesFound = (matches: any[]) => {
    if (matches.length > 0) {
      setHasMatches(true);
      setActiveTab("results");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-50 to-yellow-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-navy-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-50 to-yellow-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-navy-800">
            Znajdź idealnego korepetytora
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Nasz inteligentny system dopasowuje Cię z najlepszymi korepetytorami 
            na podstawie Twoich preferencji czasowych, stylu nauki i potrzeb.
          </p>
        </div>

        {/* Process Steps */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Search className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-navy-800">1. Preferencje</h3>
              <p className="text-sm text-gray-600 mt-1">
                Wypełnij formularz z preferowanymi terminami i stylem nauki
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-navy-800">2. Matching</h3>
              <p className="text-sm text-gray-600 mt-1">
                System znajdzie korepetytorów pasujących do Twoich kryteriów
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-navy-800">3. Wybór</h3>
              <p className="text-sm text-gray-600 mt-1">
                Przejrzyj propozycje i zaakceptuj najlepszego korepetytora
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-navy-800">4. Lekcje</h3>
              <p className="text-sm text-gray-600 mt-1">
                Rozpocznij naukę z wybranym korepetytorem
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Preferencje
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Wyniki {hasMatches && "✓"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preferences" className="mt-6">
            <StudentMatchingForm onMatchesFound={handleMatchesFound} />
          </TabsContent>

          <TabsContent value="results" className="mt-6">
            <MatchResults />
          </TabsContent>
        </Tabs>

        {/* Tips Card */}
        <Card className="bg-blue-50 border-blue-200 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-lg text-blue-800">💡 Wskazówki</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-blue-700 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Bądź szczery w opisie swojego poziomu - pomoże to znaleźć odpowiedniego korepetytora</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Wybierz elastyczne terminy - zwiększy to szanse na znalezienie dopasowania</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Możesz zawsze zmienić preferencje i szukać ponownie</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}