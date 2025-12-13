import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, Clock, Plus, Trash2 } from "lucide-react";

const daysOfWeek = [
  { value: 1, label: "Poniedziałek" },
  { value: 2, label: "Wtorek" },
  { value: 3, label: "Środa" },
  { value: 4, label: "Czwartek" },
  { value: 5, label: "Piątek" },
  { value: 6, label: "Sobota" },
  { value: 0, label: "Niedziela" },
];

const availabilitySlotSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().min(1, "Podaj godzinę rozpoczęcia"),
  endTime: z.string().min(1, "Podaj godzinę zakończenia"),
  isActive: z.boolean().default(true),
});

const formSchema = z.object({
  availability: z.array(availabilitySlotSchema).min(1, "Dodaj co najmniej jeden slot czasowy"),
});

type FormData = z.infer<typeof formSchema>;

export function TutorAvailabilityForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get existing availability
  const { data: existingAvailability } = useQuery({
    queryKey: ["/api/tutor/availability"],
    retry: false,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      availability: (existingAvailability as any) && (existingAvailability as any).length > 0 
        ? (existingAvailability as any)
        : [{ dayOfWeek: 1, startTime: "17:00", endTime: "20:00", isActive: true }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "availability",
  });

  const saveAvailabilityMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("/api/tutor/availability", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tutor/availability"] });
      toast({
        title: "Dostępność zapisana",
        description: "Twoja dostępność została pomyślnie zaktualizowana.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się zapisać dostępności",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    saveAvailabilityMutation.mutate(data);
  };

  const addTimeSlot = () => {
    append({
      dayOfWeek: 1,
      startTime: "17:00",
      endTime: "20:00",
      isActive: true,
    });
  };

  const getDayLabel = (dayOfWeek: number) => {
    return daysOfWeek.find(day => day.value === dayOfWeek)?.label || "";
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center gap-2 justify-center text-2xl text-navy-800">
          <Calendar className="h-6 w-6 text-yellow-500" />
          Ustaw swoją dostępność
        </CardTitle>
        <CardDescription>
          Określ kiedy jesteś dostępny dla uczniów. To pomoże systemowi znaleźć dla Ciebie odpowiednich uczniów.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Dostępne terminy</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTimeSlot}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Dodaj termin
                </Button>
              </div>

              {fields.map((field, index) => (
                <Card key={field.id} className="p-4">
                  <div className="grid grid-cols-4 gap-4 items-end">
                    <FormField
                      control={form.control}
                      name={`availability.${index}.dayOfWeek`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dzień</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))} 
                            defaultValue={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {daysOfWeek.map((day) => (
                                <SelectItem key={day.value} value={day.value.toString()}>
                                  {day.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`availability.${index}.startTime`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Od
                          </FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`availability.${index}.endTime`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Do</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Current Schedule Preview */}
            {fields.length > 0 && (
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-lg">Podgląd harmonogramu</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {fields
                      .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                      .map((field, index) => (
                      <div key={field.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                        <span className="font-medium">
                          {getDayLabel(field.dayOfWeek)}
                        </span>
                        <span className="text-gray-600">
                          {field.startTime} - {field.endTime}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={saveAvailabilityMutation.isPending}
                className="bg-navy-800 hover:bg-navy-900 text-white"
              >
                {saveAvailabilityMutation.isPending ? "Zapisywanie..." : "Zapisz dostępność"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}