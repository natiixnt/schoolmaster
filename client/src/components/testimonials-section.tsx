import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Anna Kowalska",
    location: "Klasa 8, Warszawa", 
    initials: "AK",
    bgColor: "bg-blue-600",
    textColor: "text-white",
    cardBg: "bg-gradient-to-br from-blue-50 to-indigo-100",
    quote: "Dzięki MateMaster zrozumiałam wreszcie funkcje! System punktów sprawił, że nauka stała się przyjemna. Egzamin zdałam na 98%!"
  },
  {
    name: "Piotr Nowak",
    location: "Klasa 8, Kraków",
    initials: "PN", 
    bgColor: "bg-accent",
    textColor: "text-navy-900",
    cardBg: "bg-gradient-to-br from-orange-50 to-yellow-100",
    quote: "Matematyka była moją najgorszą przedmiotem. Po 6 miesiącach z MateMaster to już mój ulubiony! Polecam każdemu ósmoklasiscie."
  },
  {
    name: "Maja Zielińska",
    location: "Klasa 8, Gdańsk",
    initials: "MZ",
    bgColor: "bg-emerald-600", 
    textColor: "text-white",
    cardBg: "bg-gradient-to-br from-emerald-50 to-green-100",
    quote: "Aplikacja mobilna to strzał w dziesiątkę! Mogę się uczyć w autobusie, w przerwie... Zdobyłam już wszystkie odznaki z algebry!"
  },
  {
    name: "Kacper Wiśniewski",
    location: "Klasa 8, Wrocław",
    initials: "KW",
    bgColor: "bg-slate-700", 
    textColor: "text-white",
    cardBg: "bg-gradient-to-br from-slate-50 to-gray-100",
    quote: "Korepetytor wyjaśnił mi geometrię tak prosto, że teraz to mój najlepszy dział! Polecam szczególnie lekcje z zadań słownych."
  },
  {
    name: "Zuzanna Jankowska",
    location: "Klasa 8, Poznań",
    initials: "ZJ",
    bgColor: "bg-violet-600",
    textColor: "text-white",
    cardBg: "bg-gradient-to-br from-violet-50 to-purple-100",
    quote: "Myślałam, że nigdy nie zrozumiem statystyki i prawdopodobieństwa. Dzięki interaktywnym ćwiczeniom i cierpliwości korepetytora zdałam na 95%!"
  },
  {
    name: "Filip Kowalczyk",
    location: "Klasa 8, Łódź", 
    initials: "FK",
    bgColor: "bg-rose-600",
    textColor: "text-white",
    cardBg: "bg-gradient-to-br from-rose-50 to-pink-100",
    quote: "System gamifikacji w SchoolMaster to genialne rozwiązanie! Zdobywanie punktów XP i odznak motywuje do nauki. Egzamin zdałem z najwyższym wynikiem w klasie!"
  }
];

export default function TestimonialsSection() {
  return (
    <section id="opinie" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-navy-900 mb-4">Co mówią nasi uczniowie?</h2>
          <p className="text-xl text-gray-600">
            Prawdziwe opinie od uczniów, którzy zdali egzamin dzięki MateMaster
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div key={index} className={`${testimonial.cardBg} rounded-2xl p-6 md:p-8 ${index >= 3 ? 'hidden md:block' : ''}`}>
              <div className="flex items-center mb-4">
                <div className={`w-12 h-12 ${testimonial.bgColor} rounded-full flex items-center justify-center mr-4`}>
                  <span className={`font-bold ${testimonial.textColor}`}>{testimonial.initials}</span>
                </div>
                <div>
                  <div className={`font-bold ${testimonial.cardBg === 'bg-navy-900 text-white' ? 'text-white' : testimonial.cardBg === 'bg-accent' ? 'text-navy-900' : 'text-navy-900'}`}>
                    {testimonial.name}
                  </div>
                  <div className={`text-sm ${testimonial.cardBg === 'bg-navy-900 text-white' ? 'text-blue-200' : testimonial.cardBg === 'bg-accent' ? 'text-navy-700' : 'text-gray-600'}`}>
                    {testimonial.location}
                  </div>
                </div>
              </div>
              <div className={`flex mb-4 ${testimonial.cardBg === 'bg-navy-900 text-white' ? 'text-accent' : testimonial.cardBg === 'bg-accent' ? 'text-navy-900' : 'text-accent'}`}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className={testimonial.cardBg === 'bg-navy-900 text-white' ? 'text-blue-100' : testimonial.cardBg === 'bg-accent' ? 'text-navy-800' : 'text-gray-700'}>
                "{testimonial.quote}"
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <img 
            src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400" 
            alt="Happy students celebrating math success" 
            className="rounded-2xl shadow-xl mx-auto w-full max-w-4xl"
          />
        </div>
      </div>
    </section>
  );
}
