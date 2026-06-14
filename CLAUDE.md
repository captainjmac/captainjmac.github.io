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
- Gradient backgrounds with animated grid overlay (`.grid-container`)
- Neon text effects (`.neon-text-cyan`, `.neon-text-pink`)
- CRT scanline overlay (`.scanlines`)
- Twinkling starfield around the logo, rendered with PixiJS (`assets/js/starfield.js`; PixiJS v8 loaded from CDN in `head-retro.html`, canvas layered via `.starfield-container`)
- Custom logo with reflection effect (`/assets/img/jmac-kool-logo-1-transparent-sml.png`)
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
