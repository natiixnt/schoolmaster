import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator, BookOpen, Globe, Lock, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Subject {
  id: string;
  name: string;
  available: boolean;
  icon: string;
  color: string;
  description: string;
}

export function SubjectSidebar() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [requestingSubject, setRequestingSubject] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ['/api/subjects']
  });

  const requestUnlockMutation = useMutation<any, Error, string>({
    mutationFn: async (subjectId: string) => {
      const response = await apiRequest('/api/student/request-unlock', 'POST', { subjectId });
      return response.json();
    },
    onSuccess: (data, subjectId) => {
      toast({
        title: "Prośba wysłana",
        description: `Prośba o odblokowanie przedmiotu została wysłana do administratora.`,
      });
      setRequestingSubject(null);
      queryClient.invalidateQueries({ queryKey: ['/api/subjects'] });
    },
    onError: (error) => {
      toast({
        title: "Błąd",
        description: "Nie udało się wysłać prośby o odblokowanie.",
        variant: "destructive",
      });
      setRequestingSubject(null);
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
    return available ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600";
  };

  const handleRequestUnlock = (subjectId: string) => {
    setRequestingSubject(subjectId);
    requestUnlockMutation.mutate(subjectId);
  };

  return (
    <div className={`${isCollapsed ? 'w-14 sm:w-16' : 'w-72 sm:w-80 lg:w-72 xl:w-80'} bg-white border-r border-gray-200 h-screen overflow-y-auto transition-all duration-300 flex-shrink-0`}>
      <div className={`${isCollapsed ? 'p-1' : 'p-4'} h-full`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-4 sm:mb-6`}>
          {!isCollapsed && (
            <h2 className="text-xl font-bold text-navy-900 truncate">Twoje przedmioty</h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={isCollapsed ? "w-full" : "ml-auto"}
            title={isCollapsed ? "Rozwiń panel" : "Zwiń panel"}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>
        </div>
        
        {isCollapsed ? (
          // Collapsed view - show only icons
          <div className="space-y-2">
            {subjects.map((subject) => {
              const IconComponent = getIcon(subject.icon);
              
              return (
                <div 
                  key={subject.id} 
                  className={`relative w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer ${
                    subject.available 
                      ? 'bg-green-100 border border-green-200 hover:bg-green-200' 
                      : 'bg-gray-100 border border-gray-200 hover:bg-gray-200'
                  }`}
                  title={subject.name}
                  onClick={() => setIsCollapsed(false)}
                >
                  <div className={`w-8 h-8 rounded ${subject.color} flex items-center justify-center`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  {!subject.available && (
                    <Lock className="w-3 h-3 absolute top-0.5 right-0.5 text-gray-500" />
                  )}
                  {subject.available && (
                    <CheckCircle className="w-3 h-3 absolute top-0.5 right-0.5 text-green-600" />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          // Expanded view - show full cards
          <div className="space-y-4">
          {subjects.map((subject) => {
            const IconComponent = getIcon(subject.icon);
            
            return (
              <Card key={subject.id} className={`transition-all duration-200 ${
                subject.available 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200 bg-gray-50'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg ${subject.color} flex items-center justify-center`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-navy-900 text-sm">{subject.name}</h3>
                      <Badge 
                        variant="secondary"
                        className={`text-xs ${getStatusColor(subject.available)}`}
                      >
                        {subject.available ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Aktywny
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Zablokowany
                          </div>
                        )}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-3">{subject.description}</p>
                  
                  {!subject.available && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      onClick={() => handleRequestUnlock(subject.id)}
                      disabled={requestingSubject === subject.id || requestUnlockMutation.isPending}
                    >
                      {requestingSubject === subject.id ? "Wysyłanie..." : "Poproś o odblokowanie"}
                    </Button>
                  )}
                  
                  {subject.available && (
                    <div className="text-xs text-green-700 bg-green-200 rounded px-2 py-1 text-center">
                      Możesz rezerwować lekcje
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
}