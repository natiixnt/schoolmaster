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
    <div className="min-h-screen gradient-navy flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">

            <img 
              src={SchoolMasterLogo} 
              alt="SchoolMaster" 
              className="h-8"
            />
          </div>
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Shield className="w-5 h-5 text-accent" />
            <span className="text-white/80 text-lg">Panel Administratora</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-navy-900 mb-2">
              Logowanie Administratora
            </h1>
            <p className="text-gray-600">
              Wprowadź swoje dane uwierzytelniające
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
              className="w-full bg-navy-900 text-white py-3 rounded-xl font-bold text-lg hover:bg-navy-800 transition-colors"
            >
              {isLoggingIn ? "Logowanie..." : "Zaloguj się"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={handleBackToMain}
              className="text-gray-500 hover:text-navy-900 transition-colors text-sm"
            >
              ← Powrót do strony głównej
            </button>
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-6 text-center">
          <p className="text-white/60 text-sm">
            🔒 Panel administratora - dostęp tylko dla uprawnionych osób
          </p>
        </div>
      </div>
    </div>
  );
}