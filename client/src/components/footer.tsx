import { Calculator, Facebook, Instagram, Youtube } from "lucide-react";
import SchoolMasterLogo from "@/assets/schoolmaster-logo.png";

const footerLinks = {
  platform: [
    { name: "Jak to działa", href: "#" },
    { name: "Cennik", href: "#" },
    { name: "Korepetytorzy", href: "#" },
    { name: "Program nauki", href: "#" }
  ],
  help: [
    { name: "Centrum pomocy", href: "#" },
    { name: "Kontakt", href: "#" },
    { name: "FAQ", href: "#" },
    { name: "Wsparcie techniczne", href: "#" }
  ],
  company: [
    { name: "O nas", href: "#" },
    { name: "Kariera", href: "#" },
    { name: "Regulamin", href: "#" },
    { name: "Polityka prywatności", href: "#" }
  ]
};

export default function Footer() {
  return (
    <footer id="kontakt" className="bg-navy-900 text-white py-16 border-t border-navy-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <img 
                src={SchoolMasterLogo} 
                alt="SchoolMaster" 
                className="h-6"
              />
            </div>
            <p className="text-white/80 mb-6">
              Najlepsza platforma korepetycji matematyki dla ósmoklasistów w Polsce.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white/60 hover:text-accent transition-colors">
                <Facebook className="text-xl" />
              </a>
              <a href="#" className="text-white/60 hover:text-accent transition-colors">
                <Instagram className="text-xl" />
              </a>
              <a href="#" className="text-white/60 hover:text-accent transition-colors">
                <Youtube className="text-xl" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-6">Platforma</h3>
            <ul className="space-y-3">
              {footerLinks.platform.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-white/70 hover:text-accent transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-6">Pomoc</h3>
            <ul className="space-y-3">
              {footerLinks.help.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-white/70 hover:text-accent transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-6">Firma</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-white/70 hover:text-accent transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-navy-700 mt-12 pt-8 text-center">
          <p className="text-white/70">&copy; 2024 SchoolMaster. Wszystkie prawa zastrzeżone.</p>
        </div>
      </div>
    </footer>
  );
}
