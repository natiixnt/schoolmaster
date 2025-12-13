import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Clock, User, Mail, CheckCircle, X, MessageSquare } from "lucide-react";

interface TutorAssignmentResponseProps {
  tutorId: string;
}

export function TutorAssignmentResponse({ tutorId }: TutorAssignmentResponseProps) {
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [responseReason, setResponseReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingAssignments, isLoading } = useQuery({
    queryKey: ["/api/tutor/pending-assignments"],
    refetchInterval: 30000, // Check every 30 seconds
  });

  const respondMutation = useMutation({
    mutationFn: async ({ preferencesId, accept, reason }: { preferencesId: string; accept: boolean; reason?: string }) => {
      return apiRequest("/api/tutor/respond-assignment", "POST", {
        preferencesId,
        accept,
        reason,
      });
    },
    onSuccess: (data, variables) => {
      toast({
        title: variables.accept ? "Zgłoszenie zaakceptowane!" : "Zgłoszenie odrzucone",
        description: variables.accept 
          ? "Student zostanie powiadomiony o akceptacji. Możecie teraz umówić pierwszą lekcję!"
          : "Wyszukujemy kolejnego korepetytora dla tego studenta.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tutor/pending-assignments"] });
      setSelectedAssignment(null);
      setResponseReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się wysłać odpowiedzi",
        variant: "destructive",
      });
    },
  });

  const handleResponse = (assignmentId: string, accept: boolean) => {
    respondMutation.mutate({
      preferencesId: assignmentId,
      accept,
      reason: responseReason || undefined,
    });
  };

  const getDayName = (dayNumber: number) => {
    const days = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];
    return days[dayNumber] || "Nieznany";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pendingAssignments || pendingAssignments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-navy-600" />
            Oczekujące przypisania studentów
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Brak oczekujących przypisań
            </h3>
            <p className="text-gray-500">
              Obecnie nie masz żadnych studentów oczekujących na Twoją odpowiedź.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-navy-600" />
            Oczekujące przypisania studentów
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              {pendingAssignments.length}
            </Badge>
          </CardTitle>
          <p className="text-gray-600">
            Studenci zostali automatycznie przypisani do Ciebie na podstawie ich preferencji i Twojej dostępności.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingAssignments.map((assignment: any) => (
            <Card key={assignment.id} className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-navy-900">
                      {assignment.studentFirstName} {assignment.studentLastName}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <Mail className="w-4 h-4" />
                      {assignment.studentEmail}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge variant="outline" className="mb-2">
                      Przedmiot: {assignment.subjectId}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      Czas na odpowiedź: {new Date(assignment.tutorResponseDeadline).toLocaleString("pl-PL")}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Obecny poziom studenta:</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      {assignment.currentLevel}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Czego chce się nauczyć:</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      {assignment.specificNeeds}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 px-4 bg-green-50 rounded-lg mb-4">
                  <span className="text-sm font-medium text-green-800">
                    Budżet studenta:
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    {assignment.maxHourlyRate} zł/h
                  </span>
                </div>

                {selectedAssignment === assignment.id ? (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dodatkowa wiadomość (opcjonalnie):
                      </label>
                      <Textarea
                        value={responseReason}
                        onChange={(e) => setResponseReason(e.target.value)}
                        placeholder="Napisz krótką wiadomość do studenta..."
                        className="h-20"
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleResponse(assignment.id, true)}
                        disabled={respondMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {respondMutation.isPending ? "Akceptuję..." : "Akceptuję studenta"}
                      </Button>
                      
                      <Button
                        onClick={() => handleResponse(assignment.id, false)}
                        disabled={respondMutation.isPending}
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-2" />
                        {respondMutation.isPending ? "Odrzucam..." : "Odrzuć"}
                      </Button>
                      
                      <Button
                        onClick={() => setSelectedAssignment(null)}
                        variant="ghost"
                        disabled={respondMutation.isPending}
                      >
                        Anuluj
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setSelectedAssignment(assignment.id)}
                      className="bg-navy-900 hover:bg-navy-800"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Odpowiedz
                    </Button>
                    
                    <Button
                      onClick={() => handleResponse(assignment.id, true)}
                      disabled={respondMutation.isPending}
                      variant="outline"
                      className="border-green-300 text-green-700 hover:bg-green-50"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Szybka akceptacja
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}