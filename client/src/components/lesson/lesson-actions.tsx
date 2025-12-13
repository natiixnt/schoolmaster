import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, Clock, AlertTriangle, DollarSign, X, Edit, RotateCcw } from "lucide-react";

interface LessonActionsProps {
  lesson: any;
  userRole: "student" | "tutor";
  onActionComplete?: () => void;
}

export function LessonActions({ lesson, userRole, onActionComplete }: LessonActionsProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [newDateTime, setNewDateTime] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Calculate hours until lesson
  const hoursUntilLesson = Math.round((new Date(lesson.scheduledAt).getTime() - new Date().getTime()) / (1000 * 60 * 60));
  
  // Calculate fees based on timing and role
  const getCancellationInfo = () => {
    if (hoursUntilLesson <= 2) {
      return {
        canCancel: true,
        fee: userRole === "student" ? parseFloat(lesson.price) * 0.5 : 0, // Student pays 50% if <2h
        payoutReduction: userRole === "tutor" ? parseFloat(lesson.price) * 0.3 : 0, // Tutor loses 30% if <2h
        warning: hoursUntilLesson <= 2 ? "Odwołanie na mniej niż 2 godziny przed lekcją" : null
      };
    } else if (hoursUntilLesson <= 24) {
      return {
        canCancel: true,
        fee: userRole === "student" ? parseFloat(lesson.price) * 0.25 : 0, // Student pays 25% if <24h
        payoutReduction: userRole === "tutor" ? parseFloat(lesson.price) * 0.15 : 0, // Tutor loses 15% if <24h
        warning: "Odwołanie na mniej niż 24 godziny przed lekcją"
      };
    } else {
      return {
        canCancel: true,
        fee: 0,
        payoutReduction: 0,
        warning: null
      };
    }
  };

  const getRescheduleInfo = () => {
    if (lesson.rescheduleCount >= 2) {
      return {
        canReschedule: false,
        warning: "Maksymalna liczba przełożeń została osiągnięta (2)"
      };
    }
    
    if (hoursUntilLesson <= 2) {
      return {
        canReschedule: true,
        fee: userRole === "student" ? parseFloat(lesson.price) * 0.25 : 0,
        payoutReduction: userRole === "tutor" ? parseFloat(lesson.price) * 0.15 : 0,
        warning: "Przełożenie na mniej niż 2 godziny przed lekcją"
      };
    } else {
      return {
        canReschedule: true,
        fee: 0,
        payoutReduction: 0,
        warning: null
      };
    }
  };

  const cancelInfo = getCancellationInfo();
  const rescheduleInfo = getRescheduleInfo();

  const cancelLessonMutation = useMutation({
    mutationFn: async (data: { reason: string }) => {
      return apiRequest(`/api/lessons/${lesson.id}/cancel`, "POST", {
        reason: data.reason,
        initiatedBy: userRole
      });
    },
    onSuccess: () => {
      toast({
        title: "Lekcja odwołana",
        description: cancelInfo.fee > 0 ? 
          `Lekcja została odwołana. Opłata za odwołanie: ${cancelInfo.fee.toFixed(2)} zł` :
          "Lekcja została odwołana bez dodatkowych opłat.",
      });
      setShowCancelDialog(false);
      setCancelReason("");
      
      // Natychmiastowe usunięcie lekcji z cache
      queryClient.setQueryData(["/api/student/dashboard"], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          upcomingLessons: oldData.upcomingLessons.filter((l: any) => l.id !== lesson.id)
        };
      });
      
      queryClient.setQueryData(["/api/tutor/dashboard"], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          upcomingLessons: oldData.upcomingLessons?.filter((l: any) => l.id !== lesson.id) || []
        };
      });
      
      // Invalidate for fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/student/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tutor/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      onActionComplete?.();
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się odwołać lekcji",
        variant: "destructive",
      });
    },
  });

  const rescheduleLessonMutation = useMutation({
    mutationFn: async (data: { newDateTime: string; reason: string }) => {
      return apiRequest(`/api/lessons/${lesson.id}/reschedule`, "POST", {
        newScheduledAt: data.newDateTime,
        reason: data.reason,
        initiatedBy: userRole
      });
    },
    onSuccess: () => {
      toast({
        title: "Lekcja przełożona",
        description: rescheduleInfo.fee > 0 ? 
          `Lekcja została przełożona. Opłata za przełożenie: ${rescheduleInfo.fee.toFixed(2)} zł` :
          "Lekcja została przełożona bez dodatkowych opłat.",
      });
      setShowRescheduleDialog(false);
      setNewDateTime("");
      setRescheduleReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/student/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tutor/dashboard"] });
      onActionComplete?.();
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się przełożyć lekcji",
        variant: "destructive",
      });
    },
  });

  if (lesson.status !== "scheduled") {
    return null; // Only show actions for scheduled lessons
  }

  return (
    <>
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-orange-800 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Opcje zarządzania lekcją
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Time info */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>
              {hoursUntilLesson > 0 ? 
                `Za ${hoursUntilLesson} godzin${hoursUntilLesson === 1 ? 'ę' : hoursUntilLesson < 5 ? 'y' : ''}` :
                "Lekcja już się rozpoczęła"
              }
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => setShowRescheduleDialog(true)}
              disabled={!rescheduleInfo.canReschedule || hoursUntilLesson <= 0}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Przełóż
            </Button>
            
            <Button
              onClick={() => setShowCancelDialog(true)}
              disabled={!cancelInfo.canCancel || hoursUntilLesson <= 0}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
            >
              <X className="w-4 h-4" />
              Odwołaj
            </Button>
          </div>

          {/* Warnings */}
          {(cancelInfo.warning || rescheduleInfo.warning) && (
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div className="text-xs text-yellow-800">
                  {cancelInfo.fee > 0 && (
                    <div>Opłata za odwołanie: <strong>{cancelInfo.fee.toFixed(2)} zł</strong></div>
                  )}
                  {cancelInfo.payoutReduction > 0 && (
                    <div>Redukcja wynagrodzenia: <strong>{cancelInfo.payoutReduction.toFixed(2)} zł</strong></div>
                  )}
                  {rescheduleInfo.fee > 0 && (
                    <div>Opłata za przełożenie: <strong>{rescheduleInfo.fee.toFixed(2)} zł</strong></div>
                  )}
                  {!rescheduleInfo.canReschedule && (
                    <div className="text-red-600">{rescheduleInfo.warning}</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <X className="w-5 h-5 text-red-500" />
              Odwółanie lekcji
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">{lesson.title}</h4>
              <p className="text-sm text-gray-600">
                {new Date(lesson.scheduledAt).toLocaleString('pl-PL')}
              </p>
            </div>

            {cancelInfo.warning && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">{cancelInfo.warning}</span>
                </div>
                {cancelInfo.fee > 0 && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4" />
                    <span>Opłata za odwołanie: <strong>{cancelInfo.fee.toFixed(2)} zł</strong></span>
                  </div>
                )}
                {cancelInfo.payoutReduction > 0 && (
                  <div className="mt-1 flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4" />
                    <span>Redukcja wynagrodzenia: <strong>{cancelInfo.payoutReduction.toFixed(2)} zł</strong></span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Powód odwołania (opcjonalnie)</Label>
              <Textarea
                id="cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Dlaczego odwołujesz lekcję?"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Anuluj
            </Button>
            <Button
              onClick={() => cancelLessonMutation.mutate({ reason: cancelReason })}
              disabled={cancelLessonMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelLessonMutation.isPending ? "Odwołuję..." : "Odwołaj lekcję"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-blue-500" />
              Przełożenie lekcji
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">{lesson.title}</h4>
              <p className="text-sm text-gray-600">
                Aktualne terminy: {new Date(lesson.scheduledAt).toLocaleString('pl-PL')}
              </p>
              {lesson.rescheduleCount > 0 && (
                <Badge variant="outline" className="mt-2">
                  Przełożona {lesson.rescheduleCount} raz{lesson.rescheduleCount > 1 ? 'y' : ''}
                </Badge>
              )}
            </div>

            {rescheduleInfo.warning && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">{rescheduleInfo.warning}</span>
                </div>
                {rescheduleInfo.fee > 0 && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4" />
                    <span>Opłata za przełożenie: <strong>{rescheduleInfo.fee.toFixed(2)} zł</strong></span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="new-datetime">Nowy termin</Label>
              <Input
                id="new-datetime"
                type="datetime-local"
                value={newDateTime}
                onChange={(e) => setNewDateTime(e.target.value)}
                min={new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reschedule-reason">Powód przełożenia (opcjonalnie)</Label>
              <Textarea
                id="reschedule-reason"
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                placeholder="Dlaczego przełacasza lekcję?"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRescheduleDialog(false)}>
              Anuluj
            </Button>
            <Button
              onClick={() => rescheduleLessonMutation.mutate({ 
                newDateTime, 
                reason: rescheduleReason 
              })}
              disabled={rescheduleLessonMutation.isPending || !newDateTime}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {rescheduleLessonMutation.isPending ? "Przełażę..." : "Przełóż lekcję"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}