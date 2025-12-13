import { ArrowRight, CheckCircle, Users, Award, BookOpen, Shield, Target, Trophy, Sparkles } from "lucide-react";
import SchoolMasterLogo from "@/assets/schoolmaster-logo-auth.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";

export default function Register() {
  const handleRegister = () => {
    window.location.href = "/auth";
  };

  const handleLogin = () => {
    window.location.href = "/auth";
  };

  return (
    <div className="min-h-screen bg-[#252627] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 border-2 border-[#F1C40F] rounded-full"></div>
        <div className="absolute top-32 right-20 w-16 h-16 border-2 border-[#F1C40F] rounded-lg rotate-45"></div>
        <div className="absolute bottom-20 left-20 w-12 h-12 bg-[#F1C40F] rounded-full"></div>
        <div className="absolute bottom-32 right-32 w-24 h-24 border-2 border-[#F1C40F] rounded-lg"></div>
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <img 
              src={SchoolMasterLogo} 
              alt="SchoolMaster" 
              className="h-12"
            />
          </div>
          <h2 className="text-white text-2xl font-bold mb-2">
            Załóż darmowe konto
          </h2>
          <p className="text-white/70 text-base">
            Dołącz do tysięcy uczniów, którzy już zdali egzamin ósmoklasisty
          </p>
        </div>

        {/* Registration Card */}
        <Card className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden">
          <CardHeader className="text-center bg-gradient-to-r from-blue-50 to-yellow-50 p-8">
            <h3 className="text-2xl font-bold text-[#252627] mb-2 flex items-center justify-center gap-3">
              <Sparkles className="w-7 h-7 text-[#F1C40F]" />
              Rozpocznij swoją przygodę!
            </h3>
            <CardDescription className="text-[#252627]/80 text-base font-medium">
              Najlepszy wybór dla przygotowania do egzaminu ósmoklasisty
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-8">
            {/* Benefits */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-150 transition-all">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-navy-900 font-bold text-base">7 dni darmowego dostępu</h4>
                  <p className="text-navy-700 text-sm font-medium">Wypróbuj wszystkie funkcje bez opłat</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-150 transition-all">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-navy-900 font-bold text-base">Najlepsi korepetytorzy</h4>
                  <p className="text-navy-700 text-sm font-medium">Dostęp do wszystkich zweryfikowanych korepetytorów</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-r from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-150 transition-all">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-md">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-navy-900 font-bold text-base">System gamifikacji</h4>
                  <p className="text-navy-700 text-sm font-medium">Punkty, poziomy i odznaki za postępy</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-150 transition-all">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-navy-900 font-bold text-base">Materiały egzaminacyjne</h4>
                  <p className="text-navy-700 text-sm font-medium">Kompletne przygotowanie do egzaminu z matematyki</p>
                </div>
              </div>
            </div>

            {/* Register Button */}
            <Button 
              onClick={handleRegister}
              className="w-full bg-gradient-to-r from-navy-800 to-navy-900 hover:from-navy-900 hover:to-navy-800 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
            >
              <div className="flex items-center justify-center">
                Załóż darmowe konto
                <ArrowRight className="ml-3 h-5 w-5" />
              </div>
            </Button>

            <div className="mt-6 text-center">
              <p className="text-sm text-navy-700 font-medium">
                Masz już konto?{" "}
                <button 
                  onClick={handleLogin}
                  className="text-navy-900 font-bold hover:text-navy-800 transition-colors underline decoration-yellow-400 decoration-2 underline-offset-2 hover:decoration-yellow-500"
                >
                  Zaloguj się tutaj
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Success Stats & Trust Indicators */}
        <div className="mt-8 space-y-4">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <Shield className="w-4 h-4 text-yellow-400" />
              <span className="text-white text-sm font-bold">
                Bezpieczna rejestracja
              </span>
            </div>
          </div>
          
          {/* Success Stats */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
            <div className="text-center mb-4">
              <h3 className="text-white font-semibold text-lg">Dołącz do tysięcy zadowolonych uczniów</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/15 transition-colors">
                <div className="text-yellow-400 font-bold text-2xl">94%</div>
                <div className="text-white/80 text-sm">Zdawalność egzaminów</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/15 transition-colors">
                <div className="text-yellow-400 font-bold text-2xl">2847</div>
                <div className="text-white/80 text-sm">Zadowolonych uczniów</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/15 transition-colors">
                <div className="text-yellow-400 font-bold text-2xl">4.9</div>
                <div className="text-white/80 text-sm">Ocena platformy</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}