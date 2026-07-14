# Agent Hero

The profile hero is generated as an animated SVG so it can run directly inside the GitHub README without JavaScript or external UI runtimes.

## Generate assets

```bash
node scripts/generate-agent-hero.mjs --source /absolute/path/to/portrait.jpg
```

The script produces desktop and mobile SVG assets for GitHub dark and light themes. The existing `assets/header.png` remains the stable PNG fallback in the README.

## Portrait privacy

Do not commit the original source portrait. The public repository should contain only the generated SVG assets and the existing profile fallback banner.

## Content source

The profile fields are intentionally maintained in `scripts/generate-agent-hero.mjs`. Keep them concise and evidence-based. The hero is a stable identity card; activity and changing project detail remain in the README sections below it.
