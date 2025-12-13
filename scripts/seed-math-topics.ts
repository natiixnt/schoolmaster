import { db } from "../server/db";
import { mathTopics } from "@shared/schema";

const polishMathTopics = [
  {
    id: "1",
    name: "Liczby naturalne i działania",
    description: "Podstawowe operacje na liczbach naturalnych, rozwinięcia dziesiętne, dzielenie z resztą",
    order: 1,
    difficultyLevel: "podstawowy",
  },
  {
    id: "2", 
    name: "Ułamki zwykłe i dziesiętne",
    description: "Dodawanie, odejmowanie, mnożenie i dzielenie ułamków, zamiana na procenty",
    order: 2,
    difficultyLevel: "podstawowy",
  },
  {
    id: "3",
    name: "Liczby ujemne",
    description: "Działania na liczbach ujemnych, porządkowanie liczb, moduł liczby",
    order: 3,
    difficultyLevel: "podstawowy",
  },
  {
    id: "4",
    name: "Potęgi i pierwiastki",
    description: "Potęgi o wykładnikach naturalnych, pierwiastek kwadratowy, notacja wykładnicza",
    order: 4,
    difficultyLevel: "rozszerzony",
  },
  {
    id: "5",
    name: "Wyrażenia algebraiczne",
    description: "Dodawanie i odejmowanie wyrażeń algebraicznych, mnożenie przez liczbę",
    order: 5,
    difficultyLevel: "podstawowy",
  },
  {
    id: "6",
    name: "Równania liniowe",
    description: "Rozwiązywanie równań liniowych z jedną niewiadomą, problemy słowne",
    order: 6,
    difficultyLevel: "podstawowy",
  },
  {
    id: "7",
    name: "Proporcjonalność",
    description: "Wielkości wprost i odwrotnie proporcjonalne, skala, procenty",
    order: 7,
    difficultyLevel: "podstawowy",
  },
  {
    id: "8",
    name: "Figury płaskie",
    description: "Pole i obwód trójkątów, czworokątów, koła. Twierdzenie Pitagorasa",
    order: 8,
    difficultyLevel: "podstawowy",
  },
  {
    id: "9",
    name: "Bryły",
    description: "Objętość i pole powierzchni graniastosłupów, ostrosłupów, walca i stożka",
    order: 9,
    difficultyLevel: "rozszerzony",
  },
  {
    id: "10",
    name: "Funkcje",
    description: "Odczytywanie i interpretacja wykresów, funkcja liniowa",
    order: 10,
    difficultyLevel: "rozszerzony",
  },
  {
    id: "11",
    name: "Statystyka",
    description: "Średnia arytmetyczna, mediana, rozstęp, interpretacja danych",
    order: 11,
    difficultyLevel: "podstawowy",
  },
  {
    id: "12",
    name: "Prawdopodobieństwo",
    description: "Zdarzenia losowe, prawdopodobieństwo klasyczne, drzewo zdarzeń",
    order: 12,
    difficultyLevel: "rozszerzony",
  },
];

export async function seedMathTopics() {
  try {
    console.log("Seeding math topics...");
    
    for (const topic of polishMathTopics) {
      await db
        .insert(mathTopics)
        .values(topic)
        .onConflictDoNothing();
    }
    
    console.log("Math topics seeded successfully!");
  } catch (error) {
    console.error("Error seeding math topics:", error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedMathTopics().then(() => process.exit(0));
}