import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, BookOpen, Star, Banknote, Calendar, Clock, Video, Copy, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TutorPreviewPanelProps {
  tutorId: string;
}

export default function TutorPreviewPanel({ tutorId }: TutorPreviewPanelProps) {
  const { toast } = useToast();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/tutor/dashboard", { tutorId }],
    queryFn: async () => {
      const response = await fetch(`/api/tutor/dashboard?tutorId=${tutorId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!tutorId,
  });

  const { data: tutorsData } = useQuery({
    queryKey: ["/api/admin/tutors"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-900"></div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const upcomingLessons = dashboardData?.upcomingLessons || [];
  const allLessons = dashboardData?.allLessons || [];
  
  const tutor = (tutorsData as any)?.tutors?.find((t: any) => t.id === tutorId);

  const handleCopyMeetLink = async (lesson: any) => {
    if (lesson.meetLink) {
      try {
        await navigator.clipboard.writeText(lesson.meetLink);
        toast({
          title: "Link skopiowany",
          description: "Link Google Meet został skopiowany do schowka.",
        });
      } catch (error) {
        toast({
          title: "Błąd kopiowania",
          description: "Nie udało się skopiować linku.",
          variant: "destructive",
        });
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { label: "Zaplanowana", variant: "default" as const, color: "bg-blue-100 text-blue-800" },
      completed: { label: "Ukończona", variant: "secondary" as const, color: "bg-green-100 text-green-800" },
      cancelled: { label: "Anulowana", variant: "destructive" as const, color: "bg-red-100 text-red-800" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-navy-900 to-navy-700 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              Dashboard korepetytora: {tutor?.firstName} {tutor?.lastName}
            </h2>
            <p className="text-navy-200 mt-1">
              {tutor?.email} • Stawka: {tutor?.tutorProfile?.hourlyRate} zł/godz
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{stats.averageRating || 0}</div>
            <div className="text-navy-200 text-sm">Średnia ocena</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Users className="text-navy-600" size={24} />
              <span className="text-2xl font-bold text-navy-900">{stats.totalStudents || 0}</span>
            </div>
            <div className="text-sm text-gray-600 mt-2">Uczniowie</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <BookOpen className="text-green-600" size={24} />
              <span className="text-2xl font-bold text-navy-900">{stats.totalLessons || 0}</span>
            </div>
            <div className="text-sm text-gray-600 mt-2">Lekcje</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Star className="text-yellow-500" size={24} />
              <span className="text-2xl font-bold text-navy-900">{stats.averageRating || 0}</span>
            </div>
            <div className="text-sm text-gray-600 mt-2">Ocena</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Banknote className="text-green-500" size={24} />
              <span className="text-2xl font-bold text-navy-900">{stats.monthlyEarnings || 0} zł</span>
            </div>
            <div className="text-sm text-gray-600 mt-2">Miesięczne zarobki</div>
          </CardContent>
        </Card>
      </div>

      {/* Lessons Tabs */}
      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">Nadchodzące lekcje</TabsTrigger>
          <TabsTrigger value="all">Wszystkie lekcje</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Nadchodzące lekcje</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingLessons.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Brak nadchodzących lekcji
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingLessons.map((lesson: any) => (
                    <div key={lesson.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-navy-900">{lesson.title}</h3>
                          <p className="text-gray-600 text-sm mt-1">{lesson.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar size={16} />
                              {formatDate(lesson.scheduledAt)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock size={16} />
                              {lesson.duration} min
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(lesson.status)}
                          <span className="text-green-600 font-semibold">{lesson.price} zł</span>
                        </div>
                      </div>
                      
                      {lesson.meetLink && (
                        <div className="mt-3 flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyMeetLink(lesson)}
                          >
                            <Copy size={16} className="mr-1" />
                            Kopiuj link Meet
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Historia lekcji ({allLessons.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {allLessons.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Brak lekcji w historii
                </div>
              ) : (
                <div className="space-y-4">
                  {allLessons.slice(0, 10).map((lesson: any) => (
                    <div key={lesson.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-navy-900">{lesson.title}</h3>
                          <p className="text-gray-600 text-sm mt-1">{lesson.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar size={16} />
                              {formatDate(lesson.scheduledAt)}
                            </div>
                            {lesson.rating && (
                              <div className="flex items-center gap-1">
                                <Star size={16} />
                                {lesson.rating}/5
                              </div>
                            )}
                          </div>
                          {lesson.tutorNotes && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                              <strong>Notatki korepetytora:</strong> {lesson.tutorNotes}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(lesson.status)}
                          <span className="text-green-600 font-semibold">{lesson.price} zł</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}