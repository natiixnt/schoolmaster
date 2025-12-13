import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TutorAvailabilityForm } from "@/components/matching/tutor-availability-form";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Users, Clock, CheckCircle, XCircle } from "lucide-react";

export default function TutorMatching() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("availability");

  // Get tutor matches
  const { data: matches } = useQuery({
    queryKey: ["/api/tutor/matches"],
    retry: false,
  });

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-300">Oczekuje odpowiedzi</Badge>;
      case "accepted":
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">Zaakceptowany</Badge>;
      case "rejected":
        return <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-300">Odrzucony</Badge>;
      case "active":
        return <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-300">Aktywny</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
            Panel korepetytora
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Zarządzaj swoją dostępnością i sprawdzaj przydzielonych uczniów. 
            System automatycznie dopasuje do Ciebie odpowiednich uczniów.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-navy-800">
                {matches?.filter((m: any) => m.status === 'pending').length || 0}
              </h3>
              <p className="text-sm text-gray-600">Nowych dopasowań</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-navy-800">
                {matches?.filter((m: any) => m.status === 'accepted' || m.status === 'active').length || 0}
              </h3>
              <p className="text-sm text-gray-600">Aktywnych uczniów</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold text-navy-800">85%</h3>
              <p className="text-sm text-gray-600">Wskaźnik dopasowania</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="availability" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Dostępność
            </TabsTrigger>
            <TabsTrigger value="matches" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Dopasowania
              {matches?.filter((m: any) => m.status === 'pending').length > 0 && (
                <Badge className="ml-1 h-5 w-5 p-0 bg-red-500 text-white text-xs">
                  {matches.filter((m: any) => m.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="availability" className="mt-6">
            <TutorAvailabilityForm />
          </TabsContent>

          <TabsContent value="matches" className="mt-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-navy-800">
                Twoje dopasowania z uczniami
              </h3>
              
              {!matches || matches.length === 0 ? (
                <Card>
                  <CardHeader className="text-center">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <CardTitle className="text-gray-600">Brak dopasowań</CardTitle>
                    <CardDescription>
                      Gdy system znajdzie dla Ciebie odpowiednich uczniów, zobaczysz ich tutaj.
                      Upewnij się, że Twoja dostępność jest aktualna.
                    </CardDescription>
                  </CardHeader>
                </Card>
              ) : (
                matches.map((match: any) => (
                  <Card key={match.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg text-navy-800">
                            Uczén #{match.studentId.slice(-6)}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-600">
                              Dopasowanie: {match.matchScore}%
                            </span>
                            {getStatusBadge(match.status)}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm text-gray-600">
                            Przypisano: {new Date(match.assignedAt).toLocaleDateString('pl-PL')}
                          </div>
                          {match.preferredTime && (
                            <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              Preferowany termin: {match.preferredTime}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      {match.status === "pending" && (
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Odrzuć
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Zaakceptuj
                          </Button>
                        </div>
                      )}
                      
                      {match.status === "accepted" && (
                        <div className="text-sm text-green-600 font-medium text-right">
                          ✓ Gotowy do rozpoczęcia lekcji
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Information Card */}
        <Card className="bg-blue-50 border-blue-200 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-lg text-blue-800">ℹ️ Jak to działa?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-blue-700 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Ustaw swoją dostępność, aby system mógł dopasować do Ciebie uczniów</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>System automatycznie znajduje uczniów pasujących do Twojego harmonogramu</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Możesz zaakceptować lub odrzucić propozycje dopasowania</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}