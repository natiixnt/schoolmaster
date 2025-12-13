import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const faqs = [
  {
    question: "Czy MateMaster przygotuje moje dziecko do egzaminu ósmoklasisty?",
    answer: "Tak! Nasz program został opracowany zgodnie z najnowszą podstawą programową. 98% naszych uczniów zdaje egzamin ósmoklasisty z matematyki powyżej średniej krajowej. Oferujemy kompleksowe przygotowanie obejmujące wszystkie działy matematyki."
  },
  {
    question: "Ile kosztują korepetycje?",
    answer: "Każda lekcja kosztuje 100 zł. Możesz kupować pojedyncze lekcje lub pakiety ze zniżką. Wszystkie lekcje obejmują dostęp do platformy, materiałów i zadań. Pierwsze 7 dni to bezpłatny okres próbny z pełnym dostępem."
  },
  {
    question: "Jak często odbywają się lekcje?",
    answer: "Częstotliwość lekcji dostosowujemy do Twoich potrzeb. Zalecamy minimum 2 lekcje w tygodniu po 60 minut każda. Możesz również korzystać z dodatkowych sesji przed egzaminami lub gdy potrzebujesz pomocy z konkretnym tematem."
  },
  {
    question: "Czy mogę zmienić korepetytora jeśli nie będzie pasował?",
    answer: "Oczywiście! Zależy nam na tym, żeby każdy uczeń miał najlepszego korepetytora. Jeśli po pierwszych lekcjach stwierdzisz, że chcesz zmienić nauczyciela, pomożemy Ci znaleźć kogoś, kto lepiej odpowiada Twojemu stylowi nauki."
  },
  {
    question: "Czy mogę korzystać z platformy na telefonie?",
    answer: "Tak! SchoolMaster jest w pełni responsywny i ma dedykowaną aplikację mobilną dostępną na iOS i Android. Możesz rozwiązywać zadania, śledzić postępy i brać udział w lekcjach zarówno na komputerze, tablecie jak i telefonie."
  }
];

export default function FAQSection() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-navy-900 mb-4">Często zadawane pytania</h2>
          <p className="text-xl text-gray-600">
            Odpowiedzi na najważniejsze pytania rodziców i uczniów
          </p>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full text-left p-6 flex justify-between items-center hover:bg-gray-50 rounded-xl transition-colors"
              >
                <h3 className="text-lg font-semibold text-navy-900 pr-4">{faq.question}</h3>
                {openFAQ === index ? (
                  <ChevronUp className="text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="text-gray-400 flex-shrink-0" />
                )}
              </button>
              {openFAQ === index && (
                <div className="px-6 pb-6 pt-2 border-t border-gray-100">
                  <p className="text-gray-600 leading-relaxed text-base mt-3">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
