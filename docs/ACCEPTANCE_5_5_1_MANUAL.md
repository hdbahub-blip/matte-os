# Matte OS 5.5.1 – manuellt acceptansprotokoll (riktiga enheter och elever)

Automatiska tester (CI, Chromium-emulering av iPhone/Pixel) bevisar **inte** Safari/WebKit, riktiga pekskärmar, skärmläsare, nätverksbyten eller att elever förstår. Det här protokollet täcker det. Del B–E kan köras på en förhandsvisning av PR #11. Del A har egna krav (se nedan). Aldrig i produktion, aldrig med riktiga elevdata i testmiljön. Inga riktiga namn i Cup.

**Underlag:** 1 iPhone (Safari), 1 Android (Chrome). För Cup: 1 värd + så många mobiler som möjligt (mål 10), blandat Wi-Fi/4G. Fyll i *Resultat* med ✅/❌ och en kort notering.

## A. Uppgradering 5.5.0 → 5.5.1 på riktig enhet (kritiskt – stoppa vid ❌)

**Varför samma adress krävs:** elevframsteg (`matteos.v5`) och service worker är knutna till webbläsarens *origin* (protokoll + värd + port). En förhandsvisning på en annan domän börjar med tom lagring och testar därför **inte** uppgradering – den visar bara en ny installation. Uppgraderingen är bara bevisad om 5.5.0 och 5.5.1 öppnas på **exakt samma webbadress**, efter varandra.

**Separat testmiljö – krav:**
- En egen **HTTPS-test-origin** som **inte** är `https://hdbahub-blip.github.io` (produktionen ligger på `https://hdbahub-blip.github.io/matte-os/`). Alla GitHub Pages-projekt under samma konto delar origin och webbläsarlagring, även om URL-sökvägen skiljer sig. Använd exempelvis ett separat testkonto/testorganisation på GitHub Pages eller en isolerad HTTPS-förhandsvisning. En vanlig lokal nätverksadress med `http://<datorns-ip>:8080/` duger **inte** för service-worker/offline-acceptans på en annan fysisk telefon, eftersom den normalt inte är en säker origin.
- Testenheter eller en separat webbläsarprofil **utan** riktiga elevdata. Endast **syntetiska** testdata (påhittat namn, framsteg du själv skapar).
- 5.5.0 = commit `7f87feeac11fc4800b05cbee0cfded415b1052ff`. 5.5.1 = slutlig PR-head. Byt innehåll på **samma** adress mellan stegen; ändra inte URL:en.

| # | Gör | Förväntat | Resultat |
|---|---|---|---|
| A1 | Lägg ut **5.5.0** på testadressen. Öppna den på enheten, välj årskurs, skriv ett påhittat namn i Inställningar, öppna ett moment till *Prova med stöd* och svara på en fråga i 7:ans tabell. Notera adressen exakt. | Inställningar visar `Matte OS 5.5.0`. | |
| A2 | Skriv ner synliga framsteg: namn, momentets nivå, Tabellarenans resultat för 7:an. Spara även en säkerhetskopia (*Spara säkerhetskopia*). | Fil sparas. | |
| A3 | Ersätt innehållet på **samma adress** med **5.5.1**. Öppna appen på enheten två gånger (stäng helt emellan) med **samma** URL som i A1. | Inställningar visar `Matte OS 5.5.1`. URL:en är identisk med A1. | |
| A4 | Jämför med A2. | Samma namn, nivå och tabellresultat. Hem visar *Fortsätt · steg 2 av 3* för momentet. Inget nollställt. | |
| A5 | Flygplansläge, stäng och öppna appen. Gå till Hem, Förstå, momentet, Tabellarenan. | Allt öppnas offline och visar 5.5.1. | |
| A6 | Inställningar → *Nollställ framsteg* (två tryck), sedan *Återställ från fil* med filen från A2. | Framstegen från A2 kommer tillbaka. | |

En förhandsvisning av PR #11 på en annan domän räknas **inte** som godkänd A-del, hur väl den än fungerar.

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
- **GO för bred publicering** endast om alla A-rader, B2–B4, B7, C2, D1–D5 och E1–E2 saknar releaseblockerande fel.
- ❌ i A eller D7 (elevdata) → **STOPP**, rapportera i PR #11 med skärmdump.
- **Tillgänglighet som hindrar användning är releaseblockerande, inte kosmetisk.** STOPP om en elev med skärmläsare, tangentbord eller förstorad text **inte kan** göra något av följande: välja årskurs, öppna och läsa en förklaring, svara på en uppgift och få återkoppling, öppna och lämna in Matte Prov, öppna Tabellarenan, gå med i Cup. Exempel på blockerande fel: knapp utan uppläst namn, fokus som fastnar eller försvinner, svarsfält som inte går att nå, återkoppling som aldrig läses upp, innehåll som täcks eller klipps vid förstorad text.
- Endast avvikelser som **inte** hindrar någon från kärnfunktionerna (t.ex. ojämn fokusring, otydlig men begriplig uppläsning, kosmetisk layout) → notera, publicera kontrollerat, åtgärda i 5.5.2.
