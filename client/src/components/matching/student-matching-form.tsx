import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Search, Clock, User, BookOpen } from "lucide-react";

const daysOfWeek = [
  { value: 1, label: "Poniedziałek" },
  { value: 2, label: "Wtorek" },
  { value: 3, label: "Środa" },
  { value: 4, label: "Czwartek" },
  { value: 5, label: "Piątek" },
  { value: 6, label: "Sobota" },
  { value: 0, label: "Niedziela" },
];

const formSchema = z.object({
  subjectId: z.string().min(1, "Wybierz przedmiot"),
  preferredDays: z.array(z.number()).min(1, "Wybierz co najmniej jeden dzień"),
  preferredStartTime: z.string().min(1, "Podaj preferowaną godzinę rozpoczęcia"),
  preferredEndTime: z.string().min(1, "Podaj preferowaną godzinę zakończenia"),
  tutorGenderPreference: z.enum(["male", "female", "no_preference"]),
  teachingStylePreference: z.enum(["relaxed", "demanding", "no_preference"]),
  currentLevel: z.string().min(1, "Opisz swój aktualny poziom"),
  specificNeeds: z.string().min(1, "Opisz czego chcesz się nauczyć"),
});

type FormData = z.infer<typeof formSchema>;

interface StudentMatchingFormProps {
  onMatchesFound?: (matches: any[]) => void;
}

export function StudentMatchingForm({ onMatchesFound }: StudentMatchingFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSearching, setIsSearching] = useState(false);

  // Get subjects for selection
  const { data: subjects } = useQuery({
    queryKey: ["/api/subjects"],
  });

  // Get existing preferences
  const { data: existingPreferences } = useQuery({
    queryKey: ["/api/student/matching-preferences"],
    retry: false,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subjectId: (existingPreferences as any)?.subjectId || "",
      preferredDays: (existingPreferences as any)?.preferredDays || [],
      preferredStartTime: (existingPreferences as any)?.preferredStartTime || "17:00",
      preferredEndTime: (existingPreferences as any)?.preferredEndTime || "20:00",
      tutorGenderPreference: (existingPreferences as any)?.tutorGenderPreference || "no_preference",
      teachingStylePreference: (existingPreferences as any)?.teachingStylePreference || "no_preference",
      currentLevel: (existingPreferences as any)?.currentLevel || "",
      specificNeeds: (existingPreferences as any)?.specificNeeds || "",
    },
  });

  const savePreferencesMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("/api/student/matching-preferences", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student/matching-preferences"] });
      toast({
        title: "Preferencje zapisane",
        description: "Twoje preferencje zostały pomyślnie zapisane.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się zapisać preferencji",
        variant: "destructive",
      });
    },
  });

  const findMatchesMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/student/find-matches", "POST");
    },
    onSuccess: (matches: any) => {
      const matchArray = Array.isArray(matches) ? matches : [];
      toast({
        title: "Znaleziono korepetytorów!",
        description: `Znaleziono ${matchArray.length} pasujących korepetytorów.`,
      });
      onMatchesFound?.(matchArray);
      queryClient.invalidateQueries({ queryKey: ["/api/student/matches"] });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd wyszukiwania",
        description: error.message || "Nie udało się znaleźć korepetytorów",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: FormData) => {
    // First save preferences
    await savePreferencesMutation.mutateAsync(data);
    
    // Then find matches
    setIsSearching(true);
    try {
      await findMatchesMutation.mutateAsync();
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveOnly = async (data: FormData) => {
    savePreferencesMutation.mutate(data);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center gap-2 justify-center text-2xl text-navy-800">
          <Search className="h-6 w-6 text-yellow-500" />
          Znajdź idealnego korepetytora
        </CardTitle>
        <CardDescription>
          Wypełnij formularz, a my znajdziemy dla Ciebie najlepiej dopasowanego korepetytora
        </CardDescription>
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
                  <FormLabel className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Przedmiot
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz przedmiot" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(subjects as any[])?.map((subject: any) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preferred Days */}
            <FormField
              control={form.control}
              name="preferredDays"
              render={() => (
                <FormItem>
                  <FormLabel>Preferowane dni</FormLabel>
                  <FormDescription>
                    Wybierz dni, w które chcesz brać udział w lekcjach
                  </FormDescription>
                  <div className="grid grid-cols-2 gap-2">
                    {daysOfWeek.map((day) => (
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

            {/* Time Preferences */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="preferredStartTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Najwcześniej
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
                name="preferredEndTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Najpóźniej</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tutor Preferences */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tutorGenderPreference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Płeć korepetytora
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
                    <FormLabel>Styl nauczania</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="no_preference">Bez preferencji</SelectItem>
                        <SelectItem value="relaxed">Luźniejszy</SelectItem>
                        <SelectItem value="demanding">Bardziej wymagający</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Current Level */}
            <FormField
              control={form.control}
              name="currentLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Twój aktualny poziom</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Np. 'Dobrze radzę sobie z podstawami, ale mam problemy z ułamkami' lub 'Chcę powtórzyć całość przed egzaminem'"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Opisz krótko, jak oceniasz swój poziom z wybranego przedmiotu
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Specific Needs */}
            <FormField
              control={form.control}
              name="specificNeeds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Na czym chcesz się skupić?</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Np. 'Przygotowanie do egzaminu ósmoklasisty', 'Nadrobienie zaległości z geometrii', 'Poprawa ocen'"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Opisz swoje cele i czego oczekujesz od korepetycji
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={form.handleSubmit(handleSaveOnly)}
                disabled={savePreferencesMutation.isPending}
              >
                {savePreferencesMutation.isPending ? "Zapisywanie..." : "Zapisz preferencje"}
              </Button>
              
              <Button
                type="submit"
                disabled={isSearching || savePreferencesMutation.isPending}
                className="bg-navy-800 hover:bg-navy-900 text-white"
              >
                {isSearching ? (
                  <>
                    <Search className="mr-2 h-4 w-4 animate-spin" />
                    Szukam korepetytorów...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Znajdź korepetytorów
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}