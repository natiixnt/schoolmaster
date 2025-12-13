import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Search, Download, Eye, FileText, Video, Calculator, PieChart, Triangle, BarChart3 } from "lucide-react";

interface CourseLesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  content: string;
  order: number;
  duration: number;
  videoUrl?: string;
  exerciseCount: number;
  isActive: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  mathTopicId: string;
  difficultyLevel: string;
  duration: number;
  price: string;
  isActive: boolean;
  order: number;
  lessons: CourseLesson[];
}

export default function TutorMaterials() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");

  // Mock course data for demo
  const mockCourses: Course[] = [
    {
      id: "1",
      title: "Algebra podstawowa",
      description: "Podstawy algebry dla uczniów klas 7-8",
      mathTopicId: "1",
      difficultyLevel: "podstawowy",
      duration: 240,
      price: "400.00",
      isActive: true,
      order: 1,
      lessons: [
        {
          id: "1-1",
          courseId: "1",
          title: "Wprowadzenie do równań liniowych",
          description: "Podstawowe pojęcia dotyczące równań liniowych",
          content: `
# Równania liniowe - podstawy

## Definicja
Równanie liniowe to równanie postaci: **ax + b = 0**, gdzie:
- a, b to liczby rzeczywiste (a ≠ 0)
- x to niewiadoma

## Przykłady:
1. 2x + 5 = 0
2. -3x + 7 = 0
3. x - 4 = 0

## Rozwiązywanie:
Aby rozwiązać równanie ax + b = 0:
1. Przenieś b na prawą stronę: ax = -b
2. Podziel obie strony przez a: x = -b/a

## Ćwiczenia:
1. Rozwiąż: 3x + 9 = 0
2. Rozwiąż: -2x + 10 = 0
3. Rozwiąż: x + 7 = 0
          `,
          order: 1,
          duration: 45,
          videoUrl: "https://example.com/video1",
          exerciseCount: 15,
          isActive: true,
        },
        {
          id: "1-2",
          courseId: "1", 
          title: "Układy równań liniowych",
          description: "Metody rozwiązywania układów równań",
          content: `
# Układy równań liniowych

## Definicja
Układ równań liniowych składa się z dwóch lub więcej równań z tymi samymi niewiadomymi.

## Przykład układu dwóch równań z dwiema niewiadomymi:
\`\`\`
2x + 3y = 7
x - y = 1
\`\`\`

## Metody rozwiązywania:

### 1. Metoda podstawiania
1. Z jednego równania wyznacz jedną niewiadomą
2. Podstaw do drugiego równania
3. Rozwiąż równanie z jedną niewiadomą
4. Oblicz drugą niewiadomą

### 2. Metoda przeciwnych współczynników
1. Pomnóż równania tak, aby współczynniki przy jednej niewiadomej były przeciwne
2. Dodaj równania stronami
3. Rozwiąż powstałe równanie
4. Oblicz drugą niewiadomą

## Przykład:
Rozwiąż układ:
\`\`\`
2x + y = 5
x - y = 1
\`\`\`

Dodając równania: 3x = 6, więc x = 2
Podstawiając: 2 - y = 1, więc y = 1

Rozwiązanie: x = 2, y = 1
          `,
          order: 2,
          duration: 60,
          exerciseCount: 20,
          isActive: true,
        },
      ],
    },
    {
      id: "2",
      title: "Funkcje kwadratowe",
      description: "Analiza i właściwości funkcji kwadratowych",
      mathTopicId: "2", 
      difficultyLevel: "podstawowy",
      duration: 180,
      price: "350.00",
      isActive: true,
      order: 2,
      lessons: [
        {
          id: "2-1",
          courseId: "2",
          title: "Postać ogólna funkcji kwadratowej",
          description: "f(x) = ax² + bx + c i jej właściwości",
          content: `
# Funkcja kwadratowa - postać ogólna

## Definicja
Funkcja kwadratowa ma postać: **f(x) = ax² + bx + c**, gdzie:
- a ≠ 0 (współczynnik przy x²)
- b, c to liczby rzeczywiste

## Wykres
Wykresem funkcji kwadratowej jest parabola:
- Jeśli a > 0, parabola ma ramiona skierowane w górę
- Jeśli a < 0, parabola ma ramiona skierowane w dół

## Wierzchołek paraboli
Współrzędne wierzchołka:
- x_w = -b/(2a)
- y_w = f(x_w) = c - b²/(4a)

## Oś symetrii
Prosta x = -b/(2a)

## Przykład:
f(x) = x² - 4x + 3
- a = 1, b = -4, c = 3
- x_w = -(-4)/(2·1) = 2
- y_w = 2² - 4·2 + 3 = -1
- Wierzchołek: (2, -1)
          `,
          order: 1,
          duration: 50,
          exerciseCount: 12,
          isActive: true,
        },
      ],
    },
    {
      id: "3",
      title: "Geometria płaska",
      description: "Podstawy geometrii płaskiej - figury i ich właściwości",
      mathTopicId: "3",
      difficultyLevel: "podstawowy",
      duration: 200, 
      price: "380.00",
      isActive: true,
      order: 3,
      lessons: [
        {
          id: "3-1",
          courseId: "3",
          title: "Trójkąty - podstawowe właściwości",
          description: "Rodzaje trójkątów i ich właściwości",
          content: `
# Trójkąty - podstawy

## Definicja
Trójkąt to figura płaska składająca się z trzech odcinków łączących trzy punkty nieleżące na jednej prostej.

## Rodzaje trójkątów ze względu na boki:
1. **Równoboczny** - wszystkie boki równe
2. **Równoramienny** - dwa boki równe  
3. **Różnoboczny** - wszystkie boki różne

## Rodzaje trójkątów ze względu na kąty:
1. **Ostrokątny** - wszystkie kąty ostre (< 90°)
2. **Prostokątny** - jeden kąt prosty (= 90°)
3. **Rozwartokątny** - jeden kąt rozwarty (> 90°)

## Właściwości:
- Suma kątów w trójkącie = 180°
- Każdy bok jest mniejszy od sumy dwóch pozostałych
- W trójkącie równobocznym wszystkie kąty = 60°
- W trójkącie równoramiennym kąty przy podstawie są równe

## Pola trójkątów:
- Ogólny wzór: P = (1/2) · a · h
- Trójkąt prostokątny: P = (1/2) · a · b
- Wzór Herona: P = √[s(s-a)(s-b)(s-c)], gdzie s = (a+b+c)/2
          `,
          order: 1,
          duration: 45,
          exerciseCount: 18,
          isActive: true,
        },
      ],
    },
  ];

  const filteredCourses = mockCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = selectedDifficulty === "all" || course.difficultyLevel === selectedDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  const getDifficultyBadge = (level: string) => {
    switch (level) {
      case "podstawowy":
        return <Badge className="bg-green-100 text-green-800">Podstawowy</Badge>;
      default:
        return <Badge variant="secondary">{level}</Badge>;
    }
  };

  const getTopicIcon = (topicId: string) => {
    switch (topicId) {
      case "1":
        return <Calculator className="w-5 h-5 text-blue-600" />;
      case "2":
        return <BarChart3 className="w-5 h-5 text-green-600" />;
      case "3":
        return <Triangle className="w-5 h-5 text-purple-600" />;
      default:
        return <BookOpen className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Materiały kursowe
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Szukaj kursów i materiałów..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Button
                variant={selectedDifficulty === "all" ? "default" : "outline"}
                onClick={() => setSelectedDifficulty("all")}
                size="sm"
              >
                Wszystkie
              </Button>
            </div>
            <div>
              <Button
                variant={selectedDifficulty === "podstawowy" ? "default" : "outline"}
                onClick={() => setSelectedDifficulty("podstawowy")}
                size="sm"
              >
                Podstawowy
              </Button>
            </div>

          </div>

          {/* Courses list */}
          <div className="space-y-4">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gray-100 rounded-lg">
                      {getTopicIcon(course.mathTopicId)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-semibold text-navy-900">
                          {course.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          {getDifficultyBadge(course.difficultyLevel)}
                          <Badge variant="outline">{course.lessons.length} lekcji</Badge>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-4">{course.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <span>Czas trwania: {course.duration} min</span>
                        <span>•</span>
                        <span>Cena: {parseFloat(course.price).toFixed(0)} zł</span>
                      </div>

                      {/* Course lessons */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-navy-900 mb-2">Lekcje w kursie:</h4>
                        {course.lessons.map((lesson) => (
                          <div key={lesson.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-navy-100 rounded-full flex items-center justify-center text-navy-800 text-sm font-medium">
                                {lesson.order}
                              </div>
                              <div>
                                <h5 className="font-medium text-navy-900">{lesson.title}</h5>
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                  <span>{lesson.duration} min</span>
                                  <span>•</span>
                                  <span>{lesson.exerciseCount} ćwiczeń</span>
                                  {lesson.videoUrl && (
                                    <>
                                      <span>•</span>
                                      <div className="flex items-center gap-1">
                                        <Video className="w-3 h-3" />
                                        <span>Wideo</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-1" />
                                Podgląd
                              </Button>
                              <Button variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-1" />
                                Pobierz
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium mb-2">Brak materiałów</p>
              <p className="text-sm">Nie znaleziono kursów spełniających kryteria wyszukiwania.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}