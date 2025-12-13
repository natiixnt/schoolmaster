import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, User, CheckCircle, AlertCircle, Mail, Phone, Calendar } from "lucide-react";

interface MatchingStatusProps {
  studentId: string;
}

export function MatchingStatus({ studentId }: MatchingStatusProps) {
  const { data: matchingStatus, isLoading } = useQuery({
    queryKey: ["/api/student/matching-status", studentId],
    refetchInterval: 30000, // Check every 30 seconds
  });

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

  if (!matchingStatus) {
    return null;
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return {
          icon: Clock,
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          title: "Wyszukujemy korepetytora",
          description: "Analizujemy dostępnych korepetytorów według Twoich preferencji",
          progress: 25,
        };
      case "matched":
        return {
          icon: User,
          color: "bg-blue-100 text-blue-800 border-blue-200",
          title: "Znaleźliśmy korepetytora!",
          description: "Czekamy na potwierdzenie od korepetytora",
          progress: 75,
        };
      case "confirmed":
        return {
          icon: CheckCircle,
          color: "bg-green-100 text-green-800 border-green-200",
          title: "Dopasowanie potwierdzone",
          description: "Korepetytor zaakceptował. Możesz umówić pierwszą lekcję!",
          progress: 100,
        };
      case "cancelled":
        return {
          icon: AlertCircle,
          color: "bg-red-100 text-red-800 border-red-200",
          title: "Dopasowanie anulowane",
          description: "Wyszukiwanie zostało anulowane",
          progress: 0,
        };
      default:
        return {
          icon: Clock,
          color: "bg-gray-100 text-gray-800 border-gray-200",
          title: "Nieznany status",
          description: "",
          progress: 0,
        };
    }
  };

  const statusInfo = getStatusInfo(matchingStatus.matchingStatus);
  const StatusIcon = statusInfo.icon;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <StatusIcon className="w-6 h-6 text-navy-600" />
          Status dopasowania
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Status Badge and Progress */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge className={statusInfo.color}>
              {statusInfo.title}
            </Badge>
            <span className="text-sm text-gray-500">
              {statusInfo.progress}% ukończone
            </span>
          </div>
          
          <Progress value={statusInfo.progress} className="w-full" />
          <p className="text-sm text-gray-600">{statusInfo.description}</p>
        </div>

        {/* Request Details */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-gray-900">Szczegóły Twojego zgłoszenia:</h4>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Przedmiot:</span>
              <p className="font-medium">{matchingStatus.subjectName}</p>
            </div>
            
            <div>
              <span className="text-gray-600">Preferowane dni:</span>
              <p className="font-medium">
                {matchingStatus.preferredDays?.map((day: number) => {
                  const dayNames = ["Nie", "Pon", "Wt", "Śr", "Czw", "Pt", "Sob"];
                  return dayNames[day];
                }).join(", ")}
              </p>
            </div>
            
            <div>
              <span className="text-gray-600">Preferowane godziny:</span>
              <p className="font-medium">
                {matchingStatus.preferredStartTime} - {matchingStatus.preferredEndTime}
              </p>
            </div>
            
            <div>
              <span className="text-gray-600">Maksymalna stawka:</span>
              <p className="font-medium">{matchingStatus.maxHourlyRate} zł/h</p>
            </div>
          </div>
        </div>

        {/* Matched Tutor Info */}
        {matchingStatus.assignedTutor && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-green-900 flex items-center gap-2">
              <User className="w-4 h-4" />
              Przypisany korepetytor:
            </h4>
            
            <div className="space-y-2">
              <p className="font-medium text-lg">
                {matchingStatus.assignedTutor.firstName} {matchingStatus.assignedTutor.lastName}
              </p>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <span>⭐</span>
                  <span>{matchingStatus.assignedTutor.rating || "5.0"}/5</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{matchingStatus.assignedTutor.totalLessons || 0} lekcji</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <span>💰</span>
                  <span>{matchingStatus.assignedTutor.hourlyRate} zł/h</span>
                </div>
              </div>

              {matchingStatus.assignedTutor.bio && (
                <p className="text-sm text-gray-700 mt-2">
                  {matchingStatus.assignedTutor.bio}
                </p>
              )}
            </div>

            {matchingStatus.matchingStatus === "confirmed" && (
              <div className="flex gap-2 pt-3">
                <Button className="bg-navy-900 hover:bg-navy-800">
                  <Calendar className="w-4 h-4 mr-2" />
                  Umów pierwszą lekcję
                </Button>
                
                <Button variant="outline">
                  <Mail className="w-4 h-4 mr-2" />
                  Wyślij wiadomość
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Response Deadline */}
        {matchingStatus.tutorResponseDeadline && matchingStatus.matchingStatus === "matched" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <Clock className="w-4 h-4" />
              <span className="font-medium">Czas na odpowiedź korepetytora:</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Do {new Date(matchingStatus.tutorResponseDeadline).toLocaleString("pl-PL")}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-center gap-3 pt-4">
          {matchingStatus.matchingStatus === "pending" && (
            <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
              Anuluj wyszukiwanie
            </Button>
          )}
          
          {matchingStatus.matchingStatus === "matched" && (
            <Button variant="outline">
              Zmień preferencje
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}