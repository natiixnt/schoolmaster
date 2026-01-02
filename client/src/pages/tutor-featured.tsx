import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Crown, Star, Calendar, CreditCard, X, ArrowLeft, Wallet } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocation } from "wouter";
import { isStripeEnabled, stripePromise } from "@/lib/stripe";

interface FeaturedStatus {
  isFeatured: boolean;
  expiresAt: string | null;
  subscriptionId: string | null;
  monthlyPrice: number;
}

function PaymentForm({ clientSecret, onSuccess }: { clientSecret: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/tutor-featured",
      },
    });

    if (error) {
      toast({
        title: "Błąd płatności",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Płatność udana",
        description: "Status 'Polecany' został aktywowany!",
      });
      onSuccess();
    }

    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || processing} 
        className="w-full"
        data-testid="button-confirm-payment"
      >
        {processing ? "Przetwarzanie..." : "Potwierdź płatność (50 PLN/miesiąc)"}
      </Button>
    </form>
  );
}

export default function TutorFeatured() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Redirect non-tutors
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user as any)?.role !== "tutor")) {
      toast({
        title: "Brak dostępu",
        description: "Ta strona jest dostępna tylko dla korepetytorów.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    }
  }, [isAuthenticated, isLoading, user, toast]);

  // Get featured status
  const { data: featuredStatus, isLoading: statusLoading } = useQuery<FeaturedStatus>({
    queryKey: ["/api/tutor/featured/status"],
    enabled: isAuthenticated && (user as any)?.role === "tutor",
    retry: false,
  });

  // Get tutor balance
  const { data: balanceData } = useQuery({
    queryKey: ["/api/balance"],
    enabled: isAuthenticated && (user as any)?.role === "tutor",
    retry: false,
  });

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/tutor/featured/subscribe", "POST");
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setShowPaymentModal(true);
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się utworzyć subskrypcji",
        variant: "destructive",
      });
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/tutor/featured/cancel", "POST");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tutor/featured/status"] });
      toast({
        title: "Anulowano",
        description: "Subskrypcja statusu 'Polecany' została anulowana",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się anulować subskrypcji",
        variant: "destructive",
      });
    },
  });

  // Buy with balance mutation
  const buyWithBalanceMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/tutor/featured/buy-with-balance", "POST");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tutor/featured/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      toast({
        title: "Status aktywowany!",
        description: `Status 'Polecany' został aktywowany na miesiąc. Nowe saldo: ${data.newBalance} PLN`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się kupić statusu za saldo",
        variant: "destructive",
      });
    },
  });

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setClientSecret(null);
    queryClient.invalidateQueries({ queryKey: ["/api/tutor/featured/status"] });
    toast({
      title: "Gratulacje!",
      description: "Twój profil ma teraz status 'Polecany'",
    });
  };

  if (isLoading || statusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  if (!isAuthenticated || (user as any)?.role !== "tutor") {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const currentBalance = parseFloat(balanceData?.balance || "0");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Header with logo and exit button */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center space-x-3">
            <img 
              src="https://schoolmaster.pl/schoolmaster-logo-white.png" 
              alt="SchoolMaster" 
              className="h-8 w-auto"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling!.style.display = 'block';
              }}
            />
            <span 
              className="text-xl font-bold text-gray-900"
              style={{ display: 'none' }}
            >
              SchoolMaster
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-lg font-semibold text-blue-600">Status Polecany</span>
          </div>
          <Button
            variant="outline"
            onClick={() => setLocation("/tutor-dashboard")}
            className="flex items-center space-x-2"
            data-testid="button-exit-featured"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Powrót do panelu</span>
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="text-page-title">
            Status "Polecany" <Crown className="inline w-8 h-8 text-yellow-500 ml-2" />
          </h1>
          <p className="text-gray-600">
            Zwiększ swoją widoczność i przyciągnij więcej uczniów
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Current Status Card */}
          <Card data-testid="card-current-status">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Aktualny status
              </CardTitle>
              <CardDescription>
                Sprawdź swój obecny status "Polecany"
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {featuredStatus?.isFeatured ? (
                <div className="space-y-3">
                  <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
                    <Crown className="w-4 h-4 mr-1" />
                    Status Aktywny
                  </Badge>
                  
                  {featuredStatus.expiresAt && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Wygasa: {formatDate(featuredStatus.expiresAt)}</span>
                    </div>
                  )}

                  <Alert>
                    <Crown className="h-4 w-4" />
                    <AlertDescription>
                      Twój profil jest wyróżniony w sekcji "Polecane" i ma wyższą widoczność dla uczniów.
                    </AlertDescription>
                  </Alert>

                  <Button
                    variant="outline"
                    onClick={() => cancelMutation.mutate()}
                    disabled={cancelMutation.isPending}
                    data-testid="button-cancel-subscription"
                    className="w-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    {cancelMutation.isPending ? "Anulowanie..." : "Anuluj subskrypcję"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Badge variant="secondary">Status Nieaktywny</Badge>
                  
                  <Alert>
                    <AlertDescription>
                      Aktualnie nie masz statusu "Polecany". Twój profil jest wyświetlany w standardowy sposób.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Benefits Card */}
          <Card data-testid="card-benefits">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Korzyści statusu "Polecany"
              </CardTitle>
              <CardDescription>
                Zobacz, co zyskujesz z subskrypcją
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">Wyższa pozycja</h4>
                    <p className="text-sm text-gray-600">Twój profil będzie wyświetlany na górze listy w sekcji "Polecane"</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">Wyróżnienie wizualne</h4>
                    <p className="text-sm text-gray-600">Specjalna oznaka "Polecany" z koroną przy Twoim profilu</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">Zwiększona widoczność</h4>
                    <p className="text-sm text-gray-600">Więcej uczniów zobaczy Twój profil jako pierwszy</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">Większe zaufanie</h4>
                    <p className="text-sm text-gray-600">Status "Polecany" buduje zaufanie wśród potencjalnych uczniów</p>
                  </div>
                </div>
              </div>

              <Separator />
              
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 mb-2">Wybierz opcję płatności:</h3>
                </div>

                {/* Option 1: Stripe Subscription */}
                <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-lg font-bold text-blue-600">50 PLN/miesiąc</div>
                    <Badge variant="outline" className="text-blue-600 border-blue-600">Subskrypcja</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Automatyczna płatność kartą</p>
                  {!isStripeEnabled && (
                    <p className="text-xs text-blue-700 mb-3">
                      Płatności kartą są wyłączone w tym środowisku.
                    </p>
                  )}
                  {!featuredStatus?.isFeatured && (
                    <Button
                      onClick={() => subscribeMutation.mutate()}
                      disabled={subscribeMutation.isPending || !isStripeEnabled}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      data-testid="button-subscribe-featured"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      {subscribeMutation.isPending ? "Przetwarzanie..." : "Płacę kartą"}
                    </Button>
                  )}
                </div>

                {/* Option 2: Balance Payment */}
                <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-lg font-bold text-green-600">55 PLN</div>
                    <Badge variant="outline" className="text-green-600 border-green-600">Jednorazowo</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Płatność z salda (1 miesiąc)</p>
                  <div className="text-sm text-gray-500 mb-3">
                    Twoje saldo: <span className="font-medium">{currentBalance.toFixed(2)} PLN</span>
                  </div>
                  {!featuredStatus?.isFeatured && (
                    <Button
                      onClick={() => buyWithBalanceMutation.mutate()}
                      disabled={buyWithBalanceMutation.isPending || currentBalance < 55}
                      className="w-full bg-green-600 hover:bg-green-700"
                      data-testid="button-buy-with-balance"
                    >
                      <Wallet className="w-4 h-4 mr-2" />
                      {buyWithBalanceMutation.isPending ? "Przetwarzanie..." : 
                       currentBalance < 55 ? "Niewystarczające saldo" : "Kup za saldo"}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Modal */}
        <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Płatność za status "Polecany"
              </DialogTitle>
              <DialogDescription>
                Aby aktywować status "Polecany", przeprowadź płatność. Subskrypcja będzie odnawiać się automatycznie co miesiąc.
              </DialogDescription>
            </DialogHeader>
            
            {clientSecret && stripePromise && (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm 
                  clientSecret={clientSecret} 
                  onSuccess={handlePaymentSuccess}
                />
              </Elements>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
