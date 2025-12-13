import { ArrowRight, Shield, Users, Award, BookOpen, Target, TrendingUp, Star, CheckCircle, Zap } from "lucide-react";
import SchoolMasterLogo from "@/assets/schoolmaster-logo-auth.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";

export default function Login() {
  const handleLogin = () => {
    window.location.href = "/auth";
  };

  const handleRegister = () => {
    window.location.href = "/auth";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-indigo-300/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-10 -right-10 w-80 h-80 bg-gradient-to-br from-yellow-200/30 to-orange-300/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-200/20 to-purple-300/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="w-full max-w-6xl relative z-10 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Hero Content */}
        <div className="space-y-8 text-center lg:text-left">
          {/* Logo & Brand */}
          <div className="flex items-center justify-center lg:justify-start space-x-4">
            <img 
              src={SchoolMasterLogo} 
              alt="SchoolMaster" 
              className="h-12"
            />
          </div>

          {/* Main Heading */}
          <div className="space-y-4">
            <h2 className="text-4xl lg:text-5xl font-bold text-[#252627] dark:text-white leading-tight">
              Twoja droga do sukcesu w
              <span className="bg-gradient-to-r from-[#3B64D8] to-[#5B7FDB] bg-clip-text text-transparent"> matematyce</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              Dołącz do tysięcy uczniów, którzy już przygotowują się do egzaminu ósmoklasisty z naszą platformą
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 py-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#F1C40F]">2847+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Uczniów</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#3B64D8]">94%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Sukces</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#5B7FDB]">4.9</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Ocena</div>
            </div>
          </div>

          {/* Key Features */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-gray-700 dark:text-gray-300 font-medium">Indywidualne korepetycje online</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-[#3B64D8] dark:text-[#5B7FDB]" />
              </div>
              <span className="text-gray-700 dark:text-gray-300 font-medium">Elastyczne terminy dopasowane do Ciebie</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-[#5B7FDB] dark:text-[#3B64D8]" />
              </div>
              <span className="text-gray-700 dark:text-gray-300 font-medium">Sprawdzone metody przygotowania</span>
            </div>
          </div>
        </div>

        {/* Right Side - Login Card */}
        <div className="lg:max-w-lg mx-auto w-full">
          <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-xl">
            <CardHeader className="text-center p-8">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                Zaloguj się
              </h3>
              <CardDescription className="text-gray-600 dark:text-gray-300 text-lg">
                Wróć do swojego konta
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-8 pt-0">
              {/* Login Button */}
              <div className="space-y-6">
                <Button 
                  onClick={handleLogin}
                  size="lg"
                  className="w-full bg-gradient-to-r from-[#3B64D8] to-[#5B7FDB] hover:from-[#3B64D8]/90 hover:to-[#5B7FDB]/90 text-white py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-center">
                    Zaloguj się
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </div>
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300 dark:border-slate-600" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-slate-800 px-2 text-gray-500 dark:text-gray-400">
                      lub
                    </span>
                  </div>
                </div>

                <Button 
                  onClick={handleRegister}
                  variant="outline"
                  size="lg"
                  className="w-full py-4 text-lg font-semibold border-2 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Utwórz nowe konto
                </Button>
              </div>

              {/* Features Grid */}
              <div className="mt-10 pt-8 border-t border-gray-200 dark:border-slate-700">
                <h4 className="text-center text-gray-900 dark:text-white font-semibold mb-6">
                  Co Cię czeka po zalogowaniu:
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <div className="w-8 h-8 bg-[#3B64D8] rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white text-sm">Osobiste korepetycje</div>
                      <div className="text-gray-600 dark:text-gray-400 text-xs">Sesje jeden na jeden</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                    <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                      <Star className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white text-sm">System motywacji</div>
                      <div className="text-gray-600 dark:text-gray-400 text-xs">Punkty i postępy</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <div className="w-8 h-8 bg-[#5B7FDB] rounded-lg flex items-center justify-center">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white text-sm">Przygotowanie do egzaminu</div>
                      <div className="text-gray-600 dark:text-gray-400 text-xs">Klasa 8 - matematyka</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Note */}
              <div className="mt-8 flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <Shield className="w-4 h-4" />
                <span>Bezpieczne logowanie SSL</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}