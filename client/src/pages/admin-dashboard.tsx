import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SchoolMasterLogo from "@/assets/schoolmaster-logo.png";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Users, Presentation, Video, TrendingUp, BookOpen, PlayCircle, Eye, UserCheck, GraduationCap, Banknote, ChevronDown, FileText, ArrowLeft, Clock, CheckCircle, Mail, MessageSquare, CreditCard, Trophy, Star, Flame, DollarSign, Settings } from "lucide-react";
import CourseManagement from "@/components/admin/course-management";
import LessonManagement from "@/components/admin/lesson-management";
import PayoutManagement from "@/components/admin/payout-management";
import UserManagement from "@/components/admin/user-management";
import HomeworkManagement from "@/components/admin/homework-management";
import SubjectUnlockManagement from "@/components/admin/subject-unlock-management";
import BadgeManagement from "@/components/admin/badge-management";
import ReferralSettings from "@/components/admin/referral-settings";
import PackageManagement from "@/components/admin/package-management";
import { LoyaltyManagement } from "@/components/admin/loyalty-management";

import RevenueDetailsModal from "@/components/admin/revenue-details-modal";
import DailyRevenueChart from "@/components/admin/daily-revenue-chart";
import LessonList from "@/components/admin/lesson-list";
import MailingListManagement from "@/components/admin/mailing-list-management";

// Preview components are no longer needed - redirecting to existing dashboard pages with demo mode

export default function AdminDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, logout } = useAdminAuth();
  const [, setLocation] = useLocation();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [userManagementTab, setUserManagementTab] = useState("students");
  // Preview modes are handled by redirects, no longer need state

  const [isLessonListOpen, setIsLessonListOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("");

  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);


  const handleSelectCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
  };

  const handleViewSwitch = (mode: "admin" | "student" | "tutor") => {
    if (mode === "student") {
      // Redirect to existing student dashboard with demo mode
      window.location.href = "/student-dashboard?demo=true";
      return;
    }
    if (mode === "tutor") {
      // Redirect to existing tutor dashboard with demo mode  
      window.location.href = "/tutor-dashboard?demo=true";
      return;
    }
    // Preview modes handled by redirects
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation("/admin-login");
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast, setLocation]);

  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["/api/admin/dashboard"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: todaysLessons } = useQuery({
    queryKey: ["/api/admin/todays-lessons"],
    enabled: isAuthenticated,
  });

  const { data: newRegistrations } = useQuery({
    queryKey: ["/api/admin/new-registrations"],
    enabled: isAuthenticated,
  });

  const handleLogout = async () => {
    try {
      await logout();
      setLocation("/admin-login");
    } catch (error) {
      toast({
        title: "Logout Error",
        description: "Failed to logout properly",
        variant: "destructive",
      });
    }
  };

  if (isLoading || isDashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-900"></div>
      </div>
    );
  }

  const stats = (dashboardData as any)?.stats || {};

  // Preview modes are now handled by redirects, so this component only shows admin interface

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">

              <img 
                src={SchoolMasterLogo} 
                alt="SchoolMaster" 
                className="h-6"
              />
              <span className="text-sm bg-navy-100 text-navy-800 px-2 py-1 rounded-full">
                Admin
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Podgląd jako:</span>
                <Button
                  variant="default"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Admin
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewSwitch("student")}
                  className="flex items-center gap-2"
                >
                  <GraduationCap className="w-4 h-4" />
                  Uczeń
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewSwitch("tutor")}
                  className="flex items-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  Korepetytor
                </Button>
              </div>
              
              <Button onClick={handleLogout} variant="outline">
                Wyloguj się
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy-900">
            Panel administratora
          </h1>
          <p className="text-gray-600">
            Zarządzanie platformą i użytkownikami
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="flex w-full max-w-5xl mx-auto bg-white border border-gray-200 p-1 rounded-lg">
              <TabsTrigger 
                value="overview" 
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-navy-700 data-[state=active]:bg-navy-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all rounded-md whitespace-nowrap"
              >
                <TrendingUp className="w-4 h-4" />
                Przegląd
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-navy-700 data-[state=active]:bg-navy-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all rounded-md whitespace-nowrap"
              >
                <Users className="w-4 h-4" />
                Użytkownicy
              </TabsTrigger>
              <TabsTrigger 
                value="courses" 
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-navy-700 data-[state=active]:bg-navy-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all rounded-md whitespace-nowrap"
              >
                <BookOpen className="w-4 h-4" />
                Kursy
              </TabsTrigger>

              <TabsTrigger 
                value="homework" 
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-navy-700 data-[state=active]:bg-navy-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all rounded-md whitespace-nowrap"
              >
                <FileText className="w-4 h-4" />
                Prace domowe
              </TabsTrigger>

              <TabsTrigger 
                value="finances" 
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-navy-700 data-[state=active]:bg-navy-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all rounded-md whitespace-nowrap"
              >
                <DollarSign className="w-4 h-4" />
                Finanse
              </TabsTrigger>
              <TabsTrigger 
                value="subjects" 
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-navy-700 data-[state=active]:bg-navy-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all rounded-md whitespace-nowrap"
              >
                <BookOpen className="w-4 h-4" />
                Przedmioty
              </TabsTrigger>
              <TabsTrigger 
                value="gamification" 
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-navy-700 data-[state=active]:bg-navy-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all rounded-md whitespace-nowrap"
              >
                <Trophy className="w-4 h-4" />
                Gamifikacja
              </TabsTrigger>
              <TabsTrigger 
                value="mailing" 
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-navy-700 data-[state=active]:bg-navy-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all rounded-md whitespace-nowrap"
              >
                <Mail className="w-4 h-4" />
                Mailing
              </TabsTrigger>
              <TabsTrigger 
                value="quizzes" 
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-navy-700 data-[state=active]:bg-navy-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all rounded-md whitespace-nowrap"
                data-testid="tab-quizzes"
                onClick={() => setLocation('/quiz-management')}
              >
                <FileText className="w-4 h-4" />
                Quizy
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-navy-700 data-[state=active]:bg-navy-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all rounded-md whitespace-nowrap"
                data-testid="tab-settings"
              >
                <Settings className="w-4 h-4" />
                Ustawienia
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                  onClick={() => {
                    setActiveTab("users");
                    setUserManagementTab("students");
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Uczniowie</p>
                        <p className="text-2xl font-bold text-navy-900">{stats.totalStudents || 0}</p>
                      </div>
                      <GraduationCap className="w-8 h-8 text-navy-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                  onClick={() => {
                    setActiveTab("users");
                    setUserManagementTab("tutors");
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Korepetytorzy</p>
                        <p className="text-2xl font-bold text-navy-900">{stats.totalTutors || 0}</p>
                      </div>
                      <UserCheck className="w-8 h-8 text-navy-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                  onClick={() => setActiveTab('courses')}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Lekcje</p>
                        <p className="text-2xl font-bold text-navy-900">{stats.totalLessons || 0}</p>
                      </div>
                      <Presentation className="w-8 h-8 text-navy-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                  onClick={() => setActiveTab('finances')}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Przychód</p>
                        <p className="text-2xl font-bold text-navy-900">{stats.totalRevenue || 0} zł</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-navy-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Chart and Recent Activity - Full width chart with activity below */}
              <div className="grid grid-cols-1 gap-6">
                <Card className="lg:col-span-2">
                  <DailyRevenueChart />
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Dzisiejsze lekcje</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {todaysLessons && Array.isArray(todaysLessons) && todaysLessons.length > 0 ? (
                        todaysLessons.slice(0, 5).map((lesson: any) => (
                          <div key={lesson.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium text-navy-900">{lesson.title}</p>
                              <p className="text-sm text-gray-600">
                                {lesson.tutorName} → {lesson.studentName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(lesson.scheduledAt).toLocaleTimeString('pl-PL', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </p>
                            </div>
                            <Badge variant={lesson.status === 'scheduled' ? 'default' : 'secondary'}>
                              {lesson.status === 'scheduled' ? 'Zaplanowana' : lesson.status}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          Brak lekcji na dzisiaj
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="users">
              <UserManagement initialTab={userManagementTab} />
            </TabsContent>

            <TabsContent value="courses">
              <CourseManagement onSelectCourse={handleSelectCourse} />
            </TabsContent>



            <TabsContent value="homework">
              <HomeworkManagement />
            </TabsContent>



            <TabsContent value="subjects">
              <SubjectUnlockManagement />
            </TabsContent>

            <TabsContent value="mailing">
              <MailingListManagement />
            </TabsContent>
            
            <TabsContent value="finances">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-navy-900 mb-2">Finanse</h2>
                  <p className="text-gray-600">Zarządzanie finansami uczniów i wypłatami dla korepetytorów</p>
                </div>
                
                <Tabs defaultValue="student-finances" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="student-finances" className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Finanse uczniów
                    </TabsTrigger>
                    <TabsTrigger value="payouts" className="flex items-center gap-2">
                      <Banknote className="w-4 h-4" />
                      Wypłaty
                    </TabsTrigger>
                    <TabsTrigger value="packages" className="flex items-center gap-2" data-testid="tab-packages">
                      <CreditCard className="w-4 h-4" />
                      Pakiety lekcji
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="student-finances" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-navy-900">Zarządzanie finansami uczniów</h3>
                        <p className="text-gray-600">Dodawaj i odejmuj środki z kont uczniów</p>
                      </div>
                      <Button
                        onClick={() => setLocation('/admin-finances')}
                        className="bg-navy-900 hover:bg-navy-800 text-white"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Otwórz panel finansowy
                      </Button>
                    </div>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="text-center space-y-4">
                          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                            <DollarSign className="w-8 h-8 text-yellow-600" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-navy-900">Panel finansowy</h4>
                            <p className="text-gray-600">Kliknij przycisk powyżej, aby przejść do szczegółowego panelu zarządzania finansami uczniów.</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="payouts">
                    <PayoutManagement />
                  </TabsContent>

                  <TabsContent value="packages">
                    <PackageManagement />
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>

            <TabsContent value="gamification">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-navy-900 mb-2">Gamifikacja</h2>
                  <p className="text-gray-600">Zarządzanie odznakami i programem lojalnościowym</p>
                </div>
                
                <Tabs defaultValue="badges" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="badges" className="flex items-center gap-2" data-testid="tab-badges">
                      <Trophy className="w-4 h-4" />
                      Odznaki
                    </TabsTrigger>
                    <TabsTrigger value="loyalty" className="flex items-center gap-2" data-testid="tab-loyalty">
                      <Star className="w-4 h-4" />
                      Program Lojalnościowy
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="badges">
                    <BadgeManagement />
                  </TabsContent>

                  <TabsContent value="loyalty">
                    <LoyaltyManagement />
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>

            <TabsContent value="mailing">
              <Card>
                <CardHeader>
                  <CardTitle>System mailingowy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-navy-900 mb-2">System mailingowy w rozwoju</h3>
                    <p className="text-gray-600">Funkcjonalność mailingowa będzie dostępna wkrótce.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <ReferralSettings />
            </TabsContent>

          </Tabs>
      </div>

      {/* Lesson List Modal */}
      <LessonList 
        isOpen={isLessonListOpen}
        onClose={() => setIsLessonListOpen(false)}
        period={selectedPeriod}
      />

      {/* Revenue Details Modal */}
      <RevenueDetailsModal 
        isOpen={isRevenueModalOpen}
        onClose={() => setIsRevenueModalOpen(false)}
      />
    </div>
  );
}