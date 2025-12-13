import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function TopUpForm({ amount, onSuccess }: { amount: number; onSuccess: () => void }) {
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
        toast({
          title: "Płatność zakończona pomyślnie",
          description: `Doładowano ${amount.toFixed(2)} zł na konto`,
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
        {isProcessing ? "Przetwarzanie..." : `Doładuj ${amount.toFixed(2)} zł`}
      </Button>
    </form>
  );
}

export function TopUpModal({ isOpen, onClose }: TopUpModalProps) {
  const [amount, setAmount] = useState<string>("50");
  const [clientSecret, setClientSecret] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createPaymentIntent = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest("/api/create-payment-intent", "POST", { amount });
      const data = await response.json();
      console.log('📄 Raw API response:', data);
      return data;
    },
    onSuccess: (data: any) => {
      console.log('💳 Payment intent created, redirecting to checkout:', {
        clientSecret: data.clientSecret?.substring(0, 30) + '...',
        amount: parseFloat(amount).toFixed(2)
      });
      
      const params = new URLSearchParams({
        client_secret: data.clientSecret,
        amount: parseFloat(amount).toFixed(2),
        type: 'balance_topup'
      });
      
      const checkoutUrl = `/checkout?${params.toString()}`;
      console.log('🔗 Redirect URL:', checkoutUrl);
      
      // Use location.assign instead of href to ensure proper navigation
      window.location.assign(checkoutUrl);
    },
    onError: () => {
      toast({
        title: "Błąd",
        description: "Nie udało się przygotować płatności",
        variant: "destructive",
      });
    }
  });

  const handleAmountSubmit = () => {
    const amountNum = parseFloat(amount);
    if (amountNum <= 0 || amountNum > 10000) {
      toast({
        title: "Nieprawidłowa kwota",
        description: "Kwota musi być między 1 a 10000 zł",
        variant: "destructive",
      });
      return;
    }
    createPaymentIntent.mutate(amountNum);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
    queryClient.invalidateQueries({ queryKey: ['/api/balance/transactions'] });
    setClientSecret("");
    setAmount("50");
    onClose();
  };

  const handleClose = () => {
    setClientSecret("");
    setAmount("50");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Doładuj konto</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="amount">Kwota do doładowania (zł)</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              max="10000"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="50.00"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {[50, 100, 200].map((preset) => (
              <Button
                key={preset}
                variant="outline"
                onClick={() => setAmount(preset.toString())}
                className="text-sm"
              >
                {preset} zł
              </Button>
            ))}
          </div>
          
          <Button 
            onClick={handleAmountSubmit}
            disabled={createPaymentIntent.isPending}
            className="w-full bg-navy-600 hover:bg-navy-700"
          >
            {createPaymentIntent.isPending ? "Przygotowywanie..." : "Przejdź do płatności"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}