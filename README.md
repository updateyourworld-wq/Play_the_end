# PLAY THE END

**UPDATE YOUR WORLD presents PLAY THE END.**

The world has resources. You have a fleet. Time to go shopping.

In this naval battle against the Earth, uncover the forests, water, minerals and land hidden on the grid. Protect your cargo ships and their precious trinkets. But beware: **the more you succeed, the harder the planet fights back.**

Starting conditions draw on public data: weather modelled by [Open-Meteo](https://open-meteo.com/en/docs), air quality from [CAMS / Copernicus](https://open-meteo.com/en/docs/air-quality-api), and earthquakes recorded by the [USGS](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php). A pilot also uses maritime traffic counts from [PortWatch](https://portwatch.imf.org/?stream=top) at Suez. Heat, dry air and pollution raise the pressure; wind and earthquakes influence the planet's retaliation.

These signals become fictional game rules, not a scientific simulation. The map remains procedural, and clearly labelled demo data takes over when needed.

**Buy every resource, save your cargo... is that really winning?**

## Play

A static web game, with no installation required. The entry point is `index.html`.

[Play in your browser](https://updateyourworld-wq.github.io/Play_the_end/).

Advertisements are intentionally disabled in this test version.

## Data and Rules

Buying resources increases the cataclysm. The map and its hidden resources are generated, not measured deposits. Stale maritime observations do not affect the starting pressure, and traffic data does not move the ships. The PortWatch daily pilot currently covers Suez only.

## Credits

- Concept, rules, art direction and original drawings: Chanic.
- Code, interface, technical integration, scenery, sprites and animations: Codex (OpenAI).
- Original music: Chanic / Blackpoodle Records; remastered with Suno.
- Bonus fanzine: WILDIYZNEY WORLD, Irvin Flesh.
- Icons: Lucide, adapted into pixel-art sprites.

Font licences are included in `polices-pixel`. Publishing this repository does not automatically grant permission to reuse the music, drawings or fanzine.

## Test Version

Prototype v17, October 13, 2026. Eleven local DOM/audio/Canvas test suites passed. The public GitHub Pages version was checked in-browser: loading screen, home, region selection, live data, game start, a grid click and the following retaliation. A full playthrough on the hosted version has not yet been tested.

Only runtime files and their checksum manifest are included. Earlier proposals and working files are excluded.
