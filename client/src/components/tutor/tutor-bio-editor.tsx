import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Save } from "lucide-react";

interface TutorBioEditorProps {
  isDemoMode?: boolean;
}

export default function TutorBioEditor({ isDemoMode = false }: TutorBioEditorProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [bio, setBio] = useState("");

  // Fetch current tutor profile to get existing bio
  const { data: tutorProfile, isLoading } = useQuery({
    queryKey: ["/api/tutor/profile"],
    queryFn: async () => {
      const response = await fetch("/api/tutor/profile");
      if (!response.ok) {
        throw new Error("Failed to fetch tutor profile");
      }
      return response.json();
    },
    enabled: !isDemoMode && !!user,
  });

  useEffect(() => {
    if (tutorProfile?.bio) {
      setBio(tutorProfile.bio);
    }
  }, [tutorProfile]);

  const updateBioMutation = useMutation({
    mutationFn: async (newBio: string) => {
      return await apiRequest("/api/tutor/update-bio", "POST", {
        bio: newBio,
      });
    },
    onSuccess: () => {
      toast({
        title: "Sukces",
        description: "Twój opis został zaktualizowany pomyślnie.",
      });
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/tutor/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tutor/dashboard"] });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się zaktualizować opisu.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isDemoMode) {
      toast({
        title: "Tryb podglądu",
        description: "W trybie podglądu nie można zapisywać zmian.",
        variant: "destructive",
      });
      return;
    }

    if (!bio.trim()) {
      toast({
        title: "Błąd",
        description: "Opis nie może być pusty.",
        variant: "destructive",
      });
      return;
    }

    updateBioMutation.mutate(bio.trim());
  };

  if (!isDemoMode && isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bio" className="text-sm font-medium text-gray-700">
          Opis profilu
        </Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Napisz coś o sobie, swoim doświadczeniu i podejściu do nauczania..."
          className="min-h-[150px] resize-none"
          maxLength={500}
        />
        <div className="text-xs text-gray-500 text-right">
          {bio.length}/500 znaków
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Uczniowie będą mogli zobaczyć ten opis podczas wybierania korepetytora.
        </div>
        
        <Button
          type="submit"
          disabled={updateBioMutation.isPending || isDemoMode}
          className="bg-navy-900 hover:bg-navy-800 text-white"
        >
          {updateBioMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Zapisywanie...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Zapisz opis
            </>
          )}
        </Button>
      </div>
    </form>
  );
}