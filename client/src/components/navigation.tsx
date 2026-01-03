import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import SchoolMasterLogo from "@/assets/schoolmaster-logo.png";
import { Menu } from "lucide-react";

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
              className="h-8 w-auto max-w-none object-contain"
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

          <div className="hidden md:flex items-center space-x-4">
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

          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Otwórz menu">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col gap-2 mt-8">
                  {[
                    { id: "jak-dziala", label: "Jak działa" },
                    { id: "korzyści", label: "Korzyści" },
                    { id: "opinie", label: "Opinie" },
                    { id: "kontakt", label: "Kontakt" },
                  ].map((item) => (
                    <SheetClose asChild key={item.id}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => scrollToSection(item.id)}
                      >
                        {item.label}
                      </Button>
                    </SheetClose>
                  ))}
                  <SheetClose asChild>
                    <Button 
                      variant="ghost"
                      onClick={handleLogin}
                      className="w-full justify-start text-[#5F5AFC] hover:text-[#4A69BD]"
                    >
                      Zaloguj się
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button 
                      onClick={handleRegister}
                      className="w-full bg-[#F1C40F] text-[#252627] hover:bg-[#f39c12] font-semibold"
                    >
                      Załóż konto
                    </Button>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
