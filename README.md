# AI-First Design Workflow

A bilingual (EN/RU) reference site for the SW Design Team: how a feature moves from brief to design review, which AI tools we use, and where to find things.

Live: https://masrus.github.io/ai-first-design-workflow/

## Pages

The site uses hash routes, so it works on GitHub Pages without a server.

| Route | What it shows |
|---|---|
| `#/workflow` | The six stages as cards |
| `#/workflow/table` | The same stages as a table |
| `#/workflow/stage-03` | Jumps to one stage (`stage-01` to `stage-06`) |
| `#/tools` | AI tools we built and set up |
| `#/tools/maestro` | Jumps to one tool card |
| `#/tools/sp-calculator` | The SP calculator |
| `#/lost` | "I'm lost": where things live in the team |
| `#/lost/terms` | Glossary |

Add `?lang=ru` to a route to open the Russian version. The site also picks the language from the browser and remembers the last choice.

## Develop

```bash
npm install
npm run dev
```

Open http://localhost:5173/ai-first-design-workflow/

## Deploy

```bash
npm run deploy
```

This builds the site and publishes `dist/` to the `gh-pages` branch. The source in `main` is not touched, so commit and push your changes separately.

The pages are marked `noindex, nofollow`. Search engines should skip them, but anyone with the link can open them.

## Where things are

- `src/app/App.tsx` holds all pages, data and copy: `stagesData` (stages), `toolsData` (tools), `lostSections` (the "I'm lost" page) and `glossary` (terms).
- `public/sp-calculator-main/` is the old standalone SP calculator. It is still served at `/sp-calculator-main/`.
- `src/app/components/ui/` and `default_shadcn_theme.css` are leftovers from the original Figma Make export. The site does not use them.
