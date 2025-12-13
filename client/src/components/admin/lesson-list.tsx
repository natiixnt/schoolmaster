import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, Star, User, BookOpen, DollarSign, ArrowLeft } from "lucide-react";
import type { Lesson } from "@shared/schema";

interface LessonListProps {
  isOpen: boolean;
  onClose: () => void;
  period: string;
}

export default function LessonList({ isOpen, onClose, period }: LessonListProps) {
  const { data: lessons, isLoading } = useQuery({
    queryKey: ["/api/admin/lessons", period],
    queryFn: () => fetch(`/api/admin/lessons?period=${period}`).then(res => res.json()),
    enabled: isOpen,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Ukończona</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-800">Zaplanowana</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Anulowana</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRatingStars = (rating: number | null) => {
    if (!rating) return <span className="text-gray-400">Brak oceny</span>;
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-1 text-sm font-medium">{rating}/5</span>
      </div>
    );
  };

  const formatCurrency = (amount: string) => {
    return `${parseFloat(amount).toFixed(2)} zł`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <DialogTitle className="text-2xl">
              Lekcje - {period} ({lessons?.length || 0} lekcji)
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Ładowanie lekcji...</p>
            </div>
          ) : lessons && lessons.length > 0 ? (
            lessons.map((lesson: Lesson) => (
              <Card key={lesson.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-navy-900 mb-2">
                        {lesson.title}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(lesson.scheduledAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{lesson.duration} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span>{formatCurrency(lesson.price)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(lesson.status)}
                      {lesson.status === "completed" && (
                        <div className="text-right">
                          <div className="text-xs text-gray-500 mb-1">Ocena lekcji:</div>
                          {getRatingStars(lesson.rating)}
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-navy-900 mb-2 flex items-center gap-1">
                        <User className="w-4 h-4" />
                        Uczeń
                      </h4>
                      <p className="text-sm text-gray-600">
                        ID: {lesson.studentId}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-navy-900 mb-2 flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        Korepetytor
                      </h4>
                      <p className="text-sm text-gray-600">
                        ID: {lesson.tutorId}
                      </p>
                    </div>
                  </div>

                  {lesson.description && (
                    <div className="mt-4">
                      <h4 className="font-medium text-navy-900 mb-2">Opis lekcji</h4>
                      <p className="text-sm text-gray-600">{lesson.description}</p>
                    </div>
                  )}

                  {lesson.tutorNotes && (
                    <div className="mt-4">
                      <h4 className="font-medium text-navy-900 mb-2">Notatki korepetytora</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {lesson.tutorNotes}
                      </p>
                    </div>
                  )}

                  {lesson.studentNotes && (
                    <div className="mt-4">
                      <h4 className="font-medium text-navy-900 mb-2">Notatki ucznia</h4>
                      <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                        {lesson.studentNotes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium mb-2">Brak lekcji w tym okresie</p>
              <p className="text-sm">W tym miesiącu nie odbyły się żadne lekcje.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}