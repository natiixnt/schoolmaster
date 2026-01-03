import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Target, Clock, Star, BookOpen, User, Search, Filter, X, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import BookingModal from "@/components/tutor/booking-modal";

interface SimpleTutor {
  id: string;
  firstName: string;
  lastName: string;
  rating?: number;
  totalLessons?: number;
  bio?: string;
  hasAvailability?: boolean;
  tutorProfile?: {
    rating?: string;
    totalLessons?: number;
    hourlyRate?: string;
    bio?: string;
    specializations?: string[];
  };
}

export default function FindTutorSimple() {
  const [showTutorModal, setShowTutorModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<SimpleTutor | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available tutors
  const { data: tutors = [], isLoading: tutorsLoading } = useQuery({
    queryKey: ["/api/student/available-tutors"],
  });

  // Fetch next bookable topic
  const { data: nextTopic, isLoading: topicLoading } = useQuery({
    queryKey: ["/api/student/next-bookable-topic"],
  });

  // Fetch user balance
  const { data: balanceData } = useQuery({
    queryKey: ["/api/balance"],
  });
  const balance = (balanceData as any)?.balance ? parseFloat((balanceData as any).balance) : 0;

  // Filter and search tutors
  const filteredTutors = (tutors as any[])
    .filter((tutor: any) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const fullName = `${tutor.firstName} ${tutor.lastName}`.toLowerCase();
        const bio = (tutor.tutorProfile?.bio || "").toLowerCase();
        const specializations = (tutor.tutorProfile?.specializations || []).join(" ").toLowerCase();
        
        if (!fullName.includes(query) && !bio.includes(query) && !specializations.includes(query)) {
          return false;
        }
      }
      
      // Rating filter
      if (ratingFilter !== "all") {
        const rating = parseFloat(tutor.tutorProfile?.rating || '0');
        if (ratingFilter === "4+" && rating < 4) return false;
        if (ratingFilter === "4.5+" && rating < 4.5) return false;
      }
      
      // Experience filter
      if (experienceFilter !== "all") {
        const lessons = tutor.tutorProfile?.totalLessons || 0;
        if (experienceFilter === "experienced" && lessons < 50) return false;
        if (experienceFilter === "expert" && lessons < 100) return false;
        if (experienceFilter === "new" && lessons > 10) return false;
      }
      
      // Featured filter
      if (featuredFilter !== "all") {
        const isFeatured = tutor.tutorProfile?.isFeatured || false;
        if (featuredFilter === "featured" && !isFeatured) return false;
        if (featuredFilter === "regular" && isFeatured) return false;
      }
      
      return true;
    })
    .sort((a: any, b: any) => {
      // Featured tutors first
      const aFeatured = a.tutorProfile?.isFeatured || false;
      const bFeatured = b.tutorProfile?.isFeatured || false;
      if (aFeatured !== bFeatured) return bFeatured ? 1 : -1;
      
      // Then by rating
      const ratingDiff = (parseFloat(b.tutorProfile?.rating || '4.0') - parseFloat(a.tutorProfile?.rating || '4.0'));
      if (ratingDiff !== 0) return ratingDiff;
      
      // Finally by experience
      return (b.tutorProfile?.totalLessons || 0) - (a.tutorProfile?.totalLessons || 0);
    });

  // Separate featured and regular tutors
  const featuredTutors = filteredTutors.filter((tutor: any) => tutor.tutorProfile?.isFeatured);
  const regularTutors = filteredTutors.filter((tutor: any) => !tutor.tutorProfile?.isFeatured);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setRatingFilter("all");
    setExperienceFilter("all");
    setFeaturedFilter("all");
  };

  // Check if any filters are active
  const hasActiveFilters = searchQuery || ratingFilter !== "all" || experienceFilter !== "all" || featuredFilter !== "all";

  // Handle tutor selection from modal
  const handleTutorSelect = (tutor: SimpleTutor) => {
    setSelectedTutor(tutor);
    setShowTutorModal(false);
    setShowBookingModal(true);
  };

  // Handle actual lesson booking with selected tutor
  const handleBookLesson = async (tutorId: string, timeSlot: string, paymentMethod: 'balance' | 'stripe', specialNeeds?: string) => {
    try {
      // Convert timeSlot to ISO string for the backend
      const isoTimeSlot = new Date(timeSlot).toISOString();
      
      console.log('Booking lesson with auto-selected topic:', {
        tutorId,
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
        title: "Zaproszenie wysłane",
        description: "Zaproszenie zostało wysłane do korepetytora. Otrzymasz powiadomienie gdy korepetytor potwierdzi termin.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student/lessons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student/lesson-invitations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student/topic-progression"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student/next-topic"] });
      
      setShowBookingModal(false);
      setSelectedTutor(null);
    } catch (error: any) {
      toast({
        title: "Błąd rezerwacji",
        description: error?.message || "Nie udało się zarezerwować lekcji.",
        variant: "destructive",
      });
    }
  };

  if (tutorsLoading || topicLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-navy-900 mb-2">Wybierz korepetytora</h1>
          {nextTopic && (
            <div data-testid="card-next-topic" className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 max-w-full sm:max-w-3xl mx-auto shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm text-blue-600 font-medium mb-1">Następny temat do nauki</p>
                  <p data-testid="text-topic-name" className="text-lg text-blue-900 font-bold mb-2">
                    {String((nextTopic as any).id || (nextTopic as any).topicId)} - {String((nextTopic as any).name || (nextTopic as any).topicName)}
                  </p>
                  <p data-testid="text-invitation-info" className="text-sm text-blue-700">
                    💡 Wybierz korepetytora i wyślij zaproszenie na lekcję. Korepetytor potwierdzi termin w ciągu 48h.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search and Filter Bar */}
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Szukaj korepetytora po imieniu, nazwisku lub specjalizacji..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtry
              {hasActiveFilters && (
                <div className="w-2 h-2 bg-accent rounded-full"></div>
              )}
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <Card className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Ocena</label>
                  <Select value={ratingFilter} onValueChange={setRatingFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Wszystkie oceny</SelectItem>
                      <SelectItem value="4+">4+ gwiazdek</SelectItem>
                      <SelectItem value="4.5+">4.5+ gwiazdek</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Doświadczenie</label>
                  <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Wszystkie poziomy</SelectItem>
                      <SelectItem value="new">Początkujący (≤10 lekcji)</SelectItem>
                      <SelectItem value="experienced">Doświadczeni (50+ lekcji)</SelectItem>
                      <SelectItem value="expert">Eksperci (100+ lekcji)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                  <Select value={featuredFilter} onValueChange={setFeaturedFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Wszyscy</SelectItem>
                      <SelectItem value="featured">Status Polecany</SelectItem>
                      <SelectItem value="regular">Standardowi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                    className="w-full flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Wyczyść
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Results Summary */}
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>
              Znaleziono {filteredTutors.length} korepetytorów
              {hasActiveFilters && ` (z ${Array.isArray(tutors) ? tutors.length : 0} dostępnych)`}
            </span>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Pokaż wszystkich
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* No Results Message */}
      {filteredTutors.length === 0 && (
        <Card className="mb-4 sm:mb-6">
          <CardContent className="text-center py-8 sm:py-12">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Brak wyników</h3>
            <p className="text-gray-500 mb-4">
              Nie znaleziono korepetytorów spełniających wybrane kryteria.
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Wyczyść filtry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Featured Tutors Section */}
      {featuredTutors.length > 0 && (
        <Card className="mb-4 sm:mb-6">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Status Polecany ({featuredTutors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredTutors.map((tutor: any) => (
                <div key={tutor.id} className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-yellow-500" />
                      <h4 className="font-medium">{tutor.firstName} {tutor.lastName}</h4>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span>{parseFloat(tutor.tutorProfile?.rating || '4.0').toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    {tutor.tutorProfile?.totalLessons || 0} lekcji przeprowadzonych
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleTutorSelect(tutor)}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-navy-900"
                  >
                    Wybierz korepetytora
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Regular Tutors Section */}
      {regularTutors.length > 0 && (
        <Card className="mb-4 sm:mb-6">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Wszyscy korepetytorzy ({regularTutors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {regularTutors.map((tutor: any) => (
                <div key={tutor.id} className="bg-gray-50 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{tutor.firstName} {tutor.lastName}</h4>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span>{parseFloat(tutor.tutorProfile?.rating || '4.0').toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    {tutor.tutorProfile?.totalLessons || 0} lekcji przeprowadzonych
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTutorSelect(tutor)}
                    className="w-full"
                  >
                    Wybierz korepetytora
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}





      {/* Help Text */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="text-center text-sm text-gray-600">
            <h4 className="font-medium text-navy-900 mb-2">Jak to działa?</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">1</div>
                <span>System wybiera następny temat automatycznie</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">2</div>
                <span>Wybierz korepetytora z listy</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">3</div>
                <span>Ustaw termin i zatwierdź rezerwację</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tutor Selection Modal */}
      <Dialog open={showTutorModal} onOpenChange={setShowTutorModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Wybierz korepetytora</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Featured Tutors Section */}
            {featuredTutors.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="text-yellow-500 text-lg">👑</div>
                  <h3 className="font-semibold text-lg text-navy-900">Status Polecany</h3>
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">👑 Premium</Badge>
                </div>
                <div className="space-y-3">
                  {featuredTutors.map((tutor: any) => (
                    <div key={tutor.id} className="border-2 border-yellow-200 bg-yellow-50 rounded-lg p-4 hover:bg-yellow-100">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{tutor.firstName} {tutor.lastName}</h3>
                            <div className="text-yellow-500">👑</div>
                          </div>
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
                              {tutor.tutorProfile.specializations.map((spec: any, idx: number) => (
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
                          className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-navy-900 font-semibold"
                        >
                          Wybierz
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regular Tutors Section */}
            {regularTutors.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg text-navy-900 mb-4">Wszyscy korepetytorzy</h3>
                <div className="space-y-3">
                  {regularTutors.map((tutor: any) => (
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
                              {tutor.tutorProfile.specializations.map((spec: any, idx: number) => (
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
                  </div>
                </div>
              )}

            {filteredTutors.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Brak dostępnych korepetytorów w tej chwili.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Modal */}
      {selectedTutor && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedTutor(null);
          }}
          tutor={{
            ...selectedTutor,
            rating: selectedTutor.tutorProfile?.rating ? parseFloat(selectedTutor.tutorProfile.rating) : 0,
            totalLessons: selectedTutor.tutorProfile?.totalLessons || 0,
            bio: selectedTutor.tutorProfile?.bio || ''
          }}
          balance={balance}
          onBookLesson={handleBookLesson}
          isLoading={false}
        />
      )}
    </div>
  );
}
