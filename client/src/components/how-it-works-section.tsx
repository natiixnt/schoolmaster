const steps = [
  {
    number: 1,
    title: "Załóż konto",
    description: "Zarejestruj się i wykonaj test poziomujący, aby określić swój poziom matematyki",
    bgColor: "bg-navy-900",
    textColor: "text-white"
  },
  {
    number: 2,
    title: "Dopasowanie korepetytora",
    description: "Algorytm dobierze najlepszego nauczyciela na podstawie Twoich potrzeb i stylu nauki",
    bgColor: "bg-accent",
    textColor: "text-navy-900"
  },
  {
    number: 3,
    title: "Rozpocznij naukę",
    description: "Weź udział w interaktywnych lekcjach online i rozwiązuj zadania w czasie rzeczywistym",
    bgColor: "bg-navy-600",
    textColor: "text-white"
  },
  {
    number: 4,
    title: "Osiągnij sukces",
    description: "Śledź postępy, zdobywaj odznaki i przygotuj się perfekcyjnie do egzaminu",
    bgColor: "bg-navy-900",
    textColor: "text-white"
  }
];

export default function HowItWorksSection() {
  return (
    <section id="jak-dziala" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-navy-900 mb-4">Jak to działa?</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Prosty proces w 4 krokach do sukcesu na egzaminie
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center group">
              <div className={`w-20 h-20 ${step.bgColor} rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                <span className={`text-2xl font-bold ${step.textColor}`}>{step.number}</span>
              </div>
              <h3 className="text-xl font-bold text-navy-900 mb-4">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <img 
            src="https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400" 
            alt="Students solving math problems together" 
            className="rounded-2xl shadow-xl mx-auto w-full max-w-4xl"
          />
        </div>
      </div>
    </section>
  );
}
