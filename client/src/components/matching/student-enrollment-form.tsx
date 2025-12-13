import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus, Clock, DollarSign, User, BookOpen, Calendar, Target } from "lucide-react";

const enrollmentSchema = z.object({
  subjectId: z.string().min(1, "Wybierz przedmiot"),
  preferredDays: z.array(z.number()).min(1, "Wybierz przynajmniej jeden dzień"),
  preferredStartTime: z.string().min(1, "Podaj preferowaną godzinę rozpoczęcia"),
  preferredEndTime: z.string().min(1, "Podaj preferowaną godzinę zakończenia"),
  tutorGenderPreference: z.string().optional(),
  teachingStylePreference: z.string().optional(),
  currentLevel: z.string().min(1, "Opisz swój poziom"),
  specificNeeds: z.string().min(1, "Opisz czego chcesz się nauczyć"),
  maxHourlyRate: z.string().min(1, "Podaj maksymalną stawkę godzinową"),
});

type EnrollmentFormData = z.infer<typeof enrollmentSchema>;

interface StudentEnrollmentFormProps {
  onEnrollmentComplete?: () => void;
}

export function StudentEnrollmentForm({ onEnrollmentComplete }: StudentEnrollmentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      subjectId: "",
      preferredDays: [],
      preferredStartTime: "",
      preferredEndTime: "",
      tutorGenderPreference: "no_preference",
      teachingStylePreference: "balanced",
      currentLevel: "",
      specificNeeds: "",
      maxHourlyRate: "",
    },
  });

  const { data: subjects } = useQuery({
    queryKey: ["/api/subjects"],
    select: (data: any[]) => data.filter(subject => subject.available)
  });

  const enrollmentMutation = useMutation({
    mutationFn: async (data: EnrollmentFormData) => {
      return apiRequest("/api/student/enroll", "POST", {
        ...data,
        maxHourlyRate: parseFloat(data.maxHourlyRate),
      });
    },
    onSuccess: () => {
      toast({
        title: "Zgłoszenie wysłane!",
        description: "Rozpoczynamy wyszukiwanie odpowiedniego korepetytora. Otrzymasz powiadomienie gdy znajdziemy idealnego kandydata.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/student/matching-status"] });
      onEnrollmentComplete?.();
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się wysłać zgłoszenia",
        variant: "destructive",
      });
    },
  });

  const dayOptions = [
    { value: 1, label: "Poniedziałek" },
    { value: 2, label: "Wtorek" },
    { value: 3, label: "Środa" },
    { value: 4, label: "Czwartek" },
    { value: 5, label: "Piątek" },
    { value: 6, label: "Sobota" },
    { value: 0, label: "Niedziela" },
  ];

  const levelExamples = [
    "Mam problemy z ułamkami i równaniami",
    "Chcę powtórzyć całą matematykę z 8 klasy",
    "Potrzebuję pomocy z geometrią",
    "Przygotowuję się do egzaminu ósmoklasisty",
    "Mam trudności z zadaniami tekstowymi",
  ];

  const needsExamples = [
    "Przygotowanie do egzaminu ósmoklasisty",
    "Nadrobienie zaległości z pierwszego semestru",
    "Pogłębienie wiedzy z wybranych działów",
    "Pomoc z bieżącymi zadaniami domowymi",
    "Przygotowanie do sprawdzianów",
  ];

  const onSubmit = (data: EnrollmentFormData) => {
    setIsLoading(true);
    enrollmentMutation.mutate(data);
    setIsLoading(false);
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold text-navy-900 flex items-center justify-center gap-3">
          <UserPlus className="w-8 h-8 text-yellow-500" />
          Formularz zapisowy
        </CardTitle>
        <p className="text-gray-600 mt-2">
          Wypełnij formularz, a nasz system automatycznie znajdzie dla Ciebie idealnego korepetytora
        </p>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Subject Selection */}
            <FormField
              control={form.control}
              name="subjectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-navy-600" />
                    Wybierz przedmiot
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Wybierz przedmiot, którego chcesz się uczyć" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subjects?.map((subject: any) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${subject.color}`}></span>
                            {subject.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Time Preferences */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <FormLabel className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-navy-600" />
                  Preferowane dni
                </FormLabel>
                <FormField
                  control={form.control}
                  name="preferredDays"
                  render={() => (
                    <FormItem>
                      <div className="grid grid-cols-2 gap-3">
                        {dayOptions.map((day) => (
                          <FormField
                            key={day.value}
                            control={form.control}
                            name="preferredDays"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={day.value}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(day.value)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, day.value])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== day.value
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    {day.label}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <FormLabel className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-navy-600" />
                  Preferowane godziny
                </FormLabel>
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="preferredStartTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Od godziny</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            placeholder="17:00"
                            {...field}
                            className="h-10"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="preferredEndTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Do godziny</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            placeholder="20:00"
                            {...field}
                            className="h-10"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Tutor Preferences */}
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="tutorGenderPreference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Preferencje co do płci korepetytora
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="no_preference">Bez preferencji</SelectItem>
                        <SelectItem value="female">Kobieta</SelectItem>
                        <SelectItem value="male">Mężczyzna</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="teachingStylePreference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferowany styl nauczania</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="relaxed">Luźniej / przyjazne podejście</SelectItem>
                        <SelectItem value="balanced">Zrównoważone podejście</SelectItem>
                        <SelectItem value="demanding">Bardziej wymagająco</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Level and Needs */}
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="currentLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Twój obecny poziom
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Np. mam problemy z ułamkami..."
                        {...field}
                        rows={4}
                      />
                    </FormControl>
                    <div className="text-xs text-gray-500">
                      <p className="font-medium mb-1">Przykłady:</p>
                      {levelExamples.map((example, index) => (
                        <p key={index} className="cursor-pointer hover:text-navy-600" onClick={() => field.onChange(example)}>
                          • {example}
                        </p>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specificNeeds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Czego chcesz się nauczyć?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Opisz swoje cele..."
                        {...field}
                        rows={4}
                      />
                    </FormControl>
                    <div className="text-xs text-gray-500">
                      <p className="font-medium mb-1">Przykłady:</p>
                      {needsExamples.map((example, index) => (
                        <p key={index} className="cursor-pointer hover:text-navy-600" onClick={() => field.onChange(example)}>
                          • {example}
                        </p>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Budget */}
            <FormField
              control={form.control}
              name="maxHourlyRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Maksymalna stawka za godzinę (zł)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="80"
                      min="30"
                      max="200"
                      step="5"
                      {...field}
                      className="max-w-32"
                    />
                  </FormControl>
                  <p className="text-sm text-gray-500">
                    Typowe stawki: 50-80 zł/h (podstawowy), 80-120 zł/h (doświadczeni)
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-center pt-6">
              <Button
                type="submit"
                disabled={isLoading || enrollmentMutation.isPending}
                className="bg-navy-900 hover:bg-navy-800 text-white px-8 py-3 text-lg"
              >
                {isLoading || enrollmentMutation.isPending ? (
                  "Wysyłam zgłoszenie..."
                ) : (
                  "Znajdź mi korepetytora!"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}