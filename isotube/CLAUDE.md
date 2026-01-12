# Isotube

A YouTube playlist manager that lets you save, organize, and track progress on YouTube videos outside of the main youtube site to avoid distractions. Deployed to GitHub Pages at `/isotube/`.

## Tech Stack

- React 19 with functional components and hooks
- TypeScript (strict mode)
- Vite 7 for bundling
- Tailwind CSS v4 (via @tailwindcss/vite plugin)
- Radix UI primitives with shadcn/ui patterns
- ESLint for linting

## Commands

- `npm run dev` - Start dev server
- `npm run build` - Type check and build
- `npm run build:deploy` - Build and copy assets for GitHub Pages deployment
- `npm run lint` - Run ESLint

## Code Style

- 4-space indentation
- Single quotes for imports, double quotes in JSX attributes
- Functional components only (no class components)
- Named exports for components, default export for App
- Use `@/` path alias for imports from src/

## Project Structure

```
src/
├── components/
│   ├── common/         # Shared components and icons
│   ├── ui/             # shadcn/ui components (Radix wrappers)
│   ├── Player/         # YouTube player with custom controls
│   ├── Sidebar/        # Playlist navigation
│   ├── VideoList/      # Video cards and add form
│   └── VideoDetail/    # Video details and rating
├── hooks/              # Custom hooks (useYouTubePlayer, usePlaylists, etc.)
├── types/              # TypeScript interfaces (Video, Playlist, AppState)
├── utils/              # Helpers (youtube.ts for URL parsing)
└── lib/                # Utilities (cn() for class merging)
```

## Component Patterns

- Props interfaces defined inline or in the same file
- Use `forwardRef` when exposing imperative handles
- Callbacks wrapped in `useCallback` when passed as props
- State managed via Context (PlaylistsContext) with localStorage persistence

## Styling

- Tailwind utility classes directly in JSX
- Use `cn()` from `@/lib/utils` to merge conditional classes
- Dark theme by default (`.dark` class on root)
- shadcn/ui components in `src/components/ui/` - these are copied source, not dependencies

## YouTube Integration

- Embeds use YouTube IFrame API with controls disabled
- Custom progress bar and playback controls in Player component
- Video metadata fetched via oembed API (see `src/utils/youtube.ts`)

## Development vs Production

The project uses a template-based HTML generation system for seamless dev/prod workflows:

### HTML Template System
- `index.template.html` - Source template (tracked in git)
- `index.html` - Auto-generated file (gitignored, never committed)
- `scripts/generate-html.js` - Generation script
- Template placeholders: `{{VITE_ICON}}`, `{{VITE_HEAD}}`, `{{VITE_ENTRY}}`

The Vite config uses conditional base paths:
- **Development** (`npm run dev`): Uses `base: '/'` for local development at `http://localhost:5173/`
- **Production** (`npm run build`): Uses `base: '/isotube/'` for GitHub Pages deployment

### Development Workflow
```bash
cd isotube
npm run dev              # Auto-generates dev index.html, starts server
# Edit files in src/, changes reflect immediately
# No manual file management needed!
```

The `predev` hook automatically generates the dev `index.html` before starting the server.

### Production Build Workflow
```bash
cd isotube
npm run build:deploy     # Auto-generates template, builds, copies files
cd ..
git add isotube/index.template.html isotube/assets/  # Note: NOT index.html!
git commit -m "Update isotube"
git push
```

The `prebuild` hook automatically generates the template before building.

### Switching Between Dev and Production
No manual steps needed! The HTML is automatically regenerated when you run:
- `npm run dev` - Generates dev version
- `npm run build:deploy` - Generates and builds production version

The `index.html` file is never committed to git, so there's nothing to restore or switch.

## Deployment to GitHub Pages

Isotube is deployed as part of the parent Jekyll site at `/isotube/`.

**Build for deployment**:
```bash
npm run build:deploy
```

This creates production-optimized files at:
- `isotube/index.html` (copied from dist, with `/isotube/` paths)
- `isotube/assets/app.js` (main React bundle, ~1MB)
- `isotube/assets/index.css` (compiled Tailwind CSS, ~60KB)

**Important**: These built files must be committed to git for GitHub Pages to serve them.
