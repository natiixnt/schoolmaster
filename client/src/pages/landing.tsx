import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import SchoolMasterLogo from "@/assets/schoolmaster-logo.png";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MailingListModal } from "@/components/mailing-list-modal";
import { useCountUp } from "@/hooks/useCountUp";
import { Calculator, BookOpen, Globe, Atom, FlaskConical, Users, Target, TrendingUp, Eye, Star, Trophy, CheckCircle, ArrowRight, BarChart3, Leaf, Zap, Plus, UserCheck } from "lucide-react";
import type { Subject } from "@shared/schema";

// Animowany komponent statystyki
function AnimatedStat({ 
  number, 
  suffix, 
  label, 
  icon: IconComponent, 
  color 
}: { 
  number: string; 
  suffix: string; 
  label: string; 
  icon: any; 
  color: string; 
}) {
  // Wyciągnij liczbę z stringa (np. "2847" -> 2847, "4.9" -> 4.9, "15k" -> 15)
  const numericValue = parseFloat(number.replace(/[^0-9.]/g, ''));
  const { count, ref } = useCountUp({ end: numericValue, duration: 2500 });
  
  // Formatuj liczbę z powrotem do odpowiedniego formatu
  const formatNumber = (value: number) => {
    if (number.includes('.')) {
      // Dla liczb dziesiętnych jak 4.9
      return value.toFixed(1);
    }
    // Dla liczb całkowitych jak 2847, 94, 15
    return Math.floor(value).toString();
  };

  return (
    <div ref={ref} className="text-center">
      <div className={`w-20 h-20 mx-auto mb-4 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center shadow-lg`}>
        <IconComponent className="w-10 h-10 text-white" />
      </div>
      <div className="text-5xl font-bold mb-2 text-navy-900">
        {formatNumber(count)}{suffix}
      </div>
      <div className="text-lg font-medium text-navy-700">
        {label}
      </div>
    </div>
  );
}

export default function Landing() {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  
  // Fetch subjects from API with enrollment data
  const { data: subjects = [], isLoading } = useQuery<(Subject & { enrolledCount: number; mailingListCount: number })[]>({
    queryKey: ['/api/subjects']
  });

  // Set first available subject as selected by default
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubject) {
      const firstAvailable = subjects.find(s => s.available) || subjects[0];
      setSelectedSubject(firstAvailable.id);
    }
  }, [subjects, selectedSubject]);



  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      'calculator': Calculator,
      'book-open': BookOpen,
      'globe': Globe,
      'atom': Atom,
      'flask-conical': FlaskConical,
      'leaf': Leaf
    };
    return iconMap[iconName] || Calculator;
  };

  const getSubjectDisplayData = (subject: Subject & { enrolledCount: number; mailingListCount: number }) => {
    // Convert database subjects to display format
    const colorMap: { [key: string]: string } = {
      '#3b82f6': 'bg-blue-600 text-white',
      '#10b981': 'bg-emerald-600 text-white', 
      '#8b5cf6': 'bg-violet-600 text-white',
      '#f59e0b': 'bg-amber-500 text-navy-900', // Fizmaster - żółty z ciemnym tekstem
      '#ef4444': 'bg-red-600 text-white',
      '#22c55e': 'bg-green-600 text-white',
      '#1e40af': 'bg-blue-700 text-white', // Matemaster - ciemny niebieski
      '#059669': 'bg-emerald-700 text-white'
    };

    // Use real enrollment data - if available show enrolled students, otherwise show mailing list count
    let students;
    if (subject.available) {
      students = subject.enrolledCount > 0 ? subject.enrolledCount.toString() : "0";
    } else {
      students = subject.mailingListCount > 0 ? `${subject.mailingListCount} zapisanych` : "Wkrótce";
    }
    
    return {
      ...subject,
      icon: getIconComponent(subject.icon),
      color: colorMap[subject.color] || 'bg-gray-600 text-white',
      students
    };
  };

  const roadmapItems = [
    {
      quarter: "Q3 2025",
      status: "current",
      title: "Start Matemaster",
      description: "Matematyka dla egzaminu ósmoklasisty. MVP platformy z dashboardem i gamifikacją.",
      features: ["Landing page", "System logowania", "Dashboard ucznia i tutora", "Podstawowa gamifikacja"]
    },
    {
      quarter: "Q4 2025", 
      status: "planned",
      title: "Polmaster + Rozszerzenia",
      description: "Dodanie języka polskiego i nowych funkcji gamifikacji.",
      features: ["Moduł Polmaster", "Leaderboardy", "Dodatkowe wyzwania", "Raporty dla rodziców"]
    },
    {
      quarter: "Q1 2026",
      status: "planned", 
      title: "Angmaster + Mobilność",
      description: "Język angielski, system płatności i aplikacja mobilna.",
      features: ["Moduł Angmaster", "Panel płatności", "Pakiety wieloprzedmiotowe", "Aplikacja PWA"]
    },
    {
      quarter: "Q2 2026",
      status: "planned",
      title: "Biomaster + Więcej Gamifikacji", 
      description: "Rozszerzenie o biologię z interaktywnymi quizami i zaawansowaną gamifikacją.",
      features: ["Biomaster klasa 8", "Interaktywne quizy", "Powtórki do egzaminu", "Rozbudowane statystyki"]
    },
    {
      quarter: "Q3 2026",
      status: "planned",
      title: "AI + Pełna Integracja",
      description: "System wieloprzedmiotowy z AI asystentem.",
      features: ["Jeden panel dla wszystkich przedmiotów klasy 8", "AI asystent", "Zaawansowane statystyki", "Pełna automatyzacja"]
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Zapisujesz się na przedmiot",
      description: "Wybierasz Matemaster lub inny dostępny przedmiot i rozpoczynasz naukę",
      icon: Target
    },
    {
      number: "02", 
      title: "Dostajesz swojego tutora",
      description: "Przydzielamy Ci doświadczonego korepetytora i gotowe materiały",
      icon: Users
    },
    {
      number: "03",
      title: "Uczysz się modułami",
      description: "Realizujesz strukturyzowany program, robisz zadania i ćwiczenia",
      icon: BookOpen
    },
    {
      number: "04",
      title: "Śledzisz swój postęp",
      description: "Widzisz progress bar, zbierasz XP i odblokujasz nowe osiągnięcia",
      icon: TrendingUp
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie przedmiotów...</p>
        </div>
      </div>
    );
  }

  const displaySubjects = subjects.map(getSubjectDisplayData);
  const selectedSubjectData = displaySubjects.find(s => s.id === selectedSubject);

  return (
    <div className="min-h-screen bg-navy-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <img 
                src={SchoolMasterLogo} 
                alt="SchoolMaster" 
                className="h-8"
              />
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#przedmioty" className="text-navy-700 hover:text-accent transition-colors font-medium">Przedmioty</a>
              <a href="#jak-to-dziala" className="text-navy-700 hover:text-accent transition-colors font-medium">Jak to działa</a>
              <a href="#wyniki" className="text-navy-700 hover:text-accent transition-colors font-medium">Wyniki</a>
              <a href="#roadmapa" className="text-navy-700 hover:text-accent transition-colors font-medium">Roadmapa</a>
              <Button 
                size="sm"
                className="bg-gradient-to-r from-accent to-yellow-500 text-navy-900 hover:from-yellow-400 hover:to-accent font-semibold text-[14px]"
                onClick={() => window.location.href = "/login"}
              >
                Zaloguj się
              </Button>
            </div>
          </div>
        </div>
      </nav>
      {/* Hero Section */}
      <section id="hero" className="bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 text-white py-20 pt-32 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-4 h-4 bg-gradient-to-br from-accent to-yellow-500 rounded-full"></div>
          <div className="absolute top-40 right-20 w-6 h-6 bg-gradient-to-br from-white to-gray-200 rounded-full"></div>
          <div className="absolute bottom-32 left-1/4 w-3 h-3 bg-gradient-to-br from-accent to-yellow-400 rounded-full"></div>
          <div className="absolute top-1/3 right-1/3 w-5 h-5 bg-gradient-to-br from-white to-gray-100 rounded-full"></div>
          <div className="absolute bottom-20 right-10 w-2 h-2 bg-gradient-to-br from-accent to-yellow-600 rounded-full"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold mb-6 leading-tight text-[#ffffff]">
                Platforma 1-na-1 z <span className="bg-gradient-to-r from-accent to-yellow-400 bg-clip-text text-transparent">najlepszymi</span> tutorami w Polsce
              </h1>
              <p className="text-xl mb-8 text-navy-200">
                Gotowe materiały, pełna struktura, widoczny postęp. Uczysz się szybciej i bez chaosu.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-accent via-yellow-400 to-yellow-500 text-navy-900 hover:from-yellow-300 hover:via-accent hover:to-yellow-400 font-bold px-10 py-4 text-lg shadow-xl hover:shadow-2xl hover:scale-110 hover:-translate-y-2 transition-all duration-300 border-0"
                  onClick={() => window.location.href = "/auth"}
                >
                  🚀 Zapisz się na Matemaster
                  <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
                
              </div>
              <div className="flex items-center gap-6 mt-8 text-white">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className="w-5 h-5 text-accent fill-accent drop-shadow-sm" />
                    ))}
                  </div>
                  <span className="font-medium text-white">4.9/5 ocena platformy</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-accent drop-shadow-sm" />
                  <span className="font-medium drop-shadow-sm text-white">2,847+ aktywnych uczniów</span>
                </div>
              </div>
            </div>
            <div className="relative">
              {/* Parallax container with floating XP elements */}
              <div className="relative transform transition-all duration-1000 hover:scale-105 perspective-1000">
                {/* Background layer with depth */}
                <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-yellow-400/10 rounded-3xl blur-3xl transform scale-110 animate-pulse"></div>
                
                {/* Main image container */}
                <div className="relative rounded-2xl overflow-hidden shadow-2xl transform transition-all duration-700 hover:shadow-3xl hover:-translate-y-4 hover:rotate-1">
                  <img 
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1471&q=80"
                    alt="Studenci uczący się razem"
                    className="w-full h-96 object-cover transform transition-transform duration-1000 hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-900/80 via-navy-900/20 to-transparent"></div>
                  
                  {/* Combined XP container with level, XP, and progress bar */}
                  <div className="absolute bottom-8 right-8 left-16 transform transition-all duration-800 hover:translate-y-1 hover:scale-[1.02] rotate-1">
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-accent/20 max-w-80 ml-auto">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-accent to-yellow-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                            <Star className="w-6 h-6 text-navy-900" />
                          </div>
                          <div>
                            <div className="text-xl font-bold text-navy-900">Poziom 15</div>
                            <div className="text-sm text-navy-600 font-medium">Matemaster - Algebra</div>
                          </div>
                        </div>
                        <div className="text-right group-hover:scale-105 transition-transform duration-300">
                          <div className="text-2xl font-bold text-navy-900 group-hover:text-accent transition-colors duration-300">
                            <span className="group-hover:hidden">2,450</span>
                            <span className="hidden group-hover:inline animate-pulse">2,475</span>
                          </div>
                          <div className="text-sm text-navy-600 font-medium group-hover:text-accent/80 transition-colors duration-300">
                            <span className="group-hover:hidden">XP</span>
                            <span className="hidden group-hover:inline">+25 XP!</span>
                          </div>
                        </div>
                      </div>
                      <div className="relative h-4 w-full overflow-hidden rounded-full bg-navy-100 border border-navy-200 hover:border-accent/40 transition-colors duration-300 cursor-pointer">
                        <div 
                          className="h-full bg-gradient-to-r from-accent via-yellow-400 to-yellow-500 rounded-full shadow-inner transition-all duration-300 hover:shadow-lg"
                          style={{ width: '87%' }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-navy-500 mt-2">
                        <span className="text-navy-600">2,100 XP</span>
                        <span className="font-medium text-navy-600">350 XP do poziomu 16</span>
                        <span className="text-navy-600">2,800 XP</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating decoration elements */}
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-br from-accent/30 to-yellow-400/40 rounded-full hover:scale-110 hover:from-accent/50 hover:to-yellow-400/60 transition-all duration-300"></div>
                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-gradient-to-br from-yellow-400/40 to-accent/30 rounded-full hover:scale-110 hover:from-yellow-400/60 hover:to-accent/50 transition-all duration-300"></div>
                <div className="absolute top-1/2 -left-8 w-4 h-4 bg-gradient-to-br from-white/20 to-gray-200/30 rounded-full hover:scale-125 hover:from-white/30 hover:to-gray-200/40 transition-all duration-300"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Subjects Section */}
      <section id="przedmioty" className="py-20 bg-gradient-to-br from-white via-gray-50 to-white relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-accent/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-navy-900/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6 text-navy-900">
              Wybierz swój przedmiot
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Każdy moduł to kompletny program nauki z dedykowanym tutorem i interaktywnymi materiałami
            </p>
          </div>
          
          {/* Pyramid layout - Available subject on top, unavailable below */}
          <div className="space-y-8">
            {/* Top level - Available subject (Matemaster) */}
            <div className="flex justify-center">
              {displaySubjects.filter(subject => subject.available).map((subject) => {
                const IconComponent = subject.icon;
                return (
                  <Card key={subject.id} data-testid={`card-subject-${subject.id}`} className="bg-white border-2 border-gray-100 cursor-pointer shadow-2xl hover:shadow-3xl hover:scale-[1.02] hover:-translate-y-2 transition-all duration-300 group max-w-2xl w-full">
                    <CardHeader className="pb-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-20 h-20 rounded-2xl ${subject.color} flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                          <IconComponent className="w-10 h-10 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg px-4 py-1 text-sm font-bold">✨ Dostępne teraz</Badge>
                      </div>
                      <CardTitle className="text-3xl text-navy-900 font-extrabold">{subject.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <p className="text-gray-700 text-lg leading-relaxed">{subject.description}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-navy-50 rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6 text-navy-700" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-navy-900">{subject.students}</div>
                            <div className="text-sm text-gray-500">aktywnych uczniów</div>
                          </div>
                        </div>
                        <Button 
                          size="lg"
                          data-testid="button-enroll"
                          className="bg-gradient-to-r from-navy-900 to-navy-800 text-white hover:from-navy-800 hover:to-navy-700 shadow-2xl hover:shadow-3xl hover:scale-110 hover:-translate-y-1 transition-all duration-300 font-bold px-10 py-6 text-lg"
                          onClick={() => window.location.href = "/auth"}
                        >
                          Zapisz się teraz
                          <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Bottom level - Unavailable subjects in grid */}
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {displaySubjects.filter(subject => !subject.available).map((subject) => {
                const IconComponent = subject.icon;
                return (
                  <Card key={subject.id} data-testid={`card-subject-${subject.id}`} className="bg-white border-2 border-gray-100 cursor-pointer shadow-lg hover:shadow-2xl hover:scale-[1.03] hover:-translate-y-1 transition-all duration-300 group">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-16 h-16 rounded-2xl ${subject.color} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                          <IconComponent className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <Badge className="bg-gradient-to-r from-accent to-yellow-500 text-navy-900 shadow-md px-3 py-1 font-bold">🚀 Wkrótce</Badge>
                      </div>
                      <CardTitle className="text-2xl text-navy-900 font-bold">{subject.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-600 leading-relaxed">{subject.description}</p>
                      <div className="flex items-center justify-between pt-3">
                        <div className="text-sm text-gray-500 font-medium flex items-center gap-2">
                          <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                          Przygotowujemy materiały
                        </div>
                        <MailingListModal subjectId={subject.id} subjectName={subject.name}>
                          <Button className="bg-gradient-to-r from-accent to-yellow-500 text-navy-900 hover:from-yellow-400 hover:to-accent shadow-lg font-bold hover:scale-105 hover:-translate-y-0.5 transition-all duration-300 px-6">
                            Powiadom mnie
                          </Button>
                        </MailingListModal>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>
      {/* How it works */}
      <section id="jak-to-dziala" className="py-20 bg-white relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-navy-900/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent/5 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6 text-navy-900">
              Jak to działa?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Prosty proces, który prowadzi Cię do sukcesu na egzaminach
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <Card key={index} data-testid={`card-step-${index + 1}`} className="text-center group border-2 border-gray-100 hover:border-accent/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 bg-white">
                  <CardContent className="p-8">
                    <div className="relative mb-6">
                      <div className="w-24 h-24 bg-gradient-to-br from-navy-50 to-navy-100 rounded-3xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-2xl transition-all duration-300">
                        <IconComponent className="w-12 h-12 text-navy-900 group-hover:scale-125 transition-all duration-300" />
                      </div>
                      <div data-testid={`badge-step-number-${index + 1}`} className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-accent to-yellow-500 rounded-2xl flex items-center justify-center text-navy-900 font-bold text-xl shadow-xl group-hover:scale-125 group-hover:-translate-y-1 group-hover:rotate-12 transition-all duration-300">
                        {step.number}
                      </div>
                    </div>
                    <h3 data-testid={`text-step-title-${index + 1}`} className="text-xl font-bold mb-3 text-navy-900">{step.title}</h3>
                    <p data-testid={`text-step-description-${index + 1}`} className="text-gray-600 leading-relaxed">{step.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
      {/* Animated Stats Section */}
      <section id="wyniki" className="py-20 bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-navy-900/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6 text-navy-900">
              Nasze wyniki mówią same za siebie
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tysiące uczniów już poprawiło swoje oceny dzięki naszej platformie
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { number: '2847', suffix: '', label: 'Aktywnych uczniów', icon: Users, color: 'from-accent to-yellow-500' },
              { number: '94', suffix: '%', label: 'Poprawa ocen', icon: TrendingUp, color: 'from-emerald-400 to-emerald-600' },
              { number: '15', suffix: 'k+', label: 'Wykonanych zadań', icon: Target, color: 'from-navy-600 to-navy-800' },
              { number: '4.9', suffix: '/5', label: 'Ocena platformy', icon: Star, color: 'from-accent to-yellow-500' }
            ].map((stat, index) => {
              const IconComponent = stat.icon;
              const statId = stat.label.toLowerCase().replace(/\s+/g, '-');
              return (
                <Card key={index} data-testid={`card-stat-${statId}`} className="text-center group border-2 border-gray-100 hover:border-accent/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 bg-white">
                  <CardContent className="p-8">
                    <AnimatedStat
                      number={stat.number}
                      suffix={stat.suffix}
                      label={stat.label}
                      icon={IconComponent}
                      color={stat.color}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
      {/* Dashboard Preview for Students */}
      <section className="py-16 bg-navy-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-white">
                Twój postęp wreszcie jest widoczny
              </h2>
              <p className="text-lg text-navy-200 mb-6">
                Na panelu ucznia po lewej stronie widzisz wszystkie swoje przedmioty. 
                Możesz jednim kliknięciem zapisać się na kolejne – wszystkie materiały 
                i lekcje są w jednym miejscu.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  <span className="text-navy-200">System XP i poziomów motywuje do nauki</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  <span className="text-navy-200">Odblokuj nowe tematy i osiągnięcia</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  <span className="text-navy-200">Śledź postęp w wielu przedmiotach jednocześnie</span>
                </div>
              </div>
            </div>
            <div className="relative">
              {/* Dashboard Screenshot/Mock */}
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
                <div className="bg-gradient-to-r from-navy-900 to-navy-700 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calculator className="w-6 h-6 text-accent" />
                      <span className="text-white font-semibold">SchoolMaster Dashboard</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Poziom 7 - Ekspert</Badge>
                  </div>
                </div>
                <div className="flex">
                  {/* Left sidebar */}
                  <div className="w-1/3 bg-gray-50 p-6 border-r">
                    <h4 className="font-bold text-navy-900 mb-4">Moje przedmioty</h4>
                    <div className="space-y-3">
                      <div className="bg-gradient-to-r from-navy-900 to-navy-700 text-white p-3 rounded-lg shadow-md">
                        <div className="flex items-center gap-2">
                          <Calculator className="w-4 h-4" />
                          <span className="font-medium">Matemaster</span>
                        </div>
                        <div className="text-xs mt-1">78% ukończone</div>
                      </div>
                      <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-3 rounded-lg shadow-md opacity-75">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          <span className="font-medium">Polmaster</span>
                        </div>
                        <div className="text-xs text-green-100 mt-1">Wkrótce</div>
                      </div>
                      <div className="border-2 border-dashed border-gray-300 p-3 rounded-lg text-center text-gray-500 hover:border-accent hover:text-accent transition-colors cursor-pointer">
                        <Plus className="w-4 h-4 mx-auto mb-1" />
                        <span className="text-sm font-medium">Dodaj przedmiot</span>
                      </div>
                    </div>
                  </div>
                  {/* Main dashboard content */}
                  <div className="flex-1 p-6">
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="text-xl font-bold text-navy-900">Twój postęp dzisiaj</h5>
                        <div className="flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-navy-700" />
                          <span className="font-bold text-navy-900 text-lg">+240 XP</span>
                        </div>
                      </div>
                      
                      {/* Progress bars */}
                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium text-navy-700">Algebra - Równania</span>
                            <span className="font-bold text-navy-900">78%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div className="bg-gradient-to-r from-red-600 to-red-700 h-3 rounded-full shadow-sm" style={{width: '78%'}}></div>
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium text-navy-700">Geometria - Figury</span>
                            <span className="font-bold text-navy-900">65%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div className="bg-gradient-to-r from-accent to-yellow-500 h-3 rounded-full shadow-sm" style={{width: '65%'}}></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Achievement badges */}
                      <div className="mt-6">
                        <h6 className="font-semibold text-navy-900 mb-3">Ostatnie osiągnięcia</h6>
                        <div className="flex gap-2">
                          {[1,2,3,4,5].map(i => (
                            <div key={i} className="w-10 h-10 bg-gradient-to-br from-accent to-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                              <Trophy className="w-5 h-5 text-navy-900" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Benefits for Parents */}
      <section className="py-16 bg-navy-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Korzyści dla rodziców
            </h2>
            <p className="text-lg text-white">
              Przejrzystość i raporty postępu
            </p>
          </div>
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold text-navy-900 mb-4">
                    "Rodzice widzą raporty postępu i wiedzą, że dziecko naprawdę pracuje"
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <BarChart3 className="w-5 h-5 text-navy-900 mt-1" />
                      <span className="text-navy-700">Cotygodniowe raporty postępu</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Target className="w-5 h-5 text-navy-900 mt-1" />
                      <span className="text-navy-700">Jasne cele i osiągnięcia</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-5 h-5 text-navy-900 mt-1" />
                      <span className="text-navy-700">Widoczny wzrost umiejętności</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h4 className="font-semibold mb-4 text-navy-900">Raport tygodniowy - Anna Kowalska</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-navy-600">Czas nauki</span>
                      <span className="font-semibold text-navy-900">4h 30min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-navy-600">Ukończone lekcje</span>
                      <span className="font-semibold text-navy-900">8/10</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-navy-600">Zdobyte punkty</span>
                      <span className="font-semibold text-green-600">+1,240 XP</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      {/* Benefits for Tutors */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy-900 mb-4">
              Korzyści dla tutorów
            </h2>
            <p className="text-lg text-navy-600">
              Prosty system, gotowe materiały
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6 text-center">
                <BookOpen className="w-12 h-12 text-navy-900 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-navy-900">Gotowe materiały</h3>
                <p className="text-navy-600">
                  Nie musisz tworzyć materiałów - wszystko jest przygotowane
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 text-navy-900 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-navy-900">Stali uczniowie</h3>
                <p className="text-navy-600">
                  Nie szukasz klientów - dostarczamy Ci uczniów gotowych do nauki
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-12 h-12 text-navy-900 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-navy-900">Wyższe zarobki</h3>
                <p className="text-navy-600">
                  Skupiasz się na uczeniu - zarabiasz więcej w krótszym czasie
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      {/* Roadmap Timeline */}
      <section id="roadmapa" className="py-20 bg-white relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-navy-900/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-navy-900 mb-6">
              Roadmapa rozwoju
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Zobacz, co planujemy w kolejnych miesiącach
            </p>
          </div>
          <div className="space-y-6">
            {roadmapItems.map((item, index) => (
              <div key={index} data-testid={`roadmap-item-${index + 1}`} className="flex gap-6 items-start group">
                <div className="flex-shrink-0">
                  <div data-testid={`badge-quarter-${item.quarter.replace(' ', '-')}`} className={`w-24 h-24 rounded-3xl flex flex-col items-center justify-center font-bold shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ${
                    item.status === 'current' 
                      ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white' 
                      : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700'
                  }`}>
                    <span className="text-sm">{item.quarter.split(' ')[0]}</span>
                    <span className="text-lg font-extrabold">{item.quarter.split(' ')[1]}</span>
                  </div>
                </div>
                <Card className="flex-1 border-2 border-gray-100 hover:border-accent/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 bg-white">
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 data-testid={`text-roadmap-title-${index + 1}`} className="text-2xl font-extrabold text-navy-900 mb-3">{item.title}</h3>
                        <p data-testid={`text-roadmap-description-${index + 1}`} className="text-gray-600 text-lg leading-relaxed mb-6">{item.description}</p>
                      </div>
                      {item.status === 'current' && (
                        <Badge data-testid="badge-current-roadmap" className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg px-4 py-1 font-bold">
                          ✨ Aktualnie
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {item.features.map((feature, fIndex) => (
                        <Badge key={fIndex} data-testid={`badge-feature-${index + 1}-${fIndex + 1}`} variant="outline" className="text-sm px-4 py-1.5 border-2 hover:bg-navy-50 transition-colors">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-16 bg-navy-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6 text-white">
            Gotowy na strukturyzowaną naukę?
          </h2>
          <p className="text-xl text-navy-200 mb-8">
            Dołącz do tysięcy uczniów, którzy już korzystają z naszej platformy
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img 
                src={SchoolMasterLogo} 
                alt="SchoolMaster" 
                className="h-8"
              />
            </div>
            <div className="text-sm text-navy-600">
              © 2025 SchoolMaster. Wszystkie prawa zastrzeżone.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}