import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight } from "lucide-react";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Optional: Auto-redirect after a few seconds
    const timer = setTimeout(() => {
      setLocation('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [setLocation]);

  const handleGoHome = () => {
    setLocation('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center py-8">
      <div className="container mx-auto px-4 max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-gray-800">
              Płatność zakończona!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Twoja płatność została przetworzona pomyślnie. 
              Dziękujemy za zaufanie platformie SchoolMaster.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>✓ Płatność potwierdzona</strong><br />
                Środki zostały dodane do Twojego konta lub lekcja została opłacona.
              </p>
            </div>

            <div className="pt-4">
              <Button 
                onClick={handleGoHome}
                className="w-full bg-navy-600 hover:bg-navy-700 text-white"
                size="lg"
              >
                Przejdź do panelu głównego
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              Zostaniesz automatycznie przekierowany za 5 sekund
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}