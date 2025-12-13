import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import SchoolMasterLogo from "@/assets/schoolmaster-logo-auth.png";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        title: "Błąd",
        description: "Podaj prawidłowy adres email",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await apiRequest("/api/auth/forgot-password", "POST", { email });
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(true);
        toast({
          title: "Email wysłany",
          description: data.message,
        });
      } else {
        throw new Error(data.message || "Wystąpił błąd");
      }
    } catch (error: any) {
      toast({
        title: "Błąd",
        description: error.message || "Wystąpił błąd. Spróbuj ponownie.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src={SchoolMasterLogo} 
            alt="SchoolMaster" 
            className="h-16 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Resetowanie hasła
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Podaj swój adres email, aby otrzymać link do resetowania hasła
          </p>
        </div>

        <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Zapomniałem hasła
            </CardTitle>
            <CardDescription className="text-center">
              {success 
                ? "Sprawdź swoją skrzynkę email" 
                : "Wpisz swój adres email poniżej"
              }
            </CardDescription>
          </CardHeader>

          {success ? (
            <CardContent className="space-y-4">
              <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                <Mail className="h-4 w-4" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Jeśli konto o podanym adresie email istnieje, otrzymasz link do resetowania hasła.
                  Link będzie ważny przez 24 godziny.
                </AlertDescription>
              </Alert>
              
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Nie otrzymałeś emaila? Sprawdź folder spam lub spróbuj ponownie.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setSuccess(false)}
                  data-testid="button-try-again"
                >
                  Spróbuj ponownie
                </Button>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Adres email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="twoj@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                    data-testid="input-email"
                  />
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isLoading}
                  data-testid="button-submit"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Wysyłanie...
                    </>
                  ) : (
                    "Wyślij link resetowania"
                  )}
                </Button>

                <div className="text-center">
                  <Link href="/login">
                    <Button 
                      variant="ghost" 
                      className="text-blue-600 hover:text-blue-700"
                      data-testid="link-back-to-login"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Powrót do logowania
                    </Button>
                  </Link>
                </div>
              </CardFooter>
            </form>
          )}
        </Card>

        <div className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
          <p>© 2025 SchoolMaster. Wszystkie prawa zastrzeżone.</p>
        </div>
      </div>
    </div>
  );
}
