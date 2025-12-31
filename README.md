# Experiments Repository

Creative projects and modern web development experiments, currently featuring **Love Letters** - a beautiful 3D globe visualization.

## 🌟 Currently Experimenting With: Love Letters 💌

A minimalist, visually stunning 3D globe visualization showing flight routes between two people as digital art. Built with React, TypeScript, and Mapbox GL.

![Love Letters Demo](https://via.placeholder.com/800x400/000000/FFFFFF?text=Love+Letters+Globe+Visualization)

### ✨ Features

- **3D Interactive Globe**: Navigate with zoom, pan, and rotate
- **Beautiful Flight Routes**: Luminous curved arcs with gradient colors
- **Artistic Visualization**: Deep black background with violet-cyan and magenta-blue gradients
- **Personal Journey Mapping**: Track flights between two people with different colored routes
- **Meetup Indicators**: Golden envelope icons mark special meeting places
- **Date Tooltips**: Hover over routes to see travel dates
- **Responsive Design**: Full-screen immersive experience

### 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Visualization**: Mapbox GL JS with globe projection
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Express.js + Node.js
- **Deployment**: Vercel-ready configuration

### 🛠️ Getting Started

#### Prerequisites

- Node.js 18+
- npm or yarn
- Mapbox account (free tier available)

#### Local Development

1. **Clone the repository**

   ```bash
   git clone https://github.com/klstack3/experiments.git
   cd experiments
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

### 🚀 Deployment

#### Deploy to Vercel

1. **Deploy with Vercel**

   - Visit [vercel.com](https://vercel.com) and import your GitHub repository
   - Set environment variable: `MAPBOX_ACCESS_TOKEN=your_token_here`
   - Deploy automatically

2. **Or deploy via Vercel CLI**
   ```bash
   npx vercel --prod
   ```

### 🎨 Design Philosophy

Love Letters prioritizes aesthetic beauty over explicit communication:

- **Minimalist**: Clean, uncluttered interface
- **Artistic**: Focus on visual poetry rather than data clarity
- **Personal**: Intimate visualization of shared journeys
- **Interactive**: Engaging 3D exploration experience

---

## 🚀 Previous Projects

### Professional Headshot AI Generator

A React-based web application that transforms user photos into professional headshots using Google's Imagen 3 AI (Nano Banana). Users can choose from three professional styles and compare results side-by-side.

**Status**: Milestone 1 ✅ COMPLETE - Full React UI with TailwindCSS 3

#### 🎯 Features

- **Three Professional Styles**: Corporate Classic, Creative Professional, Executive Portrait
- **Drag-and-Drop Upload**: Easy image upload with validation
- **Side-by-Side Comparison**: Compare original vs generated headshots
- **Responsive Design**: Works perfectly on desktop and mobile
- **Step-by-Step Flow**: Intuitive 4-step user experience

#### 🛠️ Tech Stack

- **Frontend**: React 19, Vite 7, TailwindCSS 3
- **Backend**: Express.js (planned for Milestone 2)
- **AI**: Google Imagen 3 API (Nano Banana)
- **Icons**: Lucide React
- **File Handling**: React Dropzone

#### 🏃‍♂️ Quick Start

```bash
# Clone the repository
git clone https://github.com/klstack3/experiments.git
cd experiments

# Install frontend dependencies
cd frontend
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to see the app in action!

#### 🔗 Credits & Inspiration

This project is inspired by the excellent tutorial from Creator Economy:

- **Original Tutorial**: [Build an AI Headshot App with Google Nano Banana](https://creatoreconomy.so/p/full-tutorial-build-an-ai-headshot-app-with-google-nano-banana-in-15-minutes)

---

## 📝 License

MIT License - See individual project directories for specific details.

## 🤝 Contributing

This is a public coding portfolio showcasing various experiments and learning projects. Feel free to explore the code and suggest improvements!

---

_"Every route tells a story, every journey connects hearts across the globe."_
