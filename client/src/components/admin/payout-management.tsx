import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Banknote, Plus, CheckCircle, Clock, XCircle, User, Calculator, TrendingUp, DollarSign } from "lucide-react";
import type { Payout, User as UserType, TutorProfile } from "@shared/schema";

interface PayoutFormData {
  tutorId: string;
  period: string;
  notes: string;
  amount?: string;
}

interface TutorWithProfile extends UserType {
  tutorProfile?: TutorProfile;
}

export default function PayoutManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().slice(0, 7)); // Current month
  const [payoutView, setPayoutView] = useState<"active" | "paid">("active"); // New state for view switching
  const [formData, setFormData] = useState<PayoutFormData>({
    tutorId: "",
    period: selectedPeriod,
    notes: "",
    amount: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: payouts, isLoading: payoutsLoading, error: payoutsError } = useQuery({
    queryKey: ["/api/admin/payouts", selectedPeriod],
    queryFn: () => fetch(`/api/admin/payouts/${selectedPeriod}`, { credentials: 'include' }).then(res => {
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    }),
    retry: false,
  });

  const { data: tutors, error: tutorsError } = useQuery({
    queryKey: ["/api/admin/tutors-detailed"],
    queryFn: () => fetch('/api/admin/tutors-detailed', { credentials: 'include' }).then(res => {
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    }),
    retry: false,
  });

  const { data: payoutStats, error: statsError } = useQuery({
    queryKey: ["/api/admin/payout-stats", selectedPeriod],
    queryFn: () => fetch(`/api/admin/payout-stats/${selectedPeriod}`, { credentials: 'include' }).then(res => {
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    }),
    retry: false,
  });

  const generatePayoutMutation = useMutation({
    mutationFn: async (data: PayoutFormData) => {
      const response = await fetch("/api/admin/payouts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`${response.status}: ${errorData.message || response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payout-stats"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Sukces",
        description: "Wypłata została wygenerowana pomyślnie",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się wygenerować wypłaty",
        variant: "destructive",
      });
    },
  });

  const processPayoutMutation = useMutation({
    mutationFn: async (payoutId: string) => {
      const response = await fetch(`/api/admin/payouts/${payoutId}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`${response.status}: ${errorData.message || response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payout-stats"] });
      toast({
        title: "Sukces",
        description: "Wypłata została przetworzona",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się przetworzyć wypłaty",
        variant: "destructive",
      });
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async (payoutId: string) => {
      const response = await fetch(`/api/admin/payouts/${payoutId}/mark-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`${response.status}: ${errorData.message || response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payout-stats"] });
      toast({
        title: "Sukces",
        description: "Wypłata została oznaczona jako opłacona",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się oznaczyć wypłaty",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      tutorId: "",
      period: selectedPeriod,
      notes: "",
      amount: "",
    });
  };

  const handleSubmit = () => {
    if (!formData.tutorId) {
      toast({
        title: "Błąd",
        description: "Wybierz korepetytora",
        variant: "destructive",
      });
      return;
    }

    generatePayoutMutation.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="w-3 h-3" /> Oczekuje</Badge>;
      case "processed":
        return <Badge variant="default" className="flex items-center gap-1 bg-blue-100 text-blue-800"><Calculator className="w-3 h-3" /> Przetworzona</Badge>;
      case "paid":
        return <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800"><CheckCircle className="w-3 h-3" /> Opłacona</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: string) => {
    return `${parseFloat(amount).toFixed(2)} zł`;
  };

  const getTutorName = (tutorId: string) => {
    if (!Array.isArray(tutors)) return 'Nieznany korepetytor';
    const tutor = (tutors as TutorWithProfile[]).find(t => t.id === tutorId);
    return tutor ? `${tutor.firstName || ''} ${tutor.lastName || ''}`.trim() || tutor.email : 'Nieznany korepetytor';
  };

  // Check for authentication errors
  if (payoutsError || tutorsError || statsError) {
    const error = payoutsError || tutorsError || statsError;
    if (error?.message?.includes('401')) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Brak autoryzacji</h3>
          <p className="text-gray-600 mb-4">Musisz być zalogowany jako administrator, aby zarządzać wypłatami.</p>
          <Button 
            onClick={() => window.location.href = '/admin-login'}
            className="bg-navy-900 hover:bg-navy-800"
          >
            Przejdź do logowania administratora
          </Button>
        </div>
      );
    }
  }

  if (payoutsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-900"></div>
      </div>
    );
  }

  // Filter payouts based on payoutView
  const filteredPayouts = payouts?.filter((payout: Payout) => {
    if (payoutView === 'paid') {
      return payout.status === 'paid';
    }
    return payout.status !== 'paid'; // Show non-paid payouts in active view
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">Zarządzanie wypłatami</h2>
          <p className="text-gray-600 mt-1">
            Przetwarzaj i zarządzaj wypłatami dla korepetytorów
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-navy-900 hover:bg-navy-800">
                <Plus className="w-4 h-4 mr-2" />
                Wygeneruj wypłatę
              </Button>
            </DialogTrigger>
          
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Generuj nową wypłatę</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="tutorId">Korepetytor</Label>
                <Select
                  value={formData.tutorId}
                  onValueChange={(value) => setFormData({ ...formData, tutorId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz korepetytora" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(tutors) && (tutors as TutorWithProfile[]).map((tutor) => (
                      <SelectItem key={tutor.id} value={tutor.id}>
                        {getTutorName(tutor.id)} ({tutor.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="period">Okres (Rok-Miesiąc)</Label>
                <Input
                  id="period"
                  type="month"
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="amount">Kwota wypłaty (zł)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="Wprowadź kwotę wypłaty"
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Notatki (opcjonalne)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Dodatkowe informacje o wypłacie..."
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    resetForm();
                  }}
                >
                  Anuluj
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  className="bg-navy-900 hover:bg-navy-800"
                  disabled={generatePayoutMutation.isPending}
                >
                  {generatePayoutMutation.isPending ? "Generuję..." : "Wygeneruj wypłatę"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* View selector and period filter */}
      <div className="flex items-center justify-between gap-4 mb-6">
        {/* View toggle */}
        <div className="flex flex-col">
          <Label className="text-sm font-medium text-navy-700 mb-2">Status wypłat</Label>
          <div className="flex items-center gap-2">
            <Button
              variant={payoutView === "active" ? "default" : "outline"}
              onClick={() => setPayoutView("active")}
              className={`flex items-center gap-2 h-10 ${payoutView === "active" ? "bg-navy-900 hover:bg-navy-800" : "border-navy-200 text-navy-700 hover:bg-navy-50"}`}
            >
              <Clock className="w-4 h-4" />
              Aktywne ({Array.isArray(payouts) ? payouts.filter((p: Payout) => p.status !== 'paid').length : 0})
            </Button>
            <Button
              variant={payoutView === "paid" ? "default" : "outline"}
              onClick={() => setPayoutView("paid")}
              className={`flex items-center gap-2 h-10 ${payoutView === "paid" ? "bg-navy-900 hover:bg-navy-800" : "border-navy-200 text-navy-700 hover:bg-navy-50"}`}
            >
              <CheckCircle className="w-4 h-4" />
              Opłacone ({Array.isArray(payouts) ? payouts.filter((p: Payout) => p.status === 'paid').length : 0})
            </Button>
          </div>
        </div>
        
        {/* Period selector and stats */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <Label htmlFor="periodFilter" className="text-sm font-medium text-navy-700 mb-2">Filtruj według okresu</Label>
            <Input
              id="periodFilter"
              type="month"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-48 h-10 border-navy-200 focus:border-navy-500 focus:ring-navy-500"
            />
          </div>
          
          {payoutStats && (
            <div className="flex gap-4 ml-auto">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-700">{formatCurrency((payoutStats as any).totalAmount || "0")}</div>
                    <div className="text-sm text-green-600 font-medium">Łączne wypłaty</div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-700">{(payoutStats as any).tutorCount || 0}</div>
                    <div className="text-sm text-blue-600 font-medium">Korepetytorów</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payouts list */}
      <div className="grid gap-4">
        {filteredPayouts.length > 0 ? (
          filteredPayouts.map((payout: any) => (
            <Card key={payout.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Banknote className="w-5 h-5 text-navy-900" />
                      {getTutorName(payout.tutorId)}
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span>Okres: {payout.period}</span>
                      <span>Lekcje: {payout.lessonCount}</span>
                      <span>Prowizja: {(parseFloat(payout.commission) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(payout.status)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                    <div className="text-xl font-bold text-navy-900">{formatCurrency(payout.amount)}</div>
                    <div className="text-sm text-gray-600 font-medium">Kwota brutto</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200">
                    <div className="text-xl font-bold text-red-700">
                      -{formatCurrency((parseFloat(payout.amount) * parseFloat(payout.commission)).toFixed(2))}
                    </div>
                    <div className="text-sm text-red-600 font-medium">Prowizja</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                    <div className="text-xl font-bold text-green-700">{formatCurrency(payout.netAmount)}</div>
                    <div className="text-sm text-green-600 font-medium">Do wypłaty</div>
                  </div>
                </div>
                
                {payout.notes && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium text-blue-900 mb-1">Notatki:</div>
                    <div className="text-sm text-blue-800">{payout.notes}</div>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {payout.processedAt && (
                      <span>Przetworzona: {new Date(payout.processedAt).toLocaleDateString('pl-PL')}</span>
                    )}
                    {payout.paidAt && (
                      <span className="ml-2">Opłacona: {new Date(payout.paidAt).toLocaleDateString('pl-PL')}</span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {payoutView === "active" && payout.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => processPayoutMutation.mutate(payout.id)}
                        disabled={processPayoutMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Calculator className="w-4 h-4 mr-1" />
                        Przetwórz
                      </Button>
                    )}
                    {payoutView === "active" && payout.status === "processed" && (
                      <Button
                        size="sm"
                        onClick={() => markAsPaidMutation.mutate(payout.id)}
                        disabled={markAsPaidMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Oznacz jako opłacona
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <Banknote className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {payoutView === 'paid' 
                  ? 'Brak opłaconych wypłat dla wybranego okresu.'
                  : 'Brak aktywnych wypłat dla wybranego okresu.'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}