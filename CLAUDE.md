# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a Jekyll-based personal website (jmac.co) featuring a retro 80s/vaporwave aesthetic with blog posts primarily about Crash Twinsanity game development. The site is hosted on GitHub Pages.

## Commands

### Jekyll Site

```bash
bundle exec jekyll serve  # Start local development server
```

**Important**: Changes to `_config.yml` require a server restart.

### Isotube

Isotube (the React YouTube playlist manager) now lives in its **own repository**
and deploys independently to `https://isotube.jmac.co`. It is no longer part of
this repo. The `isotube/` directory here contains only a static redirect page
(`isotube/index.html`) that forwards the old `jmac.co/isotube/` URL to the new
subdomain.

## Deployment Workflow

1. Test Jekyll locally: `bundle exec jekyll serve` (http://localhost:4000)
2. Commit all changes
3. Push to main branch
4. GitHub Pages automatically builds and deploys

## Architecture

### Jekyll Structure

- **Posts**: Located in `_posts/` with format `YYYY-MM-DD-title.md`
- **Layouts**: Custom retro-themed layouts in `_layouts/`
  - `default-retro.html`: Main layout with vaporwave aesthetic, grid backgrounds, neon effects
  - `post.html`: Blog post wrapper (extends default-retro)
- **Includes**: Reusable components in `_includes/`
  - `youtube.html`: YouTube embed partial (usage: `{% include youtube.html id="VIDEO_ID" %}`)
- **Styling**: Custom SCSS in `_sass/` + Bulma framework
  - `_main.scss`: Custom CSS variables for neon colors, grid effects
  - `_gradients.scss`, `_textfx.scss`, `_scanlines.scss`: Retro visual effects
  - `bulma/`: Full Bulma CSS framework

### Post Front Matter Structure

```yaml
---
layout: post
title: "Post Title"
date: YYYY-MM-DD HH:MM:SS +0000
categories: crash-twinsanity
permalink: custom-url
youtube_id: VIDEO_ID  # Optional, for YouTube embeds
---
```

### Key Visual Elements

The site features a distinctive retro aesthetic:
- Background scene rendered with three.js into one fixed `<canvas class="retro-canvas">` (`assets/js/retro-scene.js`; three.js loaded from CDN via an import map in `head-retro.html`). It draws the gradient sky, the scrolling perspective grid with its cursor spotlight, the logo with its floor reflection, and the twinkling starfield. The grid shader inverts the original CSS `perspective(85px) rotateX(8deg)` transform, so its geometry matches the old CSS grid.
- The JMAC logo is a 3D model built in code (`assets/js/retro-logo.js`, loaded with a dynamic import). It has extruded italic letters with an 80s chrome face shader and mirror-chrome bevels, neon `Line2` outlines, the swoosh, a striped disc and a starry haze. It animates: the haze churns and twinkles, comets of light chase round the ring, the bloom breathes in a rolling wave, and the letters and swoosh sway (leaning toward the cursor) with glints and sparkles, while the disc and haze stay still. It renders into its own render target, which the scene draws as a plane (plus a faint floor reflection). Its neon parts are blurred in a separate glow pass so the bloom never touches the grid. If the module or three's addons (`three/addons/` in the import map) fail to load, the scene falls back to drawing the PNG.
- The logo's position is still controlled by CSS: `.foreground-container .jmac-logo.original` is laid out normally and the scene draws into its bounding box (the 3D logo renders `LOGO_PADDING` larger so glow and sway don't clip). Once a WebGL frame is drawn, the `<img>` is hidden via `html.webgl` but stays clickable, and it acts as the no-WebGL fallback.
- On the landing page, clicking a letter knocks it off the logo (`hitTest`/`knock` in `retro-logo.js`). A copy of the letter is drawn in its own scene in `retro-scene.js`, not the logo's target, so it can leave the logo box, and bloomed with the logo's `createBloom`. While one is in play the logo also renders its letters and swoosh alone (layer 2, with the disc as a depth mask), and the scene draws that front layer and the logo's bloom back over the flying letter, so it passes in front of the disc but behind the other letters. `retro-scene.js` flies it out into the distance using the grid shader's own CSS-perspective maths, lands it flat (tipped back by the floor's foreshortening there and sheared to follow the grid's converging lines; true 3D perspective is unusable with the grid's 85px eye distance), lets it ride the grid and fades it out, while the logo orbits a replacement in over the top of the disc. On the landing page the logo's link is suppressed, since following it would only restart the intro.
- The portrait (`.jmac-scary`) is drawn and relit by the scene on the landing page. Its art is lit by just a pink key light and a blue fill, and `_tools/portrait-maps.py` unmixes the two into `assets/img/jmac-portrait-light.png` (R key, G fill, B relief, A alpha) and prints the light colours that rebuild the original (`KEY_COLOR`/`FILL_COLOR` in `retro-scene.js`). Only the key light is changed, so the light still comes from the left alone: the shader pulses it and flickers it now and then like a neon tube, and when the logo's glint sweeps (`logo3d.shine.progress`) the key turns violet as a cyan wash crosses from the logo, only where the key falls. The fill is left as it was. Like the logo, the `<img>` keeps the layout (and its opacity fade on content pages) and is the no-WebGL fallback; `html.webgl-portrait` hides it. Re-run the script if the portrait art changes (needs numpy, pillow, scipy).
- All other HTML (nav, tagline, `.main-pane` post panel) sits on top of the canvas
- Neon text effects (`.neon-text-cyan`, `.neon-text-pink`)
- CRT scanline overlay (`.scanlines`, CSS; drifts with a compositor-only transform)
- Bulma is pinned to its dark theme (`data-theme="dark"` on `<html>`) so text stays light regardless of the OS colour scheme
- Mobile layout (`max-width: 768px` in `_sass/_layout.scss`): content pages scroll as a normal document over the fixed canvas, with a small fixed logo under the nav
- Landing page includes tagline: "Singularity-ready Product Engineer"

### Content Organization

- Primary content category: `crash-twinsanity` (game development posts)
- Posts use `<!--more-->` as excerpt separator
- Permalinks configured as `/:title/` (no date in URL)
- The site uses excerpt_separator for post previews on listing pages

## Configuration Notes

- Theme: Minima (customized with retro overrides)
- Plugin: jekyll-feed for RSS
- URL: https://jmac.co
- Bulma body font size: 1.3rem (increased from default)
