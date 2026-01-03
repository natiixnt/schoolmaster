import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Mail, User, Clock, X, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function StudentInvitations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);

  const { data: invitations = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/student/lesson-invitations"],
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true,
  });



  const cancelMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      await apiRequest("/api/student/cancel-invitation", "POST", {
        invitationId,
      });
    },
    onSuccess: () => {
      toast({
        title: "Sukces",
        description: "Zaproszenie zostało anulowane",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/student/lesson-invitations"] });
      setCancelConfirmId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się anulować zaproszenia",
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

  const activeInvitations = invitations.filter((invitation: any) => invitation.status === "pending");
  const inactiveInvitations = invitations.filter((invitation: any) => invitation.status !== "pending");

  const renderInvitationCard = (invitation: any, isInactive = false) => (
    <Card key={invitation.id} className={isInactive ? "bg-gray-50 border-gray-200" : undefined}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle className="text-lg">
                {invitation.tutorName}
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
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                {formatTimeRemaining(invitation.expiresAt)}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {invitation.specificNeeds && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Szczególne potrzeby:</h4>
            <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">
              {invitation.specificNeeds}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 mb-2">Preferowane dni:</h4>
            <div className="flex flex-wrap gap-1">
              {invitation.matchingDays?.map((day: number) => {
                const dayNames = ['pon', 'wt', 'śr', 'czw', 'pt', 'sob', 'ndz'];
                return (
                  <Badge key={day} variant="outline" className="text-xs">
                    {dayNames[day]}
                  </Badge>
                );
              })}
            </div>
          </div>
          
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 mb-2">Preferowany termin:</h4>
            <div className="flex flex-wrap gap-1">
              {invitation.matchingHours?.map((hour: string) => {
                const date = new Date(hour);
                return (
                  <Badge key={hour} variant="outline" className="text-xs">
                    {date.toLocaleDateString("pl-PL")} o {date.toLocaleTimeString("pl-PL", { hour: '2-digit', minute: '2-digit' })}
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          Wysłane: {new Date(invitation.sentAt).toLocaleDateString('pl-PL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>

        {invitation.tutorResponse && (
          <div className={`p-3 rounded-lg ${
            invitation.status === 'accepted' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <h4 className="font-medium text-gray-900 mb-1">
              Odpowiedź korepetytora:
            </h4>
            <p className="text-sm text-gray-700">{invitation.tutorResponse}</p>
            {invitation.respondedAt && (
              <p className="text-xs text-gray-500 mt-1">
                {new Date(invitation.respondedAt).toLocaleDateString('pl-PL', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>
        )}

        {invitation.status === "pending" && (
          <div className="flex justify-end pt-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setCancelConfirmId(invitation.id)}
              disabled={cancelMutation.isPending}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Anuluj zaproszenie
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Moje zaproszenia</h1>
        <p className="text-gray-600">
          Sprawdź status swoich zapytań do korepetytorów
        </p>
      </div>

      {!invitations || invitations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Brak zapytań</h3>
            <p className="text-gray-600">
              Nie wysłałeś jeszcze żadnych zapytań do korepetytorów. Znajdź korepetytora i wyślij zaproszenie.
            </p>
            <Button
              onClick={() => setLocation("/find-tutor")}
              className="mt-6"
            >
              Znajdź korepetytora
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {activeInvitations.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Aktywne zaproszenia</h2>
                <span className="text-sm text-gray-500">{activeInvitations.length}</span>
              </div>
              {activeInvitations.map((invitation: any) => renderInvitationCard(invitation))}
            </div>
          )}
          {inactiveInvitations.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-700">Poprzednie zaproszenia</h2>
                  <p className="text-sm text-gray-500">Zakończone lub anulowane</p>
                </div>
                <span className="text-sm text-gray-500">{inactiveInvitations.length}</span>
              </div>
              {inactiveInvitations.map((invitation: any) => renderInvitationCard(invitation, true))}
            </div>
          )}
        </div>
      )}

      <AlertDialog 
        open={!!cancelConfirmId} 
        onOpenChange={() => setCancelConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Anuluj zaproszenie
            </AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz anulować to zaproszenie do korepetytora? 
              Ta operacja nie może zostać cofnięta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Nie</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (cancelConfirmId) {
                  cancelMutation.mutate(cancelConfirmId);
                }
              }}
              disabled={cancelMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelMutation.isPending ? "Anulowanie..." : "Tak, anuluj"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}
