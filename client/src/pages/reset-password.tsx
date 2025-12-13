import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, ArrowLeft, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import SchoolMasterLogo from "@/assets/schoolmaster-logo-auth.png";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Get token from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    
    if (urlToken) {
      setToken(urlToken);
    } else {
      toast({
        title: "Błąd",
        description: "Brak tokena resetowania hasła",
        variant: "destructive",
      });
      setLocation("/login");
    }
  }, [setLocation, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || password.length < 6) {
      toast({
        title: "Błąd",
        description: "Hasło musi mieć co najmniej 6 znaków",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Błąd",
        description: "Hasła nie są identyczne",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await apiRequest("/api/auth/reset-password", "POST", { 
        token, 
        newPassword: password 
      });
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(true);
        toast({
          title: "Sukces",
          description: data.message,
        });
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          setLocation("/login");
        }, 3000);
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

  const getPasswordStrength = (pwd: string) => {
    if (pwd.length < 6) return { strength: "weak", text: "Za krótkie" };
    if (pwd.length < 8) return { strength: "medium", text: "Średnie" };
    if (pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) {
      return { strength: "strong", text: "Silne" };
    }
    return { strength: "medium", text: "Średnie" };
  };

  const passwordStrength = getPasswordStrength(password);

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
            Nowe hasło
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Wprowadź nowe hasło do swojego konta
          </p>
        </div>

        <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-center flex items-center justify-center gap-2">
              {success ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Hasło zmienione
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5 text-blue-600" />
                  Ustaw nowe hasło
                </>
              )}
            </CardTitle>
            <CardDescription className="text-center">
              {success 
                ? "Twoje hasło zostało pomyślnie zmienione" 
                : "Hasło musi mieć co najmniej 6 znaków"
              }
            </CardDescription>
          </CardHeader>

          {success ? (
            <CardContent className="space-y-4">
              <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Hasło zostało pomyślnie zmienione. Za chwilę zostaniesz przekierowany do strony logowania.
                </AlertDescription>
              </Alert>
              
              <div className="text-center">
                <Button 
                  onClick={() => setLocation("/login")}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="button-go-to-login"
                >
                  Przejdź do logowania
                </Button>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Nowe hasło</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Wprowadź nowe hasło"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      required
                      data-testid="input-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {password && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${
                        passwordStrength.strength === 'weak' ? 'bg-red-500' :
                        passwordStrength.strength === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <span className={
                        passwordStrength.strength === 'weak' ? 'text-red-600' :
                        passwordStrength.strength === 'medium' ? 'text-yellow-600' : 'text-green-600'
                      }>
                        {passwordStrength.text}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Powtórz hasło</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Powtórz nowe hasło"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      required
                      data-testid="input-confirm-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      data-testid="button-toggle-confirm-password"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-sm text-red-600">Hasła nie są identyczne</p>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isLoading || !password || !confirmPassword || password !== confirmPassword}
                  data-testid="button-submit"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Zmienianie hasła...
                    </>
                  ) : (
                    "Zmień hasło"
                  )}
                </Button>

                <div className="text-center">
                  <Button 
                    variant="ghost" 
                    className="text-blue-600 hover:text-blue-700"
                    onClick={() => setLocation("/login")}
                    data-testid="link-back-to-login"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Powrót do logowania
                  </Button>
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
