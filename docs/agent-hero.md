# Agent Hero

The profile hero is generated as an animated SVG so it can run directly inside the GitHub README without JavaScript or external UI runtimes.

## Generate assets

```bash
node scripts/generate-agent-hero.mjs --source /absolute/path/to/portrait.jpg
```

The script produces desktop and mobile SVG assets for GitHub dark and light themes. The existing `assets/header.png` remains the stable PNG fallback in the README.

## Visual system

- Desktop assets use a compact `1180x610` console layout with a visual map and a structured system information panel.
- Mobile assets stack the portrait and information panels so the text remains legible instead of shrinking the desktop composition.
- The portrait uses a head-and-shoulders crop, a ten-character luminance ramp, and soft subject weighting to keep the face recognizable while reducing background noise.
- System information is grouped into identity, research direction, active builds, and profile links.

## Portrait privacy

Do not commit the original source portrait. The public repository should contain only the generated SVG assets and the existing profile fallback banner.

## Content source

The profile fields and portrait crop are intentionally maintained in `scripts/generate-agent-hero.mjs`. Keep them concise and evidence-based. The crop is tuned for the current source portrait and should be reviewed when the source image changes. The hero is a stable identity card; activity and changing project detail remain in the README sections below it.
