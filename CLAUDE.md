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

### Isotube Subdirectory

The `/isotube/` directory contains a separate React-based YouTube playlist manager application. See `isotube/CLAUDE.md` for details.

```bash
cd isotube
npm run dev              # Start Vite dev server
npm run build:deploy     # Build and copy assets for GitHub Pages deployment
```

## Deployment Workflow

### Building Isotube for Production

When making changes to the isotube React app:

1. Navigate to isotube directory: `cd isotube`
2. Build and deploy: `npm run build:deploy`
   - Runs TypeScript type check
   - Builds optimized React bundle with Vite
   - Copies `dist/index.html` → `isotube/index.html`
   - Copies `dist/assets/` → `isotube/assets/`
3. Commit the built files: `git add isotube/index.html isotube/assets/`
4. Push to main branch

### Full Site Deployment

1. Build isotube if it has changes (see above)
2. Test Jekyll locally: `bundle exec jekyll serve`
   - Jekyll site: http://localhost:4000
   - Isotube: http://localhost:4000/isotube/
3. Commit all changes
4. Push to main branch
5. GitHub Pages automatically builds and deploys

### Important Notes

- **Built files are committed**: `isotube/index.html` and `isotube/assets/` must be committed to git
- **Source files are not built by GitHub**: GitHub Pages only serves the pre-built React files
- **Jekyll excludes source files**: The `_config.yml` excludes isotube's node_modules and src files from processing

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
