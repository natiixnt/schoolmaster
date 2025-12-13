import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, DollarSign, CreditCard, Clock, User, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { VisualBookingCalendar } from "@/components/booking/visual-booking-calendar";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface Tutor {
  id: string;
  firstName: string;
  lastName: string;
  bio?: string;
  specializations?: string[];
  rating: number;
  totalLessons: number;
  availability?: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutor: Tutor | null;
  balance: number;
  onBookLesson: (tutorId: string, timeSlot: string, paymentMethod: 'balance' | 'stripe', specialNeeds?: string) => void;
  isLoading: boolean;
}

const getDayOfWeekName = (dayNumber: number) => {
  const days = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
  return days[dayNumber] || 'Nieznany';
};

const getDayShortName = (dayNumber: number) => {
  const days = ['Ndz', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob'];
  return days[dayNumber] || 'Nieznany';
};

// Generate hourly slots from availability range
const generateHourlySlots = (startTime: string, endTime: string) => {
  const slots = [];
  const start = parseInt(startTime.split(':')[0]);
  const end = parseInt(endTime.split(':')[0]);
  
  for (let hour = start; hour < end; hour++) {
    const slotStart = `${hour.toString().padStart(2, '0')}:00`;
    const slotEnd = `${(hour + 1).toString().padStart(2, '0')}:00`;
    slots.push({ start: slotStart, end: slotEnd });
  }
  
  return slots;
};

export default function BookingModal({ isOpen, onClose, tutor, balance, onBookLesson, isLoading }: BookingModalProps) {
  const { toast } = useToast();
  const [specialNeeds, setSpecialNeeds] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedHour, setSelectedHour] = useState<string>();
  
  if (!tutor) return null;

  const handleSlotSelect = (date: Date, hour: string) => {
    setSelectedDate(date);
    setSelectedHour(hour);
  };

  const handleBooking = (paymentMethod: 'balance' | 'stripe') => {
    if (!selectedDate || !selectedHour) {
      toast({
        title: "Wybierz termin",
        description: "Musisz wybrać datę i godzinę lekcji.",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === 'balance' && balance < 100) {
      toast({
        title: "Niewystarczające saldo",
        description: "Doładuj konto lub wybierz płatność kartą.",
        variant: "destructive",
      });
      return;
    }
    
    // Format timeSlot as "YYYY-MM-DD HH:mm"
    const timeSlot = `${format(selectedDate, 'yyyy-MM-dd')} ${selectedHour}`;
    console.log('BookingModal calling onBookLesson with:', {
      tutorId: tutor.id,
      timeSlot,
      paymentMethod,
      specialNeeds
    });
    
    onBookLesson(tutor.id, timeSlot, paymentMethod, specialNeeds);
    // Don't close immediately - let the parent handle closing after successful booking
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
            <User className="h-5 w-5" />
            Zaproszenie dla {tutor.firstName} {tutor.lastName}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Wybierz dogodny termin lekcji (60 minut). Korepetytor potwierdzi dostępność w ciągu 48h.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Tutor Info */}
          <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{tutor.firstName} {tutor.lastName}</h3>
              <div className="flex items-center gap-1">
                <span className="text-yellow-500">★</span>
                <span className="text-sm font-medium">{tutor.rating ? tutor.rating.toFixed(1) : 'Nowy'}</span>
              </div>
            </div>
            
            {tutor.bio && (
              <p className="text-sm text-gray-600 mb-2">{tutor.bio}</p>
            )}
            
            <div className="text-lg font-bold text-green-600">100 zł/h</div>
          </div>

          {/* Special Needs */}
          <div>
            <Label htmlFor="special-needs" className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4" />
              Specjalne potrzeby (opcjonalne)
            </Label>
            <Textarea
              id="special-needs"
              placeholder="Opisz czego chcesz się nauczyć, z czym masz problemy, lub inne specjalne wymagania..."
              value={specialNeeds}
              onChange={(e) => setSpecialNeeds(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

          {/* Visual Booking Calendar */}
          <VisualBookingCalendar
            tutorId={tutor.id}
            onSlotSelect={handleSlotSelect}
            selectedDate={selectedDate}
            selectedHour={selectedHour}
            disabled={isLoading}
          />

          {/* Selected Time Display */}
          {selectedDate && selectedHour && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">Wybrany termin:</span>
              </div>
              <div className="mt-1 text-sm sm:text-base text-blue-800">
                {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: pl })} o {selectedHour}
              </div>
            </div>
          )}

          {/* Payment Options */}
          {selectedDate && selectedHour && (
            <div>
              <div data-testid="info-payment-timing" className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4 mb-4">
                <p className="text-sm text-amber-800 flex items-center gap-2">
                  <span className="text-lg">💡</span>
                  <span>Płatność zostanie pobrana dopiero gdy korepetytor zaakceptuje zaproszenie</span>
                </p>
              </div>
              
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Metoda płatności (100 zł)
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Payment from balance */}
                <Button 
                  onClick={() => handleBooking("balance")}
                  disabled={isLoading || balance < 100}
                  className="h-12 flex items-center justify-center gap-2"
                  size="lg"
                  variant={balance >= 100 ? "default" : "outline"}
                  data-testid="button-pay-balance"
                >
                  <DollarSign className="h-4 w-4" />
                  Saldo konta
                  {balance < 100 && (
                    <Badge variant="destructive" className="ml-2">
                      Niewystarczające środki
                    </Badge>
                  )}
                </Button>
                
                {/* Direct payment with Stripe */}
                <Button 
                  onClick={() => handleBooking("stripe")}
                  disabled={isLoading}
                  className="h-12 flex items-center justify-center gap-2"
                  size="lg"
                  variant="secondary"
                  data-testid="button-pay-card"
                >
                  <CreditCard className="h-4 w-4" />
                  Karta płatnicza
                </Button>
              </div>
              
              <div className="text-xs text-gray-500 mt-2 text-center">
                Twoje saldo: {balance.toFixed(2)} zł
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}