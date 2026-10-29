
# Love Letters 💌

A minimalist 3D globe visualization showing flight routes between two people as digital art. Built with React, TypeScript, and Mapbox GL.

Love Letters Demo: https://love-letters-theta.vercel.app/

## ✨ Features

- **3D Interactive Globe**: Navigate with zoom, pan, and rotate
- **Stylized Flight Routes**: Luminous curved arcs with gradient colors
- **Artistic Visualization**: Deep black background with violet-cyan and magenta-blue gradients
- **Personal Journey Mapping**: Track flights between two people with different colored routes
- **Meetup Indicators**: Golden envelope icons mark special meeting places
- **Date Tooltips**: Hover over routes to see travel dates
- **Responsive Design**: Full-screen immersive experience

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Visualization**: Mapbox GL JS with globe projection
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Express.js + Node.js
- **Deployment**: Vercel-ready configuration

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Mapbox account (free tier available)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/klstack3/love-letters.git
   cd love-letters
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.production.example .env
   ```
   
   Get your Mapbox access token from [Mapbox Account Dashboard](https://account.mapbox.com/access-tokens/) and update `.env`:
   ```env
   MAPBOX_ACCESS_TOKEN=pk.your_actual_mapbox_token_here
   ADMIN_PASSWORD=pick-something-long
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5000` (admin page at `/admin`). Locally, publishing from the admin page writes `client/src/data/routes.json` directly unless `GITHUB_TOKEN` is set.

## 🚀 Deployment

### Deploy to Vercel

1. **Deploy with Vercel**
   - Visit [vercel.com](https://vercel.com) and import your GitHub repository
   - Set environment variables (see below)
   - Deploy automatically

2. **Or deploy via Vercel CLI**
   ```bash
   npx vercel --prod
   ```

### Environment variables

| Variable | Needed for | Notes |
|----------|-----------|-------|
| `MAPBOX_ACCESS_TOKEN` | The globe | Public `pk.` token |
| `ADMIN_PASSWORD` | `/admin` | Anyone with this can edit trips |
| `GITHUB_TOKEN` | Publishing from `/admin` | Fine-grained token with **Contents: Read and write** on this repo only |
| `GITHUB_REPO` | Optional | Defaults to `klstack3/love-letters` |
| `GITHUB_BRANCH` | Optional | Defaults to `main` |

## ✏️ Updating trips

### From the admin page (easiest)

Go to `/admin` on the live site, enter the admin password, then add, edit, or delete trips. Type any city — new places are looked up on the map automatically. Use **Preview** to see the globe, then **Publish**. Publishing commits `routes.json` to GitHub, and Vercel redeploys the site in about a minute.

### By editing the file

Trips live in `client/src/data/routes.json`, one per line:

```json
{
  "routes": [
    { "from": "London, UK", "to": "New York, NY, USA", "date": "October 2025", "person": "Y" }
  ],
  "people": {
    "Y": { "colors": ["#9caf88", "#b8c9a8"] }
  },
  "places": {
    "London, UK": [-0.1276, 51.5074],
    "New York, NY, USA": [-74.006, 40.7128]
  }
}
```

- `routes`: just names, a month, and who travelled. Name places as "City, Country" or "City, State, USA" (the stats panel reads countries and US states from the name).
- `people`: the line colors for each person.
- `places`: coordinates for each place name. If a route uses a place that isn't listed, the site looks it up on the map automatically — add it here (or publish from `/admin`) to pin exact coordinates.

## 🎨 Design Philosophy

Love Letters prioritizes aesthetic beauty over explicit communication:

- **Minimalist**: Clean, uncluttered interface
- **Artistic**: Focus on visual impact rather than concise data clarity  
- **Interactive**: Engaging 3D exploration experience

## 📱 Usage

- **Navigate**: Click and drag to rotate the globe
- **Zoom**: Scroll to zoom in/out
- **Explore**: Hover over routes to see travel dates
- **Discover**: Find golden envelope icons marking special meetups

## 🛠️ Customization

### Styling

- Colors defined in `design_guidelines.md`
- Tailwind classes in component files
- Globe styling in `GlobeVisualization.tsx`

## 📄 License

MIT License - feel free to use this for your own journey visualization!

## 🤝 Contributing

This is a personal art project, but suggestions and improvements are welcome via issues and pull requests.

---
