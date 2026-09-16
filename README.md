# 🚚 Flowers Transport 

> **Profesjonalna aplikacja PWA dla kierowców i logistyki transportu kwiatów i roślin.**  
> Zarządzanie trasami, listami przewozowymi, opakowaniami zwrotnymi (CC, TAG, palety), korkami na autostradach oraz bazą klientów w jednym miejscu.

[![Angular](https://img.shields.io/badge/Angular-21.0-DD0031?style=flat&logo=angular&logoColor=white)](https://angular.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-12.6-FFCA28?style=flat&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

## 📋 Spis treści / Table of Contents

- [O projekcie / About The Project](#-o-projekcie--about-the-project)
- [Główne moduły i funkcjonalności / Features](#-główne-moduły-i-funkcjonalności--features)
- [Stos technologiczny / Tech Stack](#-stos-technologiczny--tech-stack)
- [Struktura katalogów / Project Structure](#-struktura-katalogów--project-structure)
- [Wymagania i instalacja / Installation](#-wymagania-i-instalacja--installation)
- [Dostępne skrypty / Available Scripts](#-dostępne-skrypty--available-scripts)
- [Konfiguracja Firebase & PWA / Configuration](#-konfiguracja-firebase--pwa)
- [Architektura aplikacji / Architecture](#-architektura-aplikacji--architecture)

---

## 🌟 O projekcie / About The Project

Aplikacja **Flowers Transport** została zaprojektowana z myślą o kierowcach zawodowych i dyspozytorach realizujących transport międzynarodowy (przewóz kwiatów i roślin między Polską, Niemcami i Holandią).

Umożliwia szybkie wprowadzanie danych na urządzeniach mobilnych bez konieczności ciągłego połączenia z Internetem (PWA + Service Worker), z automatyczną synchronizacją do bazy danych Firestore oraz generowaniem raportów i dokumentów w formacie PDF.

---

## 🚀 Główne moduły i funkcjonalności / Features

### 1. 📦 Zarządzanie opakowaniami (Packaging & Load Calculator)
- Śledzenie i kalkulacja wózków oraz opakowań transportowych:
  - **CC**, **CC-SH**, **KK**, **KK-SH**, **TAG-5**, **TAG-6**, **NC**, **EXT**
  - **EUROPALLETA**, **PALLETA**, skrzynki serii **520**, **533/544**, **560**, **566**, **577**, **588**, **595**, **596**, **597**, **598**, **555**, **TRAAY**, **OTHER**
- Wbudowany podręczny **Kalkulator** do sumowania partii ładunków z historią obliczeń i bezpośrednim zapisem do aktywnej listy.
- Bezpieczny mechanizm edycji z ostrzeganiem przed utratą niezapisanych zmian (`PendingChangesGuard`).
- Eksport zestawień oraz szybkie wysyłanie podsumowań przez **WhatsApp**.
- Zabezpieczenie danych per konto użytkownika (`scoped cache` i synchronizacja Firebase w czasie rzeczywistym).

### 2. 📑 Listy przewozowe (Waybills / Trasy)
- Tworzenie, przeglądanie i archiwizowanie dokumentów przewozowych dla poszczególnych tras.
- Filtrowanie po datach, statusach i numerach tras.
- Automatyczne generowanie plików **PDF** z pełnym zestawieniem ładunku przy użyciu `jsPDF` oraz `pdfmake`.

### 3. 🚦 Ruch drogowy i korki (Traffic & Cameras)
- Podgląd na żywo sytuacji drogowej, utrudnień i kamer na kluczowych trasach tranzytowych:
  - **A2** (Niemcy / Polska)
  - **A12** (Holandia / Niemcy)
  - **A30** (Niemcy)
  - **A10** (Obwodnica Amsterdamu / Ring)
- Zintegrowane mapy i aktualne informacje o zatorach dla kierowców.

### 4. 🏢 Baza klientów w Polsce (Klienci PL)
- Baza kontrahentów, hurtowni i punktów rozładunku kwiatów w Polsce.
- Wyszukiwanie, filtrowanie oraz szczegółowe informacje teleadresowe dla kierowców.

### 5. 📍 Lokalizacje załadunku (Load Locations)
- Baza giełd (np. Royal FloraHolland: Aalsmeer, Naaldwijk, Rijnsburg), ogrodników i magazynów załadunkowych.
- Koordynaty i wskazówki dojazdu.

### 6. 🚛 Flota pojazdów (Vehicle Fleet)
- Informacje o pojazdach, naczepach chłodniczych i przypisaniach sprzętu.

### 7. 🔒 Bezpieczeństwo i autoryzacja (Auth & Profiles)
- Logowanie i rejestracja kierowców za pomocą **Firebase Authentication**.
- Strażnicy routingu (`AuthGuard`, `StatusGuard`) chroniący wrażliwe funkcje przed nieuprawnionym dostępem.
- Zarządzanie profilem kierowcy.

### 8. 📱 PWA & Tryb Offline
- W pełni funkcjonalna aplikacja progresywna (możliwość instalacji na smartfonach z systemem Android oraz iOS).
- Obsługa pamięci podręcznej i pracy przy słabym lub zerowym zasięgu GSM.

---

## 🛠 Stos technologiczny / Tech Stack

- **Framework**: [Angular 21](https://angular.dev/) (Standalone Components, Signals, New Control Flow `@if` / `@for`)
- **Język**: TypeScript 5.9
- **Baza danych & Auth**: [Firebase 12](https://firebase.google.com/) (Authentication, Cloud Firestore, Realtime Sync)
- **Generowanie dokumentów**: `jspdf`, `jspdf-autotable`, `pdfmake`
- **PWA & Offline**: `@angular/service-worker`
- **Narzędzia developerskie**: Angular CLI 21, ESLint 9, Prettier, Vitest

---

## 📁 Struktura katalogów / Project Structure

```text
vliet-angular/
├── .github/                 # Konfiguracja CI/CD
├── public/                  # Statyczne zasoby publiczne (ikony, manifest PWA)
├── scripts/                 # Skrypty automatyzacji wersji i wdrożeń
│   ├── bump-version.mjs     # Automatyczne podbijanie wersji aplikacji
│   └── publish-version.mjs  # Skrypt publikacji wersji
└── src/
    ├── index.html           # Główny szablon HTML z meta tagami PWA
    ├── manifest.webmanifest # Manifest Progressive Web App
    └── app/
        ├── app.config.ts    # Konfiguracja aplikacji (Routing, PWA, Providers)
        ├── app.routes.ts    # Definicje tras aplikacji wraz z Guards
        ├── auth/            # Moduł logowania i rejestracji (Sign-in, Sign-up)
        ├── core/            # Serwisy singletonowe, guardy, modele bazowe
        │   ├── guard/       # AuthGuard, StatusGuard, PendingChangesGuard
        │   └── services/    # ListService, ModalService, AlertService, AuthService
        ├── features/        # Moduły funkcjonalne
        │   ├── packaking-manager-page/ # Kalkulator i zarządzanie opakowaniami
        │   ├── waybiils/               # Listy przewozowe i trasy
        │   ├── traffic-page/           # Ruch drogowy i kamery A2, A12, A30, A10
        │   ├── klienty-pl/             # Baza klientów w Polsce
        │   ├── load-location-page/     # Lokalizacje załadunków
        │   ├── vehicle-fleet-page/     # Flota pojazdów
        │   └── profile-page/           # Profil użytkownika
        ├── firebase/        # Klient i integracja z Firebase SDK
        └── shared/          # Współdzielone komponenty (modale, alerty, nagłówki)
```

---

## 💻 Wymagania i instalacja / Installation

### Wymagania wstępne:
- **Node.js**: `v20.x` lub `v22.x` (LTS zalecany)
- **npm**: `v10.x` lub nowszy
- **Angular CLI**: `npm install -g @angular/cli` (opcjonalnie)

### Krok po kroku:

1. **Sklonuj repozytorium:**
   ```bash
   git clone https://github.com/Dj-Rom/vliet-angular.git
   cd vliet-angular
   ```

2. **Zainstaluj zależności:**
   ```bash
   npm install
   ```

3. **Uruchom serwer developerski:**
   ```bash
   npm start
   ```
   Aplikacja uruchomi się pod adresem: `http://localhost:4200/`

---

## 📜 Dostępne skrypty / Available Scripts

W pliku `package.json` skonfigurowano następujące polecenia:

| Komenda | Opis |
| :--- | :--- |
| `npm start` | Uruchamia serwer developerski (`ng serve`) na porcie 4200 |
| `npm run build` | Buduje zoptymalizowaną wersję produkcyjną w katalogu `dist/` |
| `npm run watch` | Kompiluje aplikację w trybie śledzenia zmian |
| `npm run test` | Uruchamia testy jednostkowe (`ng test` / Vitest) |
| `npm run lint` | Analizuje jakość i styl kodu za pomocą ESLint |
| `npm run build:gh` | Buduje aplikację ze ścieżką bazową dla GitHub Pages |
| `npm run deploy` | Buduje i publikuje aplikację na GitHub Pages (`angular-cli-ghpages`) |

---

## ⚙️ Konfiguracja Firebase & PWA

- **Firebase**: Konfiguracja połączenia z Firebase Auth i Firestore znajduje się w `src/app/firebase/firebase.service.ts`.
- **PWA Service Worker**: Strategia cachowania zasobów i aktualizacji jest zdefiniowana w `ngsw-config.json`.
- **Manifest PWA**: Konfiguracja kolorów motywu, ikon oraz trybu pełnoekranowego znajduje się w `src/manifest.webmanifest`.

---

## 🏛 Architektura aplikacji / Architecture

- **Stan oparty o Angular Signals**: Reaktywne zarządzanie stanem komponentów i serwisów przy użyciu sygnałów (`signal()`, `computed()`, `effect()`), co zapewnia znakomitą wydajność renderowania.
- **Ochrona przed utratą danych (`PendingChangesGuard`)**: Użytkownik jest automatycznie ostrzegany, gdy próbuje opuścić edycję lub tworzenie formularza z niezapisanymi danymi.
- **Odporność na błędy sieci**: Kluczowe dane kalkulatora są zapisywane w `localStorage` z unikalnym prefiksem dla każdego zalogowanego użytkownika (`UID`), dzięki czemu nawet po utracie połączenia lub odświeżeniu strony dane nie giną.

---

## 👨‍💻 Autor / Author

- **Vliet Transport** / [Dj-Rom](https://github.com/Dj-Rom)
