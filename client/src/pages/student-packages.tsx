import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Package, Check, Sparkles, ShoppingCart, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { loadStripe } from "@stripe/stripe-js";
import { apiRequest } from "@/lib/queryClient";
import { Navbar } from "@/components/Navbar";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface LessonPackage {
  id: string;
  name: string;
  description: string | null;
  lessonCount: number;
  discountPercent: string;
  basePrice: string;
  finalPrice: string;
  isActive: boolean;
  sortOrder: number;
}

interface PackagePurchase {
  id: string;
  packageId: string;
  lessonsTotal: number;
  lessonsRemaining: number;
  lessonsUsed: number;
  purchasePrice: string;
  status: string;
  purchasedAt: Date;
  expiresAt: Date | null;
  package: LessonPackage;
}

export default function StudentPackages() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [purchasingPackageId, setPurchasingPackageId] = useState<string | null>(null);

  // Fetch available packages
  const { data: packages = [], isLoading: isLoadingPackages } = useQuery<LessonPackage[]>({
    queryKey: ["/api/packages"],
  });

  // Fetch user's active packages
  const { data: myPackages = [], isLoading: isLoadingMyPackages } = useQuery<PackagePurchase[]>({
    queryKey: ["/api/packages/my"],
  });

  const handlePurchase = async (packageId: string) => {
    try {
      setPurchasingPackageId(packageId);

      // Create Stripe checkout session
      const response = await apiRequest("/api/packages/purchase", "POST", { packageId });
      
      if (response.sessionId) {
        const stripe = await stripePromise;
        if (stripe) {
          const { error } = await stripe.redirectToCheckout({
            sessionId: response.sessionId,
          });
          
          if (error) {
            throw new Error(error.message);
          }
        }
      }
    } catch (error: any) {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się rozpocząć procesu zakupu",
        variant: "destructive",
      });
      setPurchasingPackageId(null);
    }
  };

  const activePackages = packages.filter((pkg) => pkg.isActive).sort((a, b) => a.sortOrder - b.sortOrder);

  if (isLoadingPackages || isLoadingMyPackages) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/student-dashboard")}
            className="mb-4 text-navy-700 hover:text-navy-900"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Powrót do panelu
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-navy-900 to-blue-800 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-navy-900">Pakiety lekcji</h1>
              <p className="text-gray-600">Kup pakiet i oszczędź na lekcjach</p>
            </div>
          </div>
        </div>

        {/* My Active Packages */}
        {myPackages.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-navy-900 mb-4">Twoje pakiety</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myPackages
                .filter((pkg) => pkg.status === "active" && pkg.lessonsRemaining > 0)
                .map((pkg) => (
                  <Card
                    key={pkg.id}
                    className="border-2 border-green-200 bg-green-50/30"
                    data-testid={`card-my-package-${pkg.id}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg text-navy-900">{pkg.package.name}</CardTitle>
                        <Badge className="bg-green-600 text-white">Aktywny</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Pozostało lekcji:</span>
                        <span className="text-2xl font-bold text-green-600">{pkg.lessonsRemaining}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Wykorzystano:</span>
                        <span className="text-gray-900 font-medium">{pkg.lessonsUsed} / {pkg.lessonsTotal}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${(pkg.lessonsRemaining / pkg.lessonsTotal) * 100}%`,
                          }}
                        />
                      </div>
                      {pkg.expiresAt && (
                        <p className="text-xs text-gray-500 text-center pt-2">
                          Wygasa: {new Date(pkg.expiresAt).toLocaleDateString('pl-PL')}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}

        {/* Available Packages */}
        <div>
          <h2 className="text-2xl font-bold text-navy-900 mb-4">Dostępne pakiety</h2>
          
          {activePackages.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-navy-900 mb-2">Brak dostępnych pakietów</h3>
                <p className="text-gray-600">Pakiety lekcji nie są obecnie dostępne</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activePackages.map((pkg, index) => {
                const isPopular = index === 1; // Make middle package popular
                const savingsAmount = parseFloat(pkg.basePrice) - parseFloat(pkg.finalPrice);
                
                return (
                  <Card
                    key={pkg.id}
                    className={`relative ${
                      isPopular
                        ? "border-2 border-yellow-400 shadow-lg scale-105"
                        : "border border-gray-200"
                    }`}
                    data-testid={`card-package-${pkg.id}`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-yellow-400 text-navy-900 font-semibold flex items-center gap-1 px-3 py-1">
                          <Sparkles className="w-3 h-3" />
                          Najpopularniejszy
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className={isPopular ? "pt-8" : ""}>
                      <CardTitle className="text-xl text-navy-900">{pkg.name}</CardTitle>
                      {pkg.description && (
                        <p className="text-sm text-gray-600 mt-2">{pkg.description}</p>
                      )}
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="text-center space-y-2">
                        <div className="flex items-baseline justify-center gap-2">
                          <span className="text-4xl font-bold text-navy-900">{parseFloat(pkg.finalPrice).toFixed(0)}</span>
                          <span className="text-lg text-gray-600">zł</span>
                        </div>
                        <div className="text-sm text-gray-500 line-through">
                          {parseFloat(pkg.basePrice).toFixed(0)} zł
                        </div>
                        <div className="text-sm font-semibold text-green-600">
                          Oszczędzasz {savingsAmount.toFixed(0)} zł ({parseFloat(pkg.discountPercent).toFixed(0)}%)
                        </div>
                      </div>

                      <div className="space-y-2 py-4 border-y border-gray-200">
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-gray-700">{pkg.lessonCount} lekcji online</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-gray-700">Materiały dydaktyczne</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-gray-700">Wsparcie korepetytora</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-gray-700">System gamifikacji XP</span>
                        </div>
                      </div>

                      <div className="text-center text-xs text-gray-500">
                        {(parseFloat(pkg.finalPrice) / pkg.lessonCount).toFixed(2)} zł za lekcję
                      </div>

                      <Button
                        onClick={() => handlePurchase(pkg.id)}
                        disabled={purchasingPackageId === pkg.id}
                        className={`w-full ${
                          isPopular
                            ? "bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-navy-900 font-semibold"
                            : "bg-navy-900 hover:bg-navy-800 text-white"
                        }`}
                        data-testid={`button-purchase-${pkg.id}`}
                      >
                        {purchasingPackageId === pkg.id ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                            Przenoszenie...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4" />
                            Kup pakiet
                          </div>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Information Section */}
        <Card className="mt-12 bg-gradient-to-br from-navy-50 to-blue-50 border-navy-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-navy-900 mb-3">Jak działają pakiety lekcji?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p>Pakiety są automatycznie wykorzystywane przy rezerwacji lekcji</p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p>Im większy pakiet, tym większa oszczędność</p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p>Możesz mieć kilka aktywnych pakietów jednocześnie</p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p>Bezpieczne płatności przez Stripe</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
