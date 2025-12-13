import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Calculator, Clock, Calendar, Save } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface StudentAvailability {
  dayOfWeek: number;
  hour: string;
  isAvailable: boolean;
}

const daysOfWeek = [
  { value: 1, label: "Poniedziałek" },
  { value: 2, label: "Wtorek" },
  { value: 3, label: "Środa" },
  { value: 4, label: "Czwartek" },
  { value: 5, label: "Piątek" },
  { value: 6, label: "Sobota" },
  { value: 0, label: "Niedziela" },
];

const availableHours = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", 
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"
];

export default function StudentAvailability() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [availabilityMap, setAvailabilityMap] = useState<{ [key: string]: boolean }>({});

  // Fetch current availability (student-specific endpoint)
  const { data: currentAvailability, isLoading } = useQuery({
    queryKey: ["/api/student/availability"],
    queryFn: async () => {
      const response = await fetch("/api/student/availability");
      if (!response.ok) {
        if (response.status === 403) {
          // Student doesn't have availability set yet, return empty
          return [];
        }
        throw new Error("Failed to fetch availability");
      }
      return response.json();
    },
    enabled: !!(user as any)?.id,
  });

  // Convert availability data to map format for UI
  useEffect(() => {
    console.log("Received availability data:", currentAvailability);
    if (currentAvailability && Array.isArray(currentAvailability)) {
      const newMap: { [key: string]: boolean } = {};
      
      currentAvailability.forEach((slot: any) => {
        console.log("Processing slot:", slot);
        // Handle new hourly format (dayOfWeek, hour)
        if (slot.dayOfWeek !== undefined && slot.hour) {
          const key = `${slot.dayOfWeek}-${slot.hour}`;
          newMap[key] = slot.isAvailable || true;
          console.log("Added hourly slot:", key, "->", newMap[key]);
        }
        // Handle old format (dayOfWeek, startTime, endTime) for backwards compatibility
        else if (slot.dayOfWeek !== undefined && slot.startTime && slot.endTime) {
          const dayOfWeek = slot.dayOfWeek;
          const startHour = parseInt(slot.startTime.split(':')[0]);
          const endHour = parseInt(slot.endTime.split(':')[0]);
          
          // Generate all hours in the range
          for (let hour = startHour; hour < endHour; hour++) {
            const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
            const key = `${dayOfWeek}-${timeSlot}`;
            newMap[key] = true;
            console.log("Added range slot:", key, "->", newMap[key]);
          }
        }
      });
      
      console.log("Final availability map:", newMap);
      setAvailabilityMap(newMap);
    }
  }, [currentAvailability]);

  // Update availability mutation
  const updateAvailabilityMutation = useMutation({
    mutationFn: async (availabilityArray: StudentAvailability[]) => {
      return await apiRequest("/api/student/availability", "POST", {
        availability: availabilityArray,
      });
    },
    onSuccess: () => {
      toast({
        title: "Sukces",
        description: "Twoja dostępność została zaktualizowana pomyślnie.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/student/availability"] });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się zaktualizować dostępności.",
        variant: "destructive",
      });
    },
  });

  const toggleSlot = (dayOfWeek: number, hour: string) => {
    const key = `${dayOfWeek}-${hour}`;
    const currentValue = availabilityMap[key] || false;
    
    setAvailabilityMap(prev => ({
      ...prev,
      [key]: !currentValue
    }));
  };

  const toggleDayAvailability = (dayOfWeek: number, enabled: boolean) => {
    const newMap = { ...availabilityMap };
    availableHours.forEach(hour => {
      const key = `${dayOfWeek}-${hour}`;
      newMap[key] = enabled;
    });
    setAvailabilityMap(newMap);
  };

  const saveAvailability = () => {
    const availabilityArray: StudentAvailability[] = [];
    
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

  if (!user || user.role !== "student") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Ta strona jest dostępna tylko dla uczniów.</p>
            <Button 
              onClick={() => setLocation("/tutor-dashboard")} 
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Calendar className="w-10 h-10 text-blue-600" />
            Twoja dostępność na lekcje
          </h1>
          <p className="text-xl text-gray-600">
            Ustaw godziny, w których chcesz brać udział w lekcjach
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
                    <li>• Zielone sloty oznaczają dostępność na lekcje</li>
                    <li>• Pamiętaj o zapisaniu zmian!</li>
                  </ul>
                </div>

                <div className="overflow-x-auto">
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

                        return (
                          <tr key={day.value} className="border-t">
                            <td className="p-4 font-medium">{day.label}</td>
                            {availableHours.map(hour => {
                              const key = `${day.value}-${hour}`;
                              const isAvailable = availabilityMap[key] || false;
                              
                              return (
                                <td key={hour} className="p-1 text-center">
                                  <button
                                    onClick={() => toggleSlot(day.value, hour)}
                                    className={`
                                      w-12 h-8 rounded text-xs font-medium transition-colors
                                      ${isAvailable 
                                        ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200' 
                                        : 'bg-gray-100 text-gray-500 border border-gray-300 hover:bg-gray-200'
                                      }
                                    `}
                                    title={
                                      isAvailable 
                                        ? 'Dostępne - kliknij aby wyłączyć' 
                                        : 'Niedostępne - kliknij aby włączyć'
                                    }
                                  >
                                    {isAvailable ? '✓' : ''}
                                  </button>
                                </td>
                              );
                            })}
                            <td className="p-4 text-center">
                              <Switch
                                checked={isDayFullyAvailable}
                                onCheckedChange={(checked) => toggleDayAvailability(day.value, checked)}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="text-center pt-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Ustaw swoją dostępność, aby korepetytorzy mogli lepiej dopasować lekcje do Twojego kalendarza
                  </p>
                  <Button 
                    onClick={saveAvailability}
                    disabled={updateAvailabilityMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                    data-testid="button-save-availability"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateAvailabilityMutation.isPending ? "Zapisywanie..." : "Zapisz zmiany"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}