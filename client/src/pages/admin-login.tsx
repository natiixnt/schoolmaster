import { useState, useEffect } from "react";
import { Calculator, Shield, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import SchoolMasterLogo from "@/assets/schoolmaster-logo.png";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useLocation } from "wouter";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const { isAuthenticated, login, isLoggingIn } = useAdminAuth();
  const [, setLocation] = useLocation();

  // Redirect to admin dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/admin-dashboard");
    }
  }, [isAuthenticated, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      try {
        await login({ username, password });
        toast({
          title: "Zalogowano pomyślnie",
          description: "Witaj w panelu administratora",
        });
        setLocation("/admin-dashboard");
      } catch (error: any) {
        toast({
          title: "Błąd logowania",
          description: error.message || "Nieprawidłowa nazwa użytkownika lub hasło",
          variant: "destructive",
        });
      }
    }
  };

  const handleBackToMain = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen gradient-navy relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 h-40 w-40 rounded-3xl border border-white/10 rotate-12 opacity-60" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-6xl grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div className="text-white space-y-8">
            <div className="flex items-center gap-4">
              <img 
                src={SchoolMasterLogo} 
                alt="SchoolMaster" 
                className="h-10 brightness-0 invert"
              />
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Panel Administratora</p>
                <p className="text-2xl font-semibold text-white">SchoolMaster</p>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
                Zarządzaj platformą z pełną kontrolą
              </h1>
              <p className="text-white/70 text-base lg:text-lg">
                Dostęp do raportów, zarządzania korepetytorami i ustawień systemu w jednym miejscu.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 flex items-center h-full">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-sm font-semibold text-white">Bezpieczny dostęp</p>
                    <p className="text-xs text-white/70">Szyfrowane sesje i kontrola uprawnień</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 flex items-center h-full">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Calculator className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-sm font-semibold text-white">Szybkie decyzje</p>
                    <p className="text-xs text-white/70">Podgląd statystyk i finansów na żywo</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 sm:col-span-2 flex items-center h-full">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Lock className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-sm font-semibold text-white">Weryfikacja i porządek</p>
                    <p className="text-xs text-white/70">Zarządzaj użytkownikami, treściami i dostępem</p>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={handleBackToMain}
              className="text-white/70 hover:text-white transition-colors text-sm"
            >
              ← Powrót do strony głównej
            </button>
          </div>

          <div className="bg-white/95 rounded-3xl shadow-2xl border border-white/40 backdrop-blur-sm">
            <div className="px-8 pt-8 pb-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-900 text-white shadow-lg">
                <Shield className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-navy-900 mb-2">
                Logowanie Administratora
              </h2>
              <p className="text-gray-600">
                Wprowadź swoje dane uwierzytelniające
              </p>
            </div>

            <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-navy-900 font-medium">
                  Nazwa użytkownika
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-navy-900 focus:ring-navy-900"
                    placeholder="admin"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-navy-900 font-medium">
                  Hasło
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-navy-900 focus:ring-navy-900"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit"
                disabled={isLoggingIn}
                size="lg"
                className="w-full bg-navy-900 text-white font-bold text-lg hover:bg-navy-800 transition-colors"
              >
                {isLoggingIn ? "Logowanie..." : "Zaloguj się"}
              </Button>
            </form>

            <div className="border-t border-gray-100 px-8 py-4 text-center">
              <p className="text-xs text-gray-500">
                🔒 Panel administratora – dostęp tylko dla uprawnionych osób
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
