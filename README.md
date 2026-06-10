# Hiper Academy — website

Een snelle, toegankelijke one-page website voor [hiperacademy.nl](https://hiperacademy.nl): dé moderne opleider voor AI, BI & Data (onderdeel van CUMLAUDE.AI).

## Stack

Pure HTML, CSS en vanilla JavaScript — geen build-stap, geen dependencies (alleen Google Fonts).

```
index.html       # structuur & content (Nederlands)
css/styles.css   # design system + alle styling
js/main.js       # scroll reveals, counters, tilt, typewriter, nav
```

## Lokaal bekijken

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Of open `index.html` direct in de browser.

## Design system

- **Stijl:** cinematic dark met aurora-gradients en glass-surfaces
- **Typografie:** Space Grotesk (koppen) + Inter (body)
- **Accent:** violet `#7C5CFF` → cyaan `#22D3EE` gradient
- **Motion:** `cubic-bezier(0.16, 1, 0.3, 1)`, 150–300ms micro-interacties, gestaggerde reveals
- **Toegankelijkheid:** WCAG AA-contrast, zichtbare focus states, skip-link, semantische HTML, `prefers-reduced-motion` volledig gerespecteerd, touch targets ≥ 44px
