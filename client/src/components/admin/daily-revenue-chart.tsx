import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Calendar, Euro } from "lucide-react";
import { useState } from "react";

interface DailyRevenueChartProps {
  className?: string;
}

export default function DailyRevenueChart({ className }: DailyRevenueChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("2025-08");
  const [periodType, setPeriodType] = useState<"month" | "quarter" | "year">("month");
  
  // Fetch daily revenue data based on period type
  const { data: revenueData, isLoading } = useQuery({
    queryKey: ["/api/admin/daily-revenue", selectedPeriod, periodType],
    queryFn: async () => {
      const response = await fetch(`/api/admin/daily-revenue/${selectedPeriod}?type=${periodType}`);
      if (!response.ok) throw new Error('Failed to fetch revenue data');
      return response.json();
    },
    retry: false,
  });

  const dailyData = (revenueData as any)?.dailyData || [];
  const summary = (revenueData as any)?.summary || {
    totalRevenue: 0,
    averageDaily: 0,
    peakDay: 0,
    growthPercent: 0
  };

  const formatCurrency = (value: number) => {
    return `${value.toLocaleString('pl-PL')} zł`;
  }

  const getChartTitle = () => {
    switch (periodType) {
      case "year":
        return "Przychód roczny";
      case "quarter":
        return "Przychód kwartalny";
      default:
        return "Przychód dzienny";
    }
  }

  const getDataLabel = () => {
    switch (periodType) {
      case "year":
        return "Miesiąc";
      case "quarter":
        return "Tydzień";
      default:
        return "Dzień";
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Format label based on period type
      let displayLabel = label;
      if (periodType === "month") {
        displayLabel = `${label}`;
      }
      
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{displayLabel}</p>
          <p className="text-green-600">
            {`Przychód: ${formatCurrency(payload[0].value)}`}
          </p>
          <p className="text-red-600">
            {`Koszty: ${formatCurrency(payload[1]?.value || 0)}`}
          </p>
          <p className="text-blue-600 font-semibold">
            {`Zysk: ${formatCurrency(payload[0].value - (payload[1]?.value || 0))}`}
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-2xl font-bold text-navy-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            {getChartTitle()}
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-navy-700 mb-1">Typ okresu</label>
              <Select value={periodType} onValueChange={(value: "month" | "quarter" | "year") => setPeriodType(value)}>
                <SelectTrigger className="w-36 h-10 border-navy-200 focus:border-navy-500 focus:ring-navy-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Miesiąc</SelectItem>
                  <SelectItem value="quarter">Kwartał</SelectItem>
                  <SelectItem value="year">Rok</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col">
              <label className="text-sm font-medium text-navy-700 mb-1">Okres</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-48 h-10 border-navy-200 focus:border-navy-500 focus:ring-navy-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodType === "month" && (
                    <>
                      {(() => {
                        const months = [];
                        const currentDate = new Date();
                        const currentYear = currentDate.getFullYear();
                        const currentMonth = currentDate.getMonth() + 1;
                        
                        // Start from July 2025 and add months up to current month (only months that have started)
                        const startYear = 2025;
                        const startMonth = 7;
                        
                        // Define the end point: current month of current year (no future months)
                        const endYear = currentYear;
                        const endMonth = currentMonth;
                        
                        let year = startYear;
                        let month = startMonth;
                        
                        while ((year < endYear) || (year === endYear && month <= endMonth)) {
                          const monthNames = [
                            'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
                            'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
                          ];
                          const value = `${year}-${String(month).padStart(2, '0')}`;
                          const label = `${monthNames[month - 1]} ${year}`;
                          months.unshift(
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          );
                          
                          // Move to next month
                          month++;
                          if (month > 12) {
                            month = 1;
                            year++;
                          }
                        }
                        
                        return months;
                      })()}
                    </>
                  )}
                  {periodType === "quarter" && (
                    <>
                      <SelectItem value="2025-Q3">Q3 2025 (Lip-Wrz)</SelectItem>
                    </>
                  )}
                  {periodType === "year" && (
                    <>
                      {(() => {
                        const years = [];
                        const currentYear = new Date().getFullYear();
                        for (let year = 2025; year <= currentYear; year++) {
                          years.push(
                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                          );
                        }
                        return years;
                      })()}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold text-green-700">
                  {formatCurrency(summary.totalRevenue)}
                </div>
                <div className="text-sm text-green-600 font-medium">Łączny przychód</div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold text-blue-700">
                  {formatCurrency(summary.averageDaily)}
                </div>
                <div className="text-sm text-blue-600 font-medium">
                  {periodType === "year" ? "Średnia miesięczna" : 
                   periodType === "quarter" ? "Średnia tygodniowa" : "Średnia dzienna"}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold text-purple-700">
                  {formatCurrency(summary.peakDay)}
                </div>
                <div className="text-sm text-purple-600 font-medium">
                  {periodType === "year" ? "Najlepszy miesiąc" : 
                   periodType === "quarter" ? "Najlepszy tydzień" : "Najlepszy dzień"}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold text-orange-700">
                  {summary.growthPercent > 0 ? '+' : ''}{summary.growthPercent.toFixed(1)}%
                </div>
                <div className="text-sm text-orange-600 font-medium">
                  {periodType === "year" ? "Wzrost r/r" : 
                   periodType === "quarter" ? "Wzrost kw/kw" : "Wzrost m/m"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis 
                dataKey={periodType === "year" ? "month" : "day"}
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={60}
                interval={periodType === "month" ? "preserveEnd" : "preserveStartEnd"}
                tick={periodType === "month" ? false : true}
              />
              <YAxis 
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value} zł`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="revenue" 
                fill="#10b981" 
                radius={[4, 4, 0, 0]}
                name="Przychód"
              />
              <Bar 
                dataKey="expenses" 
                fill="#ef4444" 
                radius={[4, 4, 0, 0]}
                name="Koszty"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Chart Legend */}
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600">Przychody</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-600">Koszty</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}