# Matte OS 5.5.1 – manuellt acceptansprotokoll (riktiga enheter och elever)

Automatiska tester (CI, Chromium-emulering av iPhone/Pixel) bevisar **inte** Safari/WebKit, riktiga pekskärmar, skärmläsare, nätverksbyten eller att elever förstår. Det här protokollet täcker det. Kör det på en förhandsvisning av PR #11, inte i produktion. Inga riktiga namn i Cup.

**Underlag:** 1 iPhone (Safari), 1 Android (Chrome), helst en enhet som redan har 5.5.0 med elevframsteg. För Cup: 1 värd + så många mobiler som möjligt (mål 10), blandat Wi-Fi/4G. Fyll i *Resultat* med ✅/❌ och en kort notering.

## A. Uppgradering och elevdata (kritiskt – stoppa vid ❌)
| # | Gör | Förväntat | Resultat |
|---|---|---|---|
| A1 | På enhet med 5.5.0: notera nivå/framsteg på ett moment. Öppna förhandsvisningen två gånger. | Inställningar visar `Matte OS 5.5.1`. | |
| A2 | Jämför samma moment. | Samma nivå/framsteg som före. Inget nollställt. | |
| A3 | Flygplansläge, stäng och öppna appen. Gå till Hem, Förstå, ett moment, Tabellarenan. | Allt öppnas och visar innehåll offline. | |
| A4 | Inställningar → *Spara säkerhetskopia*, sedan *Återställ från fil* med samma fil. | Fil sparas; återställningen ger samma framsteg. | |

## B. Elevflöde (2–3 elever, helst en som tycker matte är svårt)
Säg bara: *"Du ska lära dig något om area/potenser. Börja här."* Hjälp inte. Mät tid och var de tvekar.
| # | Gör | Pass-kriterium | Resultat |
|---|---|---|---|
| B1 | Eleven öppnar appen och väljer årskurs. | Hittar själv *Förstå matte* på < 30 s. | |
| B2 | Åk 8: *Area* · Åk 9: *Potenser*. Läs första sidan. | Ser tre steg och svaret utan att trycka mer. | |
| B3 | Fråga: "Förklara med egna ord." | Åk 8: area 4 × 3 = 12 rutor = 12 cm². Åk 9: (0,1)² är *en tiondel av en tiondel* = 0,01 (inte "flytta kommat"). | |
| B4 | *Prova med stöd*, svara fel med avsikt. | Ledtråden passar ämnet och avslöjar inte svaret. | |
| B5 | *Gör själv* 3 uppgifter. | Klarar ≥ 2 av 3, utan att fastna i navigeringen. | |
| B6 | Tryck ✕/tillbaka mitt i. | Hamnar där hen kom ifrån; *Fortsätt · steg N av 3* stämmer på Hem. | |
| B7 | Öppna *Matte Prov* och gör 3 frågor. | Inga ledtrådar, ingen formel, inget rätt/fel före inlämning. Rättning visas efteråt. | |

## C. Tabellarenan
| # | Gör | Förväntat | Resultat |
|---|---|---|---|
| C1 | Öppna 7:ans tabell, träna 10 frågor. | Siffertangentbord visas; svar rättas direkt. | |
| C2 | Slå på *automatiskt nästa efter rätt svar*. Svara rätt, sedan fel. | Rätt → går vidare själv efter ca 2 s. Fel → rättningen står kvar tills *Nästa* trycks. | |
| C3 | iPhone: Inställningar → Hjälpmedel → Rörelse → *Reducera rörelse* på. | Valet för automatiskt nästa visas inte. | |

## D. Cup (värd + mobiler, riktig spelserver)
| # | Gör | Förväntat | Resultat |
|---|---|---|---|
| D1 | Värd: *Spela tillsammans* → *Skapa spel*. | Ett tryck på *Skapa spel och visa koden* räcker; 30 s per fråga förvalt. | |
| D2 | Spelare: skanna QR med kameran. Minst en skriver koden manuellt. | Alla hamnar i lobbyn; dubbelt smeknamn får siffra. | |
| D3 | Värd: *Kopiera inbjudningslänken*. | Länken kopieras (eller markeras om kopiering nekas). | |
| D4 | Mitt i en runda: en spelare laddar om, en låser skärmen 20 s, en kör flygplansläge 10 s, en byter Wi-Fi→4G. | Alla kommer tillbaka till samma spel utan dubbel plats; banner vid nätbortfall. | |
| D5 | Under kvalet. | Ingen skärm visar rätt/fel eller facit; efter rundan topplista och egen genomgång. | |
| D6 | Spela till prispall. | Placeringar stämmer; spelet avslutas för alla. | |
| D7 | Efter spelet: kolla elevernas Matte OS-framsteg. | Oförändrade av Cup. | |

## E. Tillgänglighet (minst en enhet)
| # | Gör | Förväntat | Resultat |
|---|---|---|---|
| E1 | VoiceOver (iOS) eller TalkBack: Hem → ett moment → en uppgift. | Rubrik läses upp efter sidbyte; knappar har begripliga namn. | |
| E2 | Tangentbord (dator): Tab genom Hem, Formler-blad, Cup-studieläge med dolda svar. | Synlig fokusram; Enter/mellanslag visar dolt svar; fokus återvänder efter stängt blad. | |

## Beslut
- **GO för bred publicering** endast om alla A-rader och B2–B4, B7, C2, D1–D5 är ✅.
- Enstaka ❌ i E eller kosmetiska avvikelser → notera, publicera kontrollerat, åtgärda i 5.5.2.
- ❌ i A eller D7 (elevdata) → **STOPP**, rapportera i PR #11 med skärmdump.
