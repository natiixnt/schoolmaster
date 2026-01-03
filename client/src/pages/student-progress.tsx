import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle, Lock, Target, BookOpen, Clock, Star, Zap, Users, ChevronDown, ChevronRight, FileText, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Navbar } from "@/components/Navbar";

const chapters = [
  { id: 1, name: "Liczby i działania", description: "Podstawowe operacje, ułamki, procenty", lessons: [1, 7] },
  { id: 2, name: "Wyrażenia algebraiczne i równania", description: "Algebra, równania, nierówności", lessons: [8, 13] },
  { id: 3, name: "Geometria płaska", description: "Figury płaskie, pola, symetrie", lessons: [14, 18] },
  { id: 4, name: "Geometria przestrzenna", description: "Bryły, objętości, siatki", lessons: [19, 22] },
  { id: 5, name: "Funkcje i zależności", description: "Funkcja liniowa, wykresy, proporcje", lessons: [23, 26] },
  { id: 6, name: "Statystyka i prawdopodobieństwo", description: "Analiza danych, średnie, prawdopodobieństwo", lessons: [27, 29] },
  { id: 7, name: "Rozumowanie i zadania złożone", description: "Strategie, zadania wieloetapowe", lessons: [30, 32] },
];

export default function StudentProgress() {
  const { user } = useAuth();
  const [openChapters, setOpenChapters] = useState<number[]>([1]); // First chapter open by default

  // Get topic progression for student
  const { data: topicProgression = [], isLoading } = useQuery({
    queryKey: ["/api/student/topic-progression"],
    enabled: !!user,
  });

  // Get next available topic
  const { data: nextTopic } = useQuery({
    queryKey: ["/api/student/next-topic"],
    enabled: !!user,
  });

  // Get next bookable topic (for booking new lessons)
  const { data: nextBookableTopic } = useQuery({
    queryKey: ["/api/student/next-bookable-topic"],
    enabled: !!user,
  });

  // Get student lessons with details
  const { data: lessons = [] } = useQuery({
    queryKey: ["/api/student/lessons-details"],
    enabled: !!user,
  });

  // Fetch all quizzes to check availability
  const { data: quizzes = [] } = useQuery({
    queryKey: ["/api/quizzes"],
    enabled: !!user,
  });

  // Fetch exercise stats for all modules (single API call)
  const { data: exerciseStats = {} } = useQuery<Record<string, any>>({
    queryKey: ["/api/exercises/stats-all"],
    enabled: !!user,
  });

  // Check if topic has quiz available
  const hasQuizForTopic = (topicId: string) => {
    return (quizzes as any[]).some((quiz: any) => quiz.moduleCode === topicId);
  };

  // Get quiz for topic
  const getQuizForTopic = (topicId: string) => {
    return (quizzes as any[]).find((quiz: any) => quiz.moduleCode === topicId);
  };

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
    <>
      <Navbar />
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
          <h1 className="text-3xl font-bold text-navy-900 mb-2">Mapa postępów</h1>
          <p className="text-gray-600 mb-4">Śledź swoje postępy w nauce matematyki</p>
          
          {/* Info Banner */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 mb-4 text-left">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-purple-900 mb-1">💡 Ćwiczenia i testy</h3>
                <p className="text-sm text-purple-800">
                  Rozwiń dowolny moduł poniżej, aby zobaczyć dostępne <strong>ćwiczenia</strong> (fioletowa ikona) 
                  i <strong>testy</strong> (niebieska ikona). Rozwiązuj zadania, zdobywaj punkty i testuj swoją wiedzę!
                </p>
              </div>
            </div>
          </div>
          
          {/* Progress Overview */}
          <div className="bg-gradient-to-r from-accent/10 to-yellow-50 rounded-lg p-6 mb-8">
            <div className="grid md:grid-cols-3 gap-6">
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
            </div>
            <div className="mt-4">
              <Progress value={progressPercentage} className="h-3" />
            </div>
          </div>
        </div>
      </div>

      {/* Current and Next Topic Sections */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Current Topic - Nearest Scheduled Lesson */}
        {(() => {
          // Find the nearest scheduled lesson (excluding cancelled, completed, and rescheduled)
          // Valid lesson statuses from DB: 'scheduled', 'completed', 'cancelled', 'rescheduled', 'unpaid'
          const activeLessons = (lessons as any[]).filter((lesson: any) => 
            lesson.status === 'scheduled'
          );
          const nearestLesson = activeLessons.sort((a: any, b: any) => 
            new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
          )[0];

          return nearestLesson ? (
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-navy-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Twój aktualny temat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="font-semibold text-navy-900 text-lg">
                      {nearestLesson.topicId}
                    </div>
                    <div className="text-gray-700 font-medium">
                      {nearestLesson.title}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {new Date(nearestLesson.scheduledAt).toLocaleString('pl-PL')}
                      </span>
                    </div>
                    
                    {nearestLesson.tutorFirstName && nearestLesson.tutorLastName && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {nearestLesson.tutorFirstName} {nearestLesson.tutorLastName}
                        </span>
                      </div>
                    )}
                    
                    <div className="mt-3">
                      {nearestLesson.status === 'scheduled' ? (
                        <Badge className="bg-green-100 text-green-800 border-0" data-testid="badge-lesson-scheduled">
                          ✅ Zaplanowana
                        </Badge>
                      ) : nearestLesson.status === 'unpaid' ? (
                        <Badge className="bg-yellow-100 text-yellow-800 border-0" data-testid="badge-lesson-unpaid">
                          ⏳ Oczekuje na płatność
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-gray-200 bg-gray-50">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-600 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-400" />
                  Twój aktualny temat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <div className="text-gray-500 mb-2">Brak zaplanowanych lekcji</div>
                  <div className="text-sm text-gray-400">Zarezerwuj swoją pierwszą lekcję</div>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Next Topic to Book */}
        <Card className="border-2 border-accent bg-accent/5">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-navy-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-accent" />
              Twój następny temat
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextBookableTopic ? (
              <div className="space-y-4">
                <div>
                  <div className="font-semibold text-navy-900 text-lg">
                    {(nextBookableTopic as any).id || (nextBookableTopic as any).topicId}
                  </div>
                  <div className="text-gray-700 font-medium">
                    {(nextBookableTopic as any).name || (nextBookableTopic as any).topicName}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {(nextBookableTopic as any).description || (nextBookableTopic as any).topicDescription}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{(nextBookableTopic as any).estimatedDuration || 60} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="w-4 h-4 text-accent" />
                    <span>+{(nextBookableTopic as any).xpReward || 50} XP</span>
                  </div>
                </div>
                
                <div className="pt-2">
                  <Link href="/find-tutor" className="block">
                    <Button className="w-full bg-accent text-navy-900 hover:bg-accent/90 font-semibold">
                      <Users className="w-4 h-4 mr-2" />
                      Zarezerwuj lekcję
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="text-gray-500 mb-2">Brak dostępnych tematów</div>
                <div className="text-sm text-gray-400">Ukończ aktualne tematy aby odblokować kolejne</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progress Map by Chapters */}
      <div className="space-y-4">
        {chapters.map((chapter) => {
          const { completed, total, topics } = getChapterProgress(chapter.lessons);
          const isOpen = openChapters.includes(chapter.id);
          const progress = total > 0 ? (completed / total) * 100 : 0;
          
          return (
            <Card key={chapter.id} className="overflow-hidden transition-colors hover:bg-gray-50">
              <Collapsible open={isOpen} onOpenChange={() => toggleChapter(chapter.id)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          progress === 100 ? 'bg-green-100 text-green-600' :
                          progress > 0 ? 'bg-blue-100 text-blue-600' :
                          'bg-gray-100 text-gray-400'
                        }`}>
                          <span className="text-sm font-bold">{chapter.id}</span>
                        </div>
                        <div>
                          <CardTitle className="text-xl font-bold text-navy-900">
                            {chapter.name}
                          </CardTitle>
                          <p className="text-sm text-gray-600">{chapter.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-semibold text-navy-900">{completed}/{total}</div>
                          <div className="text-xs text-gray-500">lekcji</div>
                        </div>
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-accent to-yellow-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        {isOpen ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {topics.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-200 bg-white p-4 text-center">
                          <div className="text-sm text-gray-600">Brak tematów w tym dziale</div>
                          <div className="text-xs text-gray-500 mt-1">Nowe tematy pojawią się wkrótce.</div>
                        </div>
                      ) : (
                      topics.map((topic: any) => (
                        <div key={topic.topicId} className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                          topic.status === 'completed' ? 'bg-green-50 border-green-200' :
                          topic.status === 'in_progress' ? 'bg-yellow-50 border-yellow-200' :
                          topic.status === 'available' ? 'bg-blue-50 border-blue-200' :
                          'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                topic.status === 'completed' 
                                  ? 'bg-green-100 text-green-600' 
                                  : topic.status === 'in_progress'
                                  ? 'bg-yellow-100 text-yellow-600'
                                  : topic.status === 'available'
                                  ? 'bg-blue-100 text-blue-600'
                                  : 'bg-gray-100 text-gray-400'
                              }`}>
                                {topic.status === 'completed' ? (
                                  <CheckCircle className="w-4 h-4" />
                                ) : topic.status === 'in_progress' ? (
                                  <Clock className="w-4 h-4" />
                                ) : topic.status === 'available' ? (
                                  <Target className="w-4 h-4" />
                                ) : (
                                  <Lock className="w-4 h-4" />
                                )}
                              </div>
                              <div>
                                <h4 className="font-semibold text-navy-900 text-sm">{topic.topicName}</h4>
                                <p className="text-xs text-gray-600">Lekcja #{topic.topicOrder}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                {topic.estimatedDuration}min
                              </div>
                              <div className="flex items-center gap-1 text-xs text-yellow-600">
                                <Star className="w-3 h-3" />
                                {topic.xpReward}XP
                              </div>
                              
                              {/* NEW: Quiz Status Badge */}
                              {topic.quizStatus?.hasQuiz && (
                                <Badge 
                                  variant={
                                    topic.quizStatus.passed ? 'default' : 
                                    topic.quizStatus.required ? 'destructive' : 'secondary'
                                  }
                                  className="text-xs"
                                  data-testid={`badge-quiz-status-${topic.topicId}`}
                                >
                                  {topic.quizStatus.passed ? (
                                    <span className="flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3" />
                                      Test zdany ({topic.quizStatus.bestScore}%)
                                    </span>
                                  ) : topic.quizStatus.required ? (
                                    <span className="flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3" />
                                      Test wymagany
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1">
                                      <FileText className="w-3 h-3" />
                                      Test dostępny
                                    </span>
                                  )}
                                </Badge>
                              )}
                              
                              {/* Exercise Stats Badge */}
                              {exerciseStats[topic.topicId] && exerciseStats[topic.topicId].totalExercises > 0 && (
                                <Badge 
                                  variant="outline"
                                  className="text-xs bg-purple-50 border-purple-200 text-purple-700"
                                  data-testid={`badge-exercise-stats-${topic.topicId}`}
                                >
                                  <Target className="w-3 h-3 mr-1 inline" />
                                  {exerciseStats[topic.topicId].completedExercises}/{exerciseStats[topic.topicId].totalExercises} ćw.
                                </Badge>
                              )}
                              
                              <Badge variant={
                                topic.status === 'completed' ? 'default' :
                                topic.status === 'in_progress' ? 'secondary' :
                                topic.status === 'available' ? 'secondary' : 'outline'
                              }>
                                {topic.status === 'completed' ? 'Ukończony' :
                                 topic.status === 'in_progress' ? 'Oczekujący' :
                                 topic.status === 'available' ? 'Dostępny' : 'Zablokowany'}
                              </Badge>
                            </div>
                          </div>
                          
                          {(topic.status === 'available' || topic.status === 'in_progress') && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              {/* Quiz Required Warning */}
                              {topic.quizStatus?.required && !topic.quizStatus.passed && topic.status === 'available' && (
                                <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                  <div className="flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-yellow-900">Test wymagany</p>
                                      <p className="text-xs text-yellow-700 mt-1">
                                        Musisz zdać test z wynikiem co najmniej {topic.quizStatus.lastAttempt?.quiz?.passingScore || 80}%, aby odblokować następny temat.
                                        {topic.quizStatus.attempts > 0 && (
                                          <span className="block mt-1">
                                            Najlepszy wynik: {topic.quizStatus.bestScore}% ({topic.quizStatus.attempts} {topic.quizStatus.attempts === 1 ? 'próba' : 'prób'})
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {topic.status === 'in_progress' ? (
                                <div className="space-y-2">
                                  <div className="text-center py-2">
                                    <div className="text-sm text-yellow-600 font-medium">
                                      📚 Lekcja zaplanowana - sprawdź kalendarz
                                    </div>
                                  </div>
                                  {topic.quizStatus?.hasQuiz && (
                                    <Link href={`/quiz/${topic.topicId}`}>
                                      <Button 
                                        size="sm" 
                                        variant={topic.quizStatus.required && !topic.quizStatus.passed ? "default" : "outline"}
                                        className={topic.quizStatus.required && !topic.quizStatus.passed ? "w-full bg-blue-600 hover:bg-blue-700 text-white" : "w-full border-blue-300 text-blue-700 hover:bg-blue-50"}
                                        data-testid={`button-quiz-${topic.topicId}`}
                                      >
                                        <FileText className="w-3 h-3 mr-2" />
                                        {topic.quizStatus.passed ? 'Powtórz test' : 'Rozpocznij test'}
                                      </Button>
                                    </Link>
                                  )}
                                  {/* Exercise Bank Button - if exercises available */}
                                  {exerciseStats[topic.topicId] && exerciseStats[topic.topicId].totalExercises > 0 && (
                                    <Link href={`/exercises/${topic.topicId}`}>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
                                        data-testid={`button-exercise-bank-${topic.topicId}`}
                                      >
                                        <Target className="w-4 h-4 mr-2" />
                                        Ćwiczenia ({exerciseStats[topic.topicId].completedExercises}/{exerciseStats[topic.topicId].totalExercises})
                                      </Button>
                                    </Link>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {/* Quiz button - show first if required and not passed */}
                                  {topic.quizStatus?.hasQuiz && topic.quizStatus.required && !topic.quizStatus.passed && (
                                    <Link href={`/quiz/${topic.topicId}`}>
                                      <Button 
                                        size="sm" 
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                                        data-testid={`button-quiz-${topic.topicId}`}
                                      >
                                        <FileText className="w-3 h-3 mr-2" />
                                        Rozpocznij test ({topic.quizStatus.bestScore}% / {topic.quizStatus.lastAttempt?.quiz?.passingScore || 80}%)
                                      </Button>
                                    </Link>
                                  )}

                                  {/* Book lesson button - disabled if quiz required and not passed */}
                                  <Link href={`/find-tutor?topic=${topic.topicId}`}>
                                    <Button 
                                      size="sm" 
                                      className="w-full bg-gradient-to-r from-accent to-yellow-500 hover:from-yellow-500 hover:to-accent text-navy-900 font-semibold"
                                      disabled={topic.quizStatus?.required && !topic.quizStatus.passed}
                                      data-testid={`button-book-${topic.topicId}`}
                                    >
                                      <BookOpen className="w-3 h-3 mr-2" />
                                      Zarezerwuj lekcję
                                      {topic.quizStatus?.required && !topic.quizStatus.passed && ' (Zablokowane)'}
                                    </Button>
                                  </Link>

                                  {/* Quiz button for optional quizzes or passed quizzes */}
                                  {topic.quizStatus?.hasQuiz && (!topic.quizStatus.required || topic.quizStatus.passed) && (
                                    <Link href={`/quiz/${topic.topicId}`}>
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                                        data-testid={`button-quiz-${topic.topicId}`}
                                      >
                                        <FileText className="w-3 h-3 mr-2" />
                                        {topic.quizStatus.passed ? `Powtórz test (${topic.quizStatus.bestScore}%)` : 'Rozpocznij test'}
                                      </Button>
                                    </Link>
                                  )}

                                  {/* Exercise Bank Button - if exercises available */}
                                  {exerciseStats[topic.topicId] && exerciseStats[topic.topicId].totalExercises > 0 && (
                                    <Link href={`/exercises/${topic.topicId}`}>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
                                        data-testid={`button-exercise-bank-${topic.topicId}`}
                                      >
                                        <Target className="w-4 h-4 mr-2" />
                                        Ćwiczenia ({exerciseStats[topic.topicId].completedExercises}/{exerciseStats[topic.topicId].totalExercises})
                                      </Button>
                                    </Link>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>
    </div>
    </>
  );
}
