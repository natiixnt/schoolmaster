import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Star, Clock, CheckCircle, XCircle, User, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface MatchResultsProps {
  className?: string;
}

export function MatchResults({ className }: MatchResultsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get student matches
  const { data: matches, isLoading } = useQuery({
    queryKey: ["/api/student/matches"],
    retry: false,
  });

  const updateMatchStatusMutation = useMutation({
    mutationFn: async ({ matchId, status }: { matchId: string; status: string }) => {
      return await apiRequest(`/api/match/${matchId}/status`, "PATCH", { status });
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/student/matches"] });
      toast({
        title: status === 'accepted' ? "Korepetytor zaakceptowany!" : "Korepetytor odrzucony",
        description: status === 'accepted' 
          ? "Możesz teraz umówić się na pierwszą lekcję."
          : "Możesz rozważyć innych korepetytorów z listy.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się zaktualizować statusu",
        variant: "destructive",
      });
    },
  });

  const handleAcceptMatch = (matchId: string) => {
    updateMatchStatusMutation.mutate({ matchId, status: "accepted" });
  };

  const handleRejectMatch = (matchId: string) => {
    updateMatchStatusMutation.mutate({ matchId, status: "rejected" });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-300">Oczekuje</Badge>;
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

  const formatPreferredTime = (timeString: string) => {
    if (!timeString) return "";
    const [day, time] = timeString.split(":");
    const days = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];
    return `${days[parseInt(day)]} ${time}`;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!matches || (matches as any[]).length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="text-center">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <CardTitle className="text-gray-600">Brak dopasowań</CardTitle>
          <CardDescription>
            Nie znaleziono korepetytorów pasujących do Twoich preferencji. Spróbuj zmienić kryteria wyszukiwania.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-xl font-semibold text-navy-800 mb-4">
        Znalezione dopasowania ({(matches as any[]).length})
      </h3>
      
      {(matches as any[]).map((match: any) => (
        <Card key={match.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-navy-100 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-navy-600" />
                </div>
                <div>
                  <CardTitle className="text-lg text-navy-800">
                    Korepetytor #{match.tutorId.slice(-6)}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm text-gray-600">
                        Ocena: {match.matchScore || 0}/100
                      </span>
                    </div>
                    {getStatusBadge(match.status)}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-semibold text-navy-800">
                  {match.matchScore}% dopasowania
                </div>
                {match.preferredTime && (
                  <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" />
                    {formatPreferredTime(match.preferredTime)}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <p>Przypisano: {new Date(match.assignedAt).toLocaleDateString('pl-PL')}</p>
                {match.acceptedAt && (
                  <p className="text-green-600">
                    Zaakceptowano: {new Date(match.acceptedAt).toLocaleDateString('pl-PL')}
                  </p>
                )}
              </div>
              
              {match.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRejectMatch(match.id)}
                    disabled={updateMatchStatusMutation.isPending}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Odrzuć
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAcceptMatch(match.id)}
                    disabled={updateMatchStatusMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Zaakceptuj
                  </Button>
                </div>
              )}
              
              {match.status === "accepted" && (
                <div className="text-sm text-green-600 font-medium">
                  ✓ Gotowy do rozpoczęcia lekcji
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      
      {(matches as any[]).filter((m: any) => m.status === "accepted").length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-800">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">
                Masz zaakceptowanych korepetytorów! 
              </span>
            </div>
            <p className="text-sm text-blue-600 mt-1">
              Możesz teraz umówić się na lekcje w zakładce "Moje lekcje".
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}