import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, GraduationCap, Star, TrendingUp, Calendar, ArrowLeft, Eye } from "lucide-react";

export default function StudentList() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: students, isLoading } = useQuery({
    queryKey: ["/api/admin/students"],
    queryFn: () => fetch('/api/admin/students', { credentials: 'include' }).then(res => {
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    }),
    retry: false,
  });

  const filteredStudents = Array.isArray(students) ? students.filter((student: any) =>
    `${student.firstName} ${student.lastName} ${student.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  ) : [];

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getLevelBadgeColor = (level: number) => {
    if (level >= 20) return "bg-gradient-to-r from-purple-500 to-pink-500";
    if (level >= 15) return "bg-gradient-to-r from-blue-500 to-purple-500";
    if (level >= 10) return "bg-gradient-to-r from-green-500 to-blue-500";
    if (level >= 5) return "bg-gradient-to-r from-yellow-500 to-green-500";
    return "bg-gradient-to-r from-gray-400 to-gray-500";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin-dashboard">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Panel administratora
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-semibold text-navy-900">Lista uczniów</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Stats */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Szukaj uczniów po imieniu, nazwisku lub emailu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <GraduationCap className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-700">{filteredStudents.length}</div>
                    <div className="text-sm text-blue-600 font-medium">Uczniów</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Students Grid */}
        {filteredStudents.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? "Nie znaleziono uczniów" : "Brak zarejestrowanych uczniów"}
              </h3>
              <p className="text-gray-600">
                {searchTerm ? "Spróbuj zmienić kryteria wyszukiwania" : "Uczniowie pojawią się tutaj po rejestracji"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student: any) => (
              <Card key={student.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-navy-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={student.profileImageUrl} />
                        <AvatarFallback className="bg-navy-100 text-navy-700 font-semibold">
                          {getInitials(student.firstName, student.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-navy-900">
                          {student.firstName} {student.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">{student.email}</p>
                      </div>
                    </div>
                    <Badge variant={student.isActive ? "default" : "secondary"} className="text-xs">
                      {student.isActive ? "Aktywny" : "Nieaktywny"}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Progress Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold mb-1 ${getLevelBadgeColor(student.studentProfile?.level || 1)}`}>
                        {student.studentProfile?.level || 1}
                      </div>
                      <div className="text-xs text-yellow-700 font-medium">Poziom</div>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                      <div className="text-lg font-bold text-green-700">{student.studentProfile?.xp || 0}</div>
                      <div className="text-xs text-green-600 font-medium">XP</div>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                      <div className="text-lg font-bold text-blue-700">{student.studentProfile?.totalLessons || 0}</div>
                      <div className="text-xs text-blue-600 font-medium">Lekcje</div>
                    </div>
                  </div>

                  {/* Activity Indicator */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Dołączył: {new Date(student.createdAt).toLocaleDateString('pl-PL')}</span>
                    </div>
                    {student.studentProfile?.streak > 0 && (
                      <div className="flex items-center gap-1 text-orange-600">
                        <TrendingUp className="w-4 h-4" />
                        <span className="font-medium">{student.studentProfile.streak} dni</span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <Link href={`/student-dashboard?demo=true&studentId=${student.id}`}>
                    <Button className="w-full bg-navy-900 hover:bg-navy-800 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Podgląd dashboardu
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}