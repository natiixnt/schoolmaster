import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  const handleGetStarted = () => {
    window.location.href = "/login";
  };

  return (
    <section className="gradient-navy text-white py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight text-[#ffffff]">
                Przygotuj się do <span className="text-accent">egzaminu ósmoklasisty</span> z matematyki
              </h1>
              <p className="text-xl lg:text-2xl text-white/90 leading-relaxed">
                Spersonalizowane korepetycje online z doświadczonymi nauczycielami. Gamifikacja, postęp w czasie rzeczywistym i gwarancja sukcesu.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={handleGetStarted}
                className="bg-accent text-navy-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-yellow-300 transform hover:scale-105 transition-all"
              >
                Rozpocznij naukę
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center space-x-8 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-accent">98%</div>
                <div className="text-[#ffffff]">Wskaźnik zdawalności</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent">1500+</div>
                <div className="text-[#ffffff]">Zadowolonych uczniów</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent">50+</div>
                <div className="text-[#ffffff]">Ekspertów</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
              alt="Student learning math online" 
              className="rounded-2xl shadow-2xl w-full"
            />
            
            <div className="absolute -bottom-6 -left-6 bg-white rounded-xl p-6 shadow-xl">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-navy-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Twój postęp</div>
                  <div className="text-2xl font-bold text-navy-900">87%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
