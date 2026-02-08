# Dokumentacja Architektury SOLID + Vue 3

Ten projekt został przepisany zgodnie z zasadami SOLID i najlepszymi praktykami Vue 3.

## Implementacja Zasad SOLID

### S - Single Responsibility Principle (Zasada Jednej Odpowiedzialności)
Każdy komponent i plik ma jedną, ściśle określoną rolę:
- **`components/Cell.vue`**: Odpowiada TYLKO za wyświetlanie pojedynczej komórki i emitowanie zdarzeń kliknięcia. Nie wie nic o logice gry.
- **`components/Hints.vue`**: Odpowiada TYLKO za wyświetlanie liczb (podpowiedzi).
- **`composables/useNonogram.js`**: Zawiera logikę interakcji (kliknięcia, efekty).
- **`stores/puzzle.js`**: Zarządza stanem aplikacji (grid, level, timer).

### O - Open/Closed Principle (Zasada Otwarte/Zamknięte)
System jest otwarty na rozszerzenia, ale zamknięty na modyfikacje:
- **Nowe poziomy**: Można dodać nowe zagadki w `stores/puzzle.js` (obiekt `PUZZLES`) bez zmieniania logiki renderowania siatki czy sprawdzania wygranej.
- **Theme/Styl**: Style są oparte na zmiennych CSS (`main.css`), co pozwala na łatwą zmianę motywu bez ingerencji w komponenty.

### L - Liskov Substitution Principle (Zasada Podstawienia Liskov)
W kontekście Vue, komponenty są wymienne i przewidywalne:
- Komponenty `Cell` i `Hints` przyjmują proste propsy (`state`, `hints`) i nie polegają na "magicznych" globalnych stanach wewnątrz swojej struktury renderowania (poza wstrzykiwanym storem w kontenerach wyższego rzędu).

### I - Interface Segregation Principle (Zasada Segregacji Interfejsów)
Komponenty otrzymują tylko te dane, których potrzebują:
- `Cell.vue` otrzymuje tylko `state`, `r`, `c`. Nie dostaje całego obiektu `puzzle` ani `store`.
- `Hints.vue` otrzymuje tylko tablicę liczb, a nie całą logikę gry.

### D - Dependency Inversion Principle (Zasada Odwrócenia Zależności)
Wysokopoziomowe moduły nie zależą od niskopoziomowych szczegółów:
- **Pinia Store**: Logika gry jest wstrzykiwana przez `usePuzzleStore`. Komponenty UI (`Controls`, `GameBoard`) zależą od abstrakcji store'a, a nie od konkretnej implementacji logiki wewnątrz komponentu.
- **Composables**: Logika (`useHints`, `useTimer`) jest wydzielona do reużywalnych funkcji, co uniezależnia ją od cyklu życia konkretnego komponentu Vue.

## Struktura Projektu

- `src/components/`: Komponenty "głupie" (prezentacyjne) oraz kontenery.
- `src/composables/`: Logika biznesowa (Hooki).
- `src/stores/`: Globalny stan aplikacji (Pinia).
- `src/styles/`: Globalne style i zmienne.

## Uruchomienie

1. `npm install`
2. `npm run dev`
