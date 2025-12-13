import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import SchoolMasterLogo from "@/assets/schoolmaster-logo.png";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Calculator, Calendar, Clock, Save, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const daysOfWeek = [
  { value: 0, label: "Niedziela", short: "Ndz" },
  { value: 1, label: "Poniedziałek", short: "Pon" },
  { value: 2, label: "Wtorek", short: "Wt" },
  { value: 3, label: "Środa", short: "Śr" },
  { value: 4, label: "Czwartek", short: "Czw" },
  { value: 5, label: "Piątek", short: "Pt" },
  { value: 6, label: "Sobota", short: "Sob" },
];

// Generate hours from 8:00 to 21:00
const generateHours = () => {
  const hours = [];
  for (let hour = 8; hour <= 21; hour++) {
    hours.push(`${hour.toString().padStart(2, '0')}:00`);
  }
  return hours;
};

const availableHours = generateHours();

interface TutorAvailability {
  dayOfWeek: number;
  hour: string;
  isAvailable: boolean;
}

export default function TutorAvailability() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: availability, isLoading } = useQuery({
    queryKey: ["tutor", "availability", user?.id],
    enabled: !!user && user.role === "tutor",
    queryFn: async () => {
      const response = await apiRequest("/api/tutor/availability", "GET");
      return response.json();
    },
  });

  const { data: bookedSlots } = useQuery({
    queryKey: ["tutor", "booked-slots", user?.id],
    enabled: !!user && user.role === "tutor",
    queryFn: async () => {
      const response = await apiRequest(`/api/tutor/booked-slots/${user?.id}`, "GET");
      return response.json();
    },
  });

  const updateAvailabilityMutation = useMutation({
    mutationFn: async (newAvailability: TutorAvailability[]) => {
      const response = await apiRequest("/api/tutor/availability", "POST", { availability: newAvailability });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sukces",
        description: "Dostępność została zaktualizowana",
      });
      queryClient.invalidateQueries({ queryKey: ["tutor", "availability"] });
    },
    onError: () => {
      toast({
        title: "Błąd",
        description: "Nie udało się zapisać dostępności",
        variant: "destructive",
      });
    },
  });

  const [availabilityMap, setAvailabilityMap] = useState<Record<string, boolean>>({});

  // Initialize availability map from fetched data
  React.useEffect(() => {
    if (availability && Array.isArray(availability)) {
      const map: Record<string, boolean> = {};
      availability.forEach((slot: TutorAvailability) => {
        const key = `${slot.dayOfWeek}-${slot.hour}`;
        map[key] = slot.isAvailable;
      });
      setAvailabilityMap(map);
    }
  }, [availability]);

  const isSlotBooked = (dayOfWeek: number, hour: string) => {
    if (!bookedSlots || !Array.isArray(bookedSlots)) return false;
    return bookedSlots.some((slot: any) => 
      slot.dayOfWeek === dayOfWeek && slot.hour === hour
    );
  };

  const toggleSlot = (dayOfWeek: number, hour: string) => {
    const key = `${dayOfWeek}-${hour}`;
    const currentValue = availabilityMap[key] || false;
    
    // Don't allow disabling booked slots
    if (isSlotBooked(dayOfWeek, hour) && currentValue) {
      toast({
        title: "Nie można zmienić",
        description: "Ten slot jest już zarezerwowany na lekcję",
        variant: "destructive",
      });
      return;
    }

    setAvailabilityMap(prev => ({
      ...prev,
      [key]: !currentValue
    }));
  };

  const toggleDayAvailability = (dayOfWeek: number, enabled: boolean) => {
    const newMap = { ...availabilityMap };
    availableHours.forEach(hour => {
      const key = `${dayOfWeek}-${hour}`;
      if (!isSlotBooked(dayOfWeek, hour)) {
        newMap[key] = enabled;
      }
    });
    setAvailabilityMap(newMap);
  };

  const saveAvailability = () => {
    const availabilityArray: TutorAvailability[] = [];
    
    daysOfWeek.forEach(day => {
      availableHours.forEach(hour => {
        const key = `${day.value}-${hour}`;
        availabilityArray.push({
          dayOfWeek: day.value,
          hour,
          isAvailable: availabilityMap[key] || false
        });
      });
    });

    updateAvailabilityMutation.mutate(availabilityArray);
  };

  if (!user || user?.role !== "tutor") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Ta strona jest dostępna tylko dla korepetytorów.</p>
            <Button 
              onClick={() => setLocation("/student-dashboard")} 
              className="mt-4"
            >
              Powrót do panelu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center h-auto sm:h-16 py-4 sm:py-0 gap-4 sm:gap-0">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/tutor-dashboard")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Powrót</span>
              </Button>
              <div className="flex items-center space-x-2">

                <img 
                  src={SchoolMasterLogo} 
                  alt="SchoolMaster" 
                  className="h-6"
                />
              </div>
            </div>
            
            <Button 
              onClick={saveAvailability}
              disabled={updateAvailabilityMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateAvailabilityMutation.isPending ? "Zapisywanie..." : "Zapisz zmiany"}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
            <span className="hidden sm:inline">Zarządzanie dostępnością</span>
            <span className="sm:hidden">Dostępność</span>
          </h1>
          <p className="text-base sm:text-xl text-gray-600">
            Ustaw godziny, w których jesteś dostępny na lekcje
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Dostępność tygodniowa
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">Instrukcje</h3>
                  </div>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Kliknij na godzinę, aby włączyć/wyłączyć dostępność</li>
                    <li>• Użyj przełączników dziennych, aby szybko włączyć/wyłączyć cały dzień</li>
                    <li>• Zarezerwowane sloty (czerwone) nie mogą być wyłączone</li>
                    <li>• Pamiętaj o zapisaniu zmian!</li>
                  </ul>
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left p-4 font-semibold">Dzień</th>
                        {availableHours.map(hour => (
                          <th key={hour} className="text-center p-2 text-sm font-medium min-w-[60px]">
                            {hour}
                          </th>
                        ))}
                        <th className="text-center p-4">Cały dzień</th>
                      </tr>
                    </thead>
                    <tbody>
                      {daysOfWeek.map(day => {
                        const daySlots = availableHours.filter(hour => 
                          availabilityMap[`${day.value}-${hour}`]
                        );
                        const isDayFullyAvailable = daySlots.length === availableHours.length;
                        const hasAnyAvailability = daySlots.length > 0;

                        return (
                          <tr key={day.value} className="border-t">
                            <td className="p-4 font-medium">{day.label}</td>
                            {availableHours.map(hour => {
                              const key = `${day.value}-${hour}`;
                              const isAvailable = availabilityMap[key] || false;
                              const isBooked = isSlotBooked(day.value, hour);
                              
                              return (
                                <td key={hour} className="p-1 text-center">
                                  <button
                                    onClick={() => toggleSlot(day.value, hour)}
                                    disabled={isBooked && isAvailable}
                                    className={`
                                      w-12 h-8 rounded text-xs font-medium transition-colors
                                      ${isBooked 
                                        ? 'bg-red-100 text-red-700 border border-red-300 cursor-not-allowed' 
                                        : isAvailable 
                                          ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200' 
                                          : 'bg-gray-100 text-gray-500 border border-gray-300 hover:bg-gray-200'
                                      }
                                    `}
                                    title={
                                      isBooked 
                                        ? 'Zarezerwowane' 
                                        : isAvailable 
                                          ? 'Dostępne - kliknij aby wyłączyć' 
                                          : 'Niedostępne - kliknij aby włączyć'
                                    }
                                  >
                                    {isBooked ? '●' : isAvailable ? '✓' : ''}
                                  </button>
                                </td>
                              );
                            })}
                            <td className="p-4 text-center">
                              <Switch
                                checked={isDayFullyAvailable}
                                onCheckedChange={(checked) => toggleDayAvailability(day.value, checked)}
                                disabled={hasAnyAvailability && availableHours.some(hour => 
                                  isSlotBooked(day.value, hour)
                                )}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-4">
                  {daysOfWeek.map(day => {
                    const daySlots = availableHours.filter(hour => 
                      availabilityMap[`${day.value}-${hour}`]
                    );
                    const isDayFullyAvailable = daySlots.length === availableHours.length;
                    const hasAnyAvailability = daySlots.length > 0;

                    return (
                      <Card key={day.value} className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-lg">{day.label}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Cały dzień</span>
                            <Switch
                              checked={isDayFullyAvailable}
                              onCheckedChange={(checked) => toggleDayAvailability(day.value, checked)}
                              disabled={hasAnyAvailability && availableHours.some(hour => 
                                isSlotBooked(day.value, hour)
                              )}
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                          {availableHours.map(hour => {
                            const key = `${day.value}-${hour}`;
                            const isAvailable = availabilityMap[key] || false;
                            const isBooked = isSlotBooked(day.value, hour);
                            
                            return (
                              <button
                                key={hour}
                                onClick={() => toggleSlot(day.value, hour)}
                                disabled={isBooked && isAvailable}
                                className={`
                                  flex flex-col items-center p-2 rounded-lg text-xs font-medium transition-colors min-h-[60px]
                                  ${isBooked 
                                    ? 'bg-red-100 text-red-700 border border-red-300 cursor-not-allowed' 
                                    : isAvailable 
                                      ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200' 
                                      : 'bg-gray-100 text-gray-500 border border-gray-300 hover:bg-gray-200'
                                  }
                                `}
                              >
                                <span className="text-xs font-medium">{hour}</span>
                                <span className="text-lg mt-1">
                                  {isBooked ? '●' : isAvailable ? '✓' : ''}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        
                        <div className="mt-3 text-xs text-gray-600">
                          Dostępne: {daySlots.length} z {availableHours.length} godzin
                        </div>
                      </Card>
                    );
                  })}
                </div>

                <div className="flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                    <span>Dostępne</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
                    <span>Niedostępne</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                    <span>Zarezerwowane</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}