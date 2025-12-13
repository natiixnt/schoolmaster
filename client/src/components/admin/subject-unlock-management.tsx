import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Calculator, BookOpen, Globe, Lock, Unlock, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Subject {
  id: string;
  name: string;
  available: boolean;
  icon: string;
  color: string;
  description: string;
  enrolledCount?: number;
  requestCount?: number;
}

export default function SubjectUnlockManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: subjects = [], isLoading } = useQuery<Subject[]>({
    queryKey: ['/api/admin/subjects-management']
  });

  const updateSubjectMutation = useMutation<any, Error, {subjectId: string, available: boolean}>({
    mutationFn: async ({ subjectId, available }) => {
      const response = await apiRequest(`/api/admin/subjects/${subjectId}`, 'PUT', { available });
      return response.json();
    },
    onSuccess: (data, { subjectId, available }) => {
      toast({
        title: "Przedmiot zaktualizowany",
        description: `Przedmiot został ${available ? 'odblokowany' : 'zablokowany'} dla uczniów.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subjects-management'] });
      queryClient.invalidateQueries({ queryKey: ['/api/subjects'] });
    },
    onError: (error) => {
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować przedmiotu.",
        variant: "destructive",
      });
    },
  });

  const getIcon = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      'calculator': Calculator,
      'book-open': BookOpen,
      'globe': Globe,
    };
    return iconMap[iconName] || Calculator;
  };

  const getStatusColor = (available: boolean) => {
    return available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  const handleToggleSubject = (subjectId: string, currentStatus: boolean) => {
    updateSubjectMutation.mutate({ 
      subjectId, 
      available: !currentStatus 
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Zarządzanie odblokowaniem przedmiotów</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Ładowanie przedmiotów...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-navy-900 flex items-center gap-2">
          <Unlock className="w-6 h-6" />
          Zarządzanie odblokowaniem przedmiotów
        </CardTitle>
        <p className="text-gray-600">
          Kontroluj które przedmioty są dostępne dla uczniów. Zablokowane przedmioty można odblokować na żądanie.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {subjects.map((subject) => {
            const IconComponent = getIcon(subject.icon);
            
            return (
              <Card key={subject.id} className={`transition-all duration-200 ${
                subject.available 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-red-200 bg-red-50'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg ${subject.color} flex items-center justify-center`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-navy-900 text-lg">{subject.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{subject.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{subject.enrolledCount || 0} zapisanych uczniów</span>
                          </div>
                          {!subject.available && subject.requestCount && subject.requestCount > 0 && (
                            <Badge variant="outline" className="text-orange-600 border-orange-200">
                              {subject.requestCount} próśb o odblokowanie
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <Badge 
                        variant="secondary"
                        className={`${getStatusColor(subject.available)}`}
                      >
                        {subject.available ? (
                          <div className="flex items-center gap-1">
                            <Unlock className="w-3 h-3" />
                            Dostępny
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Zablokowany
                          </div>
                        )}
                      </Badge>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {subject.available ? 'Zablokuj' : 'Odblokuj'}
                        </span>
                        <Switch
                          checked={subject.available}
                          onCheckedChange={() => handleToggleSubject(subject.id, subject.available)}
                          disabled={updateSubjectMutation.isPending}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}