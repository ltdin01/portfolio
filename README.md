# Jay Chandak — portfolio

A hand-built, single-page portfolio. No framework, no build step: `index.html`, one stylesheet, one small script.

## The idea

The whole site borrows the visual language of the **Mumbai suburban railway**: the yellow station sign, the printed timetable, the strip map above a local train's doors, and the ticket stub.

| Section | Railway object | What it does |
|---|---|---|
| Header | Route line | Navigation that also shows reading progress, plus a live Mumbai (IST) clock |
| Hero | Station sign | Name in Devanagari and English, on posts |
| 01 Departures | Timetable | Projects as "services". Filter by line (AI / Backend / Interface / Data); each one opens to show its architecture drawn as a transit route |
| 02 The line so far | Strip map | Education and experience as stations, with the next stop left open |
| 03 About | Notice to passengers | Bio and the rules I build by |
| 04 Ticket | Ticket stub | Contact. Copying the address punches the ticket |

The four line colours (vermilion, harbour blue, signal yellow, signal green) only ever mean a discipline. Everything else is ink on newsprint.

**Type:** Anek Latin + Anek Devanagari (Ek Type, Mumbai), Newsreader, IBM Plex Mono. All self-hosted in `assets/fonts/`. The Devanagari file is subset to the handful of glyphs the page uses, so it stays small.

## Editing

- **Projects** live in `index.html` as `<details class="svc">` blocks. `data-lines` sets which line filters a project belongs to (`ai be ui da`). The `<ol class="diagram">` is the route drawing: `class="fork"` on a station shows two alternatives, and `class="end"` marks the terminus.
- **If you add Devanagari text**, re-subset the font so the new glyphs exist (needs `pip install fonttools brotli`, starting from the full Anek Devanagari variable font):

  ```bash
  python3 -c "from fontTools.ttLib import TTFont; from fontTools.varLib import instancer; f=instancer.instantiateVariableFont(TTFont('AnekDevanagari.ttf'), {'wdth':100,'wght':(500,600)}); f.save('deva.ttf')"
  pyftsubset deva.ttf --text="<all Devanagari characters on the page>" --layout-features='*' --flavor=woff2 --output-file=assets/fonts/anek-devanagari.woff2
  ```
- **Status messages** next to "Right now" are in `assets/js/site.js` (`statusFor`).

## Accessibility & details

- Works without JavaScript: the project rows are native `<details>`, so the filter and clock are the only things that need JS.
- Keyboard focus is visible everywhere, and nothing relies on colour alone (every line pill has a label).
- Honours `prefers-reduced-motion`. Has a print stylesheet that opens every project.
- Deep links work: `/#stockpulse` opens that project.
- Checked with axe-core (WCAG 2.1 AA): no violations.

## Run locally

```bash
python3 -m http.server 8000
```

## Deploy

It's a static site, so Vercel serves it as-is. `vercel.json` adds long-term caching for fonts. Once the domain is known, make the `og:image` URL in `index.html` absolute so link previews work everywhere.
