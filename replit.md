# Love Letters - 3D Globe Visualization

## Overview

Love Letters is a minimalist, artistic web application that visualizes flight routes between two people on an interactive 3D globe. The application emphasizes aesthetic beauty and emotional resonance over explicit functionality, presenting travel data as a poetic, visually captivating work of digital art. Users can explore curved flight paths with luminous gradients, origin points marked by glowing dots, and meetup locations indicated by golden envelope icons.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript and Vite for fast development and optimized builds.

**UI Component Library**: Shadcn/ui components built on Radix UI primitives, providing accessible, customizable components following the "new-york" style variant.

**Styling**: TailwindCSS with custom color palette defined for the visualization:
- Deep green (#00ffc3) and light pink (#ff4d94) for origin points
- Golden (#FFD700) for meetup indicators
- Gradient routes using violet-to-cyan and magenta-to-blue color transitions
- Dark mode enabled by default with deep black backgrounds

**State Management**: TanStack React Query for server state management, with client-side state handled through React hooks.

**Routing**: Wouter for lightweight client-side routing.

### Visualization Technology

**3D Globe Rendering**: Mapbox GL JS for WebGL-based 3D globe visualization, chosen for:
- Smooth rendering of curved great-circle routes
- Support for gradient materials on arc paths
- Interactive zoom, pan, and rotate capabilities
- Dark, customizable base maps

**Alternative Consideration**: Deck.gl with Maplibre was considered but Mapbox provides more straightforward gradient arc implementation.

**Route Data Structure**: JSON-based route definitions stored in `client/src/data/routes.json` containing:
- Origin and destination cities
- Coordinate pairs for route endpoints
- Gradient color arrays for visual styling
- Date metadata for tooltips
- Meetup boolean flag for special location markers
- Person identifier for tracking individual journeys

### Backend Architecture

**Server Framework**: Express.js running on Node.js with TypeScript.

**Purpose**: Minimal backend serving primarily as:
- Static file server for the built React application
- API endpoint provider for configuration (Mapbox access token)
- Development server with Vite middleware integration

**Development vs Production**:
- Development: Vite dev server middleware with HMR
- Production: Serves pre-built static assets from `dist/public`

### Data Layer

**Database ORM**: Drizzle ORM configured for PostgreSQL (via Neon serverless driver).

**Current Schema**: Minimal user authentication schema with username/password fields.

**Storage Strategy**: Dual-mode storage implementation:
- `MemStorage`: In-memory storage for development/demo
- Database-backed storage available when `DATABASE_URL` is configured

**Design Decision**: Route data is static JSON rather than database-stored, as the visualization is intended to be a fixed artistic piece rather than a dynamic user-generated content platform.

### Design System

**Visual Philosophy**: "Opaque in meaning, visually captivating" - prioritizing aesthetic beauty over explanatory UI elements.

**Typography**: Minimal text presence with only the "Love Letters" title in faint white, positioned unobtrusively in the bottom corner.

**Interaction Design**:
- No standard map UI chrome or controls beyond zoom/rotate
- Hover tooltips showing dates only
- Subtle animations: pulsing glows on origin points, shimmer on meetup icons, gradient motion along routes

**Component Architecture**: Atomic design with reusable UI components from Shadcn/ui, all customizable through the TailwindCSS theme system.

## External Dependencies

### Third-Party Services

**Mapbox GL JS**: Commercial mapping service requiring `MAPBOX_ACCESS_TOKEN` environment variable for:
- 3D globe rendering
- WebGL-based route visualization
- Custom dark styling support

### Major Libraries

**Deck.gl** (v9.2.2): Advanced WebGL visualization layers (installed but Mapbox is primary renderer).

**Radix UI**: Comprehensive suite of unstyled, accessible UI primitives for building the component system.

**TanStack React Query**: Data synchronization and server state management.

**Drizzle ORM**: Type-safe database toolkit with PostgreSQL dialect support.

**Neon Serverless**: PostgreSQL database driver optimized for serverless environments.

### Database

**PostgreSQL**: Primary database system (configured via Drizzle for potential future features).

**Provider**: Designed to work with Neon's serverless PostgreSQL offering, though any PostgreSQL instance is supported via `DATABASE_URL` environment variable.

### Development Tools

**TypeScript**: Full type safety across frontend and backend with strict mode enabled.

**Vite**: Build tool and development server with React plugin, runtime error overlay, and Replit-specific plugins (cartographer, dev banner).

**ESBuild**: Used for production server bundling with ESM output format.