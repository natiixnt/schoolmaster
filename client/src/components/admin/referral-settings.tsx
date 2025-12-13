import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Gift, Users, TrendingUp, Save } from "lucide-react";

interface ReferralSettings {
  referral_bonus_amount?: string;
  referral_discount_percent?: string;
}

interface ReferralStats {
  totalReferrals?: number;
  confirmedReferrals?: number;
  totalBonusPaid?: string;
}

export default function ReferralSettings() {
  const { toast } = useToast();
  const [bonusAmount, setBonusAmount] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");

  // Fetch current settings
  const { data: settings, isLoading } = useQuery<ReferralSettings>({
    queryKey: ['/api/admin/referral-settings']
  });

  // Update form when data loads
  useEffect(() => {
    if (settings?.referral_bonus_amount) {
      setBonusAmount(settings.referral_bonus_amount);
    }
    if (settings?.referral_discount_percent) {
      setDiscountPercent(settings.referral_discount_percent);
    }
  }, [settings]);

  // Fetch referral stats
  const { data: stats } = useQuery<ReferralStats>({
    queryKey: ['/api/admin/referral-stats']
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (values: { bonusAmount: string; discountPercent: string }) => {
      const response = await fetch('/api/admin/referral-settings', {
        method: 'POST',
        body: JSON.stringify(values),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/referral-settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/referral-stats'] });
      toast({
        title: "Zapisano",
        description: "Ustawienia systemu poleceń zostały zaktualizowane",
      });
    },
    onError: () => {
      toast({
        title: "Błąd",
        description: "Nie udało się zapisać ustawień",
        variant: "destructive",
      });
    }
  });

  const handleSave = () => {
    if (!bonusAmount || parseFloat(bonusAmount) <= 0) {
      toast({
        title: "Błąd walidacji",
        description: "Kwota bonusu musi być większa od 0",
        variant: "destructive",
      });
      return;
    }
    if (!discountPercent || parseFloat(discountPercent) < 0 || parseFloat(discountPercent) > 100) {
      toast({
        title: "Błąd walidacji",
        description: "Procent zniżki musi być między 0 a 100",
        variant: "destructive",
      });
      return;
    }

    updateSettingsMutation.mutate({ bonusAmount, discountPercent });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="card-referral-total">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Wszystkie polecenia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-navy-900">
                {stats?.totalReferrals || 0}
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-referral-confirmed">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Potwierdzone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-green-600">
                {stats?.confirmedReferrals || 0}
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-referral-bonus-paid">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Wypłacone bonusy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-navy-900">
                {stats?.totalBonusPaid ? `${parseFloat(stats.totalBonusPaid).toFixed(0)} zł` : '0 zł'}
              </div>
              <Gift className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Card */}
      <Card data-testid="card-referral-settings">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-navy-900">Ustawienia systemu poleceń</CardTitle>
          <CardDescription>
            Skonfiguruj kwoty bonusów i zniżek dla systemu poleceń
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bonus Amount */}
            <div className="space-y-2">
              <Label htmlFor="bonus-amount" className="text-sm font-medium text-gray-700">
                Kwota bonusu dla polecającego (PLN)
              </Label>
              <Input
                id="bonus-amount"
                data-testid="input-bonus-amount"
                type="number"
                step="1"
                min="0"
                value={bonusAmount}
                onChange={(e) => setBonusAmount(e.target.value)}
                placeholder="20"
                className="text-lg"
              />
              <p className="text-sm text-gray-500">
                Kwota kredytu przyznawana polecającemu po pierwszej lekcji poleconego (domyślnie: 20 zł)
              </p>
            </div>

            {/* Discount Percent */}
            <div className="space-y-2">
              <Label htmlFor="discount-percent" className="text-sm font-medium text-gray-700">
                Zniżka dla poleconego (%)
              </Label>
              <Input
                id="discount-percent"
                data-testid="input-discount-percent"
                type="number"
                step="1"
                min="0"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                placeholder="5"
                className="text-lg"
              />
              <p className="text-sm text-gray-500">
                Procent zniżki na pierwszy zakup dla nowej osoby używającej kodu polecenia (domyślnie: 5%)
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button
              data-testid="button-save-settings"
              onClick={handleSave}
              disabled={updateSettingsMutation.isPending}
              className="bg-navy-900 hover:bg-navy-800 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateSettingsMutation.isPending ? 'Zapisywanie...' : 'Zapisz ustawienia'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-navy-900">Jak działa system poleceń?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-700">
          <p>
            <strong>1. Polecony:</strong> Nowy klient przy zakupie wpisuje kod polecającego (np. E8-1234) i otrzymuje zniżkę na pierwszy zakup.
          </p>
          <p>
            <strong>2. Pierwsze polecenie:</strong> System zapisuje relację ze statusem "pending".
          </p>
          <p>
            <strong>3. Po pierwszej lekcji:</strong> Gdy polecony ukończy pierwszą lekcję, status zmienia się na "confirmed", a polecający otrzymuje kredyt.
          </p>
          <p>
            <strong>4. Wykorzystanie kredytu:</strong> Kredyt z poleceń może być wykorzystany przy zakupie pakietów lekcji.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
