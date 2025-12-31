# Love Letters 💌

A minimalist, visually stunning 3D globe visualization showing flight routes between two people as digital art. Built with React, TypeScript, and Mapbox GL.

![Love Letters Demo](https://via.placeholder.com/800x400/000000/FFFFFF?text=Love+Letters+Globe+Visualization)

## ✨ Features

- **3D Interactive Globe**: Navigate with zoom, pan, and rotate
- **Beautiful Flight Routes**: Luminous curved arcs with gradient colors
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
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3001`

## 🚀 Deployment

### Deploy to Vercel

1. **Deploy with Vercel**
   - Visit [vercel.com](https://vercel.com) and import your GitHub repository
   - Set environment variable: `MAPBOX_ACCESS_TOKEN=your_token_here`
   - Deploy automatically

2. **Or deploy via Vercel CLI**
   ```bash
   npx vercel --prod
   ```

## 📊 Data Structure

Routes are defined in `client/src/data/routes.json`:

```json
{
  "from": "London, UK",
  "to": "New York, NY, USA", 
  "coords": [[-0.1276, 51.5074], [-74.0060, 40.7128]],
  "color": ["#9caf88", "#b8c9a8"],
  "person": "Y",
  "date": "October 2025",
  "meetup": false
}
```

## 🎨 Design Philosophy

Love Letters prioritizes aesthetic beauty over explicit communication:

- **Minimalist**: Clean, uncluttered interface
- **Artistic**: Focus on visual poetry rather than data clarity  
- **Personal**: Intimate visualization of shared journeys
- **Interactive**: Engaging 3D exploration experience

## 📱 Usage

- **Navigate**: Click and drag to rotate the globe
- **Zoom**: Scroll to zoom in/out
- **Explore**: Hover over routes to see travel dates
- **Discover**: Find golden envelope icons marking special meetups

## 🛠️ Customization

### Adding New Routes

Edit `client/src/data/routes.json` to add your own travel data:

1. Get coordinates for your cities
2. Choose gradient colors
3. Set person identifier and travel date
4. Mark special meetups with `"meetup": true`

### Styling

- Colors defined in `design_guidelines.md`
- Tailwind classes in component files
- Globe styling in `GlobeVisualization.tsx`

## 📄 License

MIT License - feel free to use this for your own journey visualization!

## 🤝 Contributing

This is a personal art project, but suggestions and improvements are welcome via issues and pull requests.

---

*"Every route tells a story, every journey connects hearts across the globe."*
