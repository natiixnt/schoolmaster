import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, CheckCircle } from "lucide-react";
import { format, addDays, startOfDay, isSameDay } from "date-fns";
import { pl } from "date-fns/locale";

interface AvailableSlot {
  date: Date;
  hour: string;
  isAvailable: boolean;
  isBooked?: boolean;
}

interface VisualBookingCalendarProps {
  tutorId: string;
  onSlotSelect: (date: Date, hour: string) => void;
  selectedDate?: Date;
  selectedHour?: string;
  disabled?: boolean;
}

export function VisualBookingCalendar({ 
  tutorId, 
  onSlotSelect, 
  selectedDate, 
  selectedHour,
  disabled = false 
}: VisualBookingCalendarProps) {
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate next 14 days starting from tomorrow
  const generateDateRange = () => {
    const dates = [];
    const tomorrow = addDays(startOfDay(new Date()), 1);
    
    for (let i = 0; i < 14; i++) {
      dates.push(addDays(tomorrow, i));
    }
    return dates;
  };

  const fetchTutorAvailability = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tutor/availability/${tutorId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch availability');
      }
      
      const { availability, bookedSlots } = await response.json();
      
      // Generate available slots for next 14 days
      const dates = generateDateRange();
      const slots: AvailableSlot[] = [];
      
      // Time slots from 8:00 to 20:00
      const timeSlots = [
        "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", 
        "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
      ];
      
      dates.forEach(date => {
        const dayOfWeek = date.getDay();
        
        timeSlots.forEach(hour => {
          // Check if tutor is available on this day/hour
          const isAvailableThisSlot = availability.some((avail: any) => 
            avail.dayOfWeek === dayOfWeek && avail.hour === hour
          );
          
          // Check if this slot is already booked
          const isBooked = bookedSlots.some((booked: any) => 
            booked.dayOfWeek === dayOfWeek && booked.hour === hour
          );
          
          slots.push({
            date,
            hour,
            isAvailable: isAvailableThisSlot && !isBooked,
            isBooked
          });
        });
      });
      
      setAvailableSlots(slots);
    } catch (error) {
      console.error("Error fetching tutor availability:", error);
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tutorId) {
      fetchTutorAvailability();
    }
  }, [tutorId]);

  const handleSlotClick = (date: Date, hour: string) => {
    if (disabled) return;
    
    // Allow deselecting if the same slot is clicked
    if (isSlotSelected(date, hour)) {
      onSlotSelect(new Date(0), ''); // Clear selection
    } else {
      onSlotSelect(date, hour);
    }
  };

  const isSlotSelected = (date: Date, hour: string) => {
    return selectedDate && selectedHour &&
           isSameDay(date, selectedDate) && hour === selectedHour;
  };

  const groupSlotsByDate = () => {
    const grouped: Record<string, AvailableSlot[]> = {};
    
    availableSlots.forEach(slot => {
      const dateKey = format(slot.date, 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(slot);
    });
    
    return grouped;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        <span className="ml-3 text-gray-600">Ładowanie dostępnych terminów...</span>
      </div>
    );
  }

  const groupedSlots = groupSlotsByDate();
  const dates = generateDateRange();

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <CalendarDays className="w-5 h-5 text-primary" />
        <h3 className="text-base sm:text-lg font-semibold text-navy-900">Wybierz termin lekcji</h3>
      </div>
      
      <div className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
        Dostępne terminy na następne 2 tygodnie • Kliknij termin aby go wybrać lub odznaczyć
      </div>

      <div className="grid gap-3 sm:gap-4">
        {dates
          .filter(date => {
            // Only show dates that have available slots
            const dateKey = format(date, 'yyyy-MM-dd');
            const daySlots = groupedSlots[dateKey] || [];
            const availableSlots = daySlots.filter(slot => slot.isAvailable);
            return availableSlots.length > 0;
          })
          .map(date => {
            const dateKey = format(date, 'yyyy-MM-dd');
            const daySlots = groupedSlots[dateKey] || [];
            const availableSlots = daySlots.filter(slot => slot.isAvailable);
            
            const dayName = format(date, 'EEEE', { locale: pl });
            const dateFormatted = format(date, 'd MMMM yyyy', { locale: pl });
            
            return (
              <Card key={dateKey} className="border border-gray-200 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 sm:pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                        {dayName.charAt(0).toUpperCase() + dayName.slice(1)}
                      </CardTitle>
                      <div className="text-sm text-gray-600">{dateFormatted}</div>
                    </div>
                    <Badge variant="default" className="self-start sm:self-center bg-green-100 text-green-800 border-green-200">
                      {availableSlots.length} {availableSlots.length === 1 ? 'dostępna' : 'dostępne'}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    {availableSlots.map(slot => {
                      const isSelected = isSlotSelected(slot.date, slot.hour);
                      return (
                        <Button
                          key={`${dateKey}-${slot.hour}`}
                          size="sm"
                          variant={isSelected ? "default" : "outline"}
                          className={`
                            h-12 sm:h-10 text-sm font-medium transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-1
                            ${isSelected 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300' 
                              : 'hover:bg-blue-50 hover:border-blue-300 border-gray-300'
                            }
                            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
                          `}
                          onClick={() => handleSlotClick(slot.date, slot.hour)}
                          disabled={disabled}
                          title={isSelected ? 'Kliknij aby odznaczyć' : 'Kliknij aby wybrać'}
                          data-testid={`time-slot-${slot.hour}`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>{slot.hour}</span>
                          {isSelected && (
                            <CheckCircle className="w-3 h-3" />
                          )}
                        </Button>
                      );
                    })}
                  </div>
                  
                  {/* Help text for deselection */}
                  {availableSlots.some(slot => isSlotSelected(slot.date, slot.hour)) && (
                    <div className="mt-3 text-xs text-gray-500 text-center">
                      💡 Kliknij ponownie na wybrany termin aby go odznaczyć
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
      </div>

      {/* Show message when no dates with availability exist */}
      {dates.filter(date => {
        const dateKey = format(date, 'yyyy-MM-dd');
        const daySlots = groupedSlots[dateKey] || [];
        return daySlots.filter(slot => slot.isAvailable).length > 0;
      }).length === 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center justify-center py-6 sm:py-8">
            <div className="text-center">
              <CalendarDays className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
              <h3 className="text-base sm:text-lg font-medium text-yellow-800 mb-2">
                Brak dostępnych terminów
              </h3>
              <p className="text-yellow-700">
                Korepetytor nie ma dostępnych terminów w najbliższych 2 tygodniach.
                Spróbuj wybrać innego korepetytora lub skontaktuj się z nim bezpośrednio.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}