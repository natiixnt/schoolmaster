import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { isStripeEnabled, stripePromise } from "@/lib/stripe";

const CheckoutForm = ({ amount, tutorId, timeSlot }: { amount: number, tutorId: string, timeSlot: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/student/lessons',
      },
    });

    setIsProcessing(false);

    if (error) {
      toast({
        title: "Błąd płatności",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Płatność zakończona pomyślnie",
        description: "Lekcja została zarezerwowana!",
      });
      setLocation('/student/lessons');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full"
      >
        {isProcessing ? "Przetwarzanie..." : `Zapłać ${amount} zł`}
      </Button>
    </form>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const tutorId = urlParams.get('tutorId');
  const timeSlot = urlParams.get('timeSlot');
  const amount = parseInt(urlParams.get('amount') || '100');

  useEffect(() => {
    if (!isStripeEnabled) {
      return;
    }
    if (!tutorId || !amount) {
      toast({
        title: "Błędne parametry",
        description: "Przekierowanie na stronę główną...",
        variant: "destructive",
      });
      setLocation('/');
      return;
    }

    // Create PaymentIntent as soon as the page loads
    apiRequest("/api/create-payment-intent", "POST", { 
      amount: amount,
      tutorId,
      timeSlot,
      subject: "math-8th",
      duration: 60
    })
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
      })
      .catch((error) => {
        console.error('Error creating payment intent:', error);
        toast({
          title: "Błąd inicjalizacji płatności",
          description: "Spróbuj ponownie później",
          variant: "destructive",
        });
        setLocation('/find-tutor');
      });
  }, [tutorId, amount, timeSlot]);

  if (!isStripeEnabled) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Płatności wyłączone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-gray-600">
                Płatności kartą są wyłączone w tym środowisku.
              </p>
              <Button onClick={() => setLocation('/find-tutor')} className="w-full">
                Powrót do wyboru korepetytora
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-gray-600">Przygotowywanie płatności...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/find-tutor')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Powrót do wyboru korepetytora
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Płatność za lekcję</CardTitle>
            <div className="text-center text-2xl font-bold text-green-600">
              {amount} zł
            </div>
            <p className="text-center text-gray-600 text-sm">
              Bezpieczna płatność przez Stripe
            </p>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm 
                amount={amount} 
                tutorId={tutorId || ''} 
                timeSlot={timeSlot || ''} 
              />
            </Elements>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Twoja płatność jest chroniona przez Stripe</p>
          <p>Po udanej płatności lekcja zostanie automatycznie zarezerwowana</p>
        </div>
      </div>
    </div>
  );
}
