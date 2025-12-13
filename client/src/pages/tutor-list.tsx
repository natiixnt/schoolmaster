import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, UserCheck, Star, DollarSign, Calendar, ArrowLeft, Eye, CheckCircle, XCircle } from "lucide-react";

export default function TutorList() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: tutors, isLoading } = useQuery({
    queryKey: ["/api/admin/tutors-detailed"],
    queryFn: () => fetch('/api/admin/tutors-detailed', { credentials: 'include' }).then(res => {
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    }),
    retry: false,
  });

  const filteredTutors = Array.isArray(tutors) ? tutors.filter((tutor: any) =>
    `${tutor.firstName} ${tutor.lastName} ${tutor.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  ) : [];

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600";
    if (rating >= 4.0) return "text-blue-600";
    if (rating >= 3.5) return "text-yellow-600";
    return "text-gray-600";
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
              <h1 className="text-xl font-semibold text-navy-900">Lista korepetytorów</h1>
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
                  placeholder="Szukaj korepetytorów po imieniu, nazwisku lub emailu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <UserCheck className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-700">{filteredTutors.length}</div>
                    <div className="text-sm text-purple-600 font-medium">Korepetytorów</div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-700">
                      {filteredTutors.filter((t: any) => t.tutorProfile?.isVerified).length}
                    </div>
                    <div className="text-sm text-green-600 font-medium">Zweryfikowani</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tutors Grid */}
        {filteredTutors.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? "Nie znaleziono korepetytorów" : "Brak zarejestrowanych korepetytorów"}
              </h3>
              <p className="text-gray-600">
                {searchTerm ? "Spróbuj zmienić kryteria wyszukiwania" : "Korepetytorzy pojawią się tutaj po rejestracji"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutors.map((tutor: any) => (
              <Card key={tutor.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={tutor.profileImageUrl} />
                        <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold">
                          {getInitials(tutor.firstName, tutor.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-navy-900">
                            {tutor.firstName} {tutor.lastName}
                          </h3>
                          {tutor.tutorProfile?.isVerified && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{tutor.email}</p>
                      </div>
                    </div>
                    <Badge variant={tutor.isActive ? "default" : "secondary"} className="text-xs">
                      {tutor.isActive ? "Aktywny" : "Nieaktywny"}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Rating and Rate */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        {getRatingStars(tutor.tutorProfile?.rating || 0)}
                      </div>
                      <div className={`text-lg font-bold ${getRatingColor(tutor.tutorProfile?.rating || 0)}`}>
                        {tutor.tutorProfile?.rating?.toFixed(1) || '0.0'}
                      </div>
                      <div className="text-xs text-yellow-600 font-medium">Ocena</div>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                      <div className="flex items-center justify-center mb-1">
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="text-lg font-bold text-green-700">
                        {tutor.tutorProfile?.hourlyRate || 0} zł
                      </div>
                      <div className="text-xs text-green-600 font-medium">za godz.</div>
                    </div>
                  </div>

                  {/* Lessons Count */}
                  <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <div className="text-lg font-bold text-blue-700">
                      {tutor.tutorProfile?.totalLessons || 0}
                    </div>
                    <div className="text-xs text-blue-600 font-medium">Przeprowadzonych lekcji</div>
                  </div>

                  {/* Bio Preview */}
                  {tutor.tutorProfile?.bio && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {tutor.tutorProfile.bio}
                      </p>
                    </div>
                  )}

                  {/* Specializations */}
                  {tutor.tutorProfile?.specializations && tutor.tutorProfile.specializations.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tutor.tutorProfile.specializations.slice(0, 3).map((spec: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                      {tutor.tutorProfile.specializations.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{tutor.tutorProfile.specializations.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Join Date */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Dołączył: {new Date(tutor.createdAt).toLocaleDateString('pl-PL')}</span>
                  </div>

                  {/* Action Button */}
                  <Link href={`/tutor-dashboard?demo=true&tutorId=${tutor.id}`}>
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