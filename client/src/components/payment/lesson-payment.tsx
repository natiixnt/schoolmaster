import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Wallet, CreditCard, CheckCircle, Clock } from "lucide-react";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface LessonPaymentProps {
  lessonId: string;
  lessonTitle: string;
  lessonAmount: string;
  isOpen: boolean;
  onClose: () => void;
}

function DirectPaymentForm({ 
  lessonId, 
  amount, 
  onSuccess 
}: { 
  lessonId: string; 
  amount: number; 
  onSuccess: () => void; 
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
        },
        redirect: 'if_required'
      });

      if (error) {
        toast({
          title: "Błąd płatności",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Process the payment on our backend
        await apiRequest(`/api/lessons/${lessonId}/pay`, "POST", {
          method: 'stripe'
        });
        
        toast({
          title: "Płatność zakończona pomyślnie",
          description: "Lekcja została opłacona",
        });
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Błąd płatności",
        description: "Wystąpił nieoczekiwany błąd",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full bg-navy-600 hover:bg-navy-700"
      >
        {isProcessing ? "Przetwarzanie..." : `Zapłać ${amount.toFixed(2)} zł`}
      </Button>
    </form>
  );
}

export function LessonPayment({ 
  lessonId, 
  lessonTitle, 
  lessonAmount, 
  isOpen, 
  onClose 
}: LessonPaymentProps) {
  const [paymentMethod, setPaymentMethod] = useState<'balance' | 'card' | null>(null);
  const [clientSecret, setClientSecret] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: balanceData } = useQuery({
    queryKey: ['/api/balance'],
    enabled: isOpen,
  });

  const { data: paymentStatus } = useQuery({
    queryKey: [`/api/lessons/${lessonId}/payment`],
    enabled: isOpen,
  });

  // Get user data to check for referral code and balance
  const { data: userData } = useQuery({
    queryKey: ['/api/auth/user'],
    enabled: isOpen,
  });

  const amount = parseFloat(lessonAmount);
  const balance = parseFloat(balanceData?.balance || "0.00");
  const referralBalance = parseFloat(userData?.referralBalance || "0.00");
  
  // Calculate payment details client-side to avoid creating payment intent on dialog open
  const originalAmount = amount;
  let referralDiscount = 0;
  let referralBalanceUsed = 0;
  let appliedReferralCode = false;
  
  // Apply 5% discount only if user is eligible (server determines eligibility)
  if (userData?.hasReferralDiscountAvailable) {
    referralDiscount = amount * 0.05;
    appliedReferralCode = true;
  }
  
  // Calculate how much referral balance to use
  const amountAfterDiscount = amount - referralDiscount;
  referralBalanceUsed = Math.min(referralBalance, amountAfterDiscount);
  
  const finalAmount = amountAfterDiscount - referralBalanceUsed;
  
  const hasEnoughBalance = balance >= finalAmount;

  const balancePayment = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/lessons/${lessonId}/pay`, "POST", {
        method: 'balance'
      });
    },
    onSuccess: () => {
      toast({
        title: "Płatność zakończona pomyślnie",
        description: "Lekcja została opłacona z salda konta",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
      queryClient.invalidateQueries({ queryKey: [`/api/lessons/${lessonId}/payment`] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Błąd płatności",
        description: error.message || "Nie udało się przetworzyć płatności",
        variant: "destructive",
      });
    }
  });

  const createPaymentIntent = useMutation({
    mutationFn: async () => {
      // Create payment intent only when user chooses card payment
      return await apiRequest(`/api/lessons/${lessonId}/create-payment-intent`, "POST");
    },
    onSuccess: (data) => {
      redirectToCheckout(data.clientSecret);
    },
    onError: () => {
      toast({
        title: "Błąd",
        description: "Nie udało się przygotować płatności kartą",
        variant: "destructive",
      });
    }
  });

  const handleBalancePayment = () => {
    balancePayment.mutate();
  };

  const handleCardPayment = () => {
    setPaymentMethod('card');
    createPaymentIntent.mutate();
  };

  // Handle redirect to checkout page
  const redirectToCheckout = (clientSecret: string) => {
    const params = new URLSearchParams({
      client_secret: clientSecret,
      amount: amount.toFixed(2),
      type: 'direct_lesson_payment',
      lesson_id: lessonId,
      lesson_title: lessonTitle
    });
    window.location.href = `/checkout?${params.toString()}`;
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: [`/api/lessons/${lessonId}/payment`] });
    setPaymentMethod(null);
    setClientSecret("");
    onClose();
  };

  const handleClose = () => {
    setPaymentMethod(null);
    setClientSecret("");
    onClose();
  };

  // If already paid, show status
  if (paymentStatus?.status === 'completed') {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Status płatności</DialogTitle>
          </DialogHeader>
          
          <div className="text-center py-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Lekcja opłacona</h3>
            <p className="text-gray-600">
              Ta lekcja została już opłacona
            </p>
          </div>
          
          <Button onClick={handleClose} className="w-full">
            Zamknij
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Płatność za lekcję</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="font-semibold text-lg">{lessonTitle}</h3>
                  
                  {/* Show price breakdown if there are discounts or referral balance */}
                  {(referralDiscount > 0 || referralBalanceUsed > 0) ? (
                    <div className="mt-4 space-y-2" data-testid="payment-breakdown">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Cena podstawowa:</span>
                        <span className="line-through" data-testid="text-original-amount">{originalAmount.toFixed(2)} zł</span>
                      </div>
                      
                      {appliedReferralCode && referralDiscount > 0 && (
                        <div className="flex justify-between text-sm text-green-600" data-testid="discount-referral-code">
                          <span>🎉 Zniżka z kodu polecającego (5%):</span>
                          <span data-testid="text-referral-discount">-{referralDiscount.toFixed(2)} zł</span>
                        </div>
                      )}
                      
                      {referralBalanceUsed > 0 && (
                        <div className="flex justify-between text-sm text-green-600" data-testid="discount-referral-balance">
                          <span>💰 Użycie salda polecających:</span>
                          <span data-testid="text-referral-balance-used">-{referralBalanceUsed.toFixed(2)} zł</span>
                        </div>
                      )}
                      
                      <div className="pt-2 border-t flex justify-between">
                        <span className="font-bold">Do zapłaty:</span>
                        <span className="text-2xl font-bold text-navy-800" data-testid="text-final-amount">
                          {finalAmount.toFixed(2)} zł
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-navy-800 mt-2" data-testid="text-amount">
                      {amount.toFixed(2)} zł
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-4">
                Wybierz sposób płatności:
              </div>

              {/* Balance Payment Option */}
              <Card 
                className={`cursor-pointer border-2 transition-colors ${
                  hasEnoughBalance 
                    ? 'hover:border-navy-300 border-gray-200' 
                    : 'border-gray-100 opacity-50'
                }`}
                onClick={hasEnoughBalance ? handleBalancePayment : undefined}
              >
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Wallet className="h-5 w-5 text-navy-600" />
                      <div>
                        <p className="font-medium">Płatność z salda</p>
                        <p className="text-sm text-gray-600">
                          Dostępne: {balance.toFixed(2)} zł
                        </p>
                      </div>
                    </div>
                    {hasEnoughBalance ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Dostępne
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-600 border-red-600">
                        Niewystarczające środki
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Card Payment Option */}
              <Card 
                className="cursor-pointer border-2 hover:border-navy-300 border-gray-200 transition-colors"
                onClick={handleCardPayment}
              >
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-navy-600" />
                      <div>
                        <p className="font-medium">Płatność kartą</p>
                        <p className="text-sm text-gray-600">
                          Visa, Mastercard, BLIK
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      Natychmiastowa
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {balancePayment.isPending && (
              <div className="text-center text-sm text-gray-600">
                <Clock className="h-4 w-4 animate-spin inline mr-2" />
                Przetwarzanie płatności...
              </div>
            )}
          </div>
      </DialogContent>
    </Dialog>
  );
}