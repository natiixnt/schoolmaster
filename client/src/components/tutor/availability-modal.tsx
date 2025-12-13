import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Save, Calendar, Clock } from "lucide-react";

interface AvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: "tutor" | "student";
}

interface TimeSlot {
  day: number;
  hours: string[];
}

const daysOfWeek = [
  { id: 1, label: "Poniedziałek", short: "Pon" },
  { id: 2, label: "Wtorek", short: "Wt" },
  { id: 3, label: "Środa", short: "Śr" },
  { id: 4, label: "Czwartek", short: "Czw" },
  { id: 5, label: "Piątek", short: "Pt" },
  { id: 6, label: "Sobota", short: "Sob" },
  { id: 0, label: "Niedziela", short: "Ndz" },
];

const timeSlots = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", 
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"
];

export default function AvailabilityModal({ isOpen, onClose, userRole = "tutor" }: AvailabilityModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [availability, setAvailability] = useState<TimeSlot[]>([]);

  // Fetch current availability
  const { data: currentAvailability, isLoading } = useQuery({
    queryKey: ["/api/tutor/availability"],
    queryFn: async () => {
      const response = await fetch("/api/tutor/availability");
      if (!response.ok) {
        throw new Error("Failed to fetch availability");
      }
      return response.json();
    },
    enabled: isOpen && !!(user as any)?.id,
  });

  useEffect(() => {
    if (currentAvailability && Array.isArray(currentAvailability)) {
      // Convert from API format (array of availability slots) to TimeSlot[] format for UI
      const convertedAvailability: TimeSlot[] = [];
      
      // Group by day and convert time ranges to individual hours
      const daySlots: { [key: number]: string[] } = {};
      
      currentAvailability.forEach((slot: any) => {
        const dayOfWeek = slot.dayOfWeek;
        const startHour = parseInt(slot.startTime.split(':')[0]);
        const endHour = parseInt(slot.endTime.split(':')[0]);
        
        if (!daySlots[dayOfWeek]) {
          daySlots[dayOfWeek] = [];
        }
        
        // Generate all hours in the range
        for (let hour = startHour; hour < endHour; hour++) {
          const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
          if (!daySlots[dayOfWeek].includes(timeSlot)) {
            daySlots[dayOfWeek].push(timeSlot);
          }
        }
      });
      
      // Convert to TimeSlot format
      Object.entries(daySlots).forEach(([dayStr, hours]) => {
        convertedAvailability.push({
          day: parseInt(dayStr),
          hours: hours.sort()
        });
      });
      
      setAvailability(convertedAvailability);
    }
  }, [currentAvailability]);

  const updateAvailabilityMutation = useMutation({
    mutationFn: async (newAvailability: TimeSlot[]) => {
      // Convert to API format { day: string, hour: number, isSelected: boolean }[]
      const slots: { day: string, hour: number, isSelected: boolean }[] = [];
      
      // First, mark all possible slots as unselected
      for (const dayObj of daysOfWeek) {
        for (const timeSlot of timeSlots) {
          slots.push({
            day: dayObj.id.toString(),
            hour: parseInt(timeSlot.split(':')[0]),
            isSelected: false
          });
        }
      }
      
      // Then mark selected slots as true
      newAvailability.forEach(daySlot => {
        daySlot.hours.forEach(hour => {
          const hourNum = parseInt(hour.split(':')[0]);
          const slot = slots.find(s => 
            s.day === daySlot.day.toString() && s.hour === hourNum
          );
          if (slot) {
            slot.isSelected = true;
          }
        });
      });
      
      return await apiRequest("/api/tutor/availability", "POST", {
        slots: slots,
      });
    },
    onSuccess: () => {
      toast({
        title: "Sukces",
        description: "Twoja dostępność została zaktualizowana pomyślnie.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tutor/availability"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tutors/available"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się zaktualizować dostępności.",
        variant: "destructive",
      });
    },
  });

  const handleTimeSlotToggle = (dayId: number, timeSlot: string) => {
    setAvailability(prev => {
      const daySlot = prev.find(slot => slot.day === dayId);
      
      if (!daySlot) {
        // Add new day with this time slot
        return [...prev, { day: dayId, hours: [timeSlot] }];
      }
      
      const updatedHours = daySlot.hours.includes(timeSlot)
        ? daySlot.hours.filter(hour => hour !== timeSlot)
        : [...daySlot.hours, timeSlot].sort();
      
      if (updatedHours.length === 0) {
        // Remove day if no hours selected
        return prev.filter(slot => slot.day !== dayId);
      }
      
      return prev.map(slot => 
        slot.day === dayId 
          ? { ...slot, hours: updatedHours }
          : slot
      );
    });
  };

  const isTimeSlotSelected = (dayId: number, timeSlot: string) => {
    const daySlot = availability.find(slot => slot.day === dayId);
    return daySlot?.hours.includes(timeSlot) || false;
  };

  const handleSave = () => {
    updateAvailabilityMutation.mutate(availability);
  };

  const getSelectedHoursCount = () => {
    return availability.reduce((total, slot) => total + slot.hours.length, 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-navy-900">
            <Calendar className="h-5 w-5" />
            {userRole === "tutor" ? "Zarządzaj dostępnością" : "Ustaw preferencje czasowe"}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {userRole === "tutor" 
              ? "Wybierz godziny, w których jesteś dostępny do prowadzenia lekcji. Te informacje będą widoczne dla uczniów szukających korepetytora."
              : "Wybierz godziny, w których preferujesz brać lekcje. To pomoże w znalezieniu odpowiedniego korepetytora."
            }
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Wybrane godziny: {getSelectedHoursCount()}
                </span>
              </div>
            </div>

            {/* Availability Grid */}
            <div className="space-y-4">
              {daysOfWeek.map(day => (
                <div key={day.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-base font-medium text-gray-900">
                      {day.label}
                    </Label>
                    <div className="flex flex-wrap gap-1">
                      {availability
                        .find(slot => slot.day === day.id)
                        ?.hours.slice(0, 4)
                        .map(hour => (
                          <Badge key={hour} variant="secondary" className="text-xs">
                            {hour}
                          </Badge>
                        ))}
                      {(availability.find(slot => slot.day === day.id)?.hours.length || 0) > 4 && (
                        <Badge variant="secondary" className="text-xs">
                          +{(availability.find(slot => slot.day === day.id)?.hours.length || 0) - 4}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-2">
                    {timeSlots.map(timeSlot => (
                      <div key={timeSlot} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${day.id}-${timeSlot}`}
                          checked={isTimeSlotSelected(day.id, timeSlot)}
                          onCheckedChange={() => handleTimeSlotToggle(day.id, timeSlot)}
                        />
                        <Label 
                          htmlFor={`${day.id}-${timeSlot}`}
                          className="text-xs cursor-pointer select-none"
                        >
                          {timeSlot}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-600">
                {userRole === "tutor" 
                  ? "Uczniowie będą mogli rezerwować lekcje w wybranych godzinach"
                  : "Te preferencje czasowe pomogą w dopasowaniu odpowiedniego korepetytora"
                }
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={updateAvailabilityMutation.isPending}
                >
                  Anuluj
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateAvailabilityMutation.isPending}
                  className="bg-navy-900 hover:bg-navy-800 text-white"
                >
                  {updateAvailabilityMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Zapisywanie...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Zapisz dostępność
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}