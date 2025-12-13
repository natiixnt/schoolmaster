-- Initialize Math Topics for Sequential Learning
-- Format: MAT-L{number} for clear progression tracking

-- Basic Math Topics (Grade 8)
INSERT INTO math_topics (id, name, description, "order", difficulty_level, prerequisite_topic_ids, xp_reward, estimated_duration, is_active) VALUES
-- Foundation topics (no prerequisites)
('MAT-L01', 'Liczby naturalne i działania', 'Podstawowe operacje na liczbach naturalnych, kolejność działań', 1, 'podstawowy', '{}', 30, 60, true),
('MAT-L02', 'Dzielność liczb', 'Dzielniki, wielokrotności, liczby pierwsze i złożone', 2, 'podstawowy', '{"MAT-L01"}', 35, 60, true),
('MAT-L03', 'Ułamki zwykłe', 'Podstawowe operacje na ułamkach zwykłych', 3, 'podstawowy', '{"MAT-L01"}', 40, 75, true),
('MAT-L04', 'Ułamki dziesiętne', 'Zamiany i operacje na ułamkach dziesiętnych', 4, 'podstawowy', '{"MAT-L03"}', 40, 75, true),
('MAT-L05', 'Procenty', 'Obliczenia procentowe, procentowy wzrost i spadek', 5, 'podstawowy', '{"MAT-L04"}', 45, 60, true),

-- Algebra foundations
('MAT-L06', 'Wyrażenia algebraiczne', 'Podstawy algebry, upraszczanie wyrażeń', 6, 'podstawowy', '{"MAT-L01", "MAT-L03"}', 50, 90, true),
('MAT-L07', 'Równania liniowe', 'Rozwiązywanie równań liniowych z jedną niewiadomą', 7, 'podstawowy', '{"MAT-L06"}', 55, 90, true),
('MAT-L08', 'Układy równań liniowych', 'Rozwiązywanie układów równań metodą podstawień i przeciwnych współczynników', 8, 'średni', '{"MAT-L07"}', 60, 120, true),

-- Functions
('MAT-L09', 'Funkcja liniowa', 'Wzór funkcji liniowej, wykres, własności', 9, 'podstawowy', '{"MAT-L07"}', 55, 90, true),
('MAT-L10', 'Funkcja kwadratowa', 'Wprowadzenie do funkcji kwadratowej, parabola', 10, 'średni', '{"MAT-L09"}', 65, 120, true),

-- Geometry
('MAT-L11', 'Figury płaskie - podstawy', 'Trójkąty, czworokąty, koła - definicje i własności', 11, 'podstawowy', '{"MAT-L01"}', 40, 75, true),
('MAT-L12', 'Pola figur płaskich', 'Obliczanie pól trójkątów, prostokątów, kół', 12, 'podstawowy', '{"MAT-L11"}', 50, 90, true),
('MAT-L13', 'Twierdzenie Pitagorasa', 'Zastosowanie twierdzenia Pitagorasa', 13, 'średni', '{"MAT-L11"}', 60, 90, true),

-- Advanced topics
('MAT-L14', 'Potęgi i pierwiastki', 'Potęgi o wykładnikach naturalnych, pierwiastek kwadratowy', 14, 'średni', '{"MAT-L06"}', 55, 90, true),
('MAT-L15', 'Statystyka opisowa', 'Średnia arytmetyczna, mediana, rozstęp', 15, 'podstawowy', '{"MAT-L01"}', 45, 75, true);

-- Topic Materials for selected topics
INSERT INTO topic_materials (topic_id, title, type, url, content, is_required, "order") VALUES
-- MAT-L01 materials
('MAT-L01', 'Kolejność działań - teoria', 'pdf', 'https://example.com/mat-l01-teoria.pdf', NULL, true, 1),
('MAT-L01', 'Przykłady obliczeniowe', 'video', 'https://example.com/mat-l01-video', NULL, true, 2),
('MAT-L01', 'Ćwiczenia podstawowe', 'exercise', NULL, 'Oblicz: 1) 15 + 3 × 4, 2) (12 - 8) × 5, 3) 48 ÷ 6 + 7', true, 3),
('MAT-L01', 'Test sprawdzający', 'test', NULL, '{"questions": [{"q": "15 + 3 × 4 = ?", "answers": ["27", "72", "18"], "correct": 0}]}', true, 4),

-- MAT-L04 materials
('MAT-L04', 'Ułamki dziesiętne - wprowadzenie', 'pdf', 'https://example.com/mat-l04-intro.pdf', NULL, true, 1),
('MAT-L04', 'Zamiany między zapisami', 'video', 'https://example.com/mat-l04-zamiany', NULL, true, 2),
('MAT-L04', 'Działania na ułamkach dziesiętnych', 'exercise', NULL, 'Oblicz: 1) 2.5 + 3.7, 2) 4.8 - 1.25, 3) 0.6 × 0.4, 4) 2.4 ÷ 0.6', true, 3),
('MAT-L04', 'Zadania praktyczne', 'exercise', NULL, 'Zadanie: Kasia kupiła 2.5 kg jabłek po 3.20 zł za kg. Ile zapłaciła?', false, 4),

-- MAT-L07 materials
('MAT-L07', 'Równania liniowe - teoria', 'pdf', 'https://example.com/mat-l07-teoria.pdf', NULL, true, 1),
('MAT-L07', 'Metody rozwiązywania', 'video', 'https://example.com/mat-l07-metody', NULL, true, 2),
('MAT-L07', 'Równania podstawowe', 'exercise', NULL, 'Rozwiąż: 1) 2x + 5 = 13, 2) 3x - 7 = 8, 3) 5(x - 2) = 15', true, 3),
('MAT-L07', 'Zadania tekstowe', 'exercise', NULL, 'Suma dwóch kolejnych liczb naturalnych wynosi 25. Znajdź te liczby.', true, 4),
('MAT-L07', 'Test końcowy', 'test', NULL, '{"questions": [{"q": "2x + 5 = 13, x = ?", "answers": ["4", "8", "9"], "correct": 0}]}', true, 5);