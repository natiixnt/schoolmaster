import { GraduationCap, Gamepad2, Clock, BarChart3, Medal, Smartphone } from "lucide-react";

const benefits = [
  {
    icon: GraduationCap,
    title: "Spersonalizowane podejście", 
    description: "Każdy uczeń otrzymuje indywidualny plan nauki dostosowany do jego poziomu i potrzeb. AI analizuje postępy i dostosowuje trudność zadań.",
    bgColor: "bg-[#252627]"
  },
  {
    icon: Gamepad2,
    title: "Gamifikacja nauki",
    description: "System punktów, odznak i poziomów sprawia, że nauka staje się przyjemnością. Rywalizuj z kolegami i zdobywaj osiągnięcia!",
    bgColor: "bg-[#F1C40F]"
  },
  {
    icon: Clock,
    title: "Elastyczne godziny",
    description: "Lekcje dostosowane do Twojego harmonogramu. Ucz się kiedy chcesz, gdzie chcesz - na komputerze, tablecie lub telefonie.",
    bgColor: "bg-[#5F5AFC]"
  },
  {
    icon: BarChart3,
    title: "Śledzenie postępów",
    description: "Szczegółowe raporty pokazują Twoje mocne strony i obszary wymagające poprawy. Rodzice mają wgląd w postępy dziecka.",
    bgColor: "bg-[#4A69BD]"
  },
  {
    icon: Medal,
    title: "Doświadczeni nauczyciele",
    description: "Tylko sprawdzeni nauczyciele z wieloletnim doświadczeniem w przygotowywaniu do egzaminu ósmoklasisty.",
    bgColor: "bg-[#252627]"
  },
  {
    icon: Smartphone,
    title: "Aplikacja mobilna",
    description: "Ucz się w podróży dzięki dedykowanej aplikacji mobilnej. Synchronizacja postępów między wszystkimi urządzeniami.",
    bgColor: "bg-[#F1C40F]"
  }
];

export default function BenefitsSection() {
  return (
    <section id="korzyści" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-[#252627] mb-4">Dlaczego SchoolMaster?</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Najskuteczniejsza platforma do nauki matematyki dla ósmoklasistów w Polsce
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow">
                <div className={`w-16 h-16 ${benefit.bgColor} rounded-xl flex items-center justify-center mb-6`}>
                  <Icon className={`text-2xl ${benefit.bgColor === 'bg-[#F1C40F]' ? 'text-[#252627]' : 'text-white'}`} />
                </div>
                <h3 className="text-2xl font-bold text-[#252627] mb-4">{benefit.title}</h3>
                <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
