import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AvailabilitySlot {
  day: string;
  hour: number;
  isSelected: boolean;
}

interface AvailabilityCalendarProps {
  onSave: (availability: AvailabilitySlot[]) => void;
  onCancel: () => void;
  initialAvailability?: AvailabilitySlot[];
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 9); // 9 AM to 8 PM
const DAYS = [
  { key: 'monday', label: 'PON', date: '4' },
  { key: 'tuesday', label: 'WTO', date: '5' },
  { key: 'wednesday', label: 'ŚRO', date: '6' },
  { key: 'thursday', label: 'CZW', date: '7' },
  { key: 'friday', label: 'PIĄ', date: '1' },
  { key: 'saturday', label: 'SOB', date: '2' },
  { key: 'sunday', label: 'NIE', date: '3' },
];

export default function AvailabilityCalendar({ 
  onSave, 
  onCancel, 
  initialAvailability = [] 
}: AvailabilityCalendarProps) {
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'select' | 'deselect'>('select');

  useEffect(() => {
    // Initialize availability grid
    const initialSlots: AvailabilitySlot[] = [];
    DAYS.forEach(day => {
      HOURS.forEach(hour => {
        const existing = initialAvailability.find(
          slot => slot.day === day.key && slot.hour === hour
        );
        initialSlots.push({
          day: day.key,
          hour,
          isSelected: existing?.isSelected || false,
        });
      });
    });
    setAvailability(initialSlots);
  }, [initialAvailability]);

  const toggleSlot = (day: string, hour: number) => {
    setAvailability(prev => 
      prev.map(slot => 
        slot.day === day && slot.hour === hour
          ? { ...slot, isSelected: !slot.isSelected }
          : slot
      )
    );
  };

  const handleMouseDown = (day: string, hour: number) => {
    setIsDragging(true);
    const slot = availability.find(s => s.day === day && s.hour === hour);
    setDragMode(slot?.isSelected ? 'deselect' : 'select');
    toggleSlot(day, hour);
  };

  const handleMouseEnter = (day: string, hour: number) => {
    if (isDragging) {
      setAvailability(prev => 
        prev.map(slot => 
          slot.day === day && slot.hour === hour
            ? { ...slot, isSelected: dragMode === 'select' }
            : slot
        )
      );
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const formatHour = (hour: number) => {
    if (hour === 12) return "12 PM";
    if (hour > 12) return `${hour - 12} PM`;
    return `${hour} AM`;
  };

  const getSelectedSlots = () => {
    return availability.filter(slot => slot.isSelected);
  };

  const handleSave = () => {
    onSave(getSelectedSlots());
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl">Dodaj swoją dostępność</CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Sierpień 2025
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
            Save
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-8 gap-1" onMouseUp={handleMouseUp}>
          {/* Header row with time zone */}
          <div className="text-xs text-gray-500 font-medium p-2">
            CEST
          </div>
          {DAYS.map(day => (
            <div key={day.key} className="text-center p-2">
              <div className="text-xs text-gray-500 font-medium">{day.label}</div>
              <div className="text-lg font-semibold">{day.date}</div>
            </div>
          ))}

          {/* Time slots grid */}
          {HOURS.map(hour => (
            <div key={hour} className="contents">
              {/* Time label */}
              <div className="text-xs text-gray-500 p-2 text-right">
                {formatHour(hour)}
              </div>
              
              {/* Day slots */}
              {DAYS.map(day => {
                const slot = availability.find(s => s.day === day.key && s.hour === hour);
                const isSelected = slot?.isSelected || false;
                
                return (
                  <div
                    key={`${day.key}-${hour}`}
                    className={cn(
                      "h-8 border border-gray-200 cursor-pointer transition-colors select-none",
                      isSelected 
                        ? "bg-green-400 hover:bg-green-500" 
                        : "bg-gray-50 hover:bg-gray-100"
                    )}
                    onMouseDown={() => handleMouseDown(day.key, hour)}
                    onMouseEnter={() => handleMouseEnter(day.key, hour)}
                  />
                );
              })}
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Shown in local time (CEST)
          </p>
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Podsumowanie dostępności</h4>
          <p className="text-sm text-blue-700">
            Wybrano {getSelectedSlots().length} godzinnych slotów w tygodniu
          </p>
          {getSelectedSlots().length > 0 && (
            <div className="mt-2 text-xs text-blue-600">
              Będziesz dostępny/a: {DAYS.filter(day => 
                getSelectedSlots().some(slot => slot.day === day.key)
              ).map(day => day.label).join(', ')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}