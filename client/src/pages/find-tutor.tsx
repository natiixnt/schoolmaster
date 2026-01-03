import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Search, Clock, Star, User, Calendar, Award, BookOpen, Filter, CreditCard, ArrowLeft, DollarSign, Settings, Target, CheckCircle, Lock } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import BookingModal from "@/components/tutor/booking-modal";

interface Tutor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  rating: number;
  totalLessons: number;
  hourlyRate: number;
  bio?: string;
  specializations?: string[];
  experience: number;
  gender: string;
  teachingStyle: string;
  isVerified?: boolean;
  availability?: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
}

// Math curriculum chapters
const chapters = [
  { id: 1, title: "DZIAŁ 1: LICZBY I DZIAŁANIA", lessons: [1, 7] },
  { id: 2, title: "DZIAŁ 2: WYRAŻENIA ALGEBRAICZNE", lessons: [8, 10] },
  { id: 3, title: "DZIAŁ 3: RÓWNANIA I NIERÓWNOŚCI", lessons: [11, 15] },
  { id: 4, title: "DZIAŁ 4: UKŁADY RÓWNAŃ", lessons: [16, 18] },
  { id: 5, title: "DZIAŁ 5: FUNKCJE", lessons: [19, 23] },
  { id: 6, title: "DZIAŁ 6: STATYSTYKA", lessons: [24, 26] },
  { id: 7, title: "DZIAŁ 7: GEOMETRIA", lessons: [27, 32] }
];

export default function FindTutor() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [openChapters, setOpenChapters] = useState<number[]>([1]); // First chapter open by default
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [showTutorModal, setShowTutorModal] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Get topic progression for student
  const { data: topicProgression = [], isLoading, error: topicError } = useQuery({
    queryKey: ["/api/student/topic-progression"],
    enabled: !!user,
    staleTime: 0, // Force fresh data
    cacheTime: 0, // Don't cache
    retry: false,
  });
  
  console.log('topicProgression data:', topicProgression);
  console.log('topicProgression error:', topicError);
  console.log('user:', user);

  // Get next available topic
  const { data: nextTopic } = useQuery({
    queryKey: ["/api/student/next-topic"],
    enabled: !!user,
    staleTime: 0, // Force fresh data
    cacheTime: 0, // Don't cache
  });
  
  console.log('nextTopic data:', nextTopic);

  // Get lesson invitations to check for pending bookings
  const { data: lessonInvitations = [] } = useQuery({
    queryKey: ["/api/student/lesson-invitations"],
    enabled: !!user,
  });
  
  console.log('lessonInvitations data:', lessonInvitations);

  // Get user's current balance
  const { data: balanceData } = useQuery({
    queryKey: ["/api/balance"],
  });
  const balance = parseFloat((balanceData as any)?.balance || "0");

  // Get available tutors
  const { data: tutors = [] } = useQuery({
    queryKey: ["/api/tutors"],
  });

  // Sort tutors by score (rating * experience + total lessons)
  const sortedTutors = (tutors as any[])
    .filter(t => t.tutorProfile?.isVerified)
    .sort((a, b) => {
      const scoreA = (parseFloat(a.tutorProfile?.rating || '0')) * 1 + (a.tutorProfile?.totalLessons || 0);
      const scoreB = (parseFloat(b.tutorProfile?.rating || '0')) * 1 + (b.tutorProfile?.totalLessons || 0);
      return scoreB - scoreA;
    });



  const toggleChapter = (chapterId: number) => {
    setOpenChapters(prev => 
      prev.includes(chapterId) 
        ? prev.filter(id => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  const getChapterProgress = (chapterLessons: number[]) => {
    const chapterTopics = (topicProgression as any[]).filter((topic: any) => 
      topic.topicOrder >= chapterLessons[0] && topic.topicOrder <= chapterLessons[1]
    );
    const completed = chapterTopics.filter((topic: any) => topic.status === 'completed').length;
    return { completed, total: chapterTopics.length, topics: chapterTopics };
  };

  const getTopicButtonStatus = (topic: any) => {
    const topicId = topic.topicId || topic.topic_id;
    
    // Check for pending invitations first
    const pendingInvitations = (lessonInvitations as any[]).filter((invitation: any) => 
      invitation.topicId === topicId && invitation.status === 'pending'
    );
    
    if (pendingInvitations.length > 0) {
      return {
        canBook: false,
        status: 'pending',
        message: 'Oczekujące zaproszenie',
        pendingCount: pendingInvitations.length
      };
    }
    
    // Rest of logic from canBookTopic...
    if (topic.status === 'completed') {
      return { canBook: false, status: 'completed', message: 'Ukończono' };
    }
    
    if (topic.status === 'booked') {
      return { canBook: false, status: 'booked', message: 'Zarezerwowano' };
    }
    
    // Special case: First topic (MAT-L01) is always bookable for new students
    if (topicId === 'MAT-L01') {
      const hasCompletedTopics = (topicProgression as any[]).some((t: any) => t.status === 'completed');
      if (!hasCompletedTopics || topic.status === 'in_progress') {
        return { canBook: true, status: 'available', message: 'Zarezerwuj lekcję' };
      }
      return { canBook: false, status: 'locked', message: 'Ukończono' };
    }
    
    if (topic.status === 'available' || topic.status === 'in_progress') {
      return { canBook: true, status: 'available', message: 'Zarezerwuj lekcję' };
    }
    
    if (nextTopic && topicId === nextTopic.topicId) {
      return { canBook: true, status: 'available', message: 'Zarezerwuj lekcję' };
    }
    
    return { canBook: false, status: 'locked', message: 'Zablokowano' };
  };

  const canBookTopic = (topic: any) => {
    return getTopicButtonStatus(topic).canBook;
  };

  const handleBookTopic = async (topicId: string) => {
    // Check button status first - if pending, show info popup instead of trying to book
    const topic = topicProgression.find(t => t.topicId === topicId);
    if (topic) {
      const buttonStatus = getTopicButtonStatus(topic);
      if (buttonStatus.status === 'pending') {
        toast({
          title: "Oczekujące zaproszenia",
          description: `Masz ${buttonStatus.pendingCount} aktywnych zaproszeń dla tego tematu. Poczekaj na odpowiedź korepetytorów lub sprawdź swoje wiadomości.`,
          variant: "default",
        });
        return;
      }
    }

    // Check if student can book this topic by calling the API
    try {
      const result = await apiRequest('/api/lessons/book-topic', 'POST', { topicId });
      
      // If successful, set selected topic and show tutor selection modal
      setSelectedTopic(topicId);
      setShowTutorModal(true);
    } catch (error: any) {
      // Handle specific error types
      if (error?.status === "pending_invitations") {
        toast({
          title: "Zaproszenia oczekujące",
          description: `Masz ${error.pendingCount} aktywnych zaproszeń dla tego tematu. Poczekaj na odpowiedź korepetytorów.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Błąd rezerwacji",
          description: error?.message || "Nie można zarezerwować tego tematu.",
          variant: "destructive",
        });
      }
    }
  };

  // Handle tutor selection from modal
  const handleTutorSelect = (tutor: Tutor) => {
    setSelectedTutor(tutor);
    setShowTutorModal(false);
    setShowBookingModal(true);
  };

  // Handle actual lesson booking with selected tutor
  const handleBookLesson = async (tutorId: string, timeSlot: string, paymentMethod: 'balance' | 'stripe', specialNeeds?: string) => {
    try {
      // Convert timeSlot to ISO string for the backend
      const isoTimeSlot = new Date(timeSlot).toISOString();
      
      console.log('Booking lesson with:', {
        tutorId,
        topicId: selectedTopic,
        timeSlot: isoTimeSlot,
        paymentMethod,
        specialNeeds: specialNeeds || ""
      });
      
      await apiRequest('/api/lessons/book', 'POST', {
        tutorId,
        timeSlot: isoTimeSlot,
        paymentMethod,
        specialNeeds: specialNeeds || ""
      });
      
      toast({
        title: "Lekcja zarezerwowana",
        description: "Lekcja została pomyślnie zarezerwowana. Otrzymasz potwierdzenie na email.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student/lessons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student/lesson-invitations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student/topic-progression"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student/next-topic"] });
      
      setShowBookingModal(false);
      setSelectedTutor(null);
      setSelectedTopic(null);
    } catch (error: any) {
      toast({
        title: "Błąd rezerwacji",
        description: error?.message || "Nie udało się zarezerwować lekcji.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-900"></div>
      </div>
    );
  }

  // Calculate progress stats
  const completedTopics = (topicProgression as any[]).filter((topic: any) => topic.status === 'completed').length;
  const totalTopics = (topicProgression as any[]).length;
  const progressPercentage = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Link href="/student-dashboard">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Powrót do panelu
            </Button>
          </Link>
        </div>
        
        <div className="text-center">
          <h1 className="text-3xl font-bold text-navy-900 mb-2">Zarezerwuj lekcję</h1>
          <p className="text-gray-600 mb-4">System automatycznie wybierze następny temat w kolejności</p>
          
          {/* Progress Overview */}
          <div className="bg-gradient-to-r from-accent/10 to-yellow-50 rounded-lg p-6 mb-8">
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-navy-900 mb-1">{completedTopics}</div>
                <div className="text-sm text-gray-600">Ukończone tematy</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-navy-900 mb-1">{totalTopics}</div>
                <div className="text-sm text-gray-600">Wszystkie tematy</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-navy-900 mb-1">{progressPercentage.toFixed(0)}%</div>
                <div className="text-sm text-gray-600">Postęp ogólny</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">{balance.toFixed(0)} zł</div>
                <div className="text-sm text-gray-600">Twoje saldo</div>
              </div>
            </div>
            <div className="mt-4">
              <Progress value={progressPercentage} className="h-3" />
            </div>
          </div>
        </div>
      </div>

      {/* Available Tutors Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Dostępni korepetytorzy ({tutors.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {tutors.slice(0, 3).map((tutor: any) => (
              <div key={tutor.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{tutor.firstName} {tutor.lastName}</h4>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span>{tutor.rating?.toFixed(1) || 'Nowy'}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {tutor.experience || 0} lat doświadczenia • {tutor.totalLessons || 0} lekcji
                </div>
              </div>
            ))}
          </div>
          {tutors.length > 3 && (
            <div className="text-center mt-4">
              <span className="text-sm text-gray-600">
                ... i {tutors.length - 3} innych korepetytorów dostępnych do wyboru
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Map by Chapters */}
      <div className="space-y-4">
        {chapters.map((chapter) => {
          const { completed, total, topics } = getChapterProgress(chapter.lessons);
          const isOpen = openChapters.includes(chapter.id);
          const progress = total > 0 ? (completed / total) * 100 : 0;
          
          return (
            <Card key={chapter.id} className="overflow-hidden">
              <Collapsible open={isOpen} onOpenChange={() => toggleChapter(chapter.id)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-left">
                          <CardTitle className="text-lg font-semibold text-navy-900">
                            {chapter.title}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-4 mt-1">
                            <span>Lekcje {chapter.lessons[0]}-{chapter.lessons[1]}</span>
                            <span>•</span>
                            <span>{completed}/{total} ukończone</span>
                            <span>•</span>
                            <span>{progress.toFixed(0)}% postępu</span>
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-32">
                          <Progress value={progress} className="h-2" />
                        </div>
                        <div className="text-2xl">
                          {isOpen ? '−' : '+'}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {topics.map((topic: any) => (
                        <div key={topic.topicId} className={`
                          border rounded-lg p-4 transition-all
                          ${topic.status === 'completed' ? 'bg-green-50 border-green-200' : 
                            topic.status === 'available' || canBookTopic(topic) ? 'bg-blue-50 border-blue-200' :
                            'bg-gray-50 border-gray-200'}
                        `}>
                          <div className="flex items-start gap-3 mb-3">
                            <div className={`
                              flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                              ${topic.status === 'completed' ? 'bg-green-100 text-green-600' :
                                topic.status === 'available' || canBookTopic(topic) ? 'bg-blue-100 text-blue-600' :
                                'bg-gray-100 text-gray-400'}
                            `}>
                              {topic.status === 'completed' ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (topic.status === 'available' || canBookTopic(topic)) ? (
                                <Target className="w-4 h-4" />
                              ) : (
                                <Lock className="w-4 h-4" />
                              )}
                            </div>
                            <div className="flex-grow">
                              <h4 className="font-semibold text-navy-900 text-sm">
                                {(topic as any).topicName || (topic as any).topic_name || `Temat ${(topic as any).topicOrder}`}
                              </h4>
                              <p className="text-xs text-gray-600">Lekcja #{(topic as any).topicOrder}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              {(topic as any).estimatedDuration || (topic as any).estimated_duration || 60}min
                            </div>
                            <div className="flex items-center gap-1 text-xs text-yellow-600">
                              <Star className="w-3 h-3" />
                              {(topic as any).xpReward || (topic as any).xp_reward || 10}XP
                            </div>
                            <Badge variant={
                              (() => {
                                const buttonStatus = getTopicButtonStatus(topic);
                                switch (buttonStatus.status) {
                                  case 'completed': return 'default';
                                  case 'available': return 'secondary';
                                  case 'pending': return 'destructive';
                                  default: return 'outline';
                                }
                              })()
                            }>
                              {(() => {
                                const buttonStatus = getTopicButtonStatus(topic);
                                if (buttonStatus.status === 'pending') {
                                  return `Oczekuje ${buttonStatus.pendingCount} odpowiedzi`;
                                }
                                return buttonStatus.message;
                              })()}
                            </Badge>
                          </div>
                          
                          {(() => {
                            const buttonStatus = getTopicButtonStatus(topic);
                            const topicId = (topic as any).topicId || (topic as any).topic_id;
                            
                            if (buttonStatus.canBook) {
                              return (
                                <div className="space-y-2">
                                  <Button 
                                    onClick={() => handleBookTopic(topicId)}
                                    className="w-full bg-gradient-to-r from-accent to-yellow-500 hover:from-yellow-500 hover:to-accent text-navy-900 font-semibold"
                                    size="sm"
                                  >
                                    <BookOpen className="w-3 h-3 mr-2" />
                                    {buttonStatus.message}
                                  </Button>
                                  
                                  {(topicId === nextTopic?.topicId || topicId === 'MAT-L01') && (
                                    <div className="text-xs text-blue-600 text-center">
                                      {topicId === 'MAT-L01' ? 'Zacznij naukę tutaj' : 'Następny temat do nauki'}
                                    </div>
                                  )}
                                </div>
                              );
                            } else if (buttonStatus.status === 'pending') {
                              return (
                                <div className="space-y-2">
                                  <Button 
                                    onClick={() => handleBookTopic(topicId)}
                                    className="w-full bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-300"
                                    size="sm"
                                  >
                                    <Clock className="w-3 h-3 mr-2" />
                                    Oczekujące zaproszenie
                                  </Button>
                                  <div className="text-xs text-orange-600 text-center">
                                    Kliknij aby zobaczyć szczegóły
                                  </div>
                                </div>
                              );
                            } else {
                              return (
                                <div className="space-y-2">
                                  <Button 
                                    disabled
                                    className="w-full bg-gray-100 text-gray-500 cursor-not-allowed"
                                    size="sm"
                                  >
                                    <Lock className="w-3 h-3 mr-2" />
                                    {buttonStatus.message}
                                  </Button>
                                </div>
                              );
                            }
                          })()}
                          

                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* Help Text */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="text-center text-sm text-gray-600">
            <h4 className="font-medium text-navy-900 mb-2">Jak to działa?</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">1</div>
                <span>Rezerwuj tematy w kolejności</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">2</div>
                <span>Wybierz korepetytora automatycznie</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">3</div>
                <span>Ukończ lekcję i przejdź dalej</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tutor Selection Modal */}
      <Dialog open={showTutorModal} onOpenChange={setShowTutorModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Wybierz korepetytora dla tematu {selectedTopic}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {sortedTutors.map((tutor) => (
              <div key={tutor.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold">{tutor.firstName} {tutor.lastName}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>{tutor.tutorProfile?.rating ? parseFloat(tutor.tutorProfile.rating).toFixed(1) : 'Nowy'} ({tutor.tutorProfile?.totalLessons || 0} lekcji)</span>
                      </div>
                      <div>{tutor.tutorProfile?.hourlyRate || '100'} zł/godz</div>
                    </div>
                    {tutor.tutorProfile?.bio && (
                      <p className="text-sm text-gray-600 mt-2">{tutor.tutorProfile.bio}</p>
                    )}
                    {tutor.tutorProfile?.specializations && tutor.tutorProfile.specializations.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {tutor.tutorProfile.specializations.map((spec, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {spec === 'mathematics' ? 'matematyka' : 
                             spec === 'physics' ? 'fizyka' : 
                             spec === 'chemistry' ? 'chemia' : 
                             spec === 'english' ? 'angielski' : spec}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button 
                    onClick={() => handleTutorSelect(tutor)}
                    className="bg-gradient-to-r from-accent to-yellow-500 hover:from-yellow-500 hover:to-accent text-navy-900 font-semibold"
                  >
                    Wybierz
                  </Button>
                </div>
              </div>
            ))}
            {sortedTutors.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Brak dostępnych korepetytorów w tej chwili.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => {
          setShowBookingModal(false);
          setSelectedTutor(null);
        }}
        tutor={selectedTutor}
        balance={balance}
        onBookLesson={handleBookLesson}
        isLoading={false}
      />
    </div>
  );
}
