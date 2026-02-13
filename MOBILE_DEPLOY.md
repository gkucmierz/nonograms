# Publikacja Aplikacji Mobilnej (Android & iOS)

Aplikacja została skonfigurowana z użyciem **Capacitor**, co pozwala na wydanie jej jako natywnej aplikacji na Androida i iOS.

## Wymagania wstępne

1.  **Node.js** (już masz).
2.  **Android Studio** (dla Androida).
3.  **Xcode** (dla iOS - tylko macOS).
4.  Konta deweloperskie:
    *   **Google Play Console** (jednorazowa opłata $25).
    *   **Apple Developer Program** (roczna opłata $99).

## Struktura projektu

*   `android/` - natywny projekt Androida.
*   `ios/` - natywny projekt iOS.
*   `dist/` - zbudowana aplikacja webowa (to, co widzi użytkownik).
*   `assets/` - ikony i ekrany startowe (użyj `npx capacitor-assets generate` po zmianie plików tutaj).

## Codzienny workflow (aktualizacja kodu)

Za każdym razem, gdy zmienisz kod JS/Vue:

1.  Zbuduj aplikację webową:
    ```bash
    npm run build
    ```
2.  Zsynchronizuj zmiany z projektami natywnymi:
    ```bash
    npx cap sync
    ```

---

## Generowanie Certyfikatów (dla Ionic Appflow / CI/CD)

Jeśli używasz **Ionic Appflow** do budowania aplikacji w chmurze, musisz wygenerować i wgrać odpowiednie certyfikaty podpisywania.

### Android (Google Play)

Potrzebujesz pliku **Keystore (.jks lub .keystore)**.

1.  **Opcja A (Terminal - jeśli masz Javę/JDK):**
    Uruchom w terminalu:
    ```bash
    keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
    ```
    *   Zostaniesz poproszony o hasło do magazynu kluczy (zapamiętaj je!).
    *   Podaj dane (Imię, Organizacja itp.).
    *   Na koniec potwierdź (`yes`).

2.  **Opcja B (Android Studio):**
    *   Otwórz projekt Androida w Android Studio (`npx cap open android`).
    *   Menu: **Build** -> **Generate Signed Bundle / APK**.
    *   Wybierz **Android App Bundle** -> Next.
    *   Pod polem "Key store path" kliknij **Create new...**.
    *   Wypełnij formularz (ścieżka, hasła, alias).
    *   Zakończ kreatora.

3.  **W Appflow:**
    *   Wgraj wygenerowany plik `.jks`.
    *   Podaj:
        *   **Keystore Password**: hasło, które ustawiłeś.
        *   **Key Alias**: nazwa aliasu (np. `my-key-alias` lub to co wpisałeś).
        *   **Key Password**: hasło do klucza (zazwyczaj to samo co do keystore).

### iOS (App Store)

Potrzebujesz certyfikatu **.p12** oraz profilu **.mobileprovision**.
Wymagany jest dostęp do komputera Mac i konta Apple Developer.

1.  **Certyfikat Dystrybucyjny (.p12):**
    *   Otwórz aplikację **Dostęp do pęku kluczy (Keychain Access)** na Macu.
    *   Menu: **Asystent certyfikatów** -> **Poproś urząd certyfikacji o certyfikat**.
    *   Wpisz swój email, wybierz "Zapisz na dysku" i kontynuuj -> Zapisz plik `.certSigningRequest` (CSR).
    *   Zaloguj się na [developer.apple.com](https://developer.apple.com).
    *   Idź do **Certificates, Identifiers & Profiles** -> **Certificates**.
    *   Kliknij **+**, wybierz **iOS Distribution (App Store and Ad Hoc)**.
    *   Wgraj swój plik CSR.
    *   Pobierz wygenerowany certyfikat `.cer`.
    *   Kliknij dwukrotnie w pobrany plik `.cer`, aby dodać go do Pęku kluczy.
    *   W Pęku kluczy znajdź ten certyfikat (np. "iPhone Distribution: Twoja Nazwa"), rozwiń go strzałką, aby widzieć "Klucz prywatny".
    *   Zaznacz **oba** (certyfikat i klucz prywatny), kliknij prawym -> **Eksportuj 2 rzeczy**.
    *   Zapisz jako plik `.p12` i ustaw hasło eksportu (zapamiętaj je!).

2.  **Profil Aprowizacji (.mobileprovision):**
    *   Na [developer.apple.com](https://developer.apple.com) idź do **Profiles**.
    *   Kliknij **+**, wybierz **App Store** (pod Distribution).
    *   Wybierz App ID swojej aplikacji (musi pasować do Bundle ID w projekcie).
    *   Wybierz certyfikat, który przed chwilą stworzyłeś.
    *   Nazwij profil (np. "Nonograms App Store") i pobierz plik `.mobileprovision`.

3.  **W Appflow:**
    *   Wgraj plik `.p12`.
    *   Wgraj plik `.mobileprovision`.
    *   Podaj hasło do pliku `.p12`.

---

## Android (Lokalnie)

### 1. Uruchomienie projektu
Otwórz projekt w Android Studio:
```bash
npx cap open android
```

### 2. Konfiguracja i Podpisywanie
W Android Studio:
1.  Poczekaj na "Gradle Sync".
2.  Zmień `applicationId` w `build.gradle` (Module: app) jeśli chcesz inną niż `pl.nonograms.app`.
3.  Menu: **Build** -> **Generate Signed Bundle / APK**.
4.  Wybierz **Android App Bundle**.
5.  Stwórz nowy klucz (Keystore) i zapamiętaj hasła (bezpiecznie!).
6.  Wygeneruj plik `.aab`.

### 3. Publikacja
1.  Zaloguj się do [Google Play Console](https://play.google.com/console).
2.  Utwórz nową aplikację.
3.  Uzupełnij informacje (opis, screenshoty, polityka prywatności).
4.  W sekcji "Production" prześlij wygenerowany plik `.aab`.

---

## iOS (Lokalnie)

### 1. Uruchomienie projektu
Otwórz projekt w Xcode:
```bash
npx cap open ios
```

### 2. Konfiguracja
W Xcode:
1.  Kliknij "App" w drzewie plików po lewej.
2.  W zakładce **Signing & Capabilities**:
    *   Wybierz swój "Team" (Twoje konto Apple ID).
    *   Upewnij się, że "Bundle Identifier" jest unikalny.
3.  W zakładce **General**:
    *   Ustaw numer wersji (Version) i kompilacji (Build).

### 3. Publikacja
1.  Wybierz urządzenie docelowe jako "Any iOS Device (arm64)".
2.  Menu: **Product** -> **Archive**.
3.  Po zakończeniu otworzy się "Organizer". Kliknij **Distribute App**.
4.  Wybierz **App Store Connect** -> **Upload**.
5.  Po przesłaniu, zaloguj się do [App Store Connect](https://appstoreconnect.apple.com), uzupełnij metadane i wyślij do recenzji.

---

## Ważne uwagi

*   **Bezpieczny obszar (Notch):** Aplikacja ma ustawione `viewport-fit=cover`, ale upewnij się, że UI nie chowa się pod notchem (w CSS używaj `env(safe-area-inset-top)`).
*   **Wstecz (Android):** Capacitor obsługuje przycisk wstecz sprzętowo, ale warto to przetestować.
*   **Permissions:** Jeśli w przyszłości dodasz pluginy (np. kamerę), musisz dodać uprawnienia w `AndroidManifest.xml` i `Info.plist`.
