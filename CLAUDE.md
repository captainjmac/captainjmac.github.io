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
- The logo's position is still controlled by CSS: `.foreground-container .jmac-logo.original` is laid out normally and the scene draws into its bounding box. Once a WebGL frame is drawn, the `<img>` is hidden via `html.webgl` but stays clickable, and it acts as the no-WebGL fallback.
- All HTML (nav, portrait, tagline, `.main-pane` post panel) sits on top of the canvas
- Neon text effects (`.neon-text-cyan`, `.neon-text-pink`)
- CRT scanline overlay (`.scanlines`, CSS; drifts with a compositor-only transform)
- Bulma is pinned to its dark theme (`data-theme="dark"` on `<html>`) so text stays light regardless of the OS colour scheme
- Mobile layout (`max-width: 768px` in `_sass/_layout.scss`): content pages scroll as a normal document over the fixed canvas, with a small fixed logo under the nav
- Landing page includes tagline: "Full-stack web developer • Fun-stacked game developer"

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
