import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Video, 
  Download,
  Clock,
  User,
  BookOpen,
  Edit,
  Trash2
} from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import type { CalendarEvent, Lesson } from "@shared/schema";

interface CalendarViewProps {
  userRole: "student" | "tutor";
  userId: string;
  onEditLesson?: (lessonId: string) => void;
  showAllEvents?: boolean;
}

interface ExtendedCalendarEvent extends CalendarEvent {
  lesson?: Lesson;
}

export default function CalendarView({ userRole, userId, onEditLesson, showAllEvents = false }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<ExtendedCalendarEvent | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<ExtendedCalendarEvent | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    type: "custom" as "lesson" | "custom",
    color: "#3b82f6",
    generateMeetLink: false,
    meetingUrl: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get calendar events for current month
  const calendarEndpoint = showAllEvents 
    ? `/api/calendar/events/all/${format(currentDate, 'yyyy-MM')}` 
    : `/api/calendar/events/${userId}/${format(currentDate, 'yyyy-MM')}`;
  
  const { data: events = [], isLoading } = useQuery({
    queryKey: [calendarEndpoint],
    staleTime: 0, // Force fresh data
    gcTime: 0  // Disable caching temporarily for debugging
  });

  console.log("Calendar events data:", events);

  // Create new calendar event
  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      console.log("Creating event with data:", eventData);
      const response = await apiRequest('/api/calendar/events', 'POST', eventData);
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Event created successfully:", data);
      queryClient.invalidateQueries({ queryKey: [`/api/calendar/events/${userId}/${format(currentDate, 'yyyy-MM')}`] });
      // Invalidate dashboard cache to update upcoming lessons
      queryClient.invalidateQueries({ queryKey: ["/api/student/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tutor/dashboard"] });
      setIsCreateDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        startTime: "",
        endTime: "",
        type: "custom",
        color: "#3b82f6",
        generateMeetLink: false,
        meetingUrl: ""
      });
      toast({
        title: "Wydarzenie dodane",
        description: "Nowe wydarzenie zostało pomyślnie dodane do kalendarza.",
      });
    },
    onError: (error) => {
      console.error("Error creating event:", error);
      toast({
        title: "Błąd",
        description: `Nie udało się dodać wydarzenia: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete event
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const response = await apiRequest(`/api/calendar/events/${eventId}`, 'DELETE');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/calendar/events/${userId}/${format(currentDate, 'yyyy-MM')}`] });
      // Invalidate dashboard cache to update upcoming lessons
      queryClient.invalidateQueries({ queryKey: ["/api/student/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tutor/dashboard"] });
      setSelectedEvent(null);
      setIsDeleteDialogOpen(false);
      setEventToDelete(null);
      toast({
        title: "Wydarzenie usunięte",
        description: "Wydarzenie zostało pomyślnie usunięte z kalendarza.",
      });
    },
    onError: (error) => {
      toast({
        title: "Błąd",
        description: `Nie udało się usunąć wydarzenia: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle delete event confirmation
  const handleDeleteEvent = (event: ExtendedCalendarEvent) => {
    setEventToDelete(event);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteEvent = () => {
    if (eventToDelete) {
      deleteEventMutation.mutate(eventToDelete.id);
    }
  };

  // Generate Google Meet link
  const generateMeetMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const response = await apiRequest(`/api/lessons/${lessonId}/generate-meet`, 'POST');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/calendar/events/${userId}/${format(currentDate, 'yyyy-MM')}`] });
      // Invalidate dashboard cache to update upcoming lessons
      queryClient.invalidateQueries({ queryKey: ["/api/student/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tutor/dashboard"] });
      toast({
        title: "Link Google Meet wygenerowany",
        description: "Link do spotkania został dodany do lekcji.",
      });
    },
  });

  // Export calendar functions
  const exportToGoogleCal = () => {
    const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');
    window.open(`/api/calendar/export/google?userId=${userId}&start=${startDate}&end=${endDate}`, '_blank');
  };

  const exportToICal = () => {
    const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');
    window.open(`/api/calendar/export/ical?userId=${userId}&start=${startDate}&end=${endDate}`, '_blank');
  };

  // Calendar grid generation
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = "d";
  const rows = [];
  let days = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const dayEvents = Array.isArray(events) ? events.filter((event: ExtendedCalendarEvent) => {
        const eventDate = new Date(event.startTime);
        return isSameDay(eventDate, day);
      }) : [];

      days.push(
        <div
          key={day.toString()}
          className={`min-h-[120px] p-2 border border-gray-200 ${
            !isSameMonth(day, monthStart) ? 'bg-gray-50 text-gray-400' : 'bg-white'
          } ${isSameDay(day, new Date()) ? 'bg-emerald-50 border-emerald-200 shadow-sm' : ''}`}
        >
          <div className={`font-medium text-sm mb-1 ${
            isSameDay(day, new Date()) ? 'text-emerald-700 font-bold' : ''
          }`}>
            {format(day, dateFormat)}
          </div>
          <div className="space-y-1">
            {dayEvents.map((event: ExtendedCalendarEvent) => {
              const isPastEvent = new Date(event.startTime) < new Date();
              return (
                <div
                  key={event.id}
                  className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity ${
                    isPastEvent ? 'opacity-50' : ''
                  }`}
                  style={{ 
                    backgroundColor: isPastEvent 
                      ? '#94a3b8' + '20' 
                      : (event.color || '#3b82f6') + '20', 
                    borderLeft: `3px solid ${isPastEvent ? '#94a3b8' : event.color || '#3b82f6'}` 
                  }}
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className={`font-medium truncate ${
                    isPastEvent ? 'text-gray-500' : ''
                  }`}>
                    {event.title}
                  </div>
                  <div className={`flex items-center gap-1 ${
                    isPastEvent ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <Clock className="w-3 h-3" />
                    {format(new Date(event.startTime), 'HH:mm')}
                    {event.type === 'lesson' && event.lesson?.meetLink && (
                      <Video className={`w-3 h-3 ${isPastEvent ? 'text-gray-400' : 'text-blue-600'}`} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div key={day.toString()} className="grid grid-cols-7">
        {days}
      </div>
    );
    days = [];
  }

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.startTime || !formData.endTime) {
      toast({
        title: "Błąd",
        description: "Wypełnij wszystkie wymagane pola.",
        variant: "destructive",
      });
      return;
    }

    // Walidacja dat
    const startTime = new Date(formData.startTime);
    const endTime = new Date(formData.endTime);
    const now = new Date();

    if (startTime < now) {
      toast({
        title: "Błąd",
        description: "Nie można utworzyć wydarzenia w przeszłości.",
        variant: "destructive",
      });
      return;
    }

    if (endTime <= startTime) {
      toast({
        title: "Błąd",
        description: "Data zakończenia musi być późniejsza niż data rozpoczęcia.",
        variant: "destructive",
      });
      return;
    }

    createEventMutation.mutate({
      ...formData,
      userId,
    });
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Kalendarz {userRole === 'tutor' ? 'korepetytora' : 'ucznia'}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportToGoogleCal}
                className="flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                Google Calendar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToICal}
                className="flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                iCal
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-navy-900 hover:bg-navy-800"
                    onClick={() => {
                      setFormData({
                        title: "",
                        description: "",
                        startTime: "",
                        endTime: "",
                        type: "custom",
                        color: "#3b82f6",
                        generateMeetLink: false,
                        meetingUrl: ""
                      });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Dodaj wydarzenie
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-xl font-semibold">
              {format(currentDate, 'LLLL yyyy', { locale: pl })}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 mb-2">
            {['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'].map(day => (
              <div key={day} className="p-2 text-center font-medium text-gray-600 border-b">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          {isLoading ? (
            <div className="text-center py-8">Ładowanie kalendarza...</div>
          ) : (
            <div className="space-y-0">
              {rows}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Event Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent aria-describedby="add-event-description">
          <DialogHeader>
            <DialogTitle>Dodaj nowe wydarzenie</DialogTitle>
            <div id="add-event-description" className="text-sm text-gray-600">
              Utwórz nowe wydarzenie w kalendarzu z opcjonalnym linkiem Google Meet
            </div>
          </DialogHeader>
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div>
              <Label htmlFor="title">Tytuł *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Nazwa wydarzenia"
              />
            </div>
            <div>
              <Label htmlFor="description">Opis</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Opis wydarzenia"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Data i godzina rozpoczęcia *</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="endTime">Data i godzina zakończenia *</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  min={formData.startTime || format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                  onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Typ wydarzenia</Label>
                <Select value={formData.type} onValueChange={(value: "lesson" | "custom") => setFormData({...formData, type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz typ wydarzenia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Niestandardowe</SelectItem>
                    <SelectItem value="lesson">Lekcja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="color">Kolor</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    className="w-12 h-8"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
            </div>
            
            {/* Google Meet Integration */}
            {userRole === 'tutor' && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="generateMeetLink"
                    checked={formData.generateMeetLink}
                    onChange={(e) => setFormData({...formData, generateMeetLink: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="generateMeetLink" className="text-sm">
                    Generuj link Google Meet
                  </Label>
                </div>
                
                {formData.generateMeetLink && (
                  <div>
                    <Label htmlFor="meetingUrl">Link spotkania (opcjonalnie)</Label>
                    <Input
                      id="meetingUrl"
                      value={formData.meetingUrl}
                      onChange={(e) => setFormData({...formData, meetingUrl: e.target.value})}
                      placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Zostaw puste aby automatycznie wygenerować link
                    </p>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Anuluj
              </Button>
              <Button
                type="submit"
                disabled={createEventMutation.isPending}
                className="bg-navy-900 hover:bg-navy-800"
              >
                {createEventMutation.isPending ? "Dodawanie..." : "Dodaj wydarzenie"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Event Details Dialog */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedEvent.title}</DialogTitle>
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteEvent(selectedEvent)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Usuń {selectedEvent.type === 'lesson' ? 'lekcję' : 'wydarzenie'}
                </Button>
              </div>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 mb-2">Czas</div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {format(parseISO(selectedEvent.startTime.toString()), 'dd.MM.yyyy HH:mm', { locale: pl })} - 
                  {format(parseISO(selectedEvent.endTime.toString()), 'HH:mm', { locale: pl })}
                </div>
              </div>
              
              {selectedEvent.description && (
                <div>
                  <div className="text-sm text-gray-600 mb-2">Opis</div>
                  <p>{selectedEvent.description}</p>
                </div>
              )}
              
              {selectedEvent.type === 'lesson' && selectedEvent.lesson && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>Lekcja matematyki</span>
                  </div>
                  
                  {userRole === 'tutor' && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          if (onEditLesson) {
                            onEditLesson(selectedEvent.lesson!.id);
                            setSelectedEvent(null);
                          }
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edytuj lekcję
                      </Button>
                      
                      {!selectedEvent.lesson.meetLink && (
                        <Button
                          onClick={() => generateMeetMutation.mutate(selectedEvent.lesson!.id)}
                          disabled={generateMeetMutation.isPending}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          <Video className="w-4 h-4 mr-2" />
                          {generateMeetMutation.isPending ? "Generowanie..." : "Generuj Google Meet"}
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {selectedEvent.lesson.meetLink && (
                    <div>
                      <div className="text-sm text-gray-600 mb-2">Link Google Meet</div>
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-blue-600" />
                        <a
                          href={selectedEvent.lesson.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Dołącz do spotkania
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: selectedEvent.color || '#3b82f6' }}
                />
                <Badge variant="outline">
                  {selectedEvent.type === 'lesson' ? 'Lekcja' : 'Niestandardowe'}
                </Badge>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Potwierdź usunięcie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Czy na pewno chcesz usunąć wydarzenie "{eventToDelete?.title}"?
            </p>
            <p className="text-sm text-gray-500">
              Ta operacja jest nieodwracalna.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={deleteEventMutation.isPending}
              >
                Anuluj
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteEvent}
                disabled={deleteEventMutation.isPending}
              >
                {deleteEventMutation.isPending ? "Usuwanie..." : "Usuń wydarzenie"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}