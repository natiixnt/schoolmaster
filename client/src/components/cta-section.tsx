import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CTASection() {
  const handleGetStarted = () => {
    window.location.href = "/login";
  };

  return (
    <section className="py-20 bg-navy-900 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-[#ffffff]">Gotowy na matematyczny sukces?</h2>
        <p className="text-xl lg:text-2xl text-white/90 mb-8 max-w-2xl mx-auto">
          Dołącz do tysięcy uczniów, którzy już zdali egzamin ósmoklasisty dzięki SchoolMaster
        </p>
        
        <div className="flex justify-center mb-12">
          <Button 
            onClick={handleGetStarted}
            className="bg-accent text-navy-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-yellow-300 transform hover:scale-105 transition-all"
          >
            Rozpocznij za darmo - 7 dni próbnych
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-accent mb-2">7 dni</div>
            <div className="text-white/80">Bezpłatny okres próbny</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-accent mb-2">Bez zobowiązań</div>
            <div className="text-white/80">Możesz zrezygnować w każdej chwili</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-accent mb-2">24/7</div>
            <div className="text-white/80">Dostęp do platformy</div>
          </div>
        </div>
      </div>
    </section>
  );
}
