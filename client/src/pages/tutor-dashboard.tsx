import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SchoolMasterLogo from "@/assets/schoolmaster-logo.png";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useLocation } from "wouter";
import { Calculator, Users, BookOpen, ArrowLeft, Eye, Calendar, Clock, Star, Banknote, Edit, FileText, Home, ClipboardList, GraduationCap, Video, Copy, UserCheck, MessageCircle, Mail, Settings, User, Crown } from "lucide-react";
import TutorLessonEditor from "@/components/tutor/lesson-editor";
import TutorHomeworkManager from "@/components/tutor/homework-manager";
import TutorMaterials from "@/components/tutor/materials";
import TutorBioEditor from "@/components/tutor/tutor-bio-editor";
import CalendarView from "@/components/calendar/calendar-view";
import { TutorAssignmentResponse } from "@/components/matching/tutor-assignment-response";

export default function TutorDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [selectedTutorId, setSelectedTutorId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  // Check if this is admin demo mode and get tutorId from URL
  const isDemoMode = window.location.search.includes('demo=true') || window.history.state?.fromAdmin;
  const urlParams = new URLSearchParams(window.location.search);
  const tutorId = urlParams.get('tutorId');

  useEffect(() => {
    if (!isDemoMode && !isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast, isDemoMode]);

  // In demo mode, use selected tutor or URL tutor, otherwise use authenticated user
  const activeTutorId = isDemoMode ? (selectedTutorId || tutorId || "tutor1") : (user as any)?.id;
  
  // Build query key with tutorId for demo preview
  const queryKey = activeTutorId ? ["/api/tutor/dashboard", { tutorId: activeTutorId }] : ["/api/tutor/dashboard"];
  const queryString = activeTutorId && isDemoMode ? `?tutorId=${activeTutorId}` : "";

  const { data: dashboardData, isLoading: isDashboardLoading, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await fetch(`/api/tutor/dashboard${queryString}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    enabled: isDemoMode || (isAuthenticated && (user as any)?.role === "tutor"),
    retry: false,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Get tutor's students (those with whom tutor has had lessons)
  const { data: tutorStudents } = useQuery({
    queryKey: activeTutorId ? ["/api/tutor/students", { tutorId: activeTutorId }] : ["/api/tutor/students"],
    queryFn: async () => {
      const studentsQueryString = activeTutorId ? `?tutorId=${activeTutorId}` : "";
      const response = await fetch(`/api/tutor/students${studentsQueryString}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    enabled: isDemoMode || (isAuthenticated && (user as any)?.role === "tutor"),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Force refetch when selectedTutorId changes
  useEffect(() => {
    if (isDemoMode && selectedTutorId) {
      refetch();
    }
  }, [selectedTutorId, refetch, isDemoMode]);

  // Get tutors list for demo mode selector
  const { data: tutorsData } = useQuery({
    queryKey: ["/api/admin/tutors"],
    enabled: isDemoMode,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get conversations for unread message badge
  const { data: conversationsData = [] } = useQuery({
    queryKey: ["/api/conversations"],
    enabled: !isDemoMode && isAuthenticated && (user as any)?.role === "tutor",
    retry: false,
    staleTime: 30 * 1000, // 30 seconds - refresh badge frequently
  });

  const handleLogout = async () => {
    if (isDemoMode) {
      setLocation("/admin-dashboard");
    } else {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/login";
      } catch (error) {
        console.error("Logout error:", error);
        window.location.href = "/login";
      }
    }
  };

  const handleEditLessonFromCalendar = (lessonId: string) => {
    // Switch to lessons tab and set the lesson to edit
    setActiveTab("lessons");
    setEditingLessonId(lessonId);
  };

  const handleJoinLesson = (lesson: any) => {
    if (lesson.meetLink) {
      window.open(lesson.meetLink, '_blank');
      toast({
        title: "Przekierowanie do Google Meet",
        description: "Otwieranie spotkania w nowej karcie...",
      });
    } else {
      toast({
        title: "Brak linku do spotkania",
        description: "Link Google Meet nie został jeszcze wygenerowany.",
        variant: "destructive",
      });
    }
  };

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

  const handleGenerateMeetLink = async (lessonId: string) => {
    if (isDemoMode) {
      toast({
        title: "Tryb demo",
        description: "W trybie demo nie można generować prawdziwych linków Google Meet.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/lessons/${lessonId}/generate-meet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast({
          title: "Link Google Meet wygenerowany",
          description: "Link zostanie automatycznie dodany do lekcji.",
        });
        // Refresh data to show new link
        window.location.reload();
      } else {
        throw new Error('Failed to generate meet link');
      }
    } catch (error) {
      toast({
        title: "Błąd generowania linku",
        description: "Nie udało się wygenerować linku Google Meet.",
        variant: "destructive",
      });
    }
  };

  // Show loading only if not in demo mode and actually loading
  if (!isDemoMode && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-900"></div>
      </div>
    );
  }
  
  // For authenticated users, show loading for dashboard data
  if (!isDemoMode && isDashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-900"></div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const upcomingLessons = dashboardData?.upcomingLessons || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 sm:py-0 sm:h-16 gap-3 sm:gap-0">
            <div className="flex items-center space-x-2">
              <img 
                src={SchoolMasterLogo} 
                alt="SchoolMaster" 
                className="h-5 sm:h-6"
              />
              {isDemoMode && (
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span className="hidden sm:inline">Podgląd korepetytora</span>
                    <span className="sm:hidden">Demo</span>
                  </span>
                </div>
              )}
            </div>
            
            {/* Tutor Selector for Demo Mode */}
            {isDemoMode && (
              <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
                <span className="text-xs sm:text-sm text-gray-600 hidden md:inline">Wybrany korepetytor:</span>
                <Select value={activeTutorId || ""} onValueChange={(value) => {
                  setSelectedTutorId(value);
                }}>
                  <SelectTrigger className="w-full sm:w-48 md:w-64">
                    <SelectValue placeholder="Wybierz korepetytora" />
                  </SelectTrigger>
                  <SelectContent>
                    {(tutorsData as any)?.tutors?.filter((tutor: any, index: number, self: any[]) => 
                      self.findIndex(t => t.id === tutor.id) === index
                    ).map((tutor: any) => (
                      <SelectItem key={tutor.id} value={tutor.id}>
                        {tutor.firstName} {tutor.lastName} ({tutor.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap w-full sm:w-auto justify-end">
              {!isDemoMode && (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setLocation("/tutor-invitations")} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4">
                    <Mail className="w-4 h-4" />
                    <span className="hidden md:inline">Zaproszenia</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setLocation("/messages")} className="flex items-center gap-1 sm:gap-2 relative text-xs sm:text-sm px-2 sm:px-4">
                    <MessageCircle className="w-4 h-4" />
                    <span className="hidden md:inline">Wiadomości</span>
                    {conversationsData && conversationsData.some((conv: any) => conv.unreadCount > 0) && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {conversationsData.reduce((total: number, conv: any) => total + (conv.unreadCount || 0), 0)}
                      </div>
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setLocation("/tutor-featured")} className="hidden lg:flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    Status Polecany
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setLocation("/settings")} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4">
                    <Settings className="w-4 h-4" />
                    <span className="hidden md:inline">Ustawienia</span>
                  </Button>
                </>
              )}
              {isDemoMode ? (
                <Button 
                  onClick={() => setLocation("/admin-dashboard")} 
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Powrót do panelu</span>
                  <span className="sm:hidden">Powrót</span>
                </Button>
              ) : (
                <Button onClick={handleLogout} variant="outline" size="sm" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">Wyloguj się</span>
                  <span className="sm:hidden">Wyloguj</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-navy-900">Panel korepetytora</h1>
          <p className="text-sm sm:text-base text-gray-600">Zarządzaj swoimi uczniami i lekcjami</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <Users className="text-navy-900 text-2xl" />
                <div className="text-right">
                  <div className="text-2xl font-bold text-navy-900">{stats.totalStudents || 0}</div>
                  <div className="text-sm text-gray-600">Uczniowie</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <BookOpen className="text-accent text-2xl" />
                <div className="text-right">
                  <div className="text-2xl font-bold text-navy-900">{stats.totalLessons || 0}</div>
                  <div className="text-sm text-gray-600">Lekcje</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <Star className="text-yellow-500 text-2xl" />
                <div className="text-right">
                  <div className="text-2xl font-bold text-navy-900">{stats.averageRating || 0}</div>
                  <div className="text-sm text-gray-600">Średnia ocena</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <Banknote className="text-green-500 text-2xl" />
                <div className="text-right">
                  <div className="text-2xl font-bold text-navy-900">{stats.monthlyEarnings || 0} zł</div>
                  <div className="text-sm text-gray-600">Zarobki w tym miesiącu</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content with tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          {/* Mobile: Dropdown Select */}
          <div className="sm:hidden">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full bg-white" data-testid="select-tab-mobile">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    Przegląd
                  </div>
                </SelectItem>
                <SelectItem value="lessons">
                  <div className="flex items-center gap-2">
                    <Edit className="w-4 h-4" />
                    Lekcje
                  </div>
                </SelectItem>
                <SelectItem value="homework">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4" />
                    Prace domowe
                  </div>
                </SelectItem>
                <SelectItem value="materials">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Materiały
                  </div>
                </SelectItem>
                <SelectItem value="calendar">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Kalendarz
                  </div>
                </SelectItem>
                <SelectItem value="profile">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Profil
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop: Traditional Tabs */}
          <TabsList className="hidden sm:grid sm:grid-cols-6 w-full lg:max-w-4xl mx-auto bg-white border border-gray-200 p-1 rounded-lg gap-1">
            <TabsTrigger 
              value="overview" 
              className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-navy-700 data-[state=active]:bg-navy-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all rounded-md"
              data-testid="tab-overview"
            >
              <Home className="w-4 h-4" />
              <span>Przegląd</span>
            </TabsTrigger>

            <TabsTrigger 
              value="lessons" 
              className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-navy-700 data-[state=active]:bg-navy-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all rounded-md"
              data-testid="tab-lessons"
            >
              <Edit className="w-4 h-4" />
              <span>Lekcje</span>
            </TabsTrigger>
            <TabsTrigger 
              value="homework" 
              className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-navy-700 data-[state=active]:bg-navy-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all rounded-md"
              data-testid="tab-homework"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Prace</span>
            </TabsTrigger>
            <TabsTrigger 
              value="materials" 
              className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-navy-700 data-[state=active]:bg-navy-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all rounded-md"
              data-testid="tab-materials"
            >
              <BookOpen className="w-4 h-4" />
              <span>Materiały</span>
            </TabsTrigger>
            <TabsTrigger 
              value="calendar" 
              className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-navy-700 data-[state=active]:bg-navy-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all rounded-md"
              data-testid="tab-calendar"
            >
              <Calendar className="w-4 h-4" />
              <span>Kalendarz</span>
            </TabsTrigger>
            <TabsTrigger 
              value="profile" 
              className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-navy-700 data-[state=active]:bg-navy-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all rounded-md"
              data-testid="tab-profile"
            >
              <User className="w-4 h-4" />
              <span>Profil</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Actions */}
            {!isDemoMode && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 sm:mb-6">
                <Link href="/tutor-availability">
                  <Card className="p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer" data-testid="card-availability">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Zarządzaj dostępnością</h3>
                        <p className="text-xs sm:text-sm text-gray-600">Ustaw swoje godziny dostępności</p>
                      </div>
                    </div>
                  </Card>
                </Link>
                <Link href="/tutor-invitations">
                  <Card className="p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer" data-testid="card-invitations">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                        {dashboardData?.pendingInvitations > 0 && (
                          <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs border-2 border-white rounded-full">
                            {dashboardData.pendingInvitations}
                          </Badge>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Zaproszenia do lekcji</h3>
                        <p className="text-xs sm:text-sm text-gray-600">Sprawdź nowe zaproszenia od uczniów</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              </div>
            )}
            
            {/* Schedule and Students */}
            <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-navy-900">Harmonogram lekcji</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {upcomingLessons.length > 0 ? (
                        upcomingLessons.map((lesson: any, index: number) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-navy-900 text-sm sm:text-base truncate">
                                  {lesson.student} - {lesson.title}
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-600">
                                  {lesson.date} {lesson.time} - {lesson.duration}min
                                </p>
                              </div>
                              <Badge className="bg-blue-100 text-blue-800 self-start sm:self-auto text-xs">
                                Zaplanowana
                              </Badge>
                            </div>
                            {/* Google Meet Link Section */}
                            {lesson.meetLink && (
                              <div className="bg-blue-50 p-2 sm:p-3 rounded-lg mb-3">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <Video className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                    <span className="text-xs sm:text-sm font-medium text-blue-900">Link Google Meet</span>
                                  </div>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleCopyMeetLink(lesson)}
                                    className="text-xs self-start sm:self-auto"
                                  >
                                    <Copy className="w-3 h-3 mr-1" />
                                    Kopiuj
                                  </Button>
                                </div>
                                <div className="text-xs font-mono text-gray-600 mt-1 truncate">
                                  {lesson.meetLink}
                                </div>
                              </div>
                            )}
                            {!lesson.meetLink && !isDemoMode && (
                              <div className="bg-yellow-50 p-2 sm:p-3 rounded-lg mb-3">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <Video className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                                    <span className="text-xs sm:text-sm text-yellow-900">Brak linku Google Meet</span>
                                  </div>
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleGenerateMeetLink(lesson.id)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs self-start sm:self-auto"
                                  >
                                    Generuj link
                                  </Button>
                                </div>
                              </div>
                            )}
                            
                            <div className="flex flex-wrap gap-2">
                              {lesson.meetLink && (
                                <Button 
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700 text-white text-xs flex-1 sm:flex-none min-w-[100px]"
                                  onClick={() => handleJoinLesson(lesson)}
                                >
                                  <Video className="w-3 h-3 mr-1" />
                                  Dołącz
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                className="bg-navy-900 text-white hover:bg-navy-800 text-xs flex-1 sm:flex-none min-w-[100px]"
                                onClick={() => setActiveTab("materials")}
                              >
                                Materiały
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setActiveTab("lessons")}
                                className="text-xs flex-1 sm:flex-none min-w-[100px]"
                              >
                                Edytuj
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-sm sm:text-base text-gray-500">
                          Brak zaplanowanych lekcji
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-navy-900">Moi uczniowie</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {tutorStudents && tutorStudents.length > 0 ? (
                        tutorStudents.map((student: any, index: number) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-navy-900 text-sm sm:text-base">
                                  {student.firstName} {student.lastName}
                                </h4>
                                <p className="text-xs sm:text-sm text-gray-600">
                                  {student.totalLessons} lekcj{student.totalLessons === 1 ? 'a' : student.totalLessons < 5 ? 'e' : 'i'}
                                </p>
                                {student.lastLessonDate && (
                                  <p className="text-xs text-gray-500">
                                    Ostatnia: {student.lastLessonDate}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 self-start sm:self-auto">
                                <Badge 
                                  variant={student.hasUpcomingLesson ? "default" : "secondary"}
                                  className={`text-xs ${student.hasUpcomingLesson ? "bg-green-100 text-green-800" : ""}`}
                                >
                                  {student.hasUpcomingLesson ? "Aktywny" : "Nieaktywny"}
                                </Badge>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setLocation(`/messages?user=${student.id}`)}
                                  className="text-xs"
                                  data-testid={`button-message-student-${index}`}
                                >
                                  <MessageCircle className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-sm sm:text-base text-gray-500">
                          Brak uczniów z lekcjami
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>



          <TabsContent value="lessons">
            <TutorLessonEditor editingLessonId={editingLessonId} onLessonEdited={() => setEditingLessonId(null)} />
          </TabsContent>

          <TabsContent value="homework">
            <TutorHomeworkManager />
          </TabsContent>

          <TabsContent value="materials">
            <TutorMaterials />
          </TabsContent>

          <TabsContent value="calendar">
            <CalendarView 
              userRole="tutor" 
              userId={isDemoMode ? (activeTutorId || "tutor1") : (user as any)?.id || ""} 
              onEditLesson={handleEditLessonFromCalendar}
            />
          </TabsContent>

          <TabsContent value="profile">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-navy-900">Edytuj profil</CardTitle>
                  <p className="text-gray-600">Zaktualizuj swój opis, aby uczniowie mogli lepiej Cię poznać</p>
                </CardHeader>
                <CardContent>
                  <TutorBioEditor isDemoMode={isDemoMode} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
