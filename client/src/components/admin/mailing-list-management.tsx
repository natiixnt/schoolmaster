import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Users, Calendar, Download, FileSpreadsheet, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Subject, MailingListSubscription } from "@shared/schema";

export default function MailingListManagement() {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const { toast } = useToast();

  // Fetch subjects
  const { data: subjects = [], isLoading: isLoadingSubjects } = useQuery<Subject[]>({
    queryKey: ['/api/subjects']
  });

  // Fetch mailing list subscriptions for selected subject
  const { data: subscriptions = [], isLoading: isLoadingSubscriptions, refetch } = useQuery<MailingListSubscription[]>({
    queryKey: ['/api/admin/mailing-list', selectedSubjectId],
    enabled: !!selectedSubjectId,
  });

  // Mutation for sending unread message notifications
  const sendNotificationsMutation = useMutation({
    mutationFn: () => apiRequest("/api/admin/send-unread-notifications", "POST"),
    onSuccess: (data: any) => {
      toast({
        title: "Powiadomienia wysłane",
        description: data.message || `Wysłano powiadomienia do użytkowników`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się wysłać powiadomień",
        variant: "destructive",
      });
    },
  });

  const handleExportEmails = () => {
    if (subscriptions.length === 0) return;

    const csvContent = "data:text/csv;charset=utf-8,Email,Data zapisania\n" +
      subscriptions.map(sub => 
        `${sub.email},${sub.subscribedAt ? new Date(sub.subscribedAt).toLocaleDateString('pl-PL') : 'Brak danych'}`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mailing-list-${selectedSubjectId}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  return (
    <div className="space-y-6">
      {/* Email Notifications Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-navy-900 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Powiadomienia email
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Nieodczytane wiadomości</h3>
              <p className="text-sm text-gray-500">
                Wyślij powiadomienia email do użytkowników z nieodczytanymi wiadomościami
              </p>
            </div>
            <Button
              onClick={() => sendNotificationsMutation.mutate()}
              disabled={sendNotificationsMutation.isPending}
              className="flex items-center gap-2"
            >
              {sendNotificationsMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Wysyłanie...
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4" />
                  Wyślij powiadomienia
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mailing Lists Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-navy-900 flex items-center gap-2">
            <Mail className="w-6 h-6" />
            Zarządzanie listami mailingowymi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wybierz przedmiot
                </label>
                <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz przedmiot..." />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedSubjectId && subscriptions.length > 0 && (
                <Button 
                  onClick={handleExportEmails}
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Eksportuj CSV
                </Button>
              )}
            </div>

            {selectedSubject && (
              <div className="flex items-center gap-4 p-4 bg-navy-50 rounded-lg">
                <div className={`w-10 h-10 rounded-lg ${selectedSubject.color === '#3b82f6' ? 'bg-blue-600' : 
                  selectedSubject.color === '#10b981' ? 'bg-emerald-600' : 
                  selectedSubject.color === '#8b5cf6' ? 'bg-violet-600' : 
                  selectedSubject.color === '#f59e0b' ? 'bg-amber-600' : 
                  selectedSubject.color === '#ef4444' ? 'bg-red-600' : 
                  selectedSubject.color === '#22c55e' ? 'bg-green-600' : 'bg-blue-600'} text-white flex items-center justify-center`}>
                  <Mail className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-navy-900">{selectedSubject.name}</h3>
                  <p className="text-sm text-gray-600">{selectedSubject.description}</p>
                </div>
                <div className="text-right">
                  <Badge variant={selectedSubject.available ? "default" : "secondary"}>
                    {selectedSubject.available ? "Dostępny" : "Niedostępny"}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedSubjectId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Subskrypcje ({subscriptions.length})
              </span>
              {isLoadingSubscriptions && (
                <div className="text-sm text-gray-500">Ładowanie...</div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subscriptions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  Brak subskrypcji
                </h3>
                <p className="text-gray-600">
                  Nikt jeszcze nie zapisał się na powiadomienia dla tego przedmiotu.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {subscriptions.map((subscription) => (
                  <div 
                    key={subscription.id} 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-navy-900 rounded-full flex items-center justify-center">
                        <Mail className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-navy-900">{subscription.email}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Zapisany: {subscription.subscribedAt ? new Date(subscription.subscribedAt).toLocaleDateString('pl-PL') : 'Brak danych'}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      Aktywny
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedSubjectId && (
        <Card>
          <CardContent className="text-center py-12">
            <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Wybierz przedmiot
            </h3>
            <p className="text-gray-600">
              Aby zobaczyć listę mailingową, wybierz przedmiot z listy powyżej.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}