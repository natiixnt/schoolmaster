import { Button } from "@/components/ui/button";
import SchoolMasterLogo from "@/assets/schoolmaster-logo.png";

export default function Navigation() {
  const handleLogin = () => {
    window.location.href = "/login";
  };

  const handleRegister = () => {
    window.location.href = "/register";
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <img 
              src={SchoolMasterLogo} 
              alt="SchoolMaster" 
              className="h-8"
            />
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection("jak-dziala")}
              className="text-gray-600 hover:text-[#252627] font-medium transition-colors"
            >
              Jak działa
            </button>
            <button 
              onClick={() => scrollToSection("korzyści")}
              className="text-gray-600 hover:text-[#252627] font-medium transition-colors"
            >
              Korzyści
            </button>
            <button 
              onClick={() => scrollToSection("opinie")}
              className="text-gray-600 hover:text-[#252627] font-medium transition-colors"
            >
              Opinie
            </button>
            <button 
              onClick={() => scrollToSection("kontakt")}
              className="text-gray-600 hover:text-[#252627] font-medium transition-colors"
            >
              Kontakt
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={handleLogin}
              className="text-[#5F5AFC] font-medium hover:text-[#4A69BD]"
            >
              Zaloguj się
            </Button>
            <Button 
              onClick={handleRegister}
              className="bg-[#F1C40F] text-[#252627] hover:bg-[#f39c12] font-semibold"
            >
              Załóż konto
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
