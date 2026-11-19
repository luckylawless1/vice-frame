[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/luckylawless1/vice-frame/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/luckylawless1/vice-frame/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# VICE FRAME — GTA-style Cover Art Maker

VICE FRAME is an offline web app that turns your photos and a caption into cover art in the style of GTA 6's posters: a multi-panel poster with white-framed panels, bold gradient lettering, a caption bar, stickers, and a Vice City sunset or neon colour grade — exported as a PNG to share.

Load up to as many photos as the layout has panels (your own, or the five built-in samples), click a panel to select it, drop a photo into it, drag to position it, zoom it, grade it, write your title, tagline and caption, and export. Everything runs locally in the browser from static files: no build step, no network requests, and your photos never leave your machine.

## Run it

```sh
node serve.ts
```

Then open the local page it prints (http://localhost:8080) in a desktop browser such as Chrome. Any static file server pointed at `app/` works just as well.

## What it does

- **Layouts (4):** Cover Star (one full-bleed hero), Collage Four (large panel, two stacked, one wide strip), Panel Grid (six panels in the classic three-column cover grid), Crew Wide (one wide panel over three).
- **Post sizes (3):** Square 1080×1080, Portrait 1080×1350, Landscape 1920×1080 — the export renders at exactly the chosen size.
- **Photo grades (4), per panel or all at once:** Clean, Vice Sunset (warm purple-to-gold gradient map), Neon Night (teal-and-pink night grade), Ink Poster (posterized with darkened edges and a halftone screen, for a printed-illustration feel).
- **Lettering:** the title in a pink-to-teal gradient with a heavy outline, a letter-spaced tagline, and a bold caption on a tilted pink bar.
- **Stickers:** original canvas-drawn palm tree, starburst badge, wanted stars and a retro striped sun, plus optional film grain.
- **Editing:** click a panel to select it, click a photo thumbnail to fill it, drag on the preview to pan, scroll or use the slider to zoom, arrow keys nudge (Shift for bigger steps).

## Entry program

`main.ts` (Node 22, standard library only) hands the entry in: it copies `app/` and `screenshots/` to the output directory (`MAKEFUN_OUTPUT_DIR`, or `/output` under the grader) and writes `dossier.json` there with `buildDossier` from `vendor/makefun-app.ts`.

## Fonts

The cover lettering uses **Anton** (masthead) and **Archivo Black** (taglines, captions, UI headings), both under the SIL Open Font License 1.1. The font files and their license texts live in `app/fonts/` (`OFL-Anton.txt`, `OFL-ArchivoBlack.txt`).

## License

MIT — see `LICENSE`.
