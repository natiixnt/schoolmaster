import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/Navbar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Mail, 
  Clock, 
  User, 
  Calendar, 
  CheckCircle, 
  XCircle,
  MessageSquare,
  AlertTriangle
} from "lucide-react";

const daysOfWeek = [
  { id: 1, label: "Poniedziałek" },
  { id: 2, label: "Wtorek" },
  { id: 3, label: "Środa" },
  { id: 4, label: "Czwartek" },
  { id: 5, label: "Piątek" },
  { id: 6, label: "Sobota" },
  { id: 0, label: "Niedziela" },
];

export default function TutorInvitations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [showAvailabilityWarning, setShowAvailabilityWarning] = useState(false);
  const [warningDetails, setWarningDetails] = useState<{
    invitationId: string;
    message: string;
    suggestedTimes: string[];
  } | null>(null);

  const { data: invitations = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/tutor/lesson-invitations"],
  });

  const respondToInvitationMutation = useMutation({
    mutationFn: async ({ invitationId, accept, response, forceAccept }: {
      invitationId: string;
      accept: boolean;
      response?: string;
      forceAccept?: boolean;
    }) => {
      await apiRequest("/api/tutor/respond-invitation", "POST", {
        invitationId,
        accept,
        response,
        forceAccept,
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Sukces",
        description: variables.accept 
          ? "Zaproszenie zostało zaakceptowane" 
          : "Zaproszenie zostało odrzucone",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tutor/lesson-invitations"] });
      setResponses(prev => {
        const newResponses = { ...prev };
        delete newResponses[variables.invitationId];
        return newResponses;
      });
      setShowAvailabilityWarning(false);
      setWarningDetails(null);
    },
    onError: (error: any) => {
      // Check if this is an availability conflict response
      const errorMessage = error.message || "";
      if (errorMessage.includes("409:") && errorMessage.includes("AVAILABILITY_CONFLICT")) {
        try {
          // Parse the JSON response from the error message
          const jsonMatch = errorMessage.match(/\{.*\}/);
          if (jsonMatch) {
            const errorData = JSON.parse(jsonMatch[0]);
            setWarningDetails({
              invitationId: warningDetails?.invitationId || "",
              message: errorData.details || "Proponowany termin nie pokrywa się z Twoją dostępnością",
              suggestedTimes: errorData.suggestedTimes || []
            });
            setShowAvailabilityWarning(true);
            return;
          }
        } catch (parseError) {
          // Fallback if JSON parsing fails
          setWarningDetails({
            invitationId: warningDetails?.invitationId || "",
            message: "Proponowany termin nie pokrywa się z Twoją dostępnością",
            suggestedTimes: []
          });
          setShowAvailabilityWarning(true);
          return;
        }
      }
      
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się odpowiedzieć na zaproszenie",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "accepted": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "expired": return "bg-gray-100 text-gray-800";
      case "cancelled": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "Oczekuje odpowiedzi";
      case "accepted": return "Zaakceptowane";
      case "rejected": return "Odrzucone";
      case "expired": return "Wygasłe";
      case "cancelled": return "Anulowane";
      default: return status;
    }
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return "Wygasłe";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleAcceptInvitation = (invitationId: string) => {
    setWarningDetails({ invitationId, message: "", suggestedTimes: [] });
    respondToInvitationMutation.mutate({
      invitationId,
      accept: true,
      response: responses[invitationId],
    });
  };

  const handleForceAccept = () => {
    if (!warningDetails) return;
    
    respondToInvitationMutation.mutate({
      invitationId: warningDetails.invitationId,
      accept: true,
      response: responses[warningDetails.invitationId],
      forceAccept: true,
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Zaproszenia do lekcji</h1>
        <p className="text-gray-600">
          Sprawdź zaproszenia od uczniów i zdecyduj, czy chcesz prowadzić lekcje
        </p>
      </div>

      {!invitations || invitations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Brak zaproszeń</h3>
            <p className="text-gray-600">
              Nie masz obecnie żadnych zaproszeń do lekcji. Sprawdź swoją dostępność w ustawieniach.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {invitations.map((invitation: any) => (
            <Card key={invitation.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-blue-600" />
                    <div>
                      <CardTitle className="text-lg">
                        {invitation.studentName}
                      </CardTitle>
                      <CardDescription>
                        Przedmiot: {invitation.subjectName}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(invitation.status)}>
                      {getStatusText(invitation.status)}
                    </Badge>
                    {invitation.status === "pending" && (
                      <Badge variant="outline" className="text-orange-600">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTimeRemaining(invitation.expiresAt)}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Preferowane dni</h4>
                    <p className="text-gray-600">
                      {invitation.matchingDays?.map((dayId: number) => 
                        daysOfWeek.find(d => d.id === dayId)?.label
                      ).join(", ") || "Brak danych"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Preferowany termin</h4>
                    <p className="text-gray-600">
                      {invitation.matchingHours?.map((hour: string) => {
                        const date = new Date(hour);
                        return `${date.toLocaleDateString("pl-PL")} o ${date.toLocaleTimeString("pl-PL", { hour: '2-digit', minute: '2-digit' })}`;
                      }).join(", ") || "Brak danych"}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Opis potrzeb ucznia</h4>
                  <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">
                    {invitation.specificNeeds || "Brak szczegółowego opisu"}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Obecny poziom</h4>
                  <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">
                    {invitation.currentLevel || "Brak opisu poziomu"}
                  </p>
                </div>

                {invitation.status === "pending" && (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Wiadomość do ucznia (opcjonalnie)
                      </label>
                      <Textarea
                        placeholder="Napisz wiadomość do ucznia..."
                        value={responses[invitation.id] || ""}
                        onChange={(e) => setResponses(prev => ({
                          ...prev,
                          [invitation.id]: e.target.value
                        }))}
                        className="min-h-[80px]"
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleAcceptInvitation(invitation.id)}
                        disabled={respondToInvitationMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 flex-1"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Akceptuj zaproszenie
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => respondToInvitationMutation.mutate({
                          invitationId: invitation.id,
                          accept: false,
                          response: responses[invitation.id],
                        })}
                        disabled={respondToInvitationMutation.isPending}
                        className="border-red-200 text-red-600 hover:bg-red-50 flex-1"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Odrzuć zaproszenie
                      </Button>
                    </div>
                  </div>
                )}

                {invitation.tutorResponse && (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-1 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Twoja odpowiedź
                    </h4>
                    <p className="text-blue-800 text-sm">{invitation.tutorResponse}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Availability Conflict Warning Dialog */}
      <Dialog open={showAvailabilityWarning} onOpenChange={setShowAvailabilityWarning}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Ostrzeżenie - Konflikt dostępności
            </DialogTitle>
            <DialogDescription>
              Proponowany termin lekcji nie pokrywa się z Twoją dostępnością w kalendarzu.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                {warningDetails?.message}
              </p>
            </div>

            {warningDetails?.suggestedTimes && warningDetails.suggestedTimes.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Twoja dostępność:
                </h4>
                <ul className="space-y-1">
                  {warningDetails.suggestedTimes.map((time, index) => (
                    <li key={index} className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded">
                      {time}
                    </li>
                  ))}
                </ul>
              </div>
            )}


          </div>

          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowAvailabilityWarning(false)}
            >
              Anuluj
            </Button>
            <Button 
              onClick={handleForceAccept}
              disabled={respondToInvitationMutation.isPending}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Akceptuj mimo to
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}