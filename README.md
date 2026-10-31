# Matte OS

Matte för åk 8 och åk 9 – en sak i taget. Statisk, offline-först PWA utan externa beroenden.

Live: https://hdbahub-blip.github.io/matte-os/

## Struktur
| Fil | Innehåll |
|---|---|
| `index.html` | skal |
| `css/app.css` | design (åk 9 vinröd, åk 8 marinblå + vinröd) |
| `js/math.js` | formelrendering + svarskontroll (tal, bråk, enheter, algebra-ekvivalens, grundpotensform) |
| `js/visuals.js` | 45 diagramtyper (SVG), styrs av uppgiftens data |
| `js/core.js` | skolplan HT-26, kapitel, restprov |
| `js/content9.js`, `js/content8.js` | 63 moment (Åk 9: 27, Åk 8: 36): förklaring, formelkort, exempel, guidad uppgift, övningar A–F, fällor |
| `js/engine.js` | lokal lagring, nivåer, rekommendation, sök, säkerhetskopia |
| `js/app.js` | gränssnitt |
| `sw.js` | service worker (offline, versionerad cache) |

## Tester
```
node tests/qa.js                         # matematik/innehåll – måste vara 0 fel
python3 -m http.server 8765 &            # lokal server
node tests/e2e.js http://localhost:8765/ # mobil end-to-end (kräver playwright)
```

## Ny version
Höj `VERSION` i `sw.js` och `?v=` i `index.html`/`sw.js` så hämtar installerade appar den nya versionen.

## Integritet
Ingen elevdata i koden. Framsteg, namn och restprovsdatum sparas bara i webbläsaren på enheten.

Granskningsrapport: `docs/AUDIT_V5.md`.
